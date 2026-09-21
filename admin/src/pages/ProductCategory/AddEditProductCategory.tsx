import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import { ProductCategorySchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { z } from "zod";
import { PRODUCT_CATEGORY_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect } from "react";
import {
  useCreateProductCategoryMutation,
  useGetProductCategoryByIdQuery,
  useUpdateProductCategoryByIdMutation,
} from "@/redux/services/productCategory";
import { AlignLeft, FolderTree, Type } from "lucide-react";

type ProductCategoryFormType = z.infer<typeof ProductCategorySchema>;

interface Props {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
}

export default function AddEditProductCategory({
  id: idProp,
  isComponent = false,
  closeModal = () => {},
  onSuccess,
}: Props) {
  const { id: paramId } = useParams();
  const id =
    idProp !== undefined && idProp !== null ? String(idProp) : paramId;
  const isEdit = Boolean(id);
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

  const { data: productCategory, isSuccess: success, isLoading } =
    useGetProductCategoryByIdQuery(id, {
      skip: !isEdit,
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

  const finish = () => {
    onSuccess?.();
    if (isComponent) closeModal();
    else navigate(PRODUCT_CATEGORY_LIST_ROUTE);
  };

  const onCancel = () => {
    if (isComponent) closeModal();
    else navigate(PRODUCT_CATEGORY_LIST_ROUTE);
  };

  const onSubmit = async (data: ProductCategoryFormType) => {
    const body = {
      name: data.name,
      description: data.description || undefined,
    };

    try {
      const response = isEdit
        ? await updateCategory({ body, id }).unwrap()
        : await createCategory(body).unwrap();
      handleResponse({
        res: response,
        onSuccess: finish,
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <EntityForm
      title={isEdit ? "Edit Item Category" : "Add Item Category"}
      sectionTitle="Category details"
      description="Name and optional description for this menu category."
      icon={FolderTree}
      embedded={isComponent}
      columns={1}
      maxWidthClass="max-w-2xl"
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      isSaving={isSubmitting || creating || updating}
      isLoading={isEdit && isLoading && !productCategory}
      submitLabel={isEdit ? "Update" : "Submit"}
    >
      <Input
        label="Name"
        placeholder="e.g. Hot drinks, Desserts"
        leftSection={<FieldIcon icon={Type} />}
        {...register("name")}
        error={errors.name?.message}
        isRequired
      />
      <TextArea
        label="Description"
        placeholder="Optional short description for this category"
        rows={isComponent ? 3 : 4}
        leftSection={<FieldIcon icon={AlignLeft} />}
        {...register("description")}
        error={errors.description?.message}
      />
    </EntityForm>
  );
}
