// admin/src/pages/PurchaseCategory/AddEditPurchaseCategory.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import { PURCHASE_CATEGORY_LIST_ROUTE } from "@/routes/routeNames";
import useTranslation from "@/locale/useTranslation";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { PURCHASE_CATEGORY_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";

const PurchaseCategorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
type PurchaseCategoryFormType = z.infer<typeof PurchaseCategorySchema>;

const AddPurchaseCategory: React.FC = () => {
  const translate = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
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

  const { data: categoryResp } = useGetApiQuery(
    { url: `${PURCHASE_CATEGORY_URL}${id}` },
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

  const onSubmit = async (data: PurchaseCategoryFormType) => {
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
        onSuccess: () => navigate(PURCHASE_CATEGORY_LIST_ROUTE),
      });
    } catch (error: any) {
      handleError({ error });
    }
  };

  return (
    <>
      <PageTitle
        title={isEdit ? "Edit Purchase Category" : "Add Purchase Category"}
        isBack
      />
      <form
        className="grid grid-cols-1 gap-[2rem] mt-[1rem] form-container"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label={translate("Purchase Category Title")}
          placeholder="Enter purchase category title"
          className="w-full md:w-1/2"
          {...register("title")}
          error={errors.title?.message}
          isRequired
        />
        <TextArea
          label={translate("Purchase Category Description")}
          placeholder="Enter purchase category description"
          className="w-full md:w-1/2"
          {...register("description")}
          error={errors.description?.message}
        />
        <div className="flex justify-end">
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

export default AddPurchaseCategory;
