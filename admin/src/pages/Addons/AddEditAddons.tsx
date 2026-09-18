import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import Input from "@/components/Input";
import Button from "@/components/Button";
import PageTitle from "@/components/PageTitle";
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

const MediaComponent = lazy(() => import("@/components/MediaComponent"));

type AddonFormType = {
  name: string;
  price: number;
  imageUrl?: string | null;
  mediaArr?: string[];
};

export type CreatedAddon = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  description?: string | null;
};

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
  onCreated?: (addon: CreatedAddon) => void;
}

const AddEditAddons = ({
  isComponent = false,
  closeModal = () => {},
  onCreated,
}: Props) => {
  const { id } = useParams();
  const navigate = useNavigate();
  // When embedded in the product form, never use route params for edit mode.
  const editId = isComponent ? undefined : id;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AddonFormType>({
    resolver: zodResolver(AddonSchema as z.ZodTypeAny),
    defaultValues: {
      name: "",
      price: undefined as unknown as number,
      imageUrl: "",
      mediaArr: [],
    },
  });

  const [image, setImage] = useState<string>("");

  const { isImageModelOpen, setIsImageModalOpen } = useImageHandler(
    setValue,
    getValues,
    "mediaArr",
  );

  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  const { data: addonData, isSuccess: addonSuccess } = useGetApiQuery(
    { url: `${ADDON_URL}${editId}` },
    { skip: !editId },
  );
  const [createAddon, { isLoading: creating }] = useCreateApiMutation();
  const [updateAddon, { isLoading: updating }] = useUpdateApiMutation();

  useEffect(() => {
    if (editId && addonSuccess && addonData?.data) {
      const imageUrl = addonData.data.imageUrl || "";
      reset({
        name: addonData.data.name || "",
        price:
          addonData.data.price != null && addonData.data.price !== ""
            ? Number(addonData.data.price)
            : (undefined as unknown as number),
        imageUrl: imageUrl,
      });
      setImage(
        imageUrl.startsWith(IMAGE_BASE_URL)
          ? imageUrl.replace(IMAGE_BASE_URL, "")
          : imageUrl,
      );
    } else if (!editId) {
      reset({
        name: "",
        price: undefined as unknown as number,
        imageUrl: "",
        mediaArr: [],
      });
      setImage("");
    }
  }, [editId, addonSuccess, addonData, reset]);

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
    setValue("imageUrl", selected, { shouldValidate: true });
    clearErrors("imageUrl");
    setIsImageModalOpen(false);
  };

  const handleSuccess = (created?: CreatedAddon) => {
    if (isComponent) {
      if (created) onCreated?.(created);
      closeModal();
    } else {
      navigate(ADDONS_LIST_ROUTE);
    }
  };

  const onSubmit = async (data: AddonFormType) => {
    const trimmedName = data.name?.trim();
    const imageUrl = (data.imageUrl || image || "").trim();

    if (!imageUrl) {
      setError("imageUrl", {
        type: "manual",
        message: "Image is required",
      });
      return;
    }

    const body = {
      name: trimmedName,
      price: Number(data.price || 0),
      imageUrl,
    };
    try {
      const response = editId
        ? await updateAddon({ url: `${ADDON_URL}${editId}`, body }).unwrap()
        : await createAddon({ url: `${ADDON_URL}`, body }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          const created =
            !editId && response?.data?.id
              ? {
                  id: Number(response.data.id),
                  name: response.data.name || trimmedName,
                  price: Number(response.data.price ?? body.price),
                  imageUrl: response.data.imageUrl || imageUrl,
                  description: response.data.description ?? null,
                }
              : undefined;
          handleSuccess(created);
        },
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  const busy = isSubmitting || creating || updating;

  return (
    <>
      {!isComponent && (
        <PageTitle title={editId ? "Edit Addon" : "Add Addon"} isBack={true} />
      )}
      <form
        className={
          isComponent
            ? "mt-5 space-y-4"
            : "form-container mt-[1rem] grid grid-cols-1 gap-[1rem]"
        }
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleSubmit(onSubmit)(e);
        }}
      >
        <Input
          label="Name"
          placeholder="Enter addon name"
          className={isComponent ? "w-full" : "w-1/2"}
          {...register("name")}
          error={errors.name?.message}
          isRequired
        />

        <Input
          label="Price"
          type="number"
          step={0.01}
          className={isComponent ? "w-full" : "w-1/2"}
          placeholder="0"
          {...register("price", {
            setValueAs: (v) =>
              v === "" || v === null || v === undefined ? undefined : Number(v),
          })}
          error={errors.price?.message}
          isRequired
        />

        <div
          className={`flex flex-col items-start ${isComponent ? "w-full" : "w-[20rem]"}`}
        >
          <label className="input-label text-start mb-[2px]">
            Image <span className="text-red-500">*</span>
          </label>
          <Suspense
            fallback={
              <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
            }
          >
            <MediaComponent
              title={<ImageInputUI image={image} imageMessage="Upload Image" />}
              isMultiSelect={false}
              handleConfirmImage={onConfirmMedia}
              open={isImageModelOpen}
              setOpen={setIsImageModalOpen}
            />
          </Suspense>
          {errors.imageUrl?.message && (
            <span className="input-error mt-1">{errors.imageUrl.message}</span>
          )}
        </div>

        <div
          className={
            isComponent
              ? "flex items-center justify-end gap-2 border-t border-slate-200/80 pt-4"
              : "flex justify-start"
          }
        >
          {isComponent && (
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              disabled={busy}
            >
              Cancel
            </button>
          )}
          <Button
            type="submit"
            className={
              isComponent
                ? "submit-button h-10 min-w-[7.5rem] px-5"
                : "submit-button w-[8rem]"
            }
            disabled={busy}
          >
            <div className="flex items-center justify-center gap-[0.5rem] text-white">
              {busy ? "Saving…" : editId ? "Update" : "Create"}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
};

export default AddEditAddons;
