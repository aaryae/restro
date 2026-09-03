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
import { STOCK_GROUP_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";

const StockGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
type StockGroupFormType = z.infer<typeof StockGroupSchema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editId?: number | null;
};

const StockGroupModal: React.FC<Props> = ({
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
  } = useForm<StockGroupFormType>({
    resolver: zodResolver(StockGroupSchema),
    defaultValues: { name: "", description: "" },
  });

  const [createApi, { isLoading: creating }] = useCreateApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const { data: groupResp } = useGetApiQuery(
    { url: `${STOCK_GROUP_URL}${editId}` },
    { skip: !isOpen || !isEdit },
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!isEdit) {
      reset({ name: "", description: "" });
      return;
    }
    const row = groupResp?.data as any;
    if (!row) return;
    reset({
      name: row.name || "",
      description: row.description || "",
    });
  }, [isOpen, isEdit, groupResp, reset]);

  const handleClose = () => {
    reset({ name: "", description: "" });
    onClose();
  };

  const onSubmit = async (data: StockGroupFormType) => {
    const body = {
      name: data.name,
      description: data.description || undefined,
    };
    try {
      const response = isEdit
        ? await updateApi({
            url: `${STOCK_GROUP_URL}${editId}`,
            body,
          }).unwrap()
        : await createApi({ url: STOCK_GROUP_URL, body }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg:
            response?.message ||
            (isEdit
              ? "Stock group updated successfully."
              : "Stock group created successfully."),
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
      title={isEdit ? "Edit Stock Group" : "Add Stock Group"}
      size="medium"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
        <Input
          label="Name"
          placeholder="Enter stock group name"
          {...register("name")}
          error={errors.name?.message}
          isRequired
        />
        <TextArea
          label="Description"
          placeholder="Optional description"
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

export default StockGroupModal;
