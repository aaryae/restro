import { api } from "../store/api";

export interface PaymentIntegration {
  id: number;
  name: string;
  provider: string;
  accountId?: number | null;
  account?: { id: number; name: string; accountType: string } | null;
  merchantId: string;
  merchantCode?: string | null;
  merchantCategoryCode?: string | null;
  merchantName: string;
  acquirerId?: string | null;
  merchantCity?: string | null;
  merchantPostalCode?: string | null;
  username?: string | null;
  npiUsername?: string | null;
  enabled: boolean;
  isActive: boolean;
  // Secrets are never returned; these flags indicate whether one is stored.
  hasPassword: boolean;
  hasWebhookToken: boolean;
  hasNpiPrivateKey: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntegrationInput {
  name: string;
  accountId?: number | null;
  merchantId: string;
  merchantCode?: string;
  merchantCategoryCode?: string;
  merchantName: string;
  acquirerId?: string;
  merchantCity?: string;
  merchantPostalCode?: string;
  username?: string;
  npiUsername?: string;
  // Write-only secrets; omit/blank on edit to keep existing values.
  password?: string;
  webhookToken?: string;
  npiPrivateKey?: string;
  enabled?: boolean;
  isActive?: boolean;
}

const paymentIntegrationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentIntegrations: builder.query<
      { success: boolean; data: PaymentIntegration[] },
      void
    >({
      query: () => "payment-integration",
      providesTags: ["payment-integration"],
    }),
    getActiveIntegrationAccounts: builder.query<
      { success: boolean; data: number[] },
      void
    >({
      query: () => "payment-integration/active-accounts",
      providesTags: ["payment-integration"],
    }),
    getPaymentIntegration: builder.query<
      { success: boolean; data: PaymentIntegration },
      number
    >({
      query: (id) => `payment-integration/${id}`,
      providesTags: ["payment-integration"],
    }),
    createPaymentIntegration: builder.mutation<
      { success: boolean; data: PaymentIntegration },
      PaymentIntegrationInput
    >({
      query: (body) => ({ url: "payment-integration", method: "POST", body }),
      invalidatesTags: ["payment-integration"],
    }),
    updatePaymentIntegration: builder.mutation<
      { success: boolean; data: PaymentIntegration },
      { id: number; body: PaymentIntegrationInput }
    >({
      query: ({ id, body }) => ({
        url: `payment-integration/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["payment-integration"],
    }),
    activatePaymentIntegration: builder.mutation<
      { success: boolean; data: PaymentIntegration },
      number
    >({
      query: (id) => ({
        url: `payment-integration/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["payment-integration"],
    }),
    deletePaymentIntegration: builder.mutation<
      { success: boolean; data: { id: number } },
      number
    >({
      query: (id) => ({ url: `payment-integration/${id}`, method: "DELETE" }),
      invalidatesTags: ["payment-integration"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetPaymentIntegrationsQuery,
  useGetActiveIntegrationAccountsQuery,
  useGetPaymentIntegrationQuery,
  useCreatePaymentIntegrationMutation,
  useUpdatePaymentIntegrationMutation,
  useActivatePaymentIntegrationMutation,
  useDeletePaymentIntegrationMutation,
} = paymentIntegrationApi;
