import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import CustomDialog from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import {
  EntityForm,
  FieldHeader,
  FieldIcon,
} from "@/components/EntityForm";
import { ImageInputUI } from "@/components/ImageComponent";
import Input from "@/components/Input";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import ToggleSwitch from "@/components/Switch";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { LIST_LIMIT } from "@/constants/listLimits";
import { ADDON_URL, DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import { clearSelectedMedia } from "@/redux/feature/mediaSlice";
import { useGetApiQuery } from "@/redux/services/crudApi";
import {
  useCreateProductMutation,
  useGetProductByIdQuery,
  useUpdateProductByIdMutation,
} from "@/redux/services/product";
import { useListAllProductCategoryQuery } from "@/redux/services/productCategory";
import { useAppSelector } from "@/redux/store/hooks";
import { PRODUCT_LIST_ROUTE } from "@/routes/routeNames";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AlignLeft,
  Banknote,
  ChefHat,
  Eye,
  FolderTree,
  Package,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ProductSchema } from "./schema";

const MediaComponent = lazy(() => import("@/components/MediaComponent"));
const AddEditProductCategory = lazy(
  () => import("../ProductCategory/AddEditProductCategory"),
);
const AddEditAddons = lazy(() => import("../Addons/AddEditAddons"));
const ListCategoryDetails = lazy(() => import("./ListCategoryDetails"));

