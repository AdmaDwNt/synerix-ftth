"use client";

import React, { useState } from "react";
import {
    Smartphone,
    Copy,
    Check,
    X,
    ExternalLink,
    Zap,
    HelpCircle,
    CheckCircle2,
    ShieldCheck,
    Sparkles
} from "lucide-react";

interface InstallBookmarkletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InstallBookmarkletModal({
    isOpen,
    onClose,
}: InstallBookmarkletModalProps) {
    const [copied, setCopied] = useState(false);
    const [selectedTab, setSelectedTab] = useState<"CHROME" | "SAFARI">("CHROME");
    const [testStatus, setTestStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
    const [testMessage, setTestMessage] = useState("");

    if (!isOpen) return null;

    // Kode Bookmarklet JavaScript Mobile (Minified & Ready to paste)
    const bookmarkletCode = `javascript:(function(){const API_URL='https://synerix-ftth.vercel.app/api/dismantles/ingest';const INGEST_SECRET='synerix-ftth-secret-2026';const showToast=(msg,isError=false)=>{const el=document.createElement('div');el.style.position='fixed';el.style.bottom='24px';el.style.left='50%';el.style.transform='translateX(-50%)';el.style.backgroundColor=isError?'#EF4444':'#0D9488';el.style.color='#FFFFFF';el.style.padding='12px 20px';el.style.borderRadius='14px';el.style.boxShadow='0 10px 30px rgba(0,0,0,0.35)';el.style.fontFamily='system-ui,sans-serif';el.style.fontSize='13px';el.style.fontWeight='600';el.style.zIndex='999999';el.style.maxWidth='90%';el.style.textAlign='center';el.innerText=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),4000);};showToast('⏳ Mengekstrak data Billingnesia...');let payload={ticket_id:'',customer_id:'',customer_name:'',phone_number:'',address:'',latitude:null,longitude:null,unpaid_amount:0,billing_url:window.location.href,device_type:'ONT ZTE F609',auto_ingested:true};const ticketMatch=window.location.href.match(/TKT\\d+/i)||document.body.innerText.match(/TKT\\d+/i);if(ticketMatch)payload.ticket_id=ticketMatch[0].toUpperCase();const cidMatch=document.body.innerText.match(/\\b\\d{10,13}\\b/);if(cidMatch)payload.customer_id=cidMatch[0];const nameSelector=document.querySelector('h1,h2,h3,.card-title,.customer-name,[data-field=\"customer_name\"]');if(nameSelector){let raw=nameSelector.innerText;if(raw.includes('-'))raw=raw.split('-')[1];payload.customer_name=raw.replace(/Detail Pelanggan|Tiket/gi,'').trim();}const phoneMatch=document.body.innerText.match(/\\b(08\\d{8,11}|628\\d{8,11})\\b/);if(phoneMatch)payload.phone_number=phoneMatch[0];const bodyText=document.body.innerText;const addrMatch=bodyText.match(/(jalan|jl\\.|dusun|desa|kecamatan|kelurahan|komplek|perum)[\\s\\S]*?(?=\\b(MARKETER|COMMITMENT|SERVER|KOMITMEN|PAKET|TAGIHAN|STATUS)\\b|$)/i);if(addrMatch){payload.address=addrMatch[0].replace(/\\n+/g,' ').replace(/\\s{2,}/g,' ').trim();}let totalUnpaid=0;const tableRows=Array.from(document.querySelectorAll('tr,.invoice-row,.card'));tableRows.forEach(row=>{const text=row.innerText.toUpperCase();if(text.includes('JATUH TEMPO')||text.includes('UNPAID')||text.includes('BELUM BAYAR')){const nominalMatch=row.innerText.match(/Rp\\s*([\\d.,]+)/i);if(nominalMatch){const cleanNumber=parseInt(nominalMatch[1].replace(/[^0-9]/g,''),10);if(!isNaN(cleanNumber))totalUnpaid+=cleanNumber;}}});payload.unpaid_amount=totalUnpaid;const mapLinks=Array.from(document.querySelectorAll('a[href*=\"google.com/maps\"],a[href*=\"maps.google.com\"],a[href*=\"maps.app.goo.gl\"]'));for(let a of mapLinks){const match=a.href.match(/@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/)||a.href.match(/q=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/)||a.href.match(/query=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);if(match){payload.latitude=parseFloat(match[1]);payload.longitude=parseFloat(match[2]);break;}}if(!payload.ticket_id&&!payload.customer_id){showToast('❌ Tidak menemukan Ticket ID / Customer ID!',true);return;}fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json','x-synerix-ingest-secret':INGEST_SECRET},body:JSON.stringify(payload)}).then(r=>r.json()).then(res=>{if(res.success){if(navigator.vibrate)navigator.vibrate([100,50,100]);showToast('✅ Berhasil dikirim ke Synerix!\\nCluster: '+res.data.cluster_name+' | Tunggakan: Rp '+Number(res.data.unpaid_amount).toLocaleString('id-ID'));}else{showToast('❌ Ingest Gagal: '+(res.error||'Server error'),true);}}).catch(e=>{showToast('❌ Gagal terhubung ke Synerix: '+e.message,true);});})();`;

    const handleCopy = () => {
        navigator.clipboard.writeText(bookmarkletCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    // Test Ingest Simulator
    const handleRunTest = async () => {
        setTestStatus("LOADING");
        setTestMessage("Menguji koneksi ke endpoint Synerix...");
        try {
            const res = await fetch("/api/dismantles/ingest", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-synerix-ingest-secret": "synerix-ftth-secret-2026",
                },
                body: JSON.stringify({
                    ticket_id: `TEST-${Date.now().toString().slice(-4)}`,
                    customer_id: "0101TEST9999",
                    customer_name: "Uji Coba Auto-Ingest Mobile",
                    address: "Jl. Lapangan Merdeka No. 1, Purwokerto",
                    unpaid_amount: 150000,
                    billing_url: "https://synerix-ftth.vercel.app/dismantles",
                    notes: "Tiket pengujian integrasi bookmarklet",
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setTestStatus("SUCCESS");
                setTestMessage(`Koneksi Sukses! Data uji berhasil dibuat dengan Cluster [${data.data.cluster_name}] dan Tiket [${data.data.ticket_id}].`);
            } else {
                setTestStatus("ERROR");
                setTestMessage(data.error || "Gagal menghubungi endpoint.");
            }
        } catch (err: unknown) {
            setTestStatus("ERROR");
            setTestMessage(err instanceof Error ? err.message : "Koneksi terputus.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-6">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 via-cyan-50 to-white flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                                    Bookmarklet Ingest HP (1-Tap)
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                                    Zero-Install
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Ekstrak data dismantle dari Billingnesia ke Synerix hanya dengan 1 kali klik di browser HP.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                        title="Tutup Modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-slate-700 text-xs">
                    {/* Action 1: Salin Kode */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Langkah 1: Salin Script Bookmarklet
                            </span>
                            {copied && (
                                <span className="text-[11px] font-bold text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-full animate-in fade-in">
                                    ✓ Berhasil Disalin!
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <div className="p-3 bg-slate-900 text-teal-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-24 select-all break-all border border-slate-800">
                                {bookmarkletCode}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                                copied
                                    ? "bg-teal-700 text-white"
                                    : "bg-teal-600 hover:bg-teal-700 active:scale-98 text-white shadow-teal-600/20"
                            }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Tersalin ke Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Salin Kode Bookmarklet ke HP</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Action 2: Panduan Pasang Per Browser */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4 text-teal-600" />
                                Langkah 2: Cara Pasang di Browser HP
                            </span>

                            {/* Tab Switcher */}
                            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTab("CHROME")}
                                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                                        selectedTab === "CHROME"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    Google Chrome (Android)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTab("SAFARI")}
                                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                                        selectedTab === "SAFARI"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    Safari (iPhone/iOS)
                                </button>
                            </div>
                        </div>

                        {selectedTab === "CHROME" ? (
                            <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100 space-y-2.5 text-slate-700">
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        1
                                    </span>
                                    <p>
                                        Buka browser Chrome di HP Anda, buka halaman apa saja, lalu simpan sebagai Bookmark (tekan ikon <strong>Titik Tiga ⋮</strong> &gt; pilih ikon <strong>Bintang ☆</strong>).
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        2
                                    </span>
                                    <p>
                                        Masuk ke menu <strong>Bookmark</strong>, tekan tombol titik tiga pada bookmark tadi &gt; pilih <strong>Edit</strong>.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        3
                                    </span>
                                    <p>
                                        Ubah namanya menjadi <code className="bg-white px-1.5 py-0.5 rounded text-cyan-900 font-bold border border-cyan-200">📥 Ingest ke Synerix</code>, lalu pada kolom <strong>URL</strong>, hapus semuanya dan <strong>Paste (Tempel)</strong> kode yang sudah disalin di atas.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        ✓
                                    </span>
                                    <p className="font-semibold text-emerald-900">
                                        <strong>Cara Menggunakan:</strong> Buka halaman tiket di Billingnesia. Pada bilah alamat (URL bar) Chrome, ketik <span className="underline">Ingest</span> lalu pilih bookmark yang muncul. Script akan otomatis membaca data dan mengirimkannya ke Synerix!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-2.5 text-slate-700">
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        1
                                    </span>
                                    <p>
                                        Di Safari iPhone, tekan tombol <strong>Share (Bagikan)</strong> di bagian bawah &gt; pilih <strong>Add Bookmark (Tambah Penanda)</strong>.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        2
                                    </span>
                                    <p>
                                        Beri nama <code className="bg-white px-1.5 py-0.5 rounded text-teal-900 font-bold border border-teal-200">📥 Ingest ke Synerix</code> lalu tekan <strong>Save (Simpan)</strong>.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        3
                                    </span>
                                    <p>
                                        Buka menu <strong>Bookmarks (ikon buku)</strong>, tekan tombol <strong>Edit</strong> di kanan bawah, lalu pilih bookmark yang baru dibuat. Hapus seluruh isi kolom alamat URL dan <strong>Paste (Tempel)</strong> kode yang telah disalin.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        ✓
                                    </span>
                                    <p className="font-semibold text-emerald-900">
                                        <strong>Cara Menggunakan:</strong> Buka halaman tiket pelanggan di Billingnesia, buka menu Bookmarks, lalu ketuk bookmark <span className="underline">📥 Ingest ke Synerix</span>.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action 3: Uji Koneksi Endpoint (Live Test Simulator) */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                Uji Coba Server Ingest (Simulator)
                            </span>
                            <button
                                type="button"
                                onClick={handleRunTest}
                                disabled={testStatus === "LOADING"}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>{testStatus === "LOADING" ? "Menguji..." : "Jalankan Simulasi Test"}</span>
                            </button>
                        </div>

                        {testStatus !== "IDLE" && (
                            <div
                                className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                                    testStatus === "SUCCESS"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                                        : testStatus === "ERROR"
                                        ? "bg-rose-50 border-rose-200 text-rose-800"
                                        : "bg-slate-100 border-slate-200 text-slate-600"
                                }`}
                            >
                                {testStatus === "SUCCESS" ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <span>{testMessage}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 text-xs transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
