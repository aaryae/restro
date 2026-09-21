import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import Input from "@/components/Input";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
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
import { Banknote, Puzzle, Type } from "lucide-react";

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
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
  onCreated?: (addon: CreatedAddon) => void;
}

const AddEditAddons = ({
  id: idProp,
  isComponent = false,
  closeModal = () => {},
  onSuccess,
  onCreated,
}: Props) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  // When embedded, prefer explicit id prop; don't use unrelated route params for create.
  const editId =
    isComponent
      ? idProp !== undefined && idProp !== null
        ? String(idProp)
        : undefined
      : idProp !== undefined && idProp !== null
        ? String(idProp)
        : paramId;

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

  const { data: addonData, isSuccess: addonSuccess, isLoading } = useGetApiQuery(
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

  const finish = (created?: CreatedAddon) => {
    onSuccess?.();
    if (isComponent) {
      if (created) onCreated?.(created);
      closeModal();
    } else {
      navigate(ADDONS_LIST_ROUTE);
    }
  };

  const onCancel = () => {
    if (isComponent) closeModal();
    else navigate(ADDONS_LIST_ROUTE);
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
          finish(created);
        },
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <EntityForm
      title={editId ? "Edit Addon" : "Add Addon"}
      sectionTitle="Addon details"
      description="Name, price, and image for this extra."
      icon={Puzzle}
      embedded={isComponent}
      columns={2}
      maxWidthClass="max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleSubmit(onSubmit)(e);
      }}
      onCancel={onCancel}
      isSaving={isSubmitting || creating || updating}
      isLoading={Boolean(editId) && isLoading && !addonData}
      submitLabel={editId ? "Update" : "Create"}
    >
      <Input
        label="Name"
        placeholder="Enter addon name"
        leftSection={<FieldIcon icon={Type} />}
        {...register("name")}
        error={errors.name?.message}
        isRequired
      />
      <Input
        label="Price"
        type="number"
        step={0.01}
        placeholder="0"
        leftSection={<FieldIcon icon={Banknote} />}
        {...register("price", {
          setValueAs: (v) =>
            v === "" || v === null || v === undefined ? undefined : Number(v),
        })}
        error={errors.price?.message}
        isRequired
      />
      <div className="flex min-w-0 flex-col md:col-span-2">
        <span className="mb-1.5 text-xs font-medium text-[var(--serve-muted)]">
          Image <span className="text-[var(--serve-negative)]">*</span>
        </span>
        <Suspense
          fallback={
            <div className="h-40 w-full animate-pulse rounded-[10px] bg-[var(--serve-surface-2)]" />
          }
        >
          <MediaComponent
            title={
              <ImageInputUI
                image={image}
                imageMessage="Allowed JPG, GIF or PNG."
                onClear={
                  image
                    ? () => {
                        setImage("");
                        setValue("imageUrl", "", { shouldValidate: true });
                      }
                    : undefined
                }
              />
            }
            isMultiSelect={false}
            handleConfirmImage={onConfirmMedia}
            open={isImageModelOpen}
            setOpen={setIsImageModalOpen}
          />
        </Suspense>
        {errors.imageUrl?.message ? (
          <span className="mt-1 text-xs text-[var(--serve-negative)]">
            {errors.imageUrl.message}
          </span>
        ) : null}
      </div>
    </EntityForm>
  );
};

export default AddEditAddons;
