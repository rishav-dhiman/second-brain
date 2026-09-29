import type { ReactElement } from "react";

type Variants = "primary" | "secondary" | "outline" | "danger";

interface ButtonProps {
  variant: Variants;
  size?: "sm" | "md" | "lg";
  text: string;
  startIcon?: ReactElement;
  endIcon?: ReactElement;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantStyles: Record<Variants, string> = {
  primary:
    "bg-primary-light text-primary hover:bg-primary-light/80 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 border border-primary/20",
  secondary:
    "bg-primary text-white hover:bg-primary-hover shadow-sm border border-transparent",
  outline:
    "bg-transparent text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800",
  danger:
    "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50",
};

const sizeStyles = {
  sm: "px-2.5 py-1 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2.5",
};

export const Button = ({
  variant,
  size = "md",
  text,
  startIcon,
  endIcon,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {startIcon && <span className="shrink-0">{startIcon}</span>}
      <span>{text}</span>
      {endIcon && <span className="shrink-0">{endIcon}</span>}
    </button>
  );
};
export default Button;
