import NotificationTable from "@/components/Table/notificationTable";
import {
  useApprovalDecisionMutation,
  useGetAllAccessToApproveQuery,
  useGetAllRelatedRequestQuery,
} from "@/redux/services/authentication";
import { useAppSelector } from "@/redux/store/hooks";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { useLocation } from "react-router-dom";
import Select from "@/components/Select";

export default function ApproveRequest() {
  const location = useLocation();

  const selectedId = location?.state?.selectedId;

  const [status, setStatus] = useState({ status: null, pageNumber: 1 });

  // get profile data from global state
  const profileData = useAppSelector((state) => state.profile);

  // check if it has supervisor or sub ordinate
  const hasSupervisor = profileData?.supervisorId === null ? false : true;

  const {
    data: accessToApproveAdmin,
    isSuccess: successAdmin,
    refetch: refetchAdmin,
  } = useGetAllAccessToApproveQuery(status, {
    skip: hasSupervisor || profileData.supervisorId === "",
  });

  const {
    data: accessToApproveOther,
    isSuccess: successOther,
    refetch: refetchOther,
  } = useGetAllRelatedRequestQuery(status, {
    skip: !hasSupervisor || profileData.supervisorId === "",
  });

  //  react does not allow condition implementation in hook till noe so we are using this approach
  const accessToApprove = hasSupervisor
    ? accessToApproveOther
    : accessToApproveAdmin;

  const success = hasSupervisor ? successOther : successAdmin;
  const refetch = hasSupervisor ? refetchOther : refetchAdmin;

  const [approvalDecision] = useApprovalDecisionMutation();

  const handleClick = async (id, status) => {
    const body = { action: status };
    try {
      const response = await approvalDecision({ id, body }).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    }
  };

  const handleFilterData = (statusOrEvent) => {
    if (typeof statusOrEvent === "string") {
      if (statusOrEvent === "All") {
        setStatus((prev) => ({
          ...prev,
          status: null,
        }));
      } else {
        setStatus((prev) => ({
          ...prev,
          status: statusOrEvent,
        }));
      }
    } else if (statusOrEvent && statusOrEvent.target) {
      if (statusOrEvent.target.value === "All") {
        setStatus((prev) => ({
          ...prev,
          status: null,
        }));
      } else {
        setStatus((prev) => ({
          ...prev,
          status: statusOrEvent.target.value,
        }));
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= accessToApprove.data.totalPages) {
      setStatus((prev) => ({
        ...prev,
        pageNumber: page,
      }));
    }
    refetch();
  };
  return (
    <>
      {/* Header */}
      <div className="flex justify-between mt-[2.75rem] mb-[0.375rem]">
        <div className="flex border rounded-[0.75rem]">
          <button
            className={`py-[0.375rem] px-[1rem] rounded-l-[0.75rem] ${
              status.status === null ? "bg-slate-300" : "bg-white"
            }`}
            onClick={() => handleFilterData("All")}
          >
            All
          </button>
          <button
            className={`py-[0.375rem] px-[1rem] border-l rounded-r-[0.75rem] ${
              status.status === "Pending" ? "bg-slate-300" : "bg-white"
            }`}
            onClick={() => handleFilterData("Pending")}
          >
            Pending
          </button>
        </div>
        <input
          placeholder="Search With Keywords"
          className="bg-white border rounded-[0.75rem] w-[50%] px-[0.5rem]"
        />
        <div className="flex items-center gap-2 rounded-[0.75rem] border px-[1rem] py-[0.375rem]">
          <span className="whitespace-nowrap text-sm">Group by:</span>
          <Select
            id="group-id"
            value={status.status ?? "All"}
            onValueChange={(next) => handleFilterData(next)}
            options={[
              { value: "All", label: "All" },
              { value: "Pending", label: "Pending" },
              { value: "Approved", label: "Approved" },
              { value: "Rejected", label: "Rejected" },
            ]}
            className="w-[140px]"
            triggerClassName="h-8 border-0 bg-transparent px-1 shadow-none hover:border-0 focus-visible:ring-0"
            contentClassName="min-w-[140px]"
          />
        </div>
      </div>
      {success && (
        <NotificationTable
          selectedId={selectedId}
          tableData1={accessToApproveAdmin}
          tableData2={accessToApproveOther}
          handleButtonClick={handleClick}
          hasSupervisor={profileData?.supervisorId}
        />
      )}
      {/* Pagination */}
      {success && (
        <div className="mt-[1.5rem] w-full flex justify-between font-[400] text-[14px] text-[#2F2B3D] py-[1rem] px-[0.5rem]">
          <div>Show: {accessToApprove?.data?.limit ?? 0} Entries</div>
          <div className="font-[500] text-[#333333] text-[0.75rem] flex gap-[0.25rem]">
            <button
              className="rounded-full bg-white border flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
              onClick={() => handlePageChange(accessToApprove.data.page - 1)} // Decrement page
            >
              <MdKeyboardArrowLeft />
            </button>
            {/* Pagination Number */}
            {Array.from({ length: accessToApprove.data.totalPages }).map(
              (_, index) => {
                const pageNumber = index + 1;
                const isCurrentPage = accessToApprove.data.page === pageNumber;
                const isNextPage = accessToApprove.data.page + 1 === pageNumber;
                // Render only the current and next pages
                if (isCurrentPage || isNextPage) {
                  return (
                    <button
                      key={index}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`rounded-full flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer ${
                        isCurrentPage
                          ? "bg-primaryColor text-white"
                          : "bg-white border"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                }

                // Add ellipsis after the current and next pages
                if (pageNumber === accessToApprove.data.page + 2) {
                  return (
                    <div
                      key="ellipsis"
                      className="text-[#999999] flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
                    >
                      ...
                    </div>
                  );
                }
                return null;
              },
            )}

            <button
              className="rounded-full bg-white border flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
              onClick={() => handlePageChange(accessToApprove.data.page + 1)}
              // Increment page
            >
              <MdKeyboardArrowRight />
            </button>
          </div>
          <div className="flex gap-[1.5rem]">
            <p>
              Page {accessToApprove.data.page ?? 0} of{" "}
              {accessToApprove.data.totalPages ?? 0}
            </p>
            <p> Total Data: {accessToApprove.data.total ?? 0}</p>
          </div>
        </div>
      )}
    </>
  );
}
