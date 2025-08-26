import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import { FLOOR_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { RiSeoLine } from "react-icons/ri";

export default function ViewFloor({ id }: { id: number | null }) {
  const {
    data: floorData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${FLOOR_URL}${id}` },
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
          <p className="font-[500] text-[15px]">Floor {id}</p>
        </p>
      </div>
      {loading ? (
        <>Loading </>
      ) : (
        <div className="flex gap-[1.5rem] mb-[2.5rem]">
          <form className="grid grid-cols-1 gap-[1.5rem] w-full">
            <Input
              label="Floor No"
              type="text"
              value={floorData?.data?.floorNo || ""}
              disabled
            />
            <Input
              label="Name"
              type="text"
              value={floorData?.data?.name || ""}
              disabled
            />
            <TextArea
              label="Description"
              value={floorData?.data?.description || ""}
              disabled
            />
            <Input
              label="Status"
              type="text"
              value={floorData?.data?.isActive ? "Active" : "Inactive"}
              disabled
            />
          </form>
        </div>
      )}
    </div>
  );
}
