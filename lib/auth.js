import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tool_manager_session";

function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.API_SECRET || "development-session-secret";
}

function sign(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function createSessionToken(username) {
  const payload = JSON.stringify({
    username,
    issuedAt: Date.now(),
  });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;

  const [encoded, signature] = token.split(".");
  const expected = sign(encoded);

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.username || !payload.issuedAt) return null;

    const maxAgeMs = 1000 * 60 * 60 * 12;
    if (Date.now() - payload.issuedAt > maxAgeMs) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function isValidAdminLogin(username, password) {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return false;
  }

  return username === adminUsername && password === adminPassword;
}
