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
import { MdOutlineFactCheck } from "react-icons/md";

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
    formState: { errors },
  } = useForm<RoleFormType>({
    resolver: zodResolver(RoleSchema),
  });

  useEffect(() => {
    reset({ title: "", description: "" });
  }, [isOpen]);

  const [createRole] = useCreateRoleMutation();

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const onSubmit = async (data: any) => {
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
    <div className="mt-[4rem]">
      <div className="flex mt-[4rem] mb-[1.5rem]">
        <p className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white">
          <MdOutlineFactCheck />
          <p className="font-[500] text-[15px]">{translate("Role")}</p>
        </p>
      </div>
      <form
        className="grid grid-cols-1 gap-[1.5rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Title"
          placeholder="Role Title"
          type="text"
          {...register("title")}
          error={errors.title?.message}
          isRequired
        />
        <TextArea
          label={<>{translate("Description")}</>}
          {...register("description")}
          error={errors?.description?.message}
        />

        <Button type="submit" className="submit-button">
          {" "}
          <div className="flex justify-center items-center gap-[0.5rem] ">
            {translate("Submit")}
          </div>
        </Button>
      </form>
    </div>
  );
}
