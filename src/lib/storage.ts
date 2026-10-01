import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isBlobConfigured } from "./env";

function isReadOnlyServerlessFs() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export async function storeFile(
  relativePath: string,
  data: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (isBlobConfigured()) {
    const blob = await put(relativePath, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (isReadOnlyServerlessFs()) {
    throw new Error(
      "File uploads require BLOB_READ_WRITE_TOKEN on Vercel. The serverless filesystem is read-only, so mkdir of /var/task/uploads fails.",
    );
  }

  const localDir = path.join(process.cwd(), "uploads");
  const fullPath = path.join(localDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return `/api/uploads/${relativePath}`;
}
