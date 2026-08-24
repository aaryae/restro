import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { QRCodeCanvas } from "qrcode.react";
import React from "react";

type Props = {
  qrImageUrl?: string | null;
  qrPayload?: string | null;
  amount: number;
  merchantTxnRef?: string;
  expiresAt?: string | null;
  status?: string;
  className?: string;
};

const DynamicQrDisplay: React.FC<Props> = ({
  qrImageUrl,
  qrPayload,
  amount,
  merchantTxnRef,
  expiresAt,
  status,
  className = "",
}) => {
  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleTimeString()
    : null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {qrImageUrl ? (
        <img
          src={buildAssetUrl(qrImageUrl)}
          alt="Dynamic payment QR"
          className="w-full max-w-[280px] rounded-md border bg-white p-2"
        />
      ) : qrPayload ? (
        <div className="rounded-md border bg-white p-3">
          <QRCodeCanvas value={qrPayload} size={256} level="M" />
        </div>
      ) : (
        <p className="text-sm text-amber-700">QR not available from bank response.</p>
      )}
      <p className="text-sm font-medium text-gray-800">
        Amount: Rs. {amount.toFixed(2)}
      </p>
      {merchantTxnRef && (
        <p className="text-xs text-gray-500 break-all text-center max-w-[280px]">
          Ref: {merchantTxnRef}
        </p>
      )}
      {status === "pending" && expiryLabel && (
        <p className="text-xs text-gray-500">Expires around {expiryLabel}</p>
      )}
      {status === "pending" && (
        <p className="text-xs text-primaryColor animate-pulse">
          Waiting for customer to pay…
        </p>
      )}
    </div>
  );
};

export default DynamicQrDisplay;
