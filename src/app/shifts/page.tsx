"use client";

import { useState, useEffect } from "react";
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
  Check
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

export default function ShiftsPage() {
  const supabase = createClient();
  const [selectedMonthYear, setSelectedMonthYear] = useState("AGUSTUS 2026");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ROSTER_MATRIX" | "DAILY_LIST" | "LEAVE_REQUESTS">("ROSTER_MATRIX");

  const [rosterRows, setRosterRows] = useState<ShiftRosterRow[]>(SEED_ROSTERS_AGUSTUS);
  const [loading, setLoading] = useState(false);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMonthYearInput, setImportMonthYearInput] = useState("AGUSTUS 2026");
  const [importPasteText, setImportPasteText] = useState("");
  const [importing, setImporting] = useState(false);

  // Manual Add / Edit Schedule Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [formGroupName, setFormGroupName] = useState<string>("NAMA TEKNISI");
  const [formEmployeeName, setFormEmployeeName] = useState("");
  const [formMonthYear, setFormMonthYear] = useState("AGUSTUS 2026");
  const [formDailyShifts, setFormDailyShifts] = useState<Record<string, string>>({});
  const [savingManual, setSavingManual] = useState(false);

  // Leave Form & State
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRequest["requestType"]>("CUTI_TAHUNAN");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Fetch data Roster dari Supabase
  const fetchRosters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shift_rosters")
        .select("*")
        .eq("month_year", selectedMonthYear);

      if (data && data.length > 0) {
        setRosterRows(data as ShiftRosterRow[]);
      } else {
        // Fallback seed data jika belum ada di database untuk bulan ini
        if (selectedMonthYear === "AGUSTUS 2026") {
          setRosterRows(SEED_ROSTERS_AGUSTUS);
        } else {
          setRosterRows([]);
        }
      }
    } catch (e) {
      console.warn("Using initial seed rosters:", e);
      if (selectedMonthYear === "AGUSTUS 2026") {
        setRosterRows(SEED_ROSTERS_AGUSTUS);
      } else {
        setRosterRows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRosters();
  }, [selectedMonthYear]);

  // Open Modal Manual Create
  const handleOpenCreateModal = (defaultGroup: string = "NAMA TEKNISI") => {
    setModalMode("CREATE");
    setEditingRowId(null);
    setFormGroupName(defaultGroup);
    setFormEmployeeName("");
    setFormMonthYear(selectedMonthYear);

    // Initial 31 days set to PAGI
    const initialShifts: Record<string, string> = {};
    for (let i = 1; i <= 31; i++) {
      initialShifts[String(i)] = "PAGI";
    }
    setFormDailyShifts(initialShifts);
    setIsManualModalOpen(true);
  };

  // Open Modal Manual Edit
  const handleOpenEditModal = () => {
    setModalMode("EDIT");
    setEditingRowId(null);
    setFormGroupName("NAMA TEKNISI");
    setFormEmployeeName("");
    setFormMonthYear(selectedMonthYear);

    // Initial 31 days set to LIBUR before selection
    const initialShifts: Record<string, string> = {};
    for (let i = 1; i <= 31; i++) {
      initialShifts[String(i)] = "LIBUR";
    }
    setFormDailyShifts(initialShifts);
    setIsManualModalOpen(true);
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

  // Save / Update Manual Entry
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

      // Try saving to Supabase
      try {
        await supabase.from("shift_rosters").upsert(payload);
      } catch (err) {
        console.warn("Could not sync to Supabase, saving locally:", err);
      }

      if (editingRowId || existingRow) {
        setRosterRows((prev) => prev.map((item) => (item.id === targetId ? payload : item)));
        alert(`Berhasil memperbarui jadwal shift untuk ${payload.employee_name}`);
      } else {
        setRosterRows((prev) => [payload, ...prev]);
        alert(`Berhasil menambahkan personel & jadwal baru untuk ${payload.employee_name}`);
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

  const handleCellKeyDown = (e: React.KeyboardEvent, dayIndex: number) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      cycleShift(dayIndex, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      cycleShift(dayIndex, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Mock event for form submission
      handleSaveManualRoster({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  // Handle Import / Paste Data Google Spreadsheet
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
      let currentGroup = "NAMA TEKNISI";

      lines.forEach((line) => {
        const columns = line.split("\t").map((c) => c.trim());
        if (columns.length === 0 || !columns[0]) return;

        const firstCol = columns[0].toUpperCase();
        if (firstCol.includes("NAMA NOC")) {
          currentGroup = "NAMA NOC";
          return;
        } else if (firstCol.includes("NAMA PESERTA") || firstCol.includes("PSG")) {
          currentGroup = "NAMA PESERTA PSG";
          return;
        } else if (firstCol.includes("NAMA TEKNISI")) {
          currentGroup = "NAMA TEKNISI";
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

        if (empName && !empName.toUpperCase().includes("SHIFT") && !empName.toUpperCase().includes("ISTIRAHAT")) {
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
            group_name: currentGroup,
            employee_name: empName,
            daily_shifts,
          });
        }
      });

      if (newParsedRows.length > 0) {
        try {
          await supabase.from("shift_rosters").insert(newParsedRows);
        } catch (err) {
          console.warn("Gagal simpan ke Supabase, menyimpan lokal:", err);
        }

        setRosterRows(newParsedRows);
        setSelectedMonthYear(importMonthYearInput.toUpperCase());
        setIsImportModalOpen(false);
        setImportPasteText("");
        alert(`Berhasil mengimpor ${newParsedRows.length} baris jadwal shift dari Google Spreadsheet!`);
      } else {
        alert("Format data tidak dikenali. Pastikan menyalin baris tabel langsung dari Google Spreadsheet.");
      }
    } catch (err: any) {
      alert("Gagal memproses data spreadsheet: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Submit Cuti Form
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      alert("Tanggal dan alasan pengajuan wajib diisi.");
      return;
    }

    setSubmittingLeave(true);
    setTimeout(() => {
      const newLeave: LeaveRequest = {
        id: crypto.randomUUID(),
        requestType: leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
        status: "PENDING",
        createdAt: new Date().toISOString().split("T")[0],
      };

      setLeaves([newLeave, ...leaves]);
      setIsLeaveModalOpen(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      setSubmittingLeave(false);
    }, 400);
  };

  // Month & Group Filter options
  const monthOptions: SelectOption[] = [
    { value: "AGUSTUS 2026", label: "Agustus 2026" },
    { value: "SEPTEMBER 2026", label: "September 2026" },
    { value: "OKTOBER 2026", label: "Oktober 2026" },
    { value: "NOVEMBER 2026", label: "November 2026" },
    { value: "DESEMBER 2026", label: "Desember 2026" },
  ];

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
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-teal-50 text-teal-700 border border-teal-200 uppercase">
              Operational Management
            </span>
            <span className="text-xs text-synerix-subtext">| Roster Spreadsheet Integration</span>
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
            onClick={() => setIsImportModalOpen(true)}
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

        {/* Right: Quick Month Selection */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-600">Bulan Jadwal:</span>
          <CustomSelect
            options={monthOptions}
            value={selectedMonthYear}
            onChange={(val) => setSelectedMonthYear(val)}
            size="sm"
            className="w-44"
          />
        </div>
      </div>

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
          <div className="overflow-x-auto no-scrollbar border border-slate-200 rounded-xl">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                {/* Header Month Title Banner */}
                <tr className="bg-gradient-to-r from-slate-900 to-teal-900 text-white font-extrabold text-xs">
                  <th className="py-2.5 px-2 border-r border-slate-700 text-left min-w-[40px]">NO</th>
                  <th className="py-2.5 px-4 border-r border-slate-700 text-left min-w-[180px]">
                    NAMA KARYAWAN / TEKNISI
                  </th>
                  <th colSpan={31} className="py-2.5 tracking-wider uppercase">
                    {selectedMonthYear}
                  </th>
                </tr>

                {/* Day Numbers 1 to 31 */}
                <tr className="bg-slate-100 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                  <th className="py-1.5 px-2 border-r border-slate-300">#</th>
                  <th className="py-1.5 px-4 border-r border-slate-300 text-left">GRUP & KARYAWAN</th>
                  {daysArray.map((d) => (
                    <th key={d} className="py-1.5 px-1 border-r border-slate-200 min-w-[34px]">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-[11px] font-semibold">
                
                {/* GROUP 1: NAMA TEKNISI */}
                {groupedRosters.TEKNISI.length > 0 && (
                  <>
                    <tr className="bg-teal-800 text-white font-extrabold text-xs text-left">
                      <td colSpan={33} className="py-2 px-4 uppercase tracking-wider bg-teal-900">
                        🔹 GROUP: NAMA TEKNISI ({groupedRosters.TEKNISI.length} PERSONEL)
                      </td>
                    </tr>
                    {groupedRosters.TEKNISI.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2 border-r border-slate-200 font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-4 border-r border-slate-200 text-left font-bold text-slate-900 truncate">
                          {emp.employee_name}
                        </td>
                        {daysArray.map((d) => {
                          const shiftCode = emp.daily_shifts[String(d)] || "LIBUR";
                          const badgeStyle = getShiftBadgeStyle(shiftCode);
                          return (
                            <td key={d} className="py-1 px-0.5 border-r border-slate-200">
                              <span className={`inline-block w-full py-1 text-[10px] rounded uppercase ${badgeStyle}`}>
                                {shiftCode}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}

                {/* GROUP 2: NAMA NOC */}
                {groupedRosters.NOC.length > 0 && (
                  <>
                    <tr className="bg-blue-800 text-white font-extrabold text-xs text-left">
                      <td colSpan={33} className="py-2 px-4 uppercase tracking-wider bg-blue-900">
                        🔹 GROUP: NAMA NOC ({groupedRosters.NOC.length} PERSONEL)
                      </td>
                    </tr>
                    {groupedRosters.NOC.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2 border-r border-slate-200 font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-4 border-r border-slate-200 text-left font-bold text-slate-900 truncate">
                          {emp.employee_name}
                        </td>
                        {daysArray.map((d) => {
                          const shiftCode = emp.daily_shifts[String(d)] || "LIBUR";
                          const badgeStyle = getShiftBadgeStyle(shiftCode);
                          return (
                            <td key={d} className="py-1 px-0.5 border-r border-slate-200">
                              <span className={`inline-block w-full py-1 text-[10px] rounded uppercase ${badgeStyle}`}>
                                {shiftCode}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}

                {/* GROUP 3: NAMA PESERTA PSG */}
                {groupedRosters.PSG.length > 0 && (
                  <>
                    <tr className="bg-amber-700 text-white font-extrabold text-xs text-left">
                      <td colSpan={33} className="py-2 px-4 uppercase tracking-wider bg-amber-800">
                        🔹 GROUP: NAMA PESERTA PSG / MAGANG ({groupedRosters.PSG.length} PERSONEL)
                      </td>
                    </tr>
                    {groupedRosters.PSG.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2 border-r border-slate-200 font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-4 border-r border-slate-200 text-left font-bold text-slate-900 truncate">
                          {emp.employee_name}
                        </td>
                        {daysArray.map((d) => {
                          const shiftCode = emp.daily_shifts[String(d)] || "LIBUR";
                          const badgeStyle = getShiftBadgeStyle(shiftCode);
                          return (
                            <td key={d} className="py-1 px-0.5 border-r border-slate-200">
                              <span className={`inline-block w-full py-1 text-[10px] rounded uppercase ${badgeStyle}`}>
                                {shiftCode}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}

                {filteredRosters.length === 0 && (
                  <tr>
                    <td colSpan={33} className="py-12 text-center text-slate-400 text-xs">
                      Belum ada data jadwal shift untuk bulan {selectedMonthYear}. Klik &ldquo;+ Input / Edit Manual&rdquo; atau &ldquo;Import Spreadsheet&rdquo; di atas untuk mengisi jadwal.
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Daftar Tiket Pengajuan Cuti & Izin</h3>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold"
              >
                + Pengajuan Cuti Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {leaves.map((leave) => (
                <div key={leave.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200">
                      {leave.requestType.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {leave.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">
                    Periode: {leave.startDate} s/d {leave.endDate}
                  </div>
                  <p className="text-slate-600 italic">&ldquo;{leave.reason}&rdquo;</p>
                </div>
              ))}

              {leaves.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  Belum ada riwayat pengajuan cuti.
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

      {/* MODAL IMPORT / PASTE GOOGLE SPREADSHEET DATA */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Import / Paste Jadwal Google Spreadsheet
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImportSpreadsheet} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bulan & Tahun Jadwal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AGUSTUS 2026"
                  value={importMonthYearInput}
                  onChange={(e) => setImportMonthYearInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold uppercase text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempel (Paste) Salinan Baris dari Google Spreadsheet *
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Buka Google Spreadsheet perusahaan, blok baris tabel jadwal dari kolom Nama hingga tanggal 31, tekan <kbd className="bg-slate-100 px-1 border rounded">Ctrl+C</kbd>, lalu paste (<kbd className="bg-slate-100 px-1 border rounded">Ctrl+V</kbd>) di kotak bawah:
                </p>
                <textarea
                  rows={8}
                  required
                  placeholder={`Contoh tempelan:\n1\tDAVID ARDIANSYAH\tSOC\tLIBUR\tLIBUR\tMALAM\tMALAM\n2\tPANDU PRADANA\tLIBUR\tLIBUR\tPAGI\tPAGI...`}
                  value={importPasteText}
                  onChange={(e) => setImportPasteText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  <span>{importing ? "Memproses Data..." : "Proses & Simpan Jadwal"}</span>
                </button>
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
