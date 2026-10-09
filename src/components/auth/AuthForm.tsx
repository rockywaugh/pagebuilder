"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signupIssues } from "@/lib/password";
import { PasswordField } from "./PasswordField";

export function AuthForm({
  onDone,
  onVerified,
  initialMode = "register",
  lockMode = false,
  initialEmail = "",
  notice = "",
}: {
  onDone?: () => void;
  onVerified?: (email: string) => void;
  initialMode?: "register" | "login";
  lockMode?: boolean;
  initialEmail?: string;
  notice?: string;
}) {
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState(notice);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(true);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (notice) setMessage(notice);
  }, [notice]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors([]);

    if (step === "verify") {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await response.json()) as { error?: string; email?: string };
      setBusy(false);
      if (!response.ok) {
        setErrors([data.error || "Could not verify that code."]);
        return;
      }
      const verifiedEmail = data.email || email;
      if (onVerified) {
        onVerified(verifiedEmail);
        return;
      }
      setPassword("");
      setConfirm("");
      setCode("");
      setMode("login");
      setStep("form");
      setMessage("Account created. Sign in with your new account.");
      return;
    }

    if (mode === "register") {
      const issues = signupIssues({ email: email.trim().toLowerCase(), password, confirm });
      if (issues.length) {
        setBusy(false);
        setErrors(issues);
        return;
      }
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirm }),
      });
      const data = (await response.json()) as { error?: string; errors?: string[]; sent?: boolean };
      setBusy(false);
      if (!response.ok) {
        setErrors(data.errors?.length ? data.errors : [data.error || "Could not create the account."]);
        return;
      }
      setSent(data.sent !== false);
      setStep("verify");
      setMessage("");
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setErrors([data.error || "Could not sign in."]);
      return;
    }
    onDone?.();
  }

  async function resend() {
    if (busy) return;
    setBusy(true);
    setErrors([]);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, confirm }),
    });
    const data = (await response.json()) as { error?: string; errors?: string[]; sent?: boolean };
    setBusy(false);
    if (!response.ok) {
      setErrors(data.errors?.length ? data.errors : [data.error || "Could not send a new code."]);
      return;
    }
    setSent(data.sent !== false);
    setMessage("A new code is on its way.");
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4" noValidate>
      {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
      {lockMode && mode === "register" && step === "form" ? (
        <p className="text-sm leading-6 text-ink-soft">
          Choose a password, confirm it, then enter the code we send to your email. After that you sign in with the
          new account.
        </p>
      ) : null}
      {!lockMode && step === "form" ? (
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            className={mode === "register" ? "text-ink" : "text-muted"}
            onClick={() => {
              setMode("register");
              setErrors([]);
            }}
          >
            Create account
          </button>
          <button
            type="button"
            className={mode === "login" ? "text-ink" : "text-muted"}
            onClick={() => {
              setMode("login");
              setErrors([]);
            }}
          >
            Sign in
          </button>
        </div>
      ) : null}

      {step === "verify" ? (
        <>
          <p className="text-sm leading-6 text-ink-soft">
            Enter the 6-digit code sent to <span className="text-ink">{email}</span>. It expires in 15 minutes.
            {sent
              ? ""
              : " Email delivery is not configured on this server yet, so the code was saved locally instead of sent."}
          </p>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Verification code
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full border border-ink/15 bg-paper px-3 py-2 text-sm tracking-[0.3em] text-ink outline-none focus:border-ink/40"
              placeholder="000000"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="bg-ink px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-50"
          >
            {busy ? "Checking…" : "Confirm code"}
          </button>
          <button type="button" disabled={busy} onClick={() => void resend()} className="text-left text-sm text-muted">
            Resend code
          </button>
        </>
      ) : (
        <>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full border border-ink/15 bg-paper px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none focus:border-ink/40"
            />
          </label>
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "register" ? "At least 10 characters" : "Password"}
          />
          {mode === "register" ? (
            <>
              <PasswordField
                label="Confirm password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                placeholder="Enter the password again"
              />
              <ul className="space-y-1 text-xs leading-5 text-muted">
                <li>At least 10 characters</li>
                <li>An uppercase and a lowercase letter</li>
                <li>A number and a symbol</li>
              </ul>
            </>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="bg-ink px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-50"
          >
            {busy ? "Working…" : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </>
      )}

      {errors.length ? (
        <ul className="space-y-1 text-sm text-clay">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {lockMode && mode === "login" ? (
        <p className="text-sm text-muted">
          Need an account?{" "}
          <Link href="/signup" className="text-ink underline">
            Create one
          </Link>
        </p>
      ) : null}
      {lockMode && mode === "register" && step === "form" ? (
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline">
            Log in
          </Link>
        </p>
      ) : null}
    </form>
  );
}
