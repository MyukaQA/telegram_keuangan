// ============================================
// TELEGRAM API WRAPPER
// ============================================

class TelegramAPI {
  constructor() {
    this.baseUrl = CONFIG.TELEGRAM_API + CONFIG.BOT_TOKEN;
  }
  
  sendMessage(chatId, text, options = {}) {
    var url = this.baseUrl + "/sendMessage";
    var payload = {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
      ...options
    };
    
    return UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }
  
  sendPhoto(chatId, photoUrl, caption = "") {
    var url = this.baseUrl + "/sendPhoto";
    var payload = {
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
      parse_mode: "Markdown"
    };
    
    return UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }
  
  editMessageText(chatId, messageId, text, options = {}) {
    var url = this.baseUrl + "/editMessageText";
    var payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: "Markdown",
      ...options
    };
    
    return UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }
  
  answerCallbackQuery(callbackId) {
    var url = this.baseUrl + "/answerCallbackQuery";
    return UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        callback_query_id: callbackId
      })
    });
  }
  
  setWebhook(webhookUrl) {
    // Hapus dulu
    UrlFetchApp.fetch(this.baseUrl + "/deleteWebhook");
    
    // Set baru
    var response = UrlFetchApp.fetch(
      this.baseUrl + "/setWebhook?url=" + encodeURIComponent(webhookUrl)
    );
    
    return response.getContentText();
  }
}