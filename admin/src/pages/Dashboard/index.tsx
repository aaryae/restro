import { useState, useEffect, useCallback, useMemo } from "react";
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
import { FLOOR_URL } from "@/constants/apiUrlConstants";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useNavigate } from "react-router-dom";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";
import { buildQueryString } from "@/utils/generalHelper";

import Button from "@/components/Button";

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date);
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function Dashboard() {
  const [checkoutTableId, setCheckoutTableId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  const { query, handlePagination } = usePagination({
    page: 1,
    limit: 10,
    search: {
      status: selectedStatus || undefined,
    },
  });

  const handleStatusChange = useCallback(
    (status: string) => {
      const newStatus = selectedStatus === status ? null : status;
      setSelectedStatus(newStatus);

      handlePagination({
        search: {
          ...query.search,
          status: newStatus || undefined,
        },
        page: 1,
      });
    },
    [selectedStatus, handlePagination, query.search],
  );

  const handleFloorChange = useCallback(
    (floor: string) => {
      const newFloor = selectedFloor === floor ? null : floor;
      setSelectedFloor(newFloor);

      handlePagination({
        search: {
          ...query.search,
          floor: newFloor || undefined,
        },
        page: 1,
      });
    },
    [selectedFloor, handlePagination, query.search],
  );

  const queryString = useMemo(() => {
    return buildQueryString(`${TABLE_URL}list`, query);
  }, [query]);

  const { data: allTables } = useGetApiQuery({
    url: queryString,
  });

  const { data: floorsData } = useGetApiQuery({
    url: `${FLOOR_URL}list?page=1&limit=100`, // Fetch all floors with a high limit
  });

  const floorOptions = useMemo(() => {
    const defaultOptions = [{ value: "all", label: "All Floors" }];

    if (!floorsData?.data?.data) return defaultOptions;

    const floorOptions = floorsData.data.data.map((floor: any) => ({
      value: floor.id.toString(),
      label: floor.name || `Floor ${floor.floorNo}`,
    }));

    return [...defaultOptions, ...floorOptions];
  }, [floorsData]);

  useEffect(() => {
    if (allTables?.data) {
      handlePagination({
        total: allTables.data.total,
        totalPages: allTables.data.totalPages,
      });
    }
  }, [allTables, handlePagination]);

  console.log(allTables, "all tables");
  const [checkoutOrderId, setCheckoutOrderId] = useState<
    number | null | [number]
  >(null);

  function handleCheckout(tableId: number, orderId: number | null | [number]) {
    setCheckoutTableId(tableId);
    setCheckoutOrderId(orderId);
  }

  function closeCheckoutModal() {
    setCheckoutTableId(null);
  }

  const [restroTableId, setRestroTableId] = useState<number | null>(null);
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const navigate = useNavigate();

  function handleTableClick(id: number, status: string) {
    if (status === "available") {
      navigate(`${ORDER_ADD_ROUTE}${id}`);
    } else {
      setRestroTableId(id);
      setOpenDrawer(true);
    }
  }

  return (
    <PageContent>
      <div>
        <Header
          selectedStatus={selectedStatus}
          selectedFloor={selectedFloor}
          onStatusChange={handleStatusChange}
          onFloorChange={handleFloorChange}
          floorOptions={floorOptions}
        />

        {allTables?.data?.data && (
          <Tables
            tables={allTables?.data?.data}
            chooseTable={handleTableClick}
            selectedStatus={selectedStatus}
            selectedFloor={selectedFloor}
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

interface TablesProps {
  tables: any;
  chooseTable: (id: number, status: string) => void;
  selectedStatus: string | null;
  selectedFloor: string | null;
}

function Tables({
  tables,
  chooseTable,
  selectedStatus,
  selectedFloor,
}: TablesProps) {
  const filteredTables = tables?.filter((table: any) => {
    const statusMatch =
      !selectedStatus ||
      selectedStatus === "all" ||
      table.status === selectedStatus;
    const floorMatch =
      !selectedFloor || table.floorId?.toString() === selectedFloor;
    return statusMatch && floorMatch;
  });

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {filteredTables?.map((table: any) => (
        <RestroTable
          key={table.id}
          onClick={() => chooseTable(table.id, table.status)}
          table={table}
        />
      ))}
    </div>
  );
}

interface FloorOption {
  value: string;
  label: string;
}

interface HeaderProps {
  selectedStatus: string | null;
  selectedFloor: string | null;
  onStatusChange: (status: string) => void;
  onFloorChange: (floor: string) => void;
  floorOptions: FloorOption[];
}

function Header({
  selectedStatus,
  selectedFloor,
  onStatusChange,
  onFloorChange,
  floorOptions = [],
}: HeaderProps) {
  const userName = useAppSelector((state) => state.profile.username);
  const todayDate = format(new Date(), "PPPP");

  const navigate = useNavigate();
  const TableStatus = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Unavailable" },
  ];

  return (
    <>
      <div className="w-full flex justify-between">
        <div className="flex flex-col">
          <div className="text-left text-2xl font-bold">
            Good {getPartOfDay()}, {userName}
          </div>
          <div className="flex">
            <span className="text-blue-500 font-semibold">{todayDate}</span>
          </div>
        </div>
        {/* <a
        href={FRONTEND_BASE_URL}
        target="_blank"
        className="flex items-center gap-4"
        rel="noopener noreferrer"
      >
        <span className="flex gap-3 text-base font-semibold">
          GOTO YOUR WEBSITE
          <ExternalLink className="size-5" />
        </span>
      </a> */}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2 items-center mt-4">
          <div className="flex flex-wrap gap-2">
            {TableStatus.map((option) => (
              <button
                key={`status-${option.value}`}
                className={`px-6 py-4 text-sm font-medium rounded-full border text-[15px] ${
                  selectedStatus === option.value
                    ? "bg-blue-500 text-white border-none cursor-default"
                    : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => {
                  if (selectedStatus !== option.value) {
                    onStatusChange(option.value);
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="ml-4">
            <select
              value={selectedFloor || "all"}
              onChange={(e) =>
                onFloorChange(e.target.value === "all" ? "" : e.target.value)
              }
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
            >
              {floorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            className=" bg-primaryColor text-white px-6 rounded-lg py-[12px]"
            handleClick={() => navigate(ORDER_ADD_ROUTE)}
          >
            Create Order
          </Button>
        </div>
      </div>
    </>
  );
}
