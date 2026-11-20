import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import {
  fieldBorder,
  fieldBorderError,
  fieldControl,
  fieldError,
  fieldHeight,
  fieldId,
  fieldLabel,
} from "@/components/ui/field";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, id, ...props }, ref) => {
    const selectId = fieldId(id, label);
    const errorId = error && selectId ? `${selectId}-error` : undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className={fieldLabel}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={`${fieldControl} ${fieldHeight} appearance-none pe-10 ${error ? fieldBorderError : fieldBorder} ${className}`}
            {...props}
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className={fieldError}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
