import { FileIcon } from "../../icons/FileIcon";
import { LinkIcon } from "../../icons/LinkIcon";
import { TwitterIcon } from "../../icons/TwitterIcon";
import { YouTubeIcon } from "../../icons/YoutubeIcon";
import { DeleteIcon } from "../../icons/DeleteIcon";
import { EditIcon } from "../../icons/EditIcon";
import { ExternalLinkIcon } from "../../icons/ExternalLinkIcon";
import { StarIcon } from "../../icons/StarIcon";
import { TagChips, type TagChipItem } from "../ui/TagChips";

export interface ListViewItem {
  _id: string;
  title: string;
  link: string;
  type?: string;
  tags?: TagChipItem[];
  createdAt?: string;
}

export interface ListViewProps {
  contents: ListViewItem[];
  onDelete: (id: string) => void;
  onEdit?: (content: ListViewItem) => void;
  onTagClick?: (tagId: string) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
}

export function ListView({
  contents,
  onDelete,
  onEdit,
  onTagClick,
  favorites = [],
  onToggleFavorite,
}: ListViewProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case "youtube":
        return <YouTubeIcon size="lg" />;
      case "twitter":
        return <TwitterIcon size="lg" />;
      case "document":
        return <FileIcon size="lg" />;
      case "link":
        return <LinkIcon size="lg" />;
      default:
        return <FileIcon size="lg" />;
    }
  };

  return (
    <div className="space-y-2">
      {contents.map((content) => {
        const isHttpUrl =
          content.link &&
          (content.link.startsWith("http://") || content.link.startsWith("https://"));
        const isFavorite = favorites.includes(content._id);

        return (
          <div
            key={content._id}
            onClick={() => onEdit && onEdit(content)}
            className={`group bg-white dark:bg-zinc-900 rounded-xl p-4 transition-smooth cursor-pointer ${
              isFavorite
                ? "border-2 border-amber-400/80 dark:border-amber-500/50 shadow-xs"
                : "border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Star / Pin Button */}
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(content._id);
                  }}
                  className={`shrink-0 p-1 rounded-md transition-smooth cursor-pointer ${
                    isFavorite
                      ? "text-amber-500 dark:text-amber-400 opacity-100 scale-105"
                      : "text-slate-300 dark:text-zinc-600 hover:text-amber-500 dark:hover:text-amber-400 opacity-60 group-hover:opacity-100"
                  }`}
                  title={isFavorite ? "Unpin from top" : "Pin to top"}
                >
                  <StarIcon size="sm" filled={isFavorite} />
                </button>
              )}

              {/* Icon */}
              <div className="shrink-0 text-slate-500 dark:text-zinc-400">
                {getIcon(content.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {content.title}
                  </h3>
                  {isFavorite && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded shrink-0">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500 truncate mt-0.5 font-normal">
                  {content.link}
                </p>
                {content.tags && content.tags.length > 0 && (
                  <div className="mt-1.5">
                    <TagChips tags={content.tags} onTagClick={onTagClick} />
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="shrink-0 text-xs text-slate-400 dark:text-zinc-500 font-medium">
                {formatDate(content.createdAt)}
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-smooth">
                {isHttpUrl && (
                  <a
                    href={content.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-md text-slate-500 hover:text-primary hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-primary-light dark:hover:bg-zinc-800 transition-smooth"
                    title="Open link in new tab"
                  >
                    <ExternalLinkIcon size="sm" />
                  </a>
                )}

                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(content);
                    }}
                    className="p-1.5 rounded-md text-slate-500 hover:text-primary hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-primary-light dark:hover:bg-zinc-800 transition-smooth cursor-pointer"
                    title="Edit"
                  >
                    <EditIcon size="sm" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(content._id);
                  }}
                  className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-smooth cursor-pointer"
                  title="Delete"
                >
                  <DeleteIcon size="md" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default ListView;
