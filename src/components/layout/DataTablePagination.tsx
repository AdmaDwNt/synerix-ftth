"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";

interface DataTablePaginationProps {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
    showPageSizeSelector?: boolean;
    itemName?: string;
}

export default function DataTablePagination({
    currentPage,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100],
    showPageSizeSelector = true,
    itemName = "data",
}: DataTablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalItems);

    const sizeOptions: SelectOption[] = pageSizeOptions.map((opt) => ({
        value: String(opt),
        label: String(opt),
    }));

    // Hitung tombol nomor halaman dengan ellipsis cerdas
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 6) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 px-1 text-xs">
            {/* Info Range Data & Page Size Dropdown */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-600 font-medium">
                {showPageSizeSelector && onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        <CustomSelect
                            options={sizeOptions}
                            value={String(pageSize)}
                            onChange={(val) => {
                                onPageSizeChange(Number(val));
                                onPageChange(1);
                            }}
                            size="sm"
                            className="w-16"
                            dropdownWidthClass="w-20 min-w-[70px]"
                        />
                        <span>data</span>
                    </div>
                )}

                <div className="text-slate-500 font-medium">
                    Menampilkan <span className="font-bold text-slate-800">{startIdx}</span> -{" "}
                    <span className="font-bold text-slate-800">{endIdx}</span> dari{" "}
                    <span className="font-bold text-slate-800">{totalItems}</span> {itemName}
                </div>
            </div>

            {/* Pagination Controls Pill (Sesuai Referensi Gambar 1 & Gambar 2) */}
            <div className="inline-flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 shadow-2xs">
                {/* Prev Button */}
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent transition-all"
                    title="Halaman Sebelumnya"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((p, idx) => {
                    if (p === "...") {
                        return (
                            <span
                                key={`ellipsis-${idx}`}
                                className="w-6 sm:w-7 text-center text-slate-400 font-bold select-none text-xs"
                            >
                                ...
                            </span>
                        );
                    }

                    const pageNum = p as number;
                    const isActive = pageNum === currentPage;

                    return (
                        <button
                            key={`page-${pageNum}`}
                            type="button"
                            onClick={() => onPageChange(pageNum)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-black transition-all flex items-center justify-center ${
                                isActive
                                    ? "bg-teal-800 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}

                {/* Next Button */}
                <button
                    type="button"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent transition-all"
                    title="Halaman Selanjutnya"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
