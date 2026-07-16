import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import Button from "@/components/Button";
import CustomDialog from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import { MultipleImageInputUI } from "@/components/ImageComponent";
import Input from "@/components/Input";
import MediaComponent from "@/components/MediaComponent";
import Select from "@/components/Select";
import { IMAGE_BASE_URL } from "@/constants";
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
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import AddEditProductCategory from "../ProductCategory/AddEditProductCategory";
import ListCategoryDetails from "./ListCategoryDetails";
import { ProductSchema } from "./schema";

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
      limit: 100,
    });

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductByIdMutation();

  const { data: departmentData } = useGetApiQuery({
    url: `${DEPARTMENT_URL}list`,
  });

  // Fetch addons for selection drawer
  const { data: addonListData } = useGetApiQuery({
    url: `${ADDON_URL}`,
  });

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
          {/* <div className="mt-[1rem] flex w-full justify-between">
            <button
              type="button"
              className="px-[0.75rem] py-[0.5rem] rounded-[0.25rem] bg-primaryColor text-white"
              onClick={handlePrevButton}
            >
              Previous
            </button>
            <button
              type="button"
              className="px-[0.75rem] py-[0.5rem] rounded-[0.25rem] bg-primaryColor text-white"
              onClick={() => setValue("mediaArr", [])}
            >
              Remove
            </button>
            <button
              type="button"
              className="px-[0.75rem] py-[0.5rem] rounded-[0.25rem] bg-primaryColor text-white"
              onClick={handleNextButton}
            >
              Next
            </button>
          </div> */}
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
              className="bg-primaryColor text-white px-4 py-2 rounded"
              onClick={() => setAddonDrawerOpen(true)}
            >
              Select Addons
            </button>
            <span className="text-sm text-gray-600">
              {Array.isArray(selectedAddons) ? selectedAddons.length : 0}{" "}
              selected
            </span>
          </div>
          {/* Simple chips preview */}
          <div className="flex flex-wrap gap-2">
            {(addonListData?.data?.data || [])
              .filter((a: any) => (selectedAddons || []).includes(a.id))
              .map((a: any) => (
                <span
                  key={a.id}
                  className="px-2 py-1 text-xs rounded bg-gray-100 border"
                >
                  {a.name}
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
        <AddEditProductCategory
          isComponent={true}
          closeModal={closeDialog}
        />
      </CustomDialog>

      <Drawer
        isOpen={drawerOpen}
        setIsOpen={setDrawerOpen}
        width="w-full max-w-md"
        className="border-l border-slate-200/80 shadow-2xl"
        contentClassName="p-6 pt-5"
      >
        <ListCategoryDetails id={selectedOption} />
      </Drawer>

      {/* Addon selection Drawer */}
      <Drawer
        isOpen={addonDrawerOpen}
        setIsOpen={setAddonDrawerOpen}
        width="w-full lg:w-[40%]"
      >
        <div className="p-4 flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-left">Select Addons</h3>
              <p className="text-sm text-gray-500">
                Choose complementary items
              </p>
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">
                {Array.isArray(selectedAddons) ? selectedAddons.length : 0}
              </span>
              <span className="ml-1">selected</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={addonSearch}
              onChange={(e) => setAddonSearch(e.target.value)}
              placeholder="Search addons..."
              className="flex-1 p-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primaryColor"
            />
            <button
              type="button"
              className="px-3 py-2 bg-gray-100 rounded-md text-sm"
              onClick={() => {
                setAddonSearch("");
              }}
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-auto max-h-[60vh]">
            {(addonListData?.data?.data || [])
              .filter((a: any) =>
                a.name.toLowerCase().includes(addonSearch.toLowerCase()),
              )
              .map((addon: any) => {
                const checked = (selectedAddons || []).includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    className={`relative flex items-center gap-3 p-3 border rounded-lg hover:shadow-lg transition-shadow bg-white`}
                  >
                    <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      <img
                        src={
                          addon.imageUrl?.startsWith("http")
                            ? addon.imageUrl
                            : `${IMAGE_BASE_URL}${addon.imageUrl}`
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
                        <p className="text-xs text-gray-500 mt-1">
                          {addon.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAddon(addon.id)}
                          className={`px-3 py-1 rounded-full text-sm border ${checked ? "bg-primaryColor text-white border-primaryColor" : "bg-white text-gray-700"}`}
                        >
                          {checked ? "Selected" : "Add"}
                        </button>
                      </div>
                    </div>

                    {checked && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="mt-auto pt-3 border-t flex items-center justify-between gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded border text-sm"
              onClick={() => {
                setValue("addons", [], {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            >
              Clear All
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded border text-sm"
                onClick={() => setAddonDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-primaryColor text-white text-sm"
                onClick={() => setAddonDrawerOpen(false)}
              >
                Save Selection
              </button>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}
