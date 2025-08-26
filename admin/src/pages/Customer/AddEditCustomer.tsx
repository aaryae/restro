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

  console.log("data", errors, isValid);

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
      console.log(customerData?.data, "custoemr id data");
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
            placeholder="Enter Email"
            className="w-full"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Mobile Number"
            placeholder="Enter Mobile Number"
            className="w-full"
            {...register("mobileNo")}
            error={errors.mobileNo?.message}
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
