import Beep from "@/assets/audio/beep.mp3";
import DeleteBeep from "@/assets/audio/DeleteBeep.mp3";
import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import Drawer from "@/components/Drawer";
import Input from "@/components/Input";
import Kot, { type KotData } from "@/components/Kot";
import PageTitle from "@/components/PageTitle";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import Toast from "@/components/Toast";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import useDebounce from "@/hooks/useDebounce";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery, usePatchApiMutation } from "@/redux/services/crudApi";
import {
  useCreateOrderMutation,
  useUpdateOrderMutation,
} from "@/redux/services/orders";
import { ORDER_LIST_ROUTE } from "@/routes/routeNames";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildTableSelectOptions } from "@/utils/tableSelectOptions";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  LayoutGrid,
  List,
  Minus,
  Plus,
  ShoppingBasket,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { FaSearch } from "react-icons/fa";
import { MdShoppingCart } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { z } from "zod";
import { OrderSchema } from "../schema";
import styles from "./AddEditOrder.module.css";

type OrderFormType = z.infer<typeof OrderSchema>;

interface OrderItem {
  id: string;
  departmentId: number;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  specialInstructions?: string;
  status?: string;
  subtotal: number;
  addons?: {
    addonId: number;
    name: string;
    price: number;
    quantity: number;
  }[];
}

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
}

const orderTypeOptions = [
  { value: "dineIn", label: "Dine In" },
  { value: "takeaway", label: "Takeaway" },
  // { value: "delivery", label: "Delivery" },
];

const CREATE_ORDER_DRAFT_KEY = "nirvana-create-order-draft";
const CREATE_ORDER_RESTORE_FLAG = "nirvana-create-order-restore-draft";

type CreateOrderDraft = {
  orderType?: OrderFormType["orderType"];
  tableId?: string;
  takeAwayName?: string;
  orderNote?: string;
  orderItems?: OrderItem[];
};

