import { useEffect, useRef, useState } from "react";
import {
  MdEditSquare,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdPhotoLibrary,
} from "react-icons/md";
import { MdOutlineArrowBack } from "react-icons/md";

import { useNavigate, useParams } from "react-router-dom";
import {
  useDeleteMediaMutation,
  useGetMediaByCategoryQuery,
  useRenameMediaMutation,
  useUploadMediaMutation,
} from "@/redux/services/media";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { IMAGE_BASE_URL } from "@/constants";
import useTranslation from "@/locale/useTranslation";
import DeleteModal from "@/components/DeleteModal";
import getFormData from "@/utils/fileUpload";
import { checkAccess } from "@/utils/accessHelper";

export default function MediaImages() {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const accessList = checkAccess("Media");

  const [open, setOpen] = useState<boolean>(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Track which input is being edited
  const [inputValues, setInputValues] = useState<{ [key: number]: string }>({}); // Store input values dynamically
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Store refs for all inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [uploadImage] = useUploadMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();
  const [renameMedia] = useRenameMediaMutation();

  const {
    data: media,
    isSuccess: mediaSuccess,
    refetch,
  } = useGetMediaByCategoryQuery({
    id,
    pageNumber,
  });

  useEffect(() => {
    if (mediaSuccess) {
      setPageNumber(media.data.page);
    }
  }, [media, mediaSuccess]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const data = { mediaCategoryId: id }; // Example data
    const images = { images: Array.from(files) }; // Handling multiple files

    const formData = getFormData(data, images);

    try {
      const response = await uploadImage(formData).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      console.error("Upload failed:", error);
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

  const handleInputKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    id: number,
  ) => {
    if (event.key === "Enter") {
      const body = { name: inputValues[index] };
      const response = await renameMedia({ body, id }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
      setEditingIndex(null);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger the file input click event
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= media.data.totalPages) {
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

  const handleDeleteFile = async () => {
    try {
      const response = await deleteMedia(deleteId).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };
  return (
    <div className="relative mt-[3rem]">
      {/* button section */}
      <div className="flex  justify-between gap-[1rem]">
        <div
          onClick={() => navigate("/admin/media-category/list")}
          className="flex bg-red-500 hover:bg-red-600 cursor-pointer text-white p-2 rounded-sm font-medium"
        >
          <span className="p-1">
            <MdOutlineArrowBack />
          </span>
          <span className=" ">Go Back</span>
        </div>
        {accessList.includes("add") && (
          <div className="">
            <button
              className="bg-primaryColor px-[10px] py-[0.5rem] text-white rounded-[0.3rem] flex items-center gap-[10px] cursor-pointer"
              onClick={handleButtonClick}
            >
              <MdPhotoLibrary size={22} />
              {translate("Choose File")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }} // Hide the file input
            />
          </div>
        )}
        {/* <button
          className="bg-[#FF80C5] px-[10px] py-[0.5rem] text-white rounded-[0.3rem] flex items-center gap-[10px] cursor-not-allowed"
          disabled
        >
          <FaPlus size={16} />
          {translate("New Folder")}
        </button> */}
      </div>
      {/* images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-4 md:gap-[4rem] mt-8 md:mt-12 w-full">
        {media?.data?.data.map(
          (each: { id: number; path: string; name: string }, index: number) => (
            <div
              className="relative border w-full sm:w-auto px-4 pt-4 pb-2 cursor-pointer hover:scale-95 md:hover:scale-80 group transition-transform duration-300 ease-in-out flex flex-col items-center"
              key={index}
            >
              {accessList.includes("delete") && (
                <div className="absolute top-[0.5rem] left-[0.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-500">
                  <DeleteModal
                    open={open}
                    setOpen={setOpen}
                    handleDeleteTrigger={() => handleDeleteTrigger(each.id)}
                    handleConfirmDelete={handleDeleteFile}
                  />
                </div>
              )}
              {accessList.includes("edit") && (
                <MdEditSquare
                  className="absolute top-[0.5rem] right-[0.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#0090DD]"
                  onClick={() => handleEditClick(index)} // Trigger edit mode and focus
                />
              )}
              <img
                src={`${IMAGE_BASE_URL}${each.path}`}
                alt="Gallery"
                className="w-full max-w-[200px] md:w-[109px] md:h-[90px] h-auto aspect-square object-cover rounded-md"
              />
              <input
                type="text"
                ref={(el) => (inputRefs.current[index] = el)}
                className="bg-inherit text-black w-[6rem] text-center overflow-hidden line-clamp-1 mt-[0.5rem]"
                value={
                  inputValues[index] !== undefined
                    ? inputValues[index]
                    : each.name
                }
                disabled={editingIndex !== index}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleInputKeyDown(e, index, each.id)}
              />
            </div>
          ),
        )}
      </div>
      {/* Pagination */}
      {mediaSuccess && (
        <div className="mt-[1.5rem] w-full flex justify-between font-[400] text-[14px] text-[#2F2B3D] py-[1rem] px-[0.5rem]">
          <div>Show: {media.data.limit ?? 0} Entries</div>
          <div className="font-[500] text-[#333333] text-[0.75rem] flex gap-[0.25rem]">
            {/* Left Arrow */}
            <div
              className="rounded-full bg-white border flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
              onClick={() => handlePageChange(media.data.page - 1)} // Decrement page
            >
              <MdKeyboardArrowLeft />
            </div>

            {/* Pagination Numbers */}
            {Array.from({ length: media.data.totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              const isCurrentPage = media.data.page === pageNumber;
              const isNextPage = media.data.page + 1 === pageNumber;

              // Render only the current and next pages
              if (isCurrentPage || isNextPage) {
                return (
                  <div
                    key={index}
                    onClick={() => handlePageChange(pageNumber)} // Change page
                    className={`rounded-full flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer ${
                      isCurrentPage
                        ? "bg-primaryColor text-white"
                        : "bg-white border"
                    }`}
                  >
                    {pageNumber}
                  </div>
                );
              }

              // Add ellipsis after the current and next pages
              if (pageNumber === media.data.page + 2) {
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
            })}

            {/* Right Arrow */}
            <div
              className="rounded-full bg-white border flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
              onClick={() => handlePageChange(media.data.page + 1)}
              // Increment page
            >
              <MdKeyboardArrowRight />
            </div>
          </div>

          <div className="flex gap-[1.5rem]">
            <p>
              Page {media.data.page ?? 0} of {media.data.totalPages ?? 0}
            </p>
            <p>Total Data: {media.data.total ?? 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
