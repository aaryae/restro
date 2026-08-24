import { Controller, useForm } from "react-hook-form";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSchema } from "./schema";
import { z } from "zod";
import {
  useCreateUserMutation,
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "../../redux/services/authentication";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useEffect, useState } from "react";
import MediaComponent from "../../components/MediaComponent";
import { useAppSelector } from "../../redux/store/hooks";
import { useDispatch } from "react-redux";
import { clearSelectedMedia } from "../../redux/feature/mediaSlice";
import { useGetRoleQuery } from "../../redux/services/role";
import Select from "../../components/Select";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import useTranslation from "@/locale/useTranslation";
import userImage from "@/assets/user_image.jpeg";
import { trimFormData } from "@/utils/validationHelper";
import { ImagePlus, RotateCcw } from "lucide-react";

type UserFormType = z.infer<typeof UserSchema>;

type UserFormProps = {
  isOpen: boolean;
  editId: number | null;
  handleCloseDrawer: () => void;
  onMediaOpenChange?: (open: boolean) => void;
  createPassword?: string;
  onNeedPassword?: () => void;
};

const GenderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Others", value: "other" },
];

export default function UserForm({
  editId,
  handleCloseDrawer,
  isOpen: _isOpen,
  onMediaOpenChange,
  createPassword = "",
  onNeedPassword,
}: Readonly<UserFormProps>) {
  const translate = useTranslation();
  const dispatch = useDispatch();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormType>({
    resolver: zodResolver(UserSchema),
  });

  const [openMedia, setOpenMedia] = useState<boolean>(false);
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [image, setImage] = useState<string>("");
  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const {
    data: getUser,
    isSuccess: success,
    refetch,
  } = useGetUserByIdQuery(editId, {
    skip: editId === null,
  });
  const { data: roles, isSuccess: roleSuccess } = useGetRoleQuery({
    page: 1,
    limit: 25,
  });

  useEffect(() => {
    if (editId !== null) {
      refetch();
      if (getUser?.data) {
        reset({ ...getUser.data, roleId: String(getUser.data.roleId) });
        setImage(getUser.data.imageUrl || "");
      }
    } else {
      reset({
        username: "",
        firstName: "",
        lastName: "",
        mobileNo: "",
        mobilePrefix: "+977",
        roleId: "",
        gender: "",
        password: "",
      });
      setImage("");
    }
  }, [editId, getUser, refetch, reset, success]);

  useEffect(() => {
    if (roleSuccess && roles?.data?.data) {
      const options = roles?.data?.data.map((each) => ({
        label: each.title,
        value: String(each.id),
      }));
      setRoleOptions(options);
    }
  }, [roles, roleSuccess]);

  const handleConfirmImage = () => {
    setImage(selectedImage);
    dispatch(clearSelectedMedia());
    setOpenMedia(false);
    onMediaOpenChange?.(false);
  };

  const handleMediaOpenChange = (open: boolean) => {
    setOpenMedia(open);
    onMediaOpenChange?.(open);
  };

  const onSubmit = async (data: any) => {
    const trimmedData = trimFormData(data);
    if (editId === null) {
      const password = String(createPassword || "").trim();
      if (!password) {
        onNeedPassword?.();
        return;
      }
      trimmedData.password = password;
    }
    const body = {
      ...trimmedData,
      roleId: Number(data.roleId),
      isActive: true,
      imageUrl: image ? image : null,
    };
    if (editId === null) {
      try {
        const response = await createUser(body).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => {
            reset({
              username: "",
              firstName: "",
              lastName: "",
              mobileNo: "",
              mobilePrefix: "+977",
              roleId: "",
              gender: "",
              password: "",
            });
            setImage("");
            handleCloseDrawer();
          },
        });
      } catch (error) {
        handleError({ error, setError });
      }
    } else {
      try {
        delete body.password;
        const response = await updateUser({ body, id: editId }).unwrap();
        handleResponse({
          res: response,
          onSuccess: handleCloseDrawer,
        });
      } catch (error) {
        handleError({ error, setError });
      }
    }
  };

  return (
    <form
      className="flex min-h-full flex-col"
      autoComplete="off"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-6 rounded-2xl border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-[var(--serve-surface)] shadow-md">
              <img
                src={image ? buildAssetUrl(image) : userImage}
                alt="User"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = userImage;
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--serve-surface)] bg-primaryColor text-white shadow-sm">
              <ImagePlus className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-[var(--serve-fg)]">
              {translate("Profile Photo")}
            </p>
            <p className="mt-1 text-xs text-[var(--serve-muted)]">
              {translate("Allowed JPG, GIF or PNG. Max size of 1MB")}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <div className="[&_button]:inline-flex [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-lg [&_button]:bg-primaryColor [&_button]:px-4 [&_button]:py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:text-white [&_button]:shadow-sm [&_button]:transition hover:[&_button]:bg-primaryColor/90">
                <MediaComponent
                  title={
                    <span className="inline-flex items-center gap-2">
                      <ImagePlus className="h-3.5 w-3.5" />
                      {translate("Upload New Photo")}
                    </span>
                  }
                  handleConfirmImage={handleConfirmImage}
                  open={openMedia}
                  setOpen={handleMediaOpenChange}
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-4 py-2 text-sm font-medium text-[var(--serve-fg)] shadow-sm transition hover:bg-[var(--serve-surface-2)]"
                onClick={() => setImage("")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {translate("Reset")}
              </button>
            </div>
          </div>
        </div>
        {errors.imageUrl && (
          <p className="mt-3 text-center text-sm text-red-500 sm:text-left">
            {errors.imageUrl.message}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--serve-border)] bg-[var(--serve-surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--serve-muted)]">
          {translate("Account Details")}
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Username"
            placeholder="Username"
            type="text"
            autoComplete="new-username"
            {...register("username")}
            error={errors.username?.message}
            isRequired
          />
          <Input
            label="First Name"
            placeholder="John"
            type="text"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            type="text"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
          <Input
            label="Mobile No"
            placeholder="98********"
            type="text"
            {...register("mobileNo")}
            error={errors.mobileNo?.message}
            isRequired
          />
          <Input
            label="Mobile Prefix"
            placeholder="+977"
            type="text"
            {...register("mobilePrefix")}
            error={errors.mobilePrefix?.message}
            isRequired
          />
          <Controller
            name="roleId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={roleOptions}
                label="Role Type"
                isRequired
              />
            )}
          />
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <div>
                <Select
                  {...field}
                  options={GenderOptions}
                  label="Gender"
                  isRequired
                />
                {errors.gender && (
                  <p className="text-sm text-red-500">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            )}
          />
          {!editId && (
            <div className="md:col-span-2 rounded-xl border border-dashed border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--serve-fg)]">
                {translate("Password")}
              </p>
              <p className="mt-1 text-xs text-[var(--serve-muted)]">
                {createPassword
                  ? translate("Password set on the Security tab.")
                  : translate(
                      "Set the login password on the Security tab before creating this user.",
                    )}
              </p>
              {!createPassword ? (
                <button
                  type="button"
                  onClick={() => onNeedPassword?.()}
                  className="mt-2 text-sm font-medium text-[var(--primary-ink)] underline-offset-2 hover:underline"
                >
                  {translate("Go to Security")}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-5 mt-6 border-t border-[var(--serve-border)] bg-[var(--serve-surface)] px-5 py-4 sm:-mx-6 sm:px-6">
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="submit-button min-h-11 w-full min-w-[8rem] sm:w-auto"
          >
            <div className="flex items-center justify-center">
              {isSubmitting
                ? translate("Saving...")
                : editId
                  ? translate("Save Changes")
                  : translate("Create User")}
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
}
