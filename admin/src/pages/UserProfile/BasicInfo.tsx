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
    formState: { errors },
  } = useForm<UserFormType>({ resolver: zodResolver(UserSchema) });

  const { data: getUser, isSuccess: success } = useGetProfileQuery("");
  const [updateUser] = useUpdateUserMutation();
  const { data: roles, isSuccess: roleSuccess } = useGetRoleQuery({
    page: 1,
    limit: 100,
  });
  const userId = useAppSelector((state) => state.auth.id);

  // image component
  const [image, setImage] = useState<string>("");
  const [openMedia, setOpenMedia] = useState<boolean>(false);
  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (roleSuccess && roles?.data?.data) {
      const options = roles?.data?.data.map((each) => ({
        label: each.title,
        value: each.id,
      }));
      setRoleOptions(options);
    }
  }, [roles, roleSuccess]);

  useEffect(() => {
    if (getUser?.data) {
      reset({ ...getUser.data });
      setImage(getUser.data.imageUrl || "");
    }
  }, [getUser, success]);

  const handleConfirmImage = () => {
    setImage(selectedImage);
    dispatch(clearSelectedMedia());
    setOpenMedia(false);
  };

  const handleDiscardButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate("/admin/dashboard");
  };

  const onSubmit = async (data: any) => {
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

  return (
    <div className="relative">
      <div className="flex gap-[1.5rem] mb-[2.5rem] md:p-[1.5rem] border w-fit rounded-[0.25rem]">
        <div className="border h-[100px] w-[100px] rounded-[6px]">
          <img
            src={image ? buildAssetUrl(image) : userImage}
            alt="User"
            className="h-[100px] w-[100px] overflow-hidden object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = userImage;
            }}
          />
        </div>
        <div className="space-y-[1rem]">
          <div className="flex gap-[1rem]">
            <button className="bg-primaryColor px-[20px] py-[8px] rounded-[6px] text-white">
              <p className="font-[500] text-[15px]">
                <MediaComponent
                  title="Upload New Photo"
                  handleConfirmImage={handleConfirmImage}
                  open={openMedia}
                  setOpen={setOpenMedia}
                />
              </p>
            </button>
            <button
              className="bg-[#EBEEF0] px-[20px] py-[8px] rounded-[6px] "
              onClick={() => setImage("")}
            >
              <p className="font-[500] text-[15px]">{translate("Reset")}</p>
            </button>
          </div>
          <div>
            <p className="font-[400] text-[15px] text-[#646e78]">
              {translate("Allowed JPG, GIF or PNG. Max size of 1MB")}
            </p>
          </div>
        </div>
      </div>
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]"
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
          error={errors.mobileNo}
          isRequired
        />
        <Input
          label="Mobile Prefix"
          placeholder="+81"
          type="text"
          {...register("mobilePrefix")}
          error={errors.mobilePrefix}
          isRequired
        />
        <Controller
          name="roleId"
          control={control}
          render={({ field }) => (
            <Select {...field} options={roleOptions} label="Role Type"
          isRequired
        />
          )}
        />
        {/* <Input label="Role" placeholder="SuperAdmin" type="text" {...register("roleId")} disabled error={errors.roleId}
          isRequired
        /> */}
        <Input
          label="Gender"
          placeholder="Male"
          type="text"
          {...register("gender")}
          error={errors.gender}
          isRequired
        />
        <div />
        <div className="flex justify-end gap-[1rem]">
          <Button type="submit" className="submit-button">
            {" "}
            <div className="flex justify-center items-center gap-[0.5rem] ">
              {translate("Submit")}
            </div>
          </Button>
          <button
            type="button"
            className="bg-gray-400 rounded-[6px] px-[20px] py-[0.5rem]"
            onClick={handleDiscardButton}
          >
            {" "}
            <div className="flex justify-center items-center gap-[0.5rem] ">
              {translate("Discard")}
            </div>
          </button>
        </div>
      </form>
    </div>
  );
}
