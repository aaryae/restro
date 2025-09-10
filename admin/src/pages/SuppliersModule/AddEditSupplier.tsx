
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
        className={`grid grid-cols-1 gap-[2rem] mt-[1rem] ${
          isComponent ? "" : " form-container"
        }`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex max-lg:flex-col gap-4">
          <Input
            label="Name of Entity"
            placeholder="Enter name of entity"
            className="w-full"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            label="Supplier Code"
            placeholder="Enter supplier code (e.g., ABC123)"
            className="w-full"
            {...register("supplier_code")}
            error={errors.supplier_code?.message}
          />
        </div>
        <div className="flex max-lg:flex-col gap-4">
          <Input
            label="Address"
            placeholder="Enter address"
            className="w-full"
            {...register("address")}
            error={errors.address?.message}
          />
          <Input
            label="Contact Number"
            placeholder="Enter contact number"
            className="w-full"
            {...register("contact_number")}
            error={errors.contact_number?.message}
          />
        </div>
        <div className="flex max-lg:flex-col gap-4">
          <Input
            label="Email Address"
            placeholder="Enter email address"
            type="email"
            className="w-full"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="PAN/VAT Number"
            placeholder="Enter PAN/VAT number"
            className="w-full"
            {...register("pan_vat_number")}
            error={errors.pan_vat_number?.message}
          />
          <Input
            label="Contact Person"
            placeholder="Enter contact person name"
            className="w-full"
            {...register("contact_person")}
            error={errors.contact_person?.message}
          />
        </div>

        <div className="flex justify-start">
          <Button
            type="submit"
            className="submit-button w-[5rem]"
            disabled={isSubmitting || creatingSupplier || updatingSupplier}
          >
            <div className="flex justify-center items-center gap-[0.5rem] text-white ">
              {translate("Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}
