"use client";

import { useState } from "react";
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Send,
  Wrench
} from "lucide-react";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";

interface OvertimeLog {
  id: string;
  ticketNumber: string;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  workDescription: string;
  incentiveEstimate: number; // Dalam Rupiah
  status: "APPROVED" | "PENDING" | "REJECTED";
}

const INITIAL_OVERTIME_LOGS: OvertimeLog[] = [
  {
    id: "ot-1",
    ticketNumber: "TKT202610465103",
    overtimeDate: "2026-10-01",
    startTime: "18:00 WIB",
    endTime: "21:30 WIB",
    totalHours: 3.5,
    workDescription: "Perapian kabel tertindih pohon pisang di Wonorejo & penyambungan 12 core feeder",
    incentiveEstimate: 105000,
    status: "APPROVED",
  },
  {
    id: "ot-2",
    ticketNumber: "TKT202609918231",
    overtimeDate: "2026-09-28",
    startTime: "21:00 WIB",
    endTime: "00:00 WIB",
    totalHours: 3.0,
    workDescription: "Emergency splicing backbone Digimaxs putus akibat penggalian saluran air Mojoroto",
    incentiveEstimate: 90000,
    status: "APPROVED",
  },
];

export default function OvertimePage() {
  const [logs, setLogs] = useState<OvertimeLog[]>(INITIAL_OVERTIME_LOGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [ticketNumber, setTicketNumber] = useState("");
  const [overtimeDate, setOvertimeDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalHours, setTotalHours] = useState<number>(2);
  const [workDescription, setWorkDescription] = useState("");

  // Calculations
  const totalApprovedHours = logs
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, l) => sum + l.totalHours, 0);

  const totalIncentive = logs
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, l) => sum + l.incentiveEstimate, 0);

  const handleSubmitOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overtimeDate || !workDescription.trim()) {
      alert("Tanggal dan uraian pekerjaan lembur wajib diisi.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const estimatedFee = Math.round(totalHours * 30000); // 30rb/jam
      const newLog: OvertimeLog = {
        id: crypto.randomUUID(),
        ticketNumber: ticketNumber.trim() || "LAINNYA",
        overtimeDate,
        startTime: startTime || "18:00 WIB",
        endTime: endTime || "21:00 WIB",
        totalHours: totalHours || 2,
        workDescription: workDescription.trim(),
        incentiveEstimate: estimatedFee,
        status: "PENDING",
      };

      setLogs([newLog, ...logs]);
      setIsModalOpen(false);
      setTicketNumber("");
      setOvertimeDate("");
      setStartTime("");
      setEndTime("");
      setTotalHours(2);
      setWorkDescription("");
      setSubmitting(false);
    }, 400);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-6">

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-synerix-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-teal-50 text-teal-700 border border-teal-200 uppercase">
              Operational Management
            </span>
            <span className="text-xs text-synerix-subtext">| Jam Lembur & Insentif Maintenance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-synerix-text tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6 text-teal-700 shrink-0" />
            <span>Pencatatan & Klaim Lembur (Overtime)</span>
          </h1>
          <p className="text-xs sm:text-sm text-synerix-subtext mt-1 max-w-2xl">
            Pencatatan jam kerja darurat di luar shift reguler (maintenance malam, perbaikan kabel putus, emergency splicing).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Ajukan Lembur Baru</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Jam Lembur */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider">Jam Lembur Disetujui</div>
            <div className="text-2xl font-black mt-0.5">{totalApprovedHours} <span className="text-xs font-normal text-slate-300">Jam (Bulan Ini)</span></div>
            <div className="text-[10px] text-slate-300 mt-1">Standar insentif emergency FTTH</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Insentif Fee */}
        <div className="p-4 rounded-2xl bg-white border border-synerix-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estimasi Insentif Overtime</div>
            <div className="text-xl font-black text-teal-700 mt-0.5">
              Rp {totalIncentive.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-slate-500">Telah diverifikasi supervisor</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Total Tiket Darurat */}
        <div className="p-4 rounded-2xl bg-white border border-synerix-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kasus Darurat Ditangani</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{logs.length} Tiket</div>
            <div className="text-[10px] text-slate-500">Log overtime maintenance</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Wrench className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabel Log Overtime */}
      <div className="bg-white rounded-2xl border border-synerix-border p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-700" />
              Daftar Riwayat Jam Lembur Teknisi
            </h3>
            <p className="text-xs text-slate-500">
              Rincian laporan lembur pekerjaan emergency jaringan FTTH
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 self-start sm:self-auto">
            {logs.length} Record Log
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">No. Tiket</th>
                <th className="py-3 px-3">Jam Lembur</th>
                <th className="py-3 px-3">Total Jam</th>
                <th className="py-3 px-3">Uraian Pekerjaan Emergency</th>
                <th className="py-3 px-3">Insentif</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {log.overtimeDate}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-teal-700 whitespace-nowrap">
                    {log.ticketNumber}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                    {log.startTime} - {log.endTime}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {log.totalHours} Jam
                  </td>
                  <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={log.workDescription}>
                    {log.workDescription}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                    Rp {log.incentiveEstimate.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {log.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Disetujui
                      </span>
                    )}
                    {log.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertCircle className="h-3 w-3" /> Pending Review
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat pengajuan jam lembur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AJUKAN LEMBUR BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-700" />
                Form Klaim Jam Lembur
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOvertime} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Tiket Pekerjaan
                  </label>
                  <input
                    type="text"
                    placeholder="TKT20261046..."
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Lembur *
                  </label>
                  <input
                    type="date"
                    required
                    value={overtimeDate}
                    onChange={(e) => setOvertimeDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="text"
                    placeholder="18:00 WIB"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="text"
                    placeholder="21:00 WIB"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Jam
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={totalHours}
                    onChange={(e) => setTotalHours(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uraian Pekerjaan Emergency / Darurat *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan alasan perbaikan di luar jam shift reguler (misal: perbaikan backbone putus, perapian tiang tertimpa pohon)..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Mengirim..." : "Kirim Klaim Lembur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
