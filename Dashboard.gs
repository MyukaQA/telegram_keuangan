// ============================================
// DASHBOARD WEB APP
// ============================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Dashboards')
    .setTitle('Dashboard Keuangan')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDataForDashboard(bulan, tahun, kategori) {
  var sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName("Transaksi");
  var data = sheet.getDataRange().getValues();
  
  var result = {
    pemasukan: 0,
    pengeluaran: 0,
    transaksi: [],
    kategoriList: new Set(),
    bulanList: new Set()
  };
  
  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][0]);
    var rowBulan = rowDate.getMonth();
    var rowTahun = rowDate.getFullYear();
    var rowKategori = data[i][3];
    var nominal = data[i][4];
    var tipe = data[i][5];
    
    // Kumpulkan unique lists
    result.kategoriList.add(rowKategori);
    result.bulanList.add(rowBulan + "-" + rowTahun);
    
    // Filter
    var matchBulan = (bulan === "all" || bulan === "") ? true : (rowBulan === parseInt(bulan));
    var matchTahun = (tahun === "all" || tahun === "") ? true : (rowTahun === parseInt(tahun));
    var matchKategori = (kategori === "all" || kategori === "") ? true : (rowKategori === kategori);
    
    if (matchBulan && matchTahun && matchKategori) {
      if (tipe === "Pemasukan") {
        result.pemasukan += nominal;
      } else {
        result.pengeluaran += nominal;
      }
      
      result.transaksi.push({
        tanggal: Utilities.formatDate(rowDate, "GMT+7", "dd/MM/yyyy"),
        nama: data[i][2],
        kategori: rowKategori,
        nominal: nominal,
        tipe: tipe
      });
    }
  }
  
  result.sisa = result.pemasukan - result.pengeluaran;
  result.kategoriList = Array.from(result.kategoriList);
  result.bulanList = Array.from(result.bulanList);
  
  return result;
}

function getTrendData() {
  var sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName("Transaksi");
  var data = sheet.getDataRange().getValues();
  
  var trend = {}; // key: "YYYY-MM", value: { pemasukan, pengeluaran }
  
  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][0]);
    var key = rowDate.getFullYear() + "-" + String(rowDate.getMonth() + 1).padStart(2, '0');
    var nominal = data[i][4];
    var tipe = data[i][5];
    
    if (!trend[key]) {
      trend[key] = { pemasukan: 0, pengeluaran: 0 };
    }
    
    if (tipe === "Pemasukan") {
      trend[key].pemasukan += nominal;
    } else {
      trend[key].pengeluaran += nominal;
    }
  }
  
  // Sort by key (bulan)
  var sortedKeys = Object.keys(trend).sort();
  var last6 = sortedKeys.slice(-6); // Ambil 6 bulan terakhir
  
  var labels = [];
  var pemasukanData = [];
  var pengeluaranData = [];
  
  var namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  
  for (var j = 0; j < last6.length; j++) {
    var parts = last6[j].split("-");
    var tahun = parts[0];
    var bulan = parseInt(parts[1]) - 1;
    labels.push(namaBulan[bulan] + " " + tahun);
    pemasukanData.push(trend[last6[j]].pemasukan);
    pengeluaranData.push(trend[last6[j]].pengeluaran);
  }
  
  return { labels, pemasukan: pemasukanData, pengeluaran: pengeluaranData };
}

function getKategoriData(bulan, tahun) {
  var sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName("Transaksi");
  var data = sheet.getDataRange().getValues();
  
  var kategoriStats = {};
  
  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][0]);
    var rowBulan = rowDate.getMonth();
    var rowTahun = rowDate.getFullYear();
    var kat = data[i][3];
    var nominal = data[i][4];
    var tipe = data[i][5];
    
    var matchBulan = (bulan === "all" || bulan === "") ? true : (rowBulan === parseInt(bulan));
    var matchTahun = (tahun === "all" || tahun === "") ? true : (rowTahun === parseInt(tahun));
    
    if (matchBulan && matchTahun && tipe === "Pengeluaran") {
      kategoriStats[kat] = (kategoriStats[kat] || 0) + nominal;
    }
  }
  
  var labels = Object.keys(kategoriStats);
  var values = labels.map(k => kategoriStats[k]);
  
  return { labels, values };
}