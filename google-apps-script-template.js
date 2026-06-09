/**
 * Google Apps Script - 單字資料接收與儲存
 * 
 * 此指令碼配合 Google Sheet 使用，接收前端送來的單字資料並自動存入試算表
 * 
 * 使用步驟：
 * 1. 到 https://script.google.com 新建指令碼專案
 * 2. 複製下面的程式碼到指令碼編輯器
 * 3. 修改 SPREADSHEET_ID 為你的試算表 ID
 * 4. 執行並授予必要的權限
 * 5. 部署為 Web 應用程式，複製部署 URL
 * 6. 在 script.js 中設定 GOOGLE_APPS_SCRIPT_URL
 */

// 請修改此 ID 為你的 Google 試算表 ID
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const SHEET_NAME = "單字資料";

/**
 * 初始化試算表
 * 如果試算表不存在，會自動建立表頭
 */
function initializeSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // 如果試算表是空的，添加表頭
  if (sheet.getLastRow() === 0) {
    const headers = ["時間戳記", "英文單字", "中文翻譯", "詞性", "例句", "字根分析"];
    sheet.appendRow(headers);
  }
  
  return sheet;
}

/**
 * 處理 POST 請求 - 接收前端的單字資料
 * @param {Object} e - 事件物件，包含 POST 資料
 */
function doPost(e) {
  try {
    // 解析前端送來的 JSON 資料
    const postData = JSON.parse(e.postData.contents);
    
    // 初始化試算表
    const sheet = initializeSheet();
    
    // 準備資料行
    const timestamp = new Date().toLocaleString("zh-TW");
    const row = [
      timestamp,
      postData.english || "",
      postData.translation || "",
      postData.partOfSpeech || "",
      postData.example || "",
      postData.root || ""
    ];
    
    // 將資料附加到試算表
    sheet.appendRow(row);
    
    // 返回成功回應
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "資料已儲存" })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // 返回錯誤回應
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 用於測試的函數（選用）
 * 直接在 Google Apps Script 編輯器中執行以測試功能
 */
function testAddWord() {
  const testData = {
    english: "test",
    translation: "測試",
    partOfSpeech: "動詞",
    example: "This is a test.",
    root: "test - 試驗"
  };
  
  const sheet = initializeSheet();
  const timestamp = new Date().toLocaleString("zh-TW");
  const row = [
    timestamp,
    testData.english,
    testData.translation,
    testData.partOfSpeech,
    testData.example,
    testData.root
  ];
  
  sheet.appendRow(row);
  Logger.log("測試資料已添加");
}

/**
 * 查看所有已儲存的單字
 */
function viewAllWords() {
  const sheet = initializeSheet();
  const data = sheet.getDataRange().getValues();
  Logger.log(data);
}
