export type SplitPaymentLine = {
  paymentMethod: "cash" | "card" | "online";
  amount: number;
  accountId: number;
};

const VALID_PAYMENT_METHODS = new Set(["cash", "card", "online"]);
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const CHECKOUT_ROUND_EPS = 0.01;

export function amountsMatchWithinEpsilon(
  left: number,
  right: number,
  epsilon = CHECKOUT_ROUND_EPS,
) {
  return Math.abs(Number(left) - Number(right)) <= epsilon;
}

export function sanitizeSplitPayments(raw: unknown): SplitPaymentLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const payments = raw
    .map((entry) => {
      const payment = entry as Record<string, unknown>;
      return {
        paymentMethod: payment.paymentMethod,
        amount: roundMoney(Number(payment.amount)),
        accountId: Number(payment.accountId),
      };
    })
    .filter(
      (payment): payment is SplitPaymentLine =>
        typeof payment.paymentMethod === "string" &&
        VALID_PAYMENT_METHODS.has(payment.paymentMethod) &&
        Number.isFinite(payment.amount) &&
        payment.amount > 0 &&
        Number.isFinite(payment.accountId) &&
        payment.accountId > 0,
    );

  return payments.length > 0 ? payments : null;
}

export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && UUID_V4_RE.test(value);
}

export function resolvePositiveId(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    const id = Number(candidate);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return null;
}

export type SplitCheckoutBody = {
  orderId?: number;
  orderItemIds?: number[];
  checkoutAll?: true;
  payments: SplitPaymentLine[];
  customerId?: number;
  discountAmount?: number;
  sessionId?: string;
};

export function buildSplitCheckoutBody(options: {
  payments: SplitPaymentLine[];
  orderId?: number | null;
  orderItemIds?: number[];
  checkoutAll?: boolean;
  customerId?: number | null;
  discountAmount?: number;
  sessionId?: string | null;
}): SplitCheckoutBody {
  const payments = options.payments.map((payment) => ({
    paymentMethod: payment.paymentMethod,
    amount: roundMoney(payment.amount),
    accountId: Number(payment.accountId),
  }));

  const body: SplitCheckoutBody = { payments };

  if (options.discountAmount != null && options.discountAmount > 0) {
    body.discountAmount = roundMoney(options.discountAmount);
  }

  if (options.customerId != null && Number(options.customerId) > 0) {
    body.customerId = Number(options.customerId);
  }

  if (options.sessionId && isValidSessionId(options.sessionId)) {
    body.sessionId = options.sessionId;
  }

  if (options.checkoutAll) {
    return { ...body, checkoutAll: true };
  }

  if (options.orderItemIds?.length) {
    return {
      ...body,
      orderItemIds: options.orderItemIds.map(Number).filter((id) => id > 0),
    };
  }

  if (options.orderId != null && Number(options.orderId) > 0) {
    return { ...body, orderId: Number(options.orderId) };
  }

  return { ...body, checkoutAll: true };
}

export function isCheckoutTypeValidationError(error: unknown): boolean {
  const err = error as {
    data?: {
      errors?: Record<string, string>;
      message?: string;
      msg?: string;
    };
  };
  const nested = err?.data?.errors?.[""];
  const text = [nested, err?.data?.message, err?.data?.msg]
    .filter(Boolean)
    .join(" ");
  return /valid checkout types/i.test(text);
}

/** Fallback for APIs that only accept single-payment checkout payloads. */
export function buildSequentialSplitBodies(options: {
  orderId: number;
  payments: SplitPaymentLine[];
  customerId?: number | null;
  discountAmount?: number;
}): Array<Record<string, unknown>> {
  const { orderId, payments, customerId, discountAmount } = options;

  return payments.map((payment, index) => {
    const body: Record<string, unknown> = {
      orderId: Number(orderId),
      paymentMethod: payment.paymentMethod,
      accountId: Number(payment.accountId),
      paidAmount: roundMoney(payment.amount),
    };

    if (customerId != null && Number(customerId) > 0) {
      body.customerId = Number(customerId);
    }

    if (index === 0 && discountAmount != null && discountAmount > 0) {
      body.discountAmount = roundMoney(discountAmount);
    }

    return body;
  });
}
