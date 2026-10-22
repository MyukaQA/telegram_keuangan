// ============================================
// HANDLER CALLBACK (TOMBOL INLINE)
// ============================================

class CallbackHandler {
  constructor(db, api) {
    this.db = db;
    this.api = api;
  }
  
  handle(callback) {
    var chatId = callback.message.chat.id;
    var messageId = callback.message.message_id;
    var data = callback.data;
    
    console.log("Callback: " + data);
    
    // Jawab callback biar loading hilang
    this.api.answerCallbackQuery(callback.id);
    
    if (data.startsWith("rekap_")) {
      this.handleRekap(chatId, messageId, data);
    } else if (data.startsWith("tahun_")) {
      this.handleGantiTahun(chatId, messageId, data);
    }
  }
  
  handleRekap(chatId, messageId, data) {
    var parts = data.split("_");
    var bulan = parseInt(parts[1]);
    var tahun = parseInt(parts[2]);
    
    var transaksi = this.db.getTransaksiByBulan(chatId, bulan, tahun);
    
    var pemasukan = 0, pengeluaran = 0, kategoriStats = {};
    
    for (var i = 0; i < transaksi.length; i++) {
      var t = transaksi[i];
      if (t.tipe === "Pemasukan") {
        pemasukan += t.nominal;
      } else {
        pengeluaran += t.nominal;
        kategoriStats[t.kategori] = (kategoriStats[t.kategori] || 0) + t.nominal;
      }
    }
    
    var sorted = Object.entries(kategoriStats).sort((a, b) => b[1] - a[1]);
    
    var hasil = `📊 *Rekap ${BULAN_NAMES[bulan]} ${tahun}*\n\n` +
                `💵 Pemasukan: Rp${Utils.formatRupiah(pemasukan)}\n` +
                `💸 Pengeluaran: Rp${Utils.formatRupiah(pengeluaran)}\n` +
                `📈 Sisa: Rp${Utils.formatRupiah(pemasukan - pengeluaran)}\n\n`;
    
    if (sorted.length > 0) {
      hasil += "*Top Pengeluaran:*\n";
      sorted.slice(0, 5).forEach(([k, v]) => {
        hasil += `• ${k}: Rp${Utils.formatRupiah(v)}\n`;
      });
    } else {
      hasil += "_Tidak ada transaksi_";
    }
    
    hasil += "\n\n_Klik /rekapbulanan untuk pilih bulan lain_";
    
    this.api.editMessageText(chatId, messageId, hasil);
  }
  
  handleGantiTahun(chatId, messageId, data) {
    var tahun = parseInt(data.split("_")[1]);
    this.kirimTombolBulan(chatId, tahun, messageId);
  }
  
  kirimTombolBulan(chatId, tahun, editMessageId = null) {
    var tombol = [
      [
        { text: "Jan", callback_data: "rekap_0_" + tahun },
        { text: "Feb", callback_data: "rekap_1_" + tahun },
        { text: "Mar", callback_data: "rekap_2_" + tahun },
        { text: "Apr", callback_data: "rekap_3_" + tahun }
      ],
      [
        { text: "Mei", callback_data: "rekap_4_" + tahun },
        { text: "Jun", callback_data: "rekap_5_" + tahun },
        { text: "Jul", callback_data: "rekap_6_" + tahun },
        { text: "Ags", callback_data: "rekap_7_" + tahun }
      ],
      [
        { text: "Sep", callback_data: "rekap_8_" + tahun },
        { text: "Okt", callback_data: "rekap_9_" + tahun },
        { text: "Nov", callback_data: "rekap_10_" + tahun },
        { text: "Des", callback_data: "rekap_11_" + tahun }
      ],
      [
        { text: "« " + (tahun-1), callback_data: "tahun_" + (tahun-1) },
        { text: (tahun+1) + " »", callback_data: "tahun_" + (tahun+1) }
      ]
    ];
    
    var text = "📅 Pilih bulan " + tahun + ":";
    var markup = { inline_keyboard: tombol };
    
    if (editMessageId) {
      this.api.editMessageText(chatId, editMessageId, text, {
        reply_markup: markup
      });
    } else {
      this.api.sendMessage(chatId, text, { reply_markup: markup });
    }
  }
}