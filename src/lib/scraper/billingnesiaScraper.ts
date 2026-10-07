/**
 * Billingnesia On-Demand Scraper Service
 * Menggunakan native Node.js HTTPS client dengan SSL flexibility dan cookie jar
 */

import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

export interface BillingnesiaScrapedData {
    ticket_id?: string;
    customer_id?: string;
    customer_name: string;
    phone_number: string;
    address: string;
    latitude: number;
    longitude: number;
    coordinates_found: boolean;
    category?: string;
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
let cachedCookie: string | null = null;
let lastLoginTime: number = 0;
const SESSION_CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam TTL

const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // Menangani intermediate CA chain yang tidak dibundle pada server target
    keepAlive: true,
});

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
            agent: isHttps ? httpsAgent : undefined,
            timeout: 15000,
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
            reject(new Error("Koneksi ke Billingnesia mengalami timeout (15 detik)."));
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

/**
 * Parsing HTML data Billingnesia
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

    // Potong navigasi/sidebar jika ada marker konten detail utama
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

    // Pola B (Header Detail Pelanggan): "Detail SRI RAHAYU 0101010602040"
    if (!customerName || !customerId) {
        const detailCustomerHeaderMatch = plainText.match(
            /Detail\s+([A-Za-z\s.,'-]+?)\s+(\d{10,13})\s+(?:ITN|PJK|PELANGGAN|AKTIF)/i
        );
        if (detailCustomerHeaderMatch) {
            if (!customerName) customerName = detailCustomerHeaderMatch[1].trim();
            if (!customerId) customerId = detailCustomerHeaderMatch[2].trim();
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

    // Pola D Fallback untuk Customer ID
    if (!customerId) {
        const cidMatch = plainText.match(/\b01\d{8,11}\b/) || plainText.match(/\b\d{10,13}\b/) || query.match(/^\d{10,13}$/);
        if (cidMatch) {
            customerId = cidMatch[0];
        }
    }

    // Pola E Fallback untuk Customer Name
    if (!customerName) {
        const nameHeaderMatch = htmlWithoutScripts.match(
            /<(?:h[1-4]|div|span)[^>]*class=["'][^"']*(?:customer-name|card-title|font-bold|text-lg)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[1-4]|div|span)>/i
        );
        if (nameHeaderMatch) {
            let rawName = nameHeaderMatch[1].replace(/<[^>]+>/g, "").trim();
            if (rawName.includes("-")) rawName = rawName.split("-")[1];
            customerName = rawName.replace(/Detail Pelanggan|Tiket|Pelanggan|Menu Utama/gi, "").trim();
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

    // 3. Ekstrak No. WhatsApp / HP (08... atau 628...)
    let phoneNumber = "";
    const phoneLabeledMatch = plainText.match(
        /(?:Telepon|WhatsApp|No\.?\s*HP|No\.?\s*WA|Kontak)[\s:]*([0-9]{9,14})/i
    );
    if (phoneLabeledMatch) {
        phoneNumber = phoneLabeledMatch[1].trim();
    } else {
        const phoneMatch = plainText.match(/\b(08\d{8,11}|628\d{8,11})\b/);
        if (phoneMatch) {
            phoneNumber = phoneMatch[0];
        }
    }

    // 4. Ekstrak Alamat Lengkap
    let address = "";
    const addrCellMatch = htmlWithoutScripts.match(
        /(?:Alamat|Alamat Pelanggan|Address)[\s\S]{0,100}?<td[^>]*>([\s\S]*?)<\/td>/i
    );
    if (addrCellMatch) {
        address = addrCellMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    } else {
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

    // 5. Ekstrak Total Tunggakan (Invoice Jatuh Tempo / Belum Bayar)
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

    // 6. Ekstrak Koordinat Lat/Lng dari Google Maps Link
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

    // 7. Ekstrak Kategori Tiket
    let category = "MAINTENANCE RETAIL";
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

    // 8. Ekstrak Tipe Perangkat ONT
    let deviceType = "ONT ZTE F609";
    const ontMatch = plainText.match(/\b(ZTE\s+[A-Z0-9]+|HUAWEI\s+[A-Z0-9]+|FIBERHOME\s+[A-Z0-9]+)\b/i);
    if (ontMatch) {
        deviceType = `ONT ${ontMatch[1].toUpperCase()}`;
    }

    return {
        ticket_id: ticketId,
        customer_id: customerId,
        customer_name: customerName,
        phone_number: phoneNumber,
        address: address,
        latitude,
        longitude,
        coordinates_found: coordinatesFound,
        category,
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
                    if (custData.customer_name && !data.customer_name) {
                        data.customer_name = custData.customer_name;
                    }
                    if (custData.phone_number) {
                        data.phone_number = custData.phone_number;
                    }
                    if (custData.address) {
                        data.address = custData.address;
                    }
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
