import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Nav({ tone = "paper" }: { tone?: "paper" | "stage" }) {
  const light = tone === "paper";
  return (
    <header
      className={`flex items-center justify-between gap-3 px-6 py-4 text-sm ${
        light ? "text-ink" : "text-[var(--paper)]"
      }`}
    >
      <Logo />
      <nav className="flex items-center gap-3 sm:gap-5">
        <ThemeToggle />
        <Link href="/studio" className="hover:opacity-70">
          Studio
        </Link>
        <Link href="/pricing" className="hidden hover:opacity-70 sm:inline">
          Pricing
        </Link>
        <Link href="/login" className="hover:opacity-70">
          Log in
        </Link>
        <Link href="/signup" className="hidden hover:opacity-70 sm:inline">
          Sign up
        </Link>
        <Link href="/account" className="hover:opacity-70">
          Account
        </Link>
      </nav>
    </header>
  );
}
