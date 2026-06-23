import { api } from "../store/api";

export type PaymentIntentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled";

export interface PaymentIntentData {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  merchantTxnRef: string;
  gatewayTxnId?: string | null;
  status: PaymentIntentStatus;
  qrPayload?: string | null;
  qrImageUrl?: string | null;
  expiresAt: string;
  accountId?: number | null;
  attempt: number;
  createdAt: string;
}

const paymentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    initiateQrPayment: builder.mutation<
      { success: boolean; data: PaymentIntentData; message?: string },
      {
        orderId?: number;
        tableId?: number;
        checkoutAll?: boolean;
        amount?: number;
        accountId?: number;
        remarks?: string;
      }
    >({
      query: (body) => ({
        url: "payment/qr/initiate",
        method: "POST",
        body,
      }),
    }),
    getQrPaymentStatus: builder.query<
      { success: boolean; data: PaymentIntentData },
      number
    >({
      query: (id) => `payment/qr/${id}/status`,
    }),
    cancelQrPayment: builder.mutation<
      { success: boolean; data: PaymentIntentData },
      number
    >({
      query: (id) => ({
        url: `payment/qr/${id}/cancel`,
        method: "POST",
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useInitiateQrPaymentMutation,
  useLazyGetQrPaymentStatusQuery,
  useCancelQrPaymentMutation,
} = paymentApi;
