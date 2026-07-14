type ToastVariant = "success" | "warning" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type Listener = (items: ToastItem[]) => void;

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(items));
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function pushToast(message: string, variant: ToastVariant) {
  const id = nextId++;
  items = [...items, { id, message, variant }];
  emit();
  window.setTimeout(() => dismissToast(id), 2600);
  return id;
}

type ToastFunction = (message: string, variant: string) => void;

const Toast: ToastFunction = (message, variant) => {
  const normalized =
    variant === "success" ||
    variant === "warning" ||
    variant === "error" ||
    variant === "info"
      ? variant
      : "info";
  pushToast(message, normalized);
};

export const appToast = {
  success: (message: string) => pushToast(message, "success"),
  warning: (message: string) => pushToast(message, "warning"),
  error: (message: string) => pushToast(message, "error"),
  info: (message: string) => pushToast(message, "info"),
};

export default Toast;
