import Input from "@/components/Input";
import Select from "@/components/Select";
import { Controller, useForm } from "react-hook-form";
import MediaComponent from "@/components/MediaComponent";
import { MultipleImageInputUI } from "@/components/ImageComponent";
import RichTextEditor from "@/components/RichTextEditor";
import Button from "@/components/Button";
import { OpenItemSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { OPEN_ITEM_LIST_ROUTE } from "@/routes/routeNames";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import useImageHandler from "@/hooks/useImageHandler";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { OPEN_ITEM_URL } from "@/constants/apiUrlConstants";

type OpenItemFormType = z.infer<typeof OpenItemSchema>;

export default function OpenItemForm() {
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
  } = useForm<OpenItemFormType>({
    resolver: zodResolver(OpenItemSchema),
    defaultValues: {
      name: "",
      description: "",
      quantity: 1,
      price: 0,
      stockStatus: "in_stock",
      mediaArr: [],
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

  const { data: openItem, isSuccess: success } = useGetApiQuery(
    { url: `${OPEN_ITEM_URL}${id}` },
    {
      skip: !id,
    },
  );

  const [createOpenItem] = useCreateApiMutation();
  const [updateOpenItem] = useUpdateApiMutation();

  useEffect(() => {
    if (id && success && openItem?.data) {
      reset({
        name: openItem.data.name,
        description: openItem.data.description || "",
        quantity: openItem.data.quantity,
        price: openItem.data.price || 0,
        stockStatus: openItem.data.stockStatus,
        mediaArr:
          openItem.data.mediaArr?.map((each: any) => each.imageUrl) || [],
      });
    }
  }, [success, openItem, reset, id]);

  const onSubmit = async (data: OpenItemFormType) => {
    const body = {
      ...data,
      quantity: Number(data.quantity),
      price: data.price !== undefined ? Number(data.price) : undefined,
    };
    console.log("Submitting payload:", body);
    try {
      const response = id
        ? await updateOpenItem({ url: `${OPEN_ITEM_URL}${id}`, body }).unwrap()
        : await createOpenItem({ url: `${OPEN_ITEM_URL}`, body }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => navigate(OPEN_ITEM_LIST_ROUTE),
      });
    } catch (error) {
      console.error("API Error:", error);
      handleError({ error, setError });
    }
  };

  const stockStatusOptions = [
    { value: "in_stock", label: "In Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
    { value: "low_stock", label: "Low Stock" },
  ];

  return (
    <form
      className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Input
        label={"Name"}
        placeholder={"Enter Open Item Name"}
        className="w-1/2"
        {...register("name")}
        error={errors.name?.message}
      />

      <RichTextEditor
        data={watch("description")}
        onChange={(value) => setValue("description", value)}
        error={errors.description?.message}
        className="w-1/2"
      />

      <Input
        label={"Quantity"}
        type="number"
        className="w-1/2"
        placeholder={"Enter Quantity"}
        {...register("quantity", { valueAsNumber: true })}
        error={errors.quantity?.message}
      />

      <Input
        label={"Price"}
        type="number"
        step={0.01}
        className="w-1/2"
        placeholder={"Enter Price"}
        {...register("price", { valueAsNumber: true })}
        error={errors.price?.message}
      />

      <Controller
        name="stockStatus"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label={"Stock Status"}
            options={stockStatusOptions}
            className="w-1/2"
            error={errors.stockStatus?.message}
          />
        )}
      />

      <div className="flex flex-col items-start w-[20rem]">
        <label className="input-label text-start mb-[2px]">{"Images"}</label>
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
            {"Previous"}
          </button>
          <button
            type="button"
            className="px-[0.75rem] py-[0.5rem] rounded-[0.25rem] bg-primaryColor text-white"
            onClick={() => setValue("mediaArr", [])}
          >
            {"Remove"}
          </button>
          <button
            type="button"
            className="px-[0.75rem] py-[0.5rem] rounded-[0.25rem] bg-primaryColor text-white"
            onClick={handleNextButton}
          >
            {"Next"}
          </button>
        </div>
      </div>

      <div className="flex justify-start">
        <Button type="submit" className="submit-button w-[5rem]">
          <div className="flex justify-center items-center gap-[0.5rem] text-white">
            {"Submit"}
          </div>
        </Button>
      </div>
    </form>
  );
}
