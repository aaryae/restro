/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { z } from "zod";
import Input from "@/components/Input";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import { useForm } from "react-hook-form";
import { SupplierSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { SUPPLIER_LIST_ROUTE } from "@/routes/routeNames";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { convertEmptyStringsToNull } from "@/utils/validationHelper";
import {
  useCreateSupplierMutation,
  useGetSupplierByIdQuery,
  useUpdateSupplierByIdMutation,
} from "@/redux/services/supplier";
import { SUPPLIER_URL } from "@/constants/apiUrlConstants";
import {
  Building2,
  Hash,
  Mail,
  MapPin,
  Phone,
  UserRound,
  IdCard,
} from "lucide-react";

type SupplierFormType = z.infer<typeof SupplierSchema>;

interface Props {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: (created?: any) => void;
  onSuccess?: () => void;
  /** Prefill name when opening create form from another flow (e.g. bulk import). */
  defaultName?: string;
}

const controlKeys = new Set([
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Home",
  "End",
]);

export default function AddEditSupplier({
  id: idProp,
  isComponent = false,
  closeModal = () => {},
  onSuccess,
  defaultName = "",
}: Props) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  // Embedded create flows sit on other routes — never use parent :id as supplier id.
  const id =
    isComponent
      ? idProp !== undefined && idProp !== null
        ? String(idProp)
        : undefined
      : idProp !== undefined && idProp !== null
        ? String(idProp)
        : routeId;
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormType>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      name: defaultName || "",
    },
  });

  const [createSupplier, { isLoading: creatingSupplier }] =
    useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updatingSupplier }] =
    useUpdateSupplierByIdMutation();
  const saving = isSubmitting || creatingSupplier || updatingSupplier;

  const { data: supplierData, isLoading: loadingRecord } =
    useGetSupplierByIdQuery(id!, {
      skip: !isEditMode,
    });

  const finish = (created?: any) => {
    onSuccess?.();
    if (isComponent) closeModal(created);
    else navigate(SUPPLIER_LIST_ROUTE);
  };

  const onCancel = () => {
    if (isComponent) closeModal();
    else navigate(SUPPLIER_LIST_ROUTE);
  };

  const onSubmit = async (data: SupplierFormType) => {
    const body = convertEmptyStringsToNull(data, [
      "address",
      "email",
      "pan_vat_number",
      "contact_person",
    ]);

    try {
      const response = isEditMode
        ? await updateSupplier({
            url: `${SUPPLIER_URL}update/${id}`,
            body,
          }).unwrap()
        : await createSupplier({
            url: `${SUPPLIER_URL}create`,
            body,
          }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg: response?.message,
        },
        onSuccess: () => finish(response?.data),
      });
    } catch (error: any) {
      handleError({ error, setError });
    }
  };

  useEffect(() => {
    if (isEditMode && supplierData && supplierData?.data) {
      reset({
        name: supplierData?.data.name || "",
        supplier_code: supplierData?.data.supplier_code || "",
        address: supplierData?.data.address || null,
        contact_number: supplierData?.data.contact_number || null,
        email: supplierData?.data.email || null,
        pan_vat_number: supplierData?.data.pan_vat_number || null,
        contact_person: supplierData?.data.contact_person || null,
      });
      return;
    }
    if (!isEditMode && defaultName) {
      reset({ name: defaultName });
    }
  }, [supplierData, isEditMode, reset, defaultName]);

  const phoneRegister = register("contact_number", {
    setValueAs: (value) =>
      typeof value === "string" ? value.replace(/\D/g, "") : value,
    onChange: (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    },
  });

  const phoneFieldProps = {
    ...phoneRegister,
    type: "tel" as const,
    inputMode: "numeric" as const,
    maxLength: 20,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (controlKeys.has(e.key) || e.ctrlKey || e.metaKey) return;
      if (!/^\d$/.test(e.key)) e.preventDefault();
    },
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text");
      if (!/^\d*$/.test(pasted)) e.preventDefault();
    },
    error: errors.contact_number?.message,
  };

  return (
    <EntityForm
      title={isEditMode ? "Edit Supplier" : "Add Supplier"}
      sectionTitle="Supplier details"
      description="Vendor contact and tax details for purchases."
      icon={Building2}
      embedded={isComponent}
      columns={2}
      maxWidthClass="max-w-3xl"
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      isSaving={saving}
      isLoading={isEditMode && loadingRecord && !supplierData}
      submitLabel={isEditMode ? "Update" : "Submit"}
    >
      <Input
        label="Name of Entity"
        placeholder="Supplier name"
        leftSection={<FieldIcon icon={Building2} />}
        {...register("name")}
        error={errors.name?.message}
        isRequired
      />
      <Input
        label="Contact Person"
        placeholder="Contact person"
        leftSection={<FieldIcon icon={UserRound} />}
        {...register("contact_person")}
        error={errors.contact_person?.message}
      />
      <Input
        label="Contact Number"
        placeholder="9800000000"
        leftSection={<FieldIcon icon={Phone} />}
        {...phoneFieldProps}
      />
      <Input
        label="PAN / VAT Number"
        placeholder="PAN/VAT"
        leftSection={<FieldIcon icon={IdCard} />}
        {...register("pan_vat_number")}
        error={errors.pan_vat_number?.message}
      />
      <Input
        label="Supplier Code"
        placeholder="ASP001"
        leftSection={<FieldIcon icon={Hash} />}
        {...register("supplier_code")}
        error={errors.supplier_code?.message}
      />
      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        leftSection={<FieldIcon icon={Mail} />}
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Address"
        placeholder="Street, city"
        className="md:col-span-2"
        leftSection={<FieldIcon icon={MapPin} />}
        {...register("address")}
        error={errors.address?.message}
      />
    </EntityForm>
  );
}
