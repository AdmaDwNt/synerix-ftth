"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  X,
  Layers,
  ShieldCheck,
  Send,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Users,
  Edit3,
  Trash2,
  UserPlus,
  RotateCcw,
  Sparkles,
  Check,
  Database,
  CheckCircle,
  XCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";

interface ShiftRosterRow {
  id: string;
  month_year: string;
  group_name: string; // "NAMA TEKNISI" | "NAMA NOC" | "NAMA PESERTA PSG"
  employee_name: string;
  daily_shifts: Record<string, string>; // e.g. { "1": "SOC", "2": "LIBUR", "3": "PAGI", ... }
}

interface LeaveRequest {
  id: string;
  requestType: "CUTI_TAHUNAN" | "TUKAR_SHIFT" | "IZIN_SAKIT";
  employeeName: string;
  groupName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
}

// Seed Initial Roster dari Spreadsheet Perusahaan (UPDATE JADWAL BULAN AGUSTUS 2026)
const SEED_ROSTERS_AGUSTUS: ShiftRosterRow[] = [
  // GROUP 1: NAMA TEKNISI
  {
    id: "r-1",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA TEKNISI",
    employee_name: "DAVID ARDIANSYAH",
    daily_shifts: {
      "1": "SOC", "2": "LIBUR", "3": "LIBUR", "4": "MALAM", "5": "MALAM", "6": "MALAM", "7": "MALAM", "8": "LIBUR", "9": "LIBUR",
      "10": "PAGI", "11": "PAGI", "12": "SOC", "13": "SOC", "14": "MALAM", "15": "MALAM", "16": "LIBUR", "17": "LIBUR", "18": "PAGI",
      "19": "PAGI", "20": "SOC", "21": "SOC", "22": "MALAM", "23": "MALAM", "24": "LIBUR", "25": "LIBUR", "26": "PAGI", "27": "PAGI",
      "28": "SOC", "29": "SOC", "30": "MALAM", "31": "MALAM"
    }
  },
  {
    id: "r-2",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA TEKNISI",
    employee_name: "PANDU PRADANA",
    daily_shifts: {
      "1": "LIBUR", "2": "LIBUR", "3": "PAGI", "4": "PAGI", "5": "LIBUR", "6": "LIBUR", "7": "PAGI", "8": "PAGI", "9": "PAGI",
      "10": "PAGI", "11": "PAGI", "12": "MALAM", "13": "MALAM", "14": "LIBUR", "15": "LIBUR", "16": "PAGI", "17": "PAGI", "18": "PAGI",
      "19": "PAGI", "20": "MALAM", "21": "MALAM", "22": "LIBUR", "23": "LIBUR", "24": "SOC", "25": "SOC", "26": "PAGI", "27": "PAGI",
      "28": "MALAM", "29": "MALAM", "30": "LIBUR", "31": "LIBUR"
    }
  },
  {
    id: "r-3",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA TEKNISI",
    employee_name: "DAVIT KOES",
    daily_shifts: {
      "1": "PAGI", "2": "PAGI", "3": "SOC", "4": "SOC", "5": "LIBUR", "6": "LIBUR", "7": "PAGI", "8": "PAGI", "9": "PAGI",
      "10": "PAGI", "11": "PAGI", "12": "PAGI", "13": "PAGI", "14": "PAGI", "15": "LIBUR", "16": "LIBUR", "17": "PAGI", "18": "PAGI",
      "19": "PAGI", "20": "PAGI", "21": "PAGI", "22": "PAGI", "23": "LIBUR", "24": "LIBUR", "25": "PAGI", "26": "PAGI", "27": "PAGI",
      "28": "PAGI", "29": "PAGI", "30": "PAGI", "31": "PAGI"
    }
  },
  {
    id: "r-4",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA TEKNISI",
    employee_name: "FARID",
    daily_shifts: {
      "1": "PAGI", "2": "PAGI", "3": "PAGI", "4": "PAGI", "5": "LIBUR", "6": "LIBUR", "7": "PAGI", "8": "PAGI", "9": "PAGI",
      "10": "PAGI", "11": "PAGI", "12": "SOC", "13": "SOC", "14": "PAGI", "15": "PAGI", "16": "LIBUR", "17": "LIBUR", "18": "PAGI",
      "19": "PAGI", "20": "PAGI", "21": "PAGI", "22": "SOC", "23": "SOC", "24": "PAGI", "25": "PAGI", "26": "LIBUR", "27": "LIBUR",
      "28": "PAGI", "29": "PAGI", "30": "PAGI", "31": "PAGI"
    }
  },
  {
    id: "r-5",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA TEKNISI",
    employee_name: "EKA",
    daily_shifts: {
      "1": "PAGI", "2": "PAGI", "3": "PAGI", "4": "LIBUR", "5": "LIBUR", "6": "PAGI", "7": "PAGI", "8": "PAGI", "9": "SOC",
      "10": "LIBUR", "11": "LIBUR", "12": "PAGI", "13": "PAGI", "14": "PAGI", "15": "PAGI", "16": "PAGI", "17": "LIBUR", "18": "LIBUR",
      "19": "PAGI", "20": "PAGI", "21": "PAGI", "22": "PAGI", "23": "PAGI", "24": "LIBUR", "25": "LIBUR", "26": "PAGI", "27": "PAGI",
      "28": "PAGI", "29": "PAGI", "30": "PAGI", "31": "PAGI"
    }
  },
  {
    id: "r-6",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA TEKNISI",
    employee_name: "ALFA",
    daily_shifts: {
      "1": "PAGI", "2": "PAGI", "3": "LIBUR", "4": "LIBUR", "5": "PAGI", "6": "PAGI", "7": "PAGI", "8": "SOC", "9": "LIBUR",
      "10": "LIBUR", "11": "PAGI", "12": "PAGI", "13": "PAGI", "14": "PAGI", "15": "LIBUR", "16": "LIBUR", "17": "PAGI", "18": "PAGI",
      "19": "PAGI", "20": "PAGI", "21": "LIBUR", "22": "LIBUR", "23": "PAGI", "24": "PAGI", "25": "PAGI", "26": "PAGI", "27": "PAGI",
      "28": "LIBUR", "29": "LIBUR", "30": "PAGI", "31": "PAGI"
    }
  },
  {
    id: "r-7",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA TEKNISI",
    employee_name: "DIMAS",
    daily_shifts: {
      "1": "PAGI", "2": "PAGI", "3": "LIBUR", "4": "LIBUR", "5": "PAGI", "6": "PAGI", "7": "PAGI", "8": "PAGI", "9": "PAGI",
      "10": "PAGI", "11": "PAGI", "12": "PAGI", "13": "LIBUR", "14": "LIBUR", "15": "PAGI", "16": "PAGI", "17": "PAGI", "18": "PAGI",
      "19": "PAGI", "20": "PAGI", "21": "LIBUR", "22": "LIBUR", "23": "PAGI", "24": "PAGI", "25": "PAGI", "26": "PAGI", "27": "PAGI",
      "28": "PAGI", "29": "LIBUR", "30": "LIBUR", "31": "PAGI"
    }
  },
  {
    id: "r-8",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA TEKNISI",
    employee_name: "UNGGUL",
    daily_shifts: {
      "1": "PAGI", "2": "PAGI", "3": "LIBUR", "4": "LIBUR", "5": "PAGI", "6": "PAGI", "7": "PAGI", "8": "PAGI", "9": "PAGI",
      "10": "PAGI", "11": "PAGI", "12": "PAGI", "13": "PAGI", "14": "LIBUR", "15": "LIBUR", "16": "PAGI", "17": "PAGI", "18": "PAGI",
      "19": "PAGI", "20": "PAGI", "21": "PAGI", "22": "LIBUR", "23": "LIBUR", "24": "PAGI", "25": "PAGI", "26": "PAGI", "27": "PAGI",
      "28": "PAGI", "29": "PAGI", "30": "LIBUR", "31": "LIBUR"
    }
  },

  // GROUP 2: NAMA NOC
  {
    id: "r-9",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA NOC",
    employee_name: "DENOK",
    daily_shifts: {
      "1": "SOC", "2": "LIBUR", "3": "LIBUR", "4": "PAGI", "5": "PAGI", "6": "PAGI", "7": "SOC", "8": "SOC", "9": "LIBUR",
      "10": "LIBUR", "11": "SOC", "12": "SOC", "13": "PAGI", "14": "PAGI", "15": "SOC", "16": "LIBUR", "17": "LIBUR", "18": "PAGI",
      "19": "PAGI", "20": "SOC", "21": "SOC", "22": "LIBUR", "23": "LIBUR", "24": "SOC", "25": "SOC", "26": "PAGI", "27": "PAGI",
      "28": "SOC", "29": "SOC", "30": "LIBUR", "31": "LIBUR"
    }
  },
  {
    id: "r-10",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA NOC",
    employee_name: "JOKO",
    daily_shifts: {
      "1": "PAGI", "2": "PAGI", "3": "PAGI", "4": "SOC", "5": "SOC", "6": "LIBUR", "7": "LIBUR", "8": "PAGI", "9": "PAGI",
      "10": "PAGI", "11": "LIBUR", "12": "LIBUR", "13": "SOC", "14": "SOC", "15": "PAGI", "16": "PAGI", "17": "PAGI", "18": "SOC",
      "19": "SOC", "20": "LIBUR", "21": "LIBUR", "22": "PAGI", "23": "PAGI", "24": "PAGI", "25": "PAGI", "26": "SOC", "27": "SOC",
      "28": "LIBUR", "29": "LIBUR", "30": "PAGI", "31": "PAGI"
    }
  },
  {
    id: "r-11",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA NOC",
    employee_name: "FARIL JEMBLUK",
    daily_shifts: {
      "1": "MALAM", "2": "MALAM", "3": "MALAM", "4": "LIBUR", "5": "LIBUR", "6": "MALAM", "7": "MALAM", "8": "MALAM", "9": "MALAM",
      "10": "LIBUR", "11": "LIBUR", "12": "MALAM", "13": "MALAM", "14": "MALAM", "15": "MALAM", "16": "LIBUR", "17": "LIBUR", "18": "MALAM",
      "19": "MALAM", "20": "MALAM", "21": "MALAM", "22": "LIBUR", "23": "LIBUR", "24": "MALAM", "25": "MALAM", "26": "MALAM", "27": "MALAM",
      "28": "LIBUR", "29": "LIBUR", "30": "MALAM", "31": "MALAM"
    }
  },

  // GROUP 3: NAMA PESERTA PSG
  {
    id: "r-12",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA PESERTA PSG",
    employee_name: "ADRIL SMKN SEMEN",
    daily_shifts: {
      "1": "LIBUR", "2": "PAGI", "3": "PAGI", "4": "PAGI", "5": "LIBUR", "6": "LIBUR", "7": "SOC", "8": "SOC", "9": "LIBUR",
      "10": "LIBUR", "11": "PAGI", "12": "PAGI", "13": "PAGI", "14": "PAGI", "15": "LIBUR", "16": "LIBUR", "17": "PAGI", "18": "PAGI",
      "19": "PAGI", "20": "PAGI", "21": "LIBUR", "22": "LIBUR", "23": "PAGI", "24": "PAGI", "25": "LIBUR", "26": "LIBUR", "27": "SOC",
      "28": "SOC", "29": "LIBUR", "30": "LIBUR", "31": "SOC"
    }
  },
  {
    id: "r-13",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA PESERTA PSG",
    employee_name: "JOHAN SMKN SEMEN",
    daily_shifts: {
      "1": "PAGI", "2": "LIBUR", "3": "PAGI", "4": "PAGI", "5": "LIBUR", "6": "LIBUR", "7": "PAGI", "8": "PAGI", "9": "PAGI",
      "10": "PAGI", "11": "LIBUR", "12": "LIBUR", "13": "PAGI", "14": "PAGI", "15": "PAGI", "16": "PAGI", "17": "LIBUR", "18": "LIBUR",
      "19": "PAGI", "20": "PAGI", "21": "PAGI", "22": "PAGI", "23": "LIBUR", "24": "LIBUR", "25": "PAGI", "26": "PAGI", "27": "PAGI",
      "28": "PAGI", "29": "LIBUR", "30": "LIBUR", "31": "PAGI"
    }
  },
  {
    id: "r-14",
    month_year: "AGUSTUS 2026",
    group_name: "NAMA PESERTA PSG",
    employee_name: "ALIF SMK CR",
    daily_shifts: {
      "1": "PAGI", "2": "LIBUR", "3": "PAGI", "4": "PAGI", "5": "LIBUR", "6": "LIBUR", "7": "PAGI", "8": "SOC", "9": "SOC",
      "10": "LIBUR", "11": "LIBUR", "12": "PAGI", "13": "PAGI", "14": "PAGI", "15": "PAGI", "16": "LIBUR", "17": "LIBUR", "18": "PAGI",
      "19": "PAGI", "20": "PAGI", "21": "PAGI", "22": "LIBUR", "23": "LIBUR", "24": "PAGI", "25": "PAGI", "26": "PAGI", "27": "PAGI",
      "28": "LIBUR", "29": "LIBUR", "30": "SOC", "31": "SOC"
    }
  }
];

