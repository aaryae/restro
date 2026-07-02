import React, { useState } from "react";
import { handleError, handleResponse } from "@/utils/responseHandler";
import {
  PaymentIntegration,
  useGetPaymentIntegrationsQuery,
  useActivatePaymentIntegrationMutation,
  useDeletePaymentIntegrationMutation,
} from "@/redux/services/paymentIntegration";
import NepalPayIntegrationModal from "./NepalPayIntegrationModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentIntegrationsPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { data, refetch, isFetching } = useGetPaymentIntegrationsQuery(
    undefined,
    { skip: !isOpen },
  );
  const [activate] = useActivatePaymentIntegrationMutation();
  const [remove] = useDeletePaymentIntegrationMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentIntegration | null>(null);

  const integrations: PaymentIntegration[] = data?.data || [];

  const handleActivate = async (id: number) => {
    try {
      const res = await activate(id).unwrap();
      handleResponse({ res, onSuccess: () => refetch() });
    } catch (error) {
      handleError({ error });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await remove(id).unwrap();
      handleResponse({ res, onSuccess: () => refetch() });
    } catch (error) {
      handleError({ error });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: PaymentIntegration) => {
    setEditing(item);
    setFormOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Payment Integrations (NepalPay)
          </h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreate}
              className="bg-[#36a77d] hover:bg-[#36a77d]/80 text-white px-4 py-1.5 rounded-md text-sm"
            >
              + Add Integration
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {isFetching ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : integrations.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No integrations yet. The system is using the .env fallback. Click
              "Add Integration" to configure NepalPay from here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Merchant ID</th>
                  <th className="py-2">Linked Account</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.merchantId}</td>
                    <td className="py-2">{item.account?.name || "-"}</td>
                    <td className="py-2">
                      {item.isActive ? (
                        <span className="px-2 py-0.5 text-[12px] rounded bg-green-50 text-green-700 border border-green-300">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[12px] rounded bg-gray-50 text-gray-600 border border-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center justify-end gap-2">
                        {!item.isActive && (
                          <button
                            type="button"
                            onClick={() => handleActivate(item.id)}
                            className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="px-2 py-1 text-xs rounded border hover:bg-gray-50 text-[#0090DD]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="px-2 py-1 text-xs rounded border hover:bg-gray-50 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <NepalPayIntegrationModal
        isOpen={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default PaymentIntegrationsPanel;
