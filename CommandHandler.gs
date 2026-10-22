// ============================================
// HANDLER SEMUA COMMAND
// ============================================

class CommandHandler {
  constructor(db, api, budgetCalc, callbackHandler) {
    this.db = db;
    this.api = api;
    this.budgetCalc = budgetCalc;
    this.callbackHandler = callbackHandler;
  }
  
  handle(chatId, username, text) {
    var cmd = text.toLowerCase().split(" ")[0].trim();
    
    switch(cmd) {
      case "/start":
        return this.start(username);
      case "/help":
        return this.help();
      case "/catat":
        return this.catat(chatId, text);
      case "/hariini":
        return this.hariIni(chatId);
      case "/bulanini":
        return this.bulanIni(chatId);
      case "/rekapbulanan":
        this.rekapBulanan(chatId);
        return "SENT"; 
      case "/total":
        return this.total(chatId);
      case "/atur":
        return this.atur(chatId, text);
      case "/cekbudget":
        return this.cekBudget(chatId);
      case "/sync":
        return this.syncData(chatId);
      case "/cicilan":
        return this.cicilanCommand(chatId, text);
      case "/bayarcicilan":
        return this.bayarCicilanCommand(chatId, text);
      case "/cekcicilan":
        return this.cekCicilanCommand(chatId);
      default:
        return null; // Bukan command, coba parse transaksi
    }
  }
  
  start(username) {
    return `👋 Halo! ${username}\n\n` +
           `Selamat datang di *Bot Pencatat Keuangan*.\n\n` +
           `💡 *Cara pakai:*\n` +
           `Ketik langsung: \`makan 25000\` atau \`gaji 5000000\`\n\n` +
           `📋 *Command:*\n` +
           `/catat [kategori] [nominal] - Catat manual\n` +
           `/hariini - Lihat hari ini\n` +
           `/bulanini - Ringkasan bulan ini\n` +
           `/total - Total pemasukan & pengeluaran\n` +
           `/atur - Setting budget monitoring\n` +
           `/cekbudget - Cek status budget\n` +
           `/help - Bantuan`;
  }
  
  help() {
    return `📖 *PANDUAN PENGGUNAAN*\n\n` +
           `*Input Cepat:*\n` +
           `\`makan 25000\` → Pengeluaran makan Rp25.000\n` +
           `\`makan 25000 kemarin\` → Backdate\n` +
           `\`gaji 5000000\` → Pemasukan gaji Rp5.000.000\n\n` +
           `*Command:*\n` +
           `/catat [kategori] [nominal]\n` +
           `/hariini - Transaksi hari ini\n` +
           `/bulanini - Ringkasan bulan ini\n` +
           `/total - Total & status budget\n` +
           `/atur [tgl] [bawah] [atas] - Setting\n` +
           `/cekbudget - Cek status budget\n` +
           `/rekapbulanan - Pilih bulan`;
  }

  syncData(chatId) {
    try {
      var sync = new SyncHandler(this.db);
      
      console.log("=== /sync COMMAND ===");
      console.log("ChatID: " + chatId);
      
      // Cek koneksi
      console.log("Checking connection...");
      var isConnected = sync.checkConnection();
      console.log("Connection: " + isConnected);
      
      if (!isConnected) {
        return "❌ *Gagal Sync*\n\n" +
              "Laravel local tidak terhubung.\n\n" +
              "Pastikan:\n" +
              "• `php artisan serve` berjalan\n" +
              "• Ngrok aktif (kalau pakai)\n" +
              "• URL di SyncHandler benar\n\n" +
              "URL saat ini:\n`" + sync.laravelUrl + "`";
      }
      
      // Jalankan sync
      console.log("Starting sync...");
      var result = sync.syncPending();
      
      console.log("Result: " + JSON.stringify(result));
      
      // Format response
      if (result.total === 0) {
        return "✅ *Semua data sudah sync!*\n\nTidak ada transaksi pending.";
      }
      
      var response = `🔄 *SYNC SELESAI*\n\n` +
                    `📊 Total: ${result.total} transaksi\n` +
                    `✅ Berhasil: ${result.success}\n` +
                    `❌ Gagal: ${result.failed}\n\n`;
      
      if (result.failed > 0) {
        response += `*Detail Error:*\n`;
        result.errors.forEach(function(err) {
          response += `• ${err}\n`;
        });
        response += `\n_Cek log Apps Script untuk detail lengkap_`;
      } else {
        response += `_Semua data berhasil dikirim ke Laravel!_`;
      }
      
      return response;
      
    } catch (error) {
      console.log("ERROR syncData: " + error.toString());
      console.log("Stack: " + error.stack);
      return "❌ *Error Sync*\n\n" + error.message + "\n\n_Cek log untuk detail_";
    }
  }
  
