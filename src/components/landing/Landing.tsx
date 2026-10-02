import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PRICES } from "@/lib/config";

export function Landing() {
  return (
    <div className="min-h-full">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="grid gap-12 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">A page, composed in conversation</p>
            <h1 className="display mt-5 max-w-xl text-5xl leading-[1.05] md:text-6xl">
              Tell us what the page is. We print the preview.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-7 text-ink-soft">
              The left side asks simple questions. The right side shows a picture of the page — not HTML you can
              inspect. The first page is free to compose. The files arrive after a one-time payment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/studio"
                className="bg-ink px-5 py-3 text-sm text-[var(--paper)] hover:bg-ink-soft"
              >
                Start the first page free
              </Link>
              <Link href="/pricing" className="border border-ink/15 px-5 py-3 text-sm hover:bg-paper-2">
                See pricing
              </Link>
            </div>
          </div>
          <aside className="border border-ink/10 bg-paper-2 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">The press</p>
            <div className="mt-4 grid grid-cols-2 gap-px bg-ink/10">
              <div className="bg-paper p-4">
                <p className="text-xs text-muted">Left</p>
                <p className="display mt-2 text-2xl">Prompts</p>
                <p className="mt-2 text-sm text-ink-soft">Purpose, name, mood, photos.</p>
              </div>
              <div className="bg-stage p-4 text-[var(--paper)]">
                <p className="text-xs text-[var(--paper)]/50">Right</p>
                <p className="display mt-2 text-2xl">Print</p>
                <p className="mt-2 text-sm text-[var(--paper)]/70">A PNG of the page. No DOM.</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-10 border-t border-ink/10 py-16 md:grid-cols-3">
          <div>
            <h2 className="display text-2xl">Guided, not dumped</h2>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              You answer one question at a time. Drop JPEG, PNG, or WebP photos. Ask for backgrounds, header
              styles, and palettes from a vetted library — not a raw crawl of the web.
            </p>
          </div>
          <div>
            <h2 className="display text-2xl">Photos with rules</h2>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              Files are checked for type, size, dimensions, sharpness, and decency. SVG and GIF are refused.
              Metadata is stripped. Examples are filtered the same way.
            </p>
          </div>
          <div>
            <h2 className="display text-2xl">Source stays on the press</h2>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              A determined person can always recreate a simple page from a picture. What we stop is View Source,
              DevTools DOM, and “give me the HTML” before you pay. The live preview is a server-printed image.
            </p>
          </div>
        </section>

        <section className="border-t border-ink/10 py-16">
          <h2 className="display text-3xl">Two phases</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="border border-ink/10 p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Phase 1</p>
              <h3 className="display mt-2 text-2xl">Compose free, take files once</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Build the first page at no charge. Create an account and pay ${PRICES.exportUsd} once to download
                a self-contained HTML file.
              </p>
            </article>
            <article className="border border-ink/10 p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Phase 2</p>
              <h3 className="display mt-2 text-2xl">Membership to keep going</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                ${PRICES.membershipUsd}/month unlocks Your Pages and up to four templates. Deploy is a separate
                ${PRICES.deployUsd}/month add-on for up to two live URLs.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
