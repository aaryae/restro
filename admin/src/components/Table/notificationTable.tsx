import { TimeDifference } from "@/utils/timeDifference";
import { Check, X } from "lucide-react";
import Loader from "../Loader";
import useTranslation from "@/locale/useTranslation";

export default function NotificationTable({
  selectedId,
  tableData1,
  tableData2,
  handleButtonClick,
  hasSupervisor,
}) {
  const translate = useTranslation();
  return (
    <>
      {/* Table Header */}
      <div className="flex justify-between rounded-t-[0.75rem] border border-[var(--serve-border)] bg-[var(--serve-surface-2)] py-[1rem] pl-[1.25rem] pr-[5rem]">
        <div className="flex px-[0.7rem] gap-[0.5rem]">
          {/* <input type="checkbox" /> */}
          <p>Requests</p>
        </div>
        <div className="flex gap-[1rem]">
          <div className="flex items-center gap-[0.375rem]">
            {" "}
            <div className="w-[0.5rem] h-[0.5rem] bg-primaryColor rounded-full" />{" "}
            <p>Accepted</p>
          </div>
          <div className="flex items-center gap-[0.375rem]">
            {" "}
            <div className="w-[0.5rem] h-[0.5rem] bg-[#FF80C5] rounded-full" />{" "}
            <p>Pending</p>
          </div>
          <div className="flex items-center gap-[0.375rem]">
            {" "}
            <div className="w-[0.5rem] h-[0.5rem] bg-[#C6362A] rounded-full" />{" "}
            <p>Rejected</p>
          </div>
        </div>
      </div>
      {/* table data */}
      {hasSupervisor !== "" ? (
        hasSupervisor === null ? (
          <div className="text-start flex flex-col mt-[1rem] gap-[1rem]">
            {tableData1 &&
              tableData1.data &&
              tableData1.data.data &&
              tableData1.data.data.map((each) => (
                <div
                  key={each.id}
                  className={`flex items-center justify-between py-[0.5rem] px-[1rem] rounded-[0.75rem] ${
                    selectedId !== undefined && selectedId === each.id
                      ? "bg-[#F6F8FA]"
                      : "bg-white"
                  } `}
                >
                  <div className="flex items-center gap-[0.5rem]">
                    <div
                      className={`w-[0.5rem] h-[0.5rem] rounded-full ${
                        each.status === "Approved"
                          ? "bg-primaryColor"
                          : each.status === "Pending"
                            ? "bg-[#FF80C5]"
                            : "bg-[#c6362a]"
                      }`}
                    />
                    {/* <div>
                      <input type="checkbox" />
                    </div> */}
                    <div>
                      <p className="font-[500] text-[0.75rem] leading-[1.125rem] italic text-[#24292F] opacity-[0.6]">
                        Path: {`Admin > ${each.endpoint.toString().slice(1)}`}
                      </p>
                      <p className="leading-[1.25rem] text-[0.875rem]">
                        <span className="capitalize">
                          {each.user.username}{" "}
                        </span>{" "}
                        {translate("has requested for")} {each.requestedAction}{" "}
                        {translate("request in")}{" "}
                        {each.endpoint.toString().slice(1)}{" "}
                        {translate("Module.")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[1.25rem]">
                    <div>
                      <PendingButtons
                        id={each.id}
                        status={each.status}
                        handleButtonClick={handleButtonClick}
                      />
                    </div>
                    <div>{TimeDifference(each.updatedAt)}</div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-start flex flex-col mt-[1rem] gap-[1rem]">
            {tableData2 &&
              tableData2.data &&
              tableData2.data.data &&
              tableData2.data.data.map((each) => (
                <div
                  key={each.id}
                  className={`flex items-center justify-between py-[0.5rem] px-[1rem] rounded-[0.75rem] ${
                    selectedId !== undefined && selectedId === each.id
                      ? "bg-[#F6F8FA]"
                      : "bg-white"
                  } `}
                >
                  <div className="flex items-center gap-[0.5rem]">
                    <div
                      className={`w-[0.5rem] h-[0.5rem] rounded-full ${
                        each.status === "Approved"
                          ? "bg-primaryColor"
                          : each.status === "Pending"
                            ? "bg-[#FF80C5]"
                            : "bg-[#c6362a]"
                      }`}
                    />
                    {/* <div>
                      <input type="checkbox" />
                    </div> */}
                    <div>
                      <p className="font-[500] text-[0.75rem] leading-[1.125rem] italic text-[#24292F] opacity-[0.6]">
                        Path: {`Admin > ${each.endpoint.toString().slice(1)}`}
                      </p>
                      <p className="leading-[1.25rem] text-[0.875rem]">
                        <span className="capitalize">
                          {each.user.username}{" "}
                        </span>{" "}
                        has requested for {each.requestedAction} request in{" "}
                        {each.endpoint.toString().slice(1)} Module.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[1.25rem]">
                    <div>
                      <button className="flex px-[0.75rem] py-[0.5rem] gap-[0.925rem] rounded-[0.5rem] border border-black  ">
                        <span className="capitalize">{each.status}</span>
                      </button>
                    </div>
                    <div>{TimeDifference(each.updatedAt)}</div>
                  </div>
                </div>
              ))}
          </div>
        )
      ) : (
        <div>
          <Loader />
        </div>
      )}
    </>
  );
}

function PendingButtons({ id, status, handleButtonClick }) {
  if (status.toLowerCase() === "pending") {
    return (
      <div className="flex gap-[1.5rem] text-white items-center">
        <button
          className="flex px-[0.75rem] py-[0.5rem] gap-[0.925rem] rounded-[0.5rem] bg-[#1a7f37]"
          onClick={() => handleButtonClick(id, true)}
        >
          <Check />
          Approve
        </button>
        <button
          className="flex px-[0.75rem] py-[0.5rem] gap-[0.925rem] rounded-[0.5rem] bg-[#dc2626] "
          onClick={() => handleButtonClick(id, false)}
        >
          <X /> Decline
        </button>
      </div>
    );
  } else {
    return (
      <div className="">
        <button className="flex px-[0.75rem] py-[0.5rem] gap-[0.925rem] rounded-[0.5rem] border border-black  ">
          <span className="capitalize">{status}</span>
        </button>
      </div>
    );
  }
}
