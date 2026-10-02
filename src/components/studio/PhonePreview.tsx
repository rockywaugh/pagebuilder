export function PhonePreview({
  revision,
  alt,
}: {
  revision: number;
  alt: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="rounded-[1.7rem] border border-ink/10 bg-[var(--phone-bezel)] p-2">
        <div className="overflow-hidden rounded-[1.3rem] bg-paper">
          <img
            src={`/api/preview?v=${revision}`}
            alt={alt}
            draggable={false}
            className="block h-auto w-full max-w-full select-none"
          />
        </div>
      </div>
    </div>
  );
}
