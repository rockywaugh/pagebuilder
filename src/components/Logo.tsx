import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function Logo() {
  return (
    <Link href="/" className="display inline-flex items-baseline gap-0 text-lg">
      <svg viewBox="1.5 0.4 19.8 21.5" className="h-[0.95em] w-auto shrink-0" aria-hidden="true">
        <rect x="2.5" y="4.5" width="14" height="16.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M13.5 2.2H20" stroke="var(--clay)" strokeWidth="2" strokeLinecap="square" />
        <path d="M18.2 1.5V8" stroke="var(--clay)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      {APP_NAME}
    </Link>
  );
}
