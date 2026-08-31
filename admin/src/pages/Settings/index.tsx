import Input from "@/components/Input";
import MediaComponent from "@/components/MediaComponent";
import useTranslation from "@/locale/useTranslation";
import {
  useGetSettingQuery,
  useUpdateSettingMutation,
} from "@/redux/services/settings";
import { z } from "zod";
import { SettingSchema } from "./schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/Button";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/store/hooks";
import { useDispatch } from "react-redux";
import { clearSelectedMedia } from "@/redux/feature/mediaSlice";
import { handleError, handleResponse } from "@/utils/responseHandler";
import galleryIcon from "@/assets/gallery_icon.svg";
import Spinner from "@/components/Spinner";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { PRIMARY_COLOR } from "@/constants/projectConstants";
import { Building2, ImageIcon } from "lucide-react";

type SettingFormType = z.infer<typeof SettingSchema>;

export default function Settings() {
  const dispatch = useDispatch();
  const translate = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingFormType>({
    resolver: zodResolver(SettingSchema),
    defaultValues: {
      primaryColor: PRIMARY_COLOR,
    },
  });

  const selectedImage = useAppSelector((state) => state.media.selectedImage);
  const [isFaviconOpen, setIsFavIconOpen] = useState(false);
  const [isBrandingImage, setIsBrandingImage] = useState(false);

  const fav_icon = watch("fav_icon");
  const brandingImage = watch("brandingImage");

  const {
    data: settings,
    isSuccess: success,
    isLoading: loading,
  } = useGetSettingQuery("");
  const [updateSetting] = useUpdateSettingMutation();

  useEffect(() => {
    if (settings?.data) {
      reset({ ...settings.data, primaryColor: PRIMARY_COLOR });
    }
  }, [reset, settings?.data, success]);

  const handleConfirmImage = (field: string) => {
    switch (field) {
      case "fav_icon":
        setValue("fav_icon", selectedImage);
        setIsFavIconOpen(false);
        break;
      case "brandingImage":
        setValue("brandingImage", selectedImage);
        setIsBrandingImage(false);
        break;
      default:
        break;
    }
    dispatch(clearSelectedMedia());
  };

  const onSubmit = async (data: SettingFormType) => {
    const body = {
      ...data,
      primaryColor: PRIMARY_COLOR,
    };
    try {
      const settingId = Number(settings?.data?.id);
      const response = await updateSetting({
        body,
        id: Number.isFinite(settingId) ? settingId : undefined,
      }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  if (loading) {
    return <Spinner className="flex h-full items-center justify-center" />;
  }

  return (
    <form
      className="flex min-w-0 w-full flex-col gap-5 pb-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-slate-800 sm:text-xl">
          {translate("Company Settings")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your brand details, contact info, and logos.
        </p>
      </div>

      {/* Brand details */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
            <Building2 size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">
              {translate("Brand Setting")}
            </h2>
            <p className="text-xs text-slate-500">
              Business identity and contact information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5 xl:grid-cols-3">
          <Input
            label="Brand Name"
            placeholder="Brand Name"
            type="text"
            {...register("brand_name")}
            error={errors?.brand_name?.message}
            isRequired
          />
          <Input
            label="Email"
            placeholder="Email"
            type="text"
            {...register("email")}
            error={errors?.email?.message}
            isRequired
          />
          <Input
            label="Primary Phone"
            placeholder="Primary Phone Number"
            type="text"
            {...register("primary_phone")}
            error={errors?.primary_phone?.message}
            isRequired
          />
          <Input
            label="Secondary Phone"
            placeholder="Secondary Phone"
            type="text"
            {...register("secondary_phone")}
            error={errors?.secondary_phone?.message}
          />
          <Input
            label="Address"
            placeholder="Address"
            type="text"
            {...register("address")}
            error={errors?.address?.message}
            isRequired
          />
          <Input
            label="Pan/Vat Number"
            placeholder="Pan/Vat Number"
            type="text"
            {...register("pan_vat_number")}
            error={errors?.pan_vat_number?.message}
          />
          <Input
            label="Opening Balance"
            placeholder="Opening Balance"
            type="number"
            {...register("openingBalance")}
            error={errors?.openingBalance?.message}
          />
        </div>
      </section>

      {/* Images & theme */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <ImageIcon size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">
              {translate("Image Settings")}
            </h2>
            <p className="text-xs text-slate-500">
              Logos and favicon
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5 xl:grid-cols-3">
          <ImageField
            label={translate("Favicon Image")}
            required
            open={isFaviconOpen}
            setOpen={setIsFavIconOpen}
            image={fav_icon}
            onConfirm={() => handleConfirmImage("fav_icon")}
          />
          <ImageField
            label={translate("Branding Image")}
            required
            open={isBrandingImage}
            setOpen={setIsBrandingImage}
            image={brandingImage}
            onConfirm={() => handleConfirmImage("brandingImage")}
          />
        </div>
      </section>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          className="submit-button inline-flex h-10 w-fit items-center gap-2 rounded-lg px-5 text-sm font-medium"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? "Saving..." : translate("Submit")}
        </Button>
      </div>
    </form>
  );
}

function ImageField({
  label,
  required,
  open,
  setOpen,
  image,
  onConfirm,
}: {
  label: string;
  required?: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  image?: string;
  onConfirm: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <label className="mb-2 text-left text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <MediaComponent
        title={<ImageInputUI image={image} />}
        handleConfirmImage={onConfirm}
        open={open}
        setOpen={setOpen}
      />
    </div>
  );
}

function ImageInputUI({ image }: { image?: string }) {
  const translate = useTranslation();
  const src = image ? buildAssetUrl(image) : "";
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const showPreview = Boolean(src) && !failed;

  return (
    <div className="w-full text-left">
      <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-slate-400 hover:bg-slate-100/80 sm:h-44">
        {showPreview ? (
          <img
            src={src}
            alt="Preview"
            className="max-h-full w-full object-contain p-3"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-3 text-slate-400">
            <img
              src={galleryIcon}
              alt=""
              className="h-10 w-14 object-contain opacity-70"
            />
            <span className="text-[11px] font-medium">Click to upload</span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
        {translate("Allowed JPG, GIF or PNG. Max size of 1MB")}
      </p>
    </div>
  );
}
