import Input from "@/components/Input";
import { FloorSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { z } from "zod";
import useTranslation from "@/locale/useTranslation";
import { FLOOR_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect } from "react";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { FLOOR_URL } from "@/constants/apiUrlConstants";
import PageTitle from "@/components/PageTitle";
import TextArea from "@/components/TextArea";

type FloorFormType = z.infer<typeof FloorSchema>;

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
}

export default function AddEditFloor({
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
  } = useForm<FloorFormType>({
    resolver: zodResolver(FloorSchema),
  });

  const [createFloor, { isLoading: creatingFloor }] = useCreateApiMutation();
  const [updateFloor, { isLoading: updatingFloor }] = useUpdateApiMutation();

  const {
    data: floorData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${FLOOR_URL}${id}` },
    {
      skip: !isEditMode,
    },
  );

  useEffect(() => {
    if (isEditMode && floorData && floorData?.data) {
      reset(floorData?.data);
    }
  }, [floorData]);

  const handleSuccess = () => {
    if (isComponent) {
      closeModal();
    } else {
      navigate(FLOOR_LIST_ROUTE);
    }
  };

  const onSubmit = async (data: FloorFormType) => {
    const body = { ...data };

    try {
      const response = isEditMode
        ? await updateFloor({
            url: `${FLOOR_URL}${id}`,
            body,
          }).unwrap()
        : await createFloor({
            url: `${FLOOR_URL}`,
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
        <PageTitle title={isEditMode ? "Edit Floor" : "Add Floor"} isBack />
      )}
      <form
        className={`grid grid-cols-1 gap-[2rem] mt-[1rem] ${
          isComponent ? "" : " form-container"
        }`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Floor No"
          placeholder="Enter Floor Number"
          className="w-full md:w-1/2"
          {...register("floorNo")}
          error={errors.floorNo?.message}
          isRequired
        />

        <Input
          label="Name"
          placeholder="Enter Floor Name"
          className="w-full md:w-1/2"
          {...register("name")}
          error={errors.name?.message}
          isRequired
        />

        <TextArea
          label="Description"
          placeholder="Enter Floor Description"
          className="w-full md:w-1/2"
          {...register("description")}
          error={errors.description?.message}
        />

        <div className="flex justify-start">
          <Button
            type="submit"
            className="submit-button w-[5rem]"
            disabled={isSubmitting || creatingFloor || updatingFloor}
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
