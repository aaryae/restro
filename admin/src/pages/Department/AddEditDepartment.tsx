import Input from "@/components/Input";
import { DepartmentSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { z } from "zod";
import useTranslation from "@/locale/useTranslation";
import { DEPARTMENT_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect } from "react";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import PageTitle from "@/components/PageTitle";
import TextArea from "@/components/TextArea";

type DepartmentFormType = z.infer<typeof DepartmentSchema>;

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
}

export default function AddEditDepartment({
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormType>({
    resolver: zodResolver(DepartmentSchema),
  });

  const [createDepartment, { isLoading: creatingDepartment }] =
    useCreateApiMutation();
  const [updateDepartment, { isLoading: updatingDepartment }] =
    useUpdateApiMutation();

  const {
    data: departmentData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${DEPARTMENT_URL}${id}` },
    {
      skip: !isEditMode,
    },
  );

  useEffect(() => {
    if (isEditMode && departmentData && departmentData?.data) {
      reset(departmentData?.data);
    }
  }, [departmentData, isEditMode, reset]);

  const handleSuccess = () => {
    if (isComponent) {
      closeModal();
    } else {
      navigate(DEPARTMENT_LIST_ROUTE);
    }
  };

  const onSubmit = async (data: DepartmentFormType) => {
    const body = { ...data };

    try {
      const response = isEditMode
        ? await updateDepartment({
            url: `${DEPARTMENT_URL}${id}`,
            body,
          }).unwrap()
        : await createDepartment({
            url: `${DEPARTMENT_URL}`,
            body,
          }).unwrap();

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
      {!isComponent && (
        <PageTitle
          title={isEditMode ? "Edit Department" : "Add Department"}
          isBack
        />
      )}
      <form
        className={`grid grid-cols-1 gap-[2rem] mt-[1rem] ${
          isComponent ? "" : " form-container"
        }`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Name"
          placeholder="Enter Department Name"
          className="w-full md:w-1/2"
          {...register("name")}
          error={errors.name?.message}
        />

        <TextArea
          label="Description"
          placeholder="Enter Department Description"
          className="w-full md:w-1/2"
          {...register("description")}
          error={errors.description?.message}
        />

        <Input
          label="Average Preparation Time (minutes)"
          type="number"
          placeholder="Enter preparation time"
          className="w-full md:w-1/2"
          {...register("AvgPreparationTime", { valueAsNumber: true })}
          error={errors.AvgPreparationTime?.message}
        />

        <Input
          label="Display Order"
          type="number"
          placeholder="Enter display order"
          className="w-full md:w-1/2"
          {...register("displayOrder", { valueAsNumber: true })}
          error={errors.displayOrder?.message}
        />

        <Input
          type="color"
          label="Color (Hex Code)"
          placeholder="#FF5722"
          className="w-[40%] md:w-[15%]"
          {...register("color")}
          error={errors.color?.message}
        />

        <div className="flex justify-start">
          <Button
            type="submit"
            className="submit-button w-[5rem]"
            disabled={isSubmitting || creatingDepartment || updatingDepartment}
          >
            <div className="flex justify-center items-center gap-[0.5rem] text-white ">
              {translate("Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}
