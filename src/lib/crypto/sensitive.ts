import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const MAGIC = Buffer.from("SNv1");

export type EncryptedPayload = {
  enc: true;
  v: 1;
  iv: string;
  tag: string;
  data: string;
  meta?: { filename?: string; loginEntryCount?: number };
};

function encryptionKey() {
  const secret = process.env.SENSITIVE_ANSWERS_KEY || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Set SENSITIVE_ANSWERS_KEY (or AUTH_SECRET) to encrypt questionnaire secrets");
  }
  return createHash("sha256").update(secret).digest();
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.enc === true && v.v === 1 && typeof v.iv === "string" && typeof v.data === "string";
}

export function encryptJson(
  value: unknown,
  meta?: { filename?: string; loginEntryCount?: number },
): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const payload: EncryptedPayload = {
    enc: true,
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
  if (meta?.filename || meta?.loginEntryCount) {
    payload.meta = {
      ...(meta.filename ? { filename: meta.filename } : {}),
      ...(meta.loginEntryCount ? { loginEntryCount: meta.loginEntryCount } : {}),
    };
  }
  return payload;
}

export function decryptJson<T = unknown>(payload: EncryptedPayload): T {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const json = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(json) as T;
}

export function encryptBytes(data: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, encrypted]);
}

export function decryptBytes(data: Buffer): Buffer {
  if (data.length < 4 + 12 + 16 || !data.subarray(0, 4).equals(MAGIC)) {
    throw new Error("Not an encrypted file");
  }
  const iv = data.subarray(4, 16);
  const tag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function filenameFromValue(value: unknown): string | undefined {
  if (isEncryptedPayload(value)) return value.meta?.filename;
  if (value && typeof value === "object" && "filename" in value) {
    const name = (value as { filename?: unknown }).filename;
    return typeof name === "string" ? name : undefined;
  }
  return undefined;
}
