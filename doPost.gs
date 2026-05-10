const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
const MY_USER_ID = PropertiesService.getScriptProperties().getProperty('MY_USER_ID');


function doPost(e) {

  // LINEの送信・返信する処理をインスタンス化
  const line = new LineUtils(ACCESS_TOKEN);

  // LINEからのイベントを解析
  const contents = JSON.parse(e.postData.contents);
  const event = contents.events[0];
  const replyToken = event.replyToken;

  // テキストではない場合、アンケートの回答の場合
  if (event.type === 'postback') {
    saveSurveyRecords(event);

    // 次の質問を取得
    const nextMessage = getNextQuestionMessage(event.postback.data);
    
    if (nextMessage) {

      // クラスの reply メソッドを使用
      line.reply(replyToken, nextMessage);

    }else {

      // 全質問終了時もクラスの reply メソッドを使用
      line.reply(replyToken, { 
        "type": "text", 
        "text": "アンケートへのご協力ありがとうございました！" 
      });
    }
  }else if(event.type === 'message'){

    line.reply(replyToken, { 
        "type": "text", 
        "text": "GASに届いたよ！！" 
      });
  }

  // シートにeventを記載
  saveEventsData(e);
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}


/**
 * 質問IDに応じた設定オブジェクトを返す
 * @param {number} id - 質問ID
 * @returns {Object|null} 原型の形式と一致するオブジェクト
 */
function getSurveyConfig(id) {
  switch (id) {
    case 1:
      return {
        questionTitle: "質問1：ご年齢は？",
        questionId: 1,
        progress: 1,
        choices: [
          { label: "10代", value: "10代" },
          { label: "20代", value: "20代" },
          { label: "30代", value: "30代" }
        ]
      };
    case 2:
      return {
        questionTitle: "質問2：性別について",
        questionId: 2,
        progress: 2,
        choices: [
          { label: "男性", value: "男性" },
          { label: "女性", value: "女性" },
          { label: "答えたくない", value: "答えたくない" }
        ]
      };
    case 3:
      return {
        questionTitle: "質問3：日本の好きなところは？",
        questionId: 3,
        progress: 3,
        choices: [
          { label: "ごはんが美味しい", value: "ごはんが美味しい" },
          { label: "時間に正確なところ", value: "時間が正確なところ" },
          { label: "街が比較的清潔なところ", value: "街が比較的清潔なところ" },
          { label: "犯罪が少ないところ", value: "犯罪が少ないところ" }
        ]
      };
    default:
      return null;
  }
}


/**
 * 次の質問メッセージを生成する
 */
function getNextQuestionMessage(postbackData) {
  // 1. data文字列を解析
  const params = postbackData.split('&').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    acc[key] = value;
    return acc;
  }, {});

  // 2. 次のIDを取得
  const nextId = Number(params.questionId) + 1;
  
  // 3. 設定を取得（ここで返ってくるのは q1Config と同じ構造）
  const config = getSurveyConfig(nextId);

  // 4. 設定があればFlex Message化、なければnull
  if (config) {
    return {
      "type": "flex",
      "altText": `アンケート回答中 (${nextId})`,
      "contents": getSurveyJson(config) // そのまま渡す
    };
  }

  return null;
}


/**
 * アンケート用Flex Messageを生成する
 * @param {Object} config - 質問の設定オブジェクト
 */
function getSurveyJson(config) {
  const totalSteps = 5; // 全体のステップ数
  const activeColor = "#FFDAB9"; // 現在のステップの色
  const inactiveColor = "#cccccc"; // 未完了の色

  // 1. ボタン配列の生成
  const buttons = config.choices.map(choice => {
    return {
      "type": "button",
      "action": {
        "type": "postback",
        "label": choice.label,
        "data": `questionId=${config.questionId}&value=${choice.value}&progress=${config.progress}`,
        "displayText": choice.label
      },
      "style": "secondary",
      "color": "#FFFFFF",
      "height": "sm",
      "margin": "md"
    };
  });

  // 2. 進捗ドット配列の生成
  const dots = [];
  for (let i = 1; i <= totalSteps; i++) {
    dots.push({
      "type": "box",
      "layout": "vertical",
      "contents": [],
      "width": "10px",
      "height": "10px",
      "cornerRadius": "10px",
      // 現在の進捗(progress)と一致する場合だけ色を変える
      "backgroundColor": i === Number(config.progress) ? activeColor : inactiveColor,
      "margin": i === 1 ? "none" : "md"
    });
  }

  // 3. Flex Message 本体の組み立て
  return {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": config.questionTitle,
          "weight": "bold",
          "size": "xl",
          "align": "center",
          "margin": "md",
          "color": "#333333"
        },
        {
          "type": "box",
          "layout": "vertical",
          "contents": buttons, // 生成したボタン配列を入れる
          "margin": "xxl"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": dots, // 生成したドット配列を入れる
          "justifyContent": "center",
          "alignItems": "center",
          "margin": "xxl"
        }
      ],
      "backgroundColor": "#B0E0E6",
      "paddingAll": "20px"
    }
  };
}