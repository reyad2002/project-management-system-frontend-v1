import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

/*
 * Focus is handled globally in globals.css (:focus-visible outline + offset), so no
 * per-variant ring classes here — that also removes the ring-offset-colour bug the
 * old implementation had on dark backgrounds.
 */
const base =
  "relative inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs hover:bg-[var(--primary-hover)] active:shadow-none",
  secondary:
    "bg-[var(--muted-bg)] text-[var(--foreground)] hover:bg-[var(--surface-sunken)] active:bg-[var(--surface-sunken)]",
  outline:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--muted)] hover:bg-[var(--muted-bg)]",
  ghost:
    "text-[var(--foreground)] hover:bg-[var(--muted-bg)] active:bg-[var(--surface-sunken)]",
  destructive:
    "bg-[var(--destructive)] text-[var(--on-destructive)] shadow-xs hover:bg-[var(--destructive-hover)] active:shadow-none",
};

const sizes = {
  sm: "h-8 px-3 text-sm pointer-coarse:h-10",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="absolute h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        <span className={`inline-flex items-center gap-2 ${loading ? "invisible" : ""}`}>
          {children}
        </span>
      </button>
    );
  }
);
Button.displayName = "Button";
