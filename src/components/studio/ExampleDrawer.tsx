"use client";

import type { ExampleItem } from "@/lib/types";

export function ExampleDrawer({
  examples,
  selectedId,
  onSelect,
}: {
  examples: ExampleItem[];
  selectedId?: string;
  onSelect: (item: ExampleItem) => void;
}) {
  if (!examples.length) return null;

  return (
    <div className="mt-3 grid gap-2">
      {examples.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className={`border px-3 py-2 text-left ${
            selectedId === item.id ? "border-ink bg-paper-2" : "border-ink/10 bg-paper hover:border-ink/30"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{item.title}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{item.kind}</p>
          </div>
          <p className="mt-1 text-xs text-ink-soft">{item.blurb}</p>
          {item.swatches ? (
            <div className="mt-2 flex gap-1">
              {item.swatches.map((color) => (
                <span key={color} className="h-4 w-6" style={{ background: color }} />
              ))}
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}
