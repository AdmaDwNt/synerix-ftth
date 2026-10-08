/**
 * Billingnesia On-Demand Scraper Service
 * Menggunakan native Node.js HTTPS client dengan SSL flexibility dan cookie jar
 */

import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

export interface CustomerServiceItem {
    name: string;
    price: string;
    cycle: string;
    issue_period: string;
    status: string;
}

export interface CustomerInvoiceItem {
    invoice_no: string;
    period: string;
    amount: string;
    due_date: string;
    status: string;
    paid_date?: string;
}

export interface CustomerTicketItem {
    ticket_id: string;
    created_at: string;
    last_action: string;
    progress: string;
    status: string;
}

export interface CustomerIsolirItem {
    isolated_date: string;
    reopened_date?: string;
    reason?: string;
    status: string;
}

export interface CustomerLogItem {
    date: string;
    user: string;
    activity: string;
}

export interface CustomerTabCounts {
    services?: number;
    invoices?: number;
    tickets?: number;
    isolirs?: number;
    logs?: number;
}

import { cleanPhoneNumber, resolveDisplayPhone } from "@/lib/utils/phoneHelper";
export { cleanPhoneNumber, resolveDisplayPhone };

export interface BillingnesiaScrapedData {
    // 1. Identitas Pokok
    ticket_id?: string;
    customer_id?: string;
    customer_name: string;
    status_pelanggan?: string;
    badges?: string[];

    // 2. Data Pribadi (Sesuai Gambar 1)
    register_date?: string;          // TGL DAFTAR (e.g. "2026-09-29 10:58:19")
    id_card_number?: string;         // NO KTP (e.g. "3506044403560001")
    phone_number: string;            // NO WA Terpilih (Sesuai Hirarki)
    phone_number_1?: string;         // NO WA 1 Asli
    phone_number_2?: string;         // NO WA 2 / TELP Asli
    email?: string;                  // EMAIL
    region?: string;                 // WILAYAH (e.g. "Kabupaten Kediri")
    district?: string;               // KECAMATAN (e.g. "Kecamatan Ngadiluwih")
    village?: string;                // DESA (e.g. "Banjarejo")
    hamlet?: string;                 // DUSUN (e.g. "Kendaldoyong")
    address: string;                 // ALAMAT LENGKAP
    marketer?: string;               // MARKETER (e.g. "ASTERIX")
    registration_note?: string;      // CATATAN DAFTAR
    commitment?: string;             // KOMITMEN

    // 3. Data Instalasi (Sesuai Gambar 1)
    server?: string;                 // SERVER (e.g. "BANJAREJO")
    ip_address?: string;             // IP ADDRESS (e.g. "192.168.127.26")
    pppoe_username?: string;         // USERNAME PPPOE (e.g. "0101010402102")
    pppoe_password?: string;         // PASSWORD PPPOE (e.g. "02102026")
    parent_odp?: string;             // ODP (e.g. "ODP RIJAL")
    cable_outdoor?: string;          // KABEL OUTDOOR (e.g. "25 m")
    cable_indoor?: string;           // KABEL INDOOR (e.g. "7 m")

    // 4. Data Tiket (Sesuai Gambar 3 jika sumber pencarian adalah tiket)
    ticket_creator?: string;         // USER PEMBUAT (e.g. "Fariellilrio Andreano")
    ticket_type?: string;            // JENIS TIKET (e.g. "TEKNIS")
    category?: string;               // KATEGORI TIKET (e.g. "MAINTENANCE RETAIL")
    ticket_customer_summary?: string;// PELANGGAN (e.g. "0501040302019 SAHAM SAMUDRA")
    ticket_indication?: string;      // KETERANGAN / INDIKASI AWAL (e.g. "down")
    ticket_pic?: string;             // PJ AWAL (e.g. "Fariellilrio Andreano")
    ticket_tag?: string;             // TAG KARYAWAN
    ticket_attachment?: string;      // LAMPIRAN
    ticket_progress_percent?: string;// Progress (e.g. "100%")

    // 5. Data Tab Lengkap Billingnesia (Gambar 2 & Screenshot Baru)
    tab_counts?: CustomerTabCounts;
    services?: CustomerServiceItem[];
    invoices?: CustomerInvoiceItem[];
    tickets?: CustomerTicketItem[];
    isolirs?: CustomerIsolirItem[];
    logs?: CustomerLogItem[];

    // 6. Parameter Teknis & Finansial
    latitude: number;
    longitude: number;
    coordinates_found: boolean;
    unpaid_amount: number;
    device_type: string;
    billing_url: string;
}

export interface BillingnesiaCandidate {
    customer_id: string;
    customer_name: string;
    village: string;
    hamlet: string;
    area: string;
    phone_number: string;
    status: string;
}

export interface BillingnesiaScraperResult {
    success: boolean;
    is_multiple?: boolean;
    candidates?: BillingnesiaCandidate[];
    data?: BillingnesiaScrapedData;
    error?: string;
    query?: string;
}

// In-memory session cookie cache di server runtime
// CATATAN: Di Vercel Serverless, cache ini hanya bertahan selama satu warm invocation.
let cachedCookie: string | null = null;
let lastLoginTime: number = 0;
const SESSION_CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit TTL (lebih pendek untuk serverless)

// Pastikan SSL self-signed / CA chain billing.at-in.net bisa di-accept di serverless
if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

/**
 * Membuat HTTPS Agent baru untuk setiap request batch.
 * Di Vercel Serverless, keepAlive: false mencegah stale socket reuse antar invokasi.
 */
function createAgent(): https.Agent {
    return new https.Agent({
        rejectUnauthorized: false,
        keepAlive: false,
        timeout: 9000,
    });
}

interface HttpResponse {
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: string;
}

/**
 * Helper HTTP request wrapper untuk Node.js dengan redirect & cookie handling
 */
