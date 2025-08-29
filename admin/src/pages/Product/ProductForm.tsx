import CustomDialog from "@/components/Dialog";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { Controller, useForm } from "react-hook-form";
import { FaEye, FaPlus } from "react-icons/fa";
import AddEditProductCategory from "../ProductCategory/AddEditProductCategory";
import MediaComponent from "@/components/MediaComponent";
import { MultipleImageInputUI } from "@/components/ImageComponent";
import RichTextEditor from "@/components/RichTextEditor";
import MultiInput from "@/components/MultipleInput";
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
    },
  });

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
        value: item.id,
        label: `${item.name}`,
      }),
    );
  }, [departmentData]);

  console.log(departmentOptions, "Department Options");
  useEffect(() => {
    if (id !== null) {
      if (product?.data) {
        reset({
          ...product?.data,
          productCategoryId: String(product?.data?.productCategoryId),
        });
        const mediaImages = product?.data?.mediaArr.map((each) => {
          return each.imageUrl;
        });
        setValue("mediaArr", mediaImages);
        console.log(product?.data, "dataaaaaaa");
        setSelectedOption(product?.data?.productCategoryId);
      }
    } else {
      reset();
    }
  }, [success]);

  useEffect(() => {
    if (productCategorySuccess && productCategory?.data?.data) {
      const options = productCategory?.data?.data.map((each) => ({
        label: each.name,
        value: each.id,
      }));
      setProductCategoryOptions(options);
    }
  }, [productCategory, productCategorySuccess]);

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const openDrawer = (event) => {
    event.preventDefault();
    setDrawerOpen(true);
  };

  const handleSelectComponent = (event) => {
    setValue("productCategoryId", event.target.value);
    setSelectedOption(event.target.value);
  };

  const onSubmit = async (data: any) => {
    const body = { ...data };
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
                className="w-1/4"
                label="Product Category"
                onChange={(event) => handleSelectComponent(event)}
              />
              <button
                type="button"
                className="flex gap-[0.5rem] items-center py-[0.25rem] px-[0.75rem] bg-primaryColor text-white rounded-[0.25rem]"
                onClick={openDrawer}
              >
                <FaEye />
                Show
              </button>
              <CustomDialog
                buttonTitle={
                  <button
                    type="button"
                    className="flex gap-[0.5rem] items-center py-[0.25rem] px-[0.75rem] bg-primaryColor text-white rounded-[0.25rem]"
                  >
                    <FaPlus />
                    Add
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

        <div className="flex flex-col items-start w-[20rem] ">
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
              onClick={() =>
                setValue("mediaArr", [], {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
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
            onChange={(value) => setValue("description", value)} // Update value
            error={errors.description?.message}
            className="w-1/2"
          />
        )}
        {/* <MultiInput
          className="flex flex-col items-start w-1/2"
          name="alias"
          label="Alias"
          control={control}
          placeholder="Press Enter Alias"
          error={errors.alias?.message}
        /> */}
        <Input
          label="Quantity"
          type="number"
          className="w-1/2"
          placeholder="Enter Quantity of Product"
          {...register("quantity", { valueAsNumber: true })}
          error={errors.quantity?.message}
        />
        {/* <Input
          label="Order"
          type="number"
          className="w-1/2"
          placeholder="Enter Quantity of Product"
          {...register("order", { valueAsNumber: true })}
          error={errors.order?.message}
        /> */}
        <Input
          label="Price"
          type="number"
          step={0.01}
          className="w-1/2"
          placeholder="Enter Price of Product"
          {...register("price", { valueAsNumber: true })}
          error={errors.price?.message}
        />

        <div className="flex justify-start">
          <Button type="submit" className="submit-button w-[5rem]">
            {" "}
            <div className="flex justify-center items-center gap-[0.5rem] text-white ">
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
