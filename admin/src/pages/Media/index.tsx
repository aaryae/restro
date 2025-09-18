import { FaFolder, FaPlus } from "react-icons/fa";
import {
  MdEditSquare,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdPhotoLibrary,
} from "react-icons/md";
import Model from "@/components/Model";
import { useState, useRef } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useForm } from "react-hook-form";
import {
  useCreateMediaCategoryMutation,
  useDeleteMediaCategoryMutation,
  useListAllMediaQuery,
  useUpdateMediaCategoryByIdMutation,
} from "../../redux/services/media";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useNavigate } from "react-router-dom";
import useTranslation from "@/locale/useTranslation";
import { MEDIA_LIST_ROUTE } from "@/routes/routeNames";
import DeleteModal from "@/components/DeleteModal";
import { checkAccess } from "@/utils/accessHelper";

export default function Media() {
  const translate = useTranslation();
  const navigate = useNavigate();

  const accessList = checkAccess("Media Category");

  const [open, setOpen] = useState<boolean>(false);
  const [openModel, setOpenModel] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Track which input is being edited
  const [inputValues, setInputValues] = useState<{ [key: number]: string }>({}); // Store input values dynamically
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Store refs for all inputs
  const [pageNumber, setPageNumber] = useState<number>(1);

  const { register, handleSubmit, reset } = useForm();

  const {
    data: mediaCategoryList,
    isSuccess: mediaCategorySuccess,
    refetch,
  } = useListAllMediaQuery(pageNumber);
  const [createFolder] = useCreateMediaCategoryMutation();
  const [renameFolder] = useUpdateMediaCategoryByIdMutation();
  const [deleteFolder] = useDeleteMediaCategoryMutation();

  const handleOpenModel = () => {
    setOpenModel(true);
  };

  const handleCloseModel = () => {
    setOpenModel(false);
    reset();
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await createFolder(data).unwrap();
      handleResponse({ res: response, onSuccess: handleCloseModel });
    } catch (error) {
      handleError({ error });
    } finally {
      handleCloseModel();
    }
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index); // Set the editing index
    setTimeout(() => inputRefs.current[index]?.focus(), 0); // Focus on the input
  };

  const handleInputChange = (index: number, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [index]: value, // Dynamically update the value for the input at the specified index
    }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= mediaCategoryList.data.totalPages) {
      // Update the current page in the state or API call
      // setMedia((prev) => ({ ...prev, data: { ...prev.data, page } }));
      setPageNumber(page);
      refetch();
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteFolder(deleteId).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const handleInputKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    id: number,
  ) => {
    if (event.key === "Enter") {
      const body = { name: inputValues[index] };
      const response = await renameFolder({ body, id }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
      setEditingIndex(null);
    }
  };

  const mediaCategory = mediaCategoryList?.data?.data ?? [];

  return (
    <div className="relative mt-[3rem] flex flex-col">
      {/* button section */}
      <div className="flex justify-end gap-[1rem]">
        {accessList.includes("add") && (
          <button
            className="bg-secondaryBtn px-[10px] py-[0.5rem] text-white rounded-[0.3rem] flex items-center gap-[10px] cursor-pointer"
            onClick={handleOpenModel}
          >
            <FaPlus size={16} />
            {translate("New Folder")}
          </button>
        )}
      </div>
      {/* folder section */}
      <div className="mt-[5rem] flex justify-start  w-full">
        <div className="flex flex-wrap justify-center lg:gap-[3rem] gap-[2rem] w-fit max-w-full place-items-center">
          {mediaCategory?.map(
            (each: { id: number; name: string }, index: number) => (
              <button
                key={index}
                className="relative border w-fit px-[1.5rem] pt-[1.5rem] pb-[1rem] cursor-pointer group"
                onDoubleClick={() => navigate(`${MEDIA_LIST_ROUTE}${each.id}`)}
                style={{ userSelect: "none" }}
              >
                {accessList.includes("delete") && (
                  <div className="absolute top-[0.5rem] left-[0.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-500">
                    <DeleteModal
                      open={open}
                      setOpen={setOpen}
                      handleDeleteTrigger={() => handleDeleteTrigger(each.id)}
                      handleConfirmDelete={handleDelete}
                    />
                  </div>
                )}
                {accessList.includes("edit") && (
                  <MdEditSquare
                    className="absolute top-[0.5rem] right-[0.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#0090DD]"
                    onClick={() => handleEditClick(index)} // Trigger edit mode and focus
                  />
                )}
                <FaFolder
                  size={108}
                  className="text-yellow-500 group-hover:text-blue-500"
                />
                <textarea
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="bg-inherit text-black w-[6rem] text-center resize-none overflow-hidden break-words whitespace-pre-wrap"
                  value={
                    inputValues[index] !== undefined
                      ? inputValues[index]
                      : each.name
                  }
                  disabled={editingIndex !== index}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, index, each.id)}
                  rows={2}
                />
              </button>
            ),
          )}
        </div>
      </div>
      {/* Pagination Section */}
      {mediaCategorySuccess && (
        <div className="mt-[1.5rem] w-full flex justify-between font-[400] text-[14px] text-[#2F2B3D] py-[1rem] px-[0.5rem]">
          <div>Show: {mediaCategoryList.data.limit ?? 0} Entries</div>
          <div className="font-[500] text-[#333333] text-[0.75rem] flex gap-[0.25rem]">
            <button
              className="rounded-full bg-white border flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
              onClick={() => handlePageChange(mediaCategoryList.data.page - 1)} // Decrement page
            >
              <MdKeyboardArrowLeft />
            </button>

            {/* Pagination Numbers */}
            {Array.from({ length: mediaCategoryList.data.totalPages }).map(
              (_, index) => {
                const pageNumber = index + 1;
                const isCurrentPage =
                  mediaCategoryList.data.page === pageNumber;
                const isNextPage =
                  mediaCategoryList.data.page + 1 === pageNumber;

                // Render only the current and next pages
                if (isCurrentPage || isNextPage) {
                  return (
                    <button
                      key={index}
                      onClick={() => handlePageChange(pageNumber)} // Change page
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
                if (pageNumber === mediaCategoryList.data.page + 2) {
                  return (
                    <div
                      key="ellipsis"
                      className="text-[#999999] flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
                    >
                      ...
                    </div>
                  );
                }

                return null; // Skip other items
              },
            )}

            {/* Right Arrow */}
            <button
              className="rounded-full bg-white border flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
              onClick={() => handlePageChange(mediaCategoryList.data.page + 1)}
              // Increment page
            >
              <MdKeyboardArrowRight />
            </button>
          </div>
          <div className="flex gap-[1.5rem]">
            <p>
              Page {mediaCategoryList.data.page ?? 0} of{" "}
              {mediaCategoryList.data.totalPages ?? 0}
            </p>
            <p>Total Data: {mediaCategoryList.data.total ?? 0}</p>
          </div>
        </div>
      )}
      <div className="absolute top-[25%] pl-[25%] w-full">
        <Model
          title={translate("Create Folder")}
          isOpen={openModel}
          onClose={handleCloseModel}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              label={translate("Folder Name")}
              placeholder="Enter Folder Name"
              className="mb-[1rem]"
              {...register("name")}
            />
            <Button type="submit" className="submit-button">
              <div className="flex justify-center items-center gap-[0.5rem]">
                {translate("Submit")}
              </div>
            </Button>
          </form>
        </Model>
      </div>
    </div>
  );
}
