import { DeleteIcon } from "../../icons/DeleteIcon";
import { EditIcon } from "../../icons/EditIcon";
import { FileIcon } from "../../icons/FileIcon";
import { LinkIcon } from "../../icons/LinkIcon";
import { ExternalLinkIcon } from "../../icons/ExternalLinkIcon";
import { TagIcon } from "../../icons/TagIcon";
import { TwitterIcon } from "../../icons/TwitterIcon";
import { YouTubeIcon } from "../../icons/YoutubeIcon";
import { api } from "../../lib/api";
import { memo, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { getYouTubeEmbedUrl } from "../../utils/youtube";
import { YouTubeEmbed, TweetEmbed } from "./LazyEmbed";
import { TagChips, type TagChipItem } from "./TagChips";

export type PostType = "youtube" | "twitter" | "document" | "link";

export interface CardProps {
  contentId: string;
  title: string;
  link: string;
  type?: PostType;
  tags?: TagChipItem[];
  onTagClick?: (tagId: string) => void;
  onDelete?: (contentId: string) => void;
  onEdit?: (contentId: string) => void;
  createdAt?: string;
  readOnly?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (contentId: string) => void;
}

export const Card = memo(function Card({
  contentId,
  title,
  link,
  type,
  tags,
  onTagClick,
  onDelete,
  onEdit,
  createdAt,
  readOnly = false,
  isFavorite = false,
  onToggleFavorite,
}: CardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;

    setIsDeleting(true);
    try {
      await api.delete("/api/v1/content", {
        data: { contentId },
      });
      addToast("Content deleted successfully", "success");
      if (onDelete) {
        onDelete(contentId);
      }
    } catch {
      addToast("Failed to delete content", "error");
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;

    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayMs = 1000 * 60 * 60 * 24;
    const diffDays = Math.max(
      0,
      Math.round((startOfDay(new Date()) - startOfDay(date)) / dayMs)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const isHttpUrl = link && (link.startsWith("http://") || link.startsWith("https://"));
  const youTubeEmbedUrl = type === "youtube" ? getYouTubeEmbedUrl(link) : null;

  return (
    <div
      onClick={() => {
        if (!readOnly && onEdit) {
          onEdit(contentId);
        }
      }}
      className={`w-full h-fit bg-white dark:bg-zinc-900 rounded-xl shadow-xs transition-smooth flex flex-col group p-4 relative ${
        isFavorite
          ? "border-2 border-amber-400/80 dark:border-amber-500/50 shadow-sm"
          : "border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md"
      } ${!readOnly ? "cursor-pointer" : ""}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start pb-3">
        <div className="flex items-center flex-1 min-w-0 pr-2">
          <div className="pr-2 text-slate-500 dark:text-zinc-400 shrink-0">
            {type === "youtube" ? (
              <YouTubeIcon size="lg" />
            ) : type === "twitter" ? (
              <TwitterIcon size="lg" />
            ) : type === "document" ? (
              <FileIcon size="lg" />
            ) : type === "link" ? (
              <LinkIcon size="lg" />
            ) : (
              <TagIcon size="lg" />
            )}
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate flex-1">
            {title}
          </div>
        </div>

        {/* Favorite / Pin Button (Only when not read-only) */}
        {!readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleFavorite) {
                onToggleFavorite(contentId);
              }
            }}
            className={`shrink-0 p-1 rounded-md transition-smooth cursor-pointer ${
              isFavorite
                ? "text-amber-500 dark:text-amber-400 opacity-100 scale-110"
                : "text-slate-300 dark:text-zinc-600 hover:text-amber-500 dark:hover:text-amber-400 opacity-60 group-hover:opacity-100"
            }`}
            title={isFavorite ? "Unfavorite (unpin)" : "Add to favorites (pin to top)"}
          >
            <svg
              className="w-4 h-4"
              fill={isFavorite ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content Preview */}
      <div className="mb-3">
        {type === "youtube" ? (
          youTubeEmbedUrl ? (
            <YouTubeEmbed link={link} title={title} />
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-200 dark:border-zinc-700">
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate font-mono">{link}</p>
            </div>
          )
        ) : type === "twitter" ? (
          <TweetEmbed link={link} />
        ) : type === "document" ? (
          <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 transition-smooth">
            <p className="text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap line-clamp-5 leading-relaxed font-normal">
              {link}
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-200 dark:border-zinc-700">
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate font-mono">{link}</p>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <TagChips tags={tags} onTagClick={onTagClick} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80 mt-auto">
        <div className="flex items-center gap-2">
          {createdAt && (
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
              {formatDate(createdAt)}
            </span>
          )}
          {isFavorite && (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
              Pinned
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-smooth">
          {/* Open external link in new tab */}
          {isHttpUrl && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-slate-500 hover:text-primary hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-primary-light dark:hover:bg-zinc-800 transition-smooth"
              title="Open link in new tab"
            >
              <ExternalLinkIcon size="sm" />
            </a>
          )}

          {/* Edit Button (Google Keep style, only when not read-only) */}
          {!readOnly && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(contentId);
              }}
              className="p-1.5 rounded-md text-slate-500 hover:text-primary hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-primary-light dark:hover:bg-zinc-800 transition-smooth cursor-pointer"
              title="Edit note"
            >
              <EditIcon size="sm" />
            </button>
          )}

          {/* Delete Button (NEVER rendered when readOnly is true) */}
          {!readOnly && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`p-1.5 rounded-md transition-smooth cursor-pointer ${
                isDeleting
                  ? "opacity-50 cursor-not-allowed text-slate-400"
                  : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30"
              }`}
              title="Delete"
            >
              <DeleteIcon size="md" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
export default Card;
