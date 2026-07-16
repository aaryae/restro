import { FieldValues, UseFormSetError } from "react-hook-form";
import Toast from "../components/Toast";

interface HandleResponseParams {
  res: any;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
}

interface HandleErrorParams {
  error: any;
  setError?: UseFormSetError<any>;
  defaultMessage?: string;
}

const GENERIC_INPUT_MSGS = new Set([
  "input errors",
  "input error",
  "bad request",
  "bad request.",
  "validation error",
  "validation failed",
]);

function asMessage(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const msg = asMessage(item);
      if (msg) return msg;
    }
    return null;
  }
  if (typeof value === "object") {
    // Nested error maps: pick first leaf message
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const msg = asMessage(nested);
      if (msg) return msg;
    }
  }
  return null;
}

/** Collect human-readable messages from API `errors` maps (flat or nested). */
export function collectErrorMessages(
  errors: unknown,
  out: string[] = [],
): string[] {
  if (errors == null) return out;
  if (typeof errors === "string") {
    const msg = errors.trim();
    if (msg) out.push(msg);
    return out;
  }
  if (Array.isArray(errors)) {
    errors.forEach((item) => collectErrorMessages(item, out));
    return out;
  }
  if (typeof errors === "object") {
    Object.values(errors as Record<string, unknown>).forEach((value) =>
      collectErrorMessages(value, out),
    );
  }
  return out;
}

function applyFieldErrors(
  errors: Record<string, unknown>,
  setError: UseFormSetError<FieldValues>,
  prefix = "",
) {
  Object.entries(errors).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      applyFieldErrors(value as Record<string, unknown>, setError, path);
      return;
    }
    const message = asMessage(value);
    if (!message) return;
    setError(path as any, {
      type: "server",
      message,
    });
  });
}

export const handleResponse = ({
  res,
  successMessage = "Successful",
  errorMessage = "Something Went Wrong",
  onSuccess,
}: HandleResponseParams) => {
  if (res?.success) {
    Toast(res?.msg || successMessage, "success");
    if (onSuccess) {
      onSuccess();
    }
  } else {
    const detailMessages = collectErrorMessages(res?.errors);
    const toastMsg =
      detailMessages.length > 0
        ? detailMessages.slice(0, 3).join(". ")
        : res?.msg || errorMessage;
    Toast(toastMsg, "error");
  }
};

export const handleError = ({
  error,
  setError,
  defaultMessage = "Something Went Wrong",
}: HandleErrorParams) => {
  const fieldErrors = error?.data?.errors;

  if (setError && fieldErrors && typeof fieldErrors === "object") {
    applyFieldErrors(fieldErrors as Record<string, unknown>, setError);
  }

  const detailMessages = collectErrorMessages(fieldErrors);
  const apiMsg =
    (typeof error?.data?.msg === "string" && error.data.msg.trim()) ||
    (typeof error?.data?.message === "string" && error.data.message.trim()) ||
    "";

  const isGeneric =
    !apiMsg || GENERIC_INPUT_MSGS.has(apiMsg.toLowerCase());

  const toastMsg =
    detailMessages.length > 0
      ? detailMessages.slice(0, 3).join(". ")
      : !isGeneric
        ? apiMsg
        : defaultMessage;

  Toast(toastMsg, "error");
};
