import { FaFolder, FaPlus } from "react-icons/fa";
import { HiTrash } from "react-icons/hi";
import { MdArrowBackIos, MdEditSquare, MdPhotoLibrary } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  useCreateMediaCategoryMutation,
  useDeleteMediaCategoryMutation,
  useGetMediaByCategoryQuery,
  useListAllMediaQuery,
  useUpdateMediaCategoryByIdMutation,
  useUploadMediaMutation,
  useUploadVideoMutation, // Add this import
} from "../../redux/services/media";
import React, { useEffect, useRef, useState } from "react";
import { handleError, handleResponse } from "../../utils/responseHandler";
import { useDispatch } from "react-redux";
import {
  setSelectedMedia,
  setSelectMultipleMedia,
} from "../../redux/feature/mediaSlice";
import { useAppSelector } from "../../redux/store/hooks";
import { IMAGE_BASE_URL } from "@/constants";
import useTranslation from "@/locale/useTranslation";
import Model from "../Model";
import Input from "../Input";
import Button from "../Button";
import { useForm } from "react-hook-form";
import { checkAccess } from "@/utils/accessHelper";
import Pagination from "../Pagination";

type MediaComponentProps = {
  title: string | React.ReactElement;
  handleConfirmImage: () => void;
  isMultiSelect: boolean;
  open: boolean;
  setOpen:
    | React.Dispatch<React.SetStateAction<boolean>>
    | ((isOpen: boolean) => void);
  acceptFiles?: string; //specifies which file types to accept (e.g., "image/*,video/*")
};
export default function MediaComponent({
  title,
  handleConfirmImage,
  isMultiSelect = false,
  open,
  setOpen,
  acceptFiles = "image/*", // Default to images only
}: Readonly<MediaComponentProps>) {
  const translate = useTranslation();
  const dispatch = useDispatch();

  const accessListFolder = checkAccess("Media Category");
  const accessListFile = checkAccess("Media");

  const modelRef = useRef<HTMLDivElement | null>(null);

  const { register, handleSubmit } = useForm();

  const [openModel, setOpenModel] = useState<boolean>(false);

  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Track which input is being edited
  const [inputValues, setInputValues] = useState<{ [key: number]: string }>({}); // Store input values dynamically
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pageNumber, setPageNumber] = useState<number>(1);
  const [mediaCategoryPageNumber, setMediaCategoryPageNumber] =
    useState<number>(1);

  const selectedImage = isMultiSelect
    ? useAppSelector((state) => state.media.multipleSelectedImage)
    : useAppSelector((state) => state.media.selectedImage);

  const {
    data: mediaCategoryList,
    isSuccess: mediaCategorySuccess,
    refetch: mediaCategoryRefetch,
  } = useListAllMediaQuery(mediaCategoryPageNumber);
  const [uploadImage] = useUploadMediaMutation();
  const [uploadVideo] = useUploadVideoMutation();

  const {
    data: media,
    isSuccess: mediaSuccess,
    refetch,
  } = useGetMediaByCategoryQuery(
    { id: currentFolder, pageNumber },
    {
      skip: currentFolder === null,
    },
  );

  useEffect(() => {
    if (mediaSuccess) {
      setPageNumber(media.data.page);
    }
  }, [media, mediaSuccess]);

  const [renameFolder] = useUpdateMediaCategoryByIdMutation();
  const [deleteFolder] = useDeleteMediaCategoryMutation();
  const [createFolder] = useCreateMediaCategoryMutation();

  const handleOpenModel = () => {
    setOpenModel(true);
  };

  const handleCloseModel = () => {
    setOpenModel(false);
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setTimeout(() => inputRefs.current[index]?.focus(), 0);
  };

  const handleInputChange = (index: number, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const handleDeleteFolder = async (id: number) => {
    const response = await deleteFolder(id).unwrap();
    handleResponse({ res: response, onSuccess: () => {} });
  };

  const handleImageSelect = (path: string) => {
    if (isMultiSelect) {
      dispatch(setSelectMultipleMedia(path));
    } else {
      dispatch(setSelectedMedia(path));
    }

    if (modelRef.current) {
      modelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const formData = new FormData();

      // Check if the file is a video
      const isVideo = file.type.startsWith("video/");

      formData.append(isVideo ? "video" : "image", file);

      if (currentFolder) {
        formData.append("mediaCategoryId", currentFolder);
      }

      try {
        const response = isVideo
          ? await uploadVideo(formData).unwrap()
          : await uploadImage(formData).unwrap();

        handleResponse({ res: response, onSuccess: () => {} });
      } catch (error) {
        console.error("Upload error:", error);
        handleError({ error });
      }
    }
  };

  const onSubmit = async (data: any) => {
    const response = await createFolder(data).unwrap();
    handleResponse({ res: response, onSuccess: handleCloseModel });
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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

  const handleDoubleClick = (id: number) => {
    setCurrentFolder(id);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= media.data.totalPages) {
      setPageNumber(page);
      refetch();
    }
  };

  const handleMediaCategoryPageChange = (page: number) => {
    if (page >= 1 && page <= mediaCategoryList.data.totalPages) {
      setMediaCategoryPageNumber(page);
      mediaCategoryRefetch();
    }
  };

  const mediaCategory = mediaCategoryList?.data?.data ?? [];

  // Update the button text to be more generic when accepting videos/other files
  const isAcceptingVideos = acceptFiles.includes("video");
  const fileButtonText = isAcceptingVideos ? "Choose File" : "Choose Image";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button onClick={() => setOpen(true)} className="">
          {translate(title)}
        </button>
      </DialogTrigger>
      <DialogContent
        ref={modelRef}
        className="w-[90%] md:w-[calc(100vw-20rem)] h-[calc(100vh-10rem)] overflow-y-auto overflow-x-hidden lg:max-h-[80%]"
      >
        <DialogHeader className="p-[0.75rem]">
          <DialogTitle>Choose Image</DialogTitle>
          <DialogDescription>
            {/* for buttons */}
            <div className="flex justify-end gap-[1rem] mt-[2rem] w-full md:w-[calc(100vw-23rem)]">
              {(Array.isArray(selectedImage) && selectedImage.length === 0) ||
              selectedImage === "" ? (
                <div className="flex gap-[1rem] overflow-x-auto scrollbar-hide">
                  {currentFolder !== null && (
                    <button
                      className="bg-gray-400 px-[10px] py-[0.5rem] text-white rounded-[0.3rem] flex items-center gap-[10px]"
                      onClick={() => setCurrentFolder(null)}
                    >
                      <MdArrowBackIos size={18} />
                      Back
                    </button>
                  )}
                  {accessListFile.includes("add") && (
                    <button
                      className={`bg-primaryColor px-[10px] py-[0.5rem] text-white rounded-[0.3rem] flex items-center gap-[10px] whitespace-nowrap ${
                        currentFolder ? "cursor-pointer" : "hidden"
                      }`}
                      onClick={handleButtonClick}
                      disabled={!currentFolder}
                    >
                      <MdPhotoLibrary size={22} />
                      {fileButtonText}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptFiles}
                    onChange={handleFileSelect}
                    style={{ display: "none" }} // Hide the file input
                  />
                  {accessListFolder.includes("add") && (
                    <button
                      className={`bg-secondaryBtn px-[10px] py-[0.5rem] text-white rounded-[0.3rem] flex items-center gap-[10px] whitespace-nowrap ${
                        currentFolder ? "hidden" : "cursor-pointer"
                      }`}
                      onClick={handleOpenModel}
                      disabled={!!currentFolder}
                    >
                      <FaPlus size={16} />
                      New Folder
                    </button>
                  )}
                </div>
              ) : (
                <button
                  className="bg-primaryColor px-[10px] py-[0.5rem] text-white rounded-[0.3rem] flex items-center gap-[10px] cursor-pointer"
                  onClick={handleConfirmImage}
                >
                  <MdPhotoLibrary size={22} />
                  Confirm Image
                </button>
              )}
            </div>
            <div className="mt-4 w-full">
              {/* Folder Grid - Responsive */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {currentFolder === null && (
                  <>
                    {mediaCategory?.map(
                      (each: { id: number; name: string }, index: number) => (
                        <button
                          key={index}
                          className="relative border w-full aspect-square flex flex-col items-center justify-center px-2 md:px-4 py-3 md:py-4 cursor-pointer group"
                          onDoubleClick={() => handleDoubleClick(each.id)}
                          style={{ userSelect: "none" }}
                        >
                          {accessListFolder.includes("delete") && (
                            <HiTrash
                              size={18}
                              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-500 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(each.id);
                              }}
                            />
                          )}
                          {accessListFolder.includes("edit") && (
                            <MdEditSquare
                              size={18}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primaryColor z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(index);
                              }}
                            />
                          )}
                          <FaFolder
                            size={108}
                            className="text-yellow-500 group-hover:text-blue-500 mb-2 sm:mb-3 flex-shrink-0"
                          />
                          <textarea
                            ref={(el) => (inputRefs.current[index] = el)}
                            className="bg-inherit text-black w-full text-center text-xs sm:text-sm resize-none overflow-hidden break-words whitespace-pre-wrap"
                            value={
                              inputValues[index] !== undefined
                                ? inputValues[index]
                                : each.name
                            }
                            disabled={editingIndex !== index}
                            onChange={(e) =>
                              handleInputChange(index, e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleInputKeyDown(e, index, each.id)
                            }
                            rows={2}
                          />
                        </button>
                      ),
                    )}
                    {mediaCategorySuccess && (
                      <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6">
                        <Pagination
                          media={mediaCategoryList}
                          handlePageChange={handleMediaCategoryPageChange}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Media Grid */}
                {currentFolder !== null && (
                  <>
                    {media?.data?.data.map(
                      (
                        each: {
                          id: number;
                          path: string;
                          name: string;
                          type?: string;
                        },
                        index: number,
                      ) => {
                        const isVideo =
                          each.path.match(/\.(mp4|webm|ogg|mov)$/i) ||
                          each.type === "video";

                        return (
                          <button
                            className={`relative border w-full aspect-square flex flex-col items-center justify-center p-2 md:p-3 cursor-pointer transition-all ${
                              (typeof selectedImage === "string" &&
                                each.path === selectedImage) ||
                              (Array.isArray(selectedImage) &&
                                selectedImage.includes(each.path))
                                ? "border-2 border-black"
                                : "border hover:border-gray-400"
                            }`}
                            key={index}
                            onClick={() => handleImageSelect(each.path)}
                          >
                            {isVideo ? (
                              <div className="relative w-full h-full max-h-[120px] sm:max-h-[140px]">
                                <video
                                  src={`${IMAGE_BASE_URL}${each.path}`}
                                  className="w-full h-full object-cover"
                                  crossOrigin="anonymous"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                  <span className="text-white text-xl sm:text-2xl">
                                    ▶
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={`${IMAGE_BASE_URL}${each.path}`}
                                alt="Gallery"
                                className="w-full h-full max-h-[120px] sm:max-h-[140px] object-cover"
                              />
                            )}
                            <p className="bg-inherit text-black w-full text-center text-xs sm:text-sm overflow-hidden line-clamp-1 mt-1 sm:mt-2">
                              {each.name}
                            </p>
                          </button>
                        );
                      },
                    )}
                    {mediaSuccess && (
                      <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6">
                        <Pagination
                          media={media}
                          handlePageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="absolute top-[25%] pl-[25%] w-full">
              <Model
                title="Create Folder"
                isOpen={openModel}
                onClose={handleCloseModel}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="py-10">
                  <Input
                    label="Create Folder"
                    placeholder="Enter Folder Name"
                    className="mb-[1rem]"
                    {...register("name")}
                  />
                  <Button type="submit" className="submit-button">
                    <div className="flex justify-center items-center gap-[0.5rem]">
                      Submit
                    </div>
                  </Button>
                </form>
              </Model>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
