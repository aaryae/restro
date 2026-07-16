import { useForm } from "react-hook-form";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { z } from "zod";
import { SecuritySchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useChangePasswordMutation,
  useResetPasswordMutation,
} from "@/redux/services/authentication";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useEffect } from "react";
import useTranslation from "@/locale/useTranslation";
import { trimFormData } from "@/utils/validationHelper";

type SecurityFormType = z.infer<typeof SecuritySchema>;

type SecurityProps = {
  handleCloseDrawer: () => void;
  editId: number | null;
  isOpen: boolean;
};

export default function Security({
  handleCloseDrawer,
  editId,
  isOpen,
}: Readonly<SecurityProps>) {
  const translate = useTranslation();
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SecurityFormType>({
    resolver: zodResolver(SecuritySchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  useEffect(() => {
    reset({
      newPassword: "",
      confirmPassword: "",
    });
  }, []);

  const [changePassword] = useResetPasswordMutation();

  const onSubmit = async (data: any) => {
    const trimmedData = trimFormData(data);
    delete trimmedData.confirmPassword;
    try {
      const response = await changePassword({
        body: trimmedData,
        id: editId,
      }).unwrap();
      handleResponse({ res: response, onSuccess: handleCloseDrawer });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <form className="space-y-[1rem]" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="New Password"
        placeholder="******"
        type="password"
        {...register("newPassword")}
        error={errors.newPassword?.message}
          isRequired
        />
      <Input
        label="Confirm Password"
        placeholder="******"
        type="password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
          isRequired
        />
      <Button type="submit" className="submit-button">
        {" "}
        <div className="flex justify-center items-center gap-[0.5rem] ">
          {translate("Submit")}
        </div>
      </Button>
    </form>
  );
}
