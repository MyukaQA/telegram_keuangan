// ============================================
// KALKULATOR STATUS BUDGET
// ============================================

class BudgetCalculator {
  constructor(db) {
    this.db = db;
  }
  
  calculate(chatId) {
    var pengaturan = this.db.getPengaturan(chatId);
    
    if (!pengaturan) {
      return { error: "Belum ada pengaturan. Ketik:\n`/atur [tgl_gajian] [batas_bawah] [batas_atas]`\n\nContoh:\n`/atur 25 100000 300000`" };
    }
    
    var sekarang = new Date();
    var hariIni = sekarang.getDate();
    var bulanIni = sekarang.getMonth();
    var tahunIni = sekarang.getFullYear();
    
    // Hitung total pemasukan & pengeluaran
    var transaksi = this.db.getTransaksiByUser(chatId);
    var totalPemasukan = 0;
    var totalPengeluaran = 0;
    
    for (var i = 0; i < transaksi.length; i++) {
      if (transaksi[i].tipe === "Pemasukan") {
        totalPemasukan += transaksi[i].nominal;
      } else {
        totalPengeluaran += transaksi[i].nominal;
      }
    }
    
    var sisaUang = totalPemasukan - totalPengeluaran;
    
    var sisaHariResult = this.hitungSisaHari(hariIni, bulanIni, tahunIni, pengaturan.tanggalGajian);
    
    var sisaHari = sisaHariResult.hari;           // ← ambil number
    var tanggalGajianStr = sisaHariResult.tanggalGajianStr;  // ← ambil string
    
    // Hitung daily budget
    var dailyBudget = sisaHari > 0 ? sisaUang / sisaHari : 0;
    
    // Tentukan status
    var status = this.tentukanStatus(dailyBudget, pengaturan.batasBawah, pengaturan.batasAtas);
    
    return {
      status: status.status,
      emoji: status.emoji,
      pesan: status.pesan,
      sisaUang: sisaUang,
      sisaHari: sisaHari,
      dailyBudget: dailyBudget,
      totalPemasukan: totalPemasukan,
      totalPengeluaran: totalPengeluaran,
      batasBawah: pengaturan.batasBawah,
      batasAtas: pengaturan.batasAtas,
      tanggalGajian: tanggalGajianStr
    };
  }

  hitungSisaHari(hariIni, bulanIni, tahunIni, tanggalGajian) {
    var bulanGajianBerikutnya = bulanIni;
    var tahunGajianBerikutnya = tahunIni;
    
    if (hariIni >= tanggalGajian) {
      bulanGajianBerikutnya++;
      if (bulanGajianBerikutnya > 11) {
        bulanGajianBerikutnya = 0;
        tahunGajianBerikutnya++;
      }
    }
    
    var tanggalGajianDate = new Date(tahunGajianBerikutnya, bulanGajianBerikutnya, tanggalGajian);
    var sekarang = new Date();
    var selisihHari = Math.ceil((tanggalGajianDate - sekarang) / (1000 * 60 * 60 * 24));
    
    // Pastikan minimal 1 hari (kalau hari ini gajian)
    if (selisihHari <= 0) selisihHari = 1;
    
    return {
      hari: selisihHari,
      tanggalGajianStr: tanggalGajian + "/" + (bulanGajianBerikutnya + 1) + "/" + tahunGajianBerikutnya
    };
  }  

  tentukanStatus(dailyBudget, batasBawah, batasAtas) {
    if (dailyBudget < batasBawah) {
      return {
        status: "danger",
        emoji: "🔴",
        pesan: "BUDGET KRITIS! Segera kurangi pengeluaran!"
      };
    } else if (dailyBudget <= batasAtas) {
      return {
        status: "warning",
        emoji: "🟡",
        pesan: "Budget menipis, hati-hati berbelanja!"
      };
    } else {
      return {
        status: "safe",
        emoji: "🟢",
        pesan: "Budget aman, tetap hemat ya!"
      };
    }
  }
}