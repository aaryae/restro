import React, { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import Select from "@/components/Select";
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
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { AlignLeft, Hash, Ruler, Type } from "lucide-react";

const MeasuringUnitSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    symbol: z.string().min(1, "Symbol is required"),
    description: z.string().max(500).optional(),
    equalsUnitId: z.string().optional(),
    equalsCount: z.union([z.string(), z.number()]).optional(),
    equalsFactor: z.union([z.string(), z.number()]).optional(),
  })
  .superRefine((value, ctx) => {
    const hasUnit = Boolean(value.equalsUnitId);
    const rightRaw = value.equalsFactor;
    const leftRaw = value.equalsCount;
    const right = Number(rightRaw);
    const left = Number(leftRaw);
    const hasRight = rightRaw !== "" && rightRaw != null && right > 0;
    const hasLeft = leftRaw !== "" && leftRaw != null && left > 0;
    if (hasUnit && !hasLeft) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["equalsCount"],
        message: "Enter how many of this unit",
      });
    }
    if (hasUnit && !hasRight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["equalsFactor"],
        message: "Enter how many of the other unit",
      });
    }
    if (!hasUnit && hasRight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["equalsUnitId"],
        message: "Choose the unit on the right",
      });
    }
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<MeasuringUnitFormType>({
    resolver: zodResolver(MeasuringUnitSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      equalsUnitId: "",
      equalsCount: "1",
      equalsFactor: "",
    },
  });
  const equalsUnitId = useWatch({ control, name: "equalsUnitId" });
  const equalsCount = useWatch({ control, name: "equalsCount" });
  const equalsFactor = useWatch({ control, name: "equalsFactor" });
  const symbol = useWatch({ control, name: "symbol" });

  const [createApi, { isLoading: creating }] = useCreateApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const { data: unitResp, isLoading } = useGetApiQuery(
    { url: `${MEASURING_UNIT_URL}${id}` },
    { skip: !isEdit },
  );
  const { data: unitList } = useGetApiQuery({
    url: buildQueryString("measuring-unit/list", { page: 1, limit: 300 }),
  });

  const otherUnits = useMemo(() => {
    const rows = (unitList?.data?.data ?? []) as {
      id: number;
      name: string;
      symbol: string;
    }[];
    return rows
      .filter((row) => String(row.id) !== String(id || ""))
      .map((row) => ({
        label: `${row.name} (${row.symbol})`,
        value: String(row.id),
      }));
  }, [unitList, id]);

  const relatedLabel = otherUnits.find(
    (option) => option.value === String(equalsUnitId || ""),
  )?.label;

  useEffect(() => {
    if (!isEdit) {
      reset({
        name: "",
        symbol: "",
        description: "",
        equalsUnitId: "",
        equalsCount: "1",
        equalsFactor: "",
      });
      return;
    }
    const row = unitResp?.data as
      | {
          name?: string;
          symbol?: string;
          description?: string;
          equalsUnitId?: number | null;
          equalsCount?: number | string | null;
          equalsFactor?: number | string | null;
        }
      | undefined;
    if (!row) return;
    reset({
      name: row.name || "",
      symbol: row.symbol || "",
      description: row.description || "",
      equalsUnitId: row.equalsUnitId ? String(row.equalsUnitId) : "",
      equalsCount:
        row.equalsCount == null || row.equalsCount === ""
          ? "1"
          : String(Number(row.equalsCount)),
      equalsFactor:
        row.equalsFactor == null || row.equalsFactor === ""
          ? ""
          : String(Number(row.equalsFactor)),
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
    const body = {
      name: data.name,
      symbol: data.symbol,
      description: data.description || "",
      equalsUnitId: data.equalsUnitId ? Number(data.equalsUnitId) : null,
      equalsCount: data.equalsUnitId ? Number(data.equalsCount) : null,
      equalsFactor: data.equalsUnitId ? Number(data.equalsFactor) : null,
    };
    try {
      const response = isEdit
        ? await updateApi({
            url: `${MEASURING_UNIT_URL}${id}`,
            body,
          }).unwrap()
        : await createApi({ url: MEASURING_UNIT_URL, body }).unwrap();

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
      description="Name, symbol, and an optional relation such as 1 pt = 12 dz."
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
      <div className="md:col-span-2 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-3">
        <p className="mb-2 text-xs font-medium text-slate-700">
          Relation to another unit
        </p>
        <p className="mb-3 text-[11px] leading-snug text-[var(--serve-muted)]">
          Optional. Type an amount on each side. For 1 peti = 12 dozen, put 1
          on the left and 12 on the right, then choose Dozen. Pack sizes that
          change by product, such as 1 packet = 20 pieces, stay on the stock
          item.
        </p>
        <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[96px_auto_auto_96px_minmax(0,1fr)]">
          <Input
            label="Left"
            type="number"
            min={0}
            step="0.01"
            placeholder="1"
            {...register("equalsCount")}
            error={errors.equalsCount?.message}
          />
          <p className="pb-2 text-sm font-medium text-slate-700">
            {symbol?.trim() || "unit"}
          </p>
          <p className="pb-2 text-sm text-slate-500">=</p>
          <Input
            label="Right"
            type="number"
            min={0}
            step="0.01"
            placeholder="12"
            {...register("equalsFactor")}
            error={errors.equalsFactor?.message}
          />
          <Controller
            name="equalsUnitId"
            control={control}
            render={({ field }) => (
              <Select
                label="Right unit"
                options={otherUnits}
                value={field.value || ""}
                onValueChange={field.onChange}
                placeholder="No relation"
                clearable
                clearLabel="No relation"
                error={errors.equalsUnitId?.message}
              />
            )}
          />
        </div>
        {equalsUnitId &&
        Number(equalsCount) > 0 &&
        Number(equalsFactor) > 0 &&
        relatedLabel ? (
          <p className="mt-2 text-xs text-slate-600">
            {Number(equalsCount)} {symbol?.trim() || "unit"} ={" "}
            {Number(equalsFactor)} {relatedLabel}
          </p>
        ) : null}
      </div>
    </EntityForm>
  );
};

export default MeasuringUnitModal;
