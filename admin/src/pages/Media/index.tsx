import { ChevronLeft, ChevronRight, Folder, Images, Plus, SquarePen } from "lucide-react";
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
import Select from "@/components/Select";

export default function Media() {
  const translate = useTranslation();
  const navigate = useNavigate();

  const accessList = checkAccess("Media Category");

  const [open, setOpen] = useState<boolean>(false);
  const [openModel, setOpenModel] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Track which input is being edited
  const [inputValues, setInputValues] = useState<{ [key: number]: string }>({}); // Store input values dynamically
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]); // Store refs for all textarea inputs
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

  const handlePageChange = (page: number, pageSize?: number) => {
    if (page >= 1 && page <= mediaCategoryList?.data?.totalPages) {
      if (pageSize) {
        // If pageSize is provided, update both page and limit
        setPageNumber(1); // Reset to first page when changing page size
        // You might want to update the limit in your API call here
      } else {
        setPageNumber(page);
      }
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
            className="bg-primaryColor hover:bg-primaryColor/90 px-[10px] py-[0.5rem] text-white rounded-[0.3rem] flex items-center gap-[10px] cursor-pointer"
            onClick={handleOpenModel}
          >
            <Plus />
            {translate("New Folder")}
          </button>
        )}
      </div>
      {/* folder section */}
      <div className="mt-8 w-full">
        {mediaCategory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
            No folders yet
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
            {mediaCategory.map(
              (each: { id: number; name: string }, index: number) => (
                <button
                  key={each.id}
                  type="button"
                  className="group relative flex aspect-square w-full flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-3 cursor-pointer md:px-4 md:py-4"
                  onClick={() => navigate(`${MEDIA_LIST_ROUTE}${each.id}`)}
                  style={{ userSelect: "none" }}
                >
                  {accessList.includes("delete") && (
                    <div
                      className="absolute left-2 top-2 z-10 text-red-500 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteModal
                        open={open}
                        setOpen={setOpen}
                        itemId={each.id}
                        activeId={deleteId}
                        handleDeleteTrigger={() => handleDeleteTrigger(each.id)}
                        handleConfirmDelete={handleDelete}
                      />
                    </div>
                  )}
                  {accessList.includes("edit") && (
                    <SquarePen
                      className="absolute right-2 top-2 z-10 text-[#0090DD] opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(index);
                      }}
                    />
                  )}
                  <Folder
                    className="mb-2 shrink-0 text-yellow-500 pointer-events-none group-hover:text-primaryColor sm:mb-3 sm:h-[88px] sm:w-[88px]"
                  />
                  <textarea
                    ref={(el) => (inputRefs.current[index] = el)}
                    className={`w-full resize-none overflow-hidden break-words whitespace-pre-wrap bg-inherit text-center text-xs text-black sm:text-sm ${
                      editingIndex !== index ? "pointer-events-none" : ""
                    }`}
                    value={
                      inputValues[index] !== undefined
                        ? inputValues[index]
                        : each.name
                    }
                    disabled={editingIndex !== index}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e, index, each.id)}
                    onClick={(e) => e.stopPropagation()}
                    rows={2}
                  />
                </button>
              ),
            )}
          </div>
        )}
      </div>
      {/* Pagination Section */}
      {mediaCategorySuccess && (
        <div className="bottom-0  border-t border-gray-200 px-4 py-3 mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              Show:
              <Select
                value={mediaCategoryList.data.limit}
                options={[10, 25, 50, 100].map((value) => ({
                  value,
                  label: String(value),
                }))}
                onValueChange={(next) => handlePageChange(1, Number(next))}
                className="w-[72px]"
                triggerClassName="h-8 px-2 text-sm"
                contentClassName="min-w-[72px]"
              />
              entries
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-md border text-gray-700 hover:bg-gray-100 transition ${
                  mediaCategoryList.data.page === 1 ||
                  mediaCategoryList.data.total === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  mediaCategoryList.data.page === 1 ||
                  mediaCategoryList.data.total === 0
                }
                onClick={() =>
                  handlePageChange(mediaCategoryList.data.page - 1)
                }
                aria-label="Previous Page"
              >
                <ChevronLeft />
              </button>
              <span className="text-sm text-gray-700">
                Page {mediaCategoryList.data.page} of{" "}
                {mediaCategoryList.data.totalPages}
              </span>
              <button
                className={`p-2 rounded-md border text-gray-700 hover:bg-gray-100 transition ${
                  mediaCategoryList.data.page ===
                    mediaCategoryList.data.totalPages ||
                  mediaCategoryList.data.total === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  mediaCategoryList.data.page ===
                    mediaCategoryList.data.totalPages ||
                  mediaCategoryList.data.total === 0
                }
                onClick={() =>
                  handlePageChange(mediaCategoryList.data.page + 1)
                }
                aria-label="Next Page"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="text-sm text-gray-700">
              Total: {mediaCategoryList.data.total}
            </div>
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
