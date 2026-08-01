import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const VIEW_AS_COOKIE = "portal_view_as";
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

type Payload = {
  clientId: string;
  adminId: string;
  exp: number;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not configured");
  return s;
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encodeViewAsCookie(clientId: string, adminId: string) {
  const payload: Payload = {
    clientId,
    adminId,
    exp: Date.now() + TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeViewAsCookie(value: string | undefined | null): Payload | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
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

export async function setViewAsCookie(clientId: string, adminId: string) {
  const jar = await cookies();
  jar.set(VIEW_AS_COOKIE, encodeViewAsCookie(clientId, adminId), {
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
