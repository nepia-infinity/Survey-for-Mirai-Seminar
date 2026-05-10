/**
 * LINE Flex Messageを送る
 * 
 * 
 */
function pushSurvey() {
  
  // LINEの送信・返信する処理をインスタンス化
  const line = new LineUtils(ACCESS_TOKEN);
  const surveyMessage = buildSurveyMessage();

  // LINEが受け取れる「メッセージオブジェクト」の形式に整える
  const message = {
    "type": "flex",
    "altText": "アンケートへのご協力をお願いします", // 通知欄に表示されるテキスト
    "contents": surveyMessage
  };

  line.push(MY_USER_ID, message);
}



function buildSurveyMessage(){
  return {
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": "https://cdn.pakutaso.com/shared/img/thumb/yuriIMG_9533_TP_V.jpg",
      "size": "full",
      "aspectRatio": "20:13",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "【1分で完了】イマドキの私たちの本音アンケート",
          "weight": "bold",
          "size": "lg",
          "wrap": true
        },
        {
          "type": "box",
          "layout": "baseline",
          "margin": "md",
          "contents": [
            {
              "type": "icon",
              "url": "https://img.icons8.com/material-outlined/24/aaaaaa/clock--v1.png",
              "size": "sm"
            },
            {
              "type": "text",
              "text": "所要時間：約1分",
              "size": "sm",
              "color": "#e67e22",
              "margin": "md",
              "flex": 0,
              "weight": "bold"
            }
          ]
        },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "spacing": "sm",
          "contents": [
            {
              "type": "text",
              "text": "あなたの「いま」について、少しだけ教えてください。いただいた声はこれからの企画の参考にさせていただきます！",
              "wrap": true,
              "color": "#666666",
              "size": "sm"
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "height": "sm",
          "color": "#1DB446",
          "action": {
            "type": "message",
            "label": "回答を始める",
            "text": "回答を始める"
          }
        }
      ],
      "flex": 0
    }
  }
}