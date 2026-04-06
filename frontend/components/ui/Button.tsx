import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "ai";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "default",
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "outline" && "btn-outline",
        variant === "ghost" && "btn-ghost",
        variant === "ai" && "btn-ai",
        size === "sm" && "btn-sm",
        size === "lg" && "btn-lg",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="opacity-70">Loading…</span> : children}
    </button>
  );
}
