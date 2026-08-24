import { useForm } from "react-hook-form";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { z } from "zod";
import { SecuritySchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChangePasswordMutation } from "@/redux/services/authentication";
import { handleError, handleResponse } from "@/utils/responseHandler";
import useTranslation from "@/locale/useTranslation";
import { trimFormData } from "@/utils/validationHelper";
import { ShieldCheck } from "lucide-react";

type AccountManagementFormType = z.infer<typeof SecuritySchema>;

export default function AccountManagement() {
  const translate = useTranslation();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountManagementFormType>({
    resolver: zodResolver(SecuritySchema),
  });

  const [changePassword] = useChangePasswordMutation();

  const onSubmit = async (data: AccountManagementFormType) => {
    const trimmedData = trimFormData(data);
    const body = { ...trimmedData };
    delete (body as { confirmPassword?: string }).confirmPassword;
    try {
      const response = await changePassword(body).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => reset({ newPassword: "", confirmPassword: "" }),
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <div className="min-w-0">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-800">
          {translate("Account Management")}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {translate("Change Password")}
        </p>
      </div>

      <form
        className="space-y-5 p-4 sm:p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primaryColor ring-1 ring-slate-200">
            <ShieldCheck size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">
              Keep your account secure
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Choose a strong password you don&apos;t use elsewhere.
            </p>
          </div>
        </div>

        <div className="grid max-w-xl grid-cols-1 gap-4">
          <Input
            label="New Password"
            placeholder="******"
            type="password"
            {...register("newPassword")}
            error={errors?.newPassword?.message}
          />
          <Input
            label="Confirm Password"
            placeholder="******"
            type="password"
            {...register("confirmPassword")}
            error={errors?.confirmPassword?.message}
          />
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            type="submit"
            className="submit-button inline-flex h-10 w-full items-center justify-center rounded-lg px-5 text-sm font-medium sm:w-auto"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting
              ? "Updating..."
              : translate("Change Password")}
          </Button>
        </div>
      </form>
    </div>
  );
}
