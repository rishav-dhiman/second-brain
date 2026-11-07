import { useEffect, useState } from "react";
import { CrossIcon } from "../../icons/CrossIcon";
import { EditIcon } from "../../icons/EditIcon";
import { YouTubeIcon } from "../../icons/YoutubeIcon";
import { TwitterIcon } from "../../icons/TwitterIcon";
import { FileIcon } from "../../icons/FileIcon";
import { LinkIcon } from "../../icons/LinkIcon";
import { Button } from "./Button";
import { TagInput } from "./TagInput";
import CustomDropdownTS, { type CustomOption } from "./Dropdown";
import { api, getErrorMessage } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import type { PostType } from "./Card";
import type { TagChipItem } from "./TagChips";

export interface EditableContent {
  _id: string;
  title: string;
  link: string;
  type: PostType;
  tags?: TagChipItem[];
}

interface EditContentModalProps {
  content: EditableContent;
  onClose: () => void;
  onSuccess?: (updated: EditableContent) => void;
}

export function EditContentModal({
  content,
  onClose,
  onSuccess,
}: EditContentModalProps) {
  // The modal is mounted fresh per opened item, so props seed the initial state.
  const [title, setTitle] = useState(content.title || "");
  const [linkOrNote, setLinkOrNote] = useState(content.link || "");
  const [type, setType] = useState<PostType>(content.type || "document");
  const [tags, setTags] = useState<string[]>(
    (content.tags || []).map((tag) => tag.name),
  );
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    api
      .get("/api/v1/tags")
      .then((res) => setTagSuggestions((res.data.tags || []).map((tag: { name: string }) => tag.name)))
      .catch(() => setTagSuggestions([]));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const dropdownOptions: CustomOption[] = [
    {
      id: "document",
      label: "Document / Note",
      icon: <FileIcon size="md" />,
    },
    {
      id: "youtube",
      label: "YouTube Video",
      icon: <YouTubeIcon size="md" />,
    },
    {
      id: "twitter",
      label: "Tweet / X Post",
      icon: <TwitterIcon size="md" />,
    },
    {
      id: "link",
      label: "Web Link",
      icon: <LinkIcon size="md" />,
    },
  ];

  async function handleSave() {
    const trimmedTitle = title.trim();
    const trimmedLink = linkOrNote.trim();

    if (!trimmedTitle || !trimmedLink) {
      addToast(
        type === "document"
          ? "Please provide both title and note content"
          : "Please provide both title and link URL",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.put("/api/v1/content", {
        contentId: content._id,
        title: trimmedTitle,
        link: trimmedLink,
        type,
        tags,
      });

      addToast("Card updated successfully", "success");
      onClose();
      if (onSuccess) {
        onSuccess(
          response.data.content || {
            _id: content._id,
            title: trimmedTitle,
            link: trimmedLink,
            type,
          }
        );
      }
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to update content"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit content"
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg animate-slideUp relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-light/60 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <EditIcon size="md" />
            </div>
            <div>
              <h2 className="font-doto text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Edit Content
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Update details, notes, or media links
              </p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-smooth cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CrossIcon size="md" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title..."
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Content Type
            </label>
            <CustomDropdownTS
              options={dropdownOptions}
              selectedId={type}
              placeholder="Select content type..."
              onSelect={(selected) => setType(selected.id as PostType)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {type === "document" ? "Note / Text Content" : "Link URL"}
            </label>
            {type === "document" ? (
              <textarea
                rows={6}
                value={linkOrNote}
                onChange={(e) => setLinkOrNote(e.target.value)}
                placeholder="Write your note, thoughts, or document content here..."
                className="w-full p-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 placeholder:font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth resize-none leading-relaxed"
              />
            ) : (
              <input
                type="text"
                value={linkOrNote}
                onChange={(e) => setLinkOrNote(e.target.value)}
                placeholder={
                  type === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : type === "twitter"
                    ? "https://x.com/username/status/..."
                    : "https://..."
                }
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Tags
            </label>
            <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50/70 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-smooth cursor-pointer"
          >
            Cancel
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={loading}
            text={loading ? "Saving..." : "Save Changes"}
            className="px-4 py-2 text-xs font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
export default EditContentModal;
