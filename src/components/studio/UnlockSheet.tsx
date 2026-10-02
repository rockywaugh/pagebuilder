"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { PRICES } from "@/lib/config";

export function UnlockSheet({
  open,
  onClose,
  signedIn,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  signedIn: boolean;
  onRefresh: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function pay(kind: "export" | "membership") {
    setBusy(true);
    setError("");
    const live = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const liveData = await live.json();
    if (live.ok && liveData.url) {
      window.location.href = liveData.url;
      return;
    }
    if (live.status === 401) {
      setError("Create an account first.");
      setBusy(false);
      return;
    }
    const demo = await fetch("/api/checkout/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const demoData = await demo.json();
    setBusy(false);
    if (!demo.ok) {
      setError(demoData.error || liveData.error || "Checkout failed.");
      return;
    }
    onRefresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 p-4 md:items-center">
      <div className="w-full max-w-md border border-ink/10 bg-paper p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Unlock</p>
            <h2 className="serif mt-2 text-3xl">Take the files</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            Close
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          The preview on the right is a printed image. HTML is generated on the server only after you pay.
        </p>
        {!signedIn ? (
          <div className="mt-5">
            <AuthForm onDone={onRefresh} />
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void pay("export")}
              className="bg-ink px-4 py-3 text-left text-sm text-[var(--paper)]"
            >
              One-time page files · ${PRICES.exportUsd}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void pay("membership")}
              className="border border-ink/15 px-4 py-3 text-left text-sm"
            >
              Membership · ${PRICES.membershipUsd}/mo for up to 4 pages
            </button>
          </div>
        )}
        {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
      </div>
    </div>
  );
}
