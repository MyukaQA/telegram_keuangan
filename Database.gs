// ============================================
// DATABASE LAYER - OPERASI SPREADSHEET
// ============================================

class Database {
  constructor() {
    this.ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  }
  
  getSheet(name, headers = null) {
    var sheet = this.ss.getSheetByName(name);
    if (!sheet) {
      sheet = this.ss.insertSheet(name);
      if (headers) {
        sheet.appendRow(headers);
      }
    }
    return sheet;
  }
  
  // Transaksi Methods
  getTransaksiSheet() {
    return this.getSheet(SHEET_NAMES.TRANSAKSI, 
      ["Timestamp", "UserID", "Nama", "Kategori", "Nominal", "Tipe", "Status", "SyncedAt", "TransactionID"]);
  }
  
  saveTransaksi(chatId, nama, kategori, nominal, tipe, tanggal = new Date()) {
    var sheet = this.getTransaksiSheet();
    
    // Generate unique ID
    var transId = Utilities.getUuid(); // atau timestamp + random
    
    sheet.appendRow([
      tanggal, 
      chatId, 
      nama, 
      kategori, 
      nominal, 
      tipe,
      "pending",
      "",
      transId  // ← Kolom I: Transaction ID
    ]);
    
    return transId;
  }

  // Ambil transaksi yang belum sync
  getPendingTransaksi() {
    var sheet = this.getTransaksiSheet();
    var data = sheet.getDataRange().getValues();
    var pending = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][6] === "pending" || data[i][6] === "failed") {  // Kolom Status
        pending.push({
          rowIndex: i + 1,  // Untuk update nanti
          timestamp: data[i][0],
          userId: data[i][1],
          nama: data[i][2],
          kategori: data[i][3],
          nominal: data[i][4],
          tipe: data[i][5],
          status: data[i][6],
          syncedAt: data[i][7],
          transactionId: data[i][8] || ""
        });
      }
    }
    return pending;
  }

  // Mark transaksi sebagai synced
  markAsSynced(rowIndex) {
    var sheet = this.getTransaksiSheet();
    sheet.getRange(rowIndex, 7).setValue("synced");      // Status
    sheet.getRange(rowIndex, 8).setValue(new Date());    // SyncedAt
  }
  
  // Mark transaksi sebagai failed
  markAsFailed(rowIndex) {
    var sheet = this.getTransaksiSheet();
    sheet.getRange(rowIndex, 7).setValue("failed");
  }
  
  getTransaksiByUser(chatId, filterFn = null) {
    var sheet = this.getTransaksiSheet();
    var data = sheet.getDataRange().getValues();
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(chatId)) {
        if (!filterFn || filterFn(data[i])) {
          result.push({
            timestamp: data[i][0],
            userId: data[i][1],
            nama: data[i][2],
            kategori: data[i][3],
            nominal: data[i][4],
            tipe: data[i][5]
          });
        }
      }
    }
    return result;
  }
  
  getTransaksiBulanIni(chatId) {
    var now = new Date();
    return this.getTransaksiByUser(chatId, function(row) {
      var rowDate = new Date(row[0]);
      return rowDate.getMonth() === now.getMonth() && 
             rowDate.getFullYear() === now.getFullYear();
    });
  }
  
  getTransaksiHariIni(chatId) {
    var today = new Date();
    today.setHours(0,0,0,0);
    
    return this.getTransaksiByUser(chatId, function(row) {
      var rowDate = new Date(row[0]);
      rowDate.setHours(0,0,0,0);
      return rowDate.getTime() === today.getTime();
    });
  }
  
  getTransaksiByBulan(chatId, bulan, tahun) {
    return this.getTransaksiByUser(chatId, function(row) {
      var rowDate = new Date(row[0]);
      return rowDate.getMonth() === bulan && 
             rowDate.getFullYear() === tahun;
    });
  }
  
  // User Methods
  getUserSheet() {
    return this.getSheet(SHEET_NAMES.USERS, ["UserID", "Nama"]);
  }
  
  saveUser(chatId, username) {
    var sheet = this.getUserSheet();
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(chatId)) return;
    }
    sheet.appendRow([chatId, username]);
  }
  
  getUserName(chatId) {
    var sheet = this.getUserSheet();
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(chatId)) return data[i][1];
    }
    return "Unknown";
  }
  
  // Pengaturan Methods
  getPengaturanSheet() {
    return this.getSheet(SHEET_NAMES.PENGATURAN, 
      ["UserID", "TanggalGajian", "BatasBawah", "BatasAtas", "ModeNotif"]);
  }
  
  getPengaturan(chatId) {
    var sheet = this.getPengaturanSheet();
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(chatId)) {
        return {
          userId: data[i][0],
          tanggalGajian: data[i][1],
          batasBawah: data[i][2],
          batasAtas: data[i][3],
          modeNotif: data[i][4]
        };
      }
    }
    return null;
  }
  
  savePengaturan(chatId, tglGajian, batasBawah, batasAtas) {
    var sheet = this.getPengaturanSheet();
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(chatId)) {
        sheet.getRange(i + 1, 2).setValue(tglGajian);
        sheet.getRange(i + 1, 3).setValue(batasBawah);
        sheet.getRange(i + 1, 4).setValue(batasAtas);
        return true; // Updated
      }
    }
    
    sheet.appendRow([chatId, tglGajian, batasBawah, batasAtas, "aktif"]);
    return false; // New
  }

  // Cicilan Methods
  getCicilanSheet() {
    return this.getSheet(SHEET_NAMES.CICILAN || "Cicilan", 
      ["ID", "UserID", "Nama", "Total", "PerBulan", "SisaHutang", "TglJatuhTempo", "Status", "CreatedAt"]);
  }

  getPembayaranCicilanSheet() {
    return this.getSheet(SHEET_NAMES.PEMBAYARAN_CICILAN || "PembayaranCicilan", 
      ["ID", "CicilanID", "UserID", "Tanggal", "Nominal", "SisaBaru"]);
  }
}