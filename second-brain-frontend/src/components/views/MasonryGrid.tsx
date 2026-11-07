import { useEffect, useRef, useState, type ReactNode } from "react";

interface MasonryGridProps<T> {
  items: T[];
  columnCount: number;
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  gap?: number;
}

// Packs items into the shortest column (Google Keep style) so cards of
// different heights leave no holes. ResizeObserver re-measures as embedded
// media (YouTube iframes, Twitter widgets) load and change height.
export function MasonryGrid<T>({
  items,
  columnCount,
  keyOf,
  renderItem,
  gap = 16,
}: MasonryGridProps<T>) {
  const wrappers = useRef(new Map<string, HTMLDivElement>());
  const heights = useRef(new Map<string, number>());
  const [assignment, setAssignment] = useState<number[]>(() =>
    items.map((_, i) => i % Math.max(1, columnCount)),
  );

  useEffect(() => {
    const compute = () => {
      if (heights.current.size === 0) return;
      const columns = new Array<number>(columnCount).fill(0);
      const next: number[] = [];
      for (const item of items) {
        const h = heights.current.get(keyOf(item)) ?? 0;
        let shortest = 0;
        for (let c = 1; c < columnCount; c++) {
          if (columns[c] < columns[shortest]) shortest = c;
        }
        next.push(shortest);
        columns[shortest] += h + gap;
      }
      setAssignment((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i])
          ? prev
          : next,
      );
    };

    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const el = entry.target as HTMLDivElement;
        const key = el.dataset.masonryKey;
        if (!key) continue;
        const h = el.offsetHeight;
        if (heights.current.get(key) !== h) {
          heights.current.set(key, h);
          changed = true;
        }
      }
      if (changed) compute();
    });

    wrappers.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, columnCount, gap, keyOf]);

  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => {
    columns[assignment[i] ?? i % columnCount].push(item);
  });

  const setWrapper = (key: string) => (el: HTMLDivElement | null) => {
    if (el) wrappers.current.set(key, el);
    else wrappers.current.delete(key);
  };

  return (
    <div className="flex items-start overflow-x-auto" style={{ gap }}>
      {columns.map((col, i) => (
        // 288px floor: a tweet embed needs ~250px + 56px of card padding to
        // render uncut, and 288 keeps every breakpoint's natural width
        // scroll-free. Narrower viewports scroll the grid horizontally
        // instead of crushing embeds.
        <div key={i} className="flex min-w-[288px] flex-1 flex-col" style={{ gap }}>
          {col.map((item) => {
            const key = keyOf(item);
            return (
              <div key={key} data-masonry-key={key} ref={setWrapper(key)} className="min-w-0">
                {renderItem(item)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const BREAKPOINTS: [string, number][] = [
  ["(min-width: 1280px)", 4],
  ["(min-width: 1024px)", 3],
  ["(min-width: 640px)", 2],
];

export function useColumnCount(): number {
  const getCount = () => {
    for (const [query, count] of BREAKPOINTS) {
      if (window.matchMedia(query).matches) return count;
    }
    return 1;
  };
  const [count, setCount] = useState(getCount);
  useEffect(() => {
    const onResize = () => setCount(getCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return count;
}
