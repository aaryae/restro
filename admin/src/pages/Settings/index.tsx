import Input from "@/components/Input";
import MediaComponent from "@/components/MediaComponent";
import { IMAGE_BASE_URL } from "@/constants";
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
  SliderOutput,
  SliderTrack,
  FieldError,
} from "react-aria-components";
import isValidHex from "@/utils/isValidHex";
import { PRIMARY_COLOR } from "@/constants/projectConstants";

type SettingFormType = z.infer<typeof SettingSchema>;

interface SocialType {
  social_title: string;
  social_url: string;
  fav_icon: string;
}

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
    formState: { errors },
  } = useForm<SettingFormType>({
    resolver: zodResolver(SettingSchema),
    defaultValues: {
      primaryColor: PRIMARY_COLOR, // Default color matching initial colorValue
    },
  });

  // State for image
  const selectedImage = useAppSelector((state) => state.media.selectedImage);
  const [isFaviconOpen, setIsFavIconOpen] = useState<boolean>(false);
  const [isBrandingImage, setIsBrandingImage] = useState<boolean>(false);
  const [isBrandingFooterImage, setIsBrandingFooterImage] =
    useState<boolean>(false);

  // getting image
  const fav_icon = getValues("fav_icon");
  const brandingImage = getValues("brandingImage");
  const brandingFooterImage = getValues("brandingFooterImage");

  const {
    data: settings,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetSettingQuery("");
  const [updateSetting] = useUpdateSettingMutation();

  const [colorValue, setColorValue] = React.useState(
    parseColor(getValues("primaryColor") || "#5100FF"),
  );
  const [colorFieldValue, setColorFieldValue] = useState<string>("");

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
  }, [refetch, reset, success]);

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
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <form
      className="flex flex-col gap-[5rem]"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Brands */}
      <div className="shadow-xl rounded-[0.5rem]">
        <h2 className="text-start w-full p-[1rem]">
          {translate("Brand Setting")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1rem] px-[1rem] pb-[3rem] pt-[1rem]">
          <Input
            label="Brand Name"
            placeholder="Brand Name"
            type="text"
            {...register("brand_name")}
            error={errors?.brand_name?.message}
          />
          <Input
            label="Email"
            placeholder="Email"
            type="text"
            {...register("email")}
            error={errors?.email?.message}
          />
          <Input
            label="Primary Phone"
            placeholder="Primary Phone Number"
            type="text"
            {...register("primary_phone")}
            error={errors?.primary_phone?.message}
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
          />
          <Input
            label="Footer Description"
            placeholder="Footer Description"
            type="text"
            {...register("footer_desc")}
            error={errors?.footer_desc?.message}
          />
          <Input
            label="Google Analytics"
            placeholder="Google Analytics"
            type="text"
            {...register("google_analytics")}
            error={errors?.google_analytics?.message}
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
      </div>
      {/* Images */}
      <div className="shadow-xl rounded-[0.5rem]">
        <h2 className="text-start w-full p-[1rem]">
          {translate("Image Settings")}
        </h2>
        <div className="flex flex-wrap lg:gap-[4rem] gap-[2rem] px-[1rem] py-[3rem]">
          <div className="flex flex-col items-start">
            <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
              {translate("Favicon Image")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <MediaComponent
              title={<ImageInputUI type="large" image={fav_icon} />}
              handleConfirmImage={() => handleConfirmImage("fav_icon")}
              open={isFaviconOpen}
              setOpen={setIsFavIconOpen}
            />
          </div>
          <div className="flex flex-col items-start">
            <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
              {translate("Branding Image")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <MediaComponent
              title={<ImageInputUI type="large" image={brandingImage} />}
              handleConfirmImage={() => handleConfirmImage("brandingImage")}
              open={isBrandingImage}
              setOpen={setIsBrandingImage}
            />
          </div>
          <div className="flex flex-col items-start">
            <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
              {translate("Footer Branding Image")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <MediaComponent
              title={<ImageInputUI type="large" image={brandingFooterImage} />}
              handleConfirmImage={() =>
                handleConfirmImage("brandingFooterImage")
              }
              open={isBrandingFooterImage}
              setOpen={setIsBrandingFooterImage}
            />
          </div>
          <div className="flex flex-col items-start">
            <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
              {translate("Primary Color")}{" "}
            </label>
            <ColorPicker
              value={colorValue}
              onChange={(value) => {
                setColorValue(value);
                setValue("primaryColor", value.toString("hex").toUpperCase(), {
                  shouldValidate: true,
                });
              }}
            >
              <DialogTrigger>
                <AriaBtn className="flex items-center gap-3 px-4 py-2">
                  <ColorSwatch className="size-8 rounded" />
                  <span className="text-sm font-medium">Primary Color</span>
                </AriaBtn>
                <Popover
                  placement="bottom start"
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-64 sm:w-80 transition-all duration-200 ease-in-out"
                >
                  <Dialog className="flex flex-col gap-4">
                    <ColorArea
                      colorSpace="hsb"
                      xChannel="saturation"
                      yChannel="brightness"
                      value={colorValue}
                      onChange={(value) => {
                        setColorValue(value);
                        setValue(
                          "primaryColor",
                          value.toString("hex").toUpperCase(),
                          {
                            shouldValidate: true,
                          },
                        );
                      }}
                      className="size-48 sm:size-64 rounded-md"
                    >
                      <ColorThumb
                        className={`size-8 rounded-full border-2 border-white`}
                      >
                        <div className="size-full rounded-full border-2 border-black"></div>
                      </ColorThumb>
                    </ColorArea>
                    <ColorSlider
                      colorSpace="hsb"
                      channel="hue"
                      value={colorValue}
                      onChange={(value) => {
                        setColorValue(value);
                        setValue(
                          "primaryColor",
                          value.toString("hex").toUpperCase(),
                          {
                            shouldValidate: true,
                          },
                        );
                      }}
                      className={`w-full h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 to-blue-500`}
                    >
                      <SliderTrack className={`w-full h-4 relative`}>
                        <ColorThumb
                          className={`size-8 absolute top-[50%] translate-y-[50%] rounded-full border-2 border-white`}
                        >
                          <div className="size-full rounded-full border-2 border-black"></div>
                        </ColorThumb>
                      </SliderTrack>
                    </ColorSlider>
                    <ColorField
                      value={colorValue}
                      onChange={(value) => {
                        setColorValue(value);
                        setValue(
                          "primaryColor",
                          value.toString("hex").toUpperCase(),
                          {
                            shouldValidate: true,
                          },
                        );
                      }}
                      className="flex flex-col gap-1"
                    >
                      <Label className="text-sm font-medium text-gray-700">
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
                            const newColor = parseColor(`#${hex}`);
                            setColorValue(newColor);
                            setValue(
                              "primaryColor",
                              newColor.toString("hex").toUpperCase(),
                              {
                                shouldValidate: true,
                              },
                            );
                          }
                        }}
                        placeholder="#RRGGBB"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-150"
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

      <Button type="submit" className="submit-button w-fit">
        <div className="flex justify-center items-center gap-[0.5rem] text-white px-[1.5rem] py-[0.5rem]">
          {translate("Submit")}
        </div>
      </Button>
    </form>
  );
}

const ImageInputUI = ({ type, image }: { type: string; image?: string }) => {
  const translate = useTranslation();
  return (
    <>
      <div
        className={`h-[180px] border border-[#C9CBD1] rounded-[6px] flex items-center justify-center ${
          type === "small" ? "w-[147px] " : "w-[307px]"
        }`}
      >
        {image !== undefined ? (
          <img
            src={`${IMAGE_BASE_URL}${image}`}
            alt="Gallery Icon"
            className="object-contain w-[307px] h-[60px]"
            // crossOrigin="anonymous"
          />
        ) : (
          <img src={galleryIcon} alt="Gallery Icon" />
        )}
      </div>
      {type === "large" && (
        <p className="font-[400] text-[0.75rem] text-start mt-[2px] text-[#626c78]">
          {translate("Allowed JPG, GIF or PNG. Max size of 1MB")}
        </p>
      )}
    </>
  );
};