  catat(chatId, text) {
    var parts = text.split(" ");
    if (parts.length < 3) {
      return "❌ Format: /catat [kategori] [nominal]\nContoh: /catat makan 25000";
    }
    
    var kategori = parts[1];
    var nominal = parseInt(parts[2].replace(/[^0-9]/g, ""));
    
    if (isNaN(nominal) || nominal <= 0) {
      return "❌ Nominal tidak valid.";
    }
    
    var tipe = this.detectTipe(kategori);
    var nama = this.db.getUserName(chatId);
    this.db.saveTransaksi(chatId, nama, kategori, nominal, tipe);
    
    return `✅ *Tercatat!*\n\n` +
           `📂 Kategori: ${kategori}\n` +
           `💰 Nominal: Rp${Utils.formatRupiah(nominal)}\n` +
           `📊 Tipe: ${tipe}`;
  }
  
  hariIni(chatId) {
    var transaksi = this.db.getTransaksiHariIni(chatId);
    
    if (transaksi.length === 0) {
      return "📭 Belum ada transaksi hari ini.";
    }
    
    var pemasukan = 0, pengeluaran = 0, list = [];
    
    for (var i = 0; i < transaksi.length; i++) {
      var t = transaksi[i];
      if (t.tipe === "Pemasukan") pemasukan += t.nominal;
      else pengeluaran += t.nominal;
      
      list.push(`• ${t.kategori}: Rp${Utils.formatRupiah(t.nominal)}`);
    }
    
    return `📅 *Hari Ini*\n\n` +
           list.join("\n") +
           `\n\n💵 Pemasukan: Rp${Utils.formatRupiah(pemasukan)}\n` +
           `💸 Pengeluaran: Rp${Utils.formatRupiah(pengeluaran)}\n` +
           `📊 Selisih: Rp${Utils.formatRupiah(pemasukan - pengeluaran)}`;
  }
  
