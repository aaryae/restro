import Input from "@/components/Input";
import Select from "@/components/Select";
import {
  EntityForm,
  FieldIcon,
  useResourceForm,
} from "@/components/EntityForm";
import { FLOOR_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { TABLE_LIST_ROUTE } from "@/routes/routeNames";
import {
  CircleDot,
  Hash,
  Layers,
  SquareStack,
  Tag,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { z } from "zod";
import { TableSchema } from "./schema";

type TableFormType = z.infer<typeof TableSchema>;

const TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "vip", label: "VIP" },
];

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "maintenance", label: "Maintenance" },
];

type AddEditTableProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

export default function AddEditTable({
  id,
  isComponent = false,
  closeModal,
  onSuccess,
}: AddEditTableProps = {}) {
  const finish = () => {
    onSuccess?.();
    closeModal?.();
  };

  const {
    register,
    control,
    errors,
    isEditMode,
    isSaving,
    isLoading,
    onSubmit,
    onCancel,
  } = useResourceForm<TableFormType>({
    schema: TableSchema,
    resourceUrl: TABLE_URL,
    listRoute: TABLE_LIST_ROUTE,
    resourceId: id,
    onSuccess: isComponent ? finish : undefined,
    onCancel: isComponent ? closeModal : undefined,
  });

  const { data: floorData } = useGetApiQuery({ url: `${FLOOR_URL}list` });

  const floorOptions = useMemo(() => {
    const floors = floorData?.data?.data;
    if (!Array.isArray(floors)) return [];
    return floors.map(
      (item: { id: number; name: string; floorNo: string }) => ({
        value: item.id,
        label: `${item.floorNo} - ${item.name}`,
      }),
    );
  }, [floorData]);

  return (
    <EntityForm
      title={isEditMode ? "Edit Table" : "Add Table"}
      sectionTitle="Table details"
      description="Place the table on a floor and set how many guests it seats."
      icon={SquareStack}
      embedded={isComponent}
      columns={isComponent ? 2 : 2}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSaving={isSaving}
      isLoading={isLoading}
      submitLabel={isEditMode ? "Update" : "Submit"}
    >
      <Input
        label="Table No"
        placeholder="e.g. T-12, A1"
        leftSection={<FieldIcon icon={Hash} />}
        {...register("tableNo")}
        error={errors.tableNo?.message}
        isRequired
      />
      <Controller
        name="floorId"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Floor"
            options={floorOptions}
            leftSection={<FieldIcon icon={Layers} />}
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
            options={TYPE_OPTIONS}
            leftSection={<FieldIcon icon={Tag} />}
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
            options={STATUS_OPTIONS}
            leftSection={<FieldIcon icon={CircleDot} />}
            error={errors.status?.message}
            required
          />
        )}
      />
      <Input
        label="Capacity"
        type="number"
        placeholder="Number of seats"
        leftSection={<FieldIcon icon={Users} />}
        {...register("capacity", { valueAsNumber: true })}
        error={errors.capacity?.message}
        isRequired
      />
    </EntityForm>
  );
}
