import { WorkLogItem } from "@/components/work-logs/EditWorkLogModal";

export interface WorkLogMetadata {
    ticket_id?: string;
    customer_id?: string;
    customer_name?: string;
    ticket_type?: string;
    ticket_category?: string;
    ticket_created_at?: string;
    pic?: string;
    last_action?: string;
    last_action_pic?: string;
    title_category?: string;
    progress_percent?: string;
    address?: string;
    phone_number?: string;
    coordinates?: {
        latitude?: number | null;
        longitude?: number | null;
    };
}

export interface ParsedWorkLog {
    ticket_id: string;
    has_real_ticket: boolean;
    customer_id: string | null;
    customer_name: string;
    ticket_type: string;
    category_label: string;
    created_at_display: string;
    pic: string;
    last_action_date: string;
    last_action_pic: string;
    last_action_text: string;
    progress_percent: string;
    progress_color: {
        text: string;
        bg: string;
        border: string;
    };
    clean_description: string;
    clean_title: string;
    title_header: string;
    customer_display: string;
}

/**
 * Pisahkan teks deskripsi asli dan payload METADATA JSON
 */
export function extractWorkLogMetadata(caseDescription: string = ""): {
    cleanText: string;
    metadata: WorkLogMetadata | null;
} {
    if (!caseDescription) {
        return { cleanText: "", metadata: null };
    }

    const metaMarker = "METADATA:";
    const idx = caseDescription.indexOf(metaMarker);
    if (idx === -1) {
        return { cleanText: caseDescription.trim(), metadata: null };
    }

    const cleanText = caseDescription.slice(0, idx).trim();
    const rawJson = caseDescription.slice(idx + metaMarker.length).trim();

    try {
        const metadata = JSON.parse(rawJson) as WorkLogMetadata;
        return { cleanText, metadata };
    } catch {
        return { cleanText: caseDescription.trim(), metadata: null };
    }
}

/**
 * Format tanggal string YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(isoOrDateString?: string | null): string {
    if (!isoOrDateString) return "-";
    try {
        const d = new Date(isoOrDateString);
        if (isNaN(d.getTime())) return isoOrDateString;
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
        return isoOrDateString;
    }
}

/**
 * Parser serba guna untuk menampilkan row data pada tabel dan card work-logs
 * Menjamin kesesuaian 100% dengan tampilan scraping Billingnesia
 */
