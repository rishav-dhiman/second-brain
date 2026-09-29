import { useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-black text-slate-900 dark:text-white p-6 text-center">
      <p className="font-doto text-5xl font-extrabold text-primary mb-2">404</p>
      <h1 className="text-base font-bold mb-1">Page not found</h1>
      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-5">
        The page you are looking for does not exist or has been moved.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-smooth cursor-pointer"
      >
        Back to home
      </button>
    </div>
  );
}

export default NotFound;
