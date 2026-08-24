import PageTitle from "@/components/PageTitle/index.tsx";
import { lazy, Suspense, useState } from "react";
import { useParams } from "react-router-dom";
import Loader from "@/components/Loader";

const ProductForm = lazy(() => import("./ProductForm.tsx"));
const ProductVariantForm = lazy(() => import("./ProductVariantForm.tsx"));

export default function AddEditProduct() {
  const { id } = useParams();
  const [tab, setTab] = useState<"product" | "variant">("product");

  return (
    <>
      <PageTitle title={id ? "Edit Item" : "Add Item"} isBack={true} />
      <Suspense fallback={<Loader />}>
        {tab === "product" ? <ProductForm /> : <ProductVariantForm />}
      </Suspense>
    </>
  );
}
