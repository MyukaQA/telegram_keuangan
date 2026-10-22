// ============================================
// SYNC HANDLER - DENGAN LOGGING DETAIL
// ============================================

class SyncHandler {
  constructor(db) {
    this.db = db;
    this.laravelUrl = CONFIG.LARAVEL_URL || "https://your-domain.ngrok-free.app/api/sync";
  }
  
  syncPending() {
    var pending = this.db.getPendingTransaksi();
    
    console.log("=== SYNC START ===");
    console.log("Pending transaksi: " + pending.length);
    
    if (pending.length === 0) {
      console.log("Tidak ada data pending");
      return { 
        status: "success", 
        total: 0, 
        success: 0, 
        failed: 0,
        message: "Tidak ada transaksi pending" 
      };
    }
    
    var successCount = 0;
    var failedCount = 0;
    var errorDetails = [];
    
    for (var i = 0; i < pending.length; i++) {
      var trans = pending[i];
      
      console.log("--- Processing row " + trans.rowIndex + " ---");
      console.log("Data: " + JSON.stringify({
        userId: trans.userId,
        kategori: trans.kategori,
        nominal: trans.nominal,
        tipe: trans.tipe
      }));
      
      try {
        var result = this.kirimKeLaravel(trans);
        
        console.log("Response code: " + result.code);
        console.log("Response body: " + result.body);
        
        if (result.success) {
          this.db.markAsSynced(trans.rowIndex);
          successCount++;
          console.log("✅ Berhasil sync");
        } else {
          this.db.markAsFailed(trans.rowIndex);
          failedCount++;
          errorDetails.push("Row " + trans.rowIndex + ": " + result.error);
          console.log("❌ Gagal sync: " + result.error);
        }
        
      } catch (error) {
        console.log("❌ ERROR Exception: " + error.toString());
        this.db.markAsFailed(trans.rowIndex);
        failedCount++;
        errorDetails.push("Row " + trans.rowIndex + ": " + error.message);
      }
    }
    
    console.log("=== SYNC END ===");
    console.log("Total: " + pending.length);
    console.log("Success: " + successCount);
    console.log("Failed: " + failedCount);
    
    return {
      status: failedCount > 0 ? "partial" : "success",
      total: pending.length,
      success: successCount,
      failed: failedCount,
      errors: errorDetails,
      message: failedCount > 0 ? "Sebagian gagal: " + errorDetails.join("\n") : "Semua berhasil"
    };
  }
  
  // Atau format manual
  formatForLaravel(date) {
    // Format: YYYY-MM-DD HH:mm:ss dalam UTC
    return Utilities.formatDate(date, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  }

  kirimKeLaravel(transaksi) {
    var payload = {
      transaction_id: transaksi.transactionId || transaksi.timestamp + "_" + transaksi.userId,
      timestamp: this.formatForLaravel(transaksi.timestamp),
      user_id: transaksi.userId.toString(),
      nama: transaksi.nama,
      kategori: transaksi.kategori,
      nominal: transaksi.nominal,
      tipe: transaksi.tipe,
      source: "telegram_bot"
    };
    
    console.log("URL: " + this.laravelUrl);
    console.log("Payload: " + JSON.stringify(payload));
    
    try {
      var response = UrlFetchApp.fetch(this.laravelUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      var code = response.getResponseCode();
      var body = response.getContentText();
      
      console.log("HTTP Code: " + code);
      console.log("Response Body: " + body);
      
      // Parse response
      var parsedBody;
      try {
        parsedBody = JSON.parse(body);
      } catch(e) {
        parsedBody = { raw: body };
      }
      
      return {
        success: code === 200 || code === 201 || code === 409,
        code: code,
        body: parsedBody,
        error: (code !== 200 && code !== 201 && code !== 409) ? body : null
      };
      
    } catch (error) {
      console.log("FETCH ERROR: " + error.toString());
      return {
        success: false,
        code: 0,
        error: "Network: " + error.message
      };
    }
  }
  
  checkConnection() {
    try {
      var healthUrl = this.laravelUrl.replace("/sync", "/health");
      console.log("Checking: " + healthUrl);
      
      var response = UrlFetchApp.fetch(healthUrl, {
        method: "get",
        muteHttpExceptions: true
      });
      
      var code = response.getResponseCode();
      console.log("Health check code: " + code);
      
      return code === 200;
      
    } catch (e) {
      console.log("Health check error: " + e.toString());
      return false;
    }
  }
}