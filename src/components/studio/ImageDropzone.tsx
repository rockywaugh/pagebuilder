"use client";

import { useState } from "react";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export async function uploadStudioImage(file: File): Promise<{ ok: true; data: unknown } | { ok: false; reason: string }> {
  if (!ACCEPT.includes(file.type)) {
    return { ok: false, reason: "Only JPEG, PNG, and WebP. No SVG or GIF." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { ok: false, reason: "4 MB or smaller." };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return { ok: false, reason: "That file could not be read as an image." };
  }
  if (bitmap.width < 640 || bitmap.height < 400) {
    bitmap.close();
    return { ok: false, reason: "Need at least 640×400." };
  }
  bitmap.close();

  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  const data = await response.json();
  if (!response.ok) {
    return { ok: false, reason: data.error || "Upload blocked." };
  }
  return { ok: true, data };
}

export function ImageAttachButton({
  onUploaded,
  disabled,
}: {
  onUploaded: (payload: unknown) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function send(file: File) {
    if (disabled || busy) return;
    setBusy(true);
    const result = await uploadStudioImage(file);
    setBusy(false);
    if (result.ok) onUploaded(result.data);
  }

  return (
    <label className={`cursor-pointer px-2 py-1 text-xs text-muted hover:text-ink ${disabled || busy ? "opacity-50" : ""}`}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void send(file);
          event.target.value = "";
        }}
      />
      {busy ? "Checking…" : "Attach image"}
    </label>
  );
}
