import Input from "@/components/Input";
import { CustomerSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { z } from "zod";
import useTranslation from "@/locale/useTranslation";
import { CUSTOMER_LIST_ROUTE, TABLE_LIST_ROUTE } from "@/routes/routeNames";

import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { FLOOR_URL, CUSTOMER_URL } from "@/constants/apiUrlConstants";
import PageTitle from "@/components/PageTitle";
import { useEffect } from "react";
import { isValid } from "date-fns";

type CustomerFormType = z.infer<typeof CustomerSchema>;

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
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CustomerFormType>({
    resolver: zodResolver(CustomerSchema),
  });

  const [createUser, { isLoading: creatingUser }] = useCreateApiMutation();
  const [updateUser, { isLoading: updatingUser }] = useUpdateApiMutation();

  const {
    data: customerData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${CUSTOMER_URL}${id}` },
    {
      skip: !isEditMode,
    },
  );

  const handleSuccess = () => {
    if (isComponent) {
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
            url: `${CUSTOMER_URL}${id}`,
            body,
          }).unwrap()
        : await createUser({
            url: `${CUSTOMER_URL}create`,
            body,
          }).unwrap();

      handleResponse({
        res: response,
        onSuccess: handleSuccess,
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

  return (
    <>
      {!isComponent && (
        <PageTitle
          title={isEditMode ? "Edit Customer" : "Add Customer"}
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
            label="First Name"
            placeholder="Enter First Name"
            className="w-full"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            placeholder="Enter First Name"
            className="w-full"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>
        <div className="flex max-lg:flex-col gap-4">
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
            type="tel"
            inputMode="numeric"
            placeholder="Enter Mobile Number"
            className="w-full"
            maxLength={15}
            {...register("mobileNo", {
              setValueAs: (value) =>
                value == null ? "" : String(value).replace(/\D/g, ""),
            })}
            onKeyDown={(e) => {
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
            }}
            onPaste={(e) => {
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
            }}
            error={errors.mobileNo?.message}
            isRequired
          />
        </div>

        <div className="flex justify-start">
          <Button
            type="submit"
            className="submit-button w-[5rem]"
            disabled={isSubmitting || creatingUser || updatingUser}
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
