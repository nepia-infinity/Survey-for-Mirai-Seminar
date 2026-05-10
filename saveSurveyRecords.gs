/**
 * アンケート内容を書き込む
 * 
 * 
 */
function saveSurveyRecords(event){
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1Mn7JovAyXBn0GvpPXUJ2AYNBgLPcS5V9wWG0Yc-ONHo/edit?gid=1539364166#gid=1539364166";

  try {
    // SpreadsheetUtilsクラスのインスタンスを作成
    const utils = new SpreadsheetUtils(sheetUrl);
    const answersObj = splitOriginalData(event);
    const surveyRecords = [answersObj.value];
    const userId = event.source.userId

    if(answersObj.questionId === "1"){
      
      const dateString = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");

      // questionIdが1の時のみ、日時とユーザーIDを配列に追加する
      surveyRecords.unshift(dateString, userId);
      console.log(surveyRecords);

      // 新規行を追加する
      utils.appendRow(surveyRecords);

    }else if(1 < Number(answersObj.questionId)){

      // 2問目以降の場合、アンケート用シートの既存行を更新する
      utils.updateCell(userId, 1, answersObj.questionId, answersObj.value);
    }
  }catch(error){
    
  }
}



function splitOriginalData(event){
  const dataString = event.postback.data;
  const params = {};
  dataString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    console.log(`key: ${key}, value: ${value}`);
    params[key] = value;
  });

  console.log(params);
  return params
}