import { z } from "zod";
import { RoleSchema } from "./schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateRoleMutation } from "@/redux/services/role";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useEffect } from "react";
import TextArea from "@/components/TextArea";
import useTranslation from "@/locale/useTranslation";
import { ShieldPlus } from "lucide-react";

type RoleFormType = z.infer<typeof RoleSchema>;

type AddRoleFormPropType = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function AddRoleForm({
  isOpen,
  setIsOpen,
}: Readonly<AddRoleFormPropType>) {
  const translate = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormType>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ title: "", description: "" });
    }
  }, [isOpen, reset]);

  const [createRole] = useCreateRoleMutation();

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const onSubmit = async (data: RoleFormType) => {
    const body = { ...data, roleType: "admin" };
    try {
      const response = await createRole(body).unwrap();
      handleResponse({
        res: response,
        onSuccess: handleCloseDrawer,
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-primaryColor/[0.03] px-5 pb-5 pt-1 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor shadow-sm ring-1 ring-primaryColor/10">
            <ShieldPlus className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {translate("Add Role")}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {translate(
                "Create a role first, then assign permissions after saving.",
              )}
            </p>
          </div>
        </div>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <Input
            label="Title"
            placeholder="Role Title"
            type="text"
            {...register("title")}
            error={errors.title?.message}
            isRequired
          />
          <TextArea
            label="Description"
            placeholder="Optional notes about this role"
            rows={4}
            {...register("description")}
            error={errors?.description?.message}
          />
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex justify-end">
            <Button
              type="submit"
              className="submit-button min-h-11 w-full min-w-[8rem] sm:w-auto"
              disabled={isSubmitting}
            >
              <div className="flex items-center justify-center">
                {isSubmitting ? translate("Saving...") : translate("Submit")}
              </div>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
