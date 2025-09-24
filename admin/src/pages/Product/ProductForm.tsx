import CustomDialog from "@/components/Dialog";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { FaEye, FaPlus, FaTrash } from "react-icons/fa";
import AddEditProductCategory from "../ProductCategory/AddEditProductCategory";
import MediaComponent from "@/components/MediaComponent";
import { MultipleImageInputUI } from "@/components/ImageComponent";
import RichTextEditor from "@/components/RichTextEditor";
import Button from "@/components/Button";
import useTranslation from "@/locale/useTranslation";
import { ProductSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { PRODUCT_LIST_ROUTE } from "@/routes/routeNames";
import {
  useCreateProductMutation,
  useGetProductByIdQuery,
  useUpdateProductByIdMutation,
} from "@/redux/services/product";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import useImageHandler from "@/hooks/useImageHandler";
import { useListAllProductCategoryQuery } from "@/redux/services/productCategory";
import Drawer from "@/components/Drawer";
import ListCategoryDetails from "./ListCategoryDetails";
import { DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";

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
      hasVariant: false,
      variants: [],
      quantity: 0,
      price: 0,
      mediaArr: [],
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
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

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
        ? 0
        : Number(product?.data?.price || 0);
      const quantity = product?.data?.hasVariant
        ? 0
        : Number(product?.data?.quantity || 0);
      reset({
        ...product?.data,
        productCategoryId: String(product?.data?.productCategoryId),
        departmentId: String(product?.data?.departmentId),
        variants: product?.data?.variants || [],
        quantity,
        price,
        mediaArr: product?.data?.mediaArr?.map((each) => each.imageUrl) || [],
      });
      setSelectedOption(product?.data?.productCategoryId);
      console.log("Reset form with product data:", {
        price,
        quantity,
        hasVariant: product?.data?.hasVariant,
      });
    } else {
      reset({
        productCategoryId: "",
        departmentId: "",
        hasVariant: false,
        variants: [],
        quantity: 0,
        price: 0,
        mediaArr: [],
      });
    }
  }, [success, product, reset, setValue]);

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
      console.log("Appending initial variant");
      append({ name: "", price: 0, quantity: 0, description: "" });
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
    console.log("Adding new variant, current fields:", fields);
    append({ name: "", price: 0, quantity: 0, description: "" });
  };

  const onSubmit = async (data: ProductFormType) => {
    const body = {
      ...data,
      price: data.hasVariant ? 0 : Number(data.price || 0),
      quantity: data.hasVariant ? 0 : Number(data.quantity || 0),
      productCategoryId: Number(data.productCategoryId),
      departmentId: Number(data.departmentId),
      variants: data.hasVariant ? data.variants : [],
    };
    console.log("Submitting payload:", body);
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

  console.log("Form errors:", errors);
  console.log("Form values:", getValues());

  return (
    <>
      <form
        className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Name"
          placeholder="Enter Product"
          className="w-1/2"
          {...register("name")}
          error={errors.name?.message}
        />

        <Controller
          name="productCategoryId"
          control={control}
          render={({ field }) => (
            <div className="flex items-end gap-[1rem]">
              <Select
                {...field}
                options={productCategoryOptions}
                className="w-[50%] md:w-1/4"
                label="Product Category"
                onChange={(event) => handleSelectComponent(event)}
                error={errors.productCategoryId?.message}
              />
              <button
                type="button"
                className="flex gap-[0.5rem] items-center py-[0.25rem] px-[0.75rem] bg-primaryColor text-white rounded-[0.25rem]"
                onClick={openDrawer}
              >
                <FaEye /> Show
              </button>
              <CustomDialog
                buttonTitle={
                  <button
                    type="button"
                    className="flex gap-[0.5rem] items-center py-[0.25rem] px-[0.75rem] bg-primaryColor text-white rounded-[0.25rem]"
                  >
                    <FaPlus /> Add
                  </button>
                }
                dialogOpen={dialogOpen}
                setDialogOpen={setDialogOpen}
                title="Add Product Category"
              >
                <AddEditProductCategory
                  isComponent={true}
                  closeModal={closeDialog}
                />
              </CustomDialog>
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
              required
            />
          )}
        />

        <div className="flex flex-col items-start w-[20rem]">
          <label className="input-label text-start mb-[2px]">
            Image <span className="text-red-500">*</span>
          </label>
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
          <div className="mt-[1rem] flex w-full justify-between">
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
          </div>
        </div>

        {(!id || success) && (
          <RichTextEditor
            data={watch("description")}
            onChange={(value) => setValue("description", value)}
            error={errors.description?.message}
            className="w-1/2"
          />
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
              Cannot disable variants while editing a product with existing
              variants. Manage variants below.
            </span>
          )}
        </div> */}

        {!hasVariant && (
          <>
            <Input
              label="Quantity"
              type="number"
              className="w-1/2"
              placeholder="Enter Quantity"
              {...register("quantity", { valueAsNumber: true })}
              error={errors.quantity?.message}
            />
            <Input
              label="Price"
              type="number"
              step={0.01}
              className="w-1/2"
              placeholder="Enter Price"
              {...register("price", { valueAsNumber: true })}
              error={errors.price?.message}
            />
          </>
        )}

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
                  placeholder="Variant Price"
                  {...register(`variants.${index}.price`, {
                    valueAsNumber: true,
                  })}
                  error={errors.variants?.[index]?.price?.message}
                />
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="Variant Quantity"
                  {...register(`variants.${index}.quantity`, {
                    valueAsNumber: true,
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
                    console.log("Removing variant at index:", index);
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

      <Drawer
        isOpen={drawerOpen}
        setIsOpen={setDrawerOpen}
        width="w-full lg:w-[30%]"
      >
        <ListCategoryDetails id={selectedOption} />
      </Drawer>
    </>
  );
}
