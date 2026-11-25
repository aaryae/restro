import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, MessageSquareText, QrCode, Wifi } from "lucide-react";
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
    <form
      className="flex min-w-0 w-full flex-col gap-5 pb-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-slate-800 sm:text-xl">
            Guest Portal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Table QR stickers, guest Wi‑Fi, and welcome copy diners see when they
            scan.
          </p>
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Preview guest menu
          <ExternalLink size={14} />
        </a>
      </div>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
            <MessageSquareText size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">Guest copy</h2>
            <p className="text-xs text-slate-500">
              Shown on the guest cover and Info tab
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5">
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
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Info note
            </label>
            <textarea
              className="min-h-[96px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primaryColor focus:ring-2 focus:ring-primaryColor/20 disabled:bg-slate-50"
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Font size
            </label>
            <select
              className="h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primaryColor focus:ring-2 focus:ring-primaryColor/20 disabled:bg-slate-50"
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
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
            <Wifi size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">Guest Wi‑Fi</h2>
            <p className="text-xs text-slate-500">
              Guests get a scannable QR on the Wi‑Fi tab
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5">
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

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
            <QrCode size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">
              Table QR codes
            </h2>
            <p className="text-xs text-slate-500">
              Generate, print, or refresh a sticker for each table
            </p>
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
                className="group rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-primaryColor/40 hover:bg-white hover:shadow-sm"
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
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primaryColor shadow-sm ring-1 ring-slate-200 transition group-hover:bg-primaryColor group-hover:text-white group-hover:ring-primaryColor">
                    <QrCode size={16} />
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium text-slate-600">
                  Open QR · print or copy
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {canEditSettings ? (
        <div className="form-actions flex justify-start pt-1">
          <Button
            type="submit"
            className="submit-button inline-flex h-10 w-fit items-center gap-2 rounded-lg px-5 text-sm font-medium"
            disabled={!isDirty || saving}
            isLoading={saving}
          >
            Save guest settings
          </Button>
        </div>
      ) : null}

      <GuestQrModal
        tableId={qrTable?.id ?? null}
        tableNo={qrTable?.tableNo}
        open={qrOpen}
        onOpenChange={(open) => {
          setQrOpen(open);
          if (!open) setQrTable(null);
        }}
      />
    </form>
  );
}
