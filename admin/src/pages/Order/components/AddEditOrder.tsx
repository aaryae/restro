import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ORDER_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReactToPrint } from "react-to-print";
import Kot, { type KotData } from "@/components/Kot";
import PageTitle from "@/components/PageTitle";
import TextArea from "@/components/TextArea";
import Select from "@/components/Select";
import { FaSearch } from "react-icons/fa";
import { MdShoppingCart } from "react-icons/md";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import Beep from "@/assets/audio/beep.mp3";
import DeleteBeep from "@/assets/audio/DeleteBeep.mp3";
import {
  useGetApiQuery,
  usePatchApiMutation,
} from "@/redux/services/crudApi";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { LayoutGrid, List, Minus, Plus, ShoppingBasket, User } from "lucide-react";
import {
  useCreateOrderMutation,
  useUpdateOrderMutation,
} from "@/redux/services/orders";
import { buildQueryString } from "@/utils/generalHelper";
import usePagination from "@/hooks/usePagination";
import useDebounce from "@/hooks/useDebounce";
import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import Drawer from "@/components/Drawer";
import styles from "./AddEditOrder.module.css";
import Input from "@/components/Input";
import { OrderSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

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

export default function AddEditOrder({
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!orderId;

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
      orderType: "dineIn",
      orderItems: [],
    },
  });

  const [productSearchInput, setProductSearchInput] = useState("");
  const debouncedProductSearch = useDebounce(productSearchInput, 400);

  const { query, handlePagination } = usePagination({
    page: 1,
    limit: 6,
  });

  // Mobile: load more products at once to reduce paging taps.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 1023px)").matches) {
      handlePagination({ page: 1, limit: 40 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to first page when debounced search changes.
  useEffect(() => {
    if (query.page !== 1) {
      handlePagination({ page: 1, limit: query.limit });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProductSearch]);

  const url = useMemo(() => {
    return buildQueryString("product/list", {
      page: query.page,
      limit: query.limit,
      search: {
        name: debouncedProductSearch,
      },
    });
  }, [query, debouncedProductSearch]);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
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
  const [cartDragY, setCartDragY] = useState(0);
  const [cartDragging, setCartDragging] = useState(false);
  const [menuView, setMenuView] = useState<"card" | "list">("card");
  const cartSheetRef = useRef<HTMLDivElement>(null);
  const cartDragStartY = useRef(0);
  const cartDragOriginExpanded = useRef(false);
  const cartDraggingRef = useRef(false);
  const cartDidDragRef = useRef(false);
  const cartDragYRef = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Use refs for audio to avoid SSR/build-time issues and allow imperative control
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const deleteBeepRef = useRef<HTMLAudioElement | null>(null);

  // Create and configure audio elements on mount
  useEffect(() => {
    const beep = new Audio(Beep);
    const del = new Audio(DeleteBeep);
    // Preload and configure for reliable playback
    beep.preload = "auto";
    del.preload = "auto";
    beep.muted = false;
    del.muted = false;
    beep.volume = 1.0;
    del.volume = 1.0;
    beepRef.current = beep;
    deleteBeepRef.current = del;
    // No auto play/unlock here; sounds will play only on explicit user clicks
    return () => {};
  }, []);

  const watchedOrderType = watch("orderType");
  const watchedTableId = watch("tableId");

  const playAudio = () => {
    const a = beepRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          // ignored: browser blocked due to gesture policy; unlocked handler will fix on next gesture
        });
      }
    } catch {}
  };

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

  const playDeleteAudio = () => {
    const a = deleteBeepRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {});
      }
    } catch {}
  };

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
      setValue("orderNote", currentOrders?.data?.orderNote);
    }
  }, [currentOrders, currentOrderIsSuccess]);

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
      specialInstructions: item.specialInstructions,
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
  const { data: tableData } = useGetApiQuery({ url: `${TABLE_URL}list` });

  // Fetch products from backend (generic)
  const { data: productData, isLoading: isProductLoading } = useGetApiQuery({
    url,
  });

  const [patchStatus] = usePatchApiMutation();

  const tableOptions = useMemo(() => {
    if (!tableData?.data) return [];

    return tableData.data.data
      ?.filter((table: { status?: string }) => table.status !== "maintenance")
      .map((table: { id: string | number; tableNo: string }) => ({
        value: String(table.id),
        label: `${table.tableNo}`,
      }));
  }, [tableData]);

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
    const addonsUnitSum = (item.addons || []).reduce(
      (s, a) => s + Number(a.price || 0) * Number(a.quantity || 0),
      0,
    );
    return Number(item.quantity) * (Number(item.productPrice) + addonsUnitSum);
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
    if (isComponent) {
      closeModal();
    } else {
      navigate(ORDER_LIST_ROUTE);
    }
  };

  // Create order mutation (generic)
  const [createApi, { isLoading: isOrderSubmitting }] =
    useCreateOrderMutation();
  const [updateOrderApi, { isLoading: isOrderUpdating }] =
    useUpdateOrderMutation();

  const submitOrder = async (data: OrderFormType) => {
    try {
      const payload = {
        ...data,
        orderNote: getValues("orderNote"),
        orderItems: orderItems
          .filter((item: OrderItem) => item.status !== "cancelled")
          .map((item: OrderItem) => {
            const base = {
              productId: Number(item.productId),
              quantity: item.quantity,
              departmentId: item.departmentId,
            } as any;

            if (String(item.id).includes("newitem_")) {
              return {
                ...base,
                addons: (item.addons || []).map((a) => ({
                  addonId: a.addonId,
                  quantity: a.quantity,
                })),
              };
            }
            return {
              id: item.id,
              ...base,
              addons: (item.addons || []).map((a) => ({
                addonId: a.addonId,
                quantity: a.quantity,
              })),
            };
          }),
      };
      if (getValues("orderType") !== "dineIn") {
        delete payload.tableId;
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
        onSuccess: () => navigate(ORDER_LIST_ROUTE),
      });
    } catch (error: any) {
      handleError({ error });
    }
  };

  const onSubmit = async (data: OrderFormType) => {
    if (orderItems.length === 0) {
      setError("orderItems", {
        message: "At least one order item is required",
      });
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
      const payload: any = {
        ...pendingData,
        orderNote: getValues("orderNote"),
        orderItems: orderItems
          .filter((item: OrderItem) => item.status !== "cancelled")
          .map((item: OrderItem) => {
            const base = {
              productId: Number(item.productId),
              quantity: item.quantity,
              departmentId: item.departmentId,
            } as any;

            if (String(item.id).includes("newitem_")) {
              return base;
            }
            return {
              id: item.id,
              ...base,
            };
          }),
      };
      if (getValues("orderType") !== "dineIn") {
        delete payload.tableId;
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
            pendingData.orderType === "dineIn"
              ? {
                  tableNo: tableOptions.find(
                    (t: any) =>
                      t.value ===
                      String(
                        (pendingData as any)?.tableId ?? watchedTableId ?? "",
                      ),
                  )?.label,
                }
              : null,
          createdBy: null,
          takeAwayName: (pendingData as any)?.takeAwayName || null,
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
      handleError({ error });
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

  const onCartSheetTouchStart = (e: React.TouchEvent) => {
    cartDragStartY.current = e.touches[0].clientY;
    cartDragOriginExpanded.current = cartSheetExpanded;
    cartDraggingRef.current = true;
    cartDidDragRef.current = false;
    cartDragYRef.current = 0;
    setCartDragging(true);
    setCartDragY(0);
  };

  const onCartSheetTouchMove = (e: React.TouchEvent) => {
    if (!cartDraggingRef.current) return;
    const dy = e.touches[0].clientY - cartDragStartY.current;
    if (Math.abs(dy) > 6) cartDidDragRef.current = true;
    const next = cartDragOriginExpanded.current
      ? Math.max(0, dy)
      : Math.min(0, dy);
    cartDragYRef.current = next;
    setCartDragY(next);
  };

  const onCartSheetTouchEnd = () => {
    if (!cartDraggingRef.current) return;
    const dy = cartDragYRef.current;
    const threshold = 48;
    if (cartDragOriginExpanded.current) {
      if (dy > threshold) setCartSheetExpanded(false);
    } else if (dy < -threshold) {
      setCartSheetExpanded(true);
    }
    cartDraggingRef.current = false;
    cartDragYRef.current = 0;
    setCartDragging(false);
    setCartDragY(0);
  };

  const onCartSheetToggleClick = () => {
    if (cartDidDragRef.current) {
      cartDidDragRef.current = false;
      return;
    }
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
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className={`${styles.panel} ${styles.panelPad} ${styles.menuPanel}`}>
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
                  <label className={`${styles.fieldLabel} ${styles.desktopOnly}`}>
                    Order Type
                  </label>
                  <Controller
                    name="orderType"
                    control={control}
                    defaultValue="dineIn"
                    render={({ field }) => (
                      <div className={styles.typePills} role="group" aria-label="Order type">
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
                          error={errors.tableId?.message}
                          placeholder="Select table"
                          triggerClassName={styles.mobileSelectTrigger}
                          contentClassName={styles.mobileSelectContent}
                          required
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
                      />
                    </div>
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
                  <h4 className={`${styles.sectionLabel} ${styles.desktopOnly}`}>
                    {debouncedProductSearch
                      ? `Search Results (${productData?.data?.data?.length})`
                      : "Top Selling Menu Items"}
                  </h4>
                  <p className={styles.mobileMenuHint}>
                    {debouncedProductSearch
                      ? `${productData?.data?.data?.length} results`
                      : "Menu"}
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
            ref={cartSheetRef}
            className={`${styles.panel} ${styles.cartPanel} ${
              cartSheetExpanded ? styles.cartPanelExpanded : styles.cartPanelPeek
            } ${cartDragging ? styles.cartPanelDragging : ""}`}
            style={
              cartDragging
                ? { transform: `translate3d(0, ${cartDragY}px, 0)` }
                : undefined
            }
          >
            <div
              className={styles.cartDragZone}
              onTouchStart={onCartSheetTouchStart}
              onTouchMove={onCartSheetTouchMove}
              onTouchEnd={onCartSheetTouchEnd}
              onTouchCancel={onCartSheetTouchEnd}
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
                      item.status === "cancelled" ? styles.cartItemCancelled : ""
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
                            item.subtotal ??
                              item.quantity * item.productPrice,
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
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center">
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
                          onClick={() => {
                            setActiveAddonItem(item);
                            setAddonDrawerOpen(true);
                          }}
                          className={styles.addonBtn}
                        >
                          {item.addons?.length
                            ? `Edit Addons (${item.addons.length})`
                            : "Add Addons"}
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
                        className={styles.removeBtn}
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

      {isConfirmOpen &&
        createPortal(
          <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Confirm {isEditMode ? "Update" : "Order"}
                </h3>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalMeta}>
                  <p>
                    <span className="font-medium">Order Type:</span>{" "}
                    {watchedOrderType}
                  </p>
                  {watchedOrderType === "dineIn" && (
                    <p>
                      <span className="font-medium">Table:</span>{" "}
                      {tableOptions.find(
                        (t: { value: string; label: string }) =>
                          t.value ===
                          String(
                            (pendingData as any)?.tableId ??
                              watchedTableId ??
                              "",
                          ),
                      )?.label || "-"}
                    </p>
                  )}
                  {pendingData?.deliveryAddress && (
                    <p>
                      <span className="font-medium">Delivery Address:</span>{" "}
                      {pendingData.deliveryAddress}
                    </p>
                  )}
                  {pendingData?.orderNote && (
                    <p>
                      <span className="font-medium">Note:</span>{" "}
                      {pendingData.orderNote}
                    </p>
                  )}
                </div>

                <div className={styles.modalTable}>
                  <div className={styles.modalTableHead}>
                    <div>Item</div>
                    <div className={styles.rightAlign}>Qty</div>
                    <div className={styles.rightAlign}>Price</div>
                    <div className={styles.rightAlign}>Subtotal</div>
                  </div>
                  {visibleOrderItems.map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.modalTableRow} ${
                        item.status === "cancelled" ? "line-through" : ""
                      }`}
                    >
                      <div className="truncate">
                        {item.productName}
                        {Array.isArray(item.addons) &&
                          item.addons.length > 0 && (
                            <span className="text-xs text-gray-500 ml-2">
                              (+
                              {item.addons
                                .map((addon: any) => {
                                  const name =
                                    addon.name ||
                                    addon.addon?.name ||
                                    addon.addonName ||
                                    String(addon.addonId ?? "");
                                  const qty = addon.quantity ?? addon.qty ?? 1;
                                  return qty && qty > 1
                                    ? `${name} x${qty}`
                                    : name;
                                })
                                .join(", ")}
                              )
                            </span>
                          )}
                      </div>
                      <div className={styles.rightAlign}>{item.quantity}</div>
                      <div className={styles.rightAlign}>
                        {CurrencySign} {Number(item.productPrice).toFixed(2)}
                      </div>
                      <div className={styles.rightAlign}>
                        {CurrencySign} {Number(item.subtotal).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className={styles.modalTableFoot}>
                    <div>Total</div>
                    <div />
                    <div />
                    <div className={`${styles.rightAlign} text-primaryColor`}>
                      {CurrencySign} {Number(totalAmount).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <TextArea
                    rows={4}
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
        width="w-full lg:w-[40%]"
      >
        <div className="p-4 flex flex-col gap-4">
          <h3 className="text-lg font-semibold">
            {activeAddonItem?.productName} - Addons
          </h3>
          {activeAddonItem ? (
            <AddonPicker
              productId={activeAddonItem.productId}
              selected={(activeAddonItem.addons || []).map((a: any) => ({
                addonId: a.addonId ?? a.id ?? a.addon?.id,
                name: a.name || a.addon?.name || a.addonName || "",
                price: Number(a.price ?? a.addon?.price ?? 0),
                quantity: a.quantity ?? 1,
              }))}
              onCancel={() => setAddonDrawerOpen(false)}
              onSave={(addons) => {
                setOrderItems((prev) =>
                  prev.map((it) =>
                    it.id === activeAddonItem.id
                      ? {
                          ...it,
                          addons,
                          subtotal: (function () {
                            const addonsUnit = addons.reduce(
                              (s, a) =>
                                s +
                                Number(a.price || 0) * Number(a.quantity || 0),
                              0,
                            );
                            return (
                              Number(it.quantity) *
                              (Number(it.productPrice) + addonsUnit)
                            );
                          })(),
                        }
                      : it,
                  ),
                );
                setAddonDrawerOpen(false);
              }}
            />
          ) : (
            <p className="text-sm text-gray-600">No item selected.</p>
          )}
        </div>
      </Drawer>
    </>
  );
}

function AddonPicker({
  productId,
  selected,
  onCancel,
  onSave,
}: {
  productId: string;
  selected: {
    addonId: number;
    name: string;
    price: number;
    quantity: number;
  }[];
  onCancel: () => void;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-left">Addons</h3>
          <p className="text-sm text-gray-500">
            Enhance the item with complementary addons
          </p>
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-medium">{(local || []).length}</span>
          <span className="ml-1">selected</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search addons..."
            className="w-full p-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primaryColor"
          />
          <FaSearch className="absolute right-3 top-2.5 text-gray-400" />
        </div>
        <button
          type="button"
          className="px-3 py-2 bg-gray-100 rounded-md text-sm"
          onClick={() => setSearchTerm("")}
        >
          Clear
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-6">Loading addons...</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-600">No addons for this product.</p>
      ) : (
        <div className="grid grid-cols-1  gap-3 max-h-[60vh] overflow-auto">
          {filtered.map((addon: any) => {
            const selectedAddon = local.find((a) => a.addonId === addon.id);
            return (
              <div
                key={addon.id}
                className={`relative bg-white border rounded-lg p-3 flex gap-3 items-start hover:shadow-md transition-shadow`}
              >
                <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                  <img
                    src={
                      `${IMAGE_BASE_URL}${addon.imageUrl}` || DishPlaceHolder
                    }
                    alt={addon.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DishPlaceHolder;
                    }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{addon.name}</h4>
                    <div className="text-sm font-semibold text-primaryColor">
                      Rs. {addon.price}
                    </div>
                  </div>
                  {addon.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {addon.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-4">
                    <div className="flex items-center gap-2">
                      {selectedAddon ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-2 py-1 border rounded"
                            onClick={() =>
                              setQty(
                                addon.id,
                                (selectedAddon.quantity || 1) - 1,
                              )
                            }
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">
                            {selectedAddon.quantity || 1}
                          </span>
                          <button
                            type="button"
                            className="px-2 py-1 border rounded"
                            onClick={() =>
                              setQty(
                                addon.id,
                                (selectedAddon.quantity || 1) + 1,
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggle(addon)}
                        className={`px-3 py-1 rounded-full text-sm border ${selectedAddon ? "bg-primaryColor text-white border-primaryColor" : "bg-white text-gray-700"}`}
                      >
                        {selectedAddon ? "Selected" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>

                {selectedAddon && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t">
        <button
          type="button"
          className="px-4 py-2 border rounded"
          onClick={() => setLocal([])}
        >
          Clear All
        </button>
        <button
          type="button"
          className="px-4 py-2 border rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => onSave(local)}
        >
          Save
        </button>
      </div>
    </div>
  );
}
