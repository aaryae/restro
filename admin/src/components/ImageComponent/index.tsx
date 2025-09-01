import { IMAGE_BASE_URL } from "@/constants";
import galleryIcon from "@/assets/gallery_icon.svg";

export const ImageInputUI = ({
  image,
  imageMessage,
}: {
  image?: string;
  imageMessage?: string;
}) => {
  return (
    <div className="relative">
      <div
        className={`h-[10rem] md:w-[25rem] border border-dashed border-[#C9CBD1] rounded-[6px] flex items-center justify-center `}
      >
        {image !== undefined && image !== "" ? (
          <img
            src={`${IMAGE_BASE_URL}${image}`}
            alt="Gallery Icon"
            className="object-contain h-full w-full p-[1rem]"
            // crossOrigin="anonymous"
          />
        ) : (
          <img
            src={galleryIcon}
            alt="Gallery Icon"
            className="h-[3rem] w-[5rem]"
          />
        )}
      </div>
      <p className="font-[400] text-[0.75rem] text-start mt-[2px] text-[#626c78]">
        {imageMessage
          ? imageMessage
          : "Allowed JPG, GIF or PNG. Max size of 1MB"}
      </p>
    </div>
  );
};

export const VideoInputUI = ({
  video,
  videoMessage,
}: {
  video?: string | null;
  videoMessage?: string;
  label?: string;
}) => {
  return (
    <div className="relative">
      <div
        className={`h-[10rem] md:w-[25rem] border border-dashed border-[#C9CBD1] rounded-[6px] flex items-center justify-center`}
      >
        {video !== null && video !== "" ? (
          <video
            src={`${IMAGE_BASE_URL}${video}`}
            controls
            className="object-contain h-full w-full p-[1rem]"
            // crossOrigin="anonymous"
          />
        ) : (
          <div className="flex flex-col items-center">
            {/* Replace with your actual video icon */}
            <img
              src={galleryIcon}
              alt="Video Icon"
              className="h-[3rem] w-[5rem]"
              onError={(e) => {
                // Fallback if video icon is missing
                e.currentTarget.src = galleryIcon;
              }}
            />
          </div>
        )}
      </div>
      <p className="font-[400] text-[0.75rem] text-start mt-[2px] text-[#626c78]">
        {videoMessage
          ? videoMessage
          : "Allowed MP4, WebM, OGG. Max size of 50MB"}
      </p>
    </div>
  );
};

export const MultipleImageInputUI = ({
  images,
  imageIndex,
}: {
  images: string | string[];
  imageIndex: number;
}) => {
  return (
    <div
      className={`h-[10rem] w-[25rem] border border-dashed border-[#C9CBD1] rounded-[6px] flex items-center justify-center `}
    >
      {Array.isArray(images) && images.length > 0 ? (
        <div>
          <div className="h-[10rem] w-[25rem]">
            <img
              src={`${IMAGE_BASE_URL}${
                typeof images[imageIndex] === "string"
                  ? images[imageIndex]
                  : images[imageIndex].img_url
              }`}
              alt="Gallery Image"
              className="object-contain w-full h-full p-[1rem]"
              // crossOrigin="anonymous"
            />
          </div>
        </div>
      ) : typeof images === "string" ? (
        <img
          src={`${IMAGE_BASE_URL}${images}`}
          alt="Gallery Icon"
          className="object-contain h-full w-full p-[1rem]"
          // crossOrigin="anonymous"
        />
      ) : (
        <img
          src={galleryIcon}
          alt="Gallery Icon"
          className="h-[3rem] w-[5rem]"
        />
      )}
    </div>
  );
};
