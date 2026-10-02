"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { DismantleTask } from "@/lib/types/dismantle";
import { createClient } from "@/lib/supabase/client";
import {
    FileSpreadsheet,
    Upload,
    Download,
    X,
    CheckCircle2,
    AlertCircle,
    Check
} from "lucide-react";

interface ImportDismantleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newTasks: DismantleTask[]) => void;
}

export default function ImportDismantleModal({
    isOpen,
    onClose,
    onSuccess,
}: ImportDismantleModalProps) {
    const supabase = createClient();
    const [file, setFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    // Download template spreadsheet Excel (.xlsx)
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "ID Pelanggan": "CUST-KDR-101",
                "Nama Pelanggan": "Contoh Bpk. Ahmad",
                "No WhatsApp": "081234567890",
                "Alamat": "Perumahan Indah Blok C No. 5",
                "Cluster": "Mojoroto",
                "Parent ODP": "ODP-MHS-01",
                "Tipe ONT": "ZTE F609",
                "Latitude": -7.8194,
                "Longitude": 111.9961,
            },
            {
                "ID Pelanggan": "CUST-KDR-102",
                "Nama Pelanggan": "Contoh Ibu Maria",
                "No WhatsApp": "085712349911",
                "Alamat": "Jl. Hayam Wuruk No. 88",
                "Cluster": "Kota",
                "Parent ODP": "ODP-KTA-01",
                "Tipe ONT": "Huawei HG8245H5",
                "Latitude": -7.816,
                "Longitude": 112.012,
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dismantle_Template");
        XLSX.writeFile(workbook, "Template_Import_Dismantle_Synerix.xlsx");
    };

    // Baca file spreadsheet yang diupload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setErrorMsg(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    setErrorMsg("File spreadsheet kosong atau format sheet tidak terbaca.");
                    setParsedRows([]);
                    return;
                }

                // Normalisasi kolom
                const normalized = data.map((row: any, idx: number) => {
                    const custId =
                        row["ID Pelanggan"] ||
                        row["Customer ID"] ||
                        row["id_pelanggan"] ||
                        `CUST-IMP-${idx + 1}`;
                    const custName =
                        row["Nama Pelanggan"] || row["Nama"] || row["customer_name"] || "Pelanggan Tanpa Nama";
                    const phone = row["No WhatsApp"] || row["No HP"] || row["phone_number"] || null;
                    const address = row["Alamat"] || row["address"] || "Alamat belum tercatat";
                    const cluster = row["Cluster"] || row["cluster_name"] || "Umum";
                    const odp = row["Parent ODP"] || row["ODP"] || row["parent_odp_name"] || null;
                    const device = row["Tipe ONT"] || row["Perangkat"] || row["device_type"] || "ONT ZTE F609";
                    const lat = parseFloat(row["Latitude"] || row["lat"]) || -7.8231;
                    const lng = parseFloat(row["Longitude"] || row["lng"]) || 111.9174;

                    return {
                        id: crypto.randomUUID(),
                        customer_id: String(custId).trim(),
                        customer_name: String(custName).trim(),
                        phone_number: phone ? String(phone).trim() : null,
                        address: String(address).trim(),
                        cluster_name: String(cluster).trim(),
                        parent_odp_name: odp ? String(odp).trim() : null,
                        device_type: String(device).trim(),
                        latitude: lat,
                        longitude: lng,
                        status: "QUEUE" as const,
                        accessories: ["ADAPTOR", "PATCHCORD"],
                        handover_status: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                });

                setParsedRows(normalized);
            } catch (err: unknown) {
                setErrorMsg("Gagal memproses file Excel: " + (err instanceof Error ? err.message : String(err)));
                setParsedRows([]);
            }
        };

        reader.readAsBinaryString(uploadedFile);
    };

    // Eksekusi Simpan Massal ke Supabase
    const handleExecuteImport = async () => {
        if (parsedRows.length === 0) return;

        setLoading(true);
        setErrorMsg(null);
        try {
            const { error } = await supabase.from("dismantle_tasks").insert(parsedRows);

            if (error) {
                console.error("Supabase insert error:", error);
                throw new Error(error.message);
            }

            onSuccess(parsedRows as DismantleTask[]);
            onClose();
        } catch (err: unknown) {
            setErrorMsg("Gagal mengimpor ke Supabase: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900">
                                Import Tugas Dismantle (Excel / CSV)
                            </h3>
                            <p className="text-xs text-slate-500">
                                Masukkan banyak tugas dismantle sekaligus dari file spreadsheet kantor
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-4 space-y-4">
                    {/* Banner Download Template */}
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="text-emerald-950 font-medium">
                                Gunakan format kolom standar agar pembacaan akurat
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] shadow-2xs active:scale-95 shrink-0"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Template
                        </button>
                    </div>

                    {/* Drag / File Input Area */}
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
                        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                        <label className="cursor-pointer">
                            <span className="text-xs font-bold text-teal-700 hover:underline">
                                Klik untuk memilih file Excel / CSV
                            </span>
                            <span className="text-xs text-slate-500"> atau seret ke sini</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Mendukung file .xlsx, .xls, dan .csv
                        </p>
                        {file && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-200 text-slate-800 text-xs font-mono font-semibold">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Preview Hasil Pembacaan */}
                    {parsedRows.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800">
                                    Preview Data Terbaca ({parsedRows.length} Tugas):
                                </span>
                                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Siap diimpor
                                </span>
                            </div>

                            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                                        <tr>
                                            <th className="p-2">ID</th>
                                            <th className="p-2">Nama</th>
                                            <th className="p-2">Cluster</th>
                                            <th className="p-2">Alamat</th>
                                            <th className="p-2">Perangkat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-[11px]">
                                        {parsedRows.slice(0, 10).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="p-2 font-mono font-bold text-slate-700">
                                                    {row.customer_id}
                                                </td>
                                                <td className="p-2 font-medium text-slate-900">
                                                    {row.customer_name}
                                                </td>
                                                <td className="p-2 text-slate-600">
                                                    {row.cluster_name}
                                                </td>
                                                <td className="p-2 text-slate-500 truncate max-w-[150px]">
                                                    {row.address}
                                                </td>
                                                <td className="p-2 text-slate-600">
                                                    {row.device_type}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {parsedRows.length > 10 && (
                                <p className="text-[10px] text-slate-400 text-center italic">
                                    Menampilkan 10 baris pertama dari total {parsedRows.length} baris...
                                </p>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleExecuteImport}
                            disabled={parsedRows.length === 0 || loading}
                            className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
                        >
                            {loading ? (
                                "Mengimpor Data..."
                            ) : (
                                <>
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Import {parsedRows.length} Tugas ke Supabase</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
