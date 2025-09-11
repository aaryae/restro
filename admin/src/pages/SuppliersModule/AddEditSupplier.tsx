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
import { SUPPLIER_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { Building2, IdCard, MapPin, Phone, UserRound } from "lucide-react";

import {
  useCreateSupplierMutation,
  useGetSupplierByIdQuery,
  useUpdateSupplierByIdMutation,
} from "@/redux/services/supplier";

type SupplierFormType = z.infer<typeof SupplierSchema>;

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
}

export default function AddEditCustomer({
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
    formState: { errors, isSubmitting, isValid },
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

  console.log("data", errors, isValid);

  const onSubmit = async (data: SupplierFormType) => {
    const body = { ...data };

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
        name: supplierData?.data.name,
        supplier_code: supplierData?.data.supplier_code,
        address: supplierData?.data.address,
        contact_number: supplierData?.data.contact_number,
        email: supplierData?.data.email,
        pan_vat_number: supplierData?.data.pan_vat_number,
        contact_person: supplierData?.data.contact_person,
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-5xl mx-auto mt-4"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of Entity
              </label>
              <div className="absolute left-3 top-10 text-gray-400">
                <UserRound className="w-4 h-4" />
              </div>
              <Input
                placeholder="Acme Supplies Pvt. Ltd."
                className="w-full pl-9"
                {...register("name")}
                error={errors.name?.message}
                required
              />
            </div>

            <div className="relative md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Point of Contact
              </label>
              <div className="absolute left-3 top-10 text-gray-400">
                <IdCard className="w-4 h-4" />
              </div>
              <Input
                placeholder="Contact person name"
                className="w-full pl-9"
                {...register("point_of_contact")}
                error={errors.point_of_contact?.message}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <div className="absolute left-3 top-10 text-gray-400">
                <Phone className="w-4 h-4" />
              </div>
              <Input
                placeholder="9800000000"
                className="w-full pl-9"
                {...register("contact_number")}
                error={errors.contact_number?.message}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number
              </label>
              <div className="absolute left-3 top-10 text-gray-400">
                <IdCard className="w-4 h-4" />
              </div>
              <Input
                placeholder="Enter PAN number"
                className="w-full pl-9"
                {...register("pan_number")}
                error={errors.pan_number?.message}
              />
            </div>

            <div className="relative md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="absolute left-3 top-10 text-gray-400">
                <MapPin className="w-4 h-4" />
              </div>
              <Input
                placeholder="Street, City, State"
                className="w-full pl-9"
                {...register("address")}
                error={errors.address?.message}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => (isComponent ? closeModal() : navigate(-1))}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6"
              disabled={isSubmitting || creatingSupplier || updatingSupplier}
            >
              <div className="flex justify-center items-center gap-2">
                {(isSubmitting || creatingSupplier || updatingSupplier) && (
                  <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                )}
                {translate(isEditMode ? "Update" : "Submit")}
              </div>
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
