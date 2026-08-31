export type VideoKind = "iframe" | "file";

export interface ResolvedVideo {
  kind: VideoKind;
  src: string;
}

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com"];

/**
 * Optional product intro video, configured per deployment:
 *   VITE_ONBOARDING_VIDEO_URL=https://youtu.be/xxxx
 */
export const INTRO_VIDEO_URL: string = String(
  import.meta.env.VITE_ONBOARDING_VIDEO_URL || "",
).trim();

/** Normalise a share URL into something an <iframe> or <video> can play. */
export function resolveVideo(rawUrl: string | undefined | null): ResolvedVideo | null {
  const url = String(rawUrl || "").trim();
  if (!url) return null;

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return { kind: "file", src: url };
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "");
      return id ? { kind: "iframe", src: `https://www.youtube.com/embed/${id}` } : null;
    }

    if (YOUTUBE_HOSTS.includes(host)) {
      if (parsed.pathname.startsWith("/embed/")) {
        return { kind: "iframe", src: url };
      }
      const id = parsed.searchParams.get("v");
      return id ? { kind: "iframe", src: `https://www.youtube.com/embed/${id}` } : null;
    }

    if (host.endsWith("vimeo.com")) {
      if (host === "player.vimeo.com") return { kind: "iframe", src: url };
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? { kind: "iframe", src: `https://player.vimeo.com/video/${id}` } : null;
    }

    return { kind: "iframe", src: url };
  } catch {
    return null;
  }
}
