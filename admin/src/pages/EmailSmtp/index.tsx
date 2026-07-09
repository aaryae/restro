import useTranslation from "@/locale/useTranslation";
import { useEffect } from "react";
import { z } from "zod";
import { EmailSmtpSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Input from "@/components/Input";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import {
  useCreateSmtpMutation,
  useGetSmtpQuery,
  useUpdateSmtpMutation,
} from "@/redux/services/smtp";

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

  const { data: emailSmtp, isSuccess: success, refetch } = useGetSmtpQuery("");
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
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        showSearch={false}
        handleReloadButton={() => refetch()}
        subText="Configure outgoing mail server settings for system emails."
      />
      <form
        className="mt-4 max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
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
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="submit-button inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-medium"
          >
            {translate("Submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
