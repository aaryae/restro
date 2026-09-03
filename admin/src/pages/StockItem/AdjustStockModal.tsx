import React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import { useCreateApiMutation } from "@/redux/services/crudApi";
import { STOCK_ITEM_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";

const AdjustSchema = z.object({
  type: z.enum(["purchase", "adjustment_in", "adjustment_out", "waste"]),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  rate: z.coerce.number().min(0).optional(),
  note: z.string().optional(),
});

type AdjustFormType = z.infer<typeof AdjustSchema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemId: number | null;
  itemName?: string;
  defaultRate?: number;
};

const typeOptions = [
  { label: "Purchase / Restock", value: "purchase" },
  { label: "Adjustment In", value: "adjustment_in" },
  { label: "Adjustment Out", value: "adjustment_out" },
  { label: "Waste", value: "waste" },
];

const AdjustStockModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  itemId,
  itemName,
  defaultRate = 0,
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustFormType>({
    resolver: zodResolver(AdjustSchema),
    defaultValues: {
      type: "adjustment_in",
      quantity: 0,
      rate: defaultRate,
      note: "",
    },
  });

  const [createApi, { isLoading }] = useCreateApiMutation();

  React.useEffect(() => {
    if (!isOpen) return;
    reset({
      type: "adjustment_in",
      quantity: 0,
      rate: defaultRate,
      note: "",
    });
  }, [isOpen, defaultRate, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: AdjustFormType) => {
    if (!itemId) return;
    try {
      const response = await createApi({
        url: `${STOCK_ITEM_URL}${itemId}/adjust`,
        body: {
          type: data.type,
          quantity: Number(data.quantity),
          rate: data.rate === undefined ? undefined : Number(data.rate),
          note: data.note || undefined,
        },
      }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg: response?.message || "Stock adjusted successfully.",
        },
        onSuccess: () => {
          handleClose();
          onSuccess();
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  const saving = isSubmitting || isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={itemName ? `Adjust Stock — ${itemName}` : "Adjust Stock"}
      size="medium"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              label="Adjustment Type"
              options={typeOptions}
              value={field.value}
              onValueChange={field.onChange}
              isRequired
              error={errors.type?.message}
            />
          )}
        />
        <Input
          label="Quantity"
          type="number"
          step="0.01"
          {...register("quantity")}
          error={errors.quantity?.message}
          isRequired
        />
        <Input
          label="Rate (Rs)"
          type="number"
          step="0.01"
          {...register("rate")}
          error={errors.rate?.message}
        />
        <TextArea
          label="Note"
          placeholder="Optional note"
          {...register("note")}
          error={errors.note?.message}
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
            Save Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdjustStockModal;
