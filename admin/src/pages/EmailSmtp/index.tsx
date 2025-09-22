import useTranslation from "@/locale/useTranslation";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { EmailSmtpSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Input from "@/components/Input";
import Button from "@/components/Button";
import PageHeader from "@/components/PageHeaders";
import {
  useCreateSmtpMutation,
  useGetSmtpQuery,
  useUpdateSmtpMutation,
} from "@/redux/services/smtp";
import Select from "@/components/Select";
import PageTitle from "@/components/PageTitle";

type EmailSmtpFormType = z.infer<typeof EmailSmtpSchema>;

export default function EmailSmtp() {
  const translate = useTranslation();

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EmailSmtpFormType>({
    resolver: zodResolver(EmailSmtpSchema),
  });

  const { data: emailSmtp, isSuccess: success } = useGetSmtpQuery("");
  const [createSmtp] = useCreateSmtpMutation();
  const [updateSmtp] = useUpdateSmtpMutation();

  useEffect(() => {
    if (success) {
      reset({
        ...emailSmtp?.data,
      });
    }
  }, [emailSmtp, success]);

  const onSubmit = async (data: any) => {
    const body = { ...data };

    try {
      const response = emailSmtp?.data?.id
        ? await updateSmtp(body).unwrap()
        : await createSmtp(body).unwrap();

      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <>
      <PageTitle title="Email Smtp" />
      <form
        className="w-1/2 space-y-[1rem] form-container mt-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Username"
          isRequired
          {...register("username")}
          error={errors?.username?.message}
        />
        <Input
          label="Pass Key"
          isRequired
          {...register("passkey")}
          error={errors?.passkey?.message}
        />
        <Input
          label="Host"
          isRequired
          {...register("host")}
          error={errors?.host?.message}
        />
        {/* <Controller
          name="host"
          control={control}
          render={({ field }) => (
            <Select {...field} options={HostOption} label="Host" />
          )}
        /> */}
        <Input
          label="Port"
          isRequired
          {...register("port")}
          error={errors?.port?.message}
        />

        <Controller
          name="secure"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="secure"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-200"
              />
              <label htmlFor="secure" className="text-gray-700">
                Is Secure
              </label>
            </div>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" className="submit-button w-[5rem]">
            {" "}
            <div className="flex justify-center items-center gap-[0.5rem] text-white ">
              {translate("Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}

const HostOption = [{ label: "Gmail", value: "smtp.gmail.com" }];
