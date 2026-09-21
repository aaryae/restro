import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
  useResourceForm,
} from "@/components/EntityForm";
import { FLOOR_URL } from "@/constants/apiUrlConstants";
import { FLOOR_LIST_ROUTE } from "@/routes/routeNames";
import { AlignLeft, Hash, Layers, Type } from "lucide-react";
import { z } from "zod";
import { FloorSchema } from "./schema";

type FloorFormType = z.infer<typeof FloorSchema>;

type AddEditFloorProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

export default function AddEditFloor({
  id,
  isComponent = false,
  closeModal,
  onSuccess,
}: AddEditFloorProps = {}) {
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
  } = useResourceForm<FloorFormType>({
    schema: FloorSchema,
    resourceUrl: FLOOR_URL,
    listRoute: FLOOR_LIST_ROUTE,
    resourceId: id,
    onSuccess: isComponent ? finish : undefined,
    onCancel: isComponent ? closeModal : undefined,
  });

  return (
    <EntityForm
      title={isEditMode ? "Edit Floor" : "Add Floor"}
      sectionTitle="Floor details"
      description="Number and name shown on the floor plan."
      icon={Layers}
      embedded={isComponent}
      columns={isComponent ? 1 : 2}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSaving={isSaving}
      isLoading={isLoading}
      submitLabel={isEditMode ? "Update" : "Submit"}
    >
      <Input
        label="Floor No"
        placeholder="e.g. 1, G, B1"
        leftSection={<FieldIcon icon={Hash} />}
        {...register("floorNo")}
        error={errors.floorNo?.message}
        isRequired
      />
      <Input
        label="Name"
        placeholder="e.g. Ground Floor, Rooftop"
        leftSection={<FieldIcon icon={Type} />}
        {...register("name")}
        error={errors.name?.message}
        isRequired
      />
      <TextArea
        label="Description"
        placeholder="Optional notes about this floor"
        className={isComponent ? undefined : "md:col-span-2"}
        rows={isComponent ? 2 : 4}
        leftSection={<FieldIcon icon={AlignLeft} />}
        {...register("description")}
        error={errors.description?.message}
      />
    </EntityForm>
  );
}
