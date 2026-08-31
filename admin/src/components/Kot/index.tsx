import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { format } from "date-fns";

export type KotOrderItem = {
  id: number | string;
  productName?: string;
  quantity: number;
};

export type KotOrderInfo = {
  orderType?: string; // dineIn | takeaway | delivery etc.
  orderStartTime?: string | Date | null;
  table?: { id?: number; tableNo?: string; name?: string } | null;
  createdBy?: { name?: string; table?: { name?: string } } | null;
  takeAwayName?: string | null;
};

export interface KotData {
  kotNumber?: string | number;
  order?: KotOrderInfo | null;
  orderItems?: KotOrderItem[];
}

interface KotProps {
  data: KotData;
  className?: string;
}

const Kot = forwardRef<HTMLDivElement, KotProps>(({ data, className }, ref) => {
  const items = Array.isArray(data?.orderItems) ? data.orderItems : [];
  const printedBy = useSelector((s: RootState) => s.auth.username);

  const totalDish = items.length;
  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

  return (
    <div
      ref={ref}
      id="kot-print"
      className={`print-surface bg-white p-5 h-fit kot-print text-black ${className ?? ""}`}
    >
      <div className="text-center kot-title text-[20px] font-bold tracking-wide mb-3">
        KOT {data?.kotNumber ?? "-"}
      </div>
      <div className="flex justify-between text-[12px] text-gray-800">
        <div className="flex flex-col gap-[2px]">
          <div className="flex">
            <span className="font-semibold">Type:</span>&nbsp;
            {formatOrderType(data?.order?.orderType)}
          </div>
          <div className="flex">
            <span className="font-semibold">Order By:</span>&nbsp;
            {data?.order?.createdBy?.table?.name ||
              data?.order?.table?.tableNo ||
              "-"}
          </div>
          <div>
            <span className="font-semibold">Order At:</span>&nbsp;
            {data?.order?.orderStartTime
              ? format(
                  new Date(data?.order?.orderStartTime),
                  "dd LLL yyyy hh:mm a",
                )
              : "-"}
          </div>
        </div>
        <div className="text-right">
          <div>
            <span className="font-semibold">
              {data?.order?.orderType === "dineIn" ? "Table:" : "Customer:"}
            </span>
            &nbsp;
            {data?.order?.orderType === "dineIn" && data?.order?.table?.tableNo}
            {data?.order?.orderType === "takeaway" && data?.order?.takeAwayName}
          </div>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-gray-400 divider-dashed"></div>

      <div className="grid grid-cols-12 text-[12px] font-semibold">
        <div className="col-span-8 flex">S.N Dishes</div>
        <div className="col-span-4 text-right">QTY</div>
      </div>

      <div className="my-2 border-t border-dashed border-gray-300 divider-dashed"></div>

      <div className="space-y-3 leading-[10px]">
        {items.map((it, index) => (
          <div key={String(it.id)} className="grid grid-cols-12 ">
            <div className="col-span-8 flex gap-2">
              <span>{index + 1}.</span>
              <span>{it.productName || "-"}</span>
            </div>
            <div className="col-span-4 text-right">{it.quantity}</div>
          </div>
        ))}
      </div>

      <div className="my-3 border-t border-dashed border-gray-400 divider-dashed"></div>
      <div className="grid grid-cols-12 font-semibold text-[12px]">
        <div className="col-span-8 flex">Total (Dish/QTY)</div>
        <div className="col-span-4 text-right">
          {totalDish}/{totalQty}
        </div>
      </div>

      <div className="flex mt-4">
        <div className="flex flex-col items-start">
          <p>Printed By: {printedBy || data?.order?.createdBy?.name || "-"}</p>
          <p>Printed At: {format(new Date(), "dd LLL yyyy hh:mm a")}</p>
        </div>
      </div>

      <div className="text-center mt-6 text-gray-700">Thank You!</div>
    </div>
  );
});

function formatOrderType(v?: string) {
  if (!v) return "-";
  if (v.toLowerCase() === "dinein") return "Dine In";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export default Kot;
