import { eq } from "drizzle-orm";
import { db } from "@/db";
import { onboardings } from "@/db/schema";
import { decryptJson, encryptJson, isEncryptedPayload } from "@/lib/crypto/sensitive";

export type ProjectInfo = {
  projectUrl: string;
  clientLoginUrl: string;
  clientUsername: string;
  clientPassword: string;
};

export function emptyProjectInfo(): ProjectInfo {
  return {
    projectUrl: "",
    clientLoginUrl: "",
    clientUsername: "",
    clientPassword: "",
  };
}

export function projectInfoIsEmpty(info: ProjectInfo) {
  return !(
    info.projectUrl.trim() ||
    info.clientLoginUrl.trim() ||
    info.clientUsername.trim() ||
    info.clientPassword
  );
}

export function readProjectInfo(row: {
  projectUrl?: string | null;
  clientLoginUrl?: string | null;
  clientUsername?: string | null;
  clientPasswordEnc?: unknown;
}): ProjectInfo {
  let clientPassword = "";
  if (isEncryptedPayload(row.clientPasswordEnc)) {
    try {
      const decrypted = decryptJson<unknown>(row.clientPasswordEnc);
      clientPassword = typeof decrypted === "string" ? decrypted : "";
    } catch {
      clientPassword = "";
    }
  }

  return {
    projectUrl: row.projectUrl || "",
    clientLoginUrl: row.clientLoginUrl || "",
    clientUsername: row.clientUsername || "",
    clientPassword,
  };
}

export async function saveProjectInfo(onboardingId: string, info: ProjectInfo) {
  const password = info.clientPassword;
  const [row] = await db
    .update(onboardings)
    .set({
      projectUrl: info.projectUrl.trim() || null,
      clientLoginUrl: info.clientLoginUrl.trim() || null,
      clientUsername: info.clientUsername.trim() || null,
      clientPasswordEnc: password ? encryptJson(password) : null,
      updatedAt: new Date(),
    })
    .where(eq(onboardings.id, onboardingId))
    .returning();
  return row;
}
