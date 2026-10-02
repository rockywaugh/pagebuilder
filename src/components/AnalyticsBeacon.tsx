"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function AnalyticsBeacon() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith("/api")) return;
    try {
      navigator.sendBeacon(
        "/api/track",
        new Blob(
          [JSON.stringify({ site: "pagebuilder", event: "page_view", meta: { path }, t: Date.now() })],
          { type: "application/json" },
        ),
      );
    } catch {
      // tracking is best-effort
    }
  }, [path]);
  return null;
}
