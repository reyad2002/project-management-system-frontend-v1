import { forwardRef } from "react";

const textareaBase =
  "min-h-[88px] w-full resize-y rounded-xl border bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60";
const textareaBorder = "border-[var(--border)] hover:border-[var(--muted)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20";
const textareaError = "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(({ className = "", label, error, id, ...props }, ref) => {
  const textareaId = id || (label ? label.replace(/\s/g, "-").toLowerCase() : undefined);
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`${textareaBase} ${error ? textareaError : textareaBorder} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[var(--destructive)]">{error}</p>
      )}
    </div>
  );
});
Textarea.displayName = "Textarea";
