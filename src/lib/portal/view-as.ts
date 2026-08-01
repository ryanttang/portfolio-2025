import { cookies } from "next/headers";

export const VIEW_AS_COOKIE = "portal_view_as";
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export type ViewAsPayload = {
  clientId: string;
  adminId: string;
  exp: number;
  /** When set, Exit returns to this project editor instead of CRM. */
  returnOnboardingId?: string;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not configured");
  return s;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  // btoa is available in Edge and Node 18+
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(body: string) {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return toBase64Url(sig);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function encodeViewAsCookie(
  clientId: string,
  adminId: string,
  opts?: { returnOnboardingId?: string },
) {
  const payload: ViewAsPayload = {
    clientId,
    adminId,
    exp: Date.now() + TTL_MS,
    ...(opts?.returnOnboardingId ? { returnOnboardingId: opts.returnOnboardingId } : {}),
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await sign(body);
  return `${body}.${sig}`;
}

export async function decodeViewAsCookie(
  value: string | undefined | null,
): Promise<ViewAsPayload | null> {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  try {
    const expected = await sign(body);
    if (!timingSafeEqual(sig, expected)) return null;
    const json = new TextDecoder().decode(fromBase64Url(body));
    const payload = JSON.parse(json) as ViewAsPayload;
    if (!payload.clientId || !payload.adminId || !payload.exp) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getViewAsPayload() {
  const jar = await cookies();
  return decodeViewAsCookie(jar.get(VIEW_AS_COOKIE)?.value);
}

export async function setViewAsCookie(
  clientId: string,
  adminId: string,
  opts?: { returnOnboardingId?: string },
) {
  const jar = await cookies();
  jar.set(VIEW_AS_COOKIE, await encodeViewAsCookie(clientId, adminId, opts), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function clearViewAsCookie() {
  const jar = await cookies();
  jar.delete(VIEW_AS_COOKIE);
}
