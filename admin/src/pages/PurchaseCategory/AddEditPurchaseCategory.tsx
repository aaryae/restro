import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import { PURCHASE_CATEGORY_LIST_ROUTE } from "@/routes/routeNames";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { PURCHASE_CATEGORY_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { AlignLeft, Tags, Type } from "lucide-react";

const PurchaseCategorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
type PurchaseCategoryFormType = z.infer<typeof PurchaseCategorySchema>;

type AddPurchaseCategoryProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
  onCreated?: (category: { id: number; name: string }) => void;
};

const AddPurchaseCategory: React.FC<AddPurchaseCategoryProps> = ({
  id: idProp,
  isComponent = false,
  closeModal,
  onSuccess,
  onCreated,
} = {}) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id =
    idProp !== undefined && idProp !== null ? String(idProp) : paramId;
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseCategoryFormType>({
    resolver: zodResolver(PurchaseCategorySchema),
  });

  const [createApi, { isLoading: creating }] = useCreateApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const { data: categoryResp, isLoading: loadingRecord } = useGetApiQuery(
    { url: `${PURCHASE_CATEGORY_URL}${id}` },
    { skip: !isEdit },
  );

  useEffect(() => {
    if (!isEdit || !categoryResp?.data) return;
    const row = categoryResp.data as { name?: string; description?: string };
    reset({
      title: row.name || "",
      description: row.description || "",
    });
  }, [isEdit, categoryResp, reset]);

  const finish = (created?: { id: number; name: string }) => {
    if (created) onCreated?.(created);
    onSuccess?.();
    closeModal?.();
  };

  const onCancel = () => {
    if (isComponent) closeModal?.();
    else navigate(PURCHASE_CATEGORY_LIST_ROUTE);
  };

  const onSubmit = handleSubmit(async (data) => {
    const body = {
      name: data.title,
      description: data.description || undefined,
    };
    try {
      const response = isEdit
        ? await updateApi({
            url: `${PURCHASE_CATEGORY_URL}${id}`,
            body,
          }).unwrap()
        : await createApi({ url: `${PURCHASE_CATEGORY_URL}`, body }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg:
            response?.message ||
            (isEdit
              ? "Purchase category updated successfully."
              : "Purchase category created successfully."),
        },
        onSuccess: () => {
          if (isComponent) {
            const created =
              !isEdit && response?.data?.id != null
                ? {
                    id: Number(response.data.id),
                    name: String(response.data.name || data.title),
                  }
                : undefined;
            finish(created);
          } else {
            onCancel();
          }
        },
      });
    } catch (error) {
      handleError({ error });
    }
  });

  return (
    <EntityForm
      title={isEdit ? "Edit Purchase Category" : "Add Purchase Category"}
      sectionTitle="Category details"
      description="Title and optional description for this purchase category."
      icon={Tags}
      embedded={isComponent}
      columns={1}
      maxWidthClass="max-w-2xl"
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSaving={isSubmitting || creating || updating}
      isLoading={isEdit && loadingRecord && !categoryResp}
      submitLabel={isEdit ? "Update" : "Submit"}
    >
      <Input
        label="Purchase Category Title"
        placeholder="e.g. Raw materials, Packaging"
        leftSection={<FieldIcon icon={Type} />}
        {...register("title")}
        error={errors.title?.message}
        isRequired
      />
      <TextArea
        label="Purchase Category Description"
        placeholder="Optional short description"
        rows={3}
        leftSection={<FieldIcon icon={AlignLeft} />}
        {...register("description")}
        error={errors.description?.message}
      />
    </EntityForm>
  );
};

export default AddPurchaseCategory;
