import Input from "@/components/Input";
import { ProductVariantSchema } from "./schema.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { z } from "zod";
import useTranslation from "@/locale/useTranslation";
import { PRODUCT_VARIANT_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect, useState } from "react";
import { useListAllProductQuery } from "@/redux/services/product.ts";
import TextArea from "@/components/TextArea/index.tsx";

import Select from "@/components/Select/index.tsx";
import {
  useCreateProductVariantMutation,
  useGetProductVariantByIdQuery,
  useUpdateProductVariantByIdMutation,
} from "@/redux/services/productVariant.ts";
import PageTitle from "@/components/PageTitle/index.tsx";
import useImageHandler from "@/hooks/useImageHandler.ts";
import MediaComponent from "@/components/MediaComponent/index.tsx";
import { MultipleImageInputUI } from "@/components/ImageComponent/index.tsx";

type ProductVariantFormType = z.infer<typeof ProductVariantSchema>;

export default function AddEditProductVariantCategory() {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProductVariantFormType>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: {
      productId: "",
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
  } = useImageHandler(setValue, getValues);

  const [productOptions, setProductOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const { data: productVariant, isSuccess: success } =
    useGetProductVariantByIdQuery(id, {
      skip: id === null || id === undefined,
    });

  const [createProductVariant] = useCreateProductVariantMutation();
  const [updateProductVariant] = useUpdateProductVariantByIdMutation();

  const { data: product, isSuccess: productSuccess } = useListAllProductQuery({
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    if (id !== null) {
      if (product?.data) {
        reset({
          ...productVariant?.data,
          productId: String(productVariant?.data?.productId),
        });
        const mediaImages = productVariant?.data?.product_variant_media.map(
          (each) => {
            return each.imageUrl;
          },
        );
        setValue("media", mediaImages);
      }
    } else {
      reset();
    }
  }, [success]);

  useEffect(() => {
    if (productSuccess && product?.data?.data) {
      const options = product?.data?.data.map((each) => ({
        label: each.name,
        value: each.id,
      }));
      console.log(options, "options");
      setProductOptions(options);
    }
  }, [product, productSuccess]);

  const onSubmit = async (data: any) => {
    const body = { ...data };
    console.log(data, "data");

    try {
      const response = id
        ? await updateProductVariant({ body, id }).unwrap()
        : await createProductVariant(body).unwrap();

      handleResponse({
        res: response,
        onSuccess: () => navigate(PRODUCT_VARIANT_LIST_ROUTE),
      });
    } catch (error) {
      handleError({ error });
    }
  };
  return (
    <>
      <PageTitle title="Add Item Variant" />
      <form
        className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Name"
          placeholder="Enter item name"
          className="w-1/2"
          {...register("name")}
          error={errors.name?.message}
          isRequired
        />
        <Controller
          name="productId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              className="w-1/3"
              options={productOptions}
              label="Item"
              isRequired
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
            handleConfirmImage={() => handleConfirmImage("media")}
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
        <TextArea
          label="Description"
          className="w-1/2"
          placeholder="Enter item description"
          {...register("description")}
          error={errors?.description?.message}
        />

        <Input
          label="Quantity"
          type="number"
          className="w-1/2"
          placeholder="0"
          {...register("quantity", {
            setValueAs: (v) =>
              v === "" || v === null || v === undefined ? undefined : Number(v),
          })}
          error={errors.quantity?.message}
          isRequired
        />
        <Input
          label="Price"
          type="number"
          className="w-1/2"
          placeholder="0"
          {...register("price", {
            setValueAs: (v) =>
              v === "" || v === null || v === undefined ? undefined : Number(v),
          })}
          error={errors.price?.message}
          isRequired
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
    </>
  );
}
