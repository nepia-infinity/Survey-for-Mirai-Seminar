function saveEventsData(e) {
  // 1. 対象のスプレッドシートURLを指定
  const sheetUrl = PropertiesService.getScriptProperties().getProperty('LOG_SHEET_URL');

  try {
    // 2. SpreadsheetUtilsクラスのインスタンスを作成
    const utils = new SpreadsheetUtils(sheetUrl);

    // 3. LINEから届いたイベントオブジェクト(e)からデータを抽出
    const rawData = e.postData.contents;
    const contents = JSON.parse(rawData);
    const event = contents.events[0];
    
    // 記載する内容 
    const logData = [
      Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss"),                   
      event.type,
      event.source.userId,
      event.postback ? event.postback.data : (event.message ? event.message.text : "データなし"),
      rawData
    ];

    // クラスのメソッドを使ってシートの末尾に1行追加
    utils.appendRow(logData);

  } catch (error) {
    console.log("saveEventsDataでエラーが発生しました: " + error.message);
  }
}
