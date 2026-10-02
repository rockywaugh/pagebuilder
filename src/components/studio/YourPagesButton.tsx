export function YourPagesButton({
  visible,
  busy,
  onClick,
  className = "",
}: {
  visible: boolean;
  busy: boolean;
  onClick: () => void;
  className?: string;
}) {
  if (!visible) return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`border border-ink/15 px-3 py-1.5 text-sm disabled:opacity-40 ${className}`}
    >
      {busy ? "Opening…" : "Your Pages"}
    </button>
  );
}
