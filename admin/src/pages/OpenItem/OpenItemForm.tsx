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
import { useEffect, useState } from "react";
import useImageHandler from "@/hooks/useImageHandler";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { OPEN_ITEM_URL, DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import { Department } from "../../types/department";

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
      quantity: undefined as unknown as number,
      price: undefined as unknown as number,
      departmentId: undefined,
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
  const [departments, setDepartments] = useState<
    { value: number; label: string }[]
  >([]);

  // Fetch departments
  const { data: departmentsData } = useGetApiQuery({
    url: `${DEPARTMENT_URL}list?page=1&limit=100`,
  });

  useEffect(() => {
    if (departmentsData?.data?.data) {
      const deptOptions = departmentsData.data.data.map(
        (department: Department) => ({
          value: department.id,
          label: department.name,
        }),
      );
      setDepartments(deptOptions);
    }
  }, [departmentsData]);

  console.log("departments", departmentsData);

  useEffect(() => {
    if (id && success && openItem?.data) {
      reset({
        name: openItem.data.name,
        description: openItem.data.description || "",
        quantity:
          openItem.data.quantity != null
            ? Number(openItem.data.quantity)
            : (undefined as unknown as number),
        price:
          openItem.data.price != null && openItem.data.price !== ""
            ? Number(openItem.data.price)
            : (undefined as unknown as number),
        departmentId: openItem.data.departmentId,
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
      departmentId: Number(data.departmentId),
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
          isRequired
        />

      <div className="md:w-1/2 w-full">
        <label className="input-label flex mb-[2px]">Description</label>
        <textarea
          value={watch("description") || ""}
          onChange={(e) => setValue("description", e.target.value)}
          className={`w-full p-2 border rounded bg-white ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
          rows={4}
          placeholder="Enter open item description..."
        />
        {errors.description?.message && (
          <p className="mt-1 text-sm text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <Input
        label={"Quantity"}
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

      <div className="w-1/2">
        <Controller
          name="departmentId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Department"
              options={departments}
              className="w-full"
              error={errors.departmentId?.message}
          isRequired
        />
          )}
        />
      </div>

      <Input
        label={"Price"}
        type="number"
        step={0.01}
        className="w-1/2"
        placeholder="0"
        {...register("price", {
          setValueAs: (v) =>
            v === "" || v === null || v === undefined ? undefined : Number(v),
        })}
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
        {/* <div className="mt-[1rem] flex w-full justify-between">
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
        </div> */}
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
