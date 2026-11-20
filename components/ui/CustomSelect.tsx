"use client";

import { forwardRef, useRef, useState, useImperativeHandle, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import {
  fieldBorder,
  fieldBorderError,
  fieldControl,
  fieldError,
  fieldHeight,
  fieldId,
  fieldLabel,
} from "@/components/ui/field";

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
  /** Adds a type-to-filter search box inside the dropdown — turn on for long option lists (projects, clients, vendors). */
  searchable?: boolean;
}

const triggerBase = `${fieldControl} ${fieldHeight} flex items-center justify-between gap-2 text-start`;

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
      searchable = false,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [query, setQuery] = useState("");
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => hiddenInputRef.current as HTMLInputElement);

    const selectId = fieldId(idProp, label);
    const errorId = error && selectId ? `${selectId}-error` : undefined;
    const selectedOption = options.find((o) => o.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    const filteredOptions =
      searchable && query.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
        : options;

    useEffect(() => {
      if (!open) return;
      setQuery("");
      const idx = filteredOptions.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
      if (searchable) {
        // let the dropdown mount first
        const t = setTimeout(() => searchInputRef.current?.focus(), 0);
        return () => clearTimeout(t);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
      setFocusedIndex(filteredOptions.length ? 0 : -1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    // The dropdown is portaled to <body> and fixed-positioned against the trigger's
    // viewport rect, so it never gets clipped by a scrollable ancestor (e.g. a Modal
    // body with overflow-y-auto) and can flip above the trigger when there's no room below.
    useEffect(() => {
      if (!open) return;
      const DROPDOWN_MAX_HEIGHT = 260;
      const updatePosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > spaceBelow;
        setDropdownStyle(
          openUp
            ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
            : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width }
        );
      };
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, [open]);

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        const insideTrigger = containerRef.current?.contains(target);
        const insideDropdown = dropdownRef.current?.contains(target);
        if (!insideTrigger && !insideDropdown) {
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

    const selectFocused = () => {
      const opt = filteredOptions[focusedIndex];
      if (!opt) return;
      onChange?.(opt.value);
      setOpen(false);
      onBlur?.();
    };

    const handleListKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => (i < filteredOptions.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => (i > 0 ? i - 1 : filteredOptions.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectFocused();
      }
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      handleListKeyDown(e);
    };

    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        {label && (
          <label
            id={selectId ? `${selectId}-label` : undefined}
            htmlFor={selectId}
            className={fieldLabel}
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
            ref={triggerRef}
            type="button"
            id={selectId}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-labelledby={label ? `${selectId}-label` : undefined}
            aria-describedby={errorId}
            className={`${triggerBase} ${error ? fieldBorderError : fieldBorder} ${!selectedOption ? "text-[var(--muted)]" : ""}`}
            onClick={() => !disabled && setOpen((o) => !o)}
            onBlur={() => {
              if (!open) onBlur?.();
            }}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className="truncate">{displayText}</span>
            <ChevronDown
              aria-hidden
              className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open &&
            dropdownStyle &&
            createPortal(
              <div
                ref={dropdownRef}
                style={dropdownStyle}
                className="animate-scale-in z-[70] overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--surface)] shadow-md"
              >
                {searchable && (
                  <div className="border-b border-[var(--border-subtle)] p-2">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      placeholder="Type to search..."
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleListKeyDown}
                      className="w-full rounded-md border-0 bg-[var(--muted-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                    />
                  </div>
                )}
                <ul
                  role="listbox"
                  className="max-h-56 overflow-auto py-1"
                  onMouseLeave={() => setFocusedIndex(-1)}
                >
                  {filteredOptions.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-[var(--muted)]">No matches</li>
                  ) : (
                    filteredOptions.map((opt, i) => (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={opt.value === value}
                        className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors duration-150 ${
                          opt.value === value
                            ? "bg-[var(--accent-muted)] font-medium text-[var(--primary)]"
                            : "text-[var(--foreground)]"
                        } ${i === focusedIndex && opt.value !== value ? "bg-[var(--muted-bg)]" : ""}`}
                        onMouseEnter={() => setFocusedIndex(i)}
                        onClick={() => {
                          onChange?.(opt.value);
                          setOpen(false);
                          onBlur?.();
                        }}
                      >
                        <span className="truncate">{opt.label}</span>
                        {opt.value === value && (
                          <Check aria-hidden className="h-4 w-4 shrink-0" />
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>,
              document.body
            )}
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
CustomSelect.displayName = "CustomSelect";
