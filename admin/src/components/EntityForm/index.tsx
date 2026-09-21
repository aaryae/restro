import { ArrowLeft, type LucideIcon } from "lucide-react";
import { FormEventHandler, ReactNode } from "react";
import Button from "@/components/Button";
import useTranslation from "@/locale/useTranslation";
import { cn } from "@/lib/utils";

type EntityFormProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  sectionTitle: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
  /** Hide page chrome when the form is embedded in a modal. */
  embedded?: boolean;
  submitLabel?: string;
  footerExtra?: ReactNode;
  /** Tailwind max-width class. Default max-w-3xl. */
  maxWidthClass?: string;
  /** Field grid columns. Default 2. Use 3 for denser finance forms. `"stack"` for multi-section forms. */
  columns?: 1 | 2 | 3 | "stack";
  /** Replace default Cancel/Submit footer. Pass `null` to hide footer. */
  footer?: ReactNode | null;
  children: ReactNode;
};

/** Consistent muted glyph for Input / Select leftSection. */
export function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon
      size={16}
      strokeWidth={2}
      className="shrink-0 text-[var(--serve-muted)]"
      aria-hidden
    />
  );
}

/** Label row with optional inline actions (+ Add, View All). */
export function FieldHeader({
  label,
  required,
  actions,
}: {
  label: string;
  required?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-1.5 flex h-7 items-center justify-between gap-2">
      <span className="min-w-0 truncate text-xs font-medium text-[var(--serve-muted)]">
        {label}
        {required ? <span className="text-[var(--serve-negative)]"> *</span> : null}
      </span>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      ) : null}
    </div>
  );
}

export function EntityForm({
  title,
  description,
  icon: Icon,
  sectionTitle,
  onSubmit,
  onCancel,
  isSaving = false,
  isLoading = false,
  embedded = false,
  submitLabel = "Submit",
  footerExtra,
  maxWidthClass = "max-w-3xl",
  columns = 2,
  footer,
  children,
}: EntityFormProps) {
  const translate = useTranslation();
  const busy = isSaving || isLoading;

  const gridClass =
    columns === "stack"
      ? "flex flex-col gap-4 p-4 md:p-5"
      : columns === 3
        ? "grid grid-cols-1 gap-x-4 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3 md:p-5"
        : columns === 1
          ? "grid grid-cols-1 gap-x-4 gap-y-3 p-4 md:p-5"
          : "grid grid-cols-1 gap-x-4 gap-y-3 p-4 md:grid-cols-2 md:p-5";

  const formCard = (
    <form
      noValidate
      onSubmit={onSubmit}
      className={cn(
        "overflow-hidden",
        embedded
          ? "bg-transparent"
          : "rounded-[var(--serve-radius)] border border-[var(--serve-border)] bg-[var(--serve-surface)] shadow-[var(--serve-shadow)]",
      )}
    >
      {!embedded && (
        <div className="flex items-center gap-3 border-b border-[var(--serve-border)] px-4 py-3 md:px-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--primary-color)_12%,transparent)] text-[var(--primary-ink)]">
            <Icon size={18} strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--serve-fg)]">
              {translate(sectionTitle)}
            </h2>
            <p className="text-xs text-[var(--serve-muted)]">
              {translate(description)}
            </p>
          </div>
        </div>
      )}

      <div className={cn(gridClass, embedded && "p-0 md:p-0")}>
        {isLoading ? (
          <FormSkeleton columns={columns === "stack" ? 2 : columns} />
        ) : (
          children
        )}
      </div>

      {footer === undefined ? (
        <div
          className={cn(
            "form-actions flex flex-wrap items-center justify-start gap-2",
            embedded
              ? "mt-4 border-0 bg-transparent px-0 pt-3"
              : "border-t border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-4 py-3 md:px-5",
          )}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface)] px-4 text-sm font-semibold text-[var(--serve-fg)] transition hover:border-[var(--serve-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {translate("Cancel")}
          </button>
          {footerExtra}
          <Button
            type="submit"
            className="submit-button h-10 min-w-[6.5rem] px-5"
            disabled={busy}
            isLoading={isSaving}
          >
            {translate(submitLabel)}
          </Button>
        </div>
      ) : (
        footer
      )}
    </form>
  );

  if (embedded) {
    return formCard;
  }

  return (
    <div className={cn("flex w-full flex-col gap-3 pb-2", maxWidthClass)}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface)] text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)]"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-[1.35rem] leading-tight">{translate(title)}</h1>
      </div>
      {formCard}
    </div>
  );
}

function FormSkeleton({ columns }: { columns: 1 | 2 | 3 | "stack" }) {
  const count = columns === 3 ? 6 : columns === 1 ? 3 : 4;
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse space-y-2" aria-hidden>
          <div className="h-3 w-24 rounded bg-[var(--serve-surface-2)]" />
          <div className="h-10 rounded-[9px] bg-[var(--serve-surface-2)]" />
        </div>
      ))}
    </>
  );
}

export { useResourceForm } from "./useResourceForm";
export { EntityFormDialog } from "./EntityFormDialog";
