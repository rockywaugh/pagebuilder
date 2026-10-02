"use client";

import { useEffect, useState } from "react";
import { applyTheme, readTheme, type ThemeName } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function choose(next: ThemeName) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex overflow-hidden border border-ink/15 text-[11px]"
    >
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => choose("dark")}
        className={`px-2.5 py-1 ${theme === "dark" ? "bg-ink text-[var(--paper)]" : "text-ink-soft"}`}
      >
        Dark
      </button>
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => choose("light")}
        className={`px-2.5 py-1 ${theme === "light" ? "bg-ink text-[var(--paper)]" : "text-ink-soft"}`}
      >
        Light
      </button>
    </div>
  );
}
