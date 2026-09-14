import { forwardRef } from "react";
import {
  fieldBorder,
  fieldBorderError,
  fieldControl,
  fieldError,
  fieldHeight,
  fieldId,
  fieldLabel,
} from "@/components/ui/field";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ className = "", label, error, id, ...props }, ref) => {
  const inputId = fieldId(id, label);
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={fieldLabel}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`${fieldControl} ${fieldHeight} ${error ? fieldBorderError : fieldBorder} ${className}`}
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
Input.displayName = "Input";
