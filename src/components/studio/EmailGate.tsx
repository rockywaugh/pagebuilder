"use client";

import { useState, type FormEvent } from "react";
import { LIMITS } from "@/lib/config";

export function EmailGate({
  onReady,
}: {
  onReady: () => Promise<void> | void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/guest/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not start with that email.");
      return;
    }
    await onReady();
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-lg">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Before you begin</p>
        <h1 className="serif mt-4 text-4xl leading-[1.1] sm:text-5xl">Leave an email to compose a page</h1>
        <p className="mt-5 text-sm leading-6 text-ink-soft">
          The first page is free. We email you a private link when it is finished so you can come back,
          view it, and create an account. Guest pages and that link are removed after {LIMITS.guestTtlDays}{" "}
          days. A membership unlocks Your Pages and up to {LIMITS.pageLimit} templates.
        </p>
        <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink"
              placeholder="you@studio.com"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="bg-ink px-4 py-2.5 text-sm text-[var(--paper)] disabled:opacity-40"
          >
            {busy ? "Saving…" : "Continue"}
          </button>
        </form>
        {error ? <p className="mt-4 text-sm text-clay">{error}</p> : null}
      </div>
    </div>
  );
}
