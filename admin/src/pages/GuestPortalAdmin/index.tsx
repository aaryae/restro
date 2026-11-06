import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ExternalLink,
  QrCode,
  Settings2,
  Type,
  Wifi,
  Clock3,
  MessageSquareText,
} from "lucide-react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import {
  useGetSettingQuery,
  useUpdateSettingMutation,
} from "@/redux/services/settings";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { TABLE_URL } from "@/constants/apiUrlConstants";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { getTenantSlug } from "@/utils/tenantHandler";
import { checkAccess } from "@/utils/accessHelper";
import GuestQrModal from "@/pages/Table/GuestQrModal";

const GuestPortalSchema = z.object({
  wifiSsid: z.string().max(64).optional().nullable(),
  wifiPassword: z.string().max(128).optional().nullable(),
  guestWelcome: z.string().max(500).optional().nullable(),
  guestHours: z.string().max(180).optional().nullable(),
  guestInfoNote: z.string().max(800).optional().nullable(),
  guestMenuFontSize: z.enum(["md", "lg", "xl"]).optional().nullable(),
});

type GuestPortalForm = z.infer<typeof GuestPortalSchema>;

type TableRow = {
  id: number;
  tableNo: string;
  status?: string;
  floor?: { name?: string; floorNo?: string } | null;
};

