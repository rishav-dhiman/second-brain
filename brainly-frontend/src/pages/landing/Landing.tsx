import { Link } from "react-router-dom";
import { BrainLogo } from "../../icons/BrainLogo";
import { FileIcon } from "../../icons/FileIcon";
import { LinkIcon } from "../../icons/LinkIcon";
import { PlusIcon } from "../../icons/PlusIcon";
import { ShareIcon } from "../../icons/ShareIcon";
import { StarIcon } from "../../icons/StarIcon";
import { TwitterIcon } from "../../icons/TwitterIcon";
import { YouTubeIcon } from "../../icons/YoutubeIcon";

const GRID_FEATURES = [
  {
    title: "Command palette",
    mono: "⌘K",
    description:
      "Search titles, links, and tags as you type. Debounced, keyboard-first, no page reloads.",
  },
  {
    title: "Tags with live counts",
    mono: "#",
    description:
      "The sidebar counts every tag and filters in one click. Counts stay honest as the brain grows.",
  },
  {
    title: "Pin favorites",
    mono: "★",
    description:
      "Star any card to pin it to the top of your list. Pinned order and state persist locally.",
  },
  {
    title: "Grid & list views",
    mono: "V",
    description:
      "Press V anywhere to flip between a card grid and a dense list. Both stay fully editable.",
  },
  {
    title: "Expiring share links",
    mono: "7d",
    description:
      "Pick an expiry from one hour to never. Change it in place, regenerate, or revoke anytime.",
  },
  {
    title: "Dark mode",
    mono: "◐",
    description:
      "A class-based toggle that swaps the whole UI instantly — purple accents included.",
  },
];

const SHORTCUTS = [
  { keys: "⌘K", label: "Search your brain" },
  { keys: "⌘N", label: "New content" },
  { keys: "V", label: "Grid / list" },
  { keys: "Esc", label: "Close anything" },
];

const SIDEBAR_ITEMS = [
  { label: "All Notes", count: 24, icon: null as "star" | null, active: true },
  { label: "Favorites", count: 3, icon: "star" as const, active: false },
];

const SIDEBAR_TAGS = [
  { name: "learning", count: 12 },
  { name: "pkm", count: 8 },
  { name: "work", count: 4 },
];

