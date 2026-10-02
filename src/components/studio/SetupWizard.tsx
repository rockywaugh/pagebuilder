"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { YourPagesButton } from "./YourPagesButton";
import type { PublicProject } from "@/lib/public-project";

type CatalogPattern = {
  id: string;
  name: string;
  family: string;
  market: string;
  look: string;
  swatches: string[];
};

type CatalogMood = {
  id: string;
  name: string;
  look: string;
  swatches: string[];
};

type CatalogFont = {
  id: string;
  name: string;
  look: string;
  stack: string;
};

type Option = (CatalogPattern | CatalogMood | CatalogFont) & {
  swatches?: string[];
  stack?: string;
};

function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function shouldBrowseAll(project: PublicProject) {
  if (project.resumeStudio) return true;
  return project.wizard === "type" ? !project.pattern : !project.mood;
}

function OptionCard({
  option,
  selected,
  disabled,
  onClick,
  cardRef,
  className = "",
  style,
}: {
  option: Option;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  cardRef?: (node: HTMLButtonElement | null) => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      ref={cardRef}
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`border px-3 py-3 text-left ${
        selected ? "border-ink bg-ink text-[var(--paper)]" : "border-ink/15 hover:border-ink/40"
      } ${className}`}
    >
      <span className="block text-sm font-medium" style={option.stack ? { fontFamily: option.stack } : undefined}>
        {option.name}
      </span>
      <span className={`mt-1 block line-clamp-2 text-[11px] leading-4 ${selected ? "text-[var(--paper)]/70" : "text-muted"}`}>
        {option.look}
      </span>
      {option.stack ? (
        <span
          className={`mt-3 block text-2xl leading-none ${selected ? "text-[var(--paper)]" : "text-ink"}`}
          style={{ fontFamily: option.stack }}
        >
          Aa
        </span>
      ) : (
        <span className="mt-3 flex gap-1">
          {(option.swatches ?? []).slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-2 w-2 rounded-full border border-black/10"
              style={{ background: color }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

function PhonePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mx-auto max-h-[min(52vh,560px)] w-[min(100%,240px)] overflow-hidden rounded-[1.7rem] border border-ink/10 bg-[#0c0b09] p-2">
      <div className="overflow-hidden rounded-[1.3rem] bg-paper">
        <img src={src} alt={alt} className="block w-full select-none" draggable={false} />
      </div>
    </div>
  );
}

function PickerCarousel({
  items,
  selectedId,
  disabled,
  onPick,
  label,
}: {
  items: Option[];
  selectedId?: string;
  disabled: boolean;
  onPick: (id: string) => void;
  label: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastSnap = useRef("");
  const [visible, setVisible] = useState(3);
  const [cardPx, setCardPx] = useState(0);
  const [page, setPage] = useState(0);
  const gap = 8;

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const minCard = 140;
    const measure = () => {
      const count = Math.max(1, Math.floor((node.clientWidth + gap) / (minCard + gap)));
      setVisible(count);
      setCardPx((node.clientWidth - gap * (count - 1)) / count);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length]);

  const maxPage = Math.max(0, Math.ceil(items.length / visible) - 1);
  const safePage = Math.min(page, maxPage);
  const overflow = items.length > visible;
  const selectedIndex = selectedId ? items.findIndex((item) => item.id === selectedId) : -1;
  const selectedSnap = `${selectedId ?? ""}:${visible}`;

  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  useEffect(() => {
    if (selectedIndex < 0 || lastSnap.current === selectedSnap) return;
    lastSnap.current = selectedSnap;
    setPage(Math.floor(selectedIndex / visible));
  }, [selectedIndex, selectedSnap, visible]);

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const step = (cardPx + gap) * visible;

  return (
    <div className="mt-8 flex items-stretch gap-2">
      {overflow ? (
        <button
          type="button"
          aria-label={`Previous ${label}`}
          disabled={disabled || safePage <= 0}
          onClick={() => setPage((current) => Math.max(0, current - 1))}
          className="flex w-9 shrink-0 items-center justify-center border border-ink/15 text-lg text-ink-soft hover:border-ink/40 disabled:opacity-25"
        >
          ‹
        </button>
      ) : null}
      <div ref={viewportRef} className="min-w-0 flex-1 overflow-hidden">
        <div
          className="flex gap-2"
          style={{
            transform: step > 0 ? `translateX(-${safePage * step}px)` : undefined,
            transition: reduceMotion ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="shrink-0"
              style={{ width: cardPx > 0 ? cardPx : 140, flex: "0 0 auto" }}
            >
              <OptionCard
                option={item}
                selected={item.id === selectedId}
                disabled={disabled}
                onClick={() => onPick(item.id)}
                className="h-full w-full"
              />
            </div>
          ))}
        </div>
      </div>
      {overflow ? (
        <button
          type="button"
          aria-label={`Next ${label}`}
          disabled={disabled || safePage >= maxPage}
          onClick={() => setPage((current) => Math.min(maxPage, current + 1))}
          className="flex w-9 shrink-0 items-center justify-center border border-ink/15 text-lg text-ink-soft hover:border-ink/40 disabled:opacity-25"
        >
          ›
        </button>
      ) : null}
    </div>
  );
}

export function SetupWizard({
  project,
  onProject,
  showYourPages = false,
  openingPages = false,
  onYourPages,
}: {
  project: PublicProject;
  onProject: (project: PublicProject) => void;
  showYourPages?: boolean;
  openingPages?: boolean;
  onYourPages?: () => void;
}) {
  const [patterns, setPatterns] = useState<CatalogPattern[]>([]);
  const [moods, setMoods] = useState<CatalogMood[]>([]);
  const [fonts, setFonts] = useState<CatalogFont[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [browsing, setBrowsing] = useState(shouldBrowseAll(project));
  const [leavingIds, setLeavingIds] = useState<string[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [animating, setAnimating] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/catalog");
      const data = await response.json();
      if (response.ok) {
        setPatterns(sortByName(data.patterns ?? []));
        setMoods(sortByName(data.moods ?? []));
        setFonts(sortByName(data.fonts ?? []));
      }
    })();
  }, []);

  async function post(body: Record<string, string>) {
    if (busy) return false;
    setBusy(true);
    setError("");
    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "That could not be saved.");
      return false;
    }
    onProject(data.project);
    return true;
  }

  useEffect(() => {
    setLeavingIds([]);
    setOffset({ x: 0, y: 0 });
    setBrowsing(project.wizard === "type" ? !project.pattern : !project.mood);
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [project.wizard]);

  useEffect(() => {
    if (!project.reopenId) return;
    setLeavingIds([]);
    setOffset({ x: 0, y: 0 });
    setBrowsing(true);
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [project.reopenId]);

  const typeStage = project.wizard === "type";
  const moodStage = project.wizard === "mood";
  const fontStage = project.wizard === "font";
  const selectedId = typeStage ? project.pattern?.id : moodStage ? project.mood?.id : project.font?.id;
  const canNext = typeStage ? !!project.pattern : moodStage ? !!project.mood : fontStage && !!project.font;
  const options = typeStage ? patterns : moodStage ? moods : fonts;
  const collapsed = !!selectedId && !browsing;
  const selectedOption = options.find((item) => item.id === selectedId) ?? null;

  async function pickType(id: string) {
    if (busy || animating) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const first = cardRefs.current.get(id)?.getBoundingClientRect();
    setAnimating(true);
    setLeavingIds(options.map((item) => item.id).filter((item) => item !== id));
    const save = post({ action: "select-type", patternId: id });
    if (!reduce) await wait(280);
    setBrowsing(false);
    await nextFrame();
    const last = cardRefs.current.get(id)?.getBoundingClientRect();
    if (!reduce && first && last) {
      setOffset({ x: first.left - last.left, y: first.top - last.top });
      await nextFrame();
      setOffset({ x: 0, y: 0 });
      await wait(420);
    }
    scrollerRef.current?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    const ok = await save;
    setLeavingIds([]);
    setAnimating(false);
    if (!ok) {
      setBrowsing(true);
      setOffset({ x: 0, y: 0 });
    }
  }

  async function pickMood(id: string) {
    if (busy || id === project.mood?.id) return;
    await post({ action: "select-mood", moodId: id });
  }

  async function pickFont(id: string) {
    if (busy || id === project.font?.id) return;
    await post({ action: "select-font", fontId: id });
  }

  function seeAll() {
    setLeavingIds([]);
    setOffset({ x: 0, y: 0 });
    setBrowsing(true);
    scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-paper">
      {showYourPages ? (
        <div className="shrink-0 px-5 sm:px-10">
          <div className="mx-auto w-full max-w-3xl py-4">
            <YourPagesButton
              visible
              busy={openingPages}
              onClick={() => onYourPages?.()}
            />
          </div>
        </div>
      ) : null}
      <div
        ref={scrollerRef}
        className={`min-h-0 flex-1 overflow-auto px-5 pb-8 sm:px-10 sm:pb-12 ${
          showYourPages ? "pt-0" : "pt-8 sm:pt-12"
        }`}
      >
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
            {typeStage ? "1 of 3 · Page type" : moodStage ? "2 of 3 · Mood" : "3 of 3 · Font"}
          </p>
          <h1 className={`serif mt-4 leading-[1.1] ${typeStage && !collapsed ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>
            {typeStage
              ? "What kind of page do you want to build?"
              : moodStage
                ? "How should it feel?"
                : "Which font should the page use?"}
          </h1>
          {typeStage && collapsed ? null : (
            <p className="mt-4 max-w-xl text-sm leading-6 text-ink-soft">
              {typeStage
                ? "Pick a popular page type. The matching template appears below."
                : moodStage
                  ? "Pick a mood. The template you chose keeps its layout; the colors shift."
                  : "Pick a popular page font. The template updates below."}
            </p>
          )}

          {typeStage ? (
            collapsed && selectedOption ? (
              <div className="mt-8 flex items-stretch gap-2">
                <div className="w-[calc(50%-0.25rem)] sm:w-[calc(33.333%-0.34rem)]">
                  <OptionCard
                    option={selectedOption}
                    selected
                    disabled={busy || animating}
                    onClick={() => undefined}
                    cardRef={(node) => {
                      if (node) cardRefs.current.set(selectedOption.id, node);
                      else cardRefs.current.delete(selectedOption.id);
                    }}
                    className="h-full w-full"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px)`,
                      transition: offset.x === 0 && offset.y === 0 ? "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                    }}
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || animating}
                  onClick={seeAll}
                  className="border border-ink/15 px-4 text-sm text-ink-soft hover:border-ink/40"
                >
                  See all templates
                </button>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {options.map((option) => {
                  const selected = option.id === selectedId;
                  const leaving = leavingIds.includes(option.id);
                  return (
                    <OptionCard
                      key={option.id}
                      option={option}
                      selected={selected}
                      disabled={busy || animating}
                      onClick={() => void pickType(option.id)}
                      cardRef={(node) => {
                        if (node) cardRefs.current.set(option.id, node);
                        else cardRefs.current.delete(option.id);
                      }}
                      className={`w-full transition-opacity duration-300 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
                    />
                  );
                })}
              </div>
            )
          ) : (
            <PickerCarousel
              items={moodStage ? moods : fonts}
              selectedId={moodStage ? project.mood?.id : project.font?.id}
              disabled={busy}
              onPick={(id) => void (moodStage ? pickMood(id) : pickFont(id))}
              label={moodStage ? "moods" : "typefaces"}
            />
          )}

          {project.pattern && (!typeStage || collapsed) ? (
            <div className="mt-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Template</p>
              <p className="mt-1 text-sm text-ink-soft">
                {project.pattern.name}
                {project.mood ? ` · ${project.mood.name}` : ""}
                {project.font ? ` · ${project.font.name}` : ""}
              </p>
              <div className="mt-4">
                <PhonePreview
                  src={`/api/preview?v=${project.previewRevision}`}
                  alt={`${project.pattern.name} template preview`}
                />
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-6 text-sm text-clay">{error}</p> : null}
        </div>
      </div>

      {canNext ? (
        <div className="flex items-center justify-between gap-3 border-t border-ink/10 bg-paper px-5 py-4 sm:px-10">
          {typeStage ? (
            <span />
          ) : (
            <button
              type="button"
              disabled={busy || animating}
              onClick={() => void post({ action: "back" })}
              className="bg-ink px-5 py-2.5 text-sm text-[var(--paper)] disabled:opacity-40"
            >
              Back
            </button>
          )}
          <button
            type="button"
            disabled={busy || animating}
            onClick={() =>
              void post({
                action: typeStage ? "advance-type" : moodStage ? "advance-mood" : "advance-font",
              })
            }
            className="bg-ink px-5 py-2.5 text-sm text-[var(--paper)] disabled:opacity-40"
          >
            {busy ? "Working…" : "Next"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
