import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { MEASURING_UNIT_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";

const MeasuringUnitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  description: z.string().max(500).optional(),
});
type MeasuringUnitFormType = z.infer<typeof MeasuringUnitSchema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editId?: number | null;
};

const MeasuringUnitModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  editId = null,
}) => {
  const isEdit = Boolean(editId);

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

  const { data: unitResp } = useGetApiQuery(
    { url: `${MEASURING_UNIT_URL}${editId}` },
    { skip: !isOpen || !isEdit },
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!isEdit) {
      reset({ name: "", symbol: "", description: "" });
      return;
    }
    const row = unitResp?.data as any;
    if (!row) return;
    reset({
      name: row.name || "",
      symbol: row.symbol || "",
      description: row.description || "",
    });
  }, [isOpen, isEdit, unitResp, reset]);

  const handleClose = () => {
    reset({ name: "", symbol: "", description: "" });
    onClose();
  };

  const onSubmit = async (data: MeasuringUnitFormType) => {
    try {
      const response = isEdit
        ? await updateApi({
            url: `${MEASURING_UNIT_URL}${editId}`,
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
        onSuccess: () => {
          handleClose();
          onSuccess();
        },
      });
    } catch (error: any) {
      handleError({ error });
    }
  };

  const saving = isSubmitting || creating || updating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Measuring Unit" : "Add Measuring Unit"}
      size="medium"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            placeholder="Enter unit name"
            {...register("name")}
            error={errors.name?.message}
            isRequired
          />
          <Input
            label="Symbol"
            placeholder="e.g. ltr, kg, pcs"
            {...register("symbol")}
            error={errors.symbol?.message}
            isRequired
          />
        </div>
        <TextArea
          label="Description"
          placeholder="When to use this unit in the kitchen or store"
          rows={3}
          {...register("description")}
          error={errors.description?.message}
        />
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <Button
            type="submit"
            className="submit-button !h-10 !rounded-lg !px-5 !py-0 !text-sm !font-medium"
            disabled={saving}
            isLoading={saving}
          >
            {isEdit ? "Update" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MeasuringUnitModal;
