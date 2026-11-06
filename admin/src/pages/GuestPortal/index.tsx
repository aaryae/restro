import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  Bell,
  BookOpen,
  Copy,
  Info,
  MapPin,
  Phone,
  Receipt,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { CurrencySign } from "@/constants";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { captureTenantFromUrl } from "@/utils/tenantHandler";
import dishPlaceholder from "@/assets/product_placeholder.jpg";
import {
  fetchGuestBill,
  fetchGuestMenu,
  requestGuestBill,
  type GuestBillPayload,
  type GuestMenuItem,
  type GuestMenuPayload,
} from "./guestApi";
import "./guestPortal.css";

type Tab = "menu" | "bill" | "call" | "wifi" | "info";
type MenuView = "classic" | "photo";

function money(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `${CurrencySign}${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function escapeWifiField(value: string) {
  return String(value).replace(/([\\;,:"])/g, "\\$1");
}

function buildWifiQrPayload(ssid: string, password: string) {
  const type = password ? "WPA" : "nopass";
  return `WIFI:T:${type};S:${escapeWifiField(ssid)};${
    password ? `P:${escapeWifiField(password)};` : ""
  };`;
}

function itemPriceLabel(item: GuestMenuItem) {
  if (item.variants.length > 0) {
    const min = Math.min(...item.variants.map((v) => Number(v.price)));
    return `from ${money(min)}`;
  }
  return money(item.price);
}

function dishImage(item: GuestMenuItem) {
  return item.imageUrl ? buildAssetUrl(item.imageUrl) : dishPlaceholder;
}

export default function GuestPortal() {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = (routeToken || searchParams.get("token") || "").trim() || null;

  const [tab, setTab] = useState<Tab>("menu");
  const [menu, setMenu] = useState<GuestMenuPayload | null>(null);
  const [bill, setBill] = useState<GuestBillPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [billLoading, setBillLoading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [menuView, setMenuView] = useState<MenuView>("classic");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  useEffect(() => {
    captureTenantFromUrl();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGuestMenu(token);
      if (!res.success || !res.data) {
        setError(res.msg || "This menu isn't available right now.");
        setMenu(null);
      } else {
        setMenu(res.data);
        if (res.data.cafe.primaryColor) {
          document.documentElement.style.setProperty(
            "--guest-accent",
            res.data.cafe.primaryColor,
          );
        }
        const scale =
          res.data.cafe.menuFontSize === "xl"
            ? "1.14"
            : res.data.cafe.menuFontSize === "lg"
              ? "1.06"
              : "1";
        document.documentElement.style.setProperty("--guest-type-scale", scale);
      }
    } catch {
      setError("Could not reach the menu. Check your connection and try again.");
      setMenu(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadBill = useCallback(async () => {
    if (!token) return;
    setBillLoading(true);
    const res = await fetchGuestBill(token);
    if (res.success && res.data) {
      setBill(res.data);
    } else {
      setBill(null);
      if (tab === "bill" || tab === "call") {
        setToast({
          text: res.msg || "Could not load your bill.",
          error: true,
        });
      }
    }
    setBillLoading(false);
  }, [token, tab]);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    if (token) void loadBill();
  }, [token, loadBill]);

  const cafe = menu?.cafe || bill?.cafe;
  const table = menu?.table || bill?.table;

  const visibleSections = useMemo(() => {
    return (menu?.sections || []).filter((section) =>
      activeCategory === "all" ? true : section.id === activeCategory,
    );
  }, [menu, activeCategory]);

  const wifiPayload = useMemo(() => {
    if (!cafe?.wifi?.ssid) return null;
    return buildWifiQrPayload(cafe.wifi.ssid, cafe.wifi.password || "");
  }, [cafe?.wifi]);

  const handleCallBill = async () => {
    if (!token || calling) return;
    setCalling(true);
    const res = await requestGuestBill(token);
    if (res.success) {
      setToast({ text: res.msg || "We've asked staff to bring your bill." });
      await loadBill();
      setTab("bill");
    } else {
      setToast({
        text: res.msg || "Could not request the bill.",
        error: true,
      });
    }
    setCalling(false);
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast({ text: `${label} copied` });
    } catch {
      setToast({ text: `Could not copy ${label.toLowerCase()}`, error: true });
    }
  };

  if (loading) {
    return (
      <div className="gp">
        <div className="gp__loading">
          <div className="gp__spinner" />
          <p>Opening the menu…</p>
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="gp">
        <div className="gp__shell">
          <div className="gp__empty">
            <h1>Menu unavailable</h1>
            <p>
              {error ||
                "Open this page from your cafe link, or ask staff for a fresh table QR."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const billReady = Boolean(bill?.hasOpenOrders);
  const alreadyRequested = Boolean(bill?.billRequested);
  const hasTable = Boolean(token);

  const navTabs: Array<{
    id: Tab;
    label: string;
    icon: LucideIcon;
    hidden?: boolean;
  }> = [
    { id: "menu", label: "Menu", icon: BookOpen },
    { id: "bill", label: "Bill", icon: Receipt, hidden: !hasTable },
    { id: "call", label: "Call", icon: Bell, hidden: !hasTable },
    { id: "wifi", label: "Wi‑Fi", icon: Wifi },
    { id: "info", label: "Info", icon: Info },
  ].filter((t) => !t.hidden);

  return (
    <div className="gp">
      {toast ? (
        <div className={`gp__toast${toast.error ? " is-error" : ""}`} role="status">
          {toast.text}
        </div>
      ) : null}

      <header className="gp__top">
        <div className="gp__top-inner">
          <div className="gp__brand">
            {cafe?.logo ? (
              <img
                className="gp__logo"
                src={buildAssetUrl(cafe.logo)}
                alt=""
              />
            ) : (
              <div className="gp__logo-fallback" aria-hidden>
                {(cafe?.name || "M").trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className="gp__brand-text">
              <h1 className="gp__brand-name">{cafe?.name || "Menu"}</h1>
              <p className="gp__brand-sub">
                {table ? `Table ${table.tableNo}` : "Browse menu"}
                {cafe?.hours ? ` · ${cafe.hours}` : ""}
              </p>
            </div>
          </div>
          {tab === "menu" ? (
            <div className="gp__view-toggle" role="group" aria-label="Menu view">
              <button
                type="button"
                className={`gp__view-btn${menuView === "classic" ? " is-active" : ""}`}
                onClick={() => setMenuView("classic")}
                aria-pressed={menuView === "classic"}
              >
                List
              </button>
              <button
                type="button"
                className={`gp__view-btn${menuView === "photo" ? " is-active" : ""}`}
                onClick={() => setMenuView("photo")}
                aria-pressed={menuView === "photo"}
              >
                Photos
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {tab === "menu" ? (
        <>
          <div className="gp__sticky-cats">
            <div className="gp__cats" role="tablist" aria-label="Menu sections">
              <button
                type="button"
                className={`gp__cat${activeCategory === "all" ? " is-active" : ""}`}
                onClick={() => setActiveCategory("all")}
              >
                All
              </button>
              {(menu.sections || []).map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`gp__cat${
                    activeCategory === section.id ? " is-active" : ""
                  }`}
                  onClick={() => setActiveCategory(section.id)}
                >
                  {section.name}
                </button>
              ))}
            </div>
          </div>

          <div className="gp__shell">
            {visibleSections.length === 0 ? (
              <div className="gp__empty gp__empty--soft">
                <p>No dishes in this section yet.</p>
              </div>
            ) : menuView === "classic" ? (
              <div className="gp__menu">
                {visibleSections.map((section) => (
                  <section
                    key={section.id}
                    id={`section-${section.id}`}
                    className="gp__menu-section"
                  >
                    <h2 className="gp__menu-section-title">{section.name}</h2>
                    <ul className="gp__menu-list">
                      {section.items.map((item) => {
                        const open = expandedId === item.id;
                        const hasVariants = item.variants.length > 0;
                        return (
                          <li
                            key={item.id}
                            className={`gp__menu-item${
                              item.available ? "" : " is-unavailable"
                            }${open ? " is-open" : ""}`}
                          >
                            <button
                              type="button"
                              className="gp__menu-row"
                              onClick={() =>
                                setExpandedId(open ? null : item.id)
                              }
                              aria-expanded={open}
                            >
                              <span className="gp__menu-copy">
                                <span className="gp__menu-name-line">
                                  <span className="gp__menu-name">
                                    {item.name}
                                  </span>
                                  {item.isTopSelling ? (
                                    <span className="gp__menu-tag">Popular</span>
                                  ) : null}
                                  {!item.available ? (
                                    <span className="gp__menu-tag gp__menu-tag--muted">
                                      Sold out
                                    </span>
                                  ) : null}
                                </span>
                                {item.description ? (
                                  <span
                                    className={`gp__menu-blurb${
                                      open ? " is-full" : ""
                                    }`}
                                  >
                                    {item.description}
                                  </span>
                                ) : null}
                              </span>
                              <span className="gp__menu-price">
                                {itemPriceLabel(item)}
                              </span>
                            </button>
                            {hasVariants ? (
                              <ul className="gp__menu-variants">
                                {item.variants.map((variant) => (
                                  <li key={variant.id} className="gp__menu-variant">
                                    <span>{variant.name}</span>
                                    <span>{money(variant.price)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              visibleSections.map((section) => (
                <section
                  key={section.id}
                  id={`section-${section.id}`}
                  className="gp__section"
                >
                  <h2 className="gp__section-title">{section.name}</h2>
                  <ul className="gp__list">
                    {section.items.map((item) => {
                      const open = expandedId === item.id;
                      return (
                        <li
                          key={item.id}
                          className={`gp__item${
                            item.available ? "" : " is-unavailable"
                          }${open ? " is-open" : ""}`}
                        >
                          <button
                            type="button"
                            className="gp__item-btn"
                            onClick={() =>
                              setExpandedId(open ? null : item.id)
                            }
                            aria-expanded={open}
                          >
                            <img
                              src={dishImage(item)}
                              alt=""
                              className="gp__item-photo"
                              loading="lazy"
                            />
                            <div className="gp__item-body">
                              <div className="gp__item-row">
                                <span className="gp__item-name">{item.name}</span>
                                <span className="gp__item-dots" aria-hidden />
                                <span className="gp__item-price">
                                  {itemPriceLabel(item)}
                                </span>
                              </div>
                              <div className="gp__item-meta">
                                {item.isTopSelling ? (
                                  <span className="gp__badge">Popular</span>
                                ) : null}
                                {!item.available ? (
                                  <span className="gp__badge gp__badge--muted">
                                    Sold out
                                  </span>
                                ) : null}
                                {item.description && !open ? (
                                  <p className="gp__item-desc">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </button>
                          {open ? (
                            <div className="gp__item-detail">
                              {item.description ? <p>{item.description}</p> : null}
                              {item.variants.length > 0 ? (
                                <ul className="gp__variants">
                                  {item.variants.map((variant) => (
                                    <li key={variant.id}>
                                      <span>{variant.name}</span>
                                      <span>{money(variant.price)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              <p className="gp__hint">
                                Ask your waiter to place this order.
                              </p>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="gp__shell gp__shell--tab">
          {tab === "bill" ? (
            <div className="gp__panel">
              {billLoading ? (
                <div className="gp__loading gp__loading--inline">
                  <div className="gp__spinner" />
                  <p>Loading your bill…</p>
                </div>
              ) : !bill || !bill.hasOpenOrders ? (
                <div className="gp__empty gp__empty--soft">
                  <h2>No open bill yet</h2>
                  <p>Once staff place your order, it will show up here.</p>
                </div>
              ) : (
                <>
                  <div className="gp__panel-head">
                    <div>
                      <p className="gp__label">Current session</p>
                      <h2>Table {bill.table.tableNo}</h2>
                    </div>
                    {bill.billRequested ? (
                      <span className="gp__badge">Bill requested</span>
                    ) : null}
                  </div>
                  <ul className="gp__bill-lines">
                    {bill.orders.flatMap((order) =>
                      order.items.map((item) => (
                        <li key={item.id} className="gp__bill-line">
                          <div className="gp__bill-row">
                            <span>
                              {item.quantity}× {item.name}
                            </span>
                            <span>{money(item.itemTotal)}</span>
                          </div>
                          {item.addons.map((addon) => (
                            <div key={addon.id} className="gp__bill-addon">
                              <span>
                                + {addon.quantity}× {addon.name}
                              </span>
                              <span>{money(addon.subtotal)}</span>
                            </div>
                          ))}
                        </li>
                      )),
                    )}
                  </ul>
                  <div className="gp__total">
                    <span>Amount due</span>
                    <strong>{money(bill.payableTotal)}</strong>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {tab === "call" ? (
            <div className="gp__panel gp__panel--center">
              <h2>Request the bill</h2>
              <p>
                Notify staff that this table is ready to pay. Payment is still
                taken at the cafe.
              </p>
              <button
                type="button"
                className="gp__cta"
                disabled={calling || !billReady || alreadyRequested}
                onClick={() => void handleCallBill()}
              >
                {calling
                  ? "Asking staff…"
                  : alreadyRequested
                    ? "Bill already requested"
                    : billReady
                      ? "Request the bill"
                      : "Waiting for an order"}
              </button>
              <p className="gp__hint">
                {alreadyRequested
                  ? "A waiter has been notified."
                  : billReady
                    ? "One tap is enough. Wait about a minute before asking again."
                    : "Ask a waiter to take your order first."}
              </p>
            </div>
          ) : null}

          {tab === "wifi" ? (
            <div className="gp__panel gp__panel--center">
              {wifiPayload && cafe?.wifi ? (
                <>
                  <h2>Connect to Wi‑Fi</h2>
                  <p>Scan with your phone camera to join the cafe network.</p>
                  <div className="gp__qr">
                    <QRCodeCanvas value={wifiPayload} size={188} level="M" />
                  </div>
                  <div className="gp__wifi-fields">
                    <div className="gp__wifi-row">
                      <div>
                        <p className="gp__label">Network</p>
                        <p className="gp__wifi-value">{cafe.wifi.ssid}</p>
                      </div>
                      <button
                        type="button"
                        className="gp__icon-btn"
                        onClick={() =>
                          void copyText(cafe.wifi!.ssid, "Network name")
                        }
                        aria-label="Copy network name"
                      >
                        <Copy size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                    {cafe.wifi.password ? (
                      <div className="gp__wifi-row">
                        <div>
                          <p className="gp__label">Password</p>
                          <p className="gp__wifi-value">
                            {showWifiPassword
                              ? cafe.wifi.password
                              : "••••••••••••"}
                          </p>
                        </div>
                        <div className="gp__wifi-actions">
                          <button
                            type="button"
                            className="gp__text-btn"
                            onClick={() => setShowWifiPassword((v) => !v)}
                          >
                            {showWifiPassword ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            className="gp__icon-btn"
                            onClick={() =>
                              void copyText(cafe.wifi!.password, "Password")
                            }
                            aria-label="Copy password"
                          >
                            <Copy size={15} strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <h2>Wi‑Fi coming soon</h2>
                  <p>
                    This cafe hasn’t published guest Wi‑Fi details yet. Ask a
                    waiter for the network name and password.
                  </p>
                </>
              )}
            </div>
          ) : null}

          {tab === "info" ? (
            <div className="gp__panel">
              <h2>About {cafe?.name}</h2>
              <ul className="gp__info-list">
                {table ? (
                  <li>
                    <span className="gp__label">Table</span>
                    <strong>{table.tableNo}</strong>
                  </li>
                ) : null}
                {cafe?.hours ? (
                  <li>
                    <span className="gp__label">Hours</span>
                    <strong>{cafe.hours}</strong>
                  </li>
                ) : null}
                {cafe?.address ? (
                  <li>
                    <span className="gp__label">Address</span>
                    <strong className="gp__info-inline">
                      <MapPin size={14} strokeWidth={1.8} />
                      {cafe.address}
                    </strong>
                  </li>
                ) : null}
                {cafe?.phone ? (
                  <li>
                    <span className="gp__label">Phone</span>
                    <a className="gp__info-link" href={`tel:${cafe.phone}`}>
                      <Phone size={15} strokeWidth={1.8} />
                      {cafe.phone}
                    </a>
                  </li>
                ) : null}
                <li>
                  <span className="gp__label">Note</span>
                  <p>
                    {cafe?.infoNote ||
                      cafe?.welcome ||
                      "Browse the menu anytime. If you scanned a table QR, you can also check your bill and ask staff to bring it — no login needed."}
                  </p>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <nav className="gp__nav" aria-label="Guest navigation">
        <div
          className="gp__nav-grid"
          style={{
            gridTemplateColumns: `repeat(${navTabs.length}, minmax(0, 1fr))`,
          }}
        >
          {navTabs.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`gp__nav-btn${active ? " is-active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                <Icon size={23} strokeWidth={1.35} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