export default function GuestPortalAdmin() {
  const tableAccess = checkAccess("Table");
  const settingsAccess = checkAccess("Company Settings");
  const canEditSettings = settingsAccess.includes("edit");
  const canViewTables = tableAccess.includes("view");

  const [qrOpen, setQrOpen] = useState(false);
  const [qrTable, setQrTable] = useState<{ id: number; tableNo: string } | null>(
    null,
  );

  const {
    data: settings,
    isLoading: settingsLoading,
    isSuccess: settingsReady,
  } = useGetSettingQuery("");
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  const tablesUrl = buildQueryString(`${TABLE_URL}list`, {
    page: 1,
    limit: 200,
  });
  const { data: tablesRes, isLoading: tablesLoading } = useGetApiQuery(
    { url: tablesUrl },
    { skip: !canViewTables },
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GuestPortalForm>({
    resolver: zodResolver(GuestPortalSchema),
  });

  useEffect(() => {
    if (!settingsReady || !settings?.data) return;
    reset({
      wifiSsid: settings.data.wifiSsid ?? "",
      wifiPassword: settings.data.wifiPassword ?? "",
      guestWelcome: settings.data.guestWelcome ?? "",
      guestHours: settings.data.guestHours ?? "",
      guestInfoNote: settings.data.guestInfoNote ?? "",
      guestMenuFontSize: settings.data.guestMenuFontSize || "md",
    });
  }, [settings?.data, settingsReady, reset]);

  const tables: TableRow[] = useMemo(() => {
    const rows = tablesRes?.data?.data;
    return Array.isArray(rows) ? rows : [];
  }, [tablesRes]);

  const previewUrl = useMemo(() => {
    const slug = getTenantSlug();
    const origin = window.location.origin;
    return slug ? `${origin}/g?tenant=${encodeURIComponent(slug)}` : `${origin}/g`;
  }, []);

  const onSubmit = async (data: GuestPortalForm) => {
    if (!canEditSettings) return;
    try {
      const settingId = Number(settings?.data?.id);
      const body = {
        ...settings?.data,
        ...data,
        wifiSsid: data.wifiSsid || null,
        wifiPassword: data.wifiPassword || null,
        guestWelcome: data.guestWelcome || null,
        guestHours: data.guestHours || null,
        guestInfoNote: data.guestInfoNote || null,
        guestMenuFontSize: data.guestMenuFontSize || "md",
      };
      const response = await updateSetting({
        body,
        id: Number.isFinite(settingId) ? settingId : undefined,
      }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    }
  };

  if (settingsLoading) {
    return <Spinner className="flex h-full items-center justify-center" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950 text-white shadow-sm">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.4fr_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200/80">
              Guest experience
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Guest Portal
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-teal-50/75">
              One place for table QR stickers, guest Wi‑Fi, and the welcome copy
              diners see when they scan.
            </p>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-teal-50"
          >
            Preview guest menu
            <ExternalLink size={15} />
          </a>
        </div>
      </section>

      <form
        className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <MessageSquareText size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Menu intro & info
                </h2>
                <p className="text-xs text-slate-500">
                  Shown on the guest cover and Info tab
                </p>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:p-5">
              <Input
                label="Welcome line"
                placeholder="Browse like a printed menu. Ask your waiter when you’re ready."
                type="text"
                {...register("guestWelcome")}
                error={errors.guestWelcome?.message}
                disabled={!canEditSettings}
              />
              <Input
                label="Hours"
                placeholder="Daily 8:00 AM – 10:00 PM"
                type="text"
                {...register("guestHours")}
                error={errors.guestHours?.message}
                disabled={!canEditSettings}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Info note
                </label>
                <textarea
                  className="min-h-[96px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
                  placeholder="Payment is taken at the cafe. Scan your table QR for bill requests."
                  {...register("guestInfoNote")}
                  disabled={!canEditSettings}
                />
                {errors.guestInfoNote?.message ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.guestInfoNote.message}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Type size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Menu text size
                </h2>
                <p className="text-xs text-slate-500">
                  Controls dish names and prices on the guest menu card
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Font size
              </label>
              <select
                className="h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
                {...register("guestMenuFontSize")}
                disabled={!canEditSettings}
              >
                <option value="md">Small (default)</option>
                <option value="lg">Medium</option>
                <option value="xl">Large</option>
              </select>
              {errors.guestMenuFontSize?.message ? (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.guestMenuFontSize.message}
                </p>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Wifi size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Guest Wi‑Fi
                </h2>
                <p className="text-xs text-slate-500">
                  Guests get a scannable QR on the Wi‑Fi tab
                </p>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Input
                label="Network name (SSID)"
                placeholder="Cafe Guest WiFi"
                type="text"
                {...register("wifiSsid")}
                error={errors.wifiSsid?.message}
                disabled={!canEditSettings}
              />
              <Input
                label="Password"
                placeholder="Password"
                type="text"
                {...register("wifiPassword")}
                error={errors.wifiPassword?.message}
                disabled={!canEditSettings}
              />
            </div>
          </section>

          {canEditSettings ? (
            <div className="flex justify-start">
              <Button type="submit" disabled={!isDirty || saving} isLoading={saving}>
                Save guest settings
              </Button>
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Settings2 size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  How guests use it
                </h2>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <Clock3 size={15} className="mt-0.5 shrink-0 text-teal-700" />
                    Print a QR for each table and place it on the stand.
                  </li>
                  <li className="flex gap-2">
                    <QrCode size={15} className="mt-0.5 shrink-0 text-teal-700" />
                    Guests open a scrollable restaurant-style menu — no login.
                  </li>
                  <li className="flex gap-2">
                    <Wifi size={15} className="mt-0.5 shrink-0 text-teal-700" />
                    Wi‑Fi, bill view, and bill request live in the bottom nav.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
              Browse link
            </p>
            <p className="mt-2 break-all text-sm font-medium text-slate-800">
              {previewUrl}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Table QRs include a token so guests can also see that table’s bill.
            </p>
          </section>
        </aside>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <QrCode size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Table QR codes
              </h2>
              <p className="text-xs text-slate-500">
                Generate, print, or refresh a sticker for each table
              </p>
            </div>
          </div>
        </div>

        {!canViewTables ? (
          <p className="p-5 text-sm text-slate-500">
            You need Table view access to manage guest QR codes.
          </p>
        ) : tablesLoading ? (
          <div className="flex justify-center p-10">
            <Spinner />
          </div>
        ) : tables.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No tables yet. Add tables first, then generate QR stickers here.
          </p>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => {
                  setQrTable({ id: table.id, tableNo: table.tableNo });
                  setQrOpen(true);
                }}
                className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-teal-300 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {table.floor?.name || table.floor?.floorNo || "Floor"}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      Table {table.tableNo}
                    </p>
                    {table.status ? (
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {table.status}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm ring-1 ring-slate-200 transition group-hover:bg-teal-700 group-hover:text-white group-hover:ring-teal-700">
                    <QrCode size={16} />
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium text-teal-800">
                  Open QR · print or copy
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <GuestQrModal
        tableId={qrTable?.id ?? null}
        tableNo={qrTable?.tableNo}
        open={qrOpen}
        onOpenChange={(open) => {
          setQrOpen(open);
          if (!open) setQrTable(null);
        }}
      />
    </div>
  );
}