// Helper: Get nama bulan Indonesia dari Date
const BULAN_INDONESIA = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${BULAN_INDONESIA[now.getMonth()]} ${now.getFullYear()}`;
}

function generateMonthOptions(): SelectOption[] {
  const now = new Date();
  const options: SelectOption[] = [];
  // Show 6 months back + current + 6 months forward = 13 months
  for (let offset = -6; offset <= 6; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const value = `${BULAN_INDONESIA[d.getMonth()]} ${d.getFullYear()}`;
    const label = `${BULAN_INDONESIA[d.getMonth()].charAt(0)}${BULAN_INDONESIA[d.getMonth()].slice(1).toLowerCase()} ${d.getFullYear()}`;
    options.push({
      value,
      label: offset === 0 ? `${label} (Bulan Ini)` : label,
    });
  }
  return options;
}

export default function ShiftsPage() {
  const supabase = createClient();
  const currentMonthYear = useMemo(() => getCurrentMonthYear(), []);
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear);
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ROSTER_MATRIX" | "DAILY_LIST" | "LEAVE_REQUESTS">("ROSTER_MATRIX");

  const [rosterRows, setRosterRows] = useState<ShiftRosterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<"CONNECTED" | "ERROR" | "LOADING">("LOADING");
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMonthYearInput, setImportMonthYearInput] = useState(currentMonthYear);
  const [importGroupTab, setImportGroupTab] = useState<"NAMA TEKNISI" | "NAMA NOC" | "NAMA PESERTA PSG">("NAMA TEKNISI");
  const [importPasteText, setImportPasteText] = useState("");
  const [importing, setImporting] = useState(false);

  // Manual Add / Edit Schedule Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [formGroupName, setFormGroupName] = useState<string>("NAMA TEKNISI");
  const [formEmployeeName, setFormEmployeeName] = useState("");
  const [formMonthYear, setFormMonthYear] = useState(currentMonthYear);
  const [formDailyShifts, setFormDailyShifts] = useState<Record<string, string>>({});
  const [savingManual, setSavingManual] = useState(false);

  // Leave Form & State
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveEmployeeName, setLeaveEmployeeName] = useState("");
  const [leaveGroupName, setLeaveGroupName] = useState<string>("NAMA TEKNISI");
  const [leaveType, setLeaveType] = useState<LeaveRequest["requestType"]>("CUTI_TAHUNAN");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Fetch data Roster dari Supabase
  const fetchRosters = async () => {
    setLoading(true);
    setDbErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from("shift_rosters")
        .select("*")
        .eq("month_year", selectedMonthYear);

      if (error) {
        console.warn("Supabase fetch error:", error);
        setDbStatus("ERROR");
        setDbErrorMsg(error.message || "Tabel shift_rosters belum dibuat");
        setRosterRows([]);
      } else {
        setDbStatus("CONNECTED");
        if (data && data.length > 0) {
          setRosterRows(data as ShiftRosterRow[]);
        } else {
          setRosterRows([]);
        }
      }
    } catch (e: any) {
      console.warn("Koneksi database gagal:", e);
      setDbStatus("ERROR");
      setDbErrorMsg(e?.message || "Koneksi database gagal");
      setRosterRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data Pengajuan Cuti dari Supabase
  const fetchLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from("shift_leave_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLeaves(
          data.map((d: any) => ({
            id: d.id,
            requestType: d.request_type,
            employeeName: d.employee_name || "Personel",
            groupName: d.group_name || "NAMA TEKNISI",
            startDate: d.start_date,
            endDate: d.end_date,
            reason: d.reason,
            status: d.status,
            createdAt: d.created_at ? d.created_at.split("T")[0] : "",
          }))
        );
      }
    } catch (err) {
      console.warn("Could not fetch leaves from Supabase:", err);
    }
  };

  useEffect(() => {
    fetchRosters();
    fetchLeaves();
  }, [selectedMonthYear]);

  // Open Modal Manual Create
  const handleOpenCreateModal = (defaultGroup: string = "NAMA TEKNISI") => {
    setModalMode("CREATE");
    setEditingRowId(null);
    setFormGroupName(defaultGroup);
    setFormEmployeeName("");
    setFormMonthYear(currentMonthYear);

    // Initial 31 days set to PAGI
    const initialShifts: Record<string, string> = {};
    for (let i = 1; i <= 31; i++) {
      initialShifts[String(i)] = "PAGI";
    }
    setFormDailyShifts(initialShifts);
    setIsManualModalOpen(true);
  };

  // Open Modal Manual Edit (Toolbar)
  const handleOpenEditModal = () => {
    setModalMode("EDIT");
    setEditingRowId(null);
    setFormGroupName("NAMA TEKNISI");
    setFormEmployeeName("");
    setFormMonthYear(currentMonthYear);

    // Initial 31 days set to LIBUR before selection
    const initialShifts: Record<string, string> = {};
    for (let i = 1; i <= 31; i++) {
      initialShifts[String(i)] = "LIBUR";
    }
    setFormDailyShifts(initialShifts);
    setIsManualModalOpen(true);
  };

  // Direct Edit from Row in Matrix Table
  const handleEditRowDirect = (row: ShiftRosterRow) => {
    setModalMode("EDIT");
    setEditingRowId(row.id);
    setFormGroupName(row.group_name);
    setFormEmployeeName(row.employee_name);
    setFormMonthYear(row.month_year);

    const filledShifts: Record<string, string> = {};
    for (let i = 1; i <= 31; i++) {
      filledShifts[String(i)] = row.daily_shifts[String(i)] || "LIBUR";
    }
    setFormDailyShifts(filledShifts);
    setIsManualModalOpen(true);
  };

  // Delete Row from Database & State
  const handleDeleteRoster = async (row: ShiftRosterRow) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus personel "${row.employee_name}" (${row.group_name}) dari jadwal ${row.month_year}?`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("shift_rosters")
        .delete()
        .eq("id", row.id);

      if (error) {
        console.warn("Gagal hapus by id di Supabase, mencoba by match:", error);
        await supabase
          .from("shift_rosters")
          .delete()
          .match({
            month_year: row.month_year,
            group_name: row.group_name,
            employee_name: row.employee_name,
          });
      }

      setRosterRows((prev) => prev.filter((r) => r.id !== row.id));
      alert(`✅ Berhasil menghapus jadwal ${row.employee_name}.`);
    } catch (err: any) {
      alert("Gagal menghapus jadwal: " + err.message);
    }
  };

  // Handle Employee Selection in Edit Mode
  const handleEmployeeSelect = (empName: string) => {
    setFormEmployeeName(empName);
    const formattedMonth = formMonthYear.toUpperCase().trim();
    const existingRow = rosterRows.find(
      (r) => r.month_year === formattedMonth && 
             r.group_name === formGroupName && 
             r.employee_name === empName
    );

    if (existingRow) {
      setEditingRowId(existingRow.id);
      const filledShifts: Record<string, string> = {};
      for (let i = 1; i <= 31; i++) {
        filledShifts[String(i)] = existingRow.daily_shifts[String(i)] || "LIBUR";
      }
      setFormDailyShifts(filledShifts);
    } else {
      setEditingRowId(null);
      const resetShifts: Record<string, string> = {};
      for (let i = 1; i <= 31; i++) {
        resetShifts[String(i)] = "LIBUR";
      }
      setFormDailyShifts(resetShifts);
    }
  };

  // Reset employee selection if Group or Month changes in Edit Mode
  useEffect(() => {
    if (modalMode === "EDIT" && isManualModalOpen) {
      setFormEmployeeName("");
      setEditingRowId(null);
      const initialShifts: Record<string, string> = {};
      for (let i = 1; i <= 31; i++) {
        initialShifts[String(i)] = "LIBUR";
      }
      setFormDailyShifts(initialShifts);
    }
  }, [formGroupName, formMonthYear, modalMode, isManualModalOpen]);

  // Save / Update Manual Entry (CRUD: Create & Update)
  const handleSaveManualRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeName.trim()) {
      alert("Nama karyawan / personel wajib diisi.");
      return;
    }

    setSavingManual(true);
    try {
      const formattedName = formEmployeeName.trim().toUpperCase();
      const formattedMonth = formMonthYear.toUpperCase().trim();

      // Cek apakah karyawan ini sudah ada di state
      const existingRow = rosterRows.find(
        (r) => r.month_year === formattedMonth && 
               r.group_name === formGroupName && 
               r.employee_name === formattedName
      );

      const targetId = editingRowId || existingRow?.id || crypto.randomUUID();

      const payload: ShiftRosterRow = {
        id: targetId,
        month_year: formattedMonth,
        group_name: formGroupName,
        employee_name: formattedName,
        daily_shifts: formDailyShifts,
      };

      // Upsert to Supabase
      const { error } = await supabase.from("shift_rosters").upsert(payload, {
        onConflict: "month_year,group_name,employee_name"
      });

      if (error) {
        console.error("Gagal sinkron ke Supabase:", error);
        alert(`Peringatan: Gagal menyimpan ke database Supabase (${error.message}). Jadwal tersimpan di sesi lokal.`);
      } else {
        setDbStatus("CONNECTED");
      }

      if (editingRowId || existingRow) {
        setRosterRows((prev) =>
          prev.map((item) =>
            item.id === targetId ||
            (item.month_year === formattedMonth &&
              item.employee_name === formattedName &&
              item.group_name === formGroupName)
              ? payload
              : item
          )
        );
        alert(`✅ Berhasil memperbarui jadwal shift untuk ${payload.employee_name}`);
      } else {
        setRosterRows((prev) => [payload, ...prev]);
        alert(`✅ Berhasil menambahkan personel & jadwal baru untuk ${payload.employee_name}`);
      }

      setIsManualModalOpen(false);
    } catch (err: any) {
      alert("Gagal menyimpan jadwal: " + err.message);
    } finally {
      setSavingManual(false);
    }
  };

  // Preset Fast Fill 31 Days
  const handlePresetFill = (code: string) => {
    const updated: Record<string, string> = {};
    for (let i = 1; i <= 31; i++) {
      updated[String(i)] = code;
    }
    setFormDailyShifts(updated);
  };

  // Modern Cycler Logic for Grid
  const SHIFT_OPTIONS = ["PAGI", "SORE", "SOC", "MALAM", "LIBUR"];
  
  const cycleShift = (dayIndex: number, direction: 1 | -1) => {
    setFormDailyShifts((prev) => {
      const currentVal = prev[String(dayIndex)] || "LIBUR";
      const currentIndex = SHIFT_OPTIONS.indexOf(currentVal);
      let nextIndex = (currentIndex + direction) % SHIFT_OPTIONS.length;
      if (nextIndex < 0) nextIndex = SHIFT_OPTIONS.length - 1;
      return { ...prev, [String(dayIndex)]: SHIFT_OPTIONS[nextIndex] };
    });
  };

  // Quick Cycle Shift directly on Table Cell with auto-sync
  const handleQuickCycleShift = async (row: ShiftRosterRow, day: number) => {
    const currentShift = row.daily_shifts[String(day)] || "LIBUR";
    const currentIndex = SHIFT_OPTIONS.indexOf(currentShift);
    const nextIndex = (currentIndex + 1) % SHIFT_OPTIONS.length;
    const nextShift = SHIFT_OPTIONS[nextIndex];

    const updatedDailyShifts = {
      ...row.daily_shifts,
      [String(day)]: nextShift,
    };

    const updatedRow: ShiftRosterRow = {
      ...row,
      daily_shifts: updatedDailyShifts,
    };

    // Optimistic UI update
    setRosterRows((prev) => prev.map((r) => (r.id === row.id ? updatedRow : r)));

    // Auto-sync to Supabase in background
    try {
      await supabase.from("shift_rosters").upsert(updatedRow, {
        onConflict: "month_year,group_name,employee_name",
      });
    } catch (e) {
      console.warn("Quick cycle sync error:", e);
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, dayIndex: number) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      cycleShift(dayIndex, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      cycleShift(dayIndex, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSaveManualRoster({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  // Handle Import / Paste Data Google Spreadsheet (per-group)
  const handleImportSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importPasteText.trim()) {
      alert("Tempelkan (Paste) data dari Google Spreadsheet ke dalam kotak teks.");
      return;
    }

    setImporting(true);
    try {
      const lines = importPasteText.trim().split("\n");
      const newParsedRows: ShiftRosterRow[] = [];
      const targetGroup = importGroupTab;

      lines.forEach((line) => {
        const columns = line.split("\t").map((c) => c.trim());
        if (columns.length === 0 || !columns[0]) return;

        const firstCol = columns[0].toUpperCase();
        if (firstCol.includes("NAMA NOC") || firstCol.includes("NAMA PESERTA") || firstCol.includes("PSG") || firstCol.includes("NAMA TEKNISI") || firstCol.includes("GROUP")) {
          return;
        }

        let empName = "";
        let shiftStartIndex = 1;

        if (!isNaN(Number(columns[0])) && columns.length > 2) {
          empName = columns[1];
          shiftStartIndex = 2;
        } else if (isNaN(Number(columns[0]))) {
          empName = columns[0];
          shiftStartIndex = 1;
        }

        if (empName && !empName.toUpperCase().includes("SHIFT") && !empName.toUpperCase().includes("ISTIRAHAT") && !empName.toUpperCase().includes("KARYAWAN")) {
          const daily_shifts: Record<string, string> = {};
          let dayNum = 1;

          for (let i = shiftStartIndex; i < columns.length; i++) {
            if (dayNum > 31) break;
            const rawVal = columns[i].toUpperCase();
            if (rawVal.includes("PAGI")) daily_shifts[String(dayNum)] = "PAGI";
            else if (rawVal.includes("SORE")) daily_shifts[String(dayNum)] = "SORE";
            else if (rawVal.includes("MALAM")) daily_shifts[String(dayNum)] = "MALAM";
            else if (rawVal.includes("SOC")) daily_shifts[String(dayNum)] = "SOC";
            else if (rawVal.includes("LIBUR")) daily_shifts[String(dayNum)] = "LIBUR";
            else daily_shifts[String(dayNum)] = rawVal || "LIBUR";
            dayNum++;
          }

          newParsedRows.push({
            id: crypto.randomUUID(),
            month_year: importMonthYearInput.toUpperCase(),
            group_name: targetGroup,
            employee_name: empName,
            daily_shifts,
          });
        }
      });

      if (newParsedRows.length > 0) {
        try {
          const { error } = await supabase.from("shift_rosters").upsert(newParsedRows, {
            onConflict: "month_year,group_name,employee_name"
          });
          if (error) {
            console.error("Gagal simpan import ke Supabase:", error);
            alert(`Peringatan: Gagal menyimpan data impor ke database Supabase (${error.message}). Data ditampilkan di sesi lokal.`);
          } else {
            setDbStatus("CONNECTED");
          }
        } catch (err) {
          console.warn("Gagal simpan ke Supabase, menyimpan lokal:", err);
        }

        // Merge: replace matching group+month, keep other groups/months
        const importMonth = importMonthYearInput.toUpperCase();
        setRosterRows((prev) => {
          const kept = prev.filter(
            (r) => !(r.group_name === targetGroup && r.month_year === importMonth)
          );
          return [...kept, ...newParsedRows];
        });
        setSelectedMonthYear(importMonth);

        const groupLabel = targetGroup === "NAMA TEKNISI" ? "Teknis" : targetGroup === "NAMA NOC" ? "NOC" : "PSG";
        alert(`✅ Berhasil mengimpor ${newParsedRows.length} personel grup ${groupLabel} untuk ${importMonth}!`);
        setImportPasteText("");
        setIsImportModalOpen(false);
      } else {
        alert("Format data tidak dikenali. Pastikan menyalin baris tabel langsung dari Google Spreadsheet.");
      }
    } catch (err: any) {
      alert("Gagal memproses data spreadsheet: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Submit Cuti Form (CRUD Create Leave)
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim() || !leaveEmployeeName.trim()) {
      alert("Nama personel, periode tanggal, dan alasan pengajuan wajib diisi.");
      return;
    }

    setSubmittingLeave(true);
    try {
      const newLeavePayload = {
        id: crypto.randomUUID(),
        request_type: leaveType,
        employee_name: leaveEmployeeName.trim().toUpperCase(),
        group_name: leaveGroupName,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        status: "PENDING" as const,
      };

      try {
        const { error } = await supabase
          .from("shift_leave_requests")
          .insert(newLeavePayload);
        if (error) console.warn("Supabase leave insert error:", error);
      } catch (err) {
        console.warn("Could not save leave to Supabase:", err);
      }

      await fetchLeaves();
      setIsLeaveModalOpen(false);
      setLeaveEmployeeName("");
      setStartDate("");
      setEndDate("");
      setReason("");
      alert("✅ Pengajuan cuti / izin berhasil dikirim!");
    } catch (err: any) {
      alert("Gagal mengajukan cuti: " + err.message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Update Leave Status (CRUD Update Leave)
  const handleUpdateLeaveStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const { error } = await supabase
        .from("shift_leave_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.warn("Failed to update leave in Supabase:", error);
      }
      setLeaves((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
    } catch (e: any) {
      alert("Gagal update status cuti: " + e.message);
    }
  };

  // Delete Leave Ticket (CRUD Delete Leave)
  const handleDeleteLeave = async (id: string) => {
    if (!window.confirm("Hapus tiket pengajuan cuti ini?")) return;
    try {
      await supabase.from("shift_leave_requests").delete().eq("id", id);
      setLeaves((prev) => prev.filter((l) => l.id !== id));
    } catch (e: any) {
      alert("Gagal menghapus tiket cuti: " + e.message);
    }
  };

  // Month & Group Filter options (monthOptions generated dynamically at top)

  const groupFilterOptions: SelectOption[] = [
    { value: "ALL", label: "Semua Kelompok / Tim" },
    { value: "NAMA TEKNISI", label: "NAMA TEKNISI", colorDot: "bg-teal-500" },
    { value: "NAMA NOC", label: "NAMA NOC", colorDot: "bg-blue-500" },
    { value: "NAMA PESERTA PSG", label: "NAMA PESERTA PSG / MAGANG", colorDot: "bg-amber-500" },
  ];

  // Days array (1 to 31)
  const daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

  // Grouped Roster Data
  const filteredRosters = rosterRows.filter((r) => {
    const matchesGroup = selectedGroup === "ALL" || r.group_name === selectedGroup;
    const matchesQuery = r.employee_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesQuery;
  });

  const groupedRosters = {
    TEKNISI: filteredRosters.filter((r) => r.group_name === "NAMA TEKNISI"),
    NOC: filteredRosters.filter((r) => r.group_name === "NAMA NOC"),
    PSG: filteredRosters.filter((r) => r.group_name === "NAMA PESERTA PSG"),
  };

  // Badge Styling per Shift Code
  const getShiftBadgeStyle = (code: string) => {
    const normalized = (code || "").toUpperCase();
    if (normalized.includes("PAGI")) return "bg-sky-100 text-sky-900 border-sky-300 font-extrabold";
    if (normalized.includes("SORE")) return "bg-orange-100 text-orange-900 border-orange-300 font-extrabold";
    if (normalized.includes("SOC")) return "bg-amber-500 text-white font-extrabold shadow-2xs";
    if (normalized.includes("MALAM")) return "bg-slate-900 text-white font-extrabold";
    if (normalized.includes("LIBUR")) return "bg-red-600 text-white font-extrabold";
    return "bg-slate-100 text-slate-700 font-semibold";
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">

      {/* Top Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-synerix-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-teal-50 text-teal-700 border border-teal-200 uppercase">
              Operational Management
            </span>
            <span className="text-xs text-synerix-subtext">| Roster Spreadsheet Integration</span>
            {dbStatus === "CONNECTED" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Database Cloud Aktif</span>
              </span>
            )}
            {dbStatus === "ERROR" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                <span>Mode Offline / Seed (DB Belum Siap)</span>
              </span>
            )}
            {dbStatus === "LOADING" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Memeriksa DB...</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-synerix-text tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-teal-700 shrink-0" />
            <span>Shift Operasional & Roster Bulanan</span>
          </h1>
          <p className="text-xs sm:text-sm text-synerix-subtext mt-1 max-w-2xl">
            Manajemen matriks jadwal shift bulanan teknisi, NOC, dan peserta PSG/Magang dengan dukungan input manual per-kelompok & import spreadsheet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
          {/* Tombol Input Manual Baru */}
          <button
            type="button"
            onClick={() => handleOpenCreateModal("NAMA TEKNISI")}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Input Baru</span>
          </button>

          {/* Tombol Edit Manual */}
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Jadwal</span>
          </button>

          {/* Tombol Import Spreadsheet */}
          <button
            type="button"
            onClick={() => {
              setImportMonthYearInput(currentMonthYear);
              setImportGroupTab("NAMA TEKNISI");
              setImportPasteText("");
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Import / Paste Spreadsheet</span>
          </button>

          {/* Tombol Pengajuan Cuti */}
          <button
            type="button"
            onClick={() => setIsLeaveModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Pengajuan Cuti</span>
          </button>
        </div>
      </div>

      {/* Legend & Stats Quick Strip */}
      <div className="p-4 rounded-2xl bg-white border border-synerix-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Legend Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-bold text-slate-700 text-xs mr-1">Legenda Shift:</span>
          <span className="px-2.5 py-1 rounded-md bg-sky-100 text-sky-900 border border-sky-300 font-extrabold text-[11px]">
            PAGI (07:00 - 15:30)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-orange-100 text-orange-900 border border-orange-300 font-extrabold text-[11px]">
            SORE (15:00 - 23:00)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-500 text-white font-extrabold text-[11px]">
            SOC (Standby On Call)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-extrabold text-[11px]">
            MALAM (21:00 - 06:00)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-extrabold text-[11px]">
            LIBUR
          </span>
        </div>

        {/* Right: Quick Month Selection & DB Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-600">Bulan Jadwal:</span>
          <CustomSelect
            options={monthOptions}
            value={selectedMonthYear}
            onChange={(val) => setSelectedMonthYear(val)}
            size="sm"
            className="w-56"
          />
          <button
            type="button"
            onClick={fetchRosters}
            disabled={loading}
            title="Sinkronkan Ulang dengan Database Supabase"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-teal-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-teal-700" : ""}`} />
          </button>
        </div>
      </div>

      {/* Warning Banner jika tabel Supabase belum ada di database */}
      {dbStatus === "ERROR" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">
                Tabel Database Supabase Belum Tersedia ({dbErrorMsg || "PGRST205"})
              </p>
              <p className="text-amber-800 mt-1 leading-relaxed">
                Skema SQL lengkap sudah disiapkan di file <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">supabase/schema_shifts_roster.sql</code>. Silakan buka <strong>Supabase Dashboard &gt; SQL Editor</strong> lalu jalankan file tersebut agar perubahan CRUD (Tambah, Edit, Import, Hapus Jadwal) tersimpan permanen di database cloud.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={fetchRosters}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Coba Hubungkan Ulang</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Controls & Filters */}
      <div className="bg-white rounded-2xl border border-synerix-border p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("ROSTER_MATRIX")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "ROSTER_MATRIX"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Matriks Spreadsheet Bulanan ({filteredRosters.length} Karyawan)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("LEAVE_REQUESTS")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "LEAVE_REQUESTS"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Pengajuan Cuti / Izin ({leaves.length})
            </button>
          </div>

          {/* Controls: Search & Group Filter */}
          {activeTab === "ROSTER_MATRIX" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <CustomSelect
                options={groupFilterOptions}
                value={selectedGroup}
                onChange={(val) => setSelectedGroup(val)}
                size="sm"
                className="w-48"
              />
            </div>
          )}
        </div>

        {/* TAB 1: SPREADSHEET ROSTER MATRIX VIEW */}
        {activeTab === "ROSTER_MATRIX" && (
          <div className="overflow-x-auto no-scrollbar border border-slate-200 rounded-xl relative">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                {/* Header Month Title Banner */}
                <tr className="bg-gradient-to-r from-slate-900 to-teal-900 text-white font-extrabold text-xs">
                  <th className="sticky left-0 z-20 bg-slate-950 py-2.5 px-2 border-r border-slate-700 text-center min-w-[44px]">
                    NO
                  </th>
                  <th className="sticky left-[44px] z-20 bg-slate-950 py-2.5 px-4 border-r border-slate-700 text-left min-w-[190px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                    NAMA KARYAWAN / TEKNISI
                  </th>
                  <th colSpan={31} className="py-2.5 tracking-wider uppercase">
                    {selectedMonthYear}
                  </th>
                  <th className="sticky right-0 z-20 bg-slate-950 py-2.5 px-3 border-l border-slate-700 text-center min-w-[85px] shadow-[-2px_0_5px_rgba(0,0,0,0.3)]">
                    AKSI
                  </th>
                </tr>

                {/* Day Numbers 1 to 31 */}
                <tr className="bg-slate-100 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                  <th className="sticky left-0 z-10 bg-slate-100 py-1.5 px-2 border-r border-slate-300 text-center font-bold">
                    #
                  </th>
                  <th className="sticky left-[44px] z-10 bg-slate-100 py-1.5 px-4 border-r border-slate-300 text-left min-w-[190px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    GRUP & KARYAWAN
                  </th>
                  {daysArray.map((d) => (
                    <th key={d} className="py-1.5 px-1 border-r border-slate-200 min-w-[34px]">
                      {d}
                    </th>
                  ))}
                  <th className="sticky right-0 z-10 bg-slate-100 py-1.5 px-2 border-l border-slate-300 text-center min-w-[85px] shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                    OPERASI
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-[11px] font-semibold">
                
                {/* GROUP 1: NAMA TEKNISI */}
                {groupedRosters.TEKNISI.length > 0 && (
                  <>
                    <tr className="bg-teal-800 text-white font-extrabold text-xs text-left">
                      <td colSpan={34} className="py-2 px-4 uppercase tracking-wider bg-teal-900">
                        🔹 GROUP: NAMA TEKNISI ({groupedRosters.TEKNISI.length} PERSONEL)
                      </td>
                    </tr>
                    {groupedRosters.TEKNISI.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-2 px-2 border-r border-slate-200 font-mono text-slate-500 font-bold text-center">
                          {idx + 1}
                        </td>
                        <td className="sticky left-[44px] z-10 bg-white group-hover:bg-slate-50 py-2 px-4 border-r border-slate-200 text-left font-bold text-slate-900 truncate min-w-[190px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                          {emp.employee_name}
                        </td>
                        {daysArray.map((d) => {
                          const shiftCode = emp.daily_shifts[String(d)] || "LIBUR";
                          const badgeStyle = getShiftBadgeStyle(shiftCode);
                          return (
                            <td key={d} className="py-1 px-0.5 border-r border-slate-200">
                              <button
                                type="button"
                                title={`Klik untuk ubah cepat shift tgl ${d} (${emp.employee_name}): ${shiftCode}`}
                                onClick={() => handleQuickCycleShift(emp, d)}
                                className={`inline-block w-full py-1 text-[10px] rounded uppercase cursor-pointer transition-all hover:scale-105 active:scale-95 ${badgeStyle}`}
                              >
                                {shiftCode}
                              </button>
                            </td>
                          );
                        })}
                        <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50 py-1 px-1 border-l border-slate-200 text-center shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="Edit Jadwal Personel"
                              onClick={() => handleEditRowDirect(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Hapus Personel dari Jadwal"
                              onClick={() => handleDeleteRoster(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* GROUP 2: NAMA NOC */}
                {groupedRosters.NOC.length > 0 && (
                  <>
                    <tr className="bg-blue-800 text-white font-extrabold text-xs text-left">
                      <td colSpan={34} className="py-2 px-4 uppercase tracking-wider bg-blue-900">
                        🔹 GROUP: NAMA NOC ({groupedRosters.NOC.length} PERSONEL)
                      </td>
                    </tr>
                    {groupedRosters.NOC.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-2 px-2 border-r border-slate-200 font-mono text-slate-500 font-bold text-center">
                          {idx + 1}
                        </td>
                        <td className="sticky left-[44px] z-10 bg-white group-hover:bg-slate-50 py-2 px-4 border-r border-slate-200 text-left font-bold text-slate-900 truncate min-w-[190px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                          {emp.employee_name}
                        </td>
                        {daysArray.map((d) => {
                          const shiftCode = emp.daily_shifts[String(d)] || "LIBUR";
                          const badgeStyle = getShiftBadgeStyle(shiftCode);
                          return (
                            <td key={d} className="py-1 px-0.5 border-r border-slate-200">
                              <button
                                type="button"
                                title={`Klik untuk ubah cepat shift tgl ${d} (${emp.employee_name}): ${shiftCode}`}
                                onClick={() => handleQuickCycleShift(emp, d)}
                                className={`inline-block w-full py-1 text-[10px] rounded uppercase cursor-pointer transition-all hover:scale-105 active:scale-95 ${badgeStyle}`}
                              >
                                {shiftCode}
                              </button>
                            </td>
                          );
                        })}
                        <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50 py-1 px-1 border-l border-slate-200 text-center shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="Edit Jadwal Personel"
                              onClick={() => handleEditRowDirect(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Hapus Personel dari Jadwal"
                              onClick={() => handleDeleteRoster(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* GROUP 3: NAMA PESERTA PSG */}
                {groupedRosters.PSG.length > 0 && (
                  <>
                    <tr className="bg-amber-700 text-white font-extrabold text-xs text-left">
                      <td colSpan={34} className="py-2 px-4 uppercase tracking-wider bg-amber-800">
                        🔹 GROUP: NAMA PESERTA PSG / MAGANG ({groupedRosters.PSG.length} PERSONEL)
                      </td>
                    </tr>
                    {groupedRosters.PSG.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-2 px-2 border-r border-slate-200 font-mono text-slate-500 font-bold text-center">
                          {idx + 1}
                        </td>
                        <td className="sticky left-[44px] z-10 bg-white group-hover:bg-slate-50 py-2 px-4 border-r border-slate-200 text-left font-bold text-slate-900 truncate min-w-[190px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                          {emp.employee_name}
                        </td>
                        {daysArray.map((d) => {
                          const shiftCode = emp.daily_shifts[String(d)] || "LIBUR";
                          const badgeStyle = getShiftBadgeStyle(shiftCode);
                          return (
                            <td key={d} className="py-1 px-0.5 border-r border-slate-200">
                              <button
                                type="button"
                                title={`Klik untuk ubah cepat shift tgl ${d} (${emp.employee_name}): ${shiftCode}`}
                                onClick={() => handleQuickCycleShift(emp, d)}
                                className={`inline-block w-full py-1 text-[10px] rounded uppercase cursor-pointer transition-all hover:scale-105 active:scale-95 ${badgeStyle}`}
                              >
                                {shiftCode}
                              </button>
                            </td>
                          );
                        })}
                        <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50 py-1 px-1 border-l border-slate-200 text-center shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="Edit Jadwal Personel"
                              onClick={() => handleEditRowDirect(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Hapus Personel dari Jadwal"
                              onClick={() => handleDeleteRoster(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {filteredRosters.length === 0 && (
                  <tr>
                    <td colSpan={34} className="py-12 text-center text-slate-400 text-xs">
                      Belum ada data jadwal shift untuk bulan {selectedMonthYear}. Klik &ldquo;+ Input Baru&rdquo; atau &ldquo;Import Spreadsheet&rdquo; di atas untuk mengisi jadwal.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PENGAJUAN CUTI & IZIN */}
        {activeTab === "LEAVE_REQUESTS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daftar Tiket Pengajuan Cuti, Izin & Tukar Shift</h3>
                <p className="text-xs text-slate-500">Tersinkronisasi otomatis dengan database Supabase.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0 self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Pengajuan Cuti Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {leaves.map((leave) => (
                <div key={leave.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {leave.requestType.replace("_", " ")}
                      </span>
                      {leave.groupName && (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {leave.groupName}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        leave.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : leave.status === "REJECTED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{leave.employeeName}</h4>
                    <p className="text-slate-600 text-xs font-semibold mt-0.5">
                      📅 Periode: <span className="text-slate-900">{leave.startDate}</span> s/d <span className="text-slate-900">{leave.endDate}</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 italic text-[11px]">
                    &ldquo;{leave.reason}&rdquo;
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      Diajukan: {leave.createdAt || "Baru saja"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {leave.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateLeaveStatus(leave.id, "APPROVED")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all active:scale-95"
                          >
                            <Check className="h-3 w-3" />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateLeaveStatus(leave.id, "REJECTED")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-all active:scale-95"
                          >
                            <X className="h-3 w-3" />
                            <span>Tolak</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        title="Hapus Tiket"
                        onClick={() => handleDeleteLeave(leave.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {leaves.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  Belum ada riwayat pengajuan cuti. Klik tombol &ldquo;+ Pengajuan Cuti Baru&rdquo; untuk mengajukan.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL INPUT & EDIT JADWAL MANUAL (3 FORMS / GROUPS: TEKNISI, NOC, PSG) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-teal-700" />
                <span>{modalMode === "EDIT" ? "Edit Jadwal Karyawan" : "Input Jadwal Karyawan Baru"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRoster} className="mt-4 space-y-4 text-xs">
              
              {/* 3 GROUP SELECTION TABS (FORM FOR TEKNISI, NOC, PSG) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  1. Pilih Kelompok / Tim Personel (3 Form Kategori) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormGroupName("NAMA TEKNISI")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      formGroupName === "NAMA TEKNISI"
                        ? "bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-extrabold text-xs uppercase flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" /> NAMA TEKNISI
                    </span>
                    <span className={`text-[10px] ${formGroupName === "NAMA TEKNISI" ? "text-teal-100" : "text-slate-500"}`}>
                      Tim Lapangan & Splicer
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormGroupName("NAMA NOC")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      formGroupName === "NAMA NOC"
                        ? "bg-blue-700 text-white border-blue-800 shadow-sm ring-2 ring-blue-500/40"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-extrabold text-xs uppercase flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> NAMA NOC
                    </span>
                    <span className={`text-[10px] ${formGroupName === "NAMA NOC" ? "text-blue-100" : "text-slate-500"}`}>
                      Network Operations Center
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormGroupName("NAMA PESERTA PSG")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      formGroupName === "NAMA PESERTA PSG"
                        ? "bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-500/40"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-extrabold text-xs uppercase flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> NAMA PESERTA PSG
                    </span>
                    <span className={`text-[10px] ${formGroupName === "NAMA PESERTA PSG" ? "text-amber-100" : "text-slate-500"}`}>
                      Siswa Magang / PKL
                    </span>
                  </button>
                </div>
              </div>

              {/* Employee Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Karyawan / Personel *
                  </label>
                  {modalMode === "CREATE" ? (
                    <input
                      type="text"
                      required
                      placeholder="Contoh: DAVID ARDIANSYAH"
                      value={formEmployeeName}
                      onChange={(e) => setFormEmployeeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold uppercase text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  ) : (
                    <CustomSelect
                      options={[
                        { value: "", label: "-- Pilih Karyawan --" },
                        ...rosterRows
                          .filter(
                            (r) =>
                              r.month_year === formMonthYear.toUpperCase().trim() &&
                              r.group_name === formGroupName
                          )
                          .map((r) => ({ value: r.employee_name, label: r.employee_name }))
                      ]}
                      value={formEmployeeName}
                      onChange={(val) => handleEmployeeSelect(val)}
                      size="sm"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bulan & Tahun *
                  </label>
                  <CustomSelect
                    options={monthOptions}
                    value={formMonthYear}
                    onChange={(val) => setFormMonthYear(val)}
                    size="sm"
                  />
                </div>
              </div>

              {/* 31-Day Shift Grid with Preset Shortcuts */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="font-bold text-slate-700 text-xs">
                    2. Pengaturan Shift 31 Hari ({formMonthYear})
                  </label>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500 font-semibold mr-1">Fast Set All:</span>
                    <button
                      type="button"
                      onClick={() => handlePresetFill("PAGI")}
                      className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 font-bold"
                    >
                      PAGI
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetFill("SORE")}
                      className="px-2 py-0.5 rounded bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 font-bold"
                    >
                      SORE
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetFill("SOC")}
                      className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold"
                    >
                      SOC
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetFill("MALAM")}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    >
                      MALAM
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetFill("LIBUR")}
                      className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      LIBUR
                    </button>
                  </div>
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-[320px] overflow-y-auto no-scrollbar">
                  {daysArray.map((d) => {
                    const currentVal = formDailyShifts[String(d)] || "LIBUR";
                    return (
                      <div key={d} className="p-1.5 rounded-lg bg-white border border-slate-200 flex flex-col gap-1 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all group hover:border-teal-300">
                        <div className="flex items-center justify-between px-1">
                          <span className="font-extrabold text-[10px] text-slate-400 group-focus-within:text-teal-700">Tgl {d}</span>
                        </div>
                        <button
                          type="button"
                          tabIndex={0}
                          onClick={() => cycleShift(d, 1)}
                          onKeyDown={(e) => handleCellKeyDown(e, d)}
                          title="Gunakan Spasi / Panah untuk mengubah"
                          className={`relative w-full py-1.5 pl-2 pr-5 rounded border-none font-extrabold text-[10px] uppercase text-left transition-all outline-none ${getShiftBadgeStyle(currentVal)}`}
                        >
                          {currentVal}
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 opacity-70">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="7 10 12 15 17 10"></polyline>
                            </svg>
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{savingManual ? "Menyimpan..." : editingRowId ? "Simpan Perubahan Jadwal" : "Tambah Personel & Jadwal"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT / PASTE GOOGLE SPREADSHEET DATA — 3 GROUP TABS */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Import Jadwal per Kelompok
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImportSpreadsheet} className="mt-4 space-y-4 text-xs">

              {/* Step 1: Pilih Bulan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  1. Bulan & Tahun Jadwal *
                </label>
                <CustomSelect
                  options={monthOptions}
                  value={importMonthYearInput}
                  onChange={(val) => setImportMonthYearInput(val)}
                  size="sm"
                  className="w-full sm:w-64"
                />
              </div>

              {/* Step 2: Pilih Kelompok */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  2. Pilih Kelompok yang Diimpor *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setImportGroupTab("NAMA TEKNISI"); setImportPasteText(""); }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      importGroupTab === "NAMA TEKNISI"
                        ? "bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-extrabold text-xs uppercase flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" /> TEKNIS
                    </span>
                    <span className={`text-[10px] ${importGroupTab === "NAMA TEKNISI" ? "text-teal-100" : "text-slate-500"}`}>
                      Tim Lapangan & Splicer
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setImportGroupTab("NAMA NOC"); setImportPasteText(""); }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      importGroupTab === "NAMA NOC"
                        ? "bg-blue-700 text-white border-blue-800 shadow-sm ring-2 ring-blue-500/40"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-extrabold text-xs uppercase flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> NOC
                    </span>
                    <span className={`text-[10px] ${importGroupTab === "NAMA NOC" ? "text-blue-100" : "text-slate-500"}`}>
                      Network Operations Center
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setImportGroupTab("NAMA PESERTA PSG"); setImportPasteText(""); }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      importGroupTab === "NAMA PESERTA PSG"
                        ? "bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-500/40"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-extrabold text-xs uppercase flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> PSG
                    </span>
                    <span className={`text-[10px] ${importGroupTab === "NAMA PESERTA PSG" ? "text-amber-100" : "text-slate-500"}`}>
                      Siswa Magang / PKL
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 3: Paste Area */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Tempel (Paste) Data Grup{" "}
                  <span className={`uppercase ${
                    importGroupTab === "NAMA TEKNISI" ? "text-teal-700" :
                    importGroupTab === "NAMA NOC" ? "text-blue-700" : "text-amber-700"
                  }`}>
                    {importGroupTab === "NAMA TEKNISI" ? "Teknis" : importGroupTab === "NAMA NOC" ? "NOC" : "PSG"}
                  </span>{" "}
                  dari Google Spreadsheet *
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Blok <strong>hanya baris personel grup {importGroupTab === "NAMA TEKNISI" ? "Teknis" : importGroupTab === "NAMA NOC" ? "NOC" : "PSG"}</strong> di
                  spreadsheet (No, Nama, lalu kolom shift tanggal 1-31), lalu <kbd className="bg-slate-100 px-1 border rounded">Ctrl+C</kbd> → <kbd className="bg-slate-100 px-1 border rounded">Ctrl+V</kbd> di bawah:
                </p>
                <textarea
                  rows={8}
                  required
                  placeholder={`Contoh tempelan:\n1\tDAVID ARDIANSYAH\tSOC\tLIBUR\tLIBUR\tMALAM\tMALAM\n2\tPANDU PRADANA\tLIBUR\tLIBUR\tPAGI\tPAGI...`}
                  value={importPasteText}
                  onChange={(e) => setImportPasteText(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-mono text-[11px] focus:ring-2 focus:outline-none bg-slate-50 ${
                    importGroupTab === "NAMA TEKNISI" ? "border-teal-300 focus:ring-teal-500" :
                    importGroupTab === "NAMA NOC" ? "border-blue-300 focus:ring-blue-500" :
                    "border-amber-300 focus:ring-amber-500"
                  }`}
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-400">
                  Import akan menimpa data grup <strong>{importGroupTab === "NAMA TEKNISI" ? "Teknis" : importGroupTab === "NAMA NOC" ? "NOC" : "PSG"}</strong> bulan <strong>{importMonthYearInput}</strong>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={importing}
                    className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 ${
                      importGroupTab === "NAMA TEKNISI" ? "bg-teal-700 hover:bg-teal-800" :
                      importGroupTab === "NAMA NOC" ? "bg-blue-700 hover:bg-blue-800" :
                      "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>{importing ? "Memproses..." : `Import Grup ${importGroupTab === "NAMA TEKNISI" ? "Teknis" : importGroupTab === "NAMA NOC" ? "NOC" : "PSG"}`}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENGAJUAN CUTI */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-teal-700" />
                Form Pengajuan Cuti / Izin
              </h3>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Personel / Karyawan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: DAVID ARDIANSYAH"
                  value={leaveEmployeeName}
                  onChange={(e) => setLeaveEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold uppercase text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelompok / Tim *
                  </label>
                  <CustomSelect
                    options={[
                      { value: "NAMA TEKNISI", label: "NAMA TEKNISI" },
                      { value: "NAMA NOC", label: "NAMA NOC" },
                      { value: "NAMA PESERTA PSG", label: "NAMA PESERTA PSG" },
                    ]}
                    value={leaveGroupName}
                    onChange={(val) => setLeaveGroupName(val)}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Pengajuan *
                  </label>
                  <CustomSelect
                    options={[
                      { value: "CUTI_TAHUNAN", label: "Cuti Tahunan (Potong Kuota)" },
                      { value: "TUKAR_SHIFT", label: "Tukar Shift Operasional" },
                      { value: "IZIN_SAKIT", label: "Izin Sakit / Darurat" },
                    ]}
                    value={leaveType}
                    onChange={(val) => setLeaveType(val as LeaveRequest["requestType"])}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Selesai *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan & Keterangan Pengajuan *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan alasan pengajuan cuti atau skema penukaran shift dengan rekan teknisi..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submittingLeave ? "Kirim Pengajuan..." : "Kirim Pengajuan Cuti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
