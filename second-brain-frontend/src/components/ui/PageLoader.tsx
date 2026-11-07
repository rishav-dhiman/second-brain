export function PageLoader() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center gap-3 bg-slate-50 dark:bg-black">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
        Loading...
      </p>
    </div>
  );
}

export default PageLoader;
