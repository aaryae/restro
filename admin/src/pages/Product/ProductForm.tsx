import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import Button from "@/components/Button";
import CustomDialog from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import { MultipleImageInputUI } from "@/components/ImageComponent";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { LIST_LIMIT } from "@/constants/listLimits";
import { ADDON_URL, DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import useImageHandler from "@/hooks/useImageHandler";
import useTranslation from "@/locale/useTranslation";
import { useGetApiQuery } from "@/redux/services/crudApi";
import {
  useCreateProductMutation,
  useGetProductByIdQuery,
  useUpdateProductByIdMutation,
} from "@/redux/services/product";
import { useListAllProductCategoryQuery } from "@/redux/services/productCategory";
import { PRODUCT_LIST_ROUTE } from "@/routes/routeNames";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ProductSchema } from "./schema";

const MediaComponent = lazy(() => import("@/components/MediaComponent"));
const AddEditProductCategory = lazy(
  () => import("../ProductCategory/AddEditProductCategory"),
);
const ListCategoryDetails = lazy(() => import("./ListCategoryDetails"));

type ProductFormType = z.infer<typeof ProductSchema>;

export default function ProductForm() {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProductFormType>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      productCategoryId: "",
      departmentId: "",
      description: "",
      hasVariant: false,
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
  const variants = watch("variants");

  const {
    media,
    currentImageIndex,
    isImageModelOpen,
    setIsImageModalOpen,
    handleConfirmImage,
    handleNextButton,
    handlePrevButton,
  } = useImageHandler(setValue, getValues, "mediaArr");

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [addonDrawerOpen, setAddonDrawerOpen] = useState<boolean>(false);
  const selectedAddons = watch("addons");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [addonSearch, setAddonSearch] = useState<string>("");

  // Toggle addon selection helper
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

  const { data: product, isSuccess: success } = useGetProductByIdQuery(id, {
    skip: id === null || id === undefined,
  });

  const { data: productCategory, isSuccess: productCategorySuccess } =
    useListAllProductCategoryQuery({
      page: 1,
      limit: LIST_LIMIT,
    });

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductByIdMutation();

  const { data: departmentData } = useGetApiQuery({
    url: `${DEPARTMENT_URL}list?page=1&limit=${LIST_LIMIT}`,
  });

  // Fetch addons only when the selection drawer is opened.
  const { data: addonListData } = useGetApiQuery(
    { url: `${ADDON_URL}?page=1&limit=${LIST_LIMIT}` },
    { skip: !addonDrawerOpen },
  );

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
        departmentId: String(product?.data?.departmentId),
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
        mediaArr:
          product?.data?.mediaArr
            ?.map((each: { imageUrl?: string }) => each?.imageUrl)
            .filter(Boolean) || [],
        addons: Array.isArray((product?.data as any)?.addons)
          ? (product?.data as any).addons.map((a: any) => a.id)
          : [],
      });
      setSelectedOption(product?.data?.productCategoryId);
    } else {
      reset({
        productCategoryId: "",
        departmentId: "",
        hasVariant: false,
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
    // Automatically add an initial variant when hasVariant is toggled to true
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

  const openDrawer = (event) => {
    event.preventDefault();
    setDrawerOpen(true);
  };

  const handleSelectComponent = (event) => {
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
      // quantity: data.hasVariant ? 0 : Number(data.quantity || 0),
      productCategoryId: Number(data.productCategoryId),
      departmentId: Number(data.departmentId),
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
      console.error("API Error:", error);
      handleError({ error, setError });
    }
  };

  const isHasVariantDisabled = id && product?.data?.variants?.length > 0;

 

  return (
    <>
      <form
        className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Name"
          placeholder="Enter Item"
          className="w-1/2"
          {...register("name")}
          error={errors.name?.message}
          isRequired
        />

        <Controller
          name="productCategoryId"
          control={control}
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Select
                {...field}
                options={productCategoryOptions}
                className="w-[50%] md:w-1/4"
                label="Item Category"
                onChange={(event) => handleSelectComponent(event)}
                error={errors.productCategoryId?.message}
                isRequired
              />
              {/* Offset by label + gap so buttons stay level with the select trigger */}
              <div className="flex shrink-0 items-center gap-2 pt-[1.7rem]">
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primaryColor px-3 text-sm font-medium text-white transition hover:bg-primaryColor/90"
                  onClick={openDrawer}
                >
                  <FaEye size={14} /> Show
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primaryColor px-3 text-sm font-medium text-white transition hover:bg-primaryColor/90"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDialogOpen(true);
                  }}
                >
                  <FaPlus size={14} /> Add
                </button>
              </div>
            </div>
          )}
        />

        <Controller
          name="departmentId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Department"
              options={departmentOptions}
              className="w-full md:w-1/2"
              error={errors.departmentId?.message}
          isRequired
        />
          )}
        />

        <div className="flex flex-col items-start w-[20rem]">
          <label className="input-label text-start mb-[2px]">Image</label>
          <Suspense fallback={<div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />}>
            <MediaComponent
              title={
                <MultipleImageInputUI
                  images={media}
                  imageIndex={currentImageIndex}
                />
              }
              isMultiSelect={true}
              handleConfirmImage={() => handleConfirmImage("mediaArr")}
              open={isImageModelOpen}
              setOpen={setIsImageModalOpen}
            />
          </Suspense>
        </div>

        {(!id || success) && (
          <div className="md:w-1/2 w-full ">
            <label className="input-label flex mb-[2px]">Description</label>
            <textarea
              value={watch("description") || ""}
              onChange={(e) => setValue("description", e.target.value)}
              className={`w-full p-2 border rounded bg-white ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              rows={4}
              placeholder="Enter item description..."
            />
            {errors.description?.message && (
              <p className="mt-1 text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
        )}

        {/* <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register("hasVariant")}
            disabled={isHasVariantDisabled}
          />
          <label>Has Variants?</label>
          {isHasVariantDisabled && (
            <span className="text-red-500 text-sm">
              Cannot disable variants while editing an item with existing
              variants. Manage variants below.
            </span>
          )}
        </div> */}

        {!hasVariant && (
          <>
            {/* <Input
              label="Quantity"
              type="number"
              className="w-1/2"
              placeholder="Enter Quantity"
              {...register("quantity", { valueAsNumber: true })}
              error={errors.quantity?.message}
            /> */}
            <Input
              label="Price"
              type="number"
              step={0.01}
              className="w-1/2"
              placeholder="0"
              {...register("price", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined
                    ? undefined
                    : Number(v),
              })}
              error={errors.price?.message}
          isRequired
        />
          </>
        )}

        {/* Addons selector */}
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="input-label">Addons</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-primaryColor px-4 py-2 text-sm font-medium text-white transition hover:bg-primaryColor/90"
              onClick={() => setAddonDrawerOpen(true)}
            >
              Select Addons
            </button>
            <span className="text-sm text-slate-500">
              {Array.isArray(selectedAddons) ? selectedAddons.length : 0}{" "}
              selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(addonListData?.data?.data || [])
              .filter((a: any) => (selectedAddons || []).includes(a.id))
              .map((a: any) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {a.name}
                  <button
                    type="button"
                    aria-label={`Remove ${a.name}`}
                    className="ml-0.5 text-slate-400 hover:text-slate-700"
                    onClick={() => toggleAddon(a.id)}
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        </div>

        {hasVariant && (
          <div className="flex flex-col gap-4 w-full md:w-2/3">
            <label className="font-medium">Variants</label>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-4 items-end border p-2 rounded"
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
                  placeholder="Variant Description"
                  {...register(`variants.${index}.description`)}
                  error={errors.variants?.[index]?.description?.message}
                />
                <button
                  type="button"
                  onClick={() => {
                    remove(index);
                  }}
                  className="text-red-500"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-primaryColor text-white px-4 py-2 rounded"
              onClick={handleAddVariant}
            >
              + Add Variant
            </button>
          </div>
        )}

        <div className="flex justify-start">
          <Button type="submit" className="submit-button w-[5rem]">
            <div className="flex justify-center items-center gap-[0.5rem] text-white">
              {translate("Submit")}
            </div>
          </Button>
        </div>
      </form>

      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Add Item Category"
        titleDescription="Create a category to group menu items."
        contentClassName="max-w-md sm:max-w-lg"
        closeOnOutsideClick
      >
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100" />}>
          {dialogOpen ? (
            <AddEditProductCategory
              isComponent={true}
              closeModal={closeDialog}
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
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100" />}>
          {drawerOpen ? <ListCategoryDetails id={selectedOption} /> : null}
        </Suspense>
      </Drawer>

      {/* Addon selection Drawer */}
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
                  {Array.isArray(selectedAddons) ? selectedAddons.length : 0}{" "}
                  selected
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
            {(addonListData?.data?.data || [])
              .filter((a: any) =>
                a.name.toLowerCase().includes(addonSearch.toLowerCase()),
              )
              .map((addon: any) => {
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
                            : `${IMAGE_BASE_URL}${addon.imageUrl}`
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

            {(addonListData?.data?.data || []).filter((a: any) =>
              a.name.toLowerCase().includes(addonSearch.toLowerCase()),
            ).length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                No addons found
              </p>
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
