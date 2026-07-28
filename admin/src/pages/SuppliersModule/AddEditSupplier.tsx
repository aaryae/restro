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
  Building2,
  IdCard,
  MapPin,
  Phone,
  UserRound,
  Mail,
} from "lucide-react";

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

export default function AddEditSupplier({
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const controlKeys = new Set([
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End",
  ]);

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
    // Convert empty strings to null for nullable fields
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

  return (
    <>
      {!isComponent && (
        <PageTitle
          title={isEditMode ? "Edit Supplier" : "Add Supplier"}
          isBack
        />
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="text-blue-600" />
              <div className="flex flex-col items-start">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? "Supplier Details" : "New Supplier"}
                </h3>
                <p className="text-sm text-gray-500">
                  Please provide accurate supplier information for billing and
                  records.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex gap-3 pl-10">
                <UserRound className="w-4 h-4" /> Name of Entity
              </label>
              <div className="absolute left-3 top-10 text-gray-400"></div>
              <Input
                placeholder="Acme Supplies Pvt. Ltd."
                className="w-full pl-9"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>

            <div className="relative md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex gap-3 pl-10">
                <IdCard className="w-4 h-4" /> Contact Person
              </label>
              <div className="absolute left-3 top-10 text-gray-400"></div>
              <Input
                placeholder="Contact person name"
                className="w-full pl-9"
                {...register("contact_person")}
                error={errors.contact_person?.message}
                {...register("contact_person")}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex gap-3 pl-10">
                <Phone className="w-4 h-4" /> Contact Number
              </label>
              <div className="absolute left-3 top-10 text-gray-400"></div>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={20}
                placeholder="9800000000"
                className="w-full pl-9"
                {...register("contact_number", {
                  setValueAs: (value) =>
                    typeof value === "string" ? value.replace(/\D/g, "") : value,
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "");
                  },
                })}
                onKeyDown={(e) => {
                  if (controlKeys.has(e.key) || e.ctrlKey || e.metaKey) return;
                  if (!/^\d$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (!/^\d*$/.test(pasted)) {
                    e.preventDefault();
                  }
                }}
                error={errors.contact_number?.message}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex gap-3 pl-10">
                <IdCard className="w-4 h-4" /> PAN/VAT Number
              </label>
              <div className="absolute left-3 top-10 text-gray-400"></div>
              <Input
                placeholder="Enter PAN/VAT number"
                className="w-full pl-9"
                {...register("pan_vat_number")}
                error={errors.pan_vat_number?.message}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex gap-3 pl-10">
                <IdCard className="w-4 h-4" /> Supplier Code
              </label>
              <div className="absolute left-3 top-10 text-gray-400"></div>
              <Input
                placeholder="ASP001"
                className="w-full pl-9"
                {...register("supplier_code")}
                error={errors.supplier_code?.message}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex gap-3 pl-10">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <div className="absolute left-3 top-10 text-gray-400"></div>
              <Input
                type="email"
                placeholder="supplier@example.com"
                className="w-full pl-9"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>

            <div className="relative md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex gap-3 pl-10">
                <MapPin className="w-4 h-4" /> Address
              </label>
              <div className="absolute left-3 top-10 text-gray-400"></div>
              <Input
                placeholder="Street, City, State"
                className="w-full pl-9"
                {...register("address")}
                error={errors.address?.message}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => (isComponent ? closeModal() : navigate(-1))}
              className="px-6 py-4 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4"
              disabled={isSubmitting || creatingSupplier || updatingSupplier}
            >
              <div className="flex justify-center items-center gap-2">
                {(isSubmitting || creatingSupplier || updatingSupplier) && (
                  <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                )}
                {translate(isEditMode ? "Update" : "Submit")}
              </div>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
