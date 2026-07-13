import { buildAssetUrl } from "@/utils/buildAssetUrl";
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
            src={buildAssetUrl(image)}
            alt="Gallery Icon"
            className="object-contain h-full w-full p-[1rem]"
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
            src={buildAssetUrl(video)}
            controls
            className="object-contain h-full w-full p-[1rem]"
          />
        ) : (
          <div className="flex flex-col items-center">
            <img
              src={galleryIcon}
              alt="Video Icon"
              className="h-[3rem] w-[5rem]"
              onError={(e) => {
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
  images: string | string[] | Array<{ img_url?: string }>;
  imageIndex: number;
}) => {
  const current = Array.isArray(images) ? images[imageIndex] : images;
  const currentPath =
    typeof current === "string"
      ? current
      : current && typeof current === "object"
        ? current.img_url
        : undefined;

  return (
    <div
      className={`flex h-[10rem] w-[25rem] items-center justify-center rounded-[6px] border border-dashed border-[#C9CBD1]`}
    >
      {currentPath ? (
        <img
          src={buildAssetUrl(currentPath)}
          alt="Gallery Image"
          className="h-full w-full object-contain p-[1rem]"
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
