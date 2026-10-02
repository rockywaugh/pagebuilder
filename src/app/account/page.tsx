"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";

type PageRow = { id: string; name: string; updatedAt: string; exportUnlocked: boolean };

type Account = {
  user: {
    email: string;
    membership: boolean;
    membershipUntil: string | null;
    hostedLogin?: boolean;
    deployPlan?: boolean;
  } | null;
  pages: PageRow[];
  project: { entitlements: { exportUnlocked: boolean; membership: boolean; hostedLogin?: boolean } };
};

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    const response = await fetch("/api/me");
    setAccount(await response.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function anotherPage() {
    const response = await fetch("/api/pages", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setNote(data.error || "Could not start another page.");
      return;
    }
    window.location.href = "/studio";
  }

  async function publish() {
    const response = await fetch("/api/deploy", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setNote(data.error || "Publish requires a membership.");
      return;
    }
      setNote(`Published at ${data.url}${data.loginUrl ? ` · login ${data.loginUrl}` : ""}`);
  }

  async function openPage(id: string) {
    await fetch("/api/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    window.location.href = "/studio";
  }

  return (
    <div className="min-h-full">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="serif text-4xl">Account</h1>
        {!account?.user ? (
          <p className="mt-4 text-sm text-ink-soft">
            You are composing as a guest.{" "}
            <Link href="/login" className="underline">
              Create an account
            </Link>{" "}
            to unlock files.
          </p>
        ) : (
          <div className="mt-4 text-sm text-ink-soft">
            <p>{account.user.email}</p>
            <p className="mt-1">
              {account.user.membership
                ? `Membership active${account.user.membershipUntil ? ` until ${new Date(account.user.membershipUntil).toLocaleDateString()}` : ""}`
                : "No membership — first page only"}
              {account.user.hostedLogin ? " · hosted login" : ""}
              {account.user.deployPlan ? " · two-page deploy" : ""}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/studio" className="bg-ink px-4 py-2 text-sm text-[var(--paper)]">
            Back to studio
          </Link>
          {account?.project.entitlements.exportUnlocked ? (
            <a href="/api/export" className="border border-ink/15 px-4 py-2 text-sm">
              Download current page
            </a>
          ) : null}
          <button type="button" onClick={() => void anotherPage()} className="border border-ink/15 px-4 py-2 text-sm">
            New page
          </button>
          <button type="button" onClick={() => void publish()} className="border border-ink/15 px-4 py-2 text-sm">
            Publish
          </button>
          {account?.user ? (
            <button type="button" onClick={() => void logout()} className="px-4 py-2 text-sm text-muted">
              Sign out
            </button>
          ) : null}
        </div>

        {note ? <p className="mt-4 text-sm text-clay">{note}</p> : null}

        <h2 className="serif mt-12 text-2xl">Pages</h2>
        <ul className="mt-4 divide-y divide-ink/10 border border-ink/10">
          {(account?.pages || []).map((page) => (
            <li key={page.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{page.name}</span>
              <button type="button" className="text-muted" onClick={() => void openPage(page.id)}>
                Open
              </button>
            </li>
          ))}
          {!account?.pages?.length ? (
            <li className="px-4 py-3 text-sm text-muted">The page you are composing lives in the studio.</li>
          ) : null}
        </ul>
      </main>
    </div>
  );
}
