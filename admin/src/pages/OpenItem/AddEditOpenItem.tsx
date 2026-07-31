import PageTitle from "@/components/PageTitle/index.tsx";
import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import Loader from "@/components/Loader";

const OpenItemForm = lazy(() => import("./OpenItemForm.tsx"));

export default function AddEditOpenItem() {
  const { id } = useParams();

  return (
    <>
      <PageTitle
        title={id ? "Edit Open Item " : "Add Open Item"}
        isBack={true}
      />
      <Suspense fallback={<Loader />}>
        <OpenItemForm />
      </Suspense>
    </>
  );
}
