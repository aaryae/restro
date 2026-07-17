import { useForm } from "react-hook-form";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { z } from "zod";
import { SecuritySchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResetPasswordMutation } from "@/redux/services/authentication";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useEffect } from "react";
import useTranslation from "@/locale/useTranslation";
import { trimFormData } from "@/utils/validationHelper";
import { GoLock } from "react-icons/go";

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
    formState: { errors, isSubmitting },
  } = useForm<SecurityFormType>({
    resolver: zodResolver(SecuritySchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

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
    <form className="flex min-h-full flex-col" onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <GoLock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900">
            {translate("Password reset")}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80">
            {translate(
              "Set a new password for this user. They will need it on their next login.",
            )}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {translate("New Credentials")}
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
        </div>
      </div>

      <div className="sticky bottom-0 -mx-5 mt-6 border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="submit-button min-h-11 w-full min-w-[8rem] sm:w-auto"
          >
            <div className="flex items-center justify-center gap-2">
              <GoLock className="h-4 w-4" />
              {isSubmitting
                ? translate("Updating...")
                : translate("Update Password")}
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
}
