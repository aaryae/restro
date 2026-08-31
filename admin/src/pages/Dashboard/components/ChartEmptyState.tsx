export default function ChartEmptyState({
  message = "No data yet",
  hint = "Charts will appear once records are available",
  tone = "empty",
}: {
  message?: string;
  hint?: string;
  tone?: "empty" | "error";
}) {
  const isError = tone === "error";

  return (
    <div
      className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed text-center"
      style={{
        borderColor: isError
          ? "color-mix(in srgb, var(--serve-negative) 40%, var(--serve-border))"
          : "var(--serve-border)",
        backgroundColor: isError
          ? "color-mix(in srgb, var(--serve-negative) 6%, transparent)"
          : "var(--serve-surface-2)",
      }}
    >
      <p
        className="text-[13px] font-semibold"
        style={{
          color: isError ? "var(--serve-negative)" : "var(--serve-fg)",
        }}
      >
        {message}
      </p>
      {hint ? (
        <p className="mt-1 text-[12px] text-[var(--serve-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
