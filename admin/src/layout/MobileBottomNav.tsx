import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  CircleDollarSign,
  ClipboardList,
  Ellipsis,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Sofa,
  LandmarkIcon,
  Users,
  ImageIcon,
  Settings,
  UtensilsCrossed,
  ChartBarStacked,
  HandPlatter,
  Layers,
  ClipboardPlus,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NavChild = { label: string; path: string; icon: LucideIcon };
type MoreSection = {
  label: string;
  icon: LucideIcon;
  children?: NavChild[];
  path?: string;
};

/* ------------------------------------------------------------------ */
/*  "More" sheet sections                                              */
/* ------------------------------------------------------------------ */

const MORE_SECTIONS: MoreSection[] = [
  {
    label: "Menu",
    icon: UtensilsCrossed,
    children: [
      { label: "Items", path: "/admin/item/list", icon: UtensilsCrossed },
      { label: "Categories", path: "/admin/product-category/list", icon: ChartBarStacked },
      { label: "Open Item", path: "/admin/open-item/list", icon: HandPlatter },
      { label: "Addons", path: "/admin/addons/list", icon: HandPlatter },
    ],
  },
  {
    label: "Finance",
    icon: CircleDollarSign,
    children: [
      { label: "Revenue", path: "/admin/revenue/list", icon: CircleDollarSign },
      { label: "Purchase", path: "/admin/purchase/list", icon: ShoppingCart },
      { label: "Purchase Category", path: "/admin/purchase-category/list", icon: Layers },
      { label: "Expense", path: "/admin/expense/list", icon: CircleDollarSign },
      { label: "Expense Category", path: "/admin/expense-category/list", icon: CircleDollarSign },
      { label: "Supplier", path: "/admin/supplier/list", icon: CircleDollarSign },
    ],
  },
  { label: "Customer", icon: UserCheck, path: "/admin/customer/list" },
  {
    label: "Floors & Tables",
    icon: Sofa,
    children: [
      { label: "Floor", path: "/admin/floor/list", icon: Sofa },
      { label: "Table", path: "/admin/table/list", icon: Sofa },
      { label: "Department", path: "/admin/department/list", icon: Sofa },
    ],
  },
  {
    label: "Cash & Banks",
    icon: LandmarkIcon,
    children: [
      { label: "Accounts", path: "/admin/account/list", icon: LandmarkIcon },
      { label: "Transaction", path: "/admin/transaction/list", icon: LandmarkIcon },
      { label: "Permission", path: "/admin/account-permission/list", icon: LandmarkIcon },
    ],
  },
  {
    label: "Users & Roles",
    icon: Users,
    children: [
      { label: "Users", path: "/admin/auth/list", icon: Users },
      { label: "Roles", path: "/admin/roles/list", icon: Users },
    ],
  },
  { label: "Media", icon: ImageIcon, path: "/admin/media-category/list" },
  {
    label: "Reports",
    icon: ClipboardList,
    children: [
      { label: "Daily Reports", path: "/admin/daily-reports", icon: ClipboardPlus },
      { label: "Table Report", path: "/admin/table-report", icon: ClipboardPlus },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "Company Settings", path: "/admin/settings/list", icon: Settings },
      { label: "Ledger", path: "/admin/ledger/list", icon: ClipboardList },
      { label: "Recently Deleted", path: "/admin/recently-deleted", icon: Settings },
    ],
  },
];

const FINANCE_SECTION = MORE_SECTIONS.find((s) => s.label === "Finance")!;

/* ------------------------------------------------------------------ */
/*  Bottom-bar primary tabs                                            */
/* ------------------------------------------------------------------ */

type PrimaryTab = {
  label: string;
  icon: LucideIcon;
  path?: string;
  action?: "open-finance";
};

