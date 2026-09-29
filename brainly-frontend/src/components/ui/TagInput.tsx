import { useState } from "react";

export interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

export function TagInput({ tags, onChange, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const normalizedInput = input.trim().toLowerCase();
  const atLimit = tags.length >= MAX_TAGS;
  const availableSuggestions = suggestions
    .filter(
      (name) =>
        !tags.includes(name) &&
        (normalizedInput ? name.includes(normalizedInput) : true)
    )
    .slice(0, 6);

  function addTag(raw: string) {
    const name = raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
    setInput("");
    if (!name || tags.includes(name) || atLimit) return;
    onChange([...tags, name]);
  }

  function removeTag(name: string) {
    onChange(tags.filter((tag) => tag !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1] ?? "");
    }
  }

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap gap-1.5 items-center px-2.5 py-2 rounded-xl border bg-slate-50 dark:bg-zinc-800/80 min-h-10 transition-smooth ${
          focused
            ? "border-primary ring-2 ring-primary/20"
            : "border-slate-200 dark:border-zinc-700"
        }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-primary-light/60 dark:bg-primary/20 text-primary dark:text-primary-light text-[11px] font-semibold"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="p-0.5 rounded hover:bg-primary/15 transition-smooth cursor-pointer"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={atLimit}
          placeholder={
            atLimit
              ? "Tag limit reached"
              : tags.length === 0
                ? "Type a tag and press Enter..."
                : ""
          }
          className="flex-1 min-w-24 bg-transparent outline-none text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 disabled:cursor-not-allowed"
        />
      </div>

      {/* Suggestions dropdown */}
      {focused && availableSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl p-1.5 animate-slideUp">
          <p className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Existing tags
          </p>
          {availableSuggestions.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(name);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-smooth cursor-pointer"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagInput;
