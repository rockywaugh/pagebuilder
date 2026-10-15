import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { newId } from "./sanitize";

const OUTBOX = path.join(process.cwd(), "data", "outbox");

export async function sendVerificationCode(email: string, code: string) {
  const subject = "Your PageBuilder verification code";
  const text = [
    `Your PageBuilder sign-up code is ${code}.`,
    "It expires in 15 minutes.",
    "",
    "If you did not create an account, you can ignore this email.",
  ].join("\n");

  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "PageBuilder <noreply@localhost>";
  if (key) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text,
      }),
    }).catch(() => null);
    if (response?.ok) return { sent: true };
  }

  await mkdir(OUTBOX, { recursive: true });
  await writeFile(
    path.join(OUTBOX, `${newId("verify")}.txt`),
    [`To: ${email}`, `Subject: ${subject}`, "", text].join("\n"),
  );
  return { sent: false };
}
