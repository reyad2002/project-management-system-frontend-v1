import { forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(({ className = "", label, error, id, ...props }, ref) => {
  const textareaId = id || (label ? label.replace(/\s/g, "-").toLowerCase() : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent min-h-[80px] ${error ? "border-[var(--destructive)]" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[var(--destructive)]">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";
