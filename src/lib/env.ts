export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function isSigningConfigured() {
  return (
    String(process.env.AGREEMENT_SIGNING_ENABLED || "").toLowerCase() === "true" &&
    Boolean(process.env.AGREEMENT_SIGNING_P12_BASE64)
  );
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isPayPalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function isBlobConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_STORE_ID?.trim(),
  );
}

/** Vercel/Lambda: never write to disk; Blob SDK uses OIDC or BLOB_READ_WRITE_TOKEN. */
export function isServerlessDeploy() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}
