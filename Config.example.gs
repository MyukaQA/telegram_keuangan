// ============================================
// CONTOH KONFIGURASI BOT TELEGRAM KEUANGAN
// Salin file ini menjadi Config.gs lalu sesuaikan nilainya
// ============================================

const SCRIPT_PROPS = PropertiesService.getScriptProperties();

const CONFIG = {
  // Ambil dari Script Properties atau isi nilai default jika diperlukan
  BOT_TOKEN: SCRIPT_PROPS.getProperty("BOT_TOKEN") || "YOUR_TELEGRAM_BOT_TOKEN_HERE",
  SHEET_ID: SCRIPT_PROPS.getProperty("SHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",
  LARAVEL_URL: SCRIPT_PROPS.getProperty("LARAVEL_URL") || "https://your-domain.ngrok-free.app/api/sync",
  WEBHOOK_URL: SCRIPT_PROPS.getProperty("WEBHOOK_URL") || "https://script.google.com/macros/s/YOUR_EXEC_ID/exec",
  TELEGRAM_API: "https://api.telegram.org/bot"
};

const SHEET_NAMES = {
  TRANSAKSI: "Transaksi",
  USERS: "Users",
  PENGATURAN: "Pengaturan",
  CICILAN: "Cicilan",
  PEMBAYARAN_CICILAN: "PembayaranCicilan"
};

const KEYWORDS = {
  PEMASUKAN: ["gaji", "bonus", "jualan", "investasi", "deposit", "terima", "masuk", "hasil", "profit", "freelance"]
};

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
