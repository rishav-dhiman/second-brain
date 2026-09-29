export function Input({
  onChange,
  placeholder,
  reference,
  type = "text",
}: {
  placeholder: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reference?: React.Ref<HTMLInputElement>;
  type?: string;
}) {
  return (
    <input
      ref={reference}
      type={type}
      placeholder={placeholder}
      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 placeholder:font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth"
      onChange={onChange}
    />
  );
}
export default Input;