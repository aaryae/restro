import Input from "@/components/Input";
import { TableSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { z } from "zod";
import useTranslation from "@/locale/useTranslation";
import { TABLE_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect, useMemo } from "react";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { TABLE_URL, FLOOR_URL } from "@/constants/apiUrlConstants";
import PageTitle from "@/components/PageTitle";
import Select from "@/components/Select";

type TableFormType = z.infer<typeof TableSchema>;

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
}

export default function AddEditTable({
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TableFormType>({
    resolver: zodResolver(TableSchema),
  });

  const [createTable, { isLoading: creatingTable }] = useCreateApiMutation();
  const [updateTable, { isLoading: updatingTable }] = useUpdateApiMutation();

  const {
    data: tableData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${TABLE_URL}${id}` },
    {
      skip: !isEditMode,
    },
  );

  const { data: floorData } = useGetApiQuery({ url: `${FLOOR_URL}list` });

  useEffect(() => {
    if (isEditMode && tableData && tableData?.data) {
      reset(tableData?.data);
    }
  }, [tableData, isEditMode, reset]);

  const floorOptions = useMemo(() => {
    if (!floorData?.data) return [];
    console.log(floorData);
    return floorData?.data?.data.map(
      (item: { id: number; name: string; floorNo: string }) => ({
        value: item.id,
        label: `${item.floorNo} - ${item.name}`,
      }),
    );
  }, [floorData]);

  const typeOptions = [
    { value: "regular", label: "Regular" },
    { value: "vip", label: "VIP" },
  ];

  const statusOptions = [
    { value: "available", label: "Available" },
    // { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const handleSuccess = () => {
    if (isComponent) {
      closeModal();
    } else {
      navigate(TABLE_LIST_ROUTE);
    }
  };

  const onSubmit = async (data: TableFormType) => {
    const body = { ...data };

    try {
      const response = isEditMode
        ? await updateTable({
            url: `${TABLE_URL}${id}`,
            body,
          }).unwrap()
        : await createTable({
            url: `${TABLE_URL}`,
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
        <PageTitle title={isEditMode ? "Edit Table" : "Add Table"} isBack />
      )}
      <form
        className={`grid grid-cols-1 gap-[2rem] mt-[1rem] ${
          isComponent ? "" : " form-container"
        }`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Table No"
          placeholder="Enter Table Number"
          className="w-full md:w-1/2"
          {...register("tableNo")}
          error={errors.tableNo?.message}
        />

        <Controller
          name="floorId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Floor"
              options={floorOptions}
              className="w-full md:w-1/2"
              error={errors.floorId?.message}
              required
            />
          )}
        />

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Table Type"
              options={typeOptions}
              className="w-full md:w-1/2"
              error={errors.type?.message}
              required
            />
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Table Status"
              options={statusOptions}
              className="w-full md:w-1/2"
              error={errors.status?.message}
              required
            />
          )}
        />

        <Input
          label="Capacity"
          type="number"
          placeholder="Enter Table Capacity"
          className="w-full md:w-1/2"
          {...register("capacity", { valueAsNumber: true })}
          error={errors.capacity?.message}
        />

        <div className="flex justify-start">
          <Button
            type="submit"
            className="submit-button w-[5rem]"
            disabled={isSubmitting || creatingTable || updatingTable}
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
