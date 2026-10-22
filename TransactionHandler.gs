// ============================================
// HANDLER INPUT TRANSAKSI LANGSUNG
// ============================================

class TransactionHandler {
  constructor(db, api, budgetCalc) {
    this.db = db;
    this.api = api;
    this.budgetCalc = budgetCalc;
  }
  
  handle(chatId, text) {
    // Parse tanggal
    var dateResult = DateParser.parse(text);
    var tanggal = dateResult.tanggal;
    var cleanText = dateResult.cleanText;
    
    // Pattern: [kategori] [nominal]
    var match = cleanText.match(/^([a-zA-Z\s]+)\s+(\d[\d\.,]*)\s*$/);
    
    if (!match) {
      return "❓ Format tidak dikenal.\nContoh:\n`makan 25000 kemarin`\n`transport 15000 15/02/25`";
    }
    
    var kategori = match[1].trim().toLowerCase();
    var nominal = parseInt(match[2].replace(/[.,]/g, ""));
    
    if (isNaN(nominal) || nominal <= 0) {
      return "❌ Nominal tidak valid.";
    }
    
    var tipe = this.detectTipe(kategori);
    var nama = this.db.getUserName(chatId);
    
    // Simpan
    this.db.saveTransaksi(chatId, nama, kategori, nominal, tipe, tanggal);
    
    // Cek budget kalau pengeluaran
    if (tipe === "Pengeluaran") {
      this.cekDanWarning(chatId, kategori, nominal);
    }
    
    // Response
    var emoji = tipe === "Pemasukan" ? "📥" : "📤";
    var tglStr = Utilities.formatDate(tanggal, Session.getScriptTimeZone(), "dd/MM/yyyy");
    
    return `${emoji} *${tipe} Tercatat!*\n\n` +
           `📅 Tanggal: ${tglStr}\n` +
           `📂 ${kategori}\n` +
           `💰 Rp${Utils.formatRupiah(nominal)}`;
  }
  
  detectTipe(kategori) {
    var k = kategori.toLowerCase();
    for (var i = 0; i < KEYWORDS.PEMASUKAN.length; i++) {
      if (k.includes(KEYWORDS.PEMASUKAN[i])) return "Pemasukan";
    }
    return "Pengeluaran";
  }
  
  cekDanWarning(chatId, kategori, nominal) {
    var status = this.budgetCalc.calculate(chatId);
    
    if (!status.error && status.status === "danger") {
      var pesan = `⚠️ *PERINGATAN BUDGET*\n\n` +
                  `Transaksi: ${kategori} Rp${Utils.formatRupiah(nominal)}\n\n` +
                  `Status: ${status.emoji} *${status.status.toUpperCase()}*\n` +
                  `Daily Budget: Rp${Utils.formatRupiah(Math.floor(status.dailyBudget))}\n\n` +
                  `_Segera kurangi pengeluaran!_`;
      
      // Delay biar gak spam
      Utilities.sleep(500);
      this.api.sendMessage(chatId, pesan);
    }
  }
}