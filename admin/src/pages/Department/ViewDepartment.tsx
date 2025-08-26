import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import { DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { RiSeoLine } from "react-icons/ri";

export default function ViewDepartment({ id }: { id: number | null }) {
  const {
    data: departmentData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${DEPARTMENT_URL}${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  return (
    <div>
      {/* Tab Section */}
      <div className="flex mt-[4rem] mb-[1.5rem]">
        <p className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white">
          <RiSeoLine />
          <p className="font-[500] text-[15px]">Department {id}</p>
        </p>
      </div>
      {loading ? (
        <>Loading </>
      ) : (
        <div className="flex gap-[1.5rem] mb-[2.5rem]">
          <form className="grid grid-cols-1 gap-[1.5rem] w-full">
            <Input
              label="Name"
              type="text"
              value={departmentData?.data?.name || ""}
              disabled
            />
            <TextArea
              label="Description"
              value={departmentData?.data?.description || ""}
              disabled
            />
            <Input
              label="Average Preparation Time (minutes)"
              type="number"
              value={departmentData?.data?.AvgPreparationTime ?? ""}
              disabled
            />
            <Input
              label="Display Order"
              type="number"
              value={departmentData?.data?.displayOrder ?? ""}
              disabled
            />
            <Input
              label="Color (Hex Code)"
              type="color"
              value={departmentData?.data?.color || "#000000"}
              disabled
            />
          </form>
        </div>
      )}
    </div>
  );
}
