import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

type SelectedAddon = {
  addonId: number;
  name: string;
  price: number;
  quantity: number;
};

type AddonPickerProps = {
  productId: string;
  selected: SelectedAddon[];
  onSave: (addons: SelectedAddon[]) => void;
};

export default function AddonPicker({
  productId,
  selected,
  onSave,
}: AddonPickerProps) {
  const { data, isLoading } = useGetApiQuery(
    { url: `product/${productId}` },
    { skip: !productId },
  );
  const [local, setLocal] = useState<SelectedAddon[]>(selected || []);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    setLocal(selected || []);
  }, [productId, selected]);

  const addons = data?.data?.addons || [];

  const toggle = (addon: {
    id: number;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
  }) => {
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

  const filtered = addons.filter((a: { name?: string }) =>
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
          <p className="text-sm text-slate-500">Choose addons for this item</p>
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
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
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
          filtered.map(
            (addon: {
              id: number;
              name: string;
              price: number;
              description?: string;
              imageUrl?: string;
            }) => {
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
                      loading="lazy"
                      decoding="async"
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
            },
          )
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
