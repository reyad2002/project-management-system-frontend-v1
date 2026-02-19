import { forwardRef } from "react";

const inputBase =
  "flex h-10 w-full rounded-xl border bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60";
const inputBorder = "border-[var(--border)] hover:border-[var(--muted)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20";
const inputError = "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ className = "", label, error, id, ...props }, ref) => {
  const inputId = id || (label ? label.replace(/\s/g, "-").toLowerCase() : undefined);
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`${inputBase} ${error ? inputError : inputBorder} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[var(--destructive)]">{error}</p>
      )}
    </div>
  );
});
Input.displayName = "Input";