function requestUrl(
    targetUrl: string,
    options: {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        maxRedirects?: number;
    } = {}
): Promise<HttpResponse> {
    const { method = "GET", headers = {}, body, maxRedirects = 5 } = options;

    return new Promise((resolve, reject) => {
        const parsed = new URL(targetUrl);
        const isHttps = parsed.protocol === "https:";
        const client = isHttps ? https : http;

        const requestHeaders: Record<string, string | number> = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            ...headers,
        };

        if (body) {
            requestHeaders["Content-Length"] = Buffer.byteLength(body);
        }

        const reqOptions: https.RequestOptions = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method,
            headers: requestHeaders,
            agent: isHttps ? createAgent() : undefined,
            timeout: 9000, // 9 detik — di bawah batas Vercel Hobby (10s)
        };

        const req = client.request(reqOptions, (res) => {
            const chunks: Buffer[] = [];

            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", async () => {
                const responseBody = Buffer.concat(chunks).toString("utf-8");
                const statusCode = res.statusCode || 200;

                // Handle HTTP redirect (301, 302, 303, 307)
                if (
                    statusCode >= 300 &&
                    statusCode < 400 &&
                    res.headers.location &&
                    maxRedirects > 0
                ) {
                    const redirectUrl = new URL(res.headers.location, targetUrl).toString();

                    // Carry over Set-Cookie headers
                    let newCookieHeader = headers["Cookie"] || "";
                    if (res.headers["set-cookie"]) {
                        const newCookies = res.headers["set-cookie"]
                            .map((c) => c.split(";")[0])
                            .join("; ");
                        newCookieHeader = newCookieHeader
                            ? `${newCookieHeader}; ${newCookies}`
                            : newCookies;
                    }

                    try {
                        const redirected = await requestUrl(redirectUrl, {
                            method: "GET", // Redirects typically switch to GET
                            headers: {
                                ...headers,
                                Cookie: newCookieHeader,
                            },
                            maxRedirects: maxRedirects - 1,
                        });
                        resolve(redirected);
                    } catch (err) {
                        reject(err);
                    }
                    return;
                }

                resolve({
                    statusCode,
                    headers: res.headers,
                    body: responseBody,
                });
            });
        });

        req.on("error", (err) => reject(err));
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Koneksi ke Billingnesia mengalami timeout. Coba lagi dalam beberapa saat."));
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

/**
 * Melakukan login otomatis ke Billingnesia dan mengambil session cookie
 */
async function authenticateBillingnesia(baseUrl: string): Promise<string> {
    const username = (process.env.BILLINGNESIA_USERNAME || "").trim();
    const password = (process.env.BILLINGNESIA_PASSWORD || "").trim();

    if (!username || !password || username === "akun_username_anda") {
        throw new Error(
            "Kredensial Billingnesia belum diatur di .env.local. Silakan isi variabel BILLINGNESIA_USERNAME & BILLINGNESIA_PASSWORD."
        );
    }

    const loginUrl = `${baseUrl.replace(/\/+$/, "")}/login`;

    // 1. Ambil initial session cookie dari halaman login
    const initialRes = await requestUrl(loginUrl, { method: "GET" });
    let sessionCookie = "";
    if (initialRes.headers["set-cookie"]) {
        sessionCookie = initialRes.headers["set-cookie"]
            .map((c) => c.split(";")[0])
            .join("; ");
    }

    // 2. Submit form login
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("login", "");
    const bodyPayload = formData.toString();

    const postHeaders: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": loginUrl,
        "Origin": baseUrl,
    };
    if (sessionCookie) {
        postHeaders["Cookie"] = sessionCookie;
    }

    const loginRes = await requestUrl(loginUrl, {
        method: "POST",
        headers: postHeaders,
        body: bodyPayload,
        maxRedirects: 2,
    });

    // Gabungkan cookie baru dari response login
    if (loginRes.headers["set-cookie"]) {
        const newCookies = loginRes.headers["set-cookie"]
            .map((c) => c.split(";")[0])
            .join("; ");
        sessionCookie = sessionCookie ? `${sessionCookie}; ${newCookies}` : newCookies;
    }

    // Periksa apakah login berhasil
    if (loginRes.body.includes("border-red-500") || loginRes.body.includes("gagal")) {
        throw new Error("Gagal login ke Billingnesia: Username atau password tidak valid.");
    }

    if (!sessionCookie) {
        throw new Error("Gagal memperoleh cookie sesi dari Billingnesia.");
    }

    cachedCookie = sessionCookie;
    lastLoginTime = Date.now();
    return sessionCookie;
}

/**
 * Mengambil cookie sesi aktif (cache reuse atau re-login)
 */
async function getActiveSessionCookie(baseUrl: string, forceRefresh = false): Promise<string> {
    if (process.env.BILLINGNESIA_SESSION_COOKIE) {
        return process.env.BILLINGNESIA_SESSION_COOKIE;
    }

    if (!forceRefresh && cachedCookie && Date.now() - lastLoginTime < SESSION_CACHE_TTL_MS) {
        return cachedCookie;
    }

    return await authenticateBillingnesia(baseUrl);
}

interface ParsedHtmlTable {
    headers: string[];
    rows: string[][];
}

/**
 * Ekstraksi seluruh elemen <table> dari HTML ke dalam baris dan kolom terstruktur
 */
function extractHtmlTables(rawHtml: string): ParsedHtmlTable[] {
    const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
    const tables: ParsedHtmlTable[] = [];

    let tableMatch;
    while ((tableMatch = tableRegex.exec(rawHtml)) !== null) {
        const tableHtml = tableMatch[1];
        const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
        const allRows: string[][] = [];

        let trMatch;
        while ((trMatch = trRegex.exec(tableHtml)) !== null) {
            const trHtml = trMatch[1];
            const cellRegex = /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
            const cells: string[] = [];

            let cellMatch;
            while ((cellMatch = cellRegex.exec(trHtml)) !== null) {
                const cellText = cellMatch[1]
                    .replace(/<[^>]+>/g, " ")
                    .replace(/&nbsp;/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                cells.push(cellText);
            }

            if (cells.length > 0) {
                allRows.push(cells);
            }
        }

        if (allRows.length > 0) {
            const headers = allRows[0].map((h) => h.toUpperCase());
            const rows = allRows.slice(1);
            tables.push({ headers, rows });
        }
    }

    return tables;
}

/**
 * Ekstraksi angka badge tab pada header tab Billingnesia (e.g. Layanan 2, Invoice 21, Tiket 5)
 */
function extractBadgeCount(html: string, tabLabel: string): number {
    const escaped = tabLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reg = new RegExp(`${escaped}\\s*(?:<[^>]+>\\s*)*\\(?(\\d+)\\)?`, "i");
    const m = html.match(reg);
    if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n)) return n;
    }
    return 0;
}

