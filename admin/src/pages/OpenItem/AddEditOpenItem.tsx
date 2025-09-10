import PageTitle from "@/components/PageTitle/index.tsx";

import OpenItemForm from "./OpenItemForm.tsx";
import { useParams } from "react-router-dom";

export default function AddEditOpenItem() {
  const { id } = useParams();

  return (
    <>
      <PageTitle
        title={id ? "Edit Open Item " : "Add Open Item"}
        isBack={true}
      />
      <OpenItemForm />
    </>
  );
}
