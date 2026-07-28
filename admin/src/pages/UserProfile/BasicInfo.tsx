import { Controller, useForm } from "react-hook-form";
import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  useGetProfileQuery,
  useUpdateUserMutation,
} from "@/redux/services/authentication";
import { useEffect, useState } from "react";
import MediaComponent from "@/components/MediaComponent";
import { useAppSelector } from "@/redux/store/hooks";
import { useDispatch } from "react-redux";
import { clearSelectedMedia } from "@/redux/feature/mediaSlice";
import { z } from "zod";
import { UserSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import useTranslation from "@/locale/useTranslation";
import userImage from "@/assets/user_image.jpeg";
import { trimFormData } from "@/utils/validationHelper";
import Select from "@/components/Select";
import { useGetRoleQuery } from "@/redux/services/role";
import { Camera, RotateCcw } from "lucide-react";

type UserFormType = z.infer<typeof UserSchema>;

export default function BasicInfo() {
  const translate = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormType>({ resolver: zodResolver(UserSchema) });

  const { data: getUser, isSuccess: success } = useGetProfileQuery("");
  const [updateUser] = useUpdateUserMutation();
  const { data: roles, isSuccess: roleSuccess } = useGetRoleQuery({
    page: 1,
    limit: 100,
  });
  const userId = useAppSelector((state) => state.auth.id);

  const [image, setImage] = useState("");
  const [openMedia, setOpenMedia] = useState(false);
  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (roleSuccess && roles?.data?.data) {
      setRoleOptions(
        roles.data.data.map((each: { title: string; id: string | number }) => ({
          label: each.title,
          value: String(each.id),
        })),
      );
    }
  }, [roles, roleSuccess]);

  useEffect(() => {
    if (getUser?.data) {
      reset({
        ...getUser.data,
        roleId: getUser.data.roleId != null ? String(getUser.data.roleId) : "",
      });
      setImage(getUser.data.imageUrl || "");
    }
  }, [getUser, reset, success]);

  const handleConfirmImage = () => {
    setImage(selectedImage);
    dispatch(clearSelectedMedia());
    setOpenMedia(false);
  };

  const handleDiscardButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate("/admin/dashboard");
  };

  const onSubmit = async (data: UserFormType) => {
    const trimmedData = trimFormData(data);
    const body = {
      ...trimmedData,
      roleId: String(data.roleId),
      isActive: true,
      imageUrl: image,
    };

    try {
      const response = await updateUser({ body, id: userId }).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  const displayName =
    [getUser?.data?.firstName, getUser?.data?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    getUser?.data?.username ||
    "Your profile";

  return (
    <div className="min-w-0">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-800">
          {translate("Basic Information")}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Update your photo and personal details
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mx-0 sm:h-28 sm:w-28">
            <img
              src={image ? buildAssetUrl(image) : userImage}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = userImage;
              }}
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="truncate text-sm font-semibold text-slate-800">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {getUser?.data?.email || "Update your profile photo"}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <div className="inline-flex h-9 items-center rounded-lg bg-primaryColor px-3.5 text-sm font-medium text-white transition hover:bg-primaryColor/90">
                <MediaComponent
                  title={
                    <span className="inline-flex items-center gap-1.5">
                      <Camera size={15} />
                      {translate("Upload New Photo")}
                    </span>
                  }
                  handleConfirmImage={handleConfirmImage}
                  open={openMedia}
                  setOpen={setOpenMedia}
                />
              </div>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => setImage("")}
              >
                <RotateCcw size={14} />
                {translate("Reset")}
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              {translate("Allowed JPG, GIF or PNG. Max size of 1MB")}
            </p>
          </div>
        </div>

        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Input
            label="Username"
            placeholder="Username"
            type="text"
            {...register("username")}
            error={errors.username?.message}
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
            label="First Name"
            placeholder="John"
            type="text"
            {...register("firstName")}
            error={errors?.firstName?.message}
            isRequired
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            type="text"
            {...register("lastName")}
            error={errors?.lastName?.message}
            isRequired
          />
          <Input
            label="Mobile No"
            placeholder="98********"
            type="text"
            {...register("mobileNo")}
            error={
              typeof errors.mobileNo === "string"
                ? errors.mobileNo
                : errors.mobileNo?.message
            }
            isRequired
          />
          <Input
            label="Mobile Prefix"
            placeholder="+81"
            type="text"
            {...register("mobilePrefix")}
            error={
              typeof errors.mobilePrefix === "string"
                ? errors.mobilePrefix
                : errors.mobilePrefix?.message
            }
            isRequired
          />
          <Controller
            name="roleId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                value={field.value != null ? String(field.value) : ""}
                options={roleOptions}
                label="Role Type"
                error={
                  typeof errors.roleId === "string"
                    ? errors.roleId
                    : errors.roleId?.message
                }
                isRequired
              />
            )}
          />
          <Input
            label="Gender"
            placeholder="Male"
            type="text"
            {...register("gender")}
            error={
              typeof errors.gender === "string"
                ? errors.gender
                : errors.gender?.message
            }
            isRequired
          />

          <div className="col-span-full flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={handleDiscardButton}
            >
              {translate("Discard")}
            </button>
            <Button
              type="submit"
              className="submit-button inline-flex h-10 w-full items-center justify-center rounded-lg px-5 text-sm font-medium sm:w-auto"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Saving..." : translate("Submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
