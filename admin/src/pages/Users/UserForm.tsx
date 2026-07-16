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

type UserFormType = z.infer<typeof UserSchema>;

type UserFormProps = {
  isOpen: boolean;
  editId: number | null;
  handleCloseDrawer: () => void;
};

const GenderOptions = [
  { label: "Male", value: "male" },
  {
    label: "Female",
    value: "female",
  },
  {
    label: "Others",
    value: "other",
  },
];

export default function UserForm({
  editId,
  handleCloseDrawer,
  isOpen,
}: Readonly<UserFormProps>) {
  const translate = useTranslation();
  const dispatch = useDispatch();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
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
    limit: 100,
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
        email: "",
        firstName: "",
        lastName: "",
        mobileNo: "",
        mobilePrefix: "",
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
        value: each.id,
      }));
      setRoleOptions(options);
    }
  }, [roles, roleSuccess]);

  const handleConfirmImage = () => {
    setImage(selectedImage);
    dispatch(clearSelectedMedia());
    setOpenMedia(false);
  };

  const onSubmit = async (data: any) => {
    const trimmedData = trimFormData(data);
    const body = {
      ...trimmedData,
      roleId: String(data.roleId),
      isActive: true,
      imageUrl: image ? image : null,
    };
    if (editId === null) {
      try {
        const response = await createUser(body).unwrap();
        handleResponse({
          res: response,
          onSuccess: handleCloseDrawer,
        });
      } catch (error) {
        handleError({ error, setError });
      } finally {
        reset({
          username: "",
          email: "",
          firstName: "",
          lastName: "",
          mobileNo: "",
          mobilePrefix: "",
          roleId: "",
          gender: "",
          password: "",
        });
        setImage("");
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
    <>
      <div className="mb-[2.5rem]">
        <div className="flex gap-[1.5rem] ">
          <div className="border h-[6.25rem] w-[6.25rem] rounded-[0.375rem]">
            <img
              src={image ? buildAssetUrl(image) : userImage}
              alt="User"
              className="h-[6.25rem] w-[6.25rem] overflow-hidden object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = userImage;
              }}
            />
          </div>
          <div className="space-y-[1rem]">
            <div className="flex gap-[1rem]">
              <button className="bg-primaryColor px-[1.25rem] py-[0.5rem] rounded-[0.375rem] text-white">
                <p className="font-[500] text-[0.9375rem]">
                  <MediaComponent
                    title={translate("Upload New Photo")}
                    handleConfirmImage={handleConfirmImage}
                    open={openMedia}
                    setOpen={setOpenMedia}
                  />
                </p>
              </button>
              <button
                className="bg-[#EBEEF0] px-[1.25rem] py-[0.5rem] rounded-[0.375rem] "
                onClick={() => setImage("")}
              >
                <p className="font-[500] text-[0.9375rem] whitespace-nowrap">
                  {translate("Reset")}
                </p>
              </button>
            </div>
            <div>
              <p className="font-[400] text-[0.9375rem] text-[#646e78]">
                {translate("Allowed JPG, GIF or PNG. Max size of 1MB")}
              </p>
            </div>
          </div>
        </div>
        {errors.imageUrl && (
          <p className="text-red-500 text-sm">{errors.imageUrl.message}</p>
        )}
      </div>
      <form
        className="grid grid-cols-1 gap-[1.5rem] pb-24 md:grid-cols-2 md:pb-0"
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
      >
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
          label="Email"
          placeholder="test@gmail.com"
          type="text"
          {...register("email")}
          error={errors.email?.message}
          isRequired
        />
        <Input
          label="First Name"
          placeholder="John"
          type="text"
          {...register("firstName")}
          error={errors.firstName?.message}
        />{" "}
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
          placeholder="+81"
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
                <p className="text-red-500 text-sm">{errors.gender.message}</p>
              )}
            </div>
          )}
        />
        {!editId && (
          <Input
            label="Password"
            placeholder="******"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
            isRequired
          />
        )}
        {/* <Input label="Is Active" type="checkbox" /> */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] md:static md:col-span-2 md:flex md:justify-end md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <Button
            type="submit"
            className="submit-button min-h-11 w-full md:w-auto md:min-w-[7rem]"
          >
            <div className="flex items-center justify-center">
              {translate("Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}
