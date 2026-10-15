import { randomInt } from "node:crypto";
import { hashPassword, hashVerificationCode } from "./auth";
import { sendVerificationCode } from "./mail";
import { signupIssues } from "./password";
import { cleanText, isValidEmail } from "./sanitize";
import { confirmPendingSignup, getUserByEmail, savePendingSignup } from "./users-db";

const CODE_TTL_MS = 15 * 60 * 1000;

export function newVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function beginSignup(input: { email?: string; password?: string; confirm?: string }) {
  const email = cleanText(input.email || "", 120).toLowerCase();
  const password = input.password || "";
  const confirm = input.confirm || "";
  const issues = signupIssues({ email, password, confirm });
  if (issues.length) return { ok: false as const, errors: issues };
  if (getUserByEmail(email)) {
    return { ok: false as const, errors: ["An account with that email already exists."] };
  }

  const code = newVerificationCode();
  const pending = savePendingSignup({
    email,
    passwordHash: await hashPassword(password),
    codeHash: hashVerificationCode(email, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (!pending.ok) return { ok: false as const, errors: [pending.error] };

  const delivery = await sendVerificationCode(email, code);
  return { ok: true as const, email, sent: delivery.sent };
}

export function confirmSignup(input: { email?: string; code?: string }) {
  const email = cleanText(input.email || "", 120).toLowerCase();
  const code = cleanText(input.code || "", 12).replace(/\s+/g, "");
  if (!isValidEmail(email)) return { ok: false as const, error: "Use a valid email address." };
  if (!/^\d{6}$/.test(code)) return { ok: false as const, error: "Enter the 6-digit code from your email." };
  if (getUserByEmail(email)) {
    return { ok: false as const, error: "An account with that email already exists. Log in." };
  }
  const result = confirmPendingSignup(email, hashVerificationCode(email, code));
  if (!result.ok) return result;
  return { ok: true as const, email };
}
