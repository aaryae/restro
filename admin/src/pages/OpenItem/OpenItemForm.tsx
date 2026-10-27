import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Select from "@/components/Select";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import { Controller, useForm, useWatch } from "react-hook-form";
import { MultipleImageInputUI } from "@/components/ImageComponent";
import { OpenItemSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { OPEN_ITEM_LIST_ROUTE } from "@/routes/routeNames";
import { useNavigate, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import useImageHandler from "@/hooks/useImageHandler";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { OPEN_ITEM_URL, DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import { POS_LIST_LIMIT } from "@/constants/listLimits";
import { buildQueryString } from "@/utils/generalHelper";
import { Department } from "../../types/department";
import {
  Banknote,
  ChefHat,
  CircleDot,
  Hash,
  PackageOpen,
  Type,
} from "lucide-react";

const MediaComponent = lazy(() => import("@/components/MediaComponent"));

type OpenItemFormType = z.infer<typeof OpenItemSchema>;

type OpenItemFormProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

export default function OpenItemForm({
  id: idProp,
  isComponent = false,
  closeModal,
  onSuccess,
}: OpenItemFormProps = {}) {
  const { id: paramId } = useParams();
  const id =
    idProp !== undefined && idProp !== null ? String(idProp) : paramId;
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OpenItemFormType>({
    resolver: zodResolver(OpenItemSchema),
    defaultValues: {
      name: "",
      description: "",
      quantity: undefined as unknown as number,
      price: undefined as unknown as number,
      departmentId: undefined,
      stockStatus: "in_stock",
      stockItemId: "",
      stockQuantity: undefined as unknown as number | undefined,
      mediaArr: [],
    },
  });

  const {
    media,
    currentImageIndex,
    isImageModelOpen,
    setIsImageModalOpen,
    handleConfirmImage,
  } = useImageHandler(setValue, getValues, "mediaArr");

  const { data: openItem, isSuccess: success, isLoading } = useGetApiQuery(
    { url: `${OPEN_ITEM_URL}${id}` },
    { skip: !isEdit },
  );

  const [createOpenItem, { isLoading: creating }] = useCreateApiMutation();
  const [updateOpenItem, { isLoading: updating }] = useUpdateApiMutation();
  const [departments, setDepartments] = useState<
    { value: number; label: string }[]
  >([]);

  const { data: departmentsData } = useGetApiQuery({
    url: `${DEPARTMENT_URL}list?page=1&limit=${POS_LIST_LIMIT}`,
  });

  useEffect(() => {
    if (departmentsData?.data?.data) {
      const deptOptions = departmentsData.data.data.map(
        (department: Department) => ({
          value: department.id,
          label: department.name,
        }),
      );
      setDepartments(deptOptions);
    }
  }, [departmentsData]);

  useEffect(() => {
    if (isEdit && success && openItem?.data) {
      reset({
        name: openItem.data.name,
        description: openItem.data.description || "",
        quantity:
          openItem.data.quantity != null
            ? Number(openItem.data.quantity)
            : (undefined as unknown as number),
        price:
          openItem.data.price != null && openItem.data.price !== ""
            ? Number(openItem.data.price)
            : (undefined as unknown as number),
        departmentId: openItem.data.departmentId,
        stockStatus: openItem.data.stockStatus,
        stockItemId: openItem.data.stockItemId
          ? String(openItem.data.stockItemId)
          : "",
        stockQuantity:
          openItem.data.stockQuantity != null && openItem.data.stockQuantity !== ""
            ? Number(openItem.data.stockQuantity)
            : undefined,
        mediaArr:
          openItem.data.mediaArr?.map((each: any) => each.imageUrl) || [],
      });
    }
  }, [success, openItem, reset, isEdit]);

  const finish = () => {
    onSuccess?.();
    if (isComponent) closeModal?.();
    else navigate(OPEN_ITEM_LIST_ROUTE);
  };

  const onCancel = () => {
    if (isComponent) closeModal?.();
    else navigate(OPEN_ITEM_LIST_ROUTE);
  };

  const onSubmit = async (data: OpenItemFormType) => {
    const body = {
      ...data,
      quantity: Number(data.quantity),
      price: data.price !== undefined ? Number(data.price) : undefined,
      departmentId: Number(data.departmentId),
      stockItemId: data.stockItemId ? Number(data.stockItemId) : null,
      stockQuantity: data.stockItemId ? Number(data.stockQuantity) : null,
    };
    try {
      const response = isEdit
        ? await updateOpenItem({ url: `${OPEN_ITEM_URL}${id}`, body }).unwrap()
        : await createOpenItem({ url: `${OPEN_ITEM_URL}`, body }).unwrap();
      handleResponse({
        res: response,
        onSuccess: finish,
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  const { data: stockData } = useGetApiQuery({
    url: buildQueryString("stock-item/list", { page: 1, limit: 300 }),
  });
  const stockItems = (stockData?.data?.data || []) as {
    id: number;
    name: string;
    isNewStock?: boolean;
    measuringUnit?: { symbol?: string };
  }[];
  const stockItemId = useWatch({ control, name: "stockItemId" });
  const selectedStock = stockItems.find(
    (item) => String(item.id) === String(stockItemId || ""),
  );
  const stockSymbol = selectedStock?.measuringUnit?.symbol;

  const stockStatusOptions = [
    { value: "in_stock", label: "In Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
    { value: "low_stock", label: "Low Stock" },
  ];

  return (
    <EntityForm
      title={isEdit ? "Edit Open Item" : "Add Open Item"}
      sectionTitle="Open item details"
      description="One-off items you can add directly to orders."
      icon={PackageOpen}
      embedded={isComponent}
      columns={2}
      maxWidthClass="max-w-3xl"
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      isSaving={isSubmitting || creating || updating}
      isLoading={isEdit && isLoading && !openItem}
      submitLabel={isEdit ? "Update" : "Submit"}
    >
      <Input
        label="Name"
        placeholder="Enter open item name"
        leftSection={<FieldIcon icon={Type} />}
        {...register("name")}
        error={errors.name?.message}
        isRequired
      />
      <Input
        label="Quantity"
        type="number"
        placeholder="0"
        leftSection={<FieldIcon icon={Hash} />}
        {...register("quantity", {
          setValueAs: (v) =>
            v === "" || v === null || v === undefined ? undefined : Number(v),
        })}
        error={errors.quantity?.message}
        isRequired
      />
      <Controller
        name="departmentId"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Department"
            options={departments}
            leftSection={<FieldIcon icon={ChefHat} />}
            error={errors.departmentId?.message}
            isRequired
          />
        )}
      />
      <Input
        label="Price"
        type="number"
        step={0.01}
        placeholder="0"
        leftSection={<FieldIcon icon={Banknote} />}
        {...register("price", {
          setValueAs: (v) =>
            v === "" || v === null || v === undefined ? undefined : Number(v),
        })}
        error={errors.price?.message}
      />
      <Controller
        name="stockStatus"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Stock Status"
            options={stockStatusOptions}
            leftSection={<FieldIcon icon={CircleDot} />}
            error={errors.stockStatus?.message}
          />
        )}
      />
      <TextArea
        label="Description"
        placeholder="Optional notes about this open item"
        className="md:col-span-2"
        rows={isComponent ? 2 : 3}
        {...register("description")}
        error={errors.description?.message}
      />
      <div className="md:col-span-2 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-4">
        <p className="mb-1 text-sm font-medium text-[var(--serve-fg)]">
          Inventory used when this is sold
        </p>
        <p className="mb-3 text-[11px] leading-snug text-[var(--serve-muted)]">
          Optional. One sale uses this much of one stock item, counted in that
          item&apos;s base unit. Leave it blank if this open item does not use
          kitchen stock. Quantity above is still how many of this open item
          you can sell.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller
            name="stockItemId"
            control={control}
            render={({ field }) => (
              <Select
                label="Stock item"
                options={stockItems.map((item) => ({
                  label: item.isNewStock
                    ? `${item.name} (New stock)`
                    : item.name,
                  value: String(item.id),
                }))}
                value={field.value || ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (!value) setValue("stockQuantity", undefined);
                }}
                placeholder="No inventory"
                clearable
                clearLabel="No inventory"
                error={errors.stockItemId?.message}
              />
            )}
          />
          <Input
            label={stockSymbol ? `Amount per sale (${stockSymbol})` : "Amount per sale"}
            type="number"
            step="0.01"
            placeholder="0"
            leftSection={<FieldIcon icon={Hash} />}
            {...register("stockQuantity", {
              setValueAs: (v) =>
                v === "" || v === null || v === undefined ? undefined : Number(v),
            })}
            error={errors.stockQuantity?.message}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col md:col-span-2">
        <span className="mb-1.5 text-xs font-medium text-[var(--serve-muted)]">
          Images
        </span>
        <Suspense
          fallback={
            <div className="h-40 w-full animate-pulse rounded-[10px] bg-[var(--serve-surface-2)]" />
          }
        >
          <MediaComponent
            title={
              <MultipleImageInputUI
                images={media}
                imageIndex={currentImageIndex}
                imageMessage="Allowed JPG, GIF or PNG. You can select multiple."
              />
            }
            isMultiSelect={true}
            handleConfirmImage={() => handleConfirmImage("mediaArr")}
            open={isImageModelOpen}
            setOpen={setIsImageModalOpen}
          />
        </Suspense>
      </div>
    </EntityForm>
  );
}
