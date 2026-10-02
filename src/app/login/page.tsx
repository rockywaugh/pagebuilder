"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Nav } from "@/components/Nav";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="min-h-full">
      <Nav />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="serif text-4xl">Account</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Required before we can deliver files or start a membership.
        </p>
        <div className="mt-8">
          <AuthForm onDone={() => router.push("/account")} />
        </div>
      </main>
    </div>
  );
}
