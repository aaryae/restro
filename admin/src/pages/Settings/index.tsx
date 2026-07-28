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
import {
  Button as AriaBtn,
  ColorPicker,
  Dialog,
  DialogTrigger,
  Popover,
  ColorSwatch,
  ColorSlider,
  ColorArea,
  ColorField,
  ColorThumb,
  parseColor,
  Label,
  SliderTrack,
  FieldError,
} from "react-aria-components";
import isValidHex from "@/utils/isValidHex";
import { PRIMARY_COLOR } from "@/constants/projectConstants";
import { Building2, ImageIcon, Palette } from "lucide-react";

type SettingFormType = z.infer<typeof SettingSchema>;

export default function Settings() {
  const dispatch = useDispatch();
  const translate = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
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
  const [isBrandingFooterImage, setIsBrandingFooterImage] = useState(false);

  const fav_icon = watch("fav_icon");
  const brandingImage = watch("brandingImage");
  const brandingFooterImage = watch("brandingFooterImage");
  const primaryColor = watch("primaryColor");

  const {
    data: settings,
    isSuccess: success,
    isLoading: loading,
  } = useGetSettingQuery("");
  const [updateSetting] = useUpdateSettingMutation();

  const [colorValue, setColorValue] = React.useState(
    parseColor(getValues("primaryColor") || "#5100FF"),
  );
  const [colorFieldValue, setColorFieldValue] = useState("");

  useEffect(() => {
    if (settings?.data) {
      reset({ ...settings.data });
      if (settings.data.primaryColor) {
        try {
          setColorValue(parseColor(settings.data.primaryColor));
        } catch (error) {
          console.error("Invalid color format in settings:", error);
        }
      }
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
      case "brandingFooterImage":
        setValue("brandingFooterImage", selectedImage);
        setIsBrandingFooterImage(false);
        break;
      default:
        break;
    }
    dispatch(clearSelectedMedia());
  };

  const applyColor = (value: typeof colorValue) => {
    setColorValue(value);
    setValue("primaryColor", value.toString("hex").toUpperCase(), {
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: SettingFormType) => {
    const body = {
      ...data,
      primaryColor: colorValue.toString("hex").toUpperCase(),
    };
    try {
      const response = await updateSetting({
        body,
        id: settings?.data?.id,
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
          Update your brand details, contact info, logos, and theme color.
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
            isRequired
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
            label="Footer Description"
            placeholder="Footer Description"
            type="text"
            {...register("footer_desc")}
            error={errors?.footer_desc?.message}
            isRequired
          />
          <Input
            label="Google Analytics"
            placeholder="Google Analytics"
            type="text"
            {...register("google_analytics")}
            error={errors?.google_analytics?.message}
            isRequired
          />
          <Input
            label="Map Url"
            placeholder="url from google map"
            type="text"
            {...register("mapUrl")}
            error={errors?.mapUrl?.message}
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
              Logos, favicon, and brand color
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5 xl:grid-cols-4">
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
          <ImageField
            label={translate("Footer Branding Image")}
            required
            open={isBrandingFooterImage}
            setOpen={setIsBrandingFooterImage}
            image={brandingFooterImage}
            onConfirm={() => handleConfirmImage("brandingFooterImage")}
          />

          <div className="flex min-w-0 flex-col">
            <label className="mb-2 text-left text-xs font-medium text-slate-600">
              {translate("Primary Color")}
            </label>
            <div className="flex min-h-[11.5rem] flex-1 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                  <Palette size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    Theme color
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Used across buttons and accents
                  </p>
                </div>
              </div>

              <ColorPicker value={colorValue} onChange={applyColor}>
                <DialogTrigger>
                  <AriaBtn className="mt-4 inline-flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-white">
                    <ColorSwatch className="h-9 w-9 shrink-0 rounded-lg shadow-sm ring-1 ring-black/5" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800">
                        {translate("Primary Color")}
                      </span>
                      <span className="block truncate font-mono text-xs text-slate-500">
                        {(primaryColor || colorValue.toString("hex")).toUpperCase()}
                      </span>
                    </div>
                  </AriaBtn>
                  <Popover
                    placement="bottom start"
                    className="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
                  >
                    <Dialog className="flex flex-col gap-4 outline-none">
                      <ColorArea
                        colorSpace="hsb"
                        xChannel="saturation"
                        yChannel="brightness"
                        value={colorValue}
                        onChange={applyColor}
                        className="aspect-square w-full max-w-[16rem] rounded-lg"
                      >
                        <ColorThumb className="size-7 rounded-full border-2 border-white shadow">
                          <div className="size-full rounded-full border border-black/40" />
                        </ColorThumb>
                      </ColorArea>
                      <ColorSlider
                        colorSpace="hsb"
                        channel="hue"
                        value={colorValue}
                        onChange={applyColor}
                        className="h-4 w-full rounded-full"
                      >
                        <SliderTrack className="relative h-4 w-full rounded-full bg-[linear-gradient(to_right,#ef4444,#eab308,#22c55e,#06b6d4,#3b82f6,#a855f7,#ef4444)]">
                          <ColorThumb className="absolute top-1/2 size-7 -translate-y-1/2 rounded-full border-2 border-white shadow">
                            <div className="size-full rounded-full border border-black/40" />
                          </ColorThumb>
                        </SliderTrack>
                      </ColorSlider>
                      <ColorField
                        value={colorValue}
                        onChange={applyColor}
                        className="flex flex-col gap-1"
                      >
                        <Label className="text-sm font-medium text-slate-700">
                          Hex Color
                        </Label>
                        <Input
                          value={
                            colorFieldValue.trim().length > 0
                              ? colorFieldValue
                              : colorValue.toString("hex").toUpperCase()
                          }
                          onChange={(e) => {
                            const hex = e.target.value.replace("#", "");
                            setColorFieldValue(hex);
                            if (isValidHex(hex)) {
                              applyColor(parseColor(`#${hex}`));
                            }
                          }}
                          placeholder="#RRGGBB"
                        />
                        <FieldError className="text-sm text-red-500">
                          {errors?.primaryColor?.message}
                        </FieldError>
                      </ColorField>
                    </Dialog>
                  </Popover>
                </DialogTrigger>
              </ColorPicker>
            </div>
          </div>
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
