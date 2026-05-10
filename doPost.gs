const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');

function doPost(e) {
  // LINEからのイベントを解析
  const contents = JSON.parse(e.postData.contents);
  const event = contents.events[0];

  // テキストではない場合、アンケートの回答の場合
  if (event.type === 'postback') {
    saveSurveyRecords(event);
  }

  // 受け取り内容に応じて条件分岐させる switch的なヤツ
  const replyToken = event.replyToken;
  const payload = {
    'replyToken': replyToken,
    'messages': [{
      'type': 'text',
      'text': 'GASに届いたよ！トークンの有無: ' + (ACCESS_TOKEN ? "あり" : "なし")
    }]
  };

  const options = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'payload': JSON.stringify(payload)
  };

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', options);

  // シートにeventを記載
  saveEventsData(e);

  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}
