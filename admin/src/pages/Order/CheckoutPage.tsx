import CheckoutView from "./components/CheckoutModal";
import { ORDER_LIST_ROUTE } from "@/routes/routeNames";
import { parseCheckoutSearchParams } from "@/utils/checkoutNavigation";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { tableId, orderId, selectedItemIds } = useMemo(
    () => parseCheckoutSearchParams(searchParams.toString()),
    [searchParams],
  );

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(ORDER_LIST_ROUTE);
  };

  if (orderId == null && tableId == null) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-base font-semibold text-slate-800">
          Nothing to check out
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Open checkout from a table, takeaway order, or ready KOT.
        </p>
        <button
          type="button"
          onClick={() => navigate(ORDER_LIST_ROUTE)}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primaryColor px-4 text-sm font-medium text-white"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <CheckoutView
      variant="page"
      isOpen
      onClose={handleClose}
      tableId={tableId}
      orderId={orderId as number | null | number[]}
      selectedItemIds={selectedItemIds}
    />
  );
}
