# 背單字 App - 後端整合指南

本指南詳細說明如何將前端表單資料整合到 Google Apps Script，並自動儲存至 Google 試算表。

## 📋 目錄
1. [系統架構](#系統架構)
2. [前端修改說明](#前端修改說明)
3. [建立 Google 試算表](#建立-google-試算表)
4. [設置 Google Apps Script](#設置-google-apps-script)
5. [前端配置 API URL](#前端配置-api-url)
6. [測試與驗證](#測試與驗證)
7. [常見問題](#常見問題)

---

## 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                        前端應用 (HTML/CSS/JS)                 │
│                   ┌──────────────────────────┐               │
│                   │  表單：新增英文單字資料   │               │
│                   │  • 英文單字              │               │
│                   │  • 中文翻譯              │               │
│                   │  • 詞性                  │               │
│                   │  • 例句                  │               │
│                   │  • 字根分析              │               │
│                   └────────────┬─────────────┘               │
└──────────────────────────────────┼──────────────────────────┘
                                   │ (POST 請求)
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│               Google Apps Script (Web 應用)                    │
│  ┌─────────────────────────────────────────────────┐        │
│  │ doPost(e) 函數接收 JSON 資料                    │        │
│  │ 驗證、整理、轉發                                │        │
│  └────────────────────────┬────────────────────────┘        │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Google 試算表（資料儲存庫）                      │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 表名：單字資料                                   │        │
│  │ 欄位：時間戳記 | 英文單字 | 翻譯 | 詞性 | 例句 | 分析│        │
│  │ 資料 1: test | 測試 | 動詞 | This is... | test - 試驗│
│  │ 資料 2: ...                                     │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 前端修改說明

### 已修改的內容

檔案：`script.js`

#### 1. 添加 API URL 常數
```javascript
const GOOGLE_APPS_SCRIPT_URL = ""; // 待填入 Google Apps Script 部署 URL
```

#### 2. 新增 `sendToBackend()` 函數
此函數負責將表單資料發送到 Google Apps Script：
```javascript
async function sendToBackend(entry) {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("Google Apps Script URL 尚未設定，僅儲存到本地");
    return true;
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    });
    console.log("資料已發送到後端");
    return true;
  } catch (error) {
    console.error("發送到後端失敗:", error);
    alert("發送到後端失敗，但資料已儲存在本地");
    return false;
  }
}
```

#### 3. 修改表單提交事件
提交表單時，會自動調用 `sendToBackend()` 函數：
```javascript
wordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  // ... 建立 newEntry 物件 ...
  addWord(newEntry);
  sendToBackend(newEntry);  // ← 新增這行
  wordForm.reset();
  alert("已新增單字！");
});
```

---

## 建立 Google 試算表

### 步驟 1：開啟 Google 試算表
1. 造訪 https://sheets.google.com
2. 點擊「建立」按鈕，選擇「試算表」
3. 命名為「背單字資料庫」（或任意名稱）

### 步驟 2：建立工作表
1. 預設會有一個名為「Sheet1」的工作表
2. 右鍵點擊工作表標籤，選擇「重新命名」
3. 更名為 `單字資料`

### 步驟 3：添加表頭（可選，Google Apps Script 會自動建立）
在 A1 到 F1 儲存格添加以下表頭：

| 時間戳記 | 英文單字 | 中文翻譯 | 詞性 | 例句 | 字根分析 |
|---------|---------|---------|------|------|---------|

### 步驟 4：取得試算表 ID
在瀏覽器網址列中，試算表 URL 的格式為：
```
https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid=0
```

複製 `{SPREADSHEET_ID}` 部分，稍後會用到。

**範例：**
```
https://docs.google.com/spreadsheets/d/1x-abc123XYZ789/edit#gid=0
                                    ↑ 這就是你的 SPREADSHEET_ID
```

---

## 設置 Google Apps Script

### 步驟 1：開啟 Google Apps Script 編輯器
1. 造訪 https://script.google.com
2. 點擊「新建」專案

### 步驟 2：複製程式碼
1. 複製檔案 `google-apps-script-template.js` 中的所有程式碼
2. 貼入 Google Apps Script 編輯器（會自動開啟 `Code.gs` 檔案）
3. 全選現有程式碼並刪除，貼入新的程式碼

### 步驟 3：修改試算表 ID
在程式碼頂部找到：
```javascript
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
```

將 `YOUR_SPREADSHEET_ID_HERE` 替換為你的試算表 ID：
```javascript
const SPREADSHEET_ID = "1x-abc123XYZ789";  // ← 填入你的 ID
```

### 步驟 4：測試程式碼（可選）
1. 在函數下拉選單中選擇 `testAddWord`
2. 點擊執行按鈕（三角形圖示）
3. 首次執行會要求授予權限，點擊「檢閱權限」並同意

### 步驟 5：部署為 Web 應用程式
1. 點擊「部署」按鈕（頂部）
2. 選擇「新增部署」，右上角出現下拉選單
3. 選擇「Web 應用程式」
4. 設置以下選項：
   - **執行者**：選擇你的 Google 帳號
   - **執行對象**：選擇「任何人」（允許來自前端的請求）
5. 點擊「部署」

### 步驟 6：複製部署 URL
部署完成後，會顯示「部署 ID」和「網頁應用程式 URL」。

複製網頁應用程式 URL，格式如下：
```
https://script.googleapis.com/macros/s/{SCRIPT_ID}/usercontent
```

**範例：**
```
https://script.googleapis.com/macros/s/AKfycbwAbc123XYZ789_TuVw/usercontent
```

---

## 前端配置 API URL

### 步驟 1：開啟 `script.js`
找到以下行（第 27 行左右）：
```javascript
const GOOGLE_APPS_SCRIPT_URL = "";
```

### 步驟 2：貼入 Google Apps Script 的 URL
將空白處填入你複製的 URL：
```javascript
const GOOGLE_APPS_SCRIPT_URL = "https://script.googleapis.com/macros/s/AKfycbwAbc123XYZ789_TuVw/usercontent";
```

### 步驟 3：保存檔案
儲存 `script.js`。

---

## 測試與驗證

### 方法 1：本地測試

#### 1. 啟動本地伺服器
在專案根目錄執行：
```bash
python3 -m http.server 8000
```

#### 2. 打開應用
造訪 http://localhost:8000

#### 3. 新增單字
1. 進入「管理頁面」
2. 填入以下資料：
   - 英文單字：`example`
   - 中文翻譯：`例子`
   - 詞性：`名詞`
   - 例句：`This is an example.`
   - 字根分析：`example 意為示範`
3. 點擊「新增單字」

#### 4. 查看控制台
1. 按 F12 開啟開發者工具
2. 切換到「Console」標籤
3. 應該會看到訊息：`資料已發送到後端`

#### 5. 驗證 Google 試算表
1. 回到你的 Google 試算表
2. 重新整理頁面（F5）
3. 應該會看到新的一行資料：

| 時間戳記 | 英文單字 | 中文翻譯 | 詞性 | 例句 | 字根分析 |
|---------|---------|---------|------|------|---------|
| 2026/6/9 下午 2:30 | example | 例子 | 名詞 | This is an example. | example 意為示範 |

### 方法 2：Google Apps Script 日誌

#### 1. 檢視 Google Apps Script 執行日誌
1. 回到 Google Apps Script 編輯器
2. 點擊「執行日誌」
3. 查看是否有任何錯誤訊息

#### 2. 手動測試
1. 在函數下拉選單選擇 `testAddWord`
2. 點擊執行按鈕
3. 檢視 Google 試算表是否新增了一行測試資料

---

## 常見問題

### Q1: 我看不到「Google Apps Script URL」的錯誤訊息，但資料沒有發送到試算表

**A:** 可能的原因：
1. **SPREADSHEET_ID 不正確** - 確認你複製的 ID 是否完整
2. **沒有正確授予權限** - 在 Google Apps Script 編輯器中，確認帳號已授予訪問試算表的權限
3. **Google Apps Script 未成功部署** - 檢查部署狀態，重新部署一次

### Q2: 部署後，修改了 Google Apps Script 代碼，但新的邏輯沒有生效

**A:** 每次修改代碼後都需要重新部署：
1. 點擊「部署」
2. 選擇現有部署，編輯設定
3. 點擊「重新部署」

### Q3: 收到 CORS 錯誤

**A:** 這是正常的行為，因為我們使用了 `mode: "no-cors"`。資料仍然會被發送，只是瀏覽器不會顯示回應。

### Q4: 資料儲存到本地但沒有發送到後端

**A:** 檢查以下項目：
1. 確認 `GOOGLE_APPS_SCRIPT_URL` 已填入正確的 URL
2. 開啟瀏覽器開發者工具 (F12)，在 Network 標籤查看是否有 POST 請求
3. 檢查 Google Apps Script 的執行日誌是否有錯誤

### Q5: 想要添加更多欄位（如難度、標籤等）

**A:** 按照以下步驟修改：

1. **修改 HTML 表單** (`index.html`)
   ```html
   <div class="form-row">
     <label for="difficulty">難度</label>
     <select id="difficulty">
       <option value="簡單">簡單</option>
       <option value="中等">中等</option>
       <option value="困難">困難</option>
     </select>
   </div>
   ```

2. **修改 JavaScript** (`script.js`)
   ```javascript
   const difficultyInput = document.getElementById("difficulty");
   
   wordForm.addEventListener("submit", (event) => {
     // ...
     const newEntry = {
       english: englishWordInput.value.trim(),
       translation: translationInput.value.trim(),
       partOfSpeech: posInput.value.trim(),
       example: exampleInput.value.trim(),
       root: rootInput.value.trim(),
       difficulty: difficultyInput.value,  // ← 新增欄位
     };
   });
   ```

3. **修改 Google Apps Script**
   ```javascript
   const row = [
     timestamp,
     postData.english || "",
     postData.translation || "",
     postData.partOfSpeech || "",
     postData.example || "",
     postData.root || "",
     postData.difficulty || ""  // ← 新增欄位
   ];
   ```

4. **更新試算表表頭**
   在 Google 試算表添加新欄位

---

## 後續改進建議

### 1. 增加身份驗證
為 Google Apps Script 添加簡單的密鑰驗證，防止未授權的請求：
```javascript
function doPost(e) {
  const expectedKey = "your-secret-key";
  const postData = JSON.parse(e.postData.contents);
  
  if (postData.key !== expectedKey) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: "未授權" })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  // ... 繼續處理 ...
}
```

### 2. 資料驗證與清理
在 Google Apps Script 中添加更多驗證邏輯，確保資料品質。

### 3. 前端回響
當資料成功儲存時，顯示更詳細的成功訊息或加載動畫。

### 4. 備份與匯出功能
在試算表中添加腳本，定期備份資料到其他位置。

---

## 總結檢查清單

- [ ] 已建立 Google 試算表
- [ ] 已取得試算表 ID
- [ ] 已開啟 Google Apps Script 編輯器
- [ ] 已複製並修改 `google-apps-script-template.js` 的程式碼
- [ ] 已填入正確的 `SPREADSHEET_ID`
- [ ] 已部署為 Web 應用程式
- [ ] 已複製部署 URL
- [ ] 已在 `script.js` 中填入 `GOOGLE_APPS_SCRIPT_URL`
- [ ] 已測試新增單字功能
- [ ] 已驗證資料出現在 Google 試算表中

完成以上所有步驟後，你的背單字應用就能成功將資料整合到 Google 試算表了！

---

## 聯絡支援

如有任何問題，請參考 Google Apps Script 官方文件：
https://developers.google.com/apps-script/guides/sheets
