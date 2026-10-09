import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload, UserRecord } from "./types";
import { findUserById } from "./store";

const scrypt = promisify(scryptCb);
const COOKIE = "pagebuilder_session";

function secretKey() {
  const raw = process.env.SESSION_SECRET || "pagebuilder-dev-secret-change-me-32bytes!!";
  return new TextEncoder().encode(raw);
}

export function hashVerificationCode(email: string, code: string) {
  return createHmac("sha256", secretKey()).update(`${email}:${code}`).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.guestId !== "string") {
      return null;
    }
    if (typeof payload.projectId !== "string") return null;
    return {
      sub: payload.sub,
      guestId: payload.guestId,
      projectId: payload.projectId,
      email: typeof payload.email === "string" ? payload.email : undefined,
      resumeToken: typeof payload.resumeToken === "string" ? payload.resumeToken : undefined,
    };
  } catch {
    return null;
  }
}

export async function writeSession(payload: SessionPayload) {
  const jar = await cookies();
  const token = await signSession(payload);
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<UserRecord | null> {
  const session = await readSession();
  if (!session || session.sub.startsWith("guest_")) return null;
  return findUserById(session.sub);
}

export function fingerprintGuest(): string {
  return `guest_${createHash("sha256").update(randomBytes(16)).digest("hex").slice(0, 16)}`;
}

export function isRegistered(session: SessionPayload | null): boolean {
  return !!session && !session.sub.startsWith("guest_");
}
