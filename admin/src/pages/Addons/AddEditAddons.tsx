import React from "react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "@/components/Input";
import Button from "@/components/Button";
import PageTitle from "@/components/PageTitle";
import MediaComponent from "@/components/MediaComponent";
import { ImageInputUI } from "@/components/ImageComponent";
import { IMAGE_BASE_URL } from "@/constants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { ADDON_URL } from "@/constants/apiUrlConstants";
import { ADDONS_LIST_ROUTE } from "@/routes/routeNames";
import useImageHandler from "@/hooks/useImageHandler";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddonSchema } from "./schema";
import { useAppSelector } from "@/redux/store/hooks";

type AddonFormType = {
  name: string;
  price: number;
  imageUrl?: string | null;
  mediaArr?: string[];
};

const AddEditAddons = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddonFormType>({
    resolver: zodResolver(AddonSchema as z.ZodTypeAny),
    defaultValues: {
      name: "",
      price: 0,
      imageUrl: "",
      mediaArr: [],
    },
  });

  const [image, setImage] = useState<string>("");

  const {
    isImageModelOpen,
    setIsImageModalOpen,
    handleNextButton,
    handlePrevButton,
  } = useImageHandler(setValue, getValues, "mediaArr");

  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  const { data: addonData, isSuccess: addonSuccess } = useGetApiQuery(
    { url: `${ADDON_URL}${id}` },
    { skip: !id },
  );
  const [createAddon] = useCreateApiMutation();
  const [updateAddon] = useUpdateApiMutation();

  useEffect(() => {
    if (id && addonSuccess && addonData?.data) {
      const imageUrl = addonData.data.imageUrl || "";
      reset({
        name: addonData.data.name || "",
        price: Number(addonData.data.price || 0),
        imageUrl: imageUrl,
      });
      setImage(
        imageUrl.startsWith(IMAGE_BASE_URL)
          ? imageUrl.replace(IMAGE_BASE_URL, "")
          : imageUrl,
      );
    } else if (!id) {
      reset({ name: "", price: 0, imageUrl: "", mediaArr: [] });
      setImage("");
    }
  }, [id, addonSuccess, addonData, reset]);

  const onConfirmMedia = () => {
    const selected = typeof selectedImage === "string" ? selectedImage : "";
    if (!selected) {
      setError("imageUrl", {
        type: "manual",
        message: "Please select an image",
      });
      return;
    }
    setImage(selected);
    setValue("imageUrl", selected);
    setIsImageModalOpen(false);
  };

  const onSubmit = async (data: AddonFormType) => {
    const trimmedName = data.name?.trim();

    if (!image) {
      setError("imageUrl", {
        type: "manual",
        message: "Image is required",
      });
      return;
    }

    const body = {
      name: trimmedName,
      price: Number(data.price || 0),
      imageUrl: image,
    };
    try {
      const response = id
        ? await updateAddon({ url: `${ADDON_URL}${id}`, body }).unwrap()
        : await createAddon({ url: `${ADDON_URL}`, body }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => navigate(ADDONS_LIST_ROUTE),
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <>
      <PageTitle title={id ? "Edit Addon" : "Add Addon"} isBack={true} />
      <form
        className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Name"
          placeholder="Enter addon name"
          className="w-1/2"
          {...register("name")}
          error={errors.name?.message}
        />

        <Input
          label="Price"
          type="number"
          step={0.01}
          className="w-1/2"
          placeholder="Enter price"
          {...register("price", { valueAsNumber: true })}
          error={errors.price?.message}
        />

        <div className="flex flex-col items-start w-[20rem]">
          <label className="input-label text-start mb-[2px]">Image</label>
          <MediaComponent
            title={<ImageInputUI image={image} imageMessage="Upload Image" />}
            isMultiSelect={false}
            handleConfirmImage={onConfirmMedia}
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

        <div className="flex justify-start">
          <Button
            type="submit"
            className="submit-button w-[8rem]"
            disabled={isSubmitting}
          >
            <div className="flex justify-center items-center gap-[0.5rem] text-white">
              {id ? "Update" : "Create"}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
};

export default AddEditAddons;
