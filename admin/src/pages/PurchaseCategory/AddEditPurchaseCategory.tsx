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
import { Tags } from "lucide-react";

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

  const saving = isSubmitting || creating || updating;

  return (
    <div className="flex min-w-0 w-full flex-col gap-5 pb-6">
      <PageTitle
        title={isEdit ? "Edit Purchase Category" : "Add Purchase Category"}
        isBack
      />

      <form className="min-w-0 w-full" onSubmit={handleSubmit(onSubmit)}>
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
              <Tags size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-800">
                Category details
              </h2>
              <p className="text-xs text-slate-500">
                Title and optional description for this purchase category
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 sm:gap-5 sm:p-5">
            <Input
              label={translate("Purchase Category Title")}
              placeholder="Enter purchase category title"
              className="w-full"
              {...register("title")}
              error={errors.title?.message}
              isRequired
            />
            <TextArea
              label={translate("Purchase Category Description")}
              placeholder="Enter purchase category description"
              className="w-full"
              {...register("description")}
              error={errors.description?.message}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-5">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <Button
              type="submit"
              className="submit-button inline-flex h-10 w-full items-center justify-center rounded-lg px-5 text-sm font-medium sm:w-auto"
              disabled={saving}
              isLoading={saving}
            >
              {translate(isEdit ? "Update" : "Submit")}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default AddPurchaseCategory;
