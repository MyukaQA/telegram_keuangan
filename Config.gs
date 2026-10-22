// ============================================
// KONFIGURASI & KONSTANTA
// ============================================

const SCRIPT_PROPS = PropertiesService.getScriptProperties();

const CONFIG = {
  BOT_TOKEN: SCRIPT_PROPS.getProperty("BOT_TOKEN") || "",
  SHEET_ID: SCRIPT_PROPS.getProperty("SHEET_ID") || "",
  LARAVEL_URL: SCRIPT_PROPS.getProperty("LARAVEL_URL") || "",
  WEBHOOK_URL: SCRIPT_PROPS.getProperty("WEBHOOK_URL") || "",
  TELEGRAM_API: "https://api.telegram.org/bot"
};

const SHEET_NAMES = {
  TRANSAKSI: "Transaksi",
  USERS: "Users",
  PENGATURAN: "Pengaturan"
};

const KEYWORDS = {
  PEMASUKAN: ["gaji", "bonus", "jualan", "investasi", "deposit", "terima", "masuk", "hasil", "profit", "freelance"]
};

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Jalankan fungsi ini SEKALI di editor Google Apps Script
 * untuk menyimpan kredensial ke Script Properties.
 * Setelah dijalankan, kredensial aman di cloud Google, tidak ikut ter-upload ke Git.
 */
function setInitialScriptProperties() {
  PropertiesService.getScriptProperties().setProperties({
    BOT_TOKEN: "YOUR_TELEGRAM_BOT_TOKEN_HERE",
    SHEET_ID: "YOUR_SPREADSHEET_ID_HERE",
    LARAVEL_URL: "https://your-domain.ngrok-free.app/api/sync",
    WEBHOOK_URL: "https://script.google.com/macros/s/YOUR_EXEC_ID/exec"
  });
  console.log("Script Properties berhasil disimpan!");
}