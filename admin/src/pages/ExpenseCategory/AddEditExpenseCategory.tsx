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
import { EXPENSE_CATEGORY_LIST_ROUTE } from "@/routes/routeNames";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { EXPENSE_CATEGORY_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { AlignLeft, FolderTree, Type } from "lucide-react";

const ExpenseCategorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
type ExpenseCategoryFormType = z.infer<typeof ExpenseCategorySchema>;

type AddExpenseCategoryProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

const AddExpenseCategory: React.FC<AddExpenseCategoryProps> = ({
  id: idProp,
  isComponent = false,
  closeModal,
  onSuccess,
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
  } = useForm<ExpenseCategoryFormType>({
    resolver: zodResolver(ExpenseCategorySchema),
  });

  const [createApi, { isLoading: creating }] = useCreateApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const { data: categoryResp, isLoading: loadingRecord } = useGetApiQuery(
    { url: `${EXPENSE_CATEGORY_URL}${id}` },
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

  const finish = () => {
    onSuccess?.();
    closeModal?.();
  };

  const onCancel = () => {
    if (isComponent) closeModal?.();
    else navigate(EXPENSE_CATEGORY_LIST_ROUTE);
  };

  const onSubmit = handleSubmit(async (data) => {
    const body = {
      name: data.title,
      description: data.description || undefined,
    };
    try {
      const response = isEdit
        ? await updateApi({
            url: `${EXPENSE_CATEGORY_URL}${id}`,
            body,
          }).unwrap()
        : await createApi({ url: `${EXPENSE_CATEGORY_URL}`, body }).unwrap();

      handleResponse({
        res: response,
        onSuccess: () => {
          if (isComponent) finish();
          else onCancel();
        },
      });
    } catch (error) {
      handleError({ error });
    }
  });

  return (
    <EntityForm
      title={isEdit ? "Edit Expense Category" : "Add Expense Category"}
      sectionTitle="Category details"
      description="Title and optional description for this expense category."
      icon={FolderTree}
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
        label="Expense Category Title"
        placeholder="e.g. Utilities, Rent"
        leftSection={<FieldIcon icon={Type} />}
        {...register("title")}
        error={errors.title?.message}
        isRequired
      />
      <TextArea
        label="Expense Category Description"
        placeholder="Optional short description"
        rows={3}
        leftSection={<FieldIcon icon={AlignLeft} />}
        {...register("description")}
        error={errors.description?.message}
      />
    </EntityForm>
  );
};

export default AddExpenseCategory;
