import React, { useState } from "react";
import PageContent from "@/components/PageContent";
import { dummyTables } from "../../tempDatas/table";
import { ExternalLink } from "lucide-react";
import { FRONTEND_BASE_URL } from "@/constants";
import { format, getHours } from "date-fns";
import RestroTable from "@/components/RestroTable";
import { useAppSelector } from "@/redux/store/hooks";
import Drawer from "@/components/Drawer";
import ViewTableOrder from "./ViewTableOrder";
import { dummyOrders } from "../../tempDatas/order";
import CheckoutModal from "./CheckoutModal";

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date);
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function Dashboard() {
  const [restroTableId, setRestroTableId] = useState<number | null>(null);
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [checkoutTableId, setCheckoutTableId] = useState<number | null>(null);

  function handleTableClick(id: number) {
    setRestroTableId(id);
    setOpenDrawer(true);
  }

  function handleCheckout(tableId: number) {
    setCheckoutTableId(tableId);
  }

  function closeCheckoutModal() {
    setCheckoutTableId(null);
  }

  const selectedTable = dummyTables.find(
    (table) => table.id === checkoutTableId,
  );
  const selectedOrder = dummyOrders.find(
    (order) => order.tableId === String(checkoutTableId),
  );

  return (
    <PageContent>
      <div>
        <Header />
        <Tables chooseTable={handleTableClick} />
      </div>
      <Drawer
        isOpen={openDrawer}
        setIsOpen={setOpenDrawer}
        width="w-full lg:w-[30%]"
      >
        <ViewTableOrder id={restroTableId} onCheckout={handleCheckout} />
      </Drawer>
      <CheckoutModal
        isOpen={checkoutTableId !== null}
        onClose={closeCheckoutModal}
        table={selectedTable}
        order={selectedOrder}
      />
    </PageContent>
  );
}

function Tables({ chooseTable }: { chooseTable: (id: number) => void }) {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {dummyTables.map((table) => (
        <RestroTable key={table.id} onClick={chooseTable} table={table} />
      ))}
    </div>
  );
}

function Header() {
  const userName = useAppSelector((state) => state.profile.username);
  const todayDate = format(new Date(), "PPPP");
  return (
    <div className="w-full flex justify-between">
      <div className="flex flex-col">
        <div className="text-left text-2xl font-bold">
          Good {getPartOfDay()}, {userName}
        </div>
        <div className="flex">
          <span className="text-blue-500 font-semibold">{todayDate}</span>
        </div>
      </div>
      <a
        href={FRONTEND_BASE_URL}
        target="_blank"
        className="flex items-center gap-4"
        rel="noopener noreferrer"
      >
        <span className="flex gap-3 text-base font-semibold">
          GOTO YOUR WEBSITE
          <ExternalLink className="size-5" />
        </span>
      </a>
    </div>
  );
}