/**
 * Helper ekstraksi nilai field dari HTML Billingnesia berdasarkan label
 * Bekerja pada tabel, div kontainer, maupun layout inline
 */
function extractFieldValue(
    rawHtml: string,
    plainText: string,
    labels: string[],
    stopLabels: string[] = []
): string {
    for (const label of labels) {
        const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // 1. Ekstraksi dari struktur DOM: <...label...> ... <...value...>
        const domPattern = new RegExp(
            `<(?:td|th|label|span|div|p|h\\d)[^>]*>\\s*#?\\s*${escapedLabel}\\s*<\\/(?:td|th|label|span|div|p|h\\d)>\\s*(?:<[^>]+>)*\\s*<([a-z0-9]+)[^>]*>([\\s\\S]*?)<\\/\\1>`,
            "i"
        );
        const domMatch = rawHtml.match(domPattern);
        if (domMatch && domMatch[2]) {
            let val = domMatch[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (val && val !== "-" && val.toLowerCase() !== "null" && !val.includes(label)) {
                return val;
            }
        }

        // 2. Ekstraksi dari Table Row: <tr><td>LABEL</td><td>VALUE</td></tr>
        const trPattern = new RegExp(
            `<tr[^>]*>[\\s\\S]*?#?\\s*${escapedLabel}[\\s\\S]*?<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`,
            "i"
        );
        const trMatch = rawHtml.match(trPattern);
        if (trMatch && trMatch[1]) {
            let val = trMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (val && val !== "-" && val.toLowerCase() !== "null") {
                return val;
            }
        }

        // 3. Ekstraksi dari Plain Text terstruktur
        // Mengambil teks dari setelah LABEL sampai salah satu stopLabel atau batas baris
        const stopPattern = stopLabels.length > 0
            ? stopLabels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
            : "(?:TGL|STATUS|NO|NAMA|EMAIL|WILAYAH|KECAMATAN|DESA|DUSUN|ALAMAT|MARKETER|CATATAN|KOMITMEN|SERVER|IP|USERNAME|PASSWORD|ODP|KABEL|USER|JENIS|KATEGORI|PELANGGAN|KETERANGAN|PJ|TAG|LAMPIRAN)";

        const textPattern = new RegExp(
            `(?:^|\\s)#?\\s*${escapedLabel}\\s*[:\\s]\\s*([^\\n\\r]{1,150}?)(?=(?:\\s+(?:${stopPattern})\\b)|$|<)`,
            "i"
        );
        const textMatch = plainText.match(textPattern);
        if (textMatch && textMatch[1]) {
            let val = textMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
            // Bersihkan jika ada tanda hubung '-' tunggal
            if (val && val !== "-" && val.toLowerCase() !== "null") {
                return val;
            }
        }
    }
    return "";
}

/**
 * Parsing HTML data Billingnesia lengkap (Detail Pelanggan Gambar 1 & Detail Tiket Gambar 3)
 */
export function parseBillingnesiaHTML(
    rawHtml: string,
    targetUrl: string,
    query: string
): BillingnesiaScrapedData {
    // 0. Bersihkan script, style, komentar HTML, dan atribut Alpine.js/JS inline agar tidak mengotori parsing
    const htmlClean = rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/x-data=(["'])(?:(?!\1)[\s\S])*\1/gi, " ")
        .replace(/x-init=(["'])(?:(?!\1)[\s\S])*\1/gi, " ");

    let mainContentHtml = htmlClean;
    const contentMarker = htmlClean.search(/\b(?:Detail Tiket|Detail Pelanggan|Info Pribadi|Info Tiket)\b/i);
    if (contentMarker !== -1) {
        mainContentHtml = htmlClean.substring(contentMarker);
    }

    const htmlWithoutScripts = htmlClean;

    const plainText = mainContentHtml
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // 1. Ekstrak Ticket ID
    let ticketId: string | undefined = undefined;
    const tktMatch = htmlWithoutScripts.match(/\bTKT\d+\b/i) || query.match(/\bTKT\d+\b/i);
    if (tktMatch) {
        ticketId = tktMatch[0].toUpperCase();
    }

    // 2. Ekstrak Customer ID (10-13 digit) & Customer Name
    let customerId: string | undefined = undefined;
    let customerName = "";

    // Pola A (Billingnesia Header Baris Tiket): e.g. "0101010602040 - SRI RAHAYU - 192.168.146.152"
    const headerComboMatch = htmlWithoutScripts.match(
        /\b(\d{10,13})\s*-\s*([A-Za-z0-9\s.,'"`-]+?)\s*-\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
    );
    if (headerComboMatch) {
        customerId = headerComboMatch[1].trim();
        customerName = headerComboMatch[2].trim();
    }

    // Pola B (Header Detail Pelanggan Gambar 1): e.g. "WINARNI 0101010402102"
    if (!customerName || !customerId) {
        const detailCustomerHeaderMatch = plainText.match(
            /Detail\s+Pelanggan\s+(\d{10,13})\s+([A-Za-z\s.,'-]+?)\s+\1/i
        ) || plainText.match(
            /Detail\s+([A-Za-z\s.,'-]+?)\s+(\d{10,13})\s+(?:ITN|PJK|PELANGGAN|AKTIF)/i
        ) || plainText.match(
            /([A-Z\s]{3,40})\s+(\d{10,13})\s+ITN/
        );
        if (detailCustomerHeaderMatch) {
            if (!customerName && detailCustomerHeaderMatch[1]) customerName = detailCustomerHeaderMatch[1].trim();
            if (!customerId && detailCustomerHeaderMatch[2]) customerId = detailCustomerHeaderMatch[2].trim();
        }
    }

    // Pola C (Tabel Pelanggan di Tiket): "Pelanggan 0101010602040 SRI RAHAYU IP Address"
    if (!customerId || !customerName) {
        const tablePelangganMatch = plainText.match(
            /Pelanggan\s+(\d{10,13})\s+([A-Za-z0-9\s.,'"`-]+?)(?=\s+(?:IP Address|Paket|Kategori|Status|Server)\b)/i
        );
        if (tablePelangganMatch) {
            if (!customerId) customerId = tablePelangganMatch[1].trim();
            if (!customerName) customerName = tablePelangganMatch[2].trim();
        }
    }

    // Ekstrak langsung dari "#ID PELANGGAN"
    const directIdPelanggan = extractFieldValue(htmlWithoutScripts, plainText, ["ID PELANGGAN", "#ID PELANGGAN"]);
    if (directIdPelanggan && /^\d{10,13}$/.test(directIdPelanggan)) {
        customerId = directIdPelanggan;
    }

    // Ekstrak langsung dari "NAMA PELANGGAN"
    const directNamaPelanggan = extractFieldValue(htmlWithoutScripts, plainText, ["NAMA PELANGGAN"]);
    if (directNamaPelanggan) {
        customerName = directNamaPelanggan;
    }

    // Pola Fallback untuk Customer ID
    if (!customerId) {
        const cidMatch = plainText.match(/\b01\d{8,11}\b/) || plainText.match(/\b\d{10,13}\b/) || query.match(/^\d{10,13}$/);
        if (cidMatch) {
            customerId = cidMatch[0];
        }
    }

    // Bersihkan nama dari kata-kata artefak
    if (customerName) {
        customerName = customerName
            .replace(/^-\s*/, "")
            .replace(/\b(?:Detail|Pelanggan|List|Tiket|Menu|Utama)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // 3. Ekstrak Badges (Gambar 1: ITN ON/OFF, PJK ON/OFF, PELANGGAN AKTIF)
    const badges: string[] = [];
    if (/ITN\s+ON/i.test(plainText)) badges.push("ITN ON");
    else if (/ITN\s+OFF/i.test(plainText)) badges.push("ITN OFF");

    if (/PJK\s+ON/i.test(plainText)) badges.push("PJK ON");
    else if (/PJK\s+OFF/i.test(plainText)) badges.push("PJK OFF");

    let statusPelanggan = "PELANGGAN AKTIF";
    if (/PELANGGAN\s+TIDAK\s+AKTIF|NON\s+AKTIF/i.test(plainText)) {
        statusPelanggan = "PELANGGAN TIDAK AKTIF";
        badges.push("TIDAK AKTIF");
    } else if (/PELANGGAN\s+AKTIF|AKTIF/i.test(plainText)) {
        statusPelanggan = "PELANGGAN AKTIF";
        badges.push("PELANGGAN AKTIF");
    }

    // 4. Ekstrak Data Pribadi (Gambar 1)
    const registerDate = extractFieldValue(htmlWithoutScripts, plainText, ["TGL DAFTAR", "TANGGAL DAFTAR"]);
    const idCardNumber = extractFieldValue(htmlWithoutScripts, plainText, ["NO KTP", "NOMOR KTP"]);
    
    // No WA 1 & No WA 2 (Sesuai Aturan: Jika WA 1 ada gunakan WA 1, jika tidak ada gunakan WA 2, jika ada keduanya gunakan WA 1)
    const rawPhone1 = extractFieldValue(htmlWithoutScripts, plainText, ["NO WA 1", "WHATSAPP 1", "NO WA", "NO HP"]);
    const rawPhone2 = extractFieldValue(htmlWithoutScripts, plainText, ["NO WA 2 / TELP", "NO WA 2", "NO TELP", "TELEPON"]);
    
    const cleanP1 = cleanPhoneNumber(rawPhone1);
    const cleanP2 = cleanPhoneNumber(rawPhone2);

    let fallbackRegexPhone = "";
    if (!cleanP1 && !cleanP2) {
        const phoneMatch = plainText.match(/\b(08\d{8,11}|628\d{8,11})\b/);
        if (phoneMatch) fallbackRegexPhone = phoneMatch[0];
    }

    const resolvedPhoneNumber = cleanP1 ? (rawPhone1 || cleanP1) : (cleanP2 ? (rawPhone2 || cleanP2) : fallbackRegexPhone);

    const email = extractFieldValue(htmlWithoutScripts, plainText, ["EMAIL"]);
    const region = extractFieldValue(htmlWithoutScripts, plainText, ["WILAYAH"]);
    const district = extractFieldValue(htmlWithoutScripts, plainText, ["KECAMATAN"]);
    const village = extractFieldValue(htmlWithoutScripts, plainText, ["DESA"]);
    const hamlet = extractFieldValue(htmlWithoutScripts, plainText, ["DUSUN"]);
    
    let address = extractFieldValue(htmlWithoutScripts, plainText, ["ALAMAT LENGKAP", "ALAMAT"]);
    if (!address) {
        const addrRegex =
            /\b(?:jalan|jl\.?|dusun|desa|dsn\.?|kecamatan|kec\.?|kelurahan|kel\.\s*|komplek|perum|rt\s*\d+|rw\s*\d+)\b[\s\S]*?(?=\b(?:MARKETER|COMMITMENT|SERVER|KOMITMEN|PAKET|TAGIHAN|STATUS|TANGGAL|BIAYA|INVOICE|TELEPON|WHATSAPP|DISMANTLE|CATATAN)\b|<div|<tr|<p|<h\d|$)/i;
        const addrMatch = plainText.match(addrRegex);
        if (addrMatch) {
            let cleanAddr = addrMatch[0].trim();
            if (cleanAddr.includes("Alamat Lengkap")) {
                cleanAddr = cleanAddr.split("Alamat Lengkap")[1].trim();
            }
            address = cleanAddr;
        }
    }

    const marketer = extractFieldValue(htmlWithoutScripts, plainText, ["MARKETER"]);
    const registrationNote = extractFieldValue(htmlWithoutScripts, plainText, ["CATATAN DAFTAR"]);
    const commitment = extractFieldValue(htmlWithoutScripts, plainText, ["KOMITMEN"]);

    // 5. Ekstrak Data Instalasi (Gambar 1)
    const server = extractFieldValue(htmlWithoutScripts, plainText, ["SERVER"]);
    const ipAddress = extractFieldValue(htmlWithoutScripts, plainText, ["IP ADDRESS", "IP"]);
    const pppoeUsername = extractFieldValue(htmlWithoutScripts, plainText, ["USERNAME PPPOE", "PPPOE USERNAME"]);
    const pppoePassword = extractFieldValue(htmlWithoutScripts, plainText, ["PASSWORD PPPOE", "PPPOE PASSWORD"]);
    const parentOdp = extractFieldValue(htmlWithoutScripts, plainText, ["ODP", "PARENT ODP"]);
    const cableOutdoor = extractFieldValue(htmlWithoutScripts, plainText, ["KABEL OUTDOOR"]);
    const cableIndoor = extractFieldValue(htmlWithoutScripts, plainText, ["KABEL INDOOR"]);

    // 6. Ekstrak Data Tiket (Gambar 3 - jika halaman tiket)
    const ticketCreator = extractFieldValue(htmlWithoutScripts, plainText, ["USER PEMBUAT"]);
    const ticketType = extractFieldValue(htmlWithoutScripts, plainText, ["JENIS TIKET"]);
    const ticketCategory = extractFieldValue(htmlWithoutScripts, plainText, ["KATEGORI TIKET"]);
    const ticketCustomerSummary = extractFieldValue(htmlWithoutScripts, plainText, ["PELANGGAN"]);
    const ticketIndication = extractFieldValue(htmlWithoutScripts, plainText, ["KETERANGAN / INDIKASI AWAL", "KETERANGAN"]);
    const ticketPic = extractFieldValue(htmlWithoutScripts, plainText, ["PJ AWAL", "PENANGGUNG JAWAB"]);
    const ticketTag = extractFieldValue(htmlWithoutScripts, plainText, ["TAG KARYAWAN"]);
    const ticketAttachment = extractFieldValue(htmlWithoutScripts, plainText, ["LAMPIRAN"]);

    // Ticket progress %
    let ticketProgressPercent = "";
    const pctMatch = plainText.match(/\b(\d{1,3})%\b/);
    if (pctMatch) {
        ticketProgressPercent = `${pctMatch[1]}%`;
    }

    // 7. Kategori Tiket Normalisasi
    let category = ticketCategory || "MAINTENANCE RETAIL";
    const upperText = plainText.toUpperCase();
    if (upperText.includes("MAINTENANCE JARINGAN")) {
        category = "MAINTENANCE JARINGAN";
    } else if (upperText.includes("MAINTENANCE RETAIL")) {
        category = "MAINTENANCE RETAIL";
    } else if (upperText.includes("PROJECT")) {
        category = "PROJECT";
    } else if (upperText.includes("KEGIATAN LAINNYA")) {
        category = "KEGIATAN LAINNYA";
    }

    // 8. Ekstrak Total Tunggakan (Invoice Jatuh Tempo / Belum Bayar)
    let unpaidAmount = 0;
    const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(htmlWithoutScripts)) !== null) {
        const rowText = rowMatch[0].toUpperCase();
        if (
            rowText.includes("JATUH TEMPO") ||
            rowText.includes("UNPAID") ||
            rowText.includes("BELUM BAYAR") ||
            rowText.includes("TERTUNGGAK")
        ) {
            const nominalMatch = rowMatch[0].match(/Rp\s*([\d.,]+)/i);
            if (nominalMatch) {
                const cleanNum = parseInt(nominalMatch[1].replace(/[^0-9]/g, ""), 10);
                if (!isNaN(cleanNum)) {
                    unpaidAmount += cleanNum;
                }
            }
        }
    }

    // 9. Ekstrak Tabel Lengkap Billingnesia (Layanan, Invoice, Tiket, ISOLIR, Log)
    const allParsedTables = extractHtmlTables(rawHtml);
    const services: CustomerServiceItem[] = [];
    const invoices: CustomerInvoiceItem[] = [];
    const tickets: CustomerTicketItem[] = [];
    const isolirs: CustomerIsolirItem[] = [];
    const logs: CustomerLogItem[] = [];

    for (const table of allParsedTables) {
        const headerStr = table.headers.join(" ");

        // A. TABEL LAYANAN (Sesuai Gambar 2: NAMA LAYANAN, HARGA, SIKLUS, PENERBITAN, STATUS, AKSI)
        if (
            table.headers.some((h) => h.includes("LAYANAN")) &&
            table.headers.some((h) => h.includes("HARGA") || h.includes("SIKLUS") || h.includes("PENERBITAN"))
        ) {
            const nameIdx = table.headers.findIndex((h) => h.includes("NAMA LAYANAN") || h.includes("LAYANAN"));
            const priceIdx = table.headers.findIndex((h) => h.includes("HARGA") || h.includes("BIAYA"));
            const cycleIdx = table.headers.findIndex((h) => h.includes("SIKLUS") || h.includes("PERIODE"));
            const issueIdx = table.headers.findIndex((h) => h.includes("PENERBITAN") || h.includes("TERBIT"));
            const statusIdx = table.headers.findIndex((h) => h.includes("STATUS"));

            for (const row of table.rows) {
                const sName = row[nameIdx !== -1 ? nameIdx : 0] || "";
                if (!sName || sName.toUpperCase() === "NAMA LAYANAN" || sName === "-") continue;

                services.push({
                    name: sName,
                    price: row[priceIdx !== -1 ? priceIdx : 1] || "-",
                    cycle: row[cycleIdx !== -1 ? cycleIdx : 2] || "Setiap bulan",
                    issue_period: row[issueIdx !== -1 ? issueIdx : 3] || "-",
                    status: (row[statusIdx !== -1 ? statusIdx : 4] || "AKTIF").toUpperCase(),
                });
            }
        }

        // B. TABEL INVOICE (NO INVOICE, PERIODE, NOMINAL, JATUH TEMPO, STATUS, AKSI/BAYAR)
        else if (
            table.headers.some((h) => h.includes("INVOICE")) ||
            (table.headers.some((h) => h.includes("PERIODE")) &&
                table.headers.some((h) => h.includes("JATUH TEMPO") || h.includes("NOMINAL") || h.includes("TOTAL")))
        ) {
            const invIdx = table.headers.findIndex((h) => h.includes("INVOICE") || h.includes("#NO") || h.includes("NO."));
            const periodIdx = table.headers.findIndex((h) => h.includes("PERIODE") || h.includes("BULAN"));
            const amountIdx = table.headers.findIndex(
                (h) => h.includes("NOMINAL") || h.includes("TOTAL") || h.includes("TAGIHAN") || h.includes("JUMLAH")
            );
            const dueIdx = table.headers.findIndex((h) => h.includes("JATUH TEMPO") || h.includes("TEMPO"));
            const statusIdx = table.headers.findIndex((h) => h.includes("STATUS"));
            const paidIdx = table.headers.findIndex((h) => h.includes("BAYAR") || h.includes("TGL BAYAR"));

            for (const row of table.rows) {
                const invNo = row[invIdx !== -1 ? invIdx : 0] || "";
                if (!invNo || invNo.toUpperCase().includes("INVOICE") || invNo === "#NO") continue;

                const invStatus = (row[statusIdx !== -1 ? statusIdx : 4] || "UNPAID").toUpperCase();
                const invAmount = row[amountIdx !== -1 ? amountIdx : 2] || "-";

                invoices.push({
                    invoice_no: invNo,
                    period: row[periodIdx !== -1 ? periodIdx : 1] || "-",
                    amount: invAmount,
                    due_date: row[dueIdx !== -1 ? dueIdx : 3] || "-",
                    status: invStatus,
                    paid_date: paidIdx !== -1 ? row[paidIdx] : undefined,
                });
            }
        }

        // C. TABEL TIKET (#ID, TGL DIBUAT, TINDAKAN TERAKHIR, %, STATUS, AKSI)
        else if (
            table.headers.some((h) => h.includes("TINDAKAN TERAKHIR") || h.includes("TGL DIBUAT")) ||
            (table.headers.some((h) => h.includes("TIKET")) && table.headers.some((h) => h.includes("%") || h.includes("STATUS")))
        ) {
            const idIdx = table.headers.findIndex((h) => h.includes("#ID") || h.includes("ID TIKET") || h.includes("TIKET"));
            const dateIdx = table.headers.findIndex((h) => h.includes("TGL DIBUAT") || h.includes("TANGGAL"));
            const actionIdx = table.headers.findIndex(
                (h) => h.includes("TINDAKAN TERAKHIR") || h.includes("KETERANGAN") || h.includes("KELUHAN")
            );
            const progIdx = table.headers.findIndex((h) => h.includes("%") || h.includes("PROGRESS"));
            const statusIdx = table.headers.findIndex((h) => h.includes("STATUS") || h.includes("KATEGORI"));

            for (const row of table.rows) {
                const tId = row[idIdx !== -1 ? idIdx : 0] || "";
                if (!tId || tId.toUpperCase().includes("TIKET") || tId === "#ID") continue;

                tickets.push({
                    ticket_id: tId,
                    created_at: row[dateIdx !== -1 ? dateIdx : 1] || "-",
                    last_action: row[actionIdx !== -1 ? actionIdx : 2] || "-",
                    progress: row[progIdx !== -1 ? progIdx : 3] || "100%",
                    status: row[statusIdx !== -1 ? statusIdx : 4] || "SELESAI",
                });
            }
        }

        // D. TABEL ISOLIR (TGL ISOLIR, TGL BUKA, KETERANGAN, STATUS)
        else if (table.headers.some((h) => h.includes("ISOLIR") || h.includes("TGL ISOLIR"))) {
            const dateIdx = table.headers.findIndex((h) => h.includes("TGL ISOLIR") || h.includes("ISOLIR") || h.includes("TANGGAL"));
            const openIdx = table.headers.findIndex((h) => h.includes("BUKA") || h.includes("SELESAI"));
            const reasonIdx = table.headers.findIndex((h) => h.includes("ALASAN") || h.includes("KETERANGAN"));
            const statusIdx = table.headers.findIndex((h) => h.includes("STATUS"));

            for (const row of table.rows) {
                const isoDate = row[dateIdx !== -1 ? dateIdx : 0] || "";
                if (!isoDate || isoDate.toUpperCase().includes("ISOLIR")) continue;

                isolirs.push({
                    isolated_date: isoDate,
                    reopened_date: openIdx !== -1 ? row[openIdx] : "-",
                    reason: reasonIdx !== -1 ? row[reasonIdx] : "-",
                    status: statusIdx !== -1 ? row[statusIdx] : "TERISOLIR",
                });
            }
        }

        // E. TABEL LOG (TANGGAL/WAKTU, USER, AKTIVITAS)
        else if (
            table.headers.some((h) => h.includes("AKTIVITAS")) ||
            (table.headers.some((h) => h.includes("LOG")) &&
                table.headers.some((h) => h.includes("USER") || h.includes("WAKTU") || h.includes("TANGGAL")))
        ) {
            const dateIdx = table.headers.findIndex(
                (h) => h.includes("TANGGAL") || h.includes("WAKTU") || h.includes("DATE") || h.includes("JAM")
            );
            const userIdx = table.headers.findIndex((h) => h.includes("USER") || h.includes("ADMIN") || h.includes("OPERATOR"));
            const actIdx = table.headers.findIndex((h) => h.includes("AKTIVITAS") || h.includes("KETERANGAN") || h.includes("LOG"));

            for (const row of table.rows) {
                const d = row[dateIdx !== -1 ? dateIdx : 0] || "";
                if (!d || d.toUpperCase().includes("TANGGAL")) continue;

                logs.push({
                    date: d,
                    user: row[userIdx !== -1 ? userIdx : 1] || "-",
                    activity: row[actIdx !== -1 ? actIdx : 2] || "-",
                });
            }
        }
    }

    // Badge counts dari navigasi tab (Gambar 2: Layanan 2, Invoice 21, Tiket 5, ISOLIR 10, Log 10)
    const tabCounts: CustomerTabCounts = {
        services: services.length || extractBadgeCount(rawHtml, "Layanan"),
        invoices: invoices.length || extractBadgeCount(rawHtml, "Invoice"),
        tickets: tickets.length || extractBadgeCount(rawHtml, "Tiket"),
        isolirs: isolirs.length || extractBadgeCount(rawHtml, "ISOLIR"),
        logs: logs.length || extractBadgeCount(rawHtml, "Log"),
    };

    // 10. Ekstrak Koordinat Lat/Lng dari Google Maps Link
    let latitude = -7.8231; // Default fallback Kediri
    let longitude = 111.9174;
    let coordinatesFound = false;

    const mapUrlRegex =
        /href=["'](https?:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl)[^"']+)["']/gi;
    let mapMatch;
    while ((mapMatch = mapUrlRegex.exec(htmlWithoutScripts)) !== null) {
        const mapHref = mapMatch[1];
        const coordMatch =
            mapHref.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            mapHref.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            mapHref.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/);

        if (coordMatch) {
            const parsedLat = parseFloat(coordMatch[1]);
            const parsedLng = parseFloat(coordMatch[2]);
            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                latitude = parsedLat;
                longitude = parsedLng;
                coordinatesFound = true;
                break;
            }
        }
    }

    // 11. Ekstrak Tipe Perangkat ONT
    let deviceType = "ONT ZTE F609";
    const ontMatch = plainText.match(/\b(ZTE\s+[A-Z0-9]+|HUAWEI\s+[A-Z0-9]+|FIBERHOME\s+[A-Z0-9]+)\b/i);
    if (ontMatch) {
        deviceType = `ONT ${ontMatch[1].toUpperCase()}`;
    }

    return {
        // Identitas
        ticket_id: ticketId,
        customer_id: customerId,
        customer_name: customerName,
        status_pelanggan: statusPelanggan,
        badges,

        // Data Pribadi (Gambar 1)
        register_date: registerDate || undefined,
        id_card_number: idCardNumber || undefined,
        phone_number: resolvedPhoneNumber,
        phone_number_1: rawPhone1 || undefined,
        phone_number_2: rawPhone2 || undefined,
        email: email || undefined,
        region: region || undefined,
        district: district || undefined,
        village: village || undefined,
        hamlet: hamlet || undefined,
        address: address,
        marketer: marketer || undefined,
        registration_note: registrationNote || undefined,
        commitment: commitment || undefined,

        // Data Instalasi (Gambar 1)
        server: server || undefined,
        ip_address: ipAddress || undefined,
        pppoe_username: pppoeUsername || undefined,
        pppoe_password: pppoePassword || undefined,
        parent_odp: parentOdp || undefined,
        cable_outdoor: cableOutdoor || undefined,
        cable_indoor: cableIndoor || undefined,

        // Data Tiket (Gambar 3)
        ticket_creator: ticketCreator || undefined,
        ticket_type: ticketType || undefined,
        category,
        ticket_customer_summary: ticketCustomerSummary || undefined,
        ticket_indication: ticketIndication || undefined,
        ticket_pic: ticketPic || undefined,
        ticket_tag: ticketTag || undefined,
        ticket_attachment: ticketAttachment || undefined,
        ticket_progress_percent: ticketProgressPercent || undefined,

        // Data Tab Lengkap Billingnesia
        tab_counts: tabCounts,
        services,
        invoices,
        tickets,
        isolirs,
        logs,

        // Teknis & Finansial
        latitude,
        longitude,
        coordinates_found: coordinatesFound,
        unpaid_amount: unpaidAmount,
        device_type: deviceType,
        billing_url: targetUrl,
    };
}

/**
 * Mencari daftar kandidat pelanggan dari Billingnesia berdasarkan Nama atau Daerah (Desa/Dusun)
 */
export async function searchBillingnesiaCandidates(query: string): Promise<BillingnesiaCandidate[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const baseUrl = process.env.BILLINGNESIA_BASE_URL || "https://billing.at-in.net";
    let cookie = await getActiveSessionCookie(baseUrl);

    const searchUrl = `${baseUrl.replace(/\/+$/, "")}/admin/data/listpelanggan?page=1&per_page=25&search=${encodeURIComponent(cleanQuery)}`;

    let response = await requestUrl(searchUrl, {
        headers: {
            Cookie: cookie,
            "X-Requested-With": "XMLHttpRequest",
        },
    });

    if (response.body.includes("LOGIN | BILLINGNESIA") || response.statusCode === 401) {
        cookie = await getActiveSessionCookie(baseUrl, true);
        response = await requestUrl(searchUrl, {
            headers: {
                Cookie: cookie,
                "X-Requested-With": "XMLHttpRequest",
            },
        });
    }

    const rows = response.body.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    const candidates: BillingnesiaCandidate[] = [];

    // Lewati thead (index 0)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const tds = row.match(/<td[\s\S]*?<\/td>/gi) || [];
        if (tds.length >= 4 && tds[0] && tds[1] && tds[2] && tds[3]) {
            const customerId = tds[0].replace(/<[^>]+>/g, "").trim();
            const customerName = tds[1].replace(/<[^>]+>/g, "").trim();

            const rawArea = tds[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            const areaParts = rawArea.split(" ").filter(Boolean);
            const village = areaParts[0] || "";
            const hamlet = areaParts.slice(1).join(" ") || "";
            const area = hamlet ? `${village} - ${hamlet}` : village;

            const phoneMatch = tds[3].match(/\b(08\d{8,11}|628\d{8,11})\b/);
            const phoneNumber = phoneMatch ? phoneMatch[0] : tds[3].replace(/<[^>]+>/g, "").trim();

            const status = tds[5] ? tds[5].replace(/<[^>]+>/g, "").trim() : "AKTIF";

            if (customerId && customerName) {
                candidates.push({
                    customer_id: customerId,
                    customer_name: customerName,
                    village,
                    hamlet,
                    area,
                    phone_number: phoneNumber,
                    status: status.includes("AKTIF") ? "AKTIF" : status,
                });
            }
        }
    }

    return candidates;
}

/**
 * Service Utama: Scrape Data Billingnesia secara On-Demand
 * Mendukung pencarian instan via Nomor Tiket, ID Pelanggan, atau Nama / Daerah dengan seleksi interaktif
 */
export async function scrapeBillingnesiaData(
    query: string,
    specificCustomerId?: string
): Promise<BillingnesiaScraperResult> {
    const cleanQuery = (specificCustomerId || query).trim();
    if (!cleanQuery) {
        return { success: false, error: "Query pencarian tidak boleh kosong." };
    }

    const baseUrl = process.env.BILLINGNESIA_BASE_URL || "https://billing.at-in.net";
    const isTicket = /TKT/i.test(cleanQuery);
    const isDirectCustomerId = /^\d{10,13}$/.test(cleanQuery) || Boolean(specificCustomerId);

    // 1. Jika query adalah Nama Pelanggan atau Daerah (bukan ID unik)
    if (!isTicket && !isDirectCustomerId) {
        try {
            const candidates = await searchBillingnesiaCandidates(cleanQuery);

            if (candidates.length === 0) {
                return {
                    success: false,
                    error: `Tidak ditemukan data pelanggan dengan kata kunci "${cleanQuery}" di Billingnesia.`,
                };
            }

            // Jika hanya 1 kandidat persis, langsung ambil detail lengkapnya tanpa perlu memilih
            if (candidates.length === 1 && candidates[0]) {
                return await scrapeBillingnesiaData(candidates[0].customer_id, candidates[0].customer_id);
            }

            // Jika ada beberapa kandidat (> 1), kembalikan daftar agar teknisi memilih 1 orang
            return {
                success: true,
                is_multiple: true,
                candidates,
                query: cleanQuery,
            };
        } catch (searchErr) {
            console.error("[Search Candidate Error]:", searchErr);
            return {
                success: false,
                error: searchErr instanceof Error ? searchErr.message : String(searchErr),
            };
        }
    }

    // 2. Direct fetch untuk Tiket atau ID Pelanggan terpilih
    const targetUrl = isTicket
        ? `${baseUrl.replace(/\/+$/, "")}/admin/tiket/detailtiket/${encodeURIComponent(cleanQuery.toUpperCase())}`
        : `${baseUrl.replace(/\/+$/, "")}/admin/data/detailpelanggan/${encodeURIComponent(cleanQuery)}`;

    try {
        let cookie = await getActiveSessionCookie(baseUrl);

        let response = await requestUrl(targetUrl, {
            headers: { Cookie: cookie },
        });

        // Jika ter-redirect ke halaman login
        if (response.body.includes("LOGIN | BILLINGNESIA") || response.statusCode === 401) {
            console.log("[Scraper] Sesi Billingnesia kadaluarsa. Mengautentikasi ulang...");
            cookie = await getActiveSessionCookie(baseUrl, true);

            response = await requestUrl(targetUrl, {
                headers: { Cookie: cookie },
            });
        }

        const data = parseBillingnesiaHTML(response.body, targetUrl, cleanQuery);

        // Jika query adalah tiket dan kita mendapatkan customer_id, lakukan 2-step enrich dari halaman detail pelanggan
        if (isTicket && data.customer_id) {
            try {
                const custUrl = `${baseUrl.replace(/\/+$/, "")}/admin/data/detailpelanggan/${encodeURIComponent(data.customer_id)}`;
                const custRes = await requestUrl(custUrl, {
                    headers: { Cookie: cookie },
                });
                if (!custRes.body.includes("LOGIN | BILLINGNESIA")) {
                    const custData = parseBillingnesiaHTML(custRes.body, custUrl, data.customer_id);

                    // Salin semua field data pribadi & instalasi pelanggan
                    if (custData.customer_name && !data.customer_name) data.customer_name = custData.customer_name;
                    if (custData.status_pelanggan) data.status_pelanggan = custData.status_pelanggan;
                    if (custData.badges && custData.badges.length > 0) {
                        data.badges = Array.from(new Set([...(data.badges || []), ...custData.badges]));
                    }
                    if (custData.register_date) data.register_date = custData.register_date;
                    if (custData.id_card_number) data.id_card_number = custData.id_card_number;
                    if (custData.phone_number) data.phone_number = custData.phone_number;
                    if (custData.phone_number_1) data.phone_number_1 = custData.phone_number_1;
                    if (custData.phone_number_2) data.phone_number_2 = custData.phone_number_2;
                    if (custData.email) data.email = custData.email;
                    if (custData.region) data.region = custData.region;
                    if (custData.district) data.district = custData.district;
                    if (custData.village) data.village = custData.village;
                    if (custData.hamlet) data.hamlet = custData.hamlet;
                    if (custData.address) data.address = custData.address;
                    if (custData.marketer) data.marketer = custData.marketer;
                    if (custData.registration_note) data.registration_note = custData.registration_note;
                    if (custData.commitment) data.commitment = custData.commitment;

                    // Data Instalasi
                    if (custData.server) data.server = custData.server;
                    if (custData.ip_address && !data.ip_address) data.ip_address = custData.ip_address;
                    if (custData.pppoe_username) data.pppoe_username = custData.pppoe_username;
                    if (custData.pppoe_password) data.pppoe_password = custData.pppoe_password;
                    if (custData.parent_odp) data.parent_odp = custData.parent_odp;
                    if (custData.cable_outdoor) data.cable_outdoor = custData.cable_outdoor;
                    if (custData.cable_indoor) data.cable_indoor = custData.cable_indoor;

                    // Data Tab Lengkap (dari halaman detail pelanggan — bukan dari halaman tiket)
                    if (custData.services && custData.services.length > 0) data.services = custData.services;
                    if (custData.invoices && custData.invoices.length > 0) data.invoices = custData.invoices;
                    if (custData.tickets && custData.tickets.length > 0) data.tickets = custData.tickets;
                    if (custData.isolirs && custData.isolirs.length > 0) data.isolirs = custData.isolirs;
                    if (custData.logs && custData.logs.length > 0) data.logs = custData.logs;
                    if (custData.tab_counts) data.tab_counts = custData.tab_counts;

                    if (custData.coordinates_found) {
                        data.latitude = custData.latitude;
                        data.longitude = custData.longitude;
                        data.coordinates_found = true;
                    }
                    if (custData.unpaid_amount > 0) {
                        data.unpaid_amount = custData.unpaid_amount;
                    }
                }
            } catch (enrichErr) {
                console.warn("[Scraper] Gagal memperkaya data pelanggan dari tiket:", enrichErr);
            }
        }

        if (!data.ticket_id && !data.customer_id && !data.customer_name) {
            return {
                success: false,
                error: `Data tidak ditemukan di Billingnesia untuk query "${cleanQuery}". Silakan periksa kembali nomor tiket atau ID pelanggan.`,
            };
        }

        return {
            success: true,
            is_multiple: false,
            data,
        };
    } catch (err: unknown) {
        console.error("[Billingnesia Scraper Error]:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
