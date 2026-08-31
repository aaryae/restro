import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { TrialGateCode, TrialGateCafe } from "@/redux/feature/trialGateSlice";

export interface TrialLifecyclePayload {
  code: TrialGateCode;
  canSelfExtend?: boolean;
  selfServeExtendDays?: number;
  message?: string;
  cafe?: TrialGateCafe | null;
}

const TRIAL_CODES = new Set<string>([
  "TRIAL_EXPIRED",
  "TRIAL_FINISHED",
  "TENANT_UNAVAILABLE",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return null;
}

/** Pull structured trial payload from a failed API response body. */
export function parseTrialLifecyclePayload(
  error: FetchBaseQueryError | unknown,
): TrialLifecyclePayload | null {
  const err = asRecord(error);
  if (!err) return null;

  const status = err.status;
  if (status !== 403 && status !== 400) return null;

  const body = asRecord(err.data);
  if (!body) return null;

  const nested = asRecord(body.data);
  const codeRaw = String(nested?.code || body.code || "");
  if (!TRIAL_CODES.has(codeRaw)) return null;

  const code = codeRaw as TrialGateCode;
  const message = String(
    nested?.message || body.msg || body.message || "",
  );

  return {
    code,
    canSelfExtend: Boolean(nested?.canSelfExtend ?? body.canSelfExtend),
    selfServeExtendDays: Number(
      nested?.selfServeExtendDays ?? body.selfServeExtendDays ?? 3,
    ),
    message,
    cafe: (nested?.cafe as TrialGateCafe | undefined) || null,
  };
}

export function isTrialLifecycleError(error: unknown): boolean {
  return Boolean(parseTrialLifecyclePayload(error));
}
