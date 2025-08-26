import { useState } from "react";
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
import { useGetApiQuery } from "@/redux/services/crudApi";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useNavigate } from "react-router-dom";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date);
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function Dashboard() {
  const [checkoutTableId, setCheckoutTableId] = useState<number | null>(null);

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const { data: allTables } = useGetApiQuery({
    url: `${TABLE_URL}list`,
    ...query,
  });

  console.log(allTables, "all tables");
  const [checkoutOrderId, setCheckoutOrderId] = useState<number | null>(null);

  function handleCheckout(tableId: number, orderId: number | null) {
    console.log("checkiiing out", tableId);
    console.log("checkiiing out", orderId);
    setCheckoutTableId(tableId);
    setCheckoutOrderId(orderId);
  }

  function closeCheckoutModal() {
    setCheckoutTableId(null);
  }

  const [restroTableId, setRestroTableId] = useState<number | null>(null);
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const navigate = useNavigate();

  console.log(allTables, "all tables");

  function handleTableClick(id: number, status: string) {
    if (status === "available") {
      navigate(`${ORDER_ADD_ROUTE}${id}`);
    } else {
      setRestroTableId(id);
      setOpenDrawer(true);
    }
  }

  console.log(allTables, "tables all tabls");

  return (
    <PageContent>
      <div>
        <Header />

        {allTables?.data?.data && (
          <Tables
            tables={allTables?.data?.data}
            chooseTable={handleTableClick}
          />
        )}
      </div>
      <Drawer
        isOpen={openDrawer}
        setIsOpen={setOpenDrawer}
        width="w-full lg:w-[30%]"
      >
        <ViewTableOrder id={restroTableId} handleCheckout={handleCheckout} />
      </Drawer>
      <CheckoutModal
        isOpen={checkoutTableId !== null}
        onClose={closeCheckoutModal}
        tableId={checkoutTableId}
        orderId={checkoutOrderId}
      />
    </PageContent>
  );
}

function Tables({
  tables,
  chooseTable,
}: {
  tables: any;
  chooseTable: (id: number) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {tables &&
        tables?.map((table) => (
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
