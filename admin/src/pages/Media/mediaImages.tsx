import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Images,
  SquarePen,
  Upload,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useDeleteMediaMutation,
  useGetMediaByCategoryQuery,
  useRenameMediaMutation,
  useUploadMediaMutation,
} from "@/redux/services/media";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import useTranslation from "@/locale/useTranslation";
import DeleteModal from "@/components/DeleteModal";
import getFormData from "@/utils/fileUpload";
import { checkAccess } from "@/utils/accessHelper";

/** Strip seeded on-disk prefixes so the gallery shows dish names. */
function mediaLabel(name: string | undefined | null) {
  const raw = String(name || "").trim();
  if (!raw) return "Untitled";
  return raw.replace(/^default-/i, "");
}

export default function MediaImages() {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const accessList = checkAccess("Media");

  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [inputValues, setInputValues] = useState<{ [key: number]: string }>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
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

    const data = { mediaCategoryId: id };
    const images = { images: Array.from(files) };
    const formData = getFormData(data, images);

    try {
      const response = await uploadImage(formData).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setTimeout(() => inputRefs.current[index]?.focus(), 0);
  };

  const handleInputChange = (index: number, value: string) => {
    setInputValues((prev) => ({ ...prev, [index]: value }));
  };

  const handleInputKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    id: number,
  ) => {
    if (event.key === "Enter") {
      const body = { name: inputValues[index] };
      const response = await renameMedia({ body, id }).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
      setEditingIndex(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= media.data.totalPages) {
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

  const items = media?.data?.data ?? [];
  const isEmpty = mediaSuccess && items.length === 0;

  return (
    <div className="relative mt-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/media-category/list")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 text-[13px] font-medium text-[var(--serve-fg)] transition hover:border-[color-mix(in_srgb,var(--serve-accent)_28%,var(--serve-border))] hover:bg-[var(--serve-surface-2)]"
        >
          <ArrowLeft size={16} strokeWidth={2.25} />
          Go Back
        </button>

        {accessList.includes("add") ? (
          <div>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--primary-color)] px-3 text-[13px] font-semibold text-[var(--primary-fg,#fff)] transition hover:opacity-95"
              onClick={handleButtonClick}
            >
              <Upload size={15} strokeWidth={2.25} />
              {translate("Choose File")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : null}
      </div>

      {isEmpty ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-6 py-16 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--serve-accent)_14%,transparent)] text-[var(--serve-accent)]">
            <Images size={26} strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-sm font-medium text-[var(--serve-fg)]">
            This folder is empty
          </p>
          <p className="mt-1 max-w-sm text-[13px] text-[var(--serve-muted)]">
            Upload images here, then pick them when editing menu items.
          </p>
          {accessList.includes("add") ? (
            <button
              type="button"
              onClick={handleButtonClick}
              className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--primary-color)] px-4 text-[13px] font-semibold text-[var(--primary-fg,#fff)] transition hover:opacity-95"
            >
              <Upload size={15} />
              Upload images
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map(
            (
              each: { id: number; path: string; name: string },
              index: number,
            ) => (
              <div
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--serve-border)] bg-[var(--serve-surface)] transition hover:border-[color-mix(in_srgb,var(--serve-accent)_30%,var(--serve-border))]"
                key={each.id}
              >
                {accessList.includes("delete") ? (
                  <div className="absolute left-2 top-2 z-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <DeleteModal
                      open={open}
                      setOpen={setOpen}
                      itemId={each.id}
                      activeId={deleteId}
                      handleDeleteTrigger={() => handleDeleteTrigger(each.id)}
                      handleConfirmDelete={handleDeleteFile}
                    />
                  </div>
                ) : null}

                {accessList.includes("edit") ? (
                  <button
                    type="button"
                    aria-label="Rename image"
                    className="absolute right-2 top-2 z-10 rounded-md bg-[var(--serve-surface)]/90 p-1.5 text-[var(--serve-muted)] opacity-100 shadow-sm transition hover:text-[var(--serve-accent)] sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={() => handleEditClick(index)}
                  >
                    <SquarePen size={14} />
                  </button>
                ) : null}

                <div className="relative aspect-square w-full overflow-hidden bg-[var(--serve-surface-2)]">
                  {each.path ? (
                    <img
                      src={buildAssetUrl(
                        each.path,
                        each.updatedAt || each.id || 1,
                      )}
                      alt={each.name || "Gallery"}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--serve-muted)]">
                      <ImageIcon size={28} strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  className={`w-full truncate border-t border-[var(--serve-border)] bg-transparent px-2.5 py-2 text-center text-[12px] text-[var(--serve-fg)] outline-none sm:text-[13px] ${
                    editingIndex === index
                      ? "ring-1 ring-inset ring-[var(--serve-accent)]"
                      : "pointer-events-none"
                  }`}
                  value={
                    inputValues[index] !== undefined
                      ? inputValues[index]
                      : mediaLabel(each.name)
                  }
                  disabled={editingIndex !== index}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, index, each.id)}
                  title={mediaLabel(each.name)}
                />
              </div>
            ),
          )}
        </div>
      )}

      {mediaSuccess ? (
        <div className="mt-6 border-t border-[var(--serve-border)] px-1 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[13px] text-[var(--serve-muted)]">
              Show:{" "}
              <span className="font-medium text-[var(--serve-fg)]">
                {media.data.limit ?? 0}
              </span>{" "}
              entries
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] p-2 text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)] ${
                  media.data.page <= 1 || media.data.total === 0
                    ? "cursor-not-allowed opacity-40"
                    : ""
                }`}
                disabled={media.data.page <= 1 || media.data.total === 0}
                onClick={() => handlePageChange(media.data.page - 1)}
                aria-label="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="min-w-[7rem] text-center text-[13px] text-[var(--serve-fg)]">
                Page {media.data.page ?? 0} of {media.data.totalPages ?? 0}
              </span>
              <button
                type="button"
                className={`rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] p-2 text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)] ${
                  media.data.page >= media.data.totalPages ||
                  media.data.total === 0
                    ? "cursor-not-allowed opacity-40"
                    : ""
                }`}
                disabled={
                  media.data.page >= media.data.totalPages ||
                  media.data.total === 0
                }
                onClick={() => handlePageChange(media.data.page + 1)}
                aria-label="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="text-[13px] text-[var(--serve-muted)] sm:text-right">
              Total:{" "}
              <span className="font-medium text-[var(--serve-fg)]">
                {media.data.total ?? 0}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
