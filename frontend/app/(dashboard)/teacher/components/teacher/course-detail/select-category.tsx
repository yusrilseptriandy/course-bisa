"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

export type SelectOption = {
  id: string;
  name: string;
};

type SelectProps = {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

export default function CategorySelect({
  options,
  value,
  onChange,
  placeholder = "Pilih Kategori",
  error,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.id === value);

  // Close when click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) =>
        prev < options.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => (prev > 0 ? prev - 1 : 0));
    }

    if (e.key === "Enter" && highlighted >= 0) {
      onChange(options[highlighted].id);
      setOpen(false);
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          w-full text-sm
          flex items-center justify-between
          transition-all duration-200
          border
          ${
            error
              ? "border-red-500"
              : "border-0"
          }
          focus:outline-none
        `}
      >
        <span
          className={
            selected
              ? "text-black dark:text-white"
              : "text-gray-400"
          }
        >
          {selected?.name || placeholder}
        </span>

        <Icon
          icon="lucide:chevron-down"
          width={18}
          className={`transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`
          absolute mt-2 w-full z-50
          bg-white dark:bg-zinc-900
          border border-gray-200 dark:border-zinc-700
          rounded-xl shadow-xl
          overflow-hidden
          transition-all duration-200 origin-top
          ${
            open
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }
        `}
      >
        {options.map((opt, index) => {
          const isActive = highlighted === index;
          const isSelected = value === opt.id;

          return (
            <div
              key={opt.id}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`
                px-4 py-3 text-sm cursor-pointer transition-all
                ${
                  isActive
                    ? "bg-gray-100 dark:bg-zinc-800"
                    : ""
                }
                ${
                  isSelected
                    ? "font-semibold text-black dark:text-white"
                    : "text-gray-600 dark:text-gray-300"
                }
              `}
            >
              {opt.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}