const PRIMARY_TABS: PrimaryTab[] = [
  { label: "Home", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Orders", icon: ShoppingCart, path: "/admin/order/list" },
  { label: "Finance", icon: CircleDollarSign, action: "open-finance" },
  { label: "Reports", icon: ClipboardList, path: "/admin/daily-reports" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isTabActive(tab: PrimaryTab, pathname: string) {
  if (tab.action === "open-finance")
    return (
      pathname.startsWith("/admin/revenue") ||
      pathname.startsWith("/admin/purchase") ||
      pathname.startsWith("/admin/expense") ||
      pathname.startsWith("/admin/supplier")
    );
  const p = tab.path!;
  if (p === "/admin/dashboard")
    return pathname === p || pathname === "/admin" || pathname === "/admin/";
  if (p === "/admin/daily-reports")
    return pathname.startsWith("/admin/daily-report") || pathname.startsWith("/admin/table-report");
  return pathname.startsWith(p.replace("/list", ""));
}

const DISMISS_THRESHOLD = 80;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [drillSection, setDrillSection] = useState<MoreSection | null>(null);

  /* -- drag-to-dismiss state -- */
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setDragOffset(0);
    setTimeout(() => setDrillSection(null), 300);
  }, []);

  const openSheet = useCallback((section?: MoreSection | null) => {
    setDrillSection(section ?? null);
    setDragOffset(0);
    setSheetOpen(true);
  }, []);

  useEffect(() => {
    closeSheet();
  }, [pathname, closeSheet]);

  /* Lock body scroll when sheet is open */
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [sheetOpen]);

  /* -- Touch handlers for swipe-to-dismiss -- */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollable = sheetRef.current?.querySelector("[data-sheet-scroll]") as HTMLElement | null;
    if (scrollable && scrollable.scrollTop > 0) return;
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    dragCurrentY.current = e.touches[0].clientY;
    const delta = Math.max(0, dragCurrentY.current - dragStartY.current);
    setDragOffset(delta);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = dragCurrentY.current - dragStartY.current;
    if (delta > DISMISS_THRESHOLD) {
      closeSheet();
    } else {
      setDragOffset(0);
    }
  }, [closeSheet]);

  /* -- Tab handlers -- */
  const handleTabTap = (tab: PrimaryTab) => {
    if (tab.action === "open-finance") {
      openSheet(FINANCE_SECTION);
      return;
    }
    navigate(tab.path!);
  };

  const handleSectionTap = (section: MoreSection) => {
    if (section.path && !section.children?.length) {
      navigate(section.path);
      return;
    }
    setDrillSection(section);
  };

  const isMoreActive =
    !PRIMARY_TABS.some((t) => isTabActive(t, pathname)) && pathname !== "/admin/dashboard";

  const sheetTransform = sheetOpen
    ? `translateY(${dragOffset}px)`
    : "translateY(100%)";

  return (
    <>
      {/* ---- Bottom bar ---- */}
      <nav className="fixed inset-x-0 bottom-0 z-[60] bg-[var(--serve-surface)] pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="h-px bg-[var(--serve-border)]" />
        <div className="grid h-[3.5rem] grid-cols-5">
          {PRIMARY_TABS.map((tab) => {
            const active = isTabActive(tab, pathname);
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleTabTap(tab)}
                className="relative flex flex-col items-center justify-center gap-[2px] outline-none"
              >
                {active && (
                  <span className="absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-[var(--serve-accent)]" />
                )}
                <tab.icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.5}
                  className={active ? "text-[var(--serve-accent)]" : "text-[var(--serve-muted)]"}
                />
                <span
                  className={`text-[10px] leading-none font-medium ${
                    active ? "text-[var(--serve-accent)]" : "text-[var(--serve-muted)]"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More */}
          <button
            type="button"
            onClick={() => openSheet()}
            className="relative flex flex-col items-center justify-center gap-[2px] outline-none"
          >
            {(sheetOpen || isMoreActive) && (
              <span className="absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-[var(--serve-accent)]" />
            )}
            <Ellipsis
              size={20}
              strokeWidth={sheetOpen || isMoreActive ? 2.2 : 1.5}
              className={sheetOpen || isMoreActive ? "text-[var(--serve-accent)]" : "text-[var(--serve-muted)]"}
            />
            <span
              className={`text-[10px] leading-none font-medium ${
                sheetOpen || isMoreActive ? "text-[var(--serve-accent)]" : "text-[var(--serve-muted)]"
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ---- Backdrop ---- */}
      <div
        onClick={closeSheet}
        className={`fixed inset-0 z-[61] transition-all duration-300 md:hidden ${
          sheetOpen
            ? "bg-black/40 opacity-100"
            : "pointer-events-none bg-black/0 opacity-0"
        }`}
        style={{ touchAction: "none" }}
      />

      {/* ---- Bottom sheet ---- */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="fixed inset-x-0 bottom-0 z-[62] flex flex-col rounded-t-2xl bg-[var(--serve-surface)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:hidden"
        style={{
          maxHeight: "70vh",
          paddingBottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
          transform: sheetTransform,
          transition: isDragging.current ? "none" : "transform 300ms cubic-bezier(.32,.72,0,1)",
          willChange: "transform",
          touchAction: "none",
        }}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 cursor-grab justify-center pb-1 pt-3 active:cursor-grabbing">
          <span className="h-[5px] w-10 rounded-full bg-[var(--serve-muted)] opacity-30" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center px-5 pb-3 pt-0.5">
          {drillSection ? (
            <button
              type="button"
              onClick={() => setDrillSection(null)}
              className="flex items-center gap-2 text-[15px] font-semibold text-[var(--serve-fg)]"
            >
              <ArrowLeft size={18} strokeWidth={2.2} />
              {drillSection.label}
            </button>
          ) : (
            <span className="text-[15px] font-semibold text-[var(--serve-fg)]">
              Browse
            </span>
          )}
        </div>

        <div className="mx-4 h-px shrink-0 bg-[var(--serve-border)]" />

        {/* Scrollable body */}
        <div
          data-sheet-scroll
          className="flex-1 overflow-y-auto overscroll-contain px-2 py-2"
          style={{ touchAction: "pan-y" }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {!drillSection ? (
            <ul className="space-y-px">
              {MORE_SECTIONS.map((section) => {
                const hasChildren = !!section.children?.length;
                return (
                  <li key={section.label}>
                    <button
                      type="button"
                      onClick={() => handleSectionTap(section)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-[11px] text-left transition-colors active:bg-[var(--serve-surface-2)]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--serve-surface-2)] text-[var(--serve-muted)]">
                        <section.icon size={18} strokeWidth={1.7} />
                      </span>
                      <span className="flex-1 text-[13.5px] font-medium text-[var(--serve-fg)]">
                        {section.label}
                      </span>
                      {hasChildren && (
                        <ChevronRight size={16} className="text-[var(--serve-muted)] opacity-40" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="space-y-px">
              {drillSection.children?.map((child) => {
                const active =
                  pathname === child.path ||
                  pathname.startsWith(child.path.replace("/list", ""));
                return (
                  <li key={child.path}>
                    <button
                      type="button"
                      onClick={() => navigate(child.path)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-[11px] text-left transition-colors active:bg-[var(--serve-surface-2)] ${
                        active ? "bg-[var(--serve-accent)]/[0.07]" : ""
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
                          active
                            ? "bg-[var(--serve-accent)] text-white"
                            : "bg-[var(--serve-surface-2)] text-[var(--serve-muted)]"
                        }`}
                      >
                        <child.icon size={18} strokeWidth={1.7} />
                      </span>
                      <span
                        className={`flex-1 text-[13.5px] font-medium ${
                          active ? "text-[var(--serve-accent)]" : "text-[var(--serve-fg)]"
                        }`}
                      >
                        {child.label}
                      </span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--serve-accent)]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
