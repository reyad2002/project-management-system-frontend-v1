"use client";

import { forwardRef, useRef, useState, useImperativeHandle, useEffect } from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  options: CustomSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const triggerBase =
  "flex h-10 w-full items-center justify-between rounded-xl border bg-[var(--card)] px-3 py-2 text-left text-sm text-[var(--foreground)] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60";
const triggerBorder = "border-[var(--border)] hover:border-[var(--muted)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20";
const triggerError = "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20";

export const CustomSelect = forwardRef<HTMLInputElement, CustomSelectProps>(
  (
    {
      options,
      value = "",
      onChange,
      onBlur,
      name,
      id: idProp,
      label,
      error,
      placeholder = "Select...",
      disabled = false,
      className = "",
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => hiddenInputRef.current as HTMLInputElement);

    const selectId = idProp || (label ? label.replace(/\s/g, "-").toLowerCase() : undefined);
    const selectedOption = options.find((o) => o.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    useEffect(() => {
      if (!open) return;
      const idx = options.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }, [open, value, options]);

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          onBlur?.();
        }
      };
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          onBlur?.();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [open, onBlur]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => (i < options.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => (i > 0 ? i - 1 : options.length - 1));
      } else if (e.key === "Enter" && focusedIndex >= 0 && options[focusedIndex]) {
        e.preventDefault();
        onChange?.(options[focusedIndex].value);
        setOpen(false);
        onBlur?.();
      }
    };

    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        {label && (
          <label
            id={selectId ? `${selectId}-label` : undefined}
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={value}
          readOnly
          aria-hidden
        />
        <div className="relative">
          <button
            type="button"
            id={selectId}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-labelledby={label ? `${selectId}-label` : undefined}
            className={`${triggerBase} ${error ? triggerError : triggerBorder} ${!selectedOption ? "text-[var(--muted)]" : ""}`}
            onClick={() => !disabled && setOpen((o) => !o)}
            onBlur={() => {
              if (!open) onBlur?.();
            }}
            onKeyDown={handleKeyDown}
          >
            <span className="truncate">{displayText}</span>
            <svg
              className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <ul
              role="listbox"
              className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg"
              onMouseLeave={() => setFocusedIndex(-1)}
            >
              {options.map((opt, i) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  className={`cursor-pointer px-3 py-2.5 text-sm transition-colors ${
                    opt.value === value
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                      : "text-[var(--foreground)] hover:bg-[var(--muted-bg)]"
                  } ${i === focusedIndex ? "bg-[var(--muted-bg)]" : ""}`}
                  onMouseEnter={() => setFocusedIndex(i)}
                  onClick={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                    onBlur?.();
                  }}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[var(--destructive)]">{error}</p>
        )}
      </div>
    );
  }
);
CustomSelect.displayName = "CustomSelect";
