// ============================================
// MAIN ENTRY POINT
// ============================================

function doPost(e) {
  try {
    // Inisialisasi
    var db = new Database();
    var api = new TelegramAPI();
    var budgetCalc = new BudgetCalculator(db);
    var callbackHandler = new CallbackHandler(db, api);
    var cmdHandler = new CommandHandler(db, api, budgetCalc, callbackHandler);
    var transHandler = new TransactionHandler(db, api, budgetCalc);
    
    // Parse request
    var data = JSON.parse(e.postData.contents);
    
    // Handle callback (tombol inline)
    if (data.callback_query) {
      callbackHandler.handle(data.callback_query);
      return;
    }
    
    // Handle message
    var msg = data.message;
    var chatId = msg.chat.id;
    var text = msg.text || "";
    var username = msg.from.username || msg.from.first_name || msg.from.last_name || "User";
    
    // Simpan user
    db.saveUser(chatId, username);
    
    console.log("ChatID: " + chatId + ", Command: " + text.split(" ")[0]);
    
    // Coba handle sebagai command
    var response = cmdHandler.handle(chatId, username, text);

    // Kalau return "SENT", gak usah kirim lagi (udah dikirim di method)
    if (response === "SENT") {
      return;
    }
    
    // Kalau bukan command, coba sebagai transaksi
    if (response === null) {
      response = transHandler.handle(chatId, text);
    }
    
    // Kirim respons
    api.sendMessage(chatId, response);
    
  } catch (error) {
    console.log("ERROR: " + error.toString());
    console.log("Stack: " + error.stack);
  }
}

// ============================================
// WEBHOOK SETUP
// ============================================

function setWebhook() {
  var api = new TelegramAPI();
  var url = CONFIG.WEBHOOK_URL || ScriptApp.getService().getUrl();
  if (!url) {
    throw new Error("WEBHOOK_URL belum diatur di Script Properties atau Web App belum dideploy.");
  }
  console.log(api.setWebhook(url));
}

// ============================================
// TEST FUNCTIONS
// ============================================

function testCommand() {
  var db = new Database();
  var api = new TelegramAPI();
  var budgetCalc = new BudgetCalculator(db);
  var handler = new CommandHandler(db, api, budgetCalc);
  
  var result = handler.atur("123456789", "/atur");
  console.log(result);
}

function testCicilan() {
  var text = "/cicilan Bayar_HP 7000000 500000 15";
  var parts = text.split(" ");
  
  console.log("Parts: " + JSON.stringify(parts));
  console.log("Length: " + parts.length);
  console.log("Check < 5: " + (parts.length < 5));
}