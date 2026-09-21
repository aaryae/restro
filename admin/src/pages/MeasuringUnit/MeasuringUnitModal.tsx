import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { MEASURING_UNIT_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { AlignLeft, Hash, Ruler, Type } from "lucide-react";

const MeasuringUnitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  description: z.string().max(500).optional(),
});
type MeasuringUnitFormType = z.infer<typeof MeasuringUnitSchema>;

type Props = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

const MeasuringUnitModal: React.FC<Props> = ({
  id: idProp,
  isComponent = true,
  closeModal,
  onSuccess,
}) => {
  const id =
    idProp !== undefined && idProp !== null ? String(idProp) : undefined;
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeasuringUnitFormType>({
    resolver: zodResolver(MeasuringUnitSchema),
    defaultValues: { name: "", symbol: "", description: "" },
  });

  const [createApi, { isLoading: creating }] = useCreateApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const { data: unitResp, isLoading } = useGetApiQuery(
    { url: `${MEASURING_UNIT_URL}${id}` },
    { skip: !isEdit },
  );

  useEffect(() => {
    if (!isEdit) {
      reset({ name: "", symbol: "", description: "" });
      return;
    }
    const row = unitResp?.data as
      | { name?: string; symbol?: string; description?: string }
      | undefined;
    if (!row) return;
    reset({
      name: row.name || "",
      symbol: row.symbol || "",
      description: row.description || "",
    });
  }, [isEdit, unitResp, reset]);

  const finish = () => {
    onSuccess?.();
    closeModal?.();
  };

  const onCancel = () => {
    closeModal?.();
  };

  const onSubmit = async (data: MeasuringUnitFormType) => {
    try {
      const response = isEdit
        ? await updateApi({
            url: `${MEASURING_UNIT_URL}${id}`,
            body: data,
          }).unwrap()
        : await createApi({ url: MEASURING_UNIT_URL, body: data }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg:
            response?.message ||
            (isEdit
              ? "Measuring unit updated successfully."
              : "Measuring unit created successfully."),
        },
        onSuccess: finish,
      });
    } catch (error: unknown) {
      handleError({ error });
    }
  };

  return (
    <EntityForm
      title={isEdit ? "Edit Measuring Unit" : "Add Measuring Unit"}
      sectionTitle="Unit details"
      description="Name, symbol, and optional notes for this unit."
      icon={Ruler}
      embedded={isComponent}
      columns={2}
      maxWidthClass="max-w-2xl"
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      isSaving={isSubmitting || creating || updating}
      isLoading={isEdit && isLoading && !unitResp}
      submitLabel={isEdit ? "Update" : "Save"}
    >
      <Input
        label="Name"
        placeholder="Enter unit name"
        leftSection={<FieldIcon icon={Type} />}
        {...register("name")}
        error={errors.name?.message}
        isRequired
      />
      <Input
        label="Symbol"
        placeholder="e.g. ltr, kg, pcs"
        leftSection={<FieldIcon icon={Hash} />}
        {...register("symbol")}
        error={errors.symbol?.message}
        isRequired
      />
      <TextArea
        label="Description"
        placeholder="When to use this unit in the kitchen or store"
        className="md:col-span-2"
        rows={3}
        leftSection={<FieldIcon icon={AlignLeft} />}
        {...register("description")}
        error={errors.description?.message}
      />
    </EntityForm>
  );
};

export default MeasuringUnitModal;
