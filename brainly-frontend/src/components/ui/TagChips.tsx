export interface TagChipItem {
  _id: string;
  name: string;
}

interface TagChipsProps {
  tags?: TagChipItem[];
  onTagClick?: (tagId: string) => void;
  limit?: number;
}

export function TagChips({ tags, onTagClick, limit = 3 }: TagChipsProps) {
  if (!tags || tags.length === 0) return null;

  const visible = tags.slice(0, limit);
  const hiddenCount = tags.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tag) =>
        onTagClick ? (
          <button
            key={tag._id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(tag._id);
            }}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 hover:bg-primary-light/60 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-light transition-smooth cursor-pointer"
            title={`Filter by #${tag.name}`}
          >
            #{tag.name}
          </button>
        ) : (
          <span
            key={tag._id}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-500 dark:text-zinc-400"
          >
            #{tag.name}
          </span>
        )
      )}
      {hiddenCount > 0 && (
        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

export default TagChips;
