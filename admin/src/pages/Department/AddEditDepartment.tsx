import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
  useResourceForm,
} from "@/components/EntityForm";
import { DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import { DEPARTMENT_LIST_ROUTE } from "@/routes/routeNames";
import { AlignLeft, ChefHat, Timer, Type } from "lucide-react";
import { z } from "zod";
import { DepartmentSchema } from "./schema";

type DepartmentFormType = z.infer<typeof DepartmentSchema>;

type AddEditDepartmentProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

export default function AddEditDepartment({
  id,
  isComponent = false,
  closeModal,
  onSuccess,
}: AddEditDepartmentProps = {}) {
  const finish = () => {
    onSuccess?.();
    closeModal?.();
  };

  const {
    register,
    errors,
    isEditMode,
    isSaving,
    isLoading,
    onSubmit,
    onCancel,
  } = useResourceForm<DepartmentFormType>({
    schema: DepartmentSchema,
    resourceUrl: DEPARTMENT_URL,
    listRoute: DEPARTMENT_LIST_ROUTE,
    resourceId: id,
    onSuccess: isComponent ? finish : undefined,
    onCancel: isComponent ? closeModal : undefined,
  });

  return (
    <EntityForm
      title={isEditMode ? "Edit Department" : "Add Department"}
      sectionTitle="Department details"
      description="Name the station and how long a typical order takes to prepare."
      icon={ChefHat}
      embedded={isComponent}
      columns={isComponent ? 1 : 2}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSaving={isSaving}
      isLoading={isLoading}
      submitLabel={isEditMode ? "Update" : "Submit"}
    >
      <Input
        label="Name"
        placeholder="e.g. Kitchen, Bar, Grill"
        leftSection={<FieldIcon icon={Type} />}
        {...register("name")}
        error={errors.name?.message}
        isRequired
      />
      <Input
        label="Average Preparation Time (minutes)"
        type="number"
        placeholder="e.g. 15"
        leftSection={<FieldIcon icon={Timer} />}
        {...register("AvgPreparationTime", { valueAsNumber: true })}
        error={errors.AvgPreparationTime?.message}
        isRequired
      />
      <TextArea
        label="Description"
        placeholder="Optional notes about this department"
        className={isComponent ? undefined : "md:col-span-2"}
        rows={isComponent ? 2 : 4}
        leftSection={<FieldIcon icon={AlignLeft} />}
        {...register("description")}
        error={errors.description?.message}
      />
    </EntityForm>
  );
}
