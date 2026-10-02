"use client";

import { useState } from "react";

export function AuthForm({
  onDone,
  compact = false,
}: {
  onDone?: () => void;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not continue.");
      return;
    }
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {!compact && (
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            className={mode === "register" ? "text-ink" : "text-muted"}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
          <button
            type="button"
            className={mode === "login" ? "text-ink" : "text-muted"}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
        </div>
      )}
      <input
        required
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-ink/40"
      />
      <input
        required
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        placeholder={mode === "register" ? "Password (10+ characters)" : "Password"}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-ink/40"
      />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="bg-ink px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-50"
      >
        {busy ? "Working…" : mode === "register" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
