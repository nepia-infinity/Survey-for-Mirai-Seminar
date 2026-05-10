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
  }else if(event.type === 'message' && event.message.text === '回答を始める'){

    // 最初の質問を取得
    const firstMessage = getNextQuestionMessage();
    if (firstMessage) {
      // クラスの reply メソッドを使用
      line.reply(replyToken, firstMessage);

    }
  }else if(event.type === 'message' && event.message.text === '今後のスケジュール感'){

    // 関数からタイムラインを取得
    const message = createScheduleFlexMessage();
    line.reply(replyToken, message);
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
        questionTitle: "質問3：日本のどこが好き？",
        questionId: 3,
        progress: 3,
        choices: [
          { label: "ごはんが美味しい", value: "食" },
          { label: "治安が良くて綺麗", value: "安心" },
          { label: "アニメ・文化", value: "文化" },
          { label: "生活が便利", value: "便利" }
        ]
      };
    case 4:
      return {
        questionTitle: "質問4：関心があることは？",
        questionId: 4,
        progress: 4,
        choices: [
          { label: "仕事・キャリア", value: "キャリア" },
          { label: "趣味・遊び", value: "趣味" },
          { label: "将来のお金のこと", value: "お金" },
          { label: "人間関係・恋愛", value: "人間関係" }
        ]
      };
    case 5:
      return {
        questionTitle: "質問5：詳細を伺えますか？",
        questionId: 5,
        progress: 5,
        choices: [
          { label: "ぜひ！協力します", value: "Yes" },
          { label: "オンラインならOK", value: "OnlineOnly" },
          { label: "今回は難しいです", value: "No" }
        ]
      };
    default:
      return null;
  }
}



/**
 * 次の質問メッセージを生成する
 * postbackData が無い場合は最初の質問を返す
 */
function getNextQuestionMessage(postbackData) {
  let nextId;

  // 1. postbackData が存在するかチェック
  if (!postbackData) {
    // 存在しない（undefinedや空文字）場合は最初の質問IDを設定
    nextId = 1;
  } else {
    // 2. data文字列を解析
    const params = postbackData.split('&').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      acc[key] = value;
      return acc;
    }, {});

    // 3. 次のIDを計算
    nextId = params.questionId ? Number(params.questionId) + 1 : 1;
  }
  
  // 4. 設定を取得
  const config = getSurveyConfig(nextId);

  // 5. 設定があればFlex Message化、なければnull（アンケート終了）
  if (config) {
    return {
      "type": "flex",
      "altText": nextId === 1 ? "アンケートを開始します" : `アンケート回答中 (${nextId})`,
      "contents": getSurveyJson(config)
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



/**
 * ご提示いただいた最新のJSON構造をそのまま返す関数
 */
function createScheduleFlexMessage() {
  const flexContents = {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "text", "text": "#Team 6", "color": "#ffffff66", "size": "sm" },
            { "type": "text", "text": "ここにチーム名", "color": "#ffffff", "size": "xl", "flex": 4, "weight": "bold" }
          ]
        },
        {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "text", "text": "Schedule", "color": "#ffffff66", "size": "sm" },
            { "type": "text", "text": "今後の予定について", "color": "#ffffff", "size": "xl", "flex": 4, "weight": "bold" }
          ]
        }
      ],
      "paddingAll": "20px",
      "backgroundColor": "#0367D3",
      "spacing": "md",
      "height": "154px",
      "paddingTop": "22px"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        { "type": "text", "text": "Total: 7 Months", "color": "#b7b7b7", "size": "xs" },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": "DRAFT", "size": "sm", "gravity": "center", "flex": 2 },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                { "type": "filler" },
                { "type": "box", "layout": "vertical", "contents": [], "cornerRadius": "30px", "height": "12px", "width": "12px", "borderColor": "#EF454D", "borderWidth": "2px" },
                { "type": "filler" }
              ],
              "flex": 1
            },
            { "type": "text", "text": "3月〜4月：応募期間", "gravity": "center", "flex": 7, "size": "sm", "weight": "bold" }
          ],
          "spacing": "md",
          "margin": "xl"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "filler", "flex": 2 },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "filler" },
                    { "type": "box", "layout": "vertical", "contents": [], "width": "2px", "backgroundColor": "#B7B7B7" },
                    { "type": "filler" }
                  ],
                  "flex": 1
                }
              ],
              "flex": 1
            },
            { "type": "text", "text": "・勉強会イベント", "gravity": "center", "flex": 7, "size": "xs", "color": "#8c8c8c" }
          ],
          "height": "40px"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": "BUILD", "size": "sm", "gravity": "center", "flex": 2 },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                { "type": "filler" },
                { "type": "box", "layout": "vertical", "contents": [], "cornerRadius": "30px", "width": "12px", "height": "12px", "borderWidth": "2px", "borderColor": "#6486E3" },
                { "type": "filler" }
              ],
              "flex": 1
            },
            { "type": "text", "text": "5月〜7月：構想・具体化", "gravity": "center", "flex": 7, "size": "sm", "weight": "bold" }
          ],
          "spacing": "md"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "filler", "flex": 2 },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "filler" },
                    { "type": "box", "layout": "vertical", "contents": [], "width": "2px", "backgroundColor": "#6486E3" },
                    { "type": "filler" }
                  ],
                  "flex": 1
                }
              ],
              "flex": 1
            },
            { "type": "text", "text": "・キックオフセミナー", "gravity": "center", "flex": 7, "size": "xs", "color": "#8c8c8c" }
          ],
          "height": "30px"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "filler", "flex": 2 },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "filler" },
                    { "type": "box", "layout": "vertical", "contents": [], "width": "2px", "backgroundColor": "#6486E3" },
                    { "type": "filler" }
                  ],
                  "flex": 1
                }
              ],
              "flex": 1
            },
            { "type": "text", "text": "・定期メンタリング①〜③", "gravity": "center", "flex": 7, "size": "xs", "color": "#8c8c8c" }
          ],
          "height": "30px"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "filler", "flex": 2 },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "filler" },
                    { "type": "box", "layout": "vertical", "contents": [], "width": "2px", "backgroundColor": "#6486E3" },
                    { "type": "filler" }
                  ],
                  "flex": 1
                }
              ],
              "flex": 1
            },
            { "type": "text", "text": "・最終発表会", "gravity": "center", "flex": 7, "size": "xs", "color": "#8c8c8c" }
          ],
          "height": "30px"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": "GOAL", "gravity": "center", "size": "sm", "flex": 2 },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                { "type": "filler" },
                { "type": "box", "layout": "vertical", "contents": [], "cornerRadius": "30px", "width": "12px", "height": "12px", "borderColor": "#8E44AD", "borderWidth": "2px" },
                { "type": "filler" }
              ],
              "flex": 1
            },
            { "type": "text", "text": "8月〜9月：ビジコン応募", "gravity": "center", "flex": 7, "size": "sm", "weight": "bold" }
          ],
          "spacing": "md"
        }
      ]
    }
  };

  // メッセージ形式でラップして返す
  return {
    "type": "flex",
    "altText": "スケジュール共有",
    "contents": flexContents
  };
}