import Input from "@/components/Input";
import PageTitle from "@/components/PageTitle";
import { IMAGE_BASE_URL } from "@/constants";
import { useGetProductCategoryByIdQuery } from "@/redux/services/productCategory";
import { useEffect } from "react";

export default function ListCategoryDetails({ id }: { id: number | null }) {
  const { data: productCategory } = useGetProductCategoryByIdQuery(id, {
    skip: id == null,
  });

  return (
    <>
      <PageTitle title="Product Category Detail" />
      <div className="mt-[1rem] space-y-[1rem]">
        <Input
          label="Product Category"
          className="w-1/2"
          placeholder="Select Product Category"
          value={productCategory?.data?.name}
          disabled
        />
        <Input
          label="Product Category Slug"
          className="w-1/2"
          placeholder="Select Product Category"
          value={productCategory?.data?.slug}
          disabled
        />
        <div className="text-start">
          <label className="input-label"> Category Image</label>
          <div className="border border-dashed w-[25rem] h-[10rem]">
            <img
              src={`${IMAGE_BASE_URL}${productCategory?.data?.imageUrl}`}
              className="object-contain p-[1rem] w-full h-full"
              alt="Product Category Image"
              // crossOrigin="anonymous"
            />
          </div>
        </div>
      </div>
    </>
  );
}
