import { resolveVideo } from "@/onboarding/video";

interface VideoEmbedProps {
  url?: string | null;
  title: string;
}

export default function VideoEmbed({ url, title }: VideoEmbedProps) {
  const video = resolveVideo(url);
  if (!video) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--serve-border)] bg-black">
      <div className="relative w-full pt-[56.25%]">
        {video.kind === "iframe" ? (
          <iframe
            src={video.src}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <video
            src={video.src}
            title={title}
            controls
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
