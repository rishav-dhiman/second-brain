import { useState } from "react";
import { TwitterIcon } from "../../icons/TwitterIcon";
import { getYouTubeEmbedUrl, getYouTubeVideoId } from "../../utils/youtube";

interface YouTubeEmbedProps {
  link: string;
  title: string;
}

// Click-to-load facade: the video's own thumbnail (a few KB) stands in for the
// ~1 MB player iframe, which only mounts after the user clicks.
export function YouTubeEmbed({ link, title }: YouTubeEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const videoId = getYouTubeVideoId(link);
  const embedUrl = getYouTubeEmbedUrl(link);

  if (loaded && embedUrl) {
    return (
      <div
        className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-slate-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          className="w-full h-full block"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setLoaded(true);
      }}
      className="group relative block w-full aspect-video rounded-lg overflow-hidden bg-black border border-slate-200 dark:border-zinc-800 cursor-pointer"
      aria-label={`Play video: ${title}`}
      title="Click to load video"
    >
      {videoId && (
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-smooth group-hover:scale-[1.03] group-hover:opacity-90"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center justify-center h-11 w-16 rounded-xl bg-red-600 text-white shadow-lg transition-smooth group-hover:scale-110">
          <svg
            className="w-5 h-5 translate-x-[1px]"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

interface TweetEmbedProps {
  link: string;
}

// Same idea for tweets: the blockquote (auto-hydrated by the widgets.js DOM
// observer) only enters the DOM on click instead of every card mounting a
// tweet iframe up front.
export function TweetEmbed({ link }: TweetEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <div
        className="tweet-embed p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-200 dark:border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <blockquote className="twitter-tweet" data-dnt="true">
          <a href={link} className="text-xs text-primary hover:underline">
            View Tweet
          </a>
        </blockquote>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setLoaded(true);
      }}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-600 transition-smooth cursor-pointer text-left"
      aria-label="Load tweet"
      title="Click to load tweet"
    >
      <span className="shrink-0 text-sky-500 dark:text-sky-400">
        <TwitterIcon size="lg" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold text-slate-700 dark:text-zinc-200">
          Tweet embed
        </span>
        <span className="block text-[11px] text-slate-400 dark:text-zinc-500 truncate">
          {link}
        </span>
      </span>
      <span className="shrink-0 text-[11px] font-bold text-primary">Load</span>
    </button>
  );
}
