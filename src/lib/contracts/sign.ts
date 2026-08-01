import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { contractSignatures, contracts } from "@/db/schema";
import { buildAgreementPdfBuffer } from "./pdf";
import {
  getPlatformSignerCn,
  hashPdfBuffer,
  sealAgreementPdf,
  signingEnabled,
} from "./seal";
import { storeFile } from "@/lib/storage";
import { addActivity } from "@/lib/crm/clients";
import { getClient } from "@/lib/crm/clients";

export const ESIGN_CONSENT_VERSION = "2026-01";

export const ESIGN_CONSENT_DISCLOSURE = `By checking the box below and applying your signature, you agree to electronically sign this agreement. Your electronic signature is intended to be the legal equivalent of your handwritten signature. You consent to receive this agreement and related records electronically.`;

const MAX_SIGNATURE_BYTES = 500 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function decodePngBase64(base64: string) {
  const data = String(base64 || "")
    .trim()
    .replace(/^data:image\/png;base64,/i, "");
  const buffer = Buffer.from(data, "base64");
  if (!buffer.length) throw new Error("Invalid signature image.");
  if (buffer.length > MAX_SIGNATURE_BYTES) throw new Error("Signature image is too large.");
  if (
    buffer.length < PNG_MAGIC.length ||
    !buffer.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)
  ) {
    throw new Error("Signature must be a PNG image.");
  }
  return buffer;
}

export async function prepareSigningSession(contractId: string) {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, contractId))
    .limit(1);
  if (!contract) throw new Error("Contract not found");
  if (contract.status === "void") throw new Error("Contract is void");
  if (contract.status === "signed") throw new Error("Contract already signed");

  const client = await getClient(contract.clientId);
  const externalId = randomBytes(16).toString("hex");

  const [sig] = await db
    .insert(contractSignatures)
    .values({
      contractId: contract.id,
      externalId,
      status: "pending",
      signerName: client?.name || null,
      signerEmail: client?.email || null,
    })
    .returning();

  return {
    enabled: true,
    ready: true,
    external_id: sig.externalId,
    title: contract.title,
    body_text: contract.bodyText,
    esign_consent_version: ESIGN_CONSENT_VERSION,
    signer_name: client?.name || "",
    signer_email: client?.email || "",
  };
}

export async function getSessionByToken(token: string) {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.token, token))
    .limit(1);
  if (!contract) return null;
  if (contract.status === "void") return { contract, session: null, error: "void" as const };
  if (contract.status === "signed") {
    return { contract, session: null, error: "already_signed" as const };
  }

  // reuse latest pending or create
  const [existing] = await db
    .select()
    .from(contractSignatures)
    .where(eq(contractSignatures.contractId, contract.id))
    .limit(1);

  if (existing?.status === "completed") {
    return { contract, session: null, error: "already_signed" as const };
  }

  if (existing?.status === "pending") {
    const client = await getClient(contract.clientId);
    return {
      contract,
      session: {
        enabled: true,
        ready: true,
        external_id: existing.externalId,
        title: contract.title,
        body_text: contract.bodyText,
        esign_consent_version: ESIGN_CONSENT_VERSION,
        signer_name: client?.name || existing.signerName || "",
        signer_email: client?.email || existing.signerEmail || "",
      },
      error: null,
    };
  }

  const session = await prepareSigningSession(contract.id);
  return { contract, session, error: null };
}

export async function signAgreement(args: {
  externalId: string;
  consent: boolean;
  signatureMethod: "draw" | "type";
  signaturePngBase64?: string;
  typedSignature?: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const { externalId, consent, signatureMethod } = args;
  if (!consent) throw new Error("Electronic signature consent is required.");

  const [row] = await db
    .select()
    .from(contractSignatures)
    .where(eq(contractSignatures.externalId, externalId))
    .limit(1);
  if (!row) throw new Error("Signature session not found");
  if (row.status === "completed") {
    return {
      status: "completed" as const,
      external_id: externalId,
      pdf_sha256: row.pdfSha256,
      signed_pdf_url: row.signedPdfUrl,
    };
  }

  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, row.contractId))
    .limit(1);
  if (!contract) throw new Error("Contract not found");

  let signatureImageBuffer: Buffer | null = null;
  let typedSignatureText: string | null = null;
  if (signatureMethod === "draw") {
    signatureImageBuffer = decodePngBase64(args.signaturePngBase64 || "");
  } else {
    typedSignatureText = String(args.typedSignature || "").trim();
    if (typedSignatureText.length < 2) throw new Error("Typed signature is too short.");
  }

  const signedAt = new Date();
  let pdfBuffer = await buildAgreementPdfBuffer({
    title: contract.title,
    bodyText: contract.bodyText,
    signerName: row.signerName || undefined,
    signerEmail: row.signerEmail || undefined,
    signedAt,
    externalId,
    signatureImageBuffer,
    typedSignatureText,
  });

  if (signingEnabled()) {
    pdfBuffer = await sealAgreementPdf(pdfBuffer);
  }

  const pdfSha256 = hashPdfBuffer(pdfBuffer);
  const signedPdfUrl = await storeFile(
    `contracts/${contract.id}/${externalId}.pdf`,
    pdfBuffer,
    "application/pdf",
  );

  const audit = {
    external_id: externalId,
    contract_id: contract.id,
    signer_name: row.signerName,
    signer_email: row.signerEmail,
    signed_at: signedAt.toISOString(),
    esign_consent_version: ESIGN_CONSENT_VERSION,
    signature_method: signatureMethod,
    pdf_sha256: pdfSha256,
    platform_signer_cn: getPlatformSignerCn(),
    sealed: signingEnabled(),
  };

  await db
    .update(contractSignatures)
    .set({
      status: "completed",
      signatureMethod,
      esignConsentVersion: ESIGN_CONSENT_VERSION,
      esignConsentedAt: signedAt,
      pdfSha256,
      signedPdfUrl,
      auditJson: audit,
      signerIp: args.ip || null,
      signerUserAgent: args.userAgent || null,
      completedAt: signedAt,
    })
    .where(eq(contractSignatures.id, row.id));

  await db
    .update(contracts)
    .set({ status: "signed", signedAt, updatedAt: signedAt })
    .where(eq(contracts.id, contract.id));

  await addActivity(contract.clientId, "contract", `Signed: ${contract.title}`, contract.id);

  return {
    status: "completed" as const,
    external_id: externalId,
    pdf_sha256: pdfSha256,
    signed_pdf_url: signedPdfUrl,
  };
}

export { signingEnabled };
