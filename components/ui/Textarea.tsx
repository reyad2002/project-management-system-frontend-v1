import { forwardRef } from "react";
import {
  fieldBorder,
  fieldBorderError,
  fieldControl,
  fieldError,
  fieldId,
  fieldLabel,
} from "@/components/ui/field";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(({ className = "", label, error, id, ...props }, ref) => {
  const textareaId = fieldId(id, label);
  const errorId = error && textareaId ? `${textareaId}-error` : undefined;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className={fieldLabel}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`${fieldControl} min-h-20 resize-y leading-6 ${error ? fieldBorderError : fieldBorder} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className={fieldError}>
          {error}
        </p>
      )}
    </div>
  );
});
Textarea.displayName = "Textarea";
