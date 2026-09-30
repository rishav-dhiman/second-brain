const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

// Returns null when the link is not YouTube or has no extractable video id.
export function getYouTubeVideoId(rawLink: string): string | null {
  const trimmed = rawLink?.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const isShortHost = host === "youtu.be";
  const isYoutubeHost = host === "youtube.com" || host.endsWith(".youtube.com");
  if (!isShortHost && !isYoutubeHost) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";

  let videoId: string | null = null;
  if (first === "watch") {
    videoId = url.searchParams.get("v");
  } else if (first === "embed" || first === "shorts" || first === "live" || first === "v") {
    videoId = segments[1] ?? null;
  } else if (isShortHost) {
    videoId = first;
  }

  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) return null;

  return videoId;
}

export function getYouTubeEmbedUrl(rawLink: string): string | null {
  const videoId = getYouTubeVideoId(rawLink);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}
