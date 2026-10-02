"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
    colorDot?: string; // tailwind color class e.g. "bg-emerald-500"
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    size?: "sm" | "md";
    dropdownWidthClass?: string;
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Pilih opsi...",
    className = "",
    size = "md",
    dropdownWidthClass = "w-full min-w-[140px]",
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((o) => o.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setHighlightedIndex((prev) =>
                        prev < options.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setHighlightedIndex((prev) =>
                        prev > 0 ? prev - 1 : options.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                        onChange(options[highlightedIndex].value);
                        setIsOpen(false);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    setIsOpen(false);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, highlightedIndex, options, onChange]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current && highlightedIndex >= 0) {
            const items = listRef.current.querySelectorAll("li");
            items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
        }
    }, [highlightedIndex, isOpen]);

    // Reset highlight when opening
    useEffect(() => {
        if (isOpen) {
            const idx = options.findIndex((o) => o.value === value);
            setHighlightedIndex(idx >= 0 ? idx : 0);
        }
    }, [isOpen]);

    const sizeClasses = size === "sm"
        ? "px-2.5 py-1.5 text-xs"
        : "px-3 py-2 text-xs";

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 ${sizeClasses} rounded-xl border bg-white font-semibold text-slate-800 transition-all duration-150 focus:outline-none ${
                    isOpen
                        ? "border-teal-400 ring-2 ring-teal-500/20 shadow-sm"
                        : "border-slate-300 hover:border-slate-400 shadow-2xs"
                }`}
            >
                <span className="flex items-center gap-2 min-w-0 truncate">
                    {selectedOption?.colorDot && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOption.colorDot}`} />
                    )}
                    {selectedOption?.icon && (
                        <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
                    )}
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </span>
                <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className={`absolute z-50 mt-1.5 ${dropdownWidthClass} rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden`}>
                    <ul
                        ref={listRef}
                        className="py-1 max-h-[220px] overflow-y-auto no-scrollbar"
                        role="listbox"
                    >
                        {options.map((option, idx) => {
                            const isSelected = option.value === value;
                            const isHighlighted = idx === highlightedIndex;

                            return (
                                <li
                                    key={option.value}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(idx)}
                                    className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors duration-100 ${
                                        isSelected
                                            ? "bg-teal-50 text-teal-800"
                                            : isHighlighted
                                            ? "bg-slate-50 text-slate-900"
                                            : "text-slate-700"
                                    }`}
                                >
                                    <span className="flex items-center gap-2 min-w-0">
                                        {option.colorDot && (
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${option.colorDot}`} />
                                        )}
                                        {option.icon && (
                                            <span className="shrink-0 text-slate-400">{option.icon}</span>
                                        )}
                                        <span className="flex flex-col min-w-0">
                                            <span className={`text-xs font-semibold truncate ${isSelected ? "text-teal-800" : ""}`}>
                                                {option.label}
                                            </span>
                                            {option.description && (
                                                <span className="text-[10px] text-slate-400 font-medium truncate">
                                                    {option.description}
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                    {isSelected && (
                                        <Check className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
