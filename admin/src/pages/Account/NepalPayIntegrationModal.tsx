import React, { useMemo } from "react";
import { handleError, handleResponse } from "@/utils/responseHandler";
import {
  PaymentIntegration,
  PaymentIntegrationInput,
  useCreatePaymentIntegrationMutation,
  useUpdatePaymentIntegrationMutation,
} from "@/redux/services/paymentIntegration";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import NepalPayIntegrationForm from "./NepalPayIntegrationForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editing?: PaymentIntegration | null;
  draftMode?: boolean;
  initialDraft?: PaymentIntegrationInput | null;
  onSaveDraft?: (payload: PaymentIntegrationInput) => void;
  hideAccountSelect?: boolean;
  accountId?: string;
}

const NepalPayIntegrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  editing,
  draftMode = false,
  initialDraft,
  onSaveDraft,
  hideAccountSelect = false,
  accountId,
}) => {
  const isEdit = Boolean(editing);

  const { data: accountsData } = useGetApiQuery(
    { url: buildQueryString("account/list", { page: 1, limit: 100 }) },
    { skip: !isOpen || hideAccountSelect },
  );

  const accountOptions = useMemo(() => {
    const accounts: any[] = accountsData?.data?.data || [];
    return accounts
      .filter((a) => a?.accountType === "bank" || a?.accountType === "wallet")
      .map((a) => ({
        value: String(a.id),
        label: `${a.name} (${a.accountType})`,
      }));
  }, [accountsData]);

  const [createIntegration, { isLoading: creating }] =
    useCreatePaymentIntegrationMutation();
  const [updateIntegration, { isLoading: updating }] =
    useUpdatePaymentIntegrationMutation();

  const handleSubmit = async (body: PaymentIntegrationInput) => {
    if (draftMode) {
      onSaveDraft?.(body);
      onClose();
      return;
    }

    try {
      const res =
        isEdit && editing
          ? await updateIntegration({ id: editing.id, body }).unwrap()
          : await createIntegration(body).unwrap();

      handleResponse({ res, onSuccess: () => onSuccess?.() });
      onClose();
    } catch (error) {
      handleError({ error });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            NepalPay Setup
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto">
          <NepalPayIntegrationForm
            editing={editing}
            initialDraft={initialDraft}
            accountId={accountId}
            accountOptions={accountOptions}
            hideAccountSelect={hideAccountSelect}
            showActions
            submitLabel={draftMode ? "Save setup" : "Save Payment Mode"}
            isSubmitting={creating || updating}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default NepalPayIntegrationModal;
