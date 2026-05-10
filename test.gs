/**
 * あっちょんぶりけーというメッセージを送る
 * 
 * 
 */
function test_pushSimpleMessage() {
  const url = 'https://api.line.me/v2/bot/message/push';
  const headers = {
    'Content-Type': 'application/json; charset = UTF-8',
    'Authorization': 'Bearer ' + ACCESS_TOKEN
  }
  const message = 'あっちょんぶりけ〜';
  const data = {
    'to': MY_USER_ID,
    'messages': [
      {
        'type': 'text',
        'text': message
      }
    ]
  }

  const options = {
    'method' : 'post',
    'headers': headers,
    'payload': JSON.stringify(data)
  };

  UrlFetchApp.fetch(url, options);
}



function test_pushSurvey() {
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    'to': MY_USER_ID,
    'messages': [{
      'type': 'flex',
      'altText': 'アンケートにご協力ください',
      'contents': test_getSurveyJson()
    }]
  };

  const options = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + ACCESS_TOKEN
    },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  console.log(response.getContentText());
}



function test_getSurveyJson(){
    return {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "質問1：ご年齢は？",
          "weight": "bold",
          "size": "xl",
          "align": "center",
          "margin": "md",
          "color": "#333333"
        },
        {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "10代",
                "data": "questionId=1&value=10s&progress=1",
                "displayText": "10代"
              },
              "style": "secondary", "color": "#FFFFFF", "height": "sm", "margin": "md"
            },
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "20代",
                "data": "questionId=1&value=20s&progress=1",
                "displayText": "20代"
              },
              "style": "secondary", "color": "#FFFFFF", "height": "sm", "margin": "md"
            },
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "30代",
                "data": "questionId=1&value=30s&progress=1",
                "displayText": "30代"
              },
              "style": "secondary", "color": "#FFFFFF", "height": "sm", "margin": "md"
            }
          ],
          "margin": "xxl"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "box", "layout": "vertical", "contents": [], "width": "10px", "height": "10px", "cornerRadius": "10px", "backgroundColor": "#FFDAB9" },
            { "type": "box", "layout": "vertical", "contents": [], "width": "10px", "height": "10px", "cornerRadius": "10px", "backgroundColor": "#cccccc", "margin": "md" },
            { "type": "box", "layout": "vertical", "contents": [], "width": "10px", "height": "10px", "cornerRadius": "10px", "backgroundColor": "#cccccc", "margin": "md" },
            { "type": "box", "layout": "vertical", "contents": [], "width": "10px", "height": "10px", "cornerRadius": "10px", "backgroundColor": "#cccccc", "margin": "md" },
            { "type": "box", "layout": "vertical", "contents": [], "width": "10px", "height": "10px", "cornerRadius": "10px", "backgroundColor": "#cccccc", "margin": "md" }
          ],
          "justifyContent": "center",
          "alignItems": "center",
          "margin": "xxl" 
        }
      ],
      "backgroundColor": "#B0E0E6",
      "paddingAll": "20px"
    }
  }
}



function test_saveTempData(){
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1Mn7JovAyXBn0GvpPXUJ2AYNBgLPcS5V9wWG0Yc-ONHo/edit?gid=0#gid=0';
  const utils = new SpreadsheetUtils(sheetUrl);
  const logs = ['aa', 'bb'];
  utils.appendRow(logs);
}


function test_splitOriginalData(){
  // const dataString = "questionId=1&value=30代&progress=1"; // event.postback.data;
  const dataString = "questionId=2&value=男性&progress=2"; // event.postback.data;
  const params = {};
  dataString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    console.log(`key: ${key}, value: ${value}`);
    params[key] = value;
  });

  console.log(params);
  return params
}


/**
 * アンケート内容を書き込む
 * 
 * 
 */
function test_saveSurveyRecord(){
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1Mn7JovAyXBn0GvpPXUJ2AYNBgLPcS5V9wWG0Yc-ONHo/edit?gid=1539364166#gid=1539364166";

  try {
    // SpreadsheetUtilsクラスのインスタンスを作成
    const utils = new SpreadsheetUtils(sheetUrl);
    const answersObj = test_splitOriginalData();
    const surveyRecord = [answersObj.value];
    const userId = "abvcxsdff"; // event.source.userId

    if(answersObj.questionId === "1"){
      
      const dateString = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");

      // questionIdが1の時のみ、日時とユーザーIDを配列に追加する
      surveyRecord.unshift(dateString, userId);
      console.log(surveyRecord);

      // 新規行を追加する
      utils.appendRow(surveyRecord);

    }else if(1 < Number(answersObj.questionId)){

      // 既存行を更新する
      utils.updateCell(userId, 1, answersObj.questionId, answersObj.value);
    }
  }catch(error){

  }
}