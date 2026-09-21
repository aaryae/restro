import { buildAssetUrl } from "@/utils/buildAssetUrl";
import galleryIcon from "@/assets/gallery_icon.svg";
import { ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function ClearImageButton({ onClear }: { onClear: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Remove image"
      title="Remove image"
      className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-white/95 text-rose-600 shadow-sm transition hover:bg-rose-50"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClear();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClear();
        }
      }}
    >
      <X size={14} strokeWidth={2.5} />
    </span>
  );
}

/** Shared dashed upload surface used by all media pickers. */
function MediaDropzone({
  hasPreview,
  onClear,
  children,
  className,
}: {
  hasPreview: boolean;
  onClear?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-40 w-full items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-[var(--serve-border)] bg-[var(--serve-surface-2)] transition hover:border-[color-mix(in_srgb,var(--primary-color)_35%,var(--serve-border))] hover:bg-[color-mix(in_srgb,var(--serve-surface-2)_70%,white)]",
        className,
      )}
    >
      {children}
      {hasPreview && onClear ? <ClearImageButton onClear={onClear} /> : null}
    </div>
  );
}

function EmptyPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 text-[var(--serve-muted)]">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--serve-surface)] text-[var(--serve-muted)] shadow-sm ring-1 ring-[var(--serve-border)]">
        <ImageIcon size={22} strokeWidth={1.75} />
      </span>
      <span className="text-xs font-medium">Click to choose image</span>
    </div>
  );
}

export const ImageInputUI = ({
  image,
  imageMessage,
  onClear,
}: {
  image?: string;
  imageMessage?: string;
  onClear?: () => void;
}) => {
  const hasImage = Boolean(image);

  return (
    <div className="relative w-full">
      <MediaDropzone hasPreview={hasImage} onClear={onClear}>
        {hasImage ? (
          <img
            src={buildAssetUrl(image)}
            alt="Selected"
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <EmptyPlaceholder />
        )}
      </MediaDropzone>
      <p className="mt-1.5 text-left text-xs text-[var(--serve-muted)]">
        {imageMessage ?? "Allowed JPG, GIF or PNG. Max size of 1MB"}
      </p>
    </div>
  );
};

export const VideoInputUI = ({
  video,
  videoMessage,
  onClear,
}: {
  video?: string | null;
  videoMessage?: string;
  label?: string;
  onClear?: () => void;
}) => {
  const hasVideo = Boolean(video);

  return (
    <div className="relative w-full">
      <MediaDropzone hasPreview={hasVideo} onClear={onClear}>
        {hasVideo ? (
          <video
            src={buildAssetUrl(video)}
            controls
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--serve-muted)]">
            <img
              src={galleryIcon}
              alt=""
              className="h-10 w-16 opacity-70"
              onError={(e) => {
                e.currentTarget.src = galleryIcon;
              }}
            />
            <span className="text-xs font-medium">Click to choose video</span>
          </div>
        )}
      </MediaDropzone>
      <p className="mt-1.5 text-left text-xs text-[var(--serve-muted)]">
        {videoMessage ?? "Allowed MP4, WebM, OGG. Max size of 50MB"}
      </p>
    </div>
  );
};

export const MultipleImageInputUI = ({
  images,
  imageIndex,
  onClear,
  imageMessage,
}: {
  images: string | string[] | Array<{ img_url?: string }>;
  imageIndex: number;
  onClear?: () => void;
  imageMessage?: string;
}) => {
  const current = Array.isArray(images) ? images[imageIndex] : images;
  const currentPath =
    typeof current === "string"
      ? current
      : current && typeof current === "object"
        ? current.img_url
        : undefined;
  const hasImage = Boolean(currentPath);
  const count = Array.isArray(images) ? images.length : currentPath ? 1 : 0;

  return (
    <div className="relative w-full">
      <MediaDropzone hasPreview={hasImage} onClear={onClear}>
        {hasImage ? (
          <img
            src={buildAssetUrl(currentPath)}
            alt="Gallery Image"
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <EmptyPlaceholder />
        )}
        {count > 1 ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            {imageIndex + 1} / {count}
          </span>
        ) : null}
      </MediaDropzone>
      <p className="mt-1.5 text-left text-xs text-[var(--serve-muted)]">
        {imageMessage ?? "Allowed JPG, GIF or PNG. Max size of 1MB"}
      </p>
    </div>
  );
};
