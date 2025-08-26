import Input from "@/components/Input";
import { TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { RiSeoLine } from "react-icons/ri";

export default function ViewTable({ id }: { id: number | null }) {
  const {
    data: tableData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${TABLE_URL}${id}` },
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
          <p className="font-[500] text-[15px]">Table {id}</p>
        </p>
      </div>
      {loading ? (
        <>Loading </>
      ) : (
        <div className="flex gap-[1.5rem] mb-[2.5rem]">
          <form className="grid grid-cols-1 gap-[1.5rem] w-full">
            <Input
              label="Table No"
              type="text"
              value={tableData?.data?.tableNo || ""}
              disabled
            />
            <Input
              label="Floor"
              type="text"
              value={
                tableData?.data?.floor
                  ? `${tableData.data.floor.floorNo} - ${tableData.data.floor.name}`
                  : ""
              }
              disabled
            />
            <Input
              label="Table Type"
              type="text"
              value={tableData?.data?.type || ""}
              disabled
            />
            <Input
              label="Capacity"
              type="number"
              value={tableData?.data?.capacity ?? ""}
              disabled
            />
            <Input
              label="Status"
              type="text"
              value={tableData?.data?.status || ""}
              disabled
            />
          </form>
        </div>
      )}
    </div>
  );
}
