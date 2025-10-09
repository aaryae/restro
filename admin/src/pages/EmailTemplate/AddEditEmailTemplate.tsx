import useTranslation from "@/locale/useTranslation";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateEmailTemplateMutation,
  useGetEmailTemplateByIdQuery,
  useUpdateEmailTemplateByIdMutation,
} from "@/redux/services/emailTemplate";
import { EmailTemplateSchema } from "./schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { EMAIL_TEMPLATE_LIST_ROUTE } from "@/routes/routeNames";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import Select from "@/components/Select";
import { EMAIL_TEMPLATE_OPTIONS } from "@/constants/StaticDropdownConstants";
import PageTitle from "@/components/PageTitle";

type EmailTemplateFormType = z.infer<typeof EmailTemplateSchema>;

export default function AddEditEmailTemplate() {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailTemplateFormType>({
    defaultValues: {
      templateKey: "",
    },
    resolver: zodResolver(EmailTemplateSchema),
  });

  const templateKeys: string = useWatch({ name: "templateKey", control });
  const selectedTemplate = EMAIL_TEMPLATE_OPTIONS.find(
    (template) => template.value === templateKeys,
  );

  const [selectedVariables, setSelectedVariables] = useState([]);

  const { data: emailTemplate, isSuccess: success } =
    useGetEmailTemplateByIdQuery(id, { skip: id === null || id === undefined });
  const [createEmailTemplate] = useCreateEmailTemplateMutation();
  const [updateEmailTemplate] = useUpdateEmailTemplateByIdMutation();

  useEffect(() => {
    if (success) {
      setSelectedVariables(emailTemplate.data.variables);
      reset({
        ...emailTemplate?.data,
        variables: emailTemplate.data.variables?.toString() || "",
      });
    }
  }, [emailTemplate, success]);
  const handleVariableClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    value: string,
  ) => {
    event.preventDefault();

    setSelectedVariables((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const onSubmit = async (data: any) => {
    const body = { ...data, variables: selectedVariables };

    try {
      const response = id
        ? await updateEmailTemplate({ body, id }).unwrap()
        : await createEmailTemplate(body).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => navigate(EMAIL_TEMPLATE_LIST_ROUTE),
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <>
      <PageTitle title="Email Template" isBack />
      {!id || success ? (
        <form
          className="w-1/2 space-y-[1rem] form-container"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Input
            label="Template Name"
            isRequired
            {...register("templateName")}
            error={errors?.templateName?.message}
          />
          <Controller
            name="templateKey"
            control={control}
            render={({ field }) => (
              <div className="md:w-[30%]">
                <Select
                  {...field}
                  options={EMAIL_TEMPLATE_OPTIONS}
                  label="Template Key"
                />
                {errors.templateKey && (
                  <p className="text-red-500 text-sm">
                    {errors.templateKey.message}
                  </p>
                )}
              </div>
            )}
          />
          <div className="text-start">
            <p className="font-medium text-[1rem] text-primaryColor">
              {selectedTemplate?.desc}
            </p>
          </div>
          <div className="text-start">
            <label>Variables</label>
            <div className="flex flex-wrap gap-[0.5rem]">
              {selectedTemplate?.email_variables?.map((each) => (
                <button
                  key={each}
                  className={`border py-[0.5rem] rounded-[0.25rem] w-fit px-[1rem] ${
                    selectedVariables.includes(each)
                      ? "bg-primaryColor text-white"
                      : ""
                  }`}
                  onClick={(event) => handleVariableClick(event, each)}
                >
                  {each}
                </button>
              ))}
            </div>
            {errors.variables && (
              <p className="text-red-500 text-sm">{errors.variables.message}</p>
            )}
          </div>
          <Input
            label="Subject"
            isRequired
            {...register("subject")}
            error={errors?.subject?.message}
          />

          {(!id || success) && (
            <div className="w-full">
              <label className="flex text-sm font-medium text-gray-700 mb-1">
                Body <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("body")}
                className={`w-full p-2 border rounded-md min-h-[200px] bg-white ${
                  errors.body ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter email body..."
              />
              {errors.body && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.body.message}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" className="submit-button w-[5rem]">
              {" "}
              <div className="flex justify-center items-center gap-[0.5rem] text-white ">
                {translate("Submit")}
              </div>
            </Button>
          </div>
        </form>
      ) : (
        <div className="w-full flex items-center justify-center h-[50%]">
          <Loader />
        </div>
      )}
    </>
  );
}
