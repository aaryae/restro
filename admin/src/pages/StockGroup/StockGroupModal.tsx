import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { STOCK_GROUP_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { AlignLeft, Boxes, Type } from "lucide-react";

const StockGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
type StockGroupFormType = z.infer<typeof StockGroupSchema>;

type Props = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

const StockGroupModal: React.FC<Props> = ({
  id: idProp,
  isComponent = true,
  closeModal,
  onSuccess,
}) => {
  const id =
    idProp !== undefined && idProp !== null ? String(idProp) : undefined;
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockGroupFormType>({
    resolver: zodResolver(StockGroupSchema),
    defaultValues: { name: "", description: "" },
  });

  const [createApi, { isLoading: creating }] = useCreateApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const { data: groupResp, isLoading } = useGetApiQuery(
    { url: `${STOCK_GROUP_URL}${id}` },
    { skip: !isEdit },
  );

  useEffect(() => {
    if (!isEdit) {
      reset({ name: "", description: "" });
      return;
    }
    const row = groupResp?.data as
      | { name?: string; description?: string }
      | undefined;
    if (!row) return;
    reset({
      name: row.name || "",
      description: row.description || "",
    });
  }, [isEdit, groupResp, reset]);

  const finish = () => {
    onSuccess?.();
    closeModal?.();
  };

  const onCancel = () => {
    closeModal?.();
  };

  const onSubmit = async (data: StockGroupFormType) => {
    const body = {
      name: data.name,
      description: data.description || undefined,
    };
    try {
      const response = isEdit
        ? await updateApi({
            url: `${STOCK_GROUP_URL}${id}`,
            body,
          }).unwrap()
        : await createApi({ url: STOCK_GROUP_URL, body }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg:
            response?.message ||
            (isEdit
              ? "Stock group updated successfully."
              : "Stock group created successfully."),
        },
        onSuccess: finish,
      });
    } catch (error: unknown) {
      handleError({ error });
    }
  };

  return (
    <EntityForm
      title={isEdit ? "Edit Stock Group" : "Add Stock Group"}
      sectionTitle="Group details"
      description="Name and optional description for this stock group."
      icon={Boxes}
      embedded={isComponent}
      columns={1}
      maxWidthClass="max-w-2xl"
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      isSaving={isSubmitting || creating || updating}
      isLoading={isEdit && isLoading && !groupResp}
      submitLabel={isEdit ? "Update" : "Save"}
    >
      <Input
        label="Name"
        placeholder="Enter stock group name"
        leftSection={<FieldIcon icon={Type} />}
        {...register("name")}
        error={errors.name?.message}
        isRequired
      />
      <TextArea
        label="Description"
        placeholder="Optional description"
        rows={3}
        leftSection={<FieldIcon icon={AlignLeft} />}
        {...register("description")}
        error={errors.description?.message}
      />
    </EntityForm>
  );
};

export default StockGroupModal;