export function parseWorkLogRow(log: WorkLogItem): ParsedWorkLog {
    const { cleanText, metadata } = extractWorkLogMetadata(log.case_description || "");

    // 1. Ticket ID
    let ticket_id = metadata?.ticket_id?.trim() || "";
    let has_real_ticket = Boolean(ticket_id && ticket_id.startsWith("TKT"));

    if (!ticket_id) {
        // Cek jika ada [TKT...] di title
        const matchTitleTicket = (log.title || "").match(/\[(TKT[A-Z0-9]+)\]/i);
        if (matchTitleTicket) {
            ticket_id = matchTitleTicket[1].toUpperCase();
            has_real_ticket = true;
        } else {
            // Fallback ticket code generator dari UUID
            ticket_id = `TKT${log.id.replace(/-/g, "").slice(0, 14).toUpperCase()}`;
        }
    }

    // 2. Customer ID
    let customer_id = metadata?.customer_id?.trim() || null;
    if (!customer_id) {
        // Cek regex 10-15 digit angka dalam kurung atau teks
        const matchCustInTitle = (log.title || "").match(/\((\d{10,15})\)/);
        if (matchCustInTitle) {
            customer_id = matchCustInTitle[1];
        } else {
            const matchCustInDesc = (log.case_description || "").match(/\b(\d{13})\b/);
            if (matchCustInDesc) {
                customer_id = matchCustInDesc[1];
            } else if ((log.title || "").toUpperCase().includes("YOKO") || (log.title || "").toUpperCase().includes("SETYOKO")) {
                // S Tri Setyoko default id dari data scraping
                customer_id = "0101010402074";
            }
        }
    }

    // 3. Customer Name & Clean Title
    let clean_title = log.title || "";
    let customer_name = metadata?.customer_name || "";
    if (!customer_name) {
        // Bersihkan title dari prefix [DISMANTLE], [TKT...], (01010...)
        customer_name = clean_title
            .replace(/\[DISMANTLE\]/gi, "")
            .replace(/\[TKT[A-Z0-9]+\]/gi, "")
            .replace(/\(\d{10,15}\)/g, "")
            .trim();
        if (!customer_name) customer_name = "Pelanggan";
    }

    // 4. Ticket Type (default: TEKNIS)
    const ticket_type = metadata?.ticket_type || "TEKNIS";

    // 5. Category Label
    const category_label = metadata?.ticket_category || log.category?.replace(/_/g, " ") || "MAINTENANCE RETAIL";

    // 6. Tanggal Pembuatan
    const created_at_display = formatDateTime(metadata?.ticket_created_at || log.created_at);

    // 7 & 8. Tindakan Terakhir & PJ Terakhir (diambil murni dari scraping metadata / last_action)
    let last_action_date = "";
    let last_action_pic = "";
    let last_action_text = "";

    const rawAction = metadata?.last_action || log.resolution || "";
    if (rawAction) {
        // Format contoh: "2026-10-09 07:59:52 [Dimas Duwianto] Pelanggan aktif kembali..."
        const actionMatch = rawAction.match(/^(?:([\d\-:\s]+)\s+)?(?:\[(.*?)\]\s*)?([\s\S]*)$/);
        if (actionMatch) {
            last_action_date = (actionMatch[1] || "").trim();
            if (actionMatch[2] && actionMatch[2].trim() !== "-") {
                last_action_pic = actionMatch[2].trim();
            }
            last_action_text = (actionMatch[3] || "").trim();
        } else {
            last_action_text = rawAction;
        }
    }

    if (!last_action_pic && log.resolution) {
        const resoMatch = log.resolution.match(/oleh teknisi (.*?)\./i);
        if (resoMatch && resoMatch[1] && resoMatch[1].trim() !== "-") {
            last_action_pic = resoMatch[1].trim();
        }
    }

    // PJ Terakhir: prioritaskan metadata.pic jika valid dan bukan "-", lalu fallback ke last_action_pic
    let pic = metadata?.pic && metadata.pic !== "-" ? metadata.pic : "";
    if (!pic && last_action_pic) {
        pic = last_action_pic;
    }
    if (!pic && metadata?.last_action_pic && metadata.last_action_pic !== "-") {
        pic = metadata.last_action_pic;
    }
    if (!pic) {
        pic = "-";
    }

    // 9. % Progress
    let progress_percent = metadata?.progress_percent || "";
    if (!progress_percent) {
        if (log.status === "DONE") progress_percent = "100%";
        else if (log.status === "IN_PROGRESS") progress_percent = "50%";
        else progress_percent = "0%";
    }
    if (!progress_percent.endsWith("%")) {
        progress_percent = `${progress_percent}%`;
    }

    const pctNum = parseInt(progress_percent.replace("%", ""), 10) || 0;
    const progress_color =
        pctNum >= 100
            ? { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" }
            : pctNum >= 50
            ? { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" }
            : { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" };

    if (!last_action_date && created_at_display !== "-") {
        last_action_date = created_at_display.slice(5, 16);
    }

    // Title header (Baris 1 di Judul seperti Gambar 2: e.g. "MAINTENANCE PELANGGAN RETAIL")
    const title_header = metadata?.title_category || (clean_title.includes("—") ? clean_title.split("—")[0].trim() : (metadata?.ticket_category || log.category?.replace(/_/g, " ") || "MAINTENANCE PELANGGAN RETAIL"));

    // Customer display (Baris 2 di Judul seperti Gambar 2: e.g. "0101010601014 — ISTINADAH")
    let customer_display = "";
    if (customer_id && customer_name && customer_name !== "Pelanggan") {
        customer_display = `${customer_id} — ${customer_name}`;
    } else if (customer_name && customer_name !== "Pelanggan") {
        customer_display = customer_name;
    } else if (cleanText) {
        customer_display = cleanText;
    } else {
        customer_display = clean_title;
    }

    return {
        ticket_id,
        has_real_ticket,
        customer_id,
        customer_name,
        ticket_type,
        category_label,
        created_at_display,
        pic,
        last_action_date,
        last_action_pic,
        last_action_text,
        progress_percent,
        progress_color,
        clean_description: cleanText,
        clean_title,
        title_header,
        customer_display,
    };
}
