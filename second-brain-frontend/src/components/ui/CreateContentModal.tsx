import { useEffect, useRef, useState } from "react";
import { CrossIcon } from "../../icons/CrossIcon";
import { PlusIcon } from "../../icons/PlusIcon";
import { YouTubeIcon } from "../../icons/YoutubeIcon";
import { TwitterIcon } from "../../icons/TwitterIcon";
import { FileIcon } from "../../icons/FileIcon";
import { LinkIcon } from "../../icons/LinkIcon";
import { Button } from "./Button";
import { Input } from "./Input";
import { TagInput } from "./TagInput";
import CustomDropdownTS, { type CustomOption } from "./Dropdown";
import { api, getErrorMessage } from "../../lib/api";
import { useToast } from "../../hooks/useToast";

export type ContentType = "youtube" | "twitter" | "document" | "link";

interface CreateContentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateContentModal({ onClose, onSuccess }: CreateContentModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [type, setType] = useState<ContentType>("document");
  const [tags, setTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  // The modal is mounted fresh on each open, so state starts clean already.
  useEffect(() => {
    const focusTimer = setTimeout(() => titleRef.current?.focus(), 50);

    api
      .get("/api/v1/tags")
      .then((res) => setTagSuggestions((res.data.tags || []).map((tag: { name: string }) => tag.name)))
      .catch(() => setTagSuggestions([]));

    return () => clearTimeout(focusTimer);
  }, []);

  // Close on Escape
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

  async function addContent() {
    const title = titleRef.current?.value?.trim();
    const contentValue =
      type === "document"
        ? noteRef.current?.value?.trim()
        : linkRef.current?.value?.trim();

    if (!title || !contentValue) {
      addToast(
        type === "document"
          ? "Please enter both a title and note text"
          : "Please enter both a title and link URL",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/v1/content", {
        title,
        link: contentValue,
        type,
        tags,
      });
      addToast(
        type === "document" ? "Note saved to your brain" : "Content added to your brain",
        "success"
      );
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to save content"), "error");
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
        aria-label="Create content"
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md animate-slideUp relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-light/60 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <PlusIcon size="md" />
            </div>
            <div>
              <h2 className="font-doto text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Create Content
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                {type === "document"
                  ? "Write a note or personal document"
                  : "Save a video, tweet, or web link"}
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

        {/* Form Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Title
            </label>
            <Input
              reference={titleRef}
              placeholder={
                type === "document"
                  ? "e.g. Ideas for startup architecture"
                  : "e.g. Next.js Architecture Guide"
              }
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
              onSelect={(selected) => setType(selected.id as ContentType)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {type === "document" ? "Note / Text Content" : "Link URL"}
            </label>
            {type === "document" ? (
              <textarea
                ref={noteRef}
                rows={4}
                placeholder="Write your note, thoughts, or document content here..."
                className="w-full p-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 placeholder:font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth resize-none leading-relaxed"
              />
            ) : (
              <Input
                reference={linkRef}
                placeholder={
                  type === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : type === "twitter"
                    ? "https://x.com/username/status/..."
                    : "https://..."
                }
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Tags (optional)
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
            onClick={addContent}
            disabled={loading}
            text={loading ? "Saving..." : type === "document" ? "Save Note" : "Add Content"}
            className="px-4 py-2 text-xs font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
export default CreateContentModal;
