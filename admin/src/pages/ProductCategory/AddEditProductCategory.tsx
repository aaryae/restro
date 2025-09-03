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
    formState: { errors },
  } = useForm<ProductCategoryFormType>({
    resolver: zodResolver(ProductCategorySchema),
  });

  const { data: productCategory, isSuccess: success } =
    useGetProductCategoryByIdQuery(id, {
      skip: id === null || id === undefined,
    });

  const [createDepartment] = useCreateProductCategoryMutation();
  const [updateDepartment] = useUpdateProductCategoryByIdMutation();

  useEffect(() => {
    reset(productCategory?.data);
  }, [success]);

  const handleSuccess = () => {
    if (isComponent) {
      closeModal();
    } else {
      navigate(PRODUCT_CATEGORY_LIST_ROUTE);
    }
  };

  const onSubmit = async (data: any) => {
    const body = { ...data };

    try {
      const response = id
        ? await updateDepartment({ body, id }).unwrap()
        : await createDepartment(body).unwrap();
      handleResponse({
        res: response,
        onSuccess: handleSuccess,
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <>
      {!isComponent && <PageTitle title="Add Product Category" />}
      <form
        className={`grid grid-cols-1 gap-[2rem] mt-[1rem] ${
          isComponent ? "" : " form-container"
        }`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Name"
          placeholder="Enter Product Category"
          className="w-1/2"
          {...register("name")}
          error={errors.name?.message}
        />
        <TextArea
          label="Description"
          className="w-1/2"
          {...register("description")}
          error={errors.description?.message}
        />
        <div className="flex justify-start">
          <Button type="submit" className="submit-button w-[5rem]">
            {" "}
            <div className="flex justify-center items-center gap-[0.5rem] text-white ">
              {translate("Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}
