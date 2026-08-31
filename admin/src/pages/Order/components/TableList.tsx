import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import RestroTable from "@/components/RestroTable";
import { FLOOR_URL } from "@/constants/apiUrlConstants";
import { LIST_LIMIT } from "@/constants/listLimits";
import { useUpdateFloorMutation } from "@/redux/services/floor";
import { useAppSelector } from "@/redux/store/hooks";
import Drawer from "@/components/Drawer";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { ORDER_ADD_ROUTE, TABLE_ADD_ROUTE } from "@/routes/routeNames";
import { buildQueryString } from "@/utils/generalHelper";
import { buildCheckoutPath } from "@/utils/checkoutNavigation";
import PageContent from "@/components/PageContent";
import TakeAwayOrders from "./TakeAwayOrders";
import Select from "@/components/Select";
import ViewTableOrder from "./ViewTableOrder";
import CustomDialog from "@/components/Dialog";
import ChooseTable from "./TransferModel/ChooseTable";
import { Repeat } from "lucide-react";
import "./TableListCss.css";
import "../posBrand.css";

export default function TableList() {
  const [paidItemsByOrder, setPaidItemsByOrder] = useState<
    Record<number, number[]>
  >({});
  const [ordersRefresh, setOrdersRefresh] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("all");
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  const { query, handlePagination } = usePagination({
    page: 1,
    limit: LIST_LIMIT,
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

  const { data: allTables, refetch: refetchTables } = useGetApiQuery({
    url: queryString,
  });

  const { data: floorsData } = useGetApiQuery({
    url: `${FLOOR_URL}list?page=1&limit=${LIST_LIMIT}`,
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

  const [restroTableId, setRestroTableId] = useState<number | null>(null);
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTableId, setTransferTableId] = useState<number | null>(null);
  const navigate = useNavigate();

  function handleCheckout(
    tableId: number,
    orderId: number | null | number[],
    selectedItemIds?: number[],
  ) {
    setOpenDrawer(false);
    navigate(
      buildCheckoutPath({
        tableId,
        orderId,
        selectedItemIds,
      }),
    );
  }

  function handleTableClick(id: number, status: string) {
    if (status === "available") {
      navigate(`${ORDER_ADD_ROUTE}${id}`);
    } else {
      setRestroTableId(id);
      setOpenDrawer(true);
    }
  }

  function handleOpenTransfer(tableId: number) {
    setOpenDrawer(false);
    setTransferTableId(tableId);
    setTransferOpen(true);
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
            onOpenTransfer={() => {
              setTransferTableId(null);
              setTransferOpen(true);
            }}
          />

          {allTables?.data?.data && (
            <Tables
              tables={allTables?.data?.data}
              chooseTable={handleTableClick}
              selectedStatus={selectedStatus}
              selectedFloor={selectedFloor}
            />
          )}
          <div className="mt-10">
            <TakeAwayOrders />
          </div>
        </div>
        <Drawer
          isOpen={openDrawer}
          setIsOpen={setOpenDrawer}
          width="w-full"
          className="drawer-container"
          contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
        >
          <ViewTableOrder
            id={restroTableId}
            handleCheckout={handleCheckout}
            onOpenTransfer={handleOpenTransfer}
            onTableCleared={refetchTables}
            onClose={() => setOpenDrawer(false)}
          />
        </Drawer>
        <CustomDialog
          dialogOpen={transferOpen}
          setDialogOpen={setTransferOpen}
          title="Transfer Table"
          titleDescription="Move orders from one table to another."
          contentClassName="max-w-xl"
        >
          <ChooseTable
            tableId={transferTableId}
            onClose={() => setTransferOpen(false)}
          />
        </CustomDialog>
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
    <div className="mt-5 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 min-[390px]:gap-3.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
  onOpenTransfer: () => void;
}

function Header({
  selectedStatus,
  selectedFloor,
  onStatusChange,
  onFloorChange,
  floorOptions = [],
  onOpenTransfer,
}: HeaderProps) {
  const TableStatus = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Unavailable" },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="pos-segment inline-flex flex-wrap rounded-lg p-1">
          {TableStatus.map((option) => (
            <button
              key={`status-${option.value}`}
              type="button"
              className="pos-segment-item rounded-md px-3 py-1.5 text-[13px] font-medium"
              data-active={selectedStatus === option.value}
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
        <div className="min-w-[150px]">
          <Select
            value={selectedFloor || "all"}
            options={floorOptions}
            onValueChange={(next) => onFloorChange(next === "all" ? "" : next)}
            triggerClassName="h-9 min-w-[150px] font-medium"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onOpenTransfer}
          className="pos-ghost-button inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium"
        >
          <Repeat size={14} strokeWidth={2.25} className="shrink-0" />
          <span>Transfer Table</span>
        </button>
        <div className="pos-legend flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1.5">
            <span className="pos-dot-available h-2 w-2 rounded-full" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="pos-dot-occupied h-2 w-2 rounded-full" />
            Occupied
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="pos-dot-unavailable h-2 w-2 rounded-full" />
            Unavailable
          </span>
        </div>
      </div>
    </div>
  );
}
