"use client";

import { forwardRef, useRef, useState, useImperativeHandle, useEffect } from "react";
import { createPortal } from "react-dom";

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

const triggerBase =
  "flex h-9 w-full items-center justify-between rounded-lg border bg-[var(--card)] px-3 py-1.5 text-left text-sm text-[var(--foreground)] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60";
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

    const selectId = idProp || (label ? label.replace(/\s/g, "-").toLowerCase() : undefined);
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
            className="mb-1 block text-xs font-medium text-[var(--muted)]"
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
            className={`${triggerBase} ${error ? triggerError : triggerBorder} ${!selectedOption ? "text-[var(--muted)]" : ""}`}
            onClick={() => !disabled && setOpen((o) => !o)}
            onBlur={() => {
              if (!open) onBlur?.();
            }}
            onKeyDown={handleTriggerKeyDown}
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
          {open &&
            dropdownStyle &&
            createPortal(
              <div
                ref={dropdownRef}
                style={dropdownStyle}
                className="z-[70] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg"
              >
                {searchable && (
                  <div className="border-b border-[var(--border)] p-1.5">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      placeholder="Type to search..."
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleListKeyDown}
                      className="w-full rounded-lg border-0 bg-[var(--muted-bg)] px-2.5 py-1.5 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                    />
                  </div>
                )}
                <ul
                  role="listbox"
                  className="max-h-56 overflow-auto py-1"
                  onMouseLeave={() => setFocusedIndex(-1)}
                >
                  {filteredOptions.length === 0 ? (
                    <li className="px-3 py-2.5 text-sm text-[var(--muted)]">No matches</li>
                  ) : (
                    filteredOptions.map((opt, i) => (
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
                    ))
                  )}
                </ul>
              </div>,
              document.body
            )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-[var(--destructive)]">{error}</p>
        )}
      </div>
    );
  }
);
CustomSelect.displayName = "CustomSelect";
