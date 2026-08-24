import Input from "@/components/Input";
import { ProductCategorySchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { z } from "zod";
import useTranslation from "@/locale/useTranslation";
import { PRODUCT_CATEGORY_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect } from "react";
import {
  useCreateProductCategoryMutation,
  useGetProductCategoryByIdQuery,
  useUpdateProductCategoryByIdMutation,
} from "@/redux/services/productCategory";
import PageTitle from "@/components/PageTitle";
import TextArea from "@/components/TextArea";

type ProductCategoryFormType = z.infer<typeof ProductCategorySchema>;

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
}

export default function AddEditProductCategory({
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductCategoryFormType>({
    resolver: zodResolver(ProductCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { data: productCategory, isSuccess: success } =
    useGetProductCategoryByIdQuery(id, {
      skip: id === null || id === undefined,
    });

  const [createCategory, { isLoading: creating }] =
    useCreateProductCategoryMutation();
  const [updateCategory, { isLoading: updating }] =
    useUpdateProductCategoryByIdMutation();

  useEffect(() => {
    if (success && productCategory?.data) {
      reset(productCategory.data);
    }
  }, [success, productCategory, reset]);

  const handleSuccess = () => {
    if (isComponent) {
      closeModal();
    } else {
      navigate(PRODUCT_CATEGORY_LIST_ROUTE);
    }
  };

  const onSubmit = async (data: ProductCategoryFormType) => {
    const body = {
      name: data.name,
      description: data.description || undefined,
    };

    try {
      const response = id
        ? await updateCategory({ body, id }).unwrap()
        : await createCategory(body).unwrap();
      handleResponse({
        res: response,
        onSuccess: handleSuccess,
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  const busy = isSubmitting || creating || updating;

  return (
    <>
      {!isComponent && (
        <PageTitle
          title={id ? "Edit Item Category" : "Add Item Category"}
          isBack={true}
        />
      )}
      <form
        className={
          isComponent
            ? "mt-5 space-y-4"
            : "form-container mt-[1rem] grid grid-cols-1 gap-[2rem]"
        }
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleSubmit(onSubmit)(e);
        }}
      >
        <Input
          label="Name"
          placeholder="e.g. Hot drinks, Desserts"
          className={isComponent ? "w-full" : "w-full md:w-1/2"}
          {...register("name")}
          error={errors.name?.message}
          isRequired
        />
        <TextArea
          label="Description"
          placeholder="Optional short description for this category"
          className={isComponent ? "w-full" : "w-full md:w-1/2"}
          rows={isComponent ? 4 : 10}
          {...register("description")}
          error={errors.description?.message}
        />
        <div
          className={
            isComponent
              ? "flex items-center justify-end gap-2 border-t border-slate-200/80 pt-4"
              : "flex justify-start"
          }
        >
          {isComponent && (
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              disabled={busy}
            >
              Cancel
            </button>
          )}
          <Button
            type="submit"
            className={
              isComponent
                ? "submit-button h-10 min-w-[7.5rem] px-5"
                : "submit-button w-[5rem]"
            }
            disabled={busy}
          >
            <div className="flex items-center justify-center gap-[0.5rem] text-white">
              {busy ? "Saving…" : translate("Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}
