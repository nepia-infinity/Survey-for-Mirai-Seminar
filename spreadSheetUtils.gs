/**
 * SpreadsheetUtilsクラスは、指定されたURLのGoogleスプレッドシートから
 * シートオブジェクトやデータを取得するためのユーティリティクラスです。
 */
class SpreadsheetUtils {
  /**
   * コンストラクタ
   * @param {string} sheetUrl - 対象スプレッドシートのURL
   * @throws {Error} 指定されたURLからシートを取得できなかった場合にスロー
   */
  constructor(sheetUrl) {
    const sheet = this.getSheetFromUrl(sheetUrl);
    if (!sheet) {
      throw new Error("指定されたURLからシートを取得できませんでした: " + sheetUrl);
    }
    this.sheet = sheet;
    this.values = sheet.getDataRange().getValues();
    this.lastRow = sheet.getLastRow();
    this.headerIndex = this.createHeaderIndex();
  }

  /**
   * 指定されたURLからシートオブジェクトを取得します。
   * @param {string} sheetUrl - 対象スプレッドシートのURL
   * @returns {Sheet|null} 取得したシートオブジェクト。取得に失敗した場合はnullを返す。
   */
  getSheetFromUrl(sheetUrl) {
    try {
      const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/);
      if (!gidMatch) {
        return spreadsheet.getSheets()[0];
      }
      
      const sheetId = Number(gidMatch[1]);
      const sheet = spreadsheet.getSheets().find(sheet => sheetId === sheet.getSheetId());
      
      if (sheet) {
        console.log(`取得したシート名：${sheet.getName()}`);
      }
      return sheet;
      
    } catch (err) { // catch(e)をerrに変更（衝突回避）
      console.log("シートの取得に失敗しました: " + err.message);
      return null;
    }
  }

  /**
   * シートの最終行番号を取得します。
   * @returns {number} シートの最終行番号
   */
  getLastRow() {
    return this.lastRow;
  }

  /**
   * ヘッダー行の全ヘッダーとその列インデックスのマッピングを取得します。
   * @returns {Object} ヘッダー名をキー、列インデックスを値とするオブジェクト
   */
  getHeaderIndex() {
    return this.headerIndex;
  }

  /**
   * 指定した行番号のヘッダー行から、各ヘッダー名とその列インデックスのマッピングを作成します。
   * @param {number} [headerRow=0] - ヘッダー行の行番号（0ベース）。省略時は最初の行を使用。
   * @returns {Object} ヘッダー名をキー、列インデックスを値とするオブジェクト
   */
  createHeaderIndex(headerRow = 0) {
    const header = this.values[headerRow];
    const headerIndex = {};
    header.forEach((headerName, index) => {
      headerIndex[headerName] = index;
    });
    console.log(headerIndex);
    return headerIndex;
  }

  /**
   * 全ヘッダーの中から、指定されたヘッダー名だけのインデックスマッピングを抽出します。
   * @param {...string} selectedHeaders - 抽出するヘッダー名（可変長引数）
   * @returns {Object} 指定されたヘッダー名をキー、そのインデックスを値とするオブジェクト
   */
  selectHeaderIndex(...selectedHeaders) {
    const selectedIndex = {};
    selectedHeaders.forEach(header => {
      if (this.headerIndex.hasOwnProperty(header)) {
        selectedIndex[header] = this.headerIndex[header];
      }
    });
    console.log(selectedIndex);
    return selectedIndex;
  }

  /**
   * 指定したヘッダー名に対応する列のデータを取得します。
   * 複数のヘッダー名を指定すると、各ヘッダーに対応する列データをオブジェクトで返します。
   * @param {...string} headerNames - 取得する列のヘッダー名（可変長引数）
   * @returns {Array|Object|null} ヘッダーが1つの場合は配列、複数の場合は各ヘッダー名をキーとするオブジェクト、引数がなければnull
   */
  extractColumnData(...headerNames) {
    if (headerNames.length === 0) return null;

    const result = {};
    headerNames.forEach(headerName => {
      const columnIndex = this.headerIndex[headerName];
      result[headerName] = (columnIndex === undefined)
        ? null
        : this.values.slice(1).map(row => row[columnIndex]);
    });

    return headerNames.length === 1 ? result[headerNames[0]] : result;
  }

  /**
   * シート全体の値を2次元配列として取得します。
   * @returns {Array} シートの全データ（2次元配列）
   */
  getValues() {
    return this.values;
  }


  /**
   * 指定したキーワードを全て含む行のみを抽出した2次元配列を生成します。
   *
   * @param {...(string|Array.<string>)} params - 検索キーワード。複数指定可能です。
   * @returns {Array.<Array.<string|number>>} - 指定キーワードを全て含む行のみの2次元配列
   */
  getFilteredValues(...params) {

    const filtered = this.values.filter(row => 
      params.every(param => row.join(',').includes(param))
    );

    console.log(`引数に指定されたキーワード：${params.length}個`);
    console.log(params);
    console.log(filtered);
    console.log(`${filtered.length} 項目一致しました`);

    return filtered;
  }


  /**
   * シートの末尾に新しい行を追加します。
   * * @param {Array.<string|number|Date>} dataArray - 追加したいデータの配列。各要素が1セルに対応します。
   * @returns {void}
   * @example
   * utils.appendRow([new Date(), "INFO", "処理を開始しました"]);
   */
  appendRow(dataArray) {
    try {
      this.sheet.appendRow(dataArray);
    } catch (error) {
      console.log("appendRowで失敗: " + error.message);
    }
  }


  /**
   * 指定したキー（例：ユーザーID）に一致する行を探し、指定した列の値を更新します。
   * @param {string|number} searchKey - 検索する値（ユーザーIDなど）
   * @param {number} keyColumnIndex - 検索対象の列インデックス（0ベース）
   * @param {string} questionId - 質問ID
   * @param {any} newValue - 新しく書き込む値
   * @returns {boolean} 更新に成功した場合はtrue、見つからなかった場合はfalse
   */
  updateCell(searchKey, keyColumnIndex, questionId, newValue) {
    try {
      // 配列の末尾から探す
      const rowIndex = this.values.findLastIndex(row => row[keyColumnIndex] === searchKey);
      console.log(`rowIndex: ${rowIndex}`);

      if (rowIndex === -1) {
        console.log("一致するデータが見つかりませんでした: " + searchKey);
        return false;
      }

      // 一致した行の値を取り出す
      const lastRowArray = this.values.slice(rowIndex)[0];
      console.log(lastRowArray);

      // '' が含まれているので消す
      const filtered = lastRowArray.filter(value => value);

      // questionIdが1の時のみ例外的な処理をするため、1を引く
      const targetColumn = filtered.length + Number(questionId) -1;
      console.log(`targetColumn: ${targetColumn}`);

      const targetRow = rowIndex + 1;
      const targetRange = this.sheet.getRange(targetRow, targetColumn);
      targetRange.setValue(newValue);
      
      console.log(`targetRange: ${targetRange.getA1Notaion()}`);
      console.log(`${newValue}を転記しました`);

    }catch(error){

    }
  }
}
