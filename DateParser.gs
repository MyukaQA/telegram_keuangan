// ============================================
// PARSER TANGGAL NATURAL
// ============================================

class DateParser {
  static parse(text) {
    var sekarang = new Date();
    var tanggalHasil = new Date(sekarang);
    var cleanText = text;
    
    // Pattern: "kemarin"
    if (text.match(/kemarin/i)) {
      tanggalHasil.setDate(sekarang.getDate() - 1);
      cleanText = text.replace(/kemarin/gi, "").trim();
      return { tanggal: tanggalHasil, cleanText: cleanText };
    }
    
    // Pattern: "X hari lalu"
    var hariLaluMatch = text.match(/(\d+)\s*hari\s*lalu/i);
    if (hariLaluMatch) {
      var hari = parseInt(hariLaluMatch[1]);
      tanggalHasil.setDate(sekarang.getDate() - hari);
      cleanText = text.replace(hariLaluMatch[0], "").trim();
      return { tanggal: tanggalHasil, cleanText: cleanText };
    }
    
    // Pattern: "tgl 15" atau "tanggal 15"
    var tglMatch = text.match(/tang?gal\s*(\d{1,2})/i);
    if (tglMatch) {
      var tgl = parseInt(tglMatch[1]);
      tanggalHasil.setDate(tgl);
      if (tanggalHasil > sekarang) {
        tanggalHasil.setMonth(tanggalHasil.getMonth() - 1);
      }
      cleanText = text.replace(tglMatch[0], "").trim();
      return { tanggal: tanggalHasil, cleanText: cleanText };
    }
    
    // Pattern: DD/MM/YYYY
    var fullDateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (fullDateMatch) {
      var d = parseInt(fullDateMatch[1]);
      var m = parseInt(fullDateMatch[2]) - 1;
      var y = parseInt(fullDateMatch[3]);
      if (y < 100) y += 2000;
      
      cleanText = text.replace(fullDateMatch[0], "").trim();
      return { 
        tanggal: new Date(y, m, d), 
        cleanText: cleanText 
      };
    }
    
    // Default: hari ini
    return { tanggal: sekarang, cleanText: text };
  }
}