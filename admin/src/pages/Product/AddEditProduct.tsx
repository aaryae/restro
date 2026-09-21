import { lazy, Suspense } from "react";
import Loader from "@/components/Loader";

const ProductForm = lazy(() => import("./ProductForm.tsx"));

export default function AddEditProduct() {
  return (
    <Suspense fallback={<Loader />}>
      <ProductForm />
    </Suspense>
  );
}