type ProductFormType = z.infer<typeof ProductSchema>;

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormType>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      productCategoryId: "",
      departmentId: "",
      description: "",
      hasVariant: false,
      isTopSelling: false,
      topSellingOrder: 0,
      variants: [],
      price: undefined,
      mediaArr: [],
      addons: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const hasVariant = watch("hasVariant");
  const isTopSelling = watch("isTopSelling");
  const mediaArr = watch("mediaArr") || [];
  const productImage =
    Array.isArray(mediaArr) && mediaArr.length > 0 ? mediaArr[0] : "";

  const dispatch = useDispatch();
  const selectedImage = useAppSelector((state) => state.media.selectedImage);
  const [isImageModelOpen, setIsImageModalOpen] = useState(false);

  const handleConfirmImage = () => {
    setValue("mediaArr", selectedImage ? [selectedImage] : [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    dispatch(clearSelectedMedia());
    setIsImageModalOpen(false);
  };

  const clearImage = () => {
    setValue("mediaArr", [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    dispatch(clearSelectedMedia());
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addonDrawerOpen, setAddonDrawerOpen] = useState(false);
  const selectedAddons = watch("addons");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [addonSearch, setAddonSearch] = useState("");
  const [knownAddons, setKnownAddons] = useState<
    Record<
      number,
      { id: number; name: string; price?: number; imageUrl?: string | null }
    >
  >({});

  const toggleAddon = (addonId: number) => {
    const current = Array.isArray(selectedAddons) ? [...selectedAddons] : [];
    const index = current.indexOf(addonId);
    if (index > -1) current.splice(index, 1);
    else current.push(addonId);
    setValue("addons", current, { shouldValidate: true, shouldDirty: true });
  };

  const [productCategoryOptions, setProductCategoryOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const {
    data: product,
    isSuccess: success,
    isLoading: loadingProduct,
  } = useGetProductByIdQuery(id, {
    skip: id === null || id === undefined,
  });

  const { data: productCategory, isSuccess: productCategorySuccess } =
    useListAllProductCategoryQuery({
      page: 1,
      limit: LIST_LIMIT,
    });

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductByIdMutation();

  const { data: departmentData } = useGetApiQuery({
    url: `${DEPARTMENT_URL}list?page=1&limit=${LIST_LIMIT}`,
  });

  const { data: addonListData } = useGetApiQuery(
    { url: `${ADDON_URL}?page=1&limit=${LIST_LIMIT}` },
    {
      skip:
        !addonDrawerOpen &&
        !addonDialogOpen &&
        !(Array.isArray(selectedAddons) && selectedAddons.length > 0),
    },
  );

  const addonCatalog = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        name: string;
        price?: number;
        imageUrl?: string | null;
        description?: string;
      }
    >();
    Object.values(knownAddons).forEach((a) => map.set(a.id, a));
    (addonListData?.data?.data || []).forEach((a: any) => {
      if (a?.id != null) map.set(a.id, a);
    });
    return map;
  }, [knownAddons, addonListData]);

  const departmentOptions = useMemo(() => {
    if (!departmentData?.data) return [];
    return departmentData?.data?.data.map(
      (item: { id: number; name: string }) => ({
        value: String(item.id),
        label: `${item.name}`,
      }),
    );
  }, [departmentData]);

  useEffect(() => {
    if (id && product?.data) {
      const price = product?.data?.hasVariant
        ? undefined
        : product?.data?.price != null && product?.data?.price !== ""
          ? Number(product.data.price)
          : undefined;
      reset({
        ...product?.data,
        productCategoryId: String(product?.data?.productCategoryId),
        departmentId:
          product?.data?.departmentId != null
            ? String(product.data.departmentId)
            : "",
        variants: Array.isArray(product?.data?.variants)
          ? product.data.variants.map((v: any) => ({
              name: v.name ?? "",
              description: v.description ?? "",
              price:
                v.price != null && v.price !== ""
                  ? Number(v.price)
                  : undefined,
              quantity:
                v.quantity != null && v.quantity !== ""
                  ? Number(v.quantity)
                  : undefined,
            }))
          : [],
        price,
        isTopSelling: Boolean(product?.data?.isTopSelling),
        topSellingOrder: Number(product?.data?.topSellingOrder || 0),
        mediaArr: (() => {
          const urls =
            product?.data?.mediaArr
              ?.map((each: { imageUrl?: string }) => each?.imageUrl)
              .filter(Boolean) || [];
          return urls.slice(0, 1);
        })(),
        addons: Array.isArray((product?.data as any)?.addons)
          ? (product?.data as any).addons.map((a: any) => a.id)
          : [],
      });
      if (Array.isArray((product?.data as any)?.addons)) {
        const fromProduct: Record<
          number,
          { id: number; name: string; price?: number; imageUrl?: string | null }
        > = {};
        (product?.data as any).addons.forEach((a: any) => {
          if (a?.id != null) {
            fromProduct[a.id] = {
              id: a.id,
              name: a.name,
              price: a.price,
              imageUrl: a.imageUrl,
            };
          }
        });
        setKnownAddons((prev) => ({ ...prev, ...fromProduct }));
      }
      setSelectedOption(product?.data?.productCategoryId);
    } else {
      reset({
        productCategoryId: "",
        departmentId: "",
        hasVariant: false,
        isTopSelling: false,
        topSellingOrder: 0,
        variants: [],
        price: undefined,
        mediaArr: [],
        addons: [],
      });
    }
  }, [success, product, reset, id]);

  useEffect(() => {
    if (productCategorySuccess && productCategory?.data?.data) {
      const options = productCategory?.data?.data.map((each) => ({
        label: each.name,
        value: String(each.id),
      }));
      setProductCategoryOptions(options);
    }
  }, [productCategory, productCategorySuccess]);

  useEffect(() => {
    if (
      hasVariant &&
      fields.length === 0 &&
      (!id || (id && !product?.data?.variants?.length))
    ) {
      append({
        name: "",
        price: undefined as unknown as number,
        quantity: undefined as unknown as number,
        description: "",
      });
    }
  }, [hasVariant, fields, append, id, product]);

  const closeDialog = () => setDialogOpen(false);

  const openDrawer = (event: React.MouseEvent) => {
    event.preventDefault();
    setDrawerOpen(true);
  };

  const handleSelectComponent = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setValue("productCategoryId", event.target.value);
    setSelectedOption(Number(event.target.value));
  };

  const handleAddVariant = () => {
    append({
      name: "",
      price: undefined as unknown as number,
      quantity: undefined as unknown as number,
      description: "",
    });
  };

  const onSubmit = async (data: ProductFormType) => {
    const body = {
      ...data,
      price: data.hasVariant ? 0 : Number(data.price || 0),
      productCategoryId: Number(data.productCategoryId),
      departmentId:
        data.departmentId != null && Number(data.departmentId) > 0
          ? Number(data.departmentId)
          : null,
      isTopSelling: Boolean(data.isTopSelling),
      topSellingOrder: Number(data.topSellingOrder || 0),
      variants: data.hasVariant ? data.variants : [],
    };
    try {
      const response = id
        ? await updateProduct({ body, id }).unwrap()
        : await createProduct(body).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => navigate(PRODUCT_LIST_ROUTE),
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  const selectedCount = Array.isArray(selectedAddons)
    ? selectedAddons.length
    : 0;

  return (
    <>
      <EntityForm
        title={isEdit ? "Edit Item" : "Add Item"}
        sectionTitle="Item details"
        description="Name, category, price, image, and optional addons."
        icon={Package}
        columns={2}
        maxWidthClass="max-w-4xl"
        onSubmit={handleSubmit(onSubmit)}
        onCancel={() => navigate(PRODUCT_LIST_ROUTE)}
        isSaving={isSubmitting || creating || updating}
        isLoading={isEdit && loadingProduct && !product}
        submitLabel={isEdit ? "Update" : "Submit"}
      >
        <Input
          label="Name"
          placeholder="e.g. Masala Chai, Chicken Momo"
          leftSection={<FieldIcon icon={Type} />}
          {...register("name")}
          error={errors.name?.message}
          isRequired
        />

        {!hasVariant ? (
          <Input
            label="Price"
            type="number"
            step={0.01}
            placeholder="0"
            leftSection={<FieldIcon icon={Banknote} />}
            {...register("price", {
              setValueAs: (v) =>
                v === "" || v === null || v === undefined
                  ? undefined
                  : Number(v),
            })}
            error={errors.price?.message}
            isRequired
          />
        ) : (
          <div className="hidden md:block" aria-hidden />
        )}

        <Controller
          name="productCategoryId"
          control={control}
          render={({ field }) => (
            <div className="flex min-w-0 flex-col">
              <FieldHeader
                label="Item Category"
                required
                actions={
                  <>
                    <button
                      type="button"
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--serve-border)] bg-[var(--serve-surface)] px-2 text-[11px] font-medium text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)]"
                      onClick={openDrawer}
                      title="View category"
                    >
                      <Eye size={12} strokeWidth={2.5} />
                      Show
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 items-center gap-1 rounded-md bg-primaryColor px-2 text-[11px] font-medium text-white transition hover:bg-primaryColor/90"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDialogOpen(true);
                      }}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      Add
                    </button>
                  </>
                }
              />
              <Select
                {...field}
                options={productCategoryOptions}
                leftSection={<FieldIcon icon={FolderTree} />}
                onChange={(event) => handleSelectComponent(event)}
                error={errors.productCategoryId?.message}
                isRequired
              />
            </div>
          )}
        />

        <Controller
          name="departmentId"
          control={control}
          render={({ field }) => (
            <div className="flex min-w-0 flex-col">
              <FieldHeader label="Department" />
              <Select
                {...field}
                options={departmentOptions}
                leftSection={<FieldIcon icon={ChefHat} />}
                error={errors.departmentId?.message}
                clearable
                clearLabel="None"
              />
            </div>
          )}
        />

        {(!id || success) && (
          <TextArea
            label="Description"
            placeholder="Optional short description for this item"
            className="md:col-span-2"
            rows={3}
            leftSection={<FieldIcon icon={AlignLeft} />}
            {...register("description")}
            error={errors.description?.message}
          />
        )}

        <div className="flex min-w-0 flex-col md:col-span-2">
          <span className="mb-1.5 text-xs font-medium text-[var(--serve-muted)]">
            Image
          </span>
          <Suspense
            fallback={
              <div className="h-40 w-full animate-pulse rounded-[10px] bg-[var(--serve-surface-2)]" />
            }
          >
            <MediaComponent
              title={
                <ImageInputUI
                  image={productImage}
                  imageMessage="Upload one image. Allowed JPG, GIF or PNG."
                  onClear={productImage ? clearImage : undefined}
                />
              }
              isMultiSelect={false}
              handleConfirmImage={handleConfirmImage}
              open={isImageModelOpen}
              setOpen={setIsImageModalOpen}
            />
          </Suspense>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--serve-fg)]">
                Show in Top Selling
              </p>
              <p className="mt-0.5 text-xs text-[var(--serve-muted)]">
                Pin this item on the Create Order menu grid
              </p>
            </div>
            <ToggleSwitch
              isActive={Boolean(isTopSelling)}
              onToggle={(next) =>
                setValue("isTopSelling", next, { shouldDirty: true })
              }
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col md:col-span-2">
          <FieldHeader
            label="Addons"
            actions={
              <>
                <button
                  type="button"
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--serve-border)] bg-[var(--serve-surface)] px-2 text-[11px] font-medium text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)]"
                  onClick={() => setAddonDrawerOpen(true)}
                >
                  Select
                </button>
                <button
                  type="button"
                  className="inline-flex h-7 items-center gap-1 rounded-md bg-primaryColor px-2 text-[11px] font-medium text-white transition hover:bg-primaryColor/90"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAddonDialogOpen(true);
                  }}
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Add
                </button>
              </>
            }
          />
          <div className="rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 py-2.5">
            <p className="mb-2 text-xs text-[var(--serve-muted)]">
              {selectedCount} selected
            </p>
            {selectedCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(selectedAddons || []).map((addonId) => {
                  const a = addonCatalog.get(addonId);
                  if (!a) return null;
                  return (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--serve-fg)]"
                    >
                      {a.name}
                      <button
                        type="button"
                        aria-label={`Remove ${a.name}`}
                        className="ml-0.5 text-[var(--serve-muted)] hover:text-[var(--serve-fg)]"
                        onClick={() => toggleAddon(a.id)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--serve-muted)]">
                No addons linked. Use Select or Add above.
              </p>
            )}
          </div>
        </div>

        {hasVariant ? (
          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--serve-muted)]">
                Variants
              </span>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-primaryColor px-3 text-xs font-medium text-white transition hover:bg-primaryColor/90"
                onClick={handleAddVariant}
              >
                <Plus size={14} />
                Add Variant
              </button>
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
              >
                <Input
                  label="Name"
                  placeholder="Variant Name"
                  {...register(`variants.${index}.name`)}
                  error={errors.variants?.[index]?.name?.message}
                />
                <Input
                  label="Price"
                  type="number"
                  step={0.01}
                  placeholder="0"
                  {...register(`variants.${index}.price`, {
                    setValueAs: (v) =>
                      v === "" || v === null || v === undefined
                        ? undefined
                        : Number(v),
                  })}
                  error={errors.variants?.[index]?.price?.message}
                />
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="0"
                  {...register(`variants.${index}.quantity`, {
                    setValueAs: (v) =>
                      v === "" || v === null || v === undefined
                        ? undefined
                        : Number(v),
                  })}
                  error={errors.variants?.[index]?.quantity?.message}
                />
                <Input
                  label="Description"
                  placeholder="Optional"
                  {...register(`variants.${index}.description`)}
                  error={errors.variants?.[index]?.description?.message}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="inline-flex h-10 w-10 items-center justify-center self-end rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                  title="Remove variant"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </EntityForm>

      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Add Item Category"
        titleDescription="Create a category to group menu items."
        contentClassName="max-w-md sm:max-w-lg"
        closeOnOutsideClick
        nested
      >
        <Suspense
          fallback={
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
          }
        >
          {dialogOpen ? (
            <AddEditProductCategory
              isComponent={true}
              closeModal={closeDialog}
            />
          ) : null}
        </Suspense>
      </CustomDialog>

      <CustomDialog
        dialogOpen={addonDialogOpen}
        setDialogOpen={setAddonDialogOpen}
        title="Add Addon"
        titleDescription="Create an addon and attach it to this item."
        contentClassName="max-w-md sm:max-w-lg"
        closeOnOutsideClick
        nested
      >
        <Suspense
          fallback={
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
          }
        >
          {addonDialogOpen ? (
            <AddEditAddons
              isComponent={true}
              closeModal={() => setAddonDialogOpen(false)}
              onCreated={(addon) => {
                setKnownAddons((prev) => ({
                  ...prev,
                  [addon.id]: addon,
                }));
                const current = Array.isArray(selectedAddons)
                  ? [...selectedAddons]
                  : [];
                if (!current.includes(addon.id)) {
                  setValue("addons", [...current, addon.id], {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
          ) : null}
        </Suspense>
      </CustomDialog>

      <Drawer
        isOpen={drawerOpen}
        setIsOpen={setDrawerOpen}
        width="w-full max-w-md"
        className="border-l border-slate-200/80 shadow-2xl"
        contentClassName="p-6 pt-5"
      >
        <Suspense
          fallback={
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
          }
        >
          {drawerOpen ? <ListCategoryDetails id={selectedOption} /> : null}
        </Suspense>
      </Drawer>

      <Drawer
        isOpen={addonDrawerOpen}
        setIsOpen={setAddonDrawerOpen}
        width="w-full max-w-md sm:w-[400px]"
        contentClassName="p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 space-y-3 border-b border-slate-100 px-5 pb-4 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-left text-base font-semibold text-slate-900">
                  Select Addons
                </h3>
                <p className="mt-0.5 text-left text-sm text-slate-500">
                  Tap a card to add or remove
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {selectedCount} selected
                </span>
                {!!selectedAddons?.length && (
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
                    onClick={() => {
                      setValue("addons", [], {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                value={addonSearch}
                onChange={(e) => setAddonSearch(e.target.value)}
                placeholder="Search addons..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-16 text-sm text-slate-800 outline-none transition focus:border-primaryColor/40 focus:bg-white focus:ring-2 focus:ring-primaryColor/15"
              />
              {addonSearch && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200/70 hover:text-slate-700"
                  onClick={() => setAddonSearch("")}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
            {Array.from(addonCatalog.values())
              .filter((a) =>
                a.name.toLowerCase().includes(addonSearch.toLowerCase()),
              )
              .map((addon) => {
                const checked = (selectedAddons || []).includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    aria-pressed={checked}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      checked
                        ? "border-primaryColor/40 bg-primaryColor/[0.04] ring-1 ring-primaryColor/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80">
                      <img
                        src={
                          addon.imageUrl?.startsWith("http")
                            ? addon.imageUrl
                            : `${IMAGE_BASE_URL}${addon.imageUrl || ""}`
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
                    </div>

                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        checked
                          ? "bg-primaryColor text-white"
                          : "border border-slate-300 bg-white text-transparent"
                      }`}
                      aria-hidden
                    >
                      ✓
                    </span>
                  </button>
                );
              })}

            {Array.from(addonCatalog.values()).filter((a) =>
              a.name.toLowerCase().includes(addonSearch.toLowerCase()),
            ).length === 0 && (
              <div className="space-y-3 py-10 text-center">
                <p className="text-sm text-slate-500">No addons found</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primaryColor px-3 py-2 text-sm font-medium text-white transition hover:bg-primaryColor/90"
                  onClick={() => {
                    setAddonDrawerOpen(false);
                    setAddonDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Create addon
                </button>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => setAddonDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 flex-1 rounded-lg bg-primaryColor text-sm font-medium text-white transition hover:bg-primaryColor/90"
                onClick={() => setAddonDrawerOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}