function readCreateOrderDraft(): CreateOrderDraft | null {
  try {
    const raw = sessionStorage.getItem(CREATE_ORDER_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreateOrderDraft;
  } catch {
    return null;
  }
}

function writeCreateOrderDraft(draft: CreateOrderDraft) {
  try {
    sessionStorage.setItem(CREATE_ORDER_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

function clearCreateOrderDraft() {
  try {
    sessionStorage.removeItem(CREATE_ORDER_DRAFT_KEY);
    sessionStorage.removeItem(CREATE_ORDER_RESTORE_FLAG);
  } catch {
    // ignore
  }
}

function consumeRestoreCreateOrderDraftFlag() {
  try {
    const shouldRestore =
      sessionStorage.getItem(CREATE_ORDER_RESTORE_FLAG) === "1";
    sessionStorage.removeItem(CREATE_ORDER_RESTORE_FLAG);
    return shouldRestore;
  } catch {
    return false;
  }
}

export default function AddEditOrder({
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!orderId;
  const draft =
    !isEditMode && !isComponent && consumeRestoreCreateOrderDraftFlag()
      ? readCreateOrderDraft()
      : null;

  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormType>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      orderType: draft?.orderType || "dineIn",
      tableId: draft?.tableId || tableId || "",
      takeAwayName: draft?.takeAwayName || "",
      orderNote: draft?.orderNote || "",
      orderItems: [],
    },
  });

  const [productSearchInput, setProductSearchInput] = useState("");
  const debouncedProductSearch = useDebounce(productSearchInput, 400);
  const isSearching = Boolean(debouncedProductSearch.trim());

  const { query, handlePagination } = usePagination({
    page: 1,
    limit: 40,
  });

  // Reset to first page when debounced search changes.
  useEffect(() => {
    if (query.page !== 1) {
      handlePagination({ page: 1, limit: query.limit });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProductSearch]);

  const url = useMemo(() => {
    if (!isSearching) {
      return "product/top-selling?limit=8";
    }
    return buildQueryString("product/list", {
      page: query.page,
      limit: query.limit,
      search: {
        name: debouncedProductSearch,
      },
    });
  }, [query, debouncedProductSearch, isSearching]);

  const [orderItems, setOrderItems] = useState<OrderItem[]>(
    () => draft?.orderItems || [],
  );
  const [totalAmount, setTotalAmount] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<OrderFormType | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const kotRef = useRef<HTMLDivElement>(null);
  const [kotPreviewData, setKotPreviewData] = useState<KotData | null>(null);
  const [addonDrawerOpen, setAddonDrawerOpen] = useState(false);
  const [activeAddonItem, setActiveAddonItem] = useState<OrderItem | null>(
    null,
  );
  const [cartSheetExpanded, setCartSheetExpanded] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [menuView, setMenuView] = useState<"card" | "list">("card");
  const [occupiedTableWarning, setOccupiedTableWarning] = useState<{
    pendingTableId: string;
    previousTableId: string;
  } | null>(null);
  const initialTableIdRef = useRef<string>(
    String(draft?.tableId || tableId || ""),
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncLayout = () => setIsCompactLayout(mediaQuery.matches);
    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);
    return () => mediaQuery.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    if (addonDrawerOpen && isCompactLayout) {
      setCartSheetExpanded(false);
    }
  }, [addonDrawerOpen, isCompactLayout]);

  // Use refs for audio to avoid SSR/build-time issues and allow imperative control
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const deleteBeepRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  // Create and warm up audio elements; unlock on first user gesture (required in production browsers)
  useEffect(() => {
    const beep = new Audio(Beep);
    const del = new Audio(DeleteBeep);
    beep.preload = "auto";
    del.preload = "auto";
    beep.volume = 1;
    del.volume = 1;
    beepRef.current = beep;
    deleteBeepRef.current = del;

    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      [beep, del].forEach((el) => {
        try {
          el.muted = true;
          const p = el.play();
          if (p && typeof p.then === "function") {
            p.then(() => {
              el.pause();
              el.currentTime = 0;
              el.muted = false;
            }).catch(() => {
              el.muted = false;
            });
          } else {
            el.muted = false;
          }
        } catch {
          el.muted = false;
        }
      });
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      beep.pause();
      del.pause();
      beepRef.current = null;
      deleteBeepRef.current = null;
    };
  }, []);

  const watchedOrderType = watch("orderType");
  const watchedTableId = watch("tableId");
  const watchedTakeAwayName = watch("takeAwayName");
  const watchedOrderNote = watch("orderNote");

  // Keep create-order cart/form draft across refresh (create flow only)
  useEffect(() => {
    if (isEditMode || isComponent) return;

    const onBeforeUnload = () => {
      try {
        sessionStorage.setItem(CREATE_ORDER_RESTORE_FLAG, "1");
      } catch {
        // ignore
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isEditMode, isComponent]);

  useEffect(() => {
    if (isEditMode || isComponent) return;
    writeCreateOrderDraft({
      orderType: watchedOrderType,
      tableId: watchedTableId,
      takeAwayName: watchedTakeAwayName,
      orderNote: watchedOrderNote,
      orderItems,
    });
  }, [
    isEditMode,
    isComponent,
    watchedOrderType,
    watchedTableId,
    watchedTakeAwayName,
    watchedOrderNote,
    orderItems,
  ]);

  const playSound = (src: string, fallbackEl: HTMLAudioElement | null) => {
    // Prefer a fresh Audio instance created inside the click stack — most reliable
    // under production browser autoplay policies (especially tablets / Safari).
    const tryPlay = (url: string) => {
      const fresh = new Audio(url);
      fresh.volume = 1;
      return fresh.play();
    };

    try {
      const playPromise = tryPlay(src);
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(() => {
          // Fallback to preloaded element, then public asset path
          const retry = async () => {
            if (fallbackEl) {
              try {
                fallbackEl.muted = false;
                fallbackEl.currentTime = 0;
                await fallbackEl.play();
                return;
              } catch {
                // continue
              }
            }
            const publicPath = src.includes("DeleteBeep")
              ? "/audio/DeleteBeep.mp3"
              : "/audio/beep.mp3";
            try {
              await tryPlay(publicPath);
            } catch {
              // ignore — browser/device blocked audio
            }
          };
          void retry();
        });
      }
    } catch {
      if (!fallbackEl) return;
      try {
        fallbackEl.currentTime = 0;
        void fallbackEl.play().catch(() => {});
      } catch {
        // ignore
      }
    }
  };

  const playAudio = () => playSound(Beep, beepRef.current);
  const playDeleteAudio = () => playSound(DeleteBeep, deleteBeepRef.current);

  // React-to-print for KOT (80mm ticket style)
  const printKot = useReactToPrint({
    contentRef: kotRef,
    documentTitle: `KOT`,
    pageStyle: `
      @page { size: 80mm auto; margin: 4mm; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .kot-print { width: 80mm !important; font-size: 10px !important; line-height: 1.25 !important; }
        .kot-print * { font-size: 10px !important; line-height: 1.25 !important; }
        .kot-print .kot-title { font-size: 14px !important; font-weight: 800 !important; }
        .kot-print .tight { margin: 4px 0 !important; padding: 0 !important; }
        .kot-print .section-gap { margin: 6px 0 !important; }
        .kot-print .border-dashed { border-color: #000 !important; }
        .kot-print .border-t { border-top-width: .5008px !important; border-top-style: dashed !important; border-top-color: #000 !important; }
        .kot-print .divider-dashed {
          border: 0 !important;
          height: 1px !important;
          background-image: repeating-linear-gradient(to right, #000 0, #000 8px, transparent 8px, transparent 12px) !important;
          background-repeat: repeat-x !important;
          background-size: 100% 1px !important;
          background-position: 0 .5008px !important;
        }
        .no-print { display: none !important; }
      }
    `,
  });

  const { data: currentOrders, isSuccess: currentOrderIsSuccess } =
    useGetApiQuery(
      {
        url: `${ORDER_URL}${orderId}?itemStatus=pending,preparing,ready,served,cancelled`,
      },
      {
        skip: !orderId,
      },
    );

  useEffect(() => {
    if (currentOrders?.data?.orderItems?.length > 0) {
      setOrderItems(
        currentOrders?.data?.orderItems.map(
          (item): OrderItem => ({
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            productPrice: Number(item.product.price),
            quantity: item.quantity,
            subtotal: Number(item.subtotal),
            status: item.status,
            departmentId: item.product.departmentId,

            addons: (item.addons || []).map((a: any) => ({
              addonId: a.addonId ?? a.id ?? a.addon?.id,
              name: a.name || a.addon?.name || a.addonName || "",
              price: Number(a.price ?? a.addon?.price ?? 0),
              quantity: a.quantity ?? a.qty ?? 1,
            })),
          }),
        ),
      );
      setValue("orderNote", currentOrders?.data?.orderNote ?? "");
      if (currentOrders?.data?.takeAwayName != null) {
        setValue("takeAwayName", currentOrders.data.takeAwayName ?? "");
      }
      if (currentOrders?.data?.tableId != null) {
        setValue("tableId", String(currentOrders.data.tableId));
      }
      if (currentOrders?.data?.orderType) {
        setValue("orderType", currentOrders.data.orderType);
      }
    }
  }, [currentOrders, currentOrderIsSuccess, setValue]);

  useEffect(() => {
    const total = orderItems.reduce(
      (sum, item) =>
        item.status === "cancelled" ? sum + 0 : sum + Number(item.subtotal),
      0,
    );
    setTotalAmount(total);

    const formOrderItems = orderItems.map((item) => ({
      quantity: item.quantity,
      departmentId: item.departmentId,
      productPrice: item.productPrice,

      productId: isNaN(Number(item.productId))
        ? undefined
        : Number(item.productId),
      specialInstructions: item.specialInstructions ?? "",
      addons: (item.addons || []).map((a) => ({
        addonId: a.addonId,
        quantity: a.quantity,
        specialInstructions: "",
      })),
    }));
    setValue("orderItems", formOrderItems as any);
  }, [orderItems, setValue]);

  const totalQuantity = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      if (item.status === "cancelled") return sum;
      return sum + Number(item.quantity || 0);
    }, 0);
  }, [orderItems]);

  // Fetch tables from backend (generic)
  const { data: tableData } = useGetApiQuery({
    url: `${TABLE_URL}list?page=1&limit=500`,
  });

  // Fetch products from backend (generic)
  const { data: productData, isLoading: isProductLoading } = useGetApiQuery({
    url,
  });

  const [patchStatus] = usePatchApiMutation();

  const { options: tableOptions, getTableLabel } = useMemo(() => {
    return buildTableSelectOptions(tableData?.data?.data ?? [], {
      groupByFloor: true,
    });
  }, [tableData]);

  const tableStatusById = useMemo(() => {
    const map = new Map<string, string>();
    (tableData?.data?.data ?? []).forEach((table: any) => {
      if (table?.id != null) {
        map.set(String(table.id), String(table.status || ""));
      }
    });
    return map;
  }, [tableData]);

  const handleTableSelectChange = (
    nextTableId: string,
    currentTableId: string,
    onChange: (value: string) => void,
  ) => {
    const next = String(nextTableId || "");
    const current = String(currentTableId || "");
    if (!next || next === current) {
      onChange(next);
      return;
    }

    const status = tableStatusById.get(next);
    const isInitialTable = next === initialTableIdRef.current;
    if (status === "occupied" && !isInitialTable) {
      setOccupiedTableWarning({
        pendingTableId: next,
        previousTableId: current,
      });
      return;
    }

    onChange(next);
  };

  const confirmOccupiedTableSelection = () => {
    if (!occupiedTableWarning) return;
    setValue("tableId", occupiedTableWarning.pendingTableId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setOccupiedTableWarning(null);
  };

  const cancelOccupiedTableSelection = () => {
    if (!occupiedTableWarning) return;
    setValue("tableId", occupiedTableWarning.previousTableId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setOccupiedTableWarning(null);
  };

  const addProductToOrder = (product: {
    id: string;
    name: string;
    price: number;
    departmentId: number;
    quantity: number;
  }) => {
    const existingItem = orderItems.find(
      (item) => item.productId === product.id && item.status !== "cancelled",
    );
    if (existingItem) {
      updateOrderItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        id: `newitem_${Date.now()}_${Math.random()}`,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        departmentId: Number(product.departmentId),
        quantity: 1,
        subtotal: product.price,
        addons: [],
        specialInstructions: "",
      };
      setOrderItems((prev) => [...prev, newItem]);
    }
  };

  const adjustProductQty = (
    product: {
      id: string;
      name: string;
      price: number;
      departmentId: number;
      quantity: number;
    },
    delta: number,
  ) => {
    const existingItem = orderItems.find(
      (item) =>
        String(item.productId) === String(product.id) &&
        item.status !== "cancelled",
    );
    if (!existingItem) {
      if (delta > 0) addProductToOrder(product);
      return;
    }
    updateOrderItemQuantity(existingItem.id, existingItem.quantity + delta);
  };

  const calcSubtotal = (item: OrderItem) => {
    // Addons are charged by their own quantity only — not multiplied by item qty.
    const addonsTotal = (item.addons || []).reduce(
      (s, a) => s + Number(a.price || 0) * Number(a.quantity || 0),
      0,
    );
    return Number(item.quantity) * Number(item.productPrice) + addonsTotal;
  };

  const updateOrderItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeOrderItem(itemId);
      return;
    }

    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: calcSubtotal({ ...item, quantity: newQuantity }),
            }
          : item,
      ),
    );
  };

  const removeOrderItem = async (itemId: string) => {
    const target = orderItems.find((item) => item.id === itemId);
    if (target?.status === "cancelled") return;
    if (!String(itemId).includes("newitem_")) {
      try {
        const response = await patchStatus({
          url: `${ORDER_URL}items/status`,
          body: { status: "cancelled", orderItemIds: Number(itemId) },
        }).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => {},
        });
      } catch (error) {
        handleError({ error });
      }
    } else {
      setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const handleSuccess = () => {
    clearCreateOrderDraft();
    if (isComponent) {
      closeModal();
    } else {
      navigate(`${ORDER_LIST_ROUTE}?view=order`);
    }
  };

  // Create order mutation (generic)
  const [createApi, { isLoading: isOrderSubmitting }] =
    useCreateOrderMutation();
  const [updateOrderApi, { isLoading: isOrderUpdating }] =
    useUpdateOrderMutation();

  const submitOrder = async (data: OrderFormType) => {
    try {
      const orderType = getValues("orderType") || data.orderType;
      const payload: any = {
        orderType,
        orderNote: getValues("orderNote") || data.orderNote || "",
        orderItems: orderItems
          .filter((item: OrderItem) => item.status !== "cancelled")
          .map((item: OrderItem) => {
            const base = {
              productId: Number(item.productId),
              quantity: item.quantity,
              departmentId: item.departmentId,
            } as any;

            if (item.specialInstructions) {
              base.specialInstructions = item.specialInstructions;
            }

            const addons = (item.addons || []).map((a) => ({
              addonId: a.addonId,
              quantity: a.quantity,
            }));

            if (String(item.id).includes("newitem_")) {
              return addons.length ? { ...base, addons } : base;
            }
            return addons.length
              ? { id: item.id, ...base, addons }
              : { id: item.id, ...base };
          }),
      };

      if (orderType === "dineIn") {
        payload.tableId = Number(data.tableId);
      } else if (orderType === "takeaway") {
        payload.takeAwayName = String(data.takeAwayName || "").trim();
        // When creating takeaway from an occupied table, keep it on that session
        const linkedTableId = data.tableId || tableId;
        if (linkedTableId) {
          payload.tableId = Number(linkedTableId);
        }
      }

      const response = isEditMode
        ? await updateOrderApi({
            id: orderId,
            body: payload,
          }).unwrap()
        : await createApi({
            body: payload,
          }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          clearCreateOrderDraft();
          navigate(`${ORDER_LIST_ROUTE}?view=order`);
        },
      });
    } catch (error: any) {
      handleError({ error, setError });
    }
  };

  const onSubmit = async (data: OrderFormType) => {
    if (orderItems.length === 0) {
      setError("orderItems", {
        message: "At least one order item is required",
      });
      Toast("Please add at least one item to the order", "error");
      return;
    }
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!pendingData) return;
    setIsConfirming(true);
    await submitOrder(pendingData);
    setIsConfirming(false);
    setIsConfirmOpen(false);
  };

  // Confirm and print KOT
  const handleConfirmCreateAndPrint = async () => {
    if (!pendingData) return;
    try {
      setIsConfirming(true);
      const orderType = getValues("orderType") || pendingData.orderType;
      const payload: any = {
        orderType,
        orderNote: getValues("orderNote") || pendingData.orderNote || "",
        orderItems: orderItems
          .filter((item: OrderItem) => item.status !== "cancelled")
          .map((item: OrderItem) => {
            const base = {
              productId: Number(item.productId),
              quantity: item.quantity,
              departmentId: item.departmentId,
            } as any;

            if (item.specialInstructions) {
              base.specialInstructions = item.specialInstructions;
            }

            if (String(item.id).includes("newitem_")) {
              return base;
            }
            return {
              id: item.id,
              ...base,
            };
          }),
      };
      if (orderType === "dineIn") {
        payload.tableId = Number(pendingData.tableId);
      } else if (orderType === "takeaway") {
        payload.takeAwayName = String(pendingData.takeAwayName || "").trim();
        const linkedTableId = pendingData.tableId || tableId;
        if (linkedTableId) {
          payload.tableId = Number(linkedTableId);
        }
      }

      const response = isEditMode
        ? await updateOrderApi({ id: orderId, body: payload }).unwrap()
        : await createApi({ body: payload }).unwrap();

      // Build KOT data from current state + response
      const kotItems = orderItems
        .filter((it) => it.status !== "cancelled")
        .map((it) => ({
          id: it.id,
          productName: it.productName,
          quantity: it.quantity,
        }));

      const kotData: any = {
        kotNumber: response?.data?.orderNumber || response?.data?.id || "",
        order: {
          orderType: pendingData.orderType,
          orderStartTime: new Date().toISOString(),
          table:
            pendingData.orderType === "dineIn" ||
            (pendingData.orderType === "takeaway" &&
              (pendingData.tableId || tableId))
              ? {
                  tableNo: getTableLabel(
                    (pendingData as any)?.tableId ??
                      watchedTableId ??
                      tableId ??
                      "",
                  ),
                }
              : null,
          createdBy: null,
          takeAwayName:
            pendingData.orderType === "takeaway"
              ? (pendingData as any)?.takeAwayName || null
              : null,
        },
        orderItems: kotItems,
      };

      // Prepare KOT preview data, ensure render, then print
      setKotPreviewData(kotData);
      await new Promise((res) => setTimeout(res, 50));
      await printKot();
      setKotPreviewData(null);

      handleResponse({ res: response, onSuccess: handleSuccess });
    } catch (error) {
      handleError({ error, setError });
    } finally {
      setIsConfirming(false);
      setIsConfirmOpen(false);
    }
  };

  const visibleOrderItems = orderItems.filter(
    (item) => item.status !== "cancelled",
  );

  const qtyForProduct = (productId: string | number) =>
    orderItems
      .filter(
        (item) =>
          String(item.productId) === String(productId) &&
          item.status !== "cancelled",
      )
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const onCartSheetToggleClick = () => {
    setCartSheetExpanded((open) => !open);
  };

  return (
    <>
      {!isComponent && (
        <PageTitle
          title={isEditMode ? "Edit Order" : "Create New Order"}
          isBack
        />
      )}

      <div className={styles.page}>
        <form
          ref={formRef}
          className={styles.grid}
          onSubmit={handleSubmit(onSubmit, (formErrors) => {
            const first = Object.values(formErrors)[0] as
              | { message?: string }
              | undefined;
            Toast(
              first?.message || "Please fix the highlighted fields",
              "error",
            );
          })}
        >
          <div
            className={`${styles.panel} ${styles.panelPad} ${styles.menuPanel}`}
          >
            <div className={`${styles.panelHeader} ${styles.desktopOnly}`}>
              <h3 className={styles.panelTitle}>
                <span className={styles.panelTitleIcon}>
                  <MdShoppingCart size={18} />
                </span>
                Order Information
              </h3>
              <span className={styles.cartBadgeWrap}>
                <ShoppingBasket size={18} />
                {totalQuantity > 0 && (
                  <span className={styles.cartBadge}>{totalQuantity}</span>
                )}
              </span>
            </div>

            <div className={styles.mobileSetup}>
              <div className={styles.topRow}>
                <div className={styles.fieldBlock}>
                  <label
                    className={`${styles.fieldLabel} ${styles.desktopOnly}`}
                  >
                    Order Type
                  </label>
                  <Controller
                    name="orderType"
                    control={control}
                    defaultValue="dineIn"
                    render={({ field }) => (
                      <div
                        className={styles.typePills}
                        role="group"
                        aria-label="Order type"
                      >
                        {orderTypeOptions.map((option) => {
                          const isActive = field.value === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={styles.typePill}
                              data-active={isActive ? "true" : "false"}
                              aria-pressed={isActive}
                              onClick={() => field.onChange(option.value)}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                {watchedOrderType === "dineIn" && (
                  <div className={`${styles.fieldBlock} ${styles.sideField}`}>
                    <label
                      className={`${styles.fieldLabel} ${styles.desktopOnly}`}
                    >
                      Table
                    </label>
                    <Controller
                      defaultValue={tableId || ""}
                      name="tableId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={tableOptions}
                          resolveLabel={getTableLabel}
                          error={errors.tableId?.message}
                          placeholder="Select table"
                          triggerClassName={styles.mobileSelectTrigger}
                          contentClassName={styles.mobileSelectContent}
                          isRequired
                          onChange={(e) => {
                            handleTableSelectChange(
                              e.target.value,
                              String(field.value || ""),
                              (next) => field.onChange(next),
                            );
                          }}
                          onValueChange={(next) => {
                            handleTableSelectChange(
                              next,
                              String(field.value || ""),
                              (value) => field.onChange(value),
                            );
                          }}
                        />
                      )}
                    />
                  </div>
                )}

                {watchedOrderType === "takeaway" && (
                  <div className={`${styles.fieldBlock} ${styles.sideField}`}>
                    <label
                      className={`${styles.fieldLabel} ${styles.desktopOnly}`}
                    >
                      Takeaway Name
                    </label>
                    <div className={styles.takeawayField}>
                      <span className={styles.takeawayIcon} aria-hidden>
                        <User size={16} strokeWidth={2} />
                      </span>
                      <Input
                        placeholder="Customer name"
                        {...register("takeAwayName")}
                        error={errors.takeAwayName?.message}
                        className={styles.takeawayMobileInput}
                        isRequired
                      />
                    </div>
                    {(watchedTableId || tableId) && (
                      <p className="mt-1.5 text-left text-xs text-slate-500">
                        Linked to table{" "}
                        <span className="font-semibold text-slate-700">
                          {getTableLabel(watchedTableId || tableId || "")}
                        </span>{" "}
                        — will appear with that table&apos;s orders
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.searchRow}>
                <div className={styles.searchInner}>
                  <FaSearch className={styles.searchIcon} size={14} />
                  <Input
                    placeholder="Search menu…"
                    value={productSearchInput}
                    onChange={(e) => {
                      setProductSearchInput(e.target.value);
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {isProductLoading ? (
              <div className={styles.emptyState}>
                <MdShoppingCart className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Loading menu items...</p>
              </div>
            ) : productData?.data?.data?.length > 0 ? (
              <div>
                <div className={styles.menuToolbar}>
                  <h4
                    className={`${styles.sectionLabel} ${styles.desktopOnly}`}
                  >
                    {debouncedProductSearch
                      ? `Search Results (${productData?.data?.data?.length})`
                      : "Top Selling Menu Items"}
                  </h4>
                  <p className={styles.mobileMenuHint}>
                    {debouncedProductSearch
                      ? `${productData?.data?.data?.length} results`
                      : "Top selling"}
                  </p>
                  <div
                    className={styles.viewToggle}
                    role="group"
                    aria-label="Menu layout"
                  >
                    <button
                      type="button"
                      className={styles.viewToggleBtn}
                      data-active={menuView === "card" ? "true" : "false"}
                      aria-pressed={menuView === "card"}
                      aria-label="Card view"
                      onClick={() => setMenuView("card")}
                    >
                      <LayoutGrid size={16} />
                      <span>Cards</span>
                    </button>
                    <button
                      type="button"
                      className={styles.viewToggleBtn}
                      data-active={menuView === "list" ? "true" : "false"}
                      aria-pressed={menuView === "list"}
                      aria-label="List view"
                      onClick={() => setMenuView("list")}
                    >
                      <List size={16} />
                      <span>List</span>
                    </button>
                  </div>
                </div>
                <div
                  className={`${styles.productGrid} ${
                    menuView === "list"
                      ? styles.productGridList
                      : styles.productGridCards
                  }`}
                >
                  {productData?.data?.data?.map(
                    (product: {
                      id: string;
                      name: string;
                      description: string;
                      price: number;
                      quantity: number;
                      departmentId: number;
                      mediaArr: {
                        imageUrl: string;
                      }[];
                    }) => {
                      const inCartQty = qtyForProduct(product.id);
                      return (
                        <div
                          key={product.id}
                          className={`${styles.productCard} ${
                            inCartQty > 0 ? styles.productCardActive : ""
                          }`}
                          onClick={() => {
                            addProductToOrder(product);
                            playAudio();
                          }}
                        >
                          <div className={styles.productImageWrap}>
                            <img
                              src={`${product?.mediaArr?.[0]?.imageUrl ? IMAGE_BASE_URL + product.mediaArr[0].imageUrl : DishPlaceHolder}`}
                              alt={product.name}
                              className={styles.productImage}
                              loading="lazy"
                            />
                            {inCartQty > 0 && (
                              <span className={styles.productQtyBadge}>
                                {inCartQty}
                              </span>
                            )}
                          </div>
                          <div className={styles.productBody}>
                            <h4 className={styles.productName}>
                              {product.name}
                            </h4>
                            <span className={styles.productPrice}>
                              {CurrencySign} {Number(product.price).toFixed(2)}
                            </span>
                            <button type="button" className={styles.addBtn}>
                              Add to Order
                            </button>
                          </div>
                          <div
                            className={styles.mobileQtyControls}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {inCartQty > 0 ? (
                              <>
                                <button
                                  type="button"
                                  className={styles.mobileQtyBtn}
                                  aria-label="Decrease quantity"
                                  onClick={() => {
                                    adjustProductQty(product, -1);
                                    playAudio();
                                  }}
                                >
                                  <Minus size={16} />
                                </button>
                                <span className={styles.mobileQtyValue}>
                                  {inCartQty}
                                </span>
                                <button
                                  type="button"
                                  className={styles.mobileQtyBtn}
                                  aria-label="Increase quantity"
                                  onClick={() => {
                                    adjustProductQty(product, 1);
                                    playAudio();
                                  }}
                                >
                                  <Plus size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className={styles.mobileAddBtn}
                                aria-label={`Add ${product.name}`}
                                onClick={() => {
                                  addProductToOrder(product);
                                  playAudio();
                                }}
                              >
                                <Plus size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <MdShoppingCart className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>
                  {debouncedProductSearch
                    ? "No menu items match your search"
                    : "No products available"}
                </p>
                {debouncedProductSearch && (
                  <p className={styles.emptyHint}>
                    Try searching with different keywords
                  </p>
                )}
              </div>
            )}

            {watchedOrderType === "delivery" && (
              <div className="mt-4">
                <Input
                  label="Delivery Address"
                  placeholder="Enter complete delivery address"
                  className="w-full"
                  {...register("deliveryAddress")}
                  error={errors.deliveryAddress?.message}
                  required
                />
              </div>
            )}
          </div>

          {cartSheetExpanded && (
            <button
              type="button"
              aria-label="Collapse order details"
              className={styles.mobileCartScrim}
              onClick={() => setCartSheetExpanded(false)}
            />
          )}

          <div
            className={`${styles.panel} ${styles.cartPanel} ${
              cartSheetExpanded
                ? styles.cartPanelExpanded
                : styles.cartPanelPeek
            } ${
              addonDrawerOpen && isCompactLayout
                ? "invisible pointer-events-none"
                : ""
            }`}
          >
            <div
              className={styles.cartSheetHeader}
              onClick={onCartSheetToggleClick}
              role="button"
              tabIndex={0}
              aria-expanded={cartSheetExpanded}
              aria-label={
                cartSheetExpanded
                  ? "Collapse order details"
                  : "Expand order details"
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCartSheetExpanded((open) => !open);
                }
              }}
            >
              <div className={styles.mobileCartHandle} aria-hidden />
              <div className={styles.cartHeader}>
                <h3 className={styles.panelTitle}>
                  <span className={styles.desktopOnly}>Order Items</span>
                  <span className={styles.mobileOnlyTitle}>
                    Your order · {totalQuantity}
                  </span>
                </h3>
                <span className={styles.mobileCartHeaderTotal}>
                  {CurrencySign} {Number(totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className={styles.cartBody}>
              {visibleOrderItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdShoppingCart className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>No items added yet</p>
                  <p className={styles.emptyHint}>
                    Tap + on a menu item to add it
                  </p>
                </div>
              ) : (
                visibleOrderItems.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.cartItem} ${
                      item.status === "cancelled"
                        ? styles.cartItemCancelled
                        : ""
                    }`}
                  >
                    <div
                      className={
                        item.status === "cancelled" ? "line-through" : ""
                      }
                    >
                      <h4 className={styles.cartItemName}>
                        {item.productName}
                      </h4>
                      <p className={styles.cartItemMeta}>
                        {CurrencySign} {Number(item.productPrice).toFixed(2)}{" "}
                        each
                        <span className={styles.cartItemLineTotal}>
                          {" "}
                          · {CurrencySign}{" "}
                          {Number(
                            item.subtotal ?? item.quantity * item.productPrice,
                          ).toFixed(2)}
                        </span>
                      </p>
                      {item.addons && item.addons.length > 0 && (
                        <div className={styles.addonChips}>
                          {item.addons.map((a) => {
                            const addonName =
                              (a as any).name ||
                              (a as any).addon?.name ||
                              (a as any).addonName ||
                              String((a as any).addonId || "");
                            const qty =
                              (a as any).quantity ?? (a as any).qty ?? 1;
                            return (
                              <span
                                key={`${item.id}_${(a as any).addonId || addonName}`}
                                className={styles.addonChip}
                              >
                                + {addonName} x{qty}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-start sm:gap-2">
                      <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-center">
                        <div
                          className={`${styles.qtyRow} ${
                            item.status === "cancelled" ? "hidden" : ""
                          }`}
                        >
                          <button
                            type="button"
                            disabled={item.status === "preparing"}
                            onClick={() => {
                              updateOrderItemQuantity(
                                item.id,
                                item.quantity - 1,
                              );
                              playAudio();
                            }}
                            className={styles.qtyBtn}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className={styles.qtyValue}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateOrderItemQuantity(
                                item.id,
                                item.quantity + 1,
                              );
                              playAudio();
                            }}
                            className={styles.qtyBtn}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={item.status === "cancelled"}
                          onClick={() => {
                            setActiveAddonItem(item);
                            setAddonDrawerOpen(true);
                          }}
                          className={`${styles.addonBtn} max-sm:flex-1 flex justify-center items-center `}
                        >
                          <span className="flex items-center justify-center gap-1 max-h-[.875rem]">
                            <Plus size={12} strokeWidth={2.5} />
                            {item.addons?.length
                              ? `Edit Addons (${item.addons.length})`
                              : "Add Addon"}
                          </span>
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={
                          item.status === "preparing" ||
                          item.status === "cancelled"
                        }
                        onClick={() => {
                          removeOrderItem(item.id);
                          playDeleteAudio();
                        }}
                        className={`${styles.removeBtn} max-sm:absolute max-sm:right-2 max-sm:top-2`}
                      >
                        <Plus className="rotate-45 w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.cartFooter}>
              <div className={`${styles.totalRow} ${styles.desktopOnly}`}>
                <span className={styles.totalLabel}>Total Amount</span>
                <span className={styles.totalValue}>
                  {CurrencySign} {Number(totalAmount).toFixed(2)}
                </span>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || visibleOrderItems.length === 0}
                  className={styles.submitBtn}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <MdShoppingCart size={16} />
                      {isEditMode ? "Update Order" : "Create Order"}
                      {totalQuantity > 0 && (
                        <span className={styles.submitQty}>
                          ({totalQuantity})
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
              {errors.orderItems && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.orderItems.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>

      {occupiedTableWarning &&
        createPortal(
          <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Table Already Occupied</h3>
              </div>
              <div className="flex flex-col gap-4 px-5 py-4">
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <AlertTriangle size={16} />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-900">
                      {getTableLabel(occupiedTableWarning.pendingTableId)} is
                      already occupied.
                    </p>
                    <p className="mt-1 text-sm text-amber-800/80">
                      Creating an order on this table will add it to the
                      existing session. Do you want to continue?
                    </p>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={cancelOccupiedTableSelection}
                  className={styles.modalSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmOccupiedTableSelection}
                  className={styles.modalPrimary}
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {isConfirmOpen &&
        createPortal(
          <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Confirm {isEditMode ? "Update" : "Order"}
                </h3>
                <div className={styles.modalMeta}>
                  <span className={styles.modalMetaChip}>
                    {watchedOrderType === "dineIn"
                      ? "Dine In"
                      : watchedOrderType === "takeaway"
                        ? "Takeaway"
                        : watchedOrderType}
                  </span>
                  {watchedOrderType === "dineIn" && (
                    <span className={styles.modalMetaChip}>
                      Table{" "}
                      {getTableLabel(
                        (pendingData as any)?.tableId ?? watchedTableId ?? "",
                      )}
                    </span>
                  )}
                  {watchedOrderType === "takeaway" &&
                    (watchedTableId || tableId) && (
                      <span className={styles.modalMetaChip}>
                        Table{" "}
                        {getTableLabel(
                          (pendingData as any)?.tableId ??
                            watchedTableId ??
                            tableId ??
                            "",
                        )}
                      </span>
                    )}
                  {watchedOrderType === "takeaway" &&
                    String(
                      pendingData?.takeAwayName || watchedTakeAwayName || "",
                    ).trim() && (
                      <span className={styles.modalMetaChip}>
                        {String(
                          pendingData?.takeAwayName || watchedTakeAwayName || "",
                        ).trim()}
                      </span>
                    )}
                  {pendingData?.deliveryAddress && (
                    <span className={styles.modalMetaChip}>
                      {pendingData.deliveryAddress}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalTableWrap}>
                  <table className={styles.modalTable}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className={styles.modalTableQty}>Qty</th>
                        <th className={styles.modalTableAmount}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleOrderItems.map((item) => {
                        const addons = Array.isArray(item.addons)
                          ? item.addons
                          : [];
                        const lineTotal =
                          Number(item.subtotal) || calcSubtotal(item);

                        return (
                          <tr
                            key={item.id}
                            className={
                              item.status === "cancelled"
                                ? "line-through"
                                : undefined
                            }
                          >
                            <td>
                              <p className={styles.modalItemName}>
                                {item.productName}
                              </p>
                              <p className={styles.modalPriceLine}>
                                Item · {CurrencySign}
                                {Number(item.productPrice).toFixed(2)}
                                {Number(item.quantity) > 1
                                  ? ` × ${item.quantity}`
                                  : ""}
                              </p>
                              {addons.map((addon: any) => {
                                const name =
                                  addon.name ||
                                  addon.addon?.name ||
                                  addon.addonName ||
                                  String(addon.addonId ?? "Addon");
                                const addonQty = Number(
                                  addon.quantity ?? addon.qty ?? 1,
                                );
                                const unit = Number(addon.price || 0);
                                return (
                                  <p
                                    key={`${item.id}_${addon.addonId || name}`}
                                    className={styles.modalAddonLine}
                                  >
                                    Addon · {name} · {CurrencySign}
                                    {unit.toFixed(2)}
                                    {addonQty > 1 ? ` × ${addonQty}` : ""}
                                  </p>
                                );
                              })}
                            </td>
                            <td className={styles.modalTableQty}>
                              {item.quantity}
                            </td>
                            <td className={styles.modalTableAmount}>
                              {CurrencySign}
                              {lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className={styles.modalTableTotalLabel}>
                          Total
                        </td>
                        <td className={styles.modalTableTotalValue}>
                          {CurrencySign}
                          {Number(totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className={styles.modalNotes}>
                  <label className={styles.modalNotesLabel}>Order notes</label>
                  <TextArea
                    rows={3}
                    placeholder="Any special instructions or notes"
                    className="w-full"
                    {...register("orderNote")}
                    error={errors.orderNote?.message}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className={styles.modalSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  disabled={isConfirming}
                  className={styles.modalPrimary}
                >
                  {isConfirming ? "Processing..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreateAndPrint}
                  disabled={isConfirming}
                  className={styles.modalPrimary}
                >
                  Confirm and Print
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* Hidden Kot printable content */}
      <div className="hidden">
        {kotPreviewData && <Kot ref={kotRef} data={kotPreviewData} />}
      </div>
      {/* Addons Drawer */}

      <Drawer
        isOpen={addonDrawerOpen}
        setIsOpen={setAddonDrawerOpen}
        position={isCompactLayout ? "bottom" : "right"}
        width="w-full max-w-md sm:w-[400px]"
        contentClassName="p-0 overflow-hidden"
        hideHeader={isCompactLayout}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4">
            <div className="min-w-0 text-left">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {activeAddonItem?.productName}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">Addons</p>
            </div>
            {isCompactLayout && (
              <button
                type="button"
                aria-label="Close addons"
                onClick={() => setAddonDrawerOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <RxCross2 size={18} />
              </button>
            )}
          </div>
          {activeAddonItem ? (
            <AddonPicker
              productId={activeAddonItem.productId}
              selected={(activeAddonItem.addons || []).map((a: any) => ({
                addonId: a.addonId ?? a.id ?? a.addon?.id,
                name: a.name || a.addon?.name || a.addonName || "",
                price: Number(a.price ?? a.addon?.price ?? 0),
                quantity: a.quantity ?? 1,
              }))}
              onSave={(addons) => {
                setOrderItems((prev) =>
                  prev.map((it) =>
                    it.id === activeAddonItem.id
                      ? {
                          ...it,
                          addons,
                          subtotal: calcSubtotal({ ...it, addons }),
                        }
                      : it,
                  ),
                );
                setAddonDrawerOpen(false);
              }}
            />
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500">
              No item selected.
            </p>
          )}
        </div>
      </Drawer>
    </>
  );
}

function AddonPicker({
  productId,
  selected,
  onSave,
}: {
  productId: string;
  selected: {
    addonId: number;
    name: string;
    price: number;
    quantity: number;
  }[];
  onSave: (
    addons: {
      addonId: number;
      name: string;
      price: number;
      quantity: number;
    }[],
  ) => void;
}) {
  const { data, isLoading } = useGetApiQuery(
    { url: `product/${productId}` },
    { skip: !productId },
  );
  const [local, setLocal] = useState<
    { addonId: number; name: string; price: number; quantity: number }[]
  >(selected || []);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    setLocal(selected || []);
  }, [productId, selected]);

  const addons = data?.data?.addons || [];

  const toggle = (addon: any) => {
    setLocal((prev) => {
      const index = prev.findIndex((a) => a.addonId === addon.id);
      if (index > -1) {
        const copy = [...prev];
        copy.splice(index, 1);
        return copy;
      }
      return [
        ...prev,
        {
          addonId: addon.id,
          name: addon.name,
          price: Number(addon.price || 0),
          quantity: 1,
        },
      ];
    });
  };

  const setQty = (addonId: number, qty: number) => {
    setLocal((prev) =>
      prev.map((a) =>
        a.addonId === addonId ? { ...a, quantity: Math.max(1, qty) } : a,
      ),
    );
  };

  const filtered = addons.filter((a: any) =>
    String(a?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const selectedCount = local.length;
  const extrasTotal = local.reduce(
    (sum, addon) => sum + Number(addon.price || 0) * Number(addon.quantity || 1),
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 border-b border-slate-100 px-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Choose addons for this item
          </p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {selectedCount} selected
          </span>
        </div>

        <div className="relative">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search addons..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-primaryColor/40 focus:bg-white focus:ring-2 focus:ring-primaryColor/15"
          />
          <FaSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading addons...
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No addons for this product.
          </p>
        ) : (
          filtered.map((addon: any) => {
            const selectedAddon = local.find((a) => a.addonId === addon.id);
            const checked = Boolean(selectedAddon);
            return (
              <div
                key={addon.id}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  checked
                    ? "border-primaryColor/40 bg-primaryColor/[0.04] ring-1 ring-primaryColor/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80">
                  <img
                    src={
                      addon.imageUrl
                        ? `${IMAGE_BASE_URL}${addon.imageUrl}`
                        : DishPlaceHolder
                    }
                    alt={addon.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DishPlaceHolder;
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="truncate text-sm font-medium text-slate-900">
                      {addon.name}
                    </h4>
                    <span className="shrink-0 text-sm font-semibold text-slate-800">
                      {CurrencySign}
                      {Number(addon.price || 0).toFixed(2)}
                    </span>
                  </div>
                  {addon.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {addon.description}
                    </p>
                  )}
                  {checked && (
                    <div className="mt-2 inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={() =>
                          setQty(addon.id, (selectedAddon?.quantity || 1) - 1)
                        }
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-medium">
                        {selectedAddon?.quantity || 1}
                      </span>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={() =>
                          setQty(addon.id, (selectedAddon?.quantity || 1) + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggle(addon)}
                  className={`inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold transition ${
                    checked
                      ? "border border-rose-200 bg-rose-50 text-rose-700"
                      : "bg-primaryColor text-white hover:bg-primaryColor/90"
                  }`}
                >
                  {checked ? (
                    "Remove"
                  ) : (
                    <>
                      <Plus size={14} strokeWidth={2.5} />
                      Add
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(15_23_42_/_0.06)]">
        {selectedCount > 0 && (
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {selectedCount} addon{selectedCount === 1 ? "" : "s"}
            </span>
            <span className="font-semibold tabular-nums text-slate-800">
              +{CurrencySign}
              {extrasTotal.toFixed(2)}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="h-12 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.99]"
            onClick={() => onSave([])}
          >
            Delete
          </button>
          <button
            type="button"
            className="h-12 rounded-xl bg-primaryColor text-sm font-semibold text-white transition hover:bg-primaryColor/90 active:scale-[0.99]"
            onClick={() => onSave(local)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
