"use client";

import { useEffect, useRef, useState } from "react";
import { ExampleDrawer } from "./ExampleDrawer";
import { ImageAttachButton, uploadStudioImage } from "./ImageDropzone";
import { AccessPanel } from "./AccessPanel";
import { YourPagesButton } from "./YourPagesButton";
import { EXAMPLES } from "@/lib/examples-catalog";
import { previousStep, STEP_COPY } from "@/lib/guide";
import type { ExampleItem } from "@/lib/types";
import type { PublicProject } from "@/lib/public-project";

export function PromptPanel({
  project,
  onProject,
  error,
  signedIn,
  onAuth,
  showYourPages = false,
  openingPages = false,
  onYourPages,
}: {
  project: PublicProject;
  onProject: (project: PublicProject) => void;
  error: string;
  signedIn: boolean;
  onAuth: () => Promise<void> | void;
  showYourPages?: boolean;
  openingPages?: boolean;
  onYourPages?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("");
  const [localError, setLocalError] = useState("");
  const [dropOver, setDropOver] = useState(false);
  const [examples, setExamples] = useState<ExampleItem[]>(project.examples ?? []);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const current = STEP_COPY[project.step];
  const imageStep = project.step === "imagery";
  const canSkip = project.step === "copy" || project.step === "refine";
  const hasDraft = Boolean(draft.trim());
  const prior = previousStep(project.step);
  useEffect(() => {
    if (project.examples?.length) setExamples(project.examples);
    else if (project.step !== "imagery") setExamples([]);
  }, [project.examples, project.step]);

  useEffect(() => {
    if (project.step === "imagery" && project.selectedExampleId) {
      const match =
        (project.examples ?? []).find((item) => item.id === project.selectedExampleId) ||
        EXAMPLES.find((item) => item.id === project.selectedExampleId);
      setDraft(match?.title ?? "");
      return;
    }
    setDraft("");
  }, [project.step, project.selectedExampleId]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [project.step, busy, pending, current.prompt]);

  async function submit(text = draft, options?: { fromHint?: boolean }) {
    const message = text.trim();
    const skipping = canSkip && !message;
    if ((!message && !skipping) || busy) return;
    setBusy(true);
    setPending(skipping ? "Skip" : message);
    setLocalError("");
    const started = Date.now();
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: skipping ? "Skip" : message,
          advance: true,
          fromHint: options?.fromHint === true,
          skip: skipping,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        project?: PublicProject;
      };
      const wait = Math.max(0, 500 - (Date.now() - started));
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
      if (!response.ok || !data.project) {
        setLocalError(data.error || "That could not be used.");
        return;
      }
      setDraft("");
      onProject(data.project);
      setExamples(data.project.examples ?? []);
    } catch {
      setLocalError("That could not be used.");
    } finally {
      setBusy(false);
      setPending("");
    }
  }

  async function selectExample(item: ExampleItem) {
    if (busy) return;
    setDraft(item.title);
    setLocalError("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
    const response = await fetch("/api/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const data = await response.json();
    if (!response.ok) {
      setLocalError(data.error || "Could not apply that example.");
      return;
    }
    onProject(data.project);
    if (data.project.examples?.length) setExamples(data.project.examples);
  }

  async function browseExamples(query: string) {
    if (busy) return;
    setBusy(true);
    setLocalError("");
    const response = await fetch("/api/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setLocalError(data.error || "Could not load examples.");
      return;
    }
    onProject(data.project);
    setExamples(data.project.examples ?? []);
  }

  async function onDropFile(file: File) {
    setBusy(true);
    const result = await uploadStudioImage(file);
    setBusy(false);
    if (!result.ok) {
      setLocalError(result.reason);
      return;
    }
    const data = result.data as { project?: PublicProject };
    if (data.project) onProject(data.project);
  }

  async function goBack() {
    if (!prior || busy) return;
    setBusy(true);
    setLocalError("");
    const wizard =
      prior === "mood" ? "mood" : prior === "font" ? "font" : prior === "purpose" ? "type" : null;
    const response = wizard
      ? await fetch("/api/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reopen", stage: wizard }),
        })
      : await fetch("/api/step", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: prior }),
        });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setLocalError(data.error || "Could not go back.");
      return;
    }
    onProject(data.project);
  }

  if (project.step === "access") {
    return (
      <AccessPanel
        project={project}
        onProject={onProject}
        signedIn={signedIn}
        onAuth={onAuth}
        showYourPages={showYourPages}
        openingPages={openingPages}
        onYourPages={onYourPages}
      />
    );
  }

  return (
    <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col border-ink/10 bg-paper sm:order-1 sm:w-[42%] sm:max-w-[460px] sm:min-w-[280px] sm:flex-none sm:shrink-0 sm:border-r">
      <div ref={threadRef} className="min-h-0 flex-1 space-y-5 overflow-auto px-4 py-4">
        <div className="space-y-5">
          <YourPagesButton
            visible={showYourPages}
            busy={openingPages}
            onClick={() => onYourPages?.()}
          />
          <article className="mr-6">
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted">PageBuilder</p>
            <p className="serif text-xl leading-7">{current.prompt}</p>
            {project.pattern ? (
              <p className="mt-3 text-xs leading-5 text-muted">
                Library: {project.pattern.name}
                {project.mood ? ` · ${project.mood.name}` : ""}
                {project.font ? ` · ${project.font.name}` : ""}
              </p>
            ) : null}
          </article>
          {busy && pending ? (
            <div className="flex items-center gap-3">
              <span className="pb-spinner" aria-hidden />
              <p className="text-sm text-muted">Matching that to the template library…</p>
            </div>
          ) : null}
        </div>
        {busy && pending ? null : (
          <ExampleDrawer
            examples={examples}
            selectedId={
              project.selectedExampleId ||
              examples.find((item) => draft.trim() === item.title || draft.toLowerCase().includes(item.id))?.id
            }
            onSelect={(item) => void selectExample(item)}
          />
        )}
      </div>

      <div className="border-t border-ink/10 px-4 py-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">{current.title}</p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {project.suggestions.map((hint) => {
            const example = examples.find((item) => hint === `Use ${item.id}` || hint === item.title);
            const selected =
              pending === hint ||
              draft.trim() === hint ||
              (example != null && (draft.trim() === example.title || project.selectedExampleId === example.id));
            return (
              <button
                key={hint}
                type="button"
                disabled={busy}
                onClick={() => {
                  if (example) void selectExample(example);
                  else if (/\b(browse|header styles?|backgrounds?)\b/i.test(hint)) void browseExamples(hint);
                  else void submit(hint, { fromHint: true });
                }}
                className={`px-2 py-1 text-xs ${
                  selected
                    ? "bg-ink text-[var(--paper)]"
                    : "border border-ink/15 text-ink-soft hover:border-ink/40"
                }`}
              >
                {example?.title ?? hint}
              </button>
            );
          })}
        </div>
        {(error || localError) && <p className="mb-2 text-xs text-clay">{error || localError}</p>}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          onDragOver={(event) => {
            if (!imageStep) return;
            event.preventDefault();
            setDropOver(true);
          }}
          onDragLeave={() => {
            if (!imageStep) return;
            setDropOver(false);
          }}
          onDrop={(event) => {
            if (!imageStep) return;
            event.preventDefault();
            setDropOver(false);
            const file = event.dataTransfer.files[0];
            if (file) void onDropFile(file);
          }}
          className={`border bg-paper px-3 pt-3 pb-2 ${imageStep && dropOver ? "border-clay" : "border-ink/20"}`}
        >
          <textarea
            ref={inputRef}
            value={draft}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={3}
            maxLength={2000}
            placeholder="Pick a card above, or type your answer…"
            className="min-h-[72px] w-full resize-none bg-transparent text-sm leading-6 outline-none disabled:opacity-50"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            {imageStep ? (
              <ImageAttachButton
                disabled={busy}
                onUploaded={(payload) => {
                  const data = payload as { project?: PublicProject };
                  if (data.project) onProject(data.project);
                }}
              />
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              {prior ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void goBack()}
                  className="border border-ink/20 px-4 py-2 text-sm disabled:opacity-40"
                >
                  Back
                </button>
              ) : null}
              <button
                type="submit"
                disabled={busy || (!hasDraft && !canSkip)}
                className="inline-flex items-center gap-2 bg-ink px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-40"
              >
                {busy && pending ? (
                  <>
                    <span className="pb-spinner !h-3.5 !w-3.5 !border-[1.5px] !border-[var(--paper)]/30 !border-t-[var(--paper)]" />
                    {pending === "Skip" ? "Skipping…" : "Matching…"}
                  </>
                ) : canSkip && !hasDraft ? (
                  "Skip"
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </form>
        {imageStep ? (
          <p className="mt-2 text-[11px] text-muted">
            Drop a JPEG, PNG, or WebP onto the prompt. 640×400 min, 4 MB max, public-safe images only.
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-muted">
            Answer this question, then submit. The next topic appears after PageBuilder matches your answer.
          </p>
        )}
      </div>
    </section>
  );
}
