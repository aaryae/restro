import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { exportToExcel } from "@/utils/singleExport";
import {
  useImportProductsMutation,
  type ImportProductsResponse,
  type ImportRowResult,
  type ImportRowStatus,
} from "@/redux/services/product";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const MAX_FILE_MB = 10;

const TEMPLATE_HEADERS = [
  "Name",
  "Category",
  "Department",
  "Price",
  "Description",
  "Quantity",
  "Stock Status",
];

const TEMPLATE_SAMPLE_ROWS = [
  ["Americano", "Coffee", "Kitchen", "220", "Double shot espresso", "0", "In Stock"],
  ["Chicken Momo", "Snacks", "Kitchen", "260", "Steamed, 10 pcs", "0", "In Stock"],
  ["Fresh Lime Soda", "Beverages", "Bar", "180", "", "0", "In Stock"],
];

type ImportSummary = NonNullable<ImportProductsResponse["data"]>;

const STATUS_STYLES: Record<ImportRowStatus, string> = {
  created:
    "border-[color-mix(in_srgb,var(--serve-positive)_35%,transparent)] bg-[color-mix(in_srgb,var(--serve-positive)_12%,transparent)] text-[var(--serve-positive)]",
  ready:
    "border-[color-mix(in_srgb,var(--serve-positive)_35%,transparent)] bg-[color-mix(in_srgb,var(--serve-positive)_12%,transparent)] text-[var(--serve-positive)]",
  skipped:
    "border-[color-mix(in_srgb,var(--serve-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--serve-warning)_12%,transparent)] text-[var(--serve-warning)]",
  failed:
    "border-[color-mix(in_srgb,var(--serve-negative)_35%,transparent)] bg-[color-mix(in_srgb,var(--serve-negative)_12%,transparent)] text-[var(--serve-negative)]",
};

const STATUS_LABELS: Record<ImportRowStatus, string> = {
  created: "Imported",
  ready: "Ready",
  skipped: "Skipped",
  failed: "Error",
};

function hasAcceptedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function errorMessage(error: unknown, fallback: string) {
  const data = (error as { data?: { msg?: string; message?: string } })?.data;
  return data?.msg || data?.message || fallback;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  onImported,
}: BulkUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<ImportSummary | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [importProducts, { isLoading }] = useImportProductsMutation();
  const [pendingAction, setPendingAction] = useState<"validate" | "import" | null>(
    null,
  );

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setDragging(false);
    setPendingAction(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const closeAndReset = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const validateFile = useCallback(
    async (nextFile: File) => {
      setPendingAction("validate");
      try {
        const response = await importProducts({
          file: nextFile,
          dryRun: true,
        }).unwrap();

        if (!response?.data) {
          Toast(response?.msg || "Could not read that file.", "error");
          setFile(null);
          return;
        }
        setPreview(response.data);
      } catch (error) {
        Toast(errorMessage(error, "Could not read that file."), "error");
        setFile(null);
      } finally {
        setPendingAction(null);
      }
    },
    [importProducts],
  );

  const acceptFile = useCallback(
    (nextFile: File | undefined | null) => {
      if (!nextFile) return;

      if (!hasAcceptedExtension(nextFile.name)) {
        Toast("Upload an .xlsx, .xls or .csv file.", "error");
        return;
      }
      if (nextFile.size > MAX_FILE_MB * 1024 * 1024) {
        Toast(`File must be smaller than ${MAX_FILE_MB}MB.`, "error");
        return;
      }

      setResult(null);
      setPreview(null);
      setFile(nextFile);
      void validateFile(nextFile);
    },
    [validateFile],
  );

  const runImport = useCallback(async () => {
    if (!file) return;
    setPendingAction("import");
    try {
      const response = await importProducts({ file, dryRun: false }).unwrap();
      if (!response?.data) {
        Toast(response?.msg || "Import failed.", "error");
        return;
      }
      setResult(response.data);
      setPreview(null);
      Toast(response.msg || "Menu items imported.", "success");
      onImported();
    } catch (error) {
      Toast(errorMessage(error, "Import failed."), "error");
    } finally {
      setPendingAction(null);
    }
  }, [file, importProducts, onImported]);

  const downloadTemplate = useCallback(async () => {
    try {
      await exportToExcel({
        title: "Serve Menu Import Template",
        headers: TEMPLATE_HEADERS,
        data: TEMPLATE_SAMPLE_ROWS,
      });
    } catch {
      Toast("Could not generate the template.", "error");
    }
  }, []);

  const summary = result ?? preview;
  const rows = useMemo<ImportRowResult[]>(() => summary?.rows ?? [], [summary]);
  const busy = isLoading || pendingAction !== null;
  const importable = (preview?.created ?? 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAndReset}
      size="large"
      title="Bulk upload menu items"
    >
      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--serve-fg)]">
              Start from our template
            </p>
            <p className="mt-0.5 text-[13px] text-[var(--serve-muted)]">
              Name, Category and Price are required. Categories are created
              automatically; departments must already exist.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 text-[13px] font-medium text-[var(--serve-fg)] transition hover:border-[color-mix(in_srgb,var(--serve-accent)_30%,var(--serve-border))]"
          >
            <Download size={15} />
            Download template
          </button>
        </div>

        {!result ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
              dragging
                ? "border-[var(--serve-accent)] bg-[color-mix(in_srgb,var(--serve-accent)_8%,transparent)]"
                : "border-[var(--serve-border)] bg-[var(--serve-bg)]"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet size={26} className="text-[var(--serve-accent)]" />
                <p className="text-sm font-medium text-[var(--serve-fg)]">
                  {file.name}
                </p>
                <p className="text-xs text-[var(--serve-muted)]">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--serve-muted)] transition hover:text-[var(--serve-fg)] disabled:opacity-50"
                >
                  <X size={13} />
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadCloud size={26} className="text-[var(--serve-muted)]" />
                <p className="text-sm font-medium text-[var(--serve-fg)]">
                  Drag your menu file here
                </p>
                <p className="text-xs text-[var(--serve-muted)]">
                  .xlsx, .xls or .csv · up to {MAX_FILE_MB}MB
                </p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-2 inline-flex h-9 items-center rounded-lg bg-[var(--primary-color)] px-4 text-[13px] font-semibold text-[var(--primary-fg,#fff)] transition hover:opacity-95"
                >
                  Browse files
                </button>
              </div>
            )}
          </div>
        ) : null}

        {pendingAction === "validate" ? (
          <p className="flex items-center justify-center gap-2 text-sm text-[var(--serve-muted)]">
            <Loader2 size={15} className="animate-spin" />
            Checking your file…
          </p>
        ) : null}

        {summary ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryTile label="Rows" value={summary.totalRows} />
              <SummaryTile
                label={result ? "Imported" : "Ready"}
                value={summary.created}
                tone="positive"
              />
              <SummaryTile
                label="Skipped"
                value={summary.skipped}
                tone={summary.skipped ? "warning" : undefined}
              />
              <SummaryTile
                label="Errors"
                value={summary.failed}
                tone={summary.failed ? "negative" : undefined}
              />
            </div>

            {result?.createdCategories?.length ? (
              <p className="rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 py-2 text-[13px] text-[var(--serve-muted)]">
                New categories created:{" "}
                <span className="font-medium text-[var(--serve-fg)]">
                  {result.createdCategories.join(", ")}
                </span>
              </p>
            ) : null}

            {rows.length ? (
              <div className="overflow-hidden rounded-xl border border-[var(--serve-border)]">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="sticky top-0 bg-[var(--serve-table-head)] text-[var(--serve-table-head-fg)]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Row</th>
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className="border-t border-[var(--serve-row-line)]"
                        >
                          <td className="px-3 py-2 text-[var(--serve-muted)]">
                            {row.rowNumber}
                          </td>
                          <td className="px-3 py-2 text-[var(--serve-fg)]">
                            {row.name || "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[row.status]}`}
                            >
                              {STATUS_LABELS[row.status]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[var(--serve-muted)]">
                            {row.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {preview && !importable ? (
          <p className="flex items-start gap-2 rounded-lg border border-[color-mix(in_srgb,var(--serve-warning)_30%,var(--serve-border))] bg-[color-mix(in_srgb,var(--serve-warning)_10%,transparent)] px-3 py-2 text-[13px] text-[var(--serve-fg)]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--serve-warning)]" />
            Nothing can be imported yet. Fix the rows above and upload again.
          </p>
        ) : null}

        {result ? (
          <p className="flex items-start gap-2 rounded-lg border border-[color-mix(in_srgb,var(--serve-positive)_30%,var(--serve-border))] bg-[color-mix(in_srgb,var(--serve-positive)_10%,transparent)] px-3 py-2 text-[13px] text-[var(--serve-fg)]">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--serve-positive)]" />
            {result.created} item(s) added to your menu.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-[var(--serve-border)] pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeAndReset}
            className="h-10 rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] px-4 text-sm font-semibold text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)]"
          >
            {result ? "Done" : "Cancel"}
          </button>

          {!result ? (
            <button
              type="button"
              disabled={!importable || busy}
              onClick={runImport}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-4 text-sm font-semibold text-[var(--primary-fg,#fff)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAction === "import" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : null}
              {importable
                ? `Import ${preview?.created} item(s)`
                : "Import"}
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="h-10 rounded-xl bg-[var(--primary-color)] px-4 text-sm font-semibold text-[var(--primary-fg,#fff)] transition hover:opacity-95"
            >
              Upload another file
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "positive" | "warning" | "negative";
}) {
  const toneColor =
    tone === "positive"
      ? "var(--serve-positive)"
      : tone === "warning"
        ? "var(--serve-warning)"
        : tone === "negative"
          ? "var(--serve-negative)"
          : "var(--serve-fg)";

  return (
    <div className="rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--serve-muted)]">
        {label}
      </p>
      <p className="text-lg font-semibold" style={{ color: toneColor }}>
        {value}
      </p>
    </div>
  );
}
