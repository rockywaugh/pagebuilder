"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Nav } from "@/components/Nav";

export default function SignupPage() {
  const router = useRouter();
  return (
    <div className="min-h-full">
      <Nav />
      <main className="mx-auto max-w-md px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Members</p>
        <h1 className="serif mt-3 text-4xl">Create a PageBuilder account</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Required for login features, membership, hosted login, and deploy.
        </p>
        <div className="mt-8">
          <AuthForm onDone={() => router.push("/studio")} />
        </div>
      </main>
    </div>
  );
}
