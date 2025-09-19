// admin/src/pages/ExpenseCategory/AddEditExpenseCategory.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import { EXPENSE_CATEGORY_LIST_ROUTE } from "@/routes/routeNames";
import useTranslation from "@/locale/useTranslation";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { EXPENSE_CATEGORY_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";

const ExpenseCategorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
type ExpenseCategoryFormType = z.infer<typeof ExpenseCategorySchema>;

const AddExpenseCategory: React.FC = () => {
  const translate = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
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

  const { data: categoryResp } = useGetApiQuery(
    { url: `${EXPENSE_CATEGORY_URL}${id}` },
    { skip: !isEdit },
  );

  useEffect(() => {
    if (!isEdit || !categoryResp?.data) return;
    const row = categoryResp.data as any;
    reset({
      title: row.name || "",
      description: row.description || "",
    });
  }, [isEdit, categoryResp, reset]);

  const onSubmit = async (data: ExpenseCategoryFormType) => {
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
        onSuccess: () => navigate(EXPENSE_CATEGORY_LIST_ROUTE),
      });
    } catch (error: any) {
      handleError({ error });
    }
  };

  return (
    <>
      <PageTitle
        title={isEdit ? "Edit Expense Category" : "Add Expense Category"}
        isBack
      />
      <form
        className="grid grid-cols-1 gap-[2rem] mt-[1rem] form-container"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label={translate("Expense Category Title")}
          placeholder="Enter expense category title"
          className="w-full md:w-1/2"
          {...register("title")}
          error={errors.title?.message}
        />
        <TextArea
          label={translate("Expense Category Description")}
          placeholder="Enter expense category description"
          className="w-full md:w-1/2"
          {...register("description")}
          error={errors.description?.message}
        />
        <div className="flex justify-start">
          <Button
            type="submit"
            className="submit-button w-[5rem]"
            disabled={isSubmitting || creating || updating}
          >
            <div className="flex justify-center items-center gap-[0.5rem] text-white">
              {translate(isEdit ? "Update" : "Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
};

export default AddExpenseCategory;