function MockCard({
  icon,
  title,
  children,
  tags,
  date,
  pinned = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tags: string[];
  date: string;
  pinned?: boolean;
}) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-xl p-3 flex flex-col transition-smooth ${
        pinned
          ? "border-2 border-amber-400/80 dark:border-amber-500/50"
          : "border border-slate-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center gap-2 pb-2.5 min-w-0">
        <span className="text-slate-500 dark:text-zinc-400 shrink-0">{icon}</span>
        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate flex-1">
          {title}
        </span>
        <span
          className={`shrink-0 ${
            pinned
              ? "text-amber-500 dark:text-amber-400"
              : "text-slate-300 dark:text-zinc-600"
          }`}
        >
          <StarIcon size="sm" filled={pinned} />
        </span>
      </div>
      <div className="mb-2.5">{children}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-500 dark:text-zinc-400"
          >
            #{tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 mt-auto">
        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
          {date}
        </span>
        {pinned && (
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
            Pinned
          </span>
        )}
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto h-14 px-6 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <BrainLogo size="sm" />
            <span className="font-doto text-sm font-bold tracking-tight">
              Second Brain
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/signin"
              className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center transition-smooth"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-smooth"
            >
              <PlusIcon size="sm" />
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          v1.0 — now in beta
        </div>
        <h1 className="font-doto text-5xl md:text-7xl font-bold tracking-tight leading-none">
          Save it. Tag it.
          <br />
          <span className="text-primary dark:text-darkpurple">Find it. Share it.</span>
        </h1>
        <p className="mt-6 text-sm md:text-base text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          A second brain for the links you keep meaning to revisit. No feed, no
          algorithm, no notifications — just your own searchable library.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/signup"
            className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-smooth"
          >
            Start building
            <span aria-hidden>→</span>
          </Link>
          <Link
            to="/signin"
            className="h-10 px-5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-semibold flex items-center transition-smooth"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Dashboard mockup */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
          {/* Window bar */}
          <div className="h-9 px-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-zinc-700" />
            <span className="ml-3 text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate">
              secondbrain.app/dashboard
            </span>
          </div>

          {/* App header */}
          <div className="h-14 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex-1 max-w-xs relative hidden sm:block">
              <svg
                className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="w-full h-8 pl-8 pr-12 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[11px] text-slate-400 dark:text-zinc-500 flex items-center">
                Search content…
              </div>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                ⌘K
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="h-8 px-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-[11px] font-semibold hidden sm:flex items-center gap-1.5">
                <ShareIcon size="sm" />
                Share Brain
              </span>
              <span className="h-8 px-3 rounded-lg bg-primary text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs">
                <PlusIcon size="sm" />
                Add Content
              </span>
            </div>
          </div>

          {/* App body */}
          <div className="flex bg-slate-50 dark:bg-black">
            {/* Sidebar */}
            <aside className="w-40 shrink-0 border-r border-slate-200 dark:border-zinc-800 p-3 hidden md:block">
              <div className="space-y-0.5">
                {SIDEBAR_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between px-2.5 h-8 rounded-lg text-[11px] font-semibold ${
                      item.active
                        ? "bg-primary-light/60 dark:bg-primary/20 text-primary dark:text-primary-light"
                        : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {item.icon === "star" && (
                        <StarIcon size="sm" />
                      )}
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] ${
                        item.active
                          ? "text-primary/70 dark:text-primary-light/70"
                          : "text-slate-400 dark:text-zinc-500"
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="my-3 border-t border-slate-200 dark:border-zinc-800" />
              <p className="px-2.5 mb-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Tags
              </p>
              <div className="space-y-0.5">
                {SIDEBAR_TAGS.map((tag) => (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between px-2.5 h-7 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                  >
                    <span>#{tag.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {tag.count}
                    </span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Cards */}
            <div className="flex-1 p-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <MockCard
                icon={<YouTubeIcon size="lg" />}
                title="How to build a second brain"
                tags={["learning"]}
                date="Today"
                pinned
              >
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-slate-200 dark:border-zinc-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white/90"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </MockCard>

              <MockCard
                icon={<FileIcon size="lg" />}
                title="Ideas for startup architecture"
                tags={["pkm", "work"]}
                date="Yesterday"
              >
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-200 dark:border-zinc-700">
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-4">
                    Keep the API stateless so it can scale horizontally. Queue
                    anything slow, cache the hot reads, and never block a
                    request on email…
                  </p>
                </div>
              </MockCard>

              <MockCard
                icon={<TwitterIcon size="lg" />}
                title="Thread: system design myths"
                tags={["learning"]}
                date="2d ago"
              >
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-200 dark:border-zinc-700">
                  <p className="text-[10px] text-primary truncate font-mono">
                    x.com/devops_guru/status/…
                  </p>
                </div>
              </MockCard>

              <MockCard
                icon={<LinkIcon size="lg" />}
                title="Postgres indexing guide"
                tags={["work"]}
                date="1w ago"
              >
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-200 dark:border-zinc-700">
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate font-mono">
                    use-the-index-luke.com/sql/…
                  </p>
                </div>
              </MockCard>
            </div>
          </div>
        </div>
      </section>

      {/* Share modal + shortcuts */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* Share brain panel */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-light/60 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center shrink-0">
                  <ShareIcon size="md" />
                </div>
                <div>
                  <h3 className="font-doto text-sm font-bold tracking-tight">
                    Share Second Brain
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Manage your public link
                  </p>
                </div>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700">
                <span className="flex-1 text-[11px] text-slate-600 dark:text-zinc-300 font-mono px-2.5 truncate select-all">
                  secondbrain.app/brain/8f3k2m
                </span>
                <span className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white transition-smooth shrink-0">
                  Copy
                </span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  6d 23h left
                </span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Shared Sep 22
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {["Change expiry", "Regenerate", "Revoke"].map((action) => (
                  <span
                    key={action}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold ${
                      action === "Revoke"
                        ? "border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400"
                        : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300"
                    }`}
                  >
                    {action}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">
                Anyone with the link views your collection read-only. They
                can't edit, delete, or modify anything.
              </p>
            </div>
          </div>

          {/* Shortcuts panel */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-5">
            <h3 className="font-doto text-sm font-bold tracking-tight mb-4">
              Built for the keyboard
            </h3>
            <div className="space-y-3">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="flex items-center justify-between">
                  <span className="px-2 py-1 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-[11px] font-mono font-bold text-slate-600 dark:text-zinc-300">
                    {shortcut.keys}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                    {shortcut.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">
                Every modal closes with Esc, every action confirms in place —
                the whole app works without touching the mouse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid (thin borders) */}
      <section className="border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-doto text-xs font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-zinc-500 mb-10 text-center">
            Everything, nothing more
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {GRID_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="border-b border-r border-slate-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950 hover:bg-primary-light/30 dark:hover:bg-primary/10 transition-smooth"
              >
                <span className="inline-flex px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-[10px] font-mono font-bold text-primary dark:text-primary-light mb-4">
                  {feature.mono}
                </span>
                <h3 className="text-sm font-bold mb-1.5">{feature.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="font-doto text-3xl md:text-4xl font-bold tracking-tight">
            Ready to remember?
          </h2>
          <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            free while in beta · no credit card · takes a minute
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-smooth"
            >
              Start building
              <span aria-hidden>→</span>
            </Link>
            <Link
              to="/signin"
              className="h-10 px-5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-semibold flex items-center transition-smooth"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
            <BrainLogo size="sm" />
            Second Brain — your links, remembered
          </span>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
            © 2026
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
