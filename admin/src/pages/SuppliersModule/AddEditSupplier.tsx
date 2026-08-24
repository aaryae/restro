/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";

import { z } from "zod";
import Input from "@/components/Input";

import Button from "@/components/Button";
import { useForm } from "react-hook-form";
import { SupplierSchema } from "./schema";

import PageTitle from "@/components/PageTitle";
import useTranslation from "@/locale/useTranslation";
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

type SupplierFormType = z.infer<typeof SupplierSchema>;

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
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
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormType>({
    resolver: zodResolver(SupplierSchema),
  });

  const [createSupplier, { isLoading: creatingSupplier }] =
    useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updatingSupplier }] =
    useUpdateSupplierByIdMutation();
  const saving = isSubmitting || creatingSupplier || updatingSupplier;

  const { data: supplierData } = useGetSupplierByIdQuery(id!, {
    skip: !isEditMode,
  });

  const handleSuccess = () => {
    if (isComponent) {
      closeModal();
    } else {
      navigate(SUPPLIER_LIST_ROUTE);
    }
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
        onSuccess: handleSuccess,
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
    }
  }, [supplierData, isEditMode, reset]);

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
    maxLength: 10,
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

  const fields = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input
        label="Name of Entity"
        placeholder="Supplier name"
        className="w-full"
        {...register("name")}
        error={errors.name?.message}
      />
      <Input
        label="Contact Person"
        placeholder="Contact person"
        className="w-full"
        {...register("contact_person")}
        error={errors.contact_person?.message}
      />
      <Input
        label="Contact Number"
        placeholder="9800000000"
        className="w-full"
        {...phoneFieldProps}
      />
      <Input
        label="PAN/VAT Number"
        placeholder="PAN/VAT"
        className="w-full"
        {...register("pan_vat_number")}
        error={errors.pan_vat_number?.message}
      />
      <Input
        label="Supplier Code"
        placeholder="ASP001"
        className="w-full"
        {...register("supplier_code")}
        error={errors.supplier_code?.message}
      />
      <Input
        label="Email"
        type="email"
        placeholder="Email"
        className="w-full"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Address"
        placeholder="Street, city"
        className="w-full sm:col-span-2"
        {...register("address")}
        error={errors.address?.message}
      />
    </div>
  );

  if (isComponent) {
    return (
      <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        {fields}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primaryColor px-4 text-sm font-medium text-white hover:bg-primaryColor/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : isEditMode ? "Update" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <PageTitle
        title={isEditMode ? "Edit Supplier" : "Add Supplier"}
        isBack
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        {fields}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <Button
            type="submit"
            className="submit-button inline-flex h-10 items-center rounded-lg px-5 text-sm font-medium"
            disabled={saving}
          >
            {translate(isEditMode ? "Update" : "Submit")}
          </Button>
        </div>
      </form>
    </>
  );
}
