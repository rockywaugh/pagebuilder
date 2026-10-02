"use client";

function EmptyPageHolder() {
  return (
    <div className="mx-auto flex h-full max-w-[640px] flex-col justify-center px-6 py-6 md:py-10">
      <div className="border border-ink/12 bg-paper-2">
        <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-ink/25" />
          <span className="h-2 w-2 rounded-full bg-ink/25" />
          <span className="h-2 w-2 rounded-full bg-ink/25" />
          <span className="ml-3 flex-1 bg-ink/8 px-3 py-1 text-[10px] tracking-[0.12em] text-muted">preview</span>
        </div>
        <div className="m-4 flex min-h-[180px] flex-col items-center justify-center border border-dashed border-ink/12 px-8 py-10 text-center md:min-h-[420px] md:py-16">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Preview</p>
          <p className="display mt-3 max-w-sm text-2xl leading-tight md:text-3xl">This is the page as it is built.</p>
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-soft">
            Answer on the left. Each reply prints into this frame.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PreviewStage({
  revision,
  locked,
  onUnlock,
  empty,
}: {
  revision: number;
  locked: boolean;
  onUnlock: () => void;
  empty: boolean;
}) {
  return (
    <section className="order-1 flex max-h-[38vh] min-h-0 w-full shrink-0 flex-col border-b border-ink/10 bg-stage text-ink sm:order-2 sm:h-auto sm:max-h-none sm:flex-1 sm:border-b-0">
      <div className="hidden items-center justify-between px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted sm:flex">
        <span>Page preview</span>
      </div>
      <div
        className="min-h-0 flex-1 overflow-auto"
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      >
        {empty ? (
          <EmptyPageHolder />
        ) : (
          <div className="px-3 py-2 sm:mx-auto sm:max-w-[320px] sm:px-4 sm:pb-6">
            <div className="sm:rounded-[1.7rem] sm:border sm:border-ink/10 sm:bg-[var(--phone-bezel)] sm:p-2">
              <div className="overflow-hidden sm:rounded-[1.3rem]">
                <img
                  src={`/api/preview?v=${revision}`}
                  alt="Preview of the page as it is built"
                  draggable={false}
                  className="mx-auto block max-h-[32vh] w-auto max-w-full select-none sm:max-h-none sm:w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-4 py-3 sm:px-5 sm:py-4">
        <p className="hidden text-xs leading-5 text-muted sm:block">
          {empty
            ? "An empty frame until the first answer. Then this side shows a picture of the page, not HTML."
            : "This is a picture of the page. View Source will not reveal the HTML."}
        </p>
        {empty ? null : locked ? (
          <button
            type="button"
            onClick={onUnlock}
            className="ml-auto shrink-0 bg-ink px-3 py-2 text-xs text-[var(--paper)]"
          >
            Unlock files
          </button>
        ) : (
          <a
            href="/api/export"
            className="ml-auto shrink-0 bg-ink px-3 py-2 text-xs text-[var(--paper)]"
          >
            Download HTML
          </a>
        )}
      </div>
    </section>
  );
}
