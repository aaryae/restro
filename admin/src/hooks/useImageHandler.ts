import { clearSelectedMedia } from "@/redux/feature/mediaSlice";
import { useAppSelector } from "@/redux/store/hooks";
import { useState } from "react";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { useDispatch } from "react-redux";

export default function useImageHandler(
  setValue: UseFormSetValue<any>,
  getValues: UseFormGetValues<any>,
  key: string = "media",
) {
  const dispatch = useDispatch();

  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isImageModelOpen, setIsImageModalOpen] = useState<boolean>(false);

  const selectedImage = useAppSelector(
    (state) => state.media.multipleSelectedImage,
  );

  const media = getValues(key) || [];

  const handleConfirmImage = (key: string) => {
    setValue(key, selectedImage);
    dispatch(clearSelectedMedia());
    setIsImageModalOpen(false);
  };

  const handleNextButton = (event: React.MouseEvent) => {
    event.preventDefault();
    if (Array.isArray(media) && media.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % media.length);
    }
  };

  const handleRemoveButton = (event: React.MouseEvent) => {
    event.preventDefault();

    setValue(key, [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handlePrevButton = (event: React.MouseEvent) => {
    event.preventDefault();
    if (Array.isArray(media) && media.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? media.length - 1 : prevIndex - 1,
      );
    }
  };

  return {
    media,
    currentImageIndex,
    isImageModelOpen,
    setIsImageModalOpen,
    handleConfirmImage,
    handleNextButton,
    handlePrevButton,
    handleRemoveButton,
  };
}

export function useSingleImageHandler<T>(
  setValue: UseFormSetValue<any>,
  getValues: UseFormGetValues<any>,
  key: keyof T = "imageUrl" as keyof T,
) {
  const dispatch = useDispatch();

  const [isImageModelOpen, setIsImageModelOpen] = useState<boolean>(false);

  const selectedImage = useAppSelector((state) => state.media.selectedImage);
  const imageUrl = getValues(key);

  const handleConfirmImage = (key) => {
    setValue(key, selectedImage);
    setIsImageModelOpen(false);
    dispatch(clearSelectedMedia());
  };

  return {
    imageUrl,
    handleConfirmImage,
    isImageModelOpen,
    setIsImageModelOpen,
  };
}
