import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import RestroTable from "@/components/RestroTable";
import { FLOOR_URL } from "@/constants/apiUrlConstants";
import { useUpdateFloorMutation } from "@/redux/services/floor";
import { useAppSelector } from "@/redux/store/hooks";
import Drawer from "@/components/Drawer";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { ORDER_ADD_ROUTE, TABLE_ADD_ROUTE } from "@/routes/routeNames";
import { buildQueryString } from "@/utils/generalHelper";
import PageContent from "@/components/PageContent";
import TakeAwayOrders from "./TakeAwayOrders";
import Select from "@/components/Select";
import ViewTableOrder from "./ViewTableOrder";
import CheckoutModal from "./CheckoutModal";
import { Plus } from "lucide-react";
import "./TableListCss.css";

export default function TableList() {
  const [checkoutTableId, setCheckoutTableId] = useState<number | null>(null);
  const [checkoutSelectedItemIds, setCheckoutSelectedItemIds] = useState<
    number[] | null
  >(null);
  const [paidItemsByOrder, setPaidItemsByOrder] = useState<
    Record<number, number[]>
  >({});
  const [ordersRefresh, setOrdersRefresh] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("all");
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  const { query, handlePagination } = usePagination({
    page: 1,
    limit: 10,
    search: {
      status:
        selectedStatus === "all" ? undefined : selectedStatus || undefined,
    },
  });

  const handleStatusChange = useCallback(
    (status: string) => {
      // Keep "all" selected when chosen; toggle others on/off
      let newStatus: string | null;
      if (status === "all") {
        newStatus = "all";
      } else {
        newStatus = selectedStatus === status ? null : status;
      }
      setSelectedStatus(newStatus);

      handlePagination({
        search: {
          ...query.search,
          status: newStatus === "all" ? undefined : newStatus || undefined,
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

  // Hydrate paid items map from localStorage so indicators survive full page reload
  useEffect(() => {
    try {
      const raw = localStorage.getItem("paidItemsByOrder");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setPaidItemsByOrder(parsed);
        }
      }
    } catch {}
  }, []);

  // Persist paid items map to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "paidItemsByOrder",
        JSON.stringify(paidItemsByOrder),
      );
    } catch {}
  }, [paidItemsByOrder]);

  console.log(allTables, "all tables");
  const [checkoutOrderId, setCheckoutOrderId] = useState<
    number | null | [number]
  >(null);

  function handleCheckout(
    tableId: number,
    orderId: number | null | [number],
    selectedItemIds?: number[],
  ) {
    setCheckoutTableId(tableId);
    setCheckoutOrderId(orderId);
    setCheckoutSelectedItemIds(selectedItemIds ?? null);
  }

  function closeCheckoutModal() {
    setCheckoutTableId(null);
  }

  // Update paid item indicators after successful selective checkout
  const handleCheckoutSuccessInList = (
    tableId: number | null,
    orderId: number | null | [number],
    paidItemIds: number[],
  ) => {
    if (Array.isArray(orderId) || orderId == null) return;
    setPaidItemsByOrder((prev) => {
      const existing = prev[orderId] || [];
      const merged = Array.from(new Set([...existing, ...paidItemIds]));
      return { ...prev, [orderId]: merged };
    });
    // Trigger refetch of active-orders drawer
    setOrdersRefresh((n) => n + 1);
  };

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
    <>
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
          <TakeAwayOrders />
        </div>
        <Drawer
          isOpen={openDrawer}
          setIsOpen={setOpenDrawer}
          width="w-full"
          className="drawer-container"
        >
          <ViewTableOrder
            id={restroTableId}
            handleCheckout={handleCheckout}
            paidItemsByOrder={paidItemsByOrder}
            ordersRefresh={ordersRefresh}
          />
        </Drawer>
        <CheckoutModal
          isOpen={checkoutTableId !== null}
          onClose={closeCheckoutModal}
          tableId={checkoutTableId}
          orderId={checkoutOrderId}
          selectedItemIds={checkoutSelectedItemIds ?? undefined}
          onCheckoutSuccess={handleCheckoutSuccessInList}
        />
      </PageContent>
    </>
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
    let statusMatch = !selectedStatus || selectedStatus === "all";
    if (!statusMatch) {
      switch (selectedStatus) {
        case "available":
          statusMatch = table.status === "available" && table.floor.isActive;
          break;
        case "occupied":
          statusMatch = table.status === "occupied" && table.floor.isActive;
          break;
        case "maintenance":
          statusMatch = table.status === "maintenance" && table.floor.isActive;
          break;
        default:
          statusMatch = table.status === selectedStatus;
      }
    }
    const floorMatch =
      !selectedFloor || table.floorId?.toString() === selectedFloor;
    return statusMatch && floorMatch;
  });

  return (
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {!filteredTables || filteredTables.length === 0 ? (
        <div className="col-span-full text-center text-gray-500 py-8">
          No table found
        </div>
      ) : (
        filteredTables.map((table: any) => (
          <RestroTable
            key={table.id}
            onClick={() => chooseTable(table.id, table.status)}
            table={table}
          />
        ))
      )}
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
  const navigate = useNavigate();
  const TableStatus = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Unavailable" },
  ];

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2 items-center mt-4">
          <div className="flex flex-wrap gap-2 items-center">
            {TableStatus.map((option) => (
              <button
                key={`status-${option.value}`}
                className={`px-6 py-4 text-sm font-medium rounded-full border text-[15px] ${
                  selectedStatus === option.value
                    ? "bg-primaryColor text-white border-none cursor-default"
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
            <div className="ml-4 min-w-[160px]">
              <Select
                value={selectedFloor || "all"}
                options={floorOptions}
                onValueChange={(next) =>
                  onFloorChange(next === "all" ? "" : next)
                }
                triggerClassName="h-10 min-w-[160px] font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