  bulanIni(chatId) {
    var transaksi = this.db.getTransaksiBulanIni(chatId);
    
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
    
    var sorted = Object.entries(kategoriStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    var kategoriText = sorted.length > 0 
      ? "\n\n*Top Pengeluaran:*\n" + sorted.map(([k, v]) => `• ${k}: Rp${Utils.formatRupiah(v)}`).join("\n")
      : "";
    
    var now = new Date();
    return `📊 *Bulan Ini (${BULAN_NAMES[now.getMonth()]})*\n\n` +
           `💵 Total Pemasukan: Rp${Utils.formatRupiah(pemasukan)}\n` +
           `💸 Total Pengeluaran: Rp${Utils.formatRupiah(pengeluaran)}\n` +
           `📈 Sisa: Rp${Utils.formatRupiah(pemasukan - pengeluaran)}` +
           kategoriText;
  }

  rekapBulanan(chatId) {
    var tahun = new Date().getFullYear();
    this.callbackHandler.kirimTombolBulan(chatId, tahun);
  }
  
  total(chatId) {
    var transaksi = this.db.getTransaksiByUser(chatId);
    
    var pemasukan = 0, pengeluaran = 0;
    
    for (var i = 0; i < transaksi.length; i++) {
      if (transaksi[i].tipe === "Pemasukan") pemasukan += transaksi[i].nominal;
      else pengeluaran += transaksi[i].nominal;
    }
    
    var saldo = pemasukan - pengeluaran;
    var statusBudget = this.budgetCalc.calculate(chatId);
    
    if (statusBudget.error) {
      return `💰 *Total Keseluruhan*\n\n` +
             `📥 Pemasukan: Rp${Utils.formatRupiah(pemasukan)}\n` +
             `📤 Pengeluaran: Rp${Utils.formatRupiah(pengeluaran)}\n` +
             `🏦 Saldo: Rp${Utils.formatRupiah(saldo)}\n\n` +
             `_💡 Ketik /atur untuk setting budget monitoring_`;
    }
    
    return `${statusBudget.emoji} *TOTAL & STATUS BUDGET*\n\n` +
           `💰 Total Pemasukan: Rp${Utils.formatRupiah(pemasukan)}\n` +
           `💸 Total Pengeluaran: Rp${Utils.formatRupiah(pengeluaran)}\n` +
           `🏦 Saldo: Rp${Utils.formatRupiah(saldo)}\n\n` +
           `📅 Sisa ${statusBudget.sisaHari} hari (gajian ${statusBudget.tanggalGajian})\n` +
           `💵 Daily Budget: *Rp${Utils.formatRupiah(Math.floor(statusBudget.dailyBudget))}*/hari\n\n` +
           `🎯 Threshold:\n` +
           `🔴 Danger: < Rp${Utils.formatRupiah(statusBudget.batasBawah)}/hari\n` +
           `🟡 Warning: Rp${Utils.formatRupiah(statusBudget.batasBawah)} - Rp${Utils.formatRupiah(statusBudget.batasAtas)}/hari\n` +
           `🟢 Safe: > Rp${Utils.formatRupiah(statusBudget.batasAtas)}/hari\n\n` +
           `_${statusBudget.pesan}_`;
  }
  
  atur(chatId, text) {
    var parts = text.split(" ");
    
    // Case 1: /atur saja
    if (parts.length === 1) {
      var pengaturan = this.db.getPengaturan(chatId);
      
      if (pengaturan) {
        return `⚙️ *PENGATURAN SAAT INI*\n\n` +
               `📅 Tanggal Gajian: ${pengaturan.tanggalGajian}\n` +
               `🔴 Batas Bawah: Rp${Utils.formatRupiah(pengaturan.batasBawah)}/hari\n` +
               `🟢 Batas Atas: Rp${Utils.formatRupiah(pengaturan.batasAtas)}/hari\n\n` +
               `Untuk mengubah:\n` +
               `\`/atur ${pengaturan.tanggalGajian} ${pengaturan.batasBawah} ${pengaturan.batasAtas}\``;
      }
      
      return "⚙️ *PENGATURAN BUDGET*\n\n" +
             "Belum ada pengaturan. Format:\n" +
             "`/atur [tgl_gajian] [batas_bawah] [batas_atas]`\n\n" +
             "*Contoh:*\n" +
             "`/atur 25 100000 300000`";
    }
    
    // Case 2: Parameter kurang
    if (parts.length < 4) {
      return "❌ *Format tidak lengkap!*\n\n" +
             "Gunakan:\n" +
             "`/atur [tgl_gajian] [batas_bawah] [batas_atas]`";
    }
    
    // Case 3: Simpan
    var tglGajian = parseInt(parts[1]);
    var batasBawah = parseInt(parts[2].replace(/[^0-9]/g, ""));
    var batasAtas = parseInt(parts[3].replace(/[^0-9]/g, ""));
    
    if (isNaN(tglGajian) || tglGajian < 1 || tglGajian > 31) {
      return "❌ Tanggal gajian harus 1-31";
    }
    if (isNaN(batasBawah) || batasBawah <= 0) {
      return "❌ Batas bawah tidak valid";
    }
    if (isNaN(batasAtas) || batasAtas <= batasBawah) {
      return "❌ Batas atas harus lebih besar dari batas bawah";
    }
    
    var updated = this.db.savePengaturan(chatId, tglGajian, batasBawah, batasAtas);
    
    return (updated ? "✅ *Pengaturan diperbarui!*" : "✅ *Pengaturan berhasil disimpan!*") + "\n\n" +
           `📅 Gajian: Tanggal ${tglGajian}\n` +
           `🔴 Danger: < Rp${Utils.formatRupiah(batasBawah)}/hari\n` +
           `🟡 Warning: Rp${Utils.formatRupiah(batasBawah)} - Rp${Utils.formatRupiah(batasAtas)}/hari\n` +
           `🟢 Safe: > Rp${Utils.formatRupiah(batasAtas)}/hari`;
  }
  
  cekBudget(chatId) {
    var hasil = this.budgetCalc.calculate(chatId);
    
    if (hasil.error) return hasil.error;
    
    return `${hasil.emoji} *STATUS BUDGET*\n\n` +
           `💰 Total Pemasukan: Rp${Utils.formatRupiah(hasil.totalPemasukan)}\n` +
           `💸 Total Pengeluaran: Rp${Utils.formatRupiah(hasil.totalPengeluaran)}\n` +
           `📊 Sisa: Rp${Utils.formatRupiah(hasil.sisaUang)}\n\n` +
           `📅 Sisa ${hasil.sisaHari} hari (gajian ${hasil.tanggalGajian})\n` +
           `💵 Daily Budget: *Rp${Utils.formatRupiah(Math.floor(hasil.dailyBudget))}*/hari\n\n` +
           `🎯 *Pengaturan Threshold:*\n` +
           `🔴 Danger: < Rp${Utils.formatRupiah(hasil.batasBawah)}/hari\n` +
           `🟡 Warning: Rp${Utils.formatRupiah(hasil.batasBawah)} - Rp${Utils.formatRupiah(hasil.batasAtas)}/hari\n` +
           `🟢 Safe: > Rp${Utils.formatRupiah(hasil.batasAtas)}/hari\n\n` +
           `_${hasil.pesan}_`;
  }
  
  detectTipe(kategori) {
    var k = kategori.toLowerCase();
    for (var i = 0; i < KEYWORDS.PEMASUKAN.length; i++) {
      if (k.includes(KEYWORDS.PEMASUKAN[i])) return "Pemasukan";
    }
    return "Pengeluaran";
  }

  cicilanCommand(chatId, text) {
    console.log("=== CICILAN COMMAND START ===");
    console.log("Raw text: '" + text + "'");
    
    var parts = text.trim().replace(/\s+/g, " ").split(" ");
    console.log("Parts: " + JSON.stringify(parts));
    console.log("Parts length: " + parts.length);
    
    if (parts.length < 5) {
      console.log("Format salah, return help");
      return "❌ Format: `/cicilan [nama] [total] [per_bulan] [tgl_jatuh_tempo]`\n" +
            "Contoh: `/cicilan Kredit_Motor 12000000 1000000 15`";
    }
    
    console.log("Format benar, parsing data...");
    
    var nama = parts[1].replace(/_/g, " ");
    var total = parseInt(parts[2].replace(/[^0-9]/g, ""));
    var perBulan = parseInt(parts[3].replace(/[^0-9]/g, ""));
    var tglJatuhTempo = parseInt(parts[4]);
    
    console.log("nama: '" + nama + "'");
    console.log("total: " + total + " (isNaN: " + isNaN(total) + ")");
    console.log("perBulan: " + perBulan + " (isNaN: " + isNaN(perBulan) + ")");
    console.log("tglJatuhTempo: " + tglJatuhTempo + " (isNaN: " + isNaN(tglJatuhTempo) + ")");
    
    if (isNaN(total) || total <= 0) {
      console.log("Validasi total gagal");
      return "❌ Total tidak valid";
    }
    if (isNaN(perBulan) || perBulan <= 0) {
      console.log("Validasi perBulan gagal");
      return "❌ Cicilan per bulan tidak valid";
    }
    if (isNaN(tglJatuhTempo) || tglJatuhTempo < 1 || tglJatuhTempo > 31) {
      console.log("Validasi tgl gagal");
      return "❌ Tanggal jatuh tempo harus 1-31";
    }
    
    console.log("Validasi passed, generate ID...");
    
    var id = "C" + new Date().getTime();
    console.log("ID: " + id);
    
    try {
      console.log("Getting sheet...");
      var sheet = this.db.getSheet("Cicilan");
      console.log("Sheet name: " + sheet.getName());
      console.log("Sheet rows: " + sheet.getLastRow());
      
      console.log("Appending row...");
      sheet.appendRow([
        id,
        chatId,
        nama,
        total,
        perBulan,
        total,
        tglJatuhTempo,
        "aktif",
        new Date()
      ]);
      
      console.log("Append success!");
      
      var result = `✅ *Cicilan Tercatat!*\n\n` +
                  `📋 ${nama}\n` +
                  `💰 Total: Rp${Utils.formatRupiah(total)}\n` +
                  `📅 Cicilan/bulan: Rp${Utils.formatRupiah(perBulan)}\n` +
                  `📆 Jatuh tempo: Tanggal ${tglJatuhTempo} setiap bulan\n` +
                  `📊 Sisa: Rp${Utils.formatRupiah(total)}`;
      
      console.log("Result: " + result);
      console.log("=== CICILAN COMMAND END ===");
      
      return result;
      
    } catch (error) {
      console.log("ERROR: " + error.toString());
      console.log("Stack: " + error.stack);
      return "❌ Gagal menyimpan: " + error.message;
    }
  }

  bayarCicilanCommand(chatId, text) {
    console.log("=== BAYAR CICILAN START ===");
    console.log("ChatID: " + chatId);
    console.log("Text: " + text);
    
    try {
      var parts = text.trim().replace(/\s+/g, " ").split(" ");
      console.log("Parts: " + JSON.stringify(parts));
      
      if (parts.length < 3) {
        return "❌ Format: `/bayarcicilan [nama_cicilan] [nominal]`\n" +
              "Contoh: `/bayarcicilan Kredit_Motor 1000000`";
      }
      
      var namaCari = parts[1].replace(/_/g, " ").toLowerCase();
      var nominal = parseInt(parts[2].replace(/[^0-9]/g, ""));
      
      console.log("Cari: '" + namaCari + "', Nominal: " + nominal);
      
      if (isNaN(nominal) || nominal <= 0) {
        return "❌ Nominal tidak valid";
      }
      
      // Cari cicilan
      console.log("Getting Cicilan sheet...");
      var sheetCicilan = this.db.getSheet("Cicilan");
      var data = sheetCicilan.getDataRange().getValues();
      
      console.log("Total rows: " + data.length);
      
      var found = null;
      var rowIndex = -1;
      
      for (var i = 1; i < data.length; i++) {
        var rowUserId = String(data[i][1]);
        var rowNama = String(data[i][2]).toLowerCase();
        
        console.log("Row " + i + ": UserID=" + rowUserId + ", Nama=" + rowNama);
        
        if (rowUserId === String(chatId) && rowNama.includes(namaCari)) {
          found = {
            id: data[i][0],
            nama: data[i][2],
            sisa: data[i][5],
            perBulan: data[i][4]
          };
          rowIndex = i + 1;
          console.log("Found: " + JSON.stringify(found));
          break;
        }
      }
      
      if (!found) {
        console.log("Cicilan not found");
        return "❌ Cicilan tidak ditemukan. Ketik /cekcicilan untuk lihat daftar.";
      }
      
      if (nominal > found.sisa) {
        return `⚠️ Nominal melebihi sisa hutang!\nSisa: Rp${Utils.formatRupiah(found.sisa)}`;
      }
      
      var sisaBaru = found.sisa - nominal;
      console.log("Sisa baru: " + sisaBaru);
      
      // Update sisa cicilan
      sheetCicilan.getRange(rowIndex, 6).setValue(sisaBaru); // Kolom F = SisaHutang
      
      if (sisaBaru <= 0) {
        sheetCicilan.getRange(rowIndex, 8).setValue("lunas"); // Kolom H = Status
        console.log("Status: LUNAS");
      }
      
      // Catat pembayaran
      var sheetBayar = this.db.getSheet("PembayaranCicilan");
      sheetBayar.appendRow([
        "P" + new Date().getTime(),
        found.id,
        chatId,
        new Date(),
        nominal,
        sisaBaru
      ]);
      
      // Auto-catat ke transaksi pengeluaran
      var namaUser = this.db.getUserName(chatId);
      this.db.saveTransaksi(chatId, namaUser, "Cicilan " + found.nama, nominal, "Pengeluaran");
      
      var status = sisaBaru <= 0 ? "🎉 LUNAS!" : `Sisa: Rp${Utils.formatRupiah(sisaBaru)}`;
      
      console.log("=== BAYAR CICILAN END ===");
      
      return `✅ *Pembayaran Berhasil!*\n\n` +
            `📋 ${found.nama}\n` +
            `💰 Bayar: Rp${Utils.formatRupiah(nominal)}\n` +
            `📊 ${status}`;
            
    } catch (error) {
      console.log("ERROR bayarCicilanCommand: " + error.toString());
      console.log("Stack: " + error.stack);
      return "❌ Error saat bayar cicilan: " + error.message;
    }
  }

  cekCicilanCommand(chatId) {
    console.log("=== CEK CICILAN START ===");
    console.log("ChatID: " + chatId);
    
    try {
      console.log("Getting Cicilan sheet...");
      var sheet = this.db.getSheet("Cicilan");
      console.log("Sheet found: " + sheet.getName());
      
      var data = sheet.getDataRange().getValues();
      console.log("Total rows: " + data.length);
      
      var list = [];
      var totalHutang = 0;
      var totalSisa = 0;
      
      console.log("Looping data...");
      
      for (var i = 1; i < data.length; i++) {
        console.log("Row " + i + ": UserID=" + data[i][1] + ", Status=" + data[i][7]);
        
        if (String(data[i][1]) === String(chatId) && data[i][7] === "aktif") {
          var sisa = data[i][5];
          var total = data[i][3];
          var persen = Math.round(((total - sisa) / total) * 100);
          
          console.log("Found active cicilan: " + data[i][2]);
          
          list.push(
            `📋 *${data[i][2]}*\n` +
            `💰 Total: Rp${Utils.formatRupiah(total)}\n` +
            `📊 Sisa: Rp${Utils.formatRupiah(sisa)} (${persen}% terbayar)\n` +
            `📅 Cicilan: Rp${Utils.formatRupiah(data[i][4])}/bulan\n` +
            `📆 Jatuh tempo: Tgl ${data[i][6]}\n`
          );
          
          totalHutang += total;
          totalSisa += sisa;
        }
      }
      
      console.log("Active cicilan found: " + list.length);
      
      if (list.length === 0) {
        console.log("No active cicilan, return empty message");
        return "📭 Belum ada cicilan aktif.\nKetik /cicilan untuk buat baru.";
      }
      
      var result = `🏦 *DAFTAR CICILAN*\n\n` +
                  list.join("\n") +
                  `\n📊 *Total Hutang:* Rp${Utils.formatRupiah(totalSisa)} ` +
                  `dari Rp${Utils.formatRupiah(totalHutang)}`;
      
      console.log("Result length: " + result.length);
      console.log("=== CEK CICILAN END ===");
      
      return result;
      
    } catch (error) {
      console.log("ERROR cekCicilanCommand: " + error.toString());
      console.log("Stack: " + error.stack);
      return "❌ Error saat cek cicilan: " + error.message;
    }
  }
}