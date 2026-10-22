// ============================================
// UTILITY FUNCTIONS
// ============================================

class Utils {
  static formatRupiah(angka) {
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  static getBulanNama(bulan) {
    return BULAN_NAMES[bulan];
  }
}