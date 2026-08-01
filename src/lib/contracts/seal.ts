import crypto from "crypto";
import forge from "node-forge";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import { plainAddPlaceholder } from "@signpdf/placeholder-plain";
import { SUBFILTER_ETSI_CADES_DETACHED } from "@signpdf/utils";

const PLATFORM_SIGNER_CN = "Ryan Tang Agreement Signing";
const MIN_P12_BYTES = 256;

let cachedCert: { p12Buffer: Buffer; passphrase: string; cn: string } | null = null;

function decodeP12Base64(raw: string) {
  const cleaned = String(raw || "")
    .trim()
    .replace(/^data:[^;]+;base64,/i, "")
    .replace(/\s+/g, "");
  if (!cleaned) throw new Error("AGREEMENT_SIGNING_P12_BASE64 is empty.");
  const p12Buffer = Buffer.from(cleaned, "base64");
  if (p12Buffer.length < MIN_P12_BYTES) {
    throw new Error("AGREEMENT_SIGNING_P12_BASE64 looks truncated.");
  }
  return p12Buffer;
}

function parseP12(p12Buffer: Buffer, passphrase: string) {
  const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString("binary"));
  return forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);
}

function extractSignerCn(p12Buffer: Buffer, passphrase: string) {
  const p12 = parseP12(p12Buffer, passphrase);
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert;
  return cert?.subject?.getField("CN")?.value || null;
}

export function signingEnabled() {
  if (String(process.env.AGREEMENT_SIGNING_ENABLED || "").toLowerCase() !== "true") {
    return false;
  }
  try {
    loadSigningCertificate();
    return true;
  } catch (err) {
    console.warn("[Agreements] signing cert not loaded:", err);
    return false;
  }
}

export function loadSigningCertificate() {
  if (cachedCert) return cachedCert;
  const passphrase = String(process.env.AGREEMENT_SIGNING_P12_PASSPHRASE ?? "");
  const p12Buffer = decodeP12Base64(process.env.AGREEMENT_SIGNING_P12_BASE64 || "");
  parseP12(p12Buffer, passphrase);
  cachedCert = {
    p12Buffer,
    passphrase,
    cn: extractSignerCn(p12Buffer, passphrase) || PLATFORM_SIGNER_CN,
  };
  return cachedCert;
}

export async function sealAgreementPdf(pdfBuffer: Buffer): Promise<Buffer> {
  const { p12Buffer, passphrase, cn } = loadSigningCertificate();
  const withPlaceholder = plainAddPlaceholder({
    pdfBuffer,
    reason: "Service agreement electronic signature",
    contactInfo: "hello@ryantang.site",
    name: cn,
    location: "United States",
    subFilter: SUBFILTER_ETSI_CADES_DETACHED,
  });
  const signer = new P12Signer(p12Buffer, { passphrase });
  return Buffer.from(await new SignPdf().sign(withPlaceholder, signer));
}

export function hashPdfBuffer(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function getPlatformSignerCn() {
  try {
    return loadSigningCertificate().cn;
  } catch {
    return PLATFORM_SIGNER_CN;
  }
}
