import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PRICES } from "@/lib/config";

export default function PricingPage() {
  return (
    <div className="min-h-full">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Pricing</p>
        <h1 className="serif mt-3 text-5xl">Pay for the files, not the conversation</h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Composing the first page is free. HTML is generated on the server only after you unlock it.
          Login on the page is a member feature. Deploy is a ${PRICES.deployUsd}/month add-on for up to two
          live pages. Hosted login remains a small extra.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <article className="border border-ink/10 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Files</p>
            <h2 className="serif mt-2 text-3xl">${PRICES.exportUsd}</h2>
            <p className="mt-1 text-sm text-muted">One time, this page</p>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              <li>Account required</li>
              <li>Self-contained HTML download</li>
              <li>Your photos inlined</li>
            </ul>
          </article>
          <article className="border border-ink/10 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Membership</p>
            <h2 className="serif mt-2 text-3xl">${PRICES.membershipUsd}/mo</h2>
            <p className="mt-1 text-sm text-muted">Account required</p>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              <li>Your Pages for finished templates</li>
              <li>Up to 4 pages</li>
              <li>Login page included in the files</li>
              <li>One live deploy at a time</li>
              <li>Export included</li>
            </ul>
          </article>
          <article className="border border-ink/10 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Deploy</p>
            <h2 className="serif mt-2 text-3xl">${PRICES.deployUsd}/mo</h2>
            <p className="mt-1 text-sm text-muted">On top of membership</p>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              <li>Keep up to two pages live</li>
              <li>Each URL includes a unique page id</li>
              <li>Switch or update deploys from Your Pages</li>
            </ul>
          </article>
          <article className="border border-ink/10 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Hosted login</p>
            <h2 className="serif mt-2 text-3xl">${PRICES.hostedLoginUsd}/mo</h2>
            <p className="mt-1 text-sm text-muted">On top of membership</p>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              <li>PageBuilder runs the login page</li>
              <li>Live at /your-page and /your-page/login</li>
              <li>Same login layout, themed to your page</li>
              <li>Site must be deployed on PageBuilder</li>
            </ul>
          </article>
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-6 text-ink-soft">
          A web-savvy visitor can still recreate a simple layout from a screenshot. PageBuilder does not put
          the working page in the browser as HTML, so View Source and element inspection do not yield
          the deliverable. That is the honest limit of front-facing protection.
        </p>
        <Link href="/studio" className="mt-8 inline-block bg-ink px-5 py-3 text-sm text-[var(--paper)]">
          Open the studio
        </Link>
      </main>
    </div>
  );
}
