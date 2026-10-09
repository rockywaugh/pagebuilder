"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Nav } from "@/components/Nav";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
    if (params.get("created") === "1") {
      setNotice("Account created. Sign in with your new account.");
    }
  }, []);

  return (
    <div className="min-h-full">
      <Nav />
      <main className="mx-auto max-w-md px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Members</p>
        <h1 className="serif mt-3 text-4xl">Log in</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">Sign in with your PageBuilder account.</p>
        <div className="mt-8">
          <AuthForm
            initialMode="login"
            lockMode
            initialEmail={email}
            notice={notice}
            onDone={() => router.push("/account")}
          />
        </div>
      </main>
    </div>
  );
}
