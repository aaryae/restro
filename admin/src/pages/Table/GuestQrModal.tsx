import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, RefreshCw, Printer } from "lucide-react";
import CustomDialog from "@/components/Dialog";
import Button from "@/components/Button";
import {
  useGetApiQuery,
  useCreateApiMutation,
} from "@/redux/services/crudApi";
import { TABLE_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { appToast } from "@/components/Toast";

type GuestQrModalProps = {
  tableId: number | null;
  tableNo?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function GuestQrModal({
  tableId,
  tableNo,
  open,
  onOpenChange,
}: GuestQrModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState<{
    guestUrl: string;
    tableNo: string;
    guestToken: string;
  } | null>(null);

  const { data, isFetching, refetch } = useGetApiQuery(
    { url: `${TABLE_URL}${tableId}/guest-qr` },
    { skip: !open || tableId == null },
  );
  const [regenerate, { isLoading: regenerating }] = useCreateApiMutation();

  useEffect(() => {
    if (data?.success && data?.data) {
      setQr({
        guestUrl: data.data.guestUrl,
        tableNo: data.data.tableNo,
        guestToken: data.data.guestToken,
      });
    }
  }, [data]);

  const title = useMemo(
    () => `Guest QR · Table ${qr?.tableNo || tableNo || ""}`.trim(),
    [qr?.tableNo, tableNo],
  );

  const handleCopy = async () => {
    if (!qr?.guestUrl) return;
    try {
      await navigator.clipboard.writeText(qr.guestUrl);
      appToast.success("Guest link copied");
    } catch {
      appToast.error("Could not copy the link");
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=480,height=720",
    );
    if (!win) {
      appToast.warning("Allow pop-ups to print the QR");
      return;
    }
    const markup = printRef.current.innerHTML;
    win.document.write(`<!doctype html><html><head><title>${title}</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 32px; color: #1a1410; }
        h1 { font-size: 22px; margin: 0 0 8px; }
        p { color: #6b5e54; margin: 0 0 18px; }
        .box { display: inline-block; padding: 18px; border: 1px solid #e7ddd3; border-radius: 16px; }
        .url { margin-top: 16px; font-size: 11px; word-break: break-all; color: #6b5e54; }
      </style></head><body>${markup}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleRegenerate = async () => {
    if (tableId == null) return;
    try {
      const response = await regenerate({
        url: `${TABLE_URL}${tableId}/guest-qr/regenerate`,
        body: {},
      }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          if (response?.data) {
            setQr({
              guestUrl: response.data.guestUrl,
              tableNo: response.data.tableNo,
              guestToken: response.data.guestToken,
            });
          }
          void refetch();
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <CustomDialog
      title={title}
      titleDescription="Guests scan this to see the menu and request the bill. No login."
      dialogOpen={open}
      setDialogOpen={onOpenChange}
      contentClassName="max-w-md"
      closeOnOutsideClick
    >
      <div className="space-y-4">
        {isFetching && !qr ? (
          <p className="text-sm text-slate-500">Preparing QR…</p>
        ) : qr ? (
          <>
            <div
              ref={printRef}
              className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h1 className="text-lg font-semibold text-slate-900">
                Table {qr.tableNo}
              </h1>
              <p className="mb-3 text-sm text-slate-500">
                Scan for menu &amp; bill request
              </p>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <QRCodeCanvas value={qr.guestUrl} size={220} level="M" />
              </div>
              <p className="mt-3 max-w-full break-all text-center text-[11px] text-slate-500">
                {qr.guestUrl}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                handleClick={() => void handleCopy()}
                className="!bg-slate-100 !text-slate-700"
                leftSection={<Copy size={15} />}
              >
                Copy
              </Button>
              <Button
                type="button"
                handleClick={handlePrint}
                className="!bg-slate-100 !text-slate-700"
                leftSection={<Printer size={15} />}
              >
                Print
              </Button>
              <Button
                type="button"
                disabled={regenerating}
                handleClick={() => void handleRegenerate()}
                className="!bg-slate-100 !text-slate-700"
                leftSection={<RefreshCw size={15} />}
                isLoading={regenerating}
              >
                New QR
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Regenerating invalidates the old sticker. Print the new QR and
              replace it on the table.
            </p>
          </>
        ) : (
          <p className="text-sm text-rose-600">Could not load this table QR.</p>
        )}
      </div>
    </CustomDialog>
  );
}
