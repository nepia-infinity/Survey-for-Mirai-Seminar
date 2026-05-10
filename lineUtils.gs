class LineUtils {
  /**
   * @param {string} accessToken - LINE Messaging APIのチャネルアクセストークン
   */
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.apiUrl = 'https://api.line.me/v2/bot/message';
  }

  /**
   * 共通のfetchオプションを生成する内部メソッド
   * @param {Object} payload - 送信データ
   */
  _getOptions(payload) {
    return {
      'method': 'post',
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': `Bearer ${this.accessToken}`
      },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
  }

  /**
   * 応答メッセージを送る (Reply)
   * @param {string} replyToken - イベントに付随するリプライトークン
   * @param {Array|Object} messages - 送信するメッセージオブジェクト
   */
  reply(replyToken, messages) {
    const url = `${this.apiUrl}/reply`;
    const payload = {
      'replyToken': replyToken,
      'messages': Array.isArray(messages) ? messages : [messages]
    };
    
    const response = UrlFetchApp.fetch(url, this._getOptions(payload));
    return response.getContentText();
  }

  /**
   * プッシュメッセージを送る (Push)
   * @param {string} to - 送信先のユーザーID
   * @param {Array|Object} messages - 送信するメッセージオブジェクト
   */
  push(to, messages) {
    const url = `${this.apiUrl}/push`;
    const payload = {
      'to': to,
      'messages': Array.isArray(messages) ? messages : [messages]
    };

    const response = UrlFetchApp.fetch(url, this._getOptions(payload));
    return response.getContentText();
  }
}
