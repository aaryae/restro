// admin/src/pages/PurchaseCategory/AddPurchaseCategory.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import { PURCHASE_CATEGORY_LIST_ROUTE } from "@/routes/routeNames";
import useTranslation from "@/locale/useTranslation";

// Define the form schema
const PurchaseCategorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type PurchaseCategoryFormType = z.infer<typeof PurchaseCategorySchema>;

const AddPurchaseCategory: React.FC = () => {
  const translate = useTranslation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseCategoryFormType>({
    resolver: zodResolver(PurchaseCategorySchema),
  });

  const onSubmit = (data: PurchaseCategoryFormType) => {
    console.log("Form submitted:", data);
    // TODO: Connect to API when ready
    navigate(PURCHASE_CATEGORY_LIST_ROUTE);
  };

  return (
    <>
      <PageTitle title="Add Purchase Category" isBack />
      <form
        className="grid grid-cols-1 gap-[2rem] mt-[1rem] form-container"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label={translate("Purchase Category Title")}
          placeholder="Enter purchase category title"
          className="w-1/2"
          {...register("title")}
          error={errors.title?.message}
        />
        <TextArea
          label={translate("Purchase Category Description")}
          placeholder="Enter purchase category description"
          className="w-1/2"
          {...register("description")}
          error={errors.description?.message}
        />
        <div className="flex justify-start">
          <Button type="submit" className="submit-button w-[5rem]">
            <div className="flex justify-center items-center gap-[0.5rem] text-white">
              {translate("Submit")}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
};

export default AddPurchaseCategory;
