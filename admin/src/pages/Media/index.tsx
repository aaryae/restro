import {
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  SquarePen,
} from "lucide-react";
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

  const [open, setOpen] = useState(false);
  const [openModel, setOpenModel] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [inputValues, setInputValues] = useState<{ [key: number]: string }>({});
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [pageNumber, setPageNumber] = useState(1);

  const { register, handleSubmit, reset } = useForm();

  const {
    data: mediaCategoryList,
    isSuccess: mediaCategorySuccess,
    refetch,
  } = useListAllMediaQuery(pageNumber);
  const [createFolder] = useCreateMediaCategoryMutation();
  const [renameFolder] = useUpdateMediaCategoryByIdMutation();
  const [deleteFolder] = useDeleteMediaCategoryMutation();

  const handleOpenModel = () => setOpenModel(true);

  const handleCloseModel = () => {
    setOpenModel(false);
    reset();
  };

  const onSubmit = async (data: { name?: string }) => {
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
    setEditingIndex(index);
    setTimeout(() => inputRefs.current[index]?.focus(), 0);
  };

  const handleInputChange = (index: number, value: string) => {
    setInputValues((prev) => ({ ...prev, [index]: value }));
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    if (page >= 1 && page <= mediaCategoryList?.data?.totalPages) {
      if (pageSize) {
        setPageNumber(1);
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
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    id: number,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const body = { name: inputValues[index] };
      const response = await renameFolder({ body, id }).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
      setEditingIndex(null);
    }
  };

  const mediaCategory = mediaCategoryList?.data?.data ?? [];

  return (
    <div className="relative mt-6 flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--serve-fg)]">
            {translate("Media")}
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--serve-muted)]">
            Folders for menu photos and other images
          </p>
        </div>
        {accessList.includes("add") ? (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--primary-color)] px-3 text-[13px] font-semibold text-[var(--primary-fg,#fff)] transition hover:opacity-95"
            onClick={handleOpenModel}
          >
            <Plus size={16} strokeWidth={2.25} />
            {translate("New Folder")}
          </button>
        ) : null}
      </div>

      <div className="mt-6 w-full">
        {mediaCategory.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-6 py-16 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--serve-accent)_14%,transparent)] text-[var(--serve-accent)]">
              <FolderOpen size={28} strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-sm font-medium text-[var(--serve-fg)]">
              No folders yet
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-[var(--serve-muted)]">
              Create a folder to organise menu photos, then open it to upload
              images.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
            {mediaCategory.map(
              (each: { id: number; name: string }, index: number) => (
                <button
                  key={each.id}
                  type="button"
                  className="group relative flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 py-4 text-left transition hover:border-[color-mix(in_srgb,var(--serve-accent)_35%,var(--serve-border))] hover:bg-[var(--serve-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--serve-accent)_45%,transparent)]"
                  onClick={() => navigate(`${MEDIA_LIST_ROUTE}${each.id}`)}
                >
                  {accessList.includes("delete") ? (
                    <div
                      className="absolute left-2 top-2 z-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
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
                  ) : null}

                  {accessList.includes("edit") ? (
                    <button
                      type="button"
                      aria-label="Rename folder"
                      className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-[var(--serve-muted)] opacity-100 transition hover:bg-[var(--serve-surface-2)] hover:text-[var(--serve-accent)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(index);
                      }}
                    >
                      <SquarePen size={15} />
                    </button>
                  ) : null}

                  <Folder
                    size={72}
                    strokeWidth={1}
                    className="mb-1 h-16 w-16 shrink-0 text-yellow-500 transition group-hover:text-yellow-400 sm:h-[5.5rem] sm:w-[5.5rem]"
                    fill="currentColor"
                  />

                  <textarea
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    className={`w-full resize-none overflow-hidden break-words bg-transparent text-center text-[13px] font-medium leading-snug text-[var(--serve-fg)] outline-none sm:text-sm ${
                      editingIndex === index
                        ? "rounded-md ring-1 ring-[var(--serve-accent)]"
                        : "pointer-events-none"
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

      {mediaCategorySuccess ? (
        <div className="mt-6 border-t border-[var(--serve-border)] px-1 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[13px] text-[var(--serve-muted)]">
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
                type="button"
                className={`rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] p-2 text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)] ${
                  mediaCategoryList.data.page === 1 ||
                  mediaCategoryList.data.total === 0
                    ? "cursor-not-allowed opacity-40"
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
                <ChevronLeft size={18} />
              </button>
              <span className="min-w-[7rem] text-center text-[13px] text-[var(--serve-fg)]">
                Page {mediaCategoryList.data.page} of{" "}
                {mediaCategoryList.data.totalPages}
              </span>
              <button
                type="button"
                className={`rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] p-2 text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)] ${
                  mediaCategoryList.data.page ===
                    mediaCategoryList.data.totalPages ||
                  mediaCategoryList.data.total === 0
                    ? "cursor-not-allowed opacity-40"
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
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="text-[13px] text-[var(--serve-muted)] sm:text-right">
              Total:{" "}
              <span className="font-medium text-[var(--serve-fg)]">
                {mediaCategoryList.data.total}
              </span>
            </div>
          </div>
        </div>
      ) : null}

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
            <div className="flex items-center justify-center gap-[0.5rem]">
              {translate("Submit")}
            </div>
          </Button>
        </form>
      </Model>
    </div>
  );
}
