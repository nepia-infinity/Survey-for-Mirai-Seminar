/**
 * LINE Flex Messageを送る
 * 
 * 
 */
function test_pushSurvey2() {
  // 質問1の場合
  const q1Config = {
    questionTitle: "質問1：ご年齢は？",
    questionId: 1,
    progress: 1,
    choices: [
      { label: "10代", value: "10代" },
      { label: "20代", value: "20代" },
      { label: "30代", value: "30代" }
    ]
  };

  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    'to': MY_USER_ID,
    'messages': [{
      'type': 'flex',
      'altText': 'アンケートにご協力ください',
      'contents': test_getSurveyJson2(q1Config)
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



/**
 * アンケート用Flex Messageを生成する
 * @param {Object} config - 質問の設定オブジェクト
 */
function test_getSurveyJson2(config) {
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
        // dataに questionId, value, progress を埋め込む
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


