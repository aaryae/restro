import Input from "@/components/Input";
import { CustomerSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { z } from "zod";
import useTranslation from "@/locale/useTranslation";
import { CUSTOMER_LIST_ROUTE } from "@/routes/routeNames";

import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { CUSTOMER_URL } from "@/constants/apiUrlConstants";
import PageTitle from "@/components/PageTitle";
import { useEffect, type ClipboardEvent, type KeyboardEvent } from "react";

type CustomerFormType = z.infer<typeof CustomerSchema>;

export type CreatedCustomer = {
  id: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
};

interface Props {
  isComponent?: boolean;
  editId?: number | null;
  closeModal?: () => void;
  onCreated?: (customer: CreatedCustomer) => void;
}

export default function AddEditCustomer({
  isComponent = false,
  editId = null,
  closeModal = () => {},
  onCreated,
}: Props) {
  const translate = useTranslation();
  const { id: routeId } = useParams();
  const resolvedId = isComponent ? editId : routeId;
  const navigate = useNavigate();
  const isEditMode = resolvedId != null && resolvedId !== "";

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormType>({
    resolver: zodResolver(CustomerSchema),
  });

  const [createUser, { isLoading: creatingUser }] = useCreateApiMutation();
  const [updateUser, { isLoading: updatingUser }] = useUpdateApiMutation();
  const saving = isSubmitting || creatingUser || updatingUser;

  const { data: customerData } = useGetApiQuery(
    { url: `${CUSTOMER_URL}${resolvedId}` },
    {
      skip: !isEditMode,
    },
  );

  const handleSuccess = (created?: CreatedCustomer) => {
    if (isComponent) {
      if (created) onCreated?.(created);
      closeModal();
    } else {
      navigate(CUSTOMER_LIST_ROUTE);
    }
  };

  const onSubmit = async (data: CustomerFormType) => {
    const body = { ...data };

    try {
      const response = isEditMode
        ? await updateUser({
            url: `${CUSTOMER_URL}${resolvedId}`,
            body,
          }).unwrap()
        : await createUser({
            url: `${CUSTOMER_URL}create`,
            body,
          }).unwrap();

      handleResponse({
        res: response,
        onSuccess: () => {
          const created = response?.data as CreatedCustomer | undefined;
          handleSuccess(
            created?.id != null
              ? {
                  id: created.id,
                  firstName: created.firstName ?? data.firstName,
                  lastName: created.lastName ?? data.lastName,
                  email: created.email ?? data.email,
                  mobileNo: created.mobileNo ?? data.mobileNo,
                }
              : undefined,
          );
        },
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  useEffect(() => {
    if (isEditMode && customerData && customerData?.data) {
      reset({
        firstName: customerData?.data.firstName,
        lastName: customerData?.data.lastName,
        email: customerData?.data.email,
        mobileNo: customerData?.data.mobileNo,
      });
    }
  }, [customerData, isEditMode, reset]);

  const mobileRegister = register("mobileNo", {
    setValueAs: (value) =>
      value == null ? "" : String(value).replace(/\D/g, ""),
  });

  const mobileFieldProps = {
    ...mobileRegister,
    type: "tel" as const,
    inputMode: "numeric" as const,
    maxLength: 15,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ];
      if (
        allowedKeys.includes(e.key) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    },
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text").replace(/\D/g, "");
      const target = e.currentTarget;
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      const next = `${target.value.slice(0, start)}${text}${target.value.slice(end)}`.slice(
        0,
        15,
      );
      target.value = next;
      target.dispatchEvent(new Event("input", { bubbles: true }));
    },
    error: errors.mobileNo?.message,
    isRequired: true,
  };

  if (isComponent) {
    return (
      <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            placeholder="First name"
            className="w-full"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            placeholder="Last name"
            className="w-full"
            {...register("lastName")}
            error={errors.lastName?.message}
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
            label="Mobile Number"
            placeholder="Mobile number"
            className="w-full"
            {...mobileFieldProps}
          />
        </div>
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <PageTitle
        title={isEditMode ? "Edit Customer" : "Add Customer"}
        isBack
      />
      <form
        className="form-container mt-[1rem] grid grid-cols-1 gap-[2rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex gap-4 max-lg:flex-col">
          <Input
            label="First Name"
            placeholder="Enter First Name"
            className="w-full"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            placeholder="Enter Last Name"
            className="w-full"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>
        <div className="flex gap-4 max-lg:flex-col">
          <Input
            label="Email"
            type="email"
            placeholder="Enter Email"
            className="w-full"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Mobile Number"
            placeholder="Enter Mobile Number"
            className="w-full"
            {...mobileFieldProps}
          />
        </div>

        <div className="flex justify-start">
          <Button
            type="submit"
            className="submit-button w-[5rem]"
            disabled={saving}
          >
            <div className="flex items-center justify-center gap-[0.5rem] text-white">
              {translate("Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}
