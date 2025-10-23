# 學生座位安排系統 - 技術規劃書 v2.0

## 📋 文件資訊
- **專案名稱**：學生座位安排系統（Classroom Seating Arrangement System）
- **版本**：v2.1
- **文件日期**：2025-10-17
- **目標對象**：接手的程式設計師
- **技術棧**：Vanilla JavaScript, HTML5, CSS3
- **部署方式**：靜態網頁（無需後端）

---

## 🎯 專案目標

開發一個 Web-based 學生座位安排系統，具備以下特點：
- ✅ **資料導向設計**：邏輯層與視覺層完全分離
- ✅ **彈性座位配置**：可自訂教室行列數
- ✅ **手動與自動排座**：支援拖曳操作與智能演算法
- ✅ **雙視角支援**：支援「黑板在下」和「黑板在上」兩種視角
- ✅ **座位狀態管理**：支援鎖定與禁用座位
- ✅ **資料持久化**：支援 CSV 匯入與 JSON 匯出/匯入
- ✅ **完整座標轉換系統**：支援視覺↔矩陣雙向轉換（v2.1）

---

## 📐 系統架構

### 核心設計原則

#### 1. 資料導向架構（Data-Driven Architecture）
```
資料層 (Data Layer)
    ↓
邏輯層 (Logic Layer) - seatMatrix[col][row]
    ↓
視覺層 (View Layer) - seating[visualIndex]
    ↓
DOM 渲染
```

**關鍵概念**：
- **邏輯矩陣 (seatMatrix)**：唯一的資料真相來源（Single Source of Truth）
- **視覺陣列 (seating)**：從邏輯矩陣轉換而來，用於 UI 渲染
- **所有排座邏輯只操作 seatMatrix**，絕不直接操作 DOM

#### 2. 座標系統設計

**邏輯矩陣座標系（視角無關）**：
```
seatMatrix[col][row]
- col: 0 到 (cols-1)，代表「排」（從第1排到最後1排）
- row: 0 到 (rows-1)，代表「排內位置」（從第1位到最後1位）
- 左下角是 seatMatrix[0][0]
```

**視覺索引（視角相關）**：
```
visualIndex = 0 到 (rows * cols - 1)
- 從左上角開始，從左到右、從上到下編號
- 用於 DOM 元素的順序
```

**座標轉換邏輯**：
```javascript
// 黑板在下方：
matrixRow = visualCol
matrixCol = rows - 1 - visualRow

// 黑板在上方：
matrixRow = cols - 1 - visualCol
matrixCol = visualRow
```

---

## 📂 檔案結構

```
/seat-arrangement-system
├── index.html          # 主頁面（UI 結構）
├── style.css           # 樣式定義
├── app.js              # 主應用邏輯
├── utils.js            # 工具函式庫
├── README.md           # 專案說明
└── docs/
    └── user-guide.md   # 使用者操作指南
```

---

## 🗃️ 資料模型

### 核心狀態結構

```javascript
const app = {
    // 基本配置
    rows: 6,                    // 行數（橫向）
    cols: 5,                    // 列數（縱向）
    viewMode: 'bottom',         // 視角：'bottom' 或 'top'
    
    // 學生資料
    students: [                 // 學生清單
        {
            id: "1",            // 座號
            name: "王小明",     // 姓名
            gender: "male"      // 性別：'male' 或 'female'
        },
        // ...
    ],
    
    // 座位資料（雙層結構）
    seatMatrix: [],             // 邏輯矩陣 [col][row]
    seating: [],                // 視覺陣列 [visualIndex]
    
    // 座位狀態
    fixedSeats: new Set(),      // 鎖定座位索引 (visualIndex)
    disabledSeats: new Set()    // 禁用座位索引 (visualIndex)
};
```

### 資料流向

```
匯入 CSV
    ↓
students[] ← 學生清單
    ↓
自動/手動排座
    ↓
seatMatrix[col][row] ← 邏輯矩陣操作
    ↓
matrixToSeating() ← 轉換
    ↓
seating[visualIndex] ← 視覺陣列
    ↓
render() ← 渲染 DOM
```

---

## 🔧 核心功能模組

### 1. 初始化與配置模組

#### `init()`
- 初始化應用程式
- 建立初始座位結構
- 綁定事件監聽器

#### `initSeats(rows, cols)`
- 建立空的 seating 陣列
- 建立空的 seatMatrix 矩陣
- 更新座位資訊顯示

#### `resetSeatGrid()`
- 驗證輸入的行列數
- 清空所有座位與狀態
- 重新初始化座位結構

### 2. 學生資料管理模組

#### `handleCSVImport()`
- 讀取 CSV 檔案
- 驗證檔案格式
- 呼叫 `importFromCSV()`

#### `importFromCSV(text)`
- 解析 CSV 內容
- 正規化性別欄位（男/女/M/F → male/female）
- 更新 students 陣列
- 呼叫 `renderStudentList()`

#### `renderStudentList()`
- 計算已安排與未安排學生
- 隱藏已安排的學生（CSS class: `.assigned`）
- 更新學生計數顯示（例如：25/30）
- 綁定學生拖曳事件

### 3. 視角切換模組

#### `switchViewMode()`
**關鍵邏輯**：視角切換時需保持鎖定和禁用狀態跟著學生/位置移動

```javascript
步驟：
1. 儲存鎖定座位上的學生資料和矩陣坐標
2. 儲存禁用座位的矩陣坐標
3. 切換 viewMode
4. 執行 matrixToSeating()（重新生成 seating[]）
5. 在新 seating[] 中找到鎖定學生的新索引
6. 根據矩陣坐標找到禁用座位的新索引
7. 更新 fixedSeats 和 disabledSeats
8. 重新渲染
```

**為什麼不能用數學公式轉換索引**：
- 因為 `matrixToSeating()` 會重新排列 seating[]
- 學生在陣列中的位置已改變
- 必須基於學生身份或矩陣坐標重新定位

#### `visualToMatrixCoords(visualIndex)`
- 根據當前視角模式
- 將視覺索引轉換為矩陣坐標
- 返回 `{row, col}`

#### `matrixToSeating()`
- 遍歷所有視覺位置
- 根據視角模式計算對應的矩陣坐標
- 填充 seating[] 陣列

### 4. 手動排座模組（拖曳功能）

#### 學生名單 → 座位

**事件流程**：
```javascript
dragstart (學生) 
    → 設定 dataTransfer = {type: 'student', student: {...}}
    
dragover (座位)
    → 檢查是否可放置（禁用/鎖定）
    → 添加視覺提示（.can-drop 或 .cannot-drop）
    
drop (座位)
    → 呼叫 assignStudentToSeat()
    → 安排學生並自動鎖定
    → 更新 seatMatrix
    → 重新渲染
```

#### `assignStudentToSeat(student, targetIndex)`
```javascript
功能：
1. 檢查目標座位是否可用
2. 檢查學生是否已被安排
3. 將學生放入 seating[targetIndex]
4. 更新 seatMatrix
5. 自動鎖定該座位（fixedSeats.add）
6. 重新渲染學生名單（學生消失）
```

#### 座位 → 座位

**事件流程**：
```javascript
dragstart (座位)
    → 設定 dataTransfer = {type: 'seat', index: ...}
    
drop (座位)
    → 呼叫 handleSeatToSeatDrag()
    → 交換兩個學生位置
    → 更新鎖定狀態
```

#### `handleSeatToSeatDrag(sourceIndex, targetIndex)`
```javascript
功能：
1. 檢查目標座位是否鎖定
2. 交換兩個座位的學生
3. 更新 seatMatrix
4. 處理鎖定狀態的移動
5. 重新渲染
```

#### 座位 → 學生名單

**事件流程**：
```javascript
dragover (學生名單區域)
    → 添加視覺提示（.drag-target）
    
drop (學生名單區域)
    → 呼叫 handleStudentListDrop()
    → 取消學生安排 + 解除鎖定
    → 學生回到名單
```

### 5. 自動排座模組

#### `autoArrangeSeats(mode)`
**統一入口**，支援兩種模式：
- `'random'`：隨機排座
- `'gender'`：男女隔開排座

```javascript
流程：
1. 驗證學生人數與座位數
2. 根據 mode 和 fixedSeats.size 決定呼叫哪個演算法
3. 執行演算法（操作 seatMatrix）
4. matrixToSeating()（轉換為視覺層）
5. render()（渲染 UI）
6. renderStudentList()（更新名單）
7. generateArrangeMessage()（顯示提示）
```

#### `randomArrange()`
**純隨機排座**（當無鎖定座位時）

```javascript
演算法：
1. 建立新的空 seatMatrix
2. 洗牌所有學生
3. 按「排」順序填入：
   for col in 0..cols-1:
       for row in 0..rows-1:
           跳過禁用座位
           填入下一個學生
```

#### `fixedArrange()`
**保留固定座位排座**（當有鎖定座位時，由 `randomArrange` 自動呼叫）

```javascript
演算法：
1. 建立新 seatMatrix
2. 先填入鎖定座位的學生
3. 取得可用學生（排除已鎖定的）
4. 洗牌可用學生
5. 按「排」順序填入空位：
   for col in 0..cols-1:
       for row in 0..rows-1:
           跳過已鎖定座位
           跳過禁用座位
           填入下一個學生
```

#### `genderAlternateArrange()`
**男女隔開排座**（智能演算法）

**步驟 1：預判階段**
```javascript
1. 計算男女總人數
2. 呼叫 calculateFirstGender() 決定起始性別：
   - 優先權 1：第一個位置已鎖定 → 使用該性別
   - 優先權 2：男生多 → 'male'，女生多 → 'female'
   - 優先權 3：人數相等 → 'male'（固定規則）
```

**步驟 2：建立預期性別矩陣**
```javascript
createExpectedGenderMatrix(firstGender):
    建立理想的性別分配矩陣（不考慮實際學生）
    for col in 0..cols-1:
        決定本排起始性別
        for row in 0..rows-1:
            matrix[col][row] = currentGender
            currentGender = 切換性別
```

**步驟 3：衝突檢測**
```javascript
檢查所有鎖定座位：
    if 鎖定座位的性別 != 預期性別:
        記錄衝突
        
if 有衝突:
    顯示詳細衝突訊息
    詢問使用者是否繼續
    if 使用者取消:
        return（不排座）
```

**步驟 4：實際排座**
```javascript
1. 建立新 seatMatrix，填入鎖定學生
2. 準備男女生池（排除已鎖定的）
3. 根據預期矩陣填充：
   for col in 0..cols-1:
       for row in 0..rows-1:
           跳過已鎖定
           跳過禁用
           expectedGender = 預期矩陣[col][row]
           優先從對應性別池取學生
           若該性別池空了，從另一池取
```

#### `calculateFirstGender(maleCount, femaleCount, fixedPositions)`
**決定起始性別的智能邏輯**

```javascript
優先權順序：
1. 第一個位置 (col=0, row=0) 已鎖定
   → return 鎖定學生的性別
   
2. 男女人數不相等
   → return 人數較多的性別
   
3. 男女人數相等
   → return 'male'（固定規則，確保一致性）
```

**設計理由**：
- 讓使用者可以通過鎖定第一個位置來控制排座方向
- 人數多的性別優先，可以更好地分散
- 相等時用固定規則，避免隨機性導致衝突提示不一致

#### `createExpectedGenderMatrix(firstGender)`
**建立理想的性別分配藍圖**

```javascript
目的：
- 模擬完美的男女交替情況
- 用於衝突檢測
- 指導實際排座

特性：
- 為所有座位（包括禁用座位）建立預期性別
- 每排內交替
- 跨排時第一個位置與前一排不同
```

### 6. 座位狀態管理模組

#### `toggleLock(index)`
**鎖定/解鎖座位**

```javascript
功能：
1. 驗證座位是否可鎖定（不能是空位或禁用）
2. 切換 fixedSeats 狀態
3. 重新渲染
```

**自動鎖定**：
- 當使用者拖曳學生到座位時，自動呼叫 `fixedSeats.add()`
- 使用者可手動解鎖

#### `toggleBan(index)`
**禁用/解禁座位**

```javascript
功能：
1. 切換 disabledSeats 狀態
2. 如果禁用：
   - 清空該座位學生（seating[index] = null）
   - 更新 seatMatrix
   - 解除鎖定（fixedSeats.delete）
3. 重新渲染學生名單（學生回到名單）
```

**邏輯連貫性**：
- 禁用座位 = 該位置不安排學生
- 如果上面有學生，必須退回名單
- UI 保持一致：學生只會在名單或座位上，不會消失

### 7. 資料持久化模組

#### `exportSeating()`
**匯出 JSON**

```javascript
匯出格式：
{
    "rows": 6,
    "cols": 5,
    "viewMode": "bottom",
    "students": [...],
    "seating": [...],
    "fixedSeats": [0, 5, 10],
    "disabledSeats": [15]
}
```

#### `importSeating()`
**匯入 JSON**

```javascript
匯入流程：
1. 讀取 JSON 檔案
2. 解析並驗證格式
3. 還原所有狀態：
   - rows, cols
   - viewMode
   - students
   - seating
   - fixedSeats
   - disabledSeats
4. 重建 seatMatrix（從 seating 反推）
5. 更新 UI 控制項
6. 重新渲染
```

#### `clearSeats()`
**清空座位**

```javascript
功能：
1. 確認對話框
2. 清空 seating 和 seatMatrix
3. 清空 fixedSeats 和 disabledSeats
4. 重新渲染學生名單（所有學生回到名單）
5. 提示：「座位已清空，所有學生已回到名單」
```

#### `clearAllData()`
**清空所有資料**

```javascript
功能：
1. 確認對話框（警告不可復原）
2. 清空 students
3. 呼叫 clearSeats()
4. 重新渲染
```

### 8. UI 渲染模組

#### `render()`
**主渲染函式**

```javascript
渲染流程：
1. 更新視角指示器
2. 根據視角決定元素順序：
   - 黑板在下：座位 → 排標籤 → 黑板
   - 黑板在上：黑板 → 排標籤 → 座位
3. 呼叫子渲染函式
4. 更新座位資訊
```

#### `renderBlackboard(container)`
```javascript
渲染黑板視覺元素：
- 深灰色背景
- 白色文字「黑板 / 講台」
- 📋 圖示
```

#### `renderRowLabels(container, position)`
```javascript
渲染排標籤：
- position = 'top' 或 'bottom'
- 根據視角決定排數順序
- 添加方向提示（下→上 或 上→下）
- 添加箭頭視覺提示（CSS ::after）
```

#### `renderSeatsGrid(container)`
```javascript
渲染座位格：
1. 建立 grid 容器
2. 遍歷所有座位：
   for i in 0..(rows*cols-1):
       建立座位 div
       添加狀態 class（occupied/fixed/disabled）
       渲染座位內容（學生資訊或空位）
       渲染控制按鈕（鎖定/禁用）
       綁定拖曳事件
3. 添加到 container
```

#### `updateSeatInfo()`
```javascript
更新座位資訊顯示：
「6行 × 5列 | 已安排: 25 | 總座位: 30 | 禁用: 2」
```

#### `showMessage(text, type)`
```javascript
顯示訊息提示：
- type: 'info', 'warning', 'error'
- 自動 5 秒後消失
- 不同類型有不同顏色
```

### 9. 工具函式庫（utils.js）

#### `shuffle(array)`
**Fisher-Yates 洗牌演算法**

```javascript
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
```

#### `deepCopy(obj)`
**深拷貝物件**

支援：
- 基本類型
- 陣列
- 物件
- Set
- Map
- Date

#### `parseCSV(text)`
**解析 CSV 文字**

```javascript
格式：
座號,姓名,性別

範例：
1,王小明,男
2,李小華,女
```

#### `createMatrix(rows, cols)`
**建立空矩陣**

```javascript
return Array.from({ length: rows }, () => Array(cols).fill(null));
```

#### `getGenderIcon(gender)`
**取得性別圖示**

```javascript
male → '👦'
female → '👧'
```

#### 其他工具函式
- `normalizeGender()`：正規化性別字串
- `downloadFile()`：下載檔案
- `readFile()`：讀取檔案（Promise）
- `formatDate()`：格式化日期

---

## 🎨 UI/UX 設計規範

### 視覺層次

```
1. 控制面板（灰色背景）
   ├─ 第一排：座位配置與視角選擇
   └─ 第二排：操作按鈕

2. 訊息提示區（可選顯示）

3. 主內容區
   ├─ 左側：學生名單（固定寬度 250px）
   └─ 右側：座位區域
       ├─ 視角指示器
       ├─ 黑板區塊（視角決定位置）
       ├─ 排標籤（視角決定位置）
       └─ 座位格 Grid
```

### 顏色系統

```css
/* 主色調 */
--primary: #667eea;        /* 按鈕、標題 */
--success: #48bb78;        /* 成功操作 */
--warning: #ed8936;        /* 警告、鎖定 */
--danger: #f56565;         /* 危險操作、禁用 */

/* 座位狀態 */
--male: #e6f7ff;           /* 男生座位背景 */
--male-border: #1890ff;    /* 男生座位邊框 */
--female: #fff0f6;         /* 女生座位背景 */
--female-border: #ff85c0;  /* 女生座位邊框 */
--fixed: #fff7e6;          /* 鎖定座位背景 */
--fixed-border: #ffa940;   /* 鎖定座位邊框 */
--disabled: #f5f5f5;       /* 禁用座位背景 */

/* 拖曳提示 */
--can-drop: #f6ffed;       /* 可放置（綠色） */
--cannot-drop: #fff1f0;    /* 不可放置（紅色） */
--drag-target: #e6f7ff;    /* 學生名單可接收（藍色） */
```

### 座位格設計

```
每個座位格包含：
┌──────────────────┐
│ 🔒  🚫          │ ← 右上角控制按鈕
│                  │
│   座位 15        │ ← 座位編號
│   👦 王小明      │ ← 性別圖示 + 姓名
│   座號: 5        │ ← 座號
│                  │
└──────────────────┘

尺寸：
- 最小高度：100px
- 內距：15px
- 邊框：3px（鎖定時 4px）
- 圓角：12px
```

### 拖曳視覺回饋

```css
/* 拖曳中的學生 */
.student-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
}

/* 可放置座位 */
.seat.can-drop {
    background: #f6ffed;
    border: 3px solid #52c41a;
}

/* 不可放置座位 */
.seat.cannot-drop {
    background: #fff1f0;
    border: 3px solid #ff4d4f;
}

/* 學生名單可接收 */
.student-list.drag-target {
    background: #e6f7ff;
    border: 3px dashed #1890ff;
    box-shadow: 0 0 20px rgba(24, 144, 255, 0.3);
}
```

### 響應式設計

```css
/* 大螢幕 (> 1200px) */
- 主容器最大寬度：1400px
- 學生名單：250px
- 座位格：自適應

/* 中螢幕 (768px - 1200px) */
- 主容器最大寬度：100%
- 學生名單：200px
- 座位格：略小

/* 小螢幕 (< 768px) */
- 建議提示：請使用電腦瀏覽器
- 或改為上下排列
```

---

## 🔐 資料驗證與錯誤處理

### 輸入驗證

#### CSV 匯入
```javascript
驗證項目：
1. 檔案格式是否為 .csv
2. 每行是否有至少 3 欄
3. 性別欄位是否有效
4. 座號是否重複

錯誤處理：
- 顯示具體錯誤訊息
- 不匯入無效資料
- 保持原有資料不變
```

#### 座位配置
```javascript
驗證項目：
1. 行數與列數範圍：1-15
2. 學生人數 ≤ 可用座位數

錯誤處理：
- 提示有效範圍
- 阻止不合理的配置
```

#### 拖曳操作
```javascript
驗證項目：
1. 來源是否可拖曳（非禁用、有學生）
2. 目標是否可放置（非禁用、非鎖定）
3. 學生是否已被安排

錯誤處理：
- 視覺提示（紅色邊框）
- 顯示錯誤訊息
- 阻止無效操作
```

### 邊界情況處理

#### 零學生
```javascript
- 允許建立空座位表
- 自動排座按鈕提示「請先匯入學生」
```

#### 學生數 > 座位數
```javascript
- 排座前檢查
- 顯示錯誤：「學生人數 (35) 超過可用座位 (30)」
- 阻止排座
```

#### 全部座位被禁用
```javascript
- 檢查可用座位數
- 提示：「沒有可用座位」
```

#### 性別極度不均
```javascript
例如：25 男 5 女
- 男女隔開排座會提示：「有 X 位學生無法完美隔開」
- 但仍然完成排座
- 使用者可選擇接受或重排
```

---

## 🧪 測試建議

### 單元測試（Unit Tests）

#### 工具函式測試
```javascript
describe('utils.shuffle', () => {
    test('should return array with same length')
    test('should contain all original elements')
    test('should not modify original array')
});

describe('utils.parseCSV', () => {
    test('should parse valid CSV')
    test('should handle different gender formats')
    test('should ignore empty lines')
});
```

#### 座標轉換測試
```javascript
describe('visualToMatrixCoords', () => {
    test('should convert correctly when viewMode is bottom')
    test('should convert correctly when viewMode is top')
    test('should handle edge cases (corners)')
});

describe('matrixToSeating', () => {
    test('should generate correct seating array for bottom view')
    test('should generate correct seating array for top view')
});
```

#### 排座演算法測試
```javascript
describe('randomArrange', () => {
    test('should fill all available seats')
    test('should preserve fixed seats')
    test('should skip disabled seats')
    test('should fill seats in column-first order')
});

describe('genderAlternateArrange', () => {
    test('should alternate genders when possible')
    test('should respect fixed seats')
    test('should handle unequal gender ratios')
    test('should calculate correct firstGender')
    test('should detect conflicts with fixed seats')
});

describe('calculateFirstGender', () => {
    test('should use fixed position gender if exists')
    test('should use majority gender when unequal')
    test('should default to male when equal')
});
```

### 整合測試（Integration Tests）

#### 完整工作流測試
```javascript
describe('Complete Workflow', () => {
    test('Import CSV → Auto arrange → Export JSON → Import JSON', () => {
        1. 匯入學生 CSV
        2. 執行男女隔開排座
        3. 匯出 JSON
        4. 清空所有資料
        5. 匯入 JSON
        6. 驗證狀態完全一致
    });
    
    test('Manual arrange → Lock → Auto arrange', () => {
        1. 手動拖曳 5 位學生
        2. 驗證自動鎖定
        3. 執行隨機排座
        4. 驗證 5 位學生位置不變
    });
    
    test('Switch view → Verify locks', () => {
        1. 安排學生並鎖定
        2. 切換視角
        3. 驗證鎖定狀態跟著學生移動
        4. 切換回原視角
        5. 驗證狀態一致
    });
});
```

### 使用者介面測試（UI Tests）

#### 拖曳功能測試
```javascript
describe('Drag and Drop', () => {
    test('Student → Empty seat: assign + auto lock')
    test('Student → Occupied seat: replace + auto lock')
    test('Student → Disabled seat: reject')
    test('Seat → Seat: swap students')
    test('Seat → Student list: cancel + unlock')
});
```

#### 視覺回饋測試
```javascript
describe('Visual Feedback', () => {
    test('Drag over valid seat: show green border')
    test('Drag over invalid seat: show red border')
    test('Drag over student list: show blue highlight')
    test('Fixed seat: show orange border')
    test('Disabled seat: show grey + opacity')
});
```

### 邊界條件測試

```javascript
測試案例：
1. 0 學生
2. 1 學生
3. 學生數 = 座位數
4. 學生數 > 座位數（應拒絕）
5. 1×1 座位表
6. 15×15 座位表（最大）
7. 全部男生
8. 全部女生
9. 1 男 29 女（極度不均）
10. 全部座位被禁用
11. 第一個位置被禁用
12. 所有學生都被鎖定
13. 視角切換 + 禁用座位組合測試 (v2.1 新增)
14. 黑板在上 + 禁用座位 + 排座 (v2.1 新增)
```

### 視角相關測試（v2.1 新增）

```javascript
describe('View Mode and Disabled Seats', () => {
    test('Bottom view: disabled seat should be skipped correctly', () => {
        1. 設定黑板在下
        2. 禁用第3排第2列
        3. 執行隨機排座
        4. 驗證第3排第2列為空
        5. 驗證其他座位已排滿
    });
    
    test('Top view: disabled seat should be skipped correctly', () => {
        1. 設定黑板在上
        2. 禁用第3排第2列
        3. 執行男女隔開排座
        4. 驗證第3排第2列為空
        5. 驗證其他座位已排滿
    });
    
    test('Switch view with disabled seats', () => {
        1. 黑板在下，禁用某座位
        2. 切換到黑板在上
        3. 執行排座
        4. 驗證禁用座位正確對應到新視角位置
        5. 切換回黑板在下
        6. 驗證狀態一致
    });
    
    test('matrixToVisualIndex correctness', () => {
        1. 遍歷所有矩陣坐標
        2. 轉換為視覺索引
        3. 再轉換回矩陣坐標
        4. 驗證結果一致（往返轉換）
    });
});
```

---

## 🚀 效能優化建議

### 渲染優化

#### 1. 避免不必要的重新渲染
```javascript
// 不好的做法
function updateSeat(index) {
    render(); // 重新渲染整個座位表
}

// 好的做法
function updateSeat(index) {
    renderSingleSeat(index); // 只更新單一座位
}
```

#### 2. 使用 DocumentFragment
```javascript
function renderSeatsGrid(container) {
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < total; i++) {
        const seat = createSeatElement(i);
        fragment.appendChild(seat);
    }
    
    container.appendChild(fragment); // 一次性插入
}
```

#### 3. 事件委派（Event Delegation）
```javascript
// 不好：為每個座位綁定事件
seats.forEach(seat => {
    seat.addEventListener('click', handler);
});

// 好：在父容器綁定一次
seatsGrid.addEventListener('click', (e) => {
    if (e.target.matches('.seat')) {
        handler(e);
    }
});
```

### 資料結構優化

#### 1. 使用 Set 而非 Array
```javascript
// 查詢效率：O(1) vs O(n)
fixedSeats: new Set()      // ✓ 好
fixedSeats: []             // ✗ 不好
```

#### 2. 快取計算結果
```javascript
// 避免重複計算
const assignedStudentIds = new Set(
    this.seating.filter(s => s !== null).map(s => s.id)
);
// 後續使用 assignedStudentIds，不用每次重新計算
```

### 演算法優化

#### 1. 提早退出
```javascript
// 好的做法
for (const student of students) {
    if (student.id === targetId) {
        return student; // 找到就立即返回
    }
}

// 不好的做法
const found = students.filter(s => s.id === targetId);
return found[0]; // 遍歷整個陣列
```

#### 2. 減少巢狀迴圈
```javascript
// 如果可能，將 O(n²) 改為 O(n)
// 例如使用 Map 做快速查找
```

---

## 🔒 安全性考量

### 輸入清理

#### CSV 匯入
```javascript
function sanitizeInput(text) {
    // 移除潛在的 HTML/JavaScript 代碼
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();
}
```

#### JSON 匯入
```javascript
function validateJSON(data) {
    // 驗證必要欄位
    if (!data.rows || !data.cols || !data.students) {
        throw new Error('Invalid JSON format');
    }
    
    // 驗證資料類型
    if (typeof data.rows !== 'number') {
        throw new Error('rows must be a number');
    }
    
    // 驗證範圍
    if (data.rows < 1 || data.rows > 15) {
        throw new Error('rows out of range');
    }
    
    return true;
}
```

### XSS 防護

```javascript
// 使用 textContent 而非 innerHTML（除非必要）
element.textContent = studentName; // ✓ 安全
element.innerHTML = studentName;   // ✗ 可能有風險

// 如果必須使用 innerHTML，先清理
element.innerHTML = sanitize(studentName);
```

---

## 📱 瀏覽器兼容性

### 目標瀏覽器
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 使用的 Web APIs
```javascript
// 確保支援以下 API：
- Drag and Drop API (HTML5)
- File API (FileReader)
- ES6+ (let/const, arrow functions, template literals, Set, Map)
- CSS Grid Layout
- CSS Flexbox
```

### Polyfill 需求
```javascript
// 如果需要支援舊瀏覽器，考慮：
- Array.prototype.findIndex
- Array.prototype.find
- Set/Map polyfill
```

---

## 🎯 未來擴充建議

### Phase 2 功能

#### 1. 座位編號格式
```javascript
當前：數字編號（1, 2, 3...）
建議：字母+數字格式（A1, A2, B1...）

實作：
- 新增設定選項
- 修改 renderSeatsGrid() 中的編號邏輯
```

#### 2. 排座統計
```javascript
功能：
- 顯示男女比例
- 計算同性別相鄰對數
- 顯示性別分布熱圖

實作：
- 新增 calculateStatistics() 函式
- 新增統計顯示區塊
```

#### 3. 歷史記錄
```javascript
功能：
- 記錄每次排座結果
- 支援 Undo/Redo
- 比較不同版本

實作：
- 新增 history[] 陣列
- 實作 undo(), redo() 函式
- 使用 deepCopy 儲存快照
```

#### 4. 列印功能
```javascript
功能：
- 匯出 PDF
- 列印座位表
- 包含學生照片（可選）

實作：
- 使用 window.print()
- 或整合 jsPDF 函式庫
- 新增列印專用 CSS
```

#### 5. 多班級管理
```javascript
功能：
- 支援多個班級
- 切換班級
- 匯入/匯出多班級資料

實作：
- 改為 classes[] 陣列
- 新增 currentClassIndex
- 修改資料結構
```

### Phase 3 功能（需後端支援）

#### 1. 雲端儲存
```javascript
功能：
- 帳號系統
- 資料同步
- 多裝置存取

技術棧：
- 前端：保持不變
- 後端：Node.js + Express
- 資料庫：MongoDB / PostgreSQL
- 認證：JWT
```

#### 2. 協作功能
```javascript
功能：
- 多位老師共同編輯
- 即時同步
- 變更記錄

技術：
- WebSocket (Socket.io)
- Operational Transformation
```

#### 3. 學生資料庫整合
```javascript
功能：
- 從學校系統匯入學生資料
- 包含照片、特殊需求等資訊
- 自動更新

實作：
- API 整合
- 資料映射
```

---

## 📚 開發規範

### 程式碼風格

#### JavaScript
```javascript
// 使用 ESLint + Prettier
// 風格指南：Airbnb JavaScript Style Guide

// 命名規範
- 變數/函式：camelCase (例: studentList, renderSeats)
- 常數：UPPER_SNAKE_CASE (例: MAX_SEATS)
- 類別：PascalCase (例: SeatManager)
- 私有方法：_camelCase (例: _updateMatrix)

// 註解規範
/**
 * 函式說明
 * @param {type} paramName - 參數說明
 * @returns {type} 返回值說明
 */
```

#### CSS
```css
/* 使用 BEM 命名法 */
.block {}
.block__element {}
.block--modifier {}

/* 範例 */
.seat {}
.seat__content {}
.seat__actions {}
.seat--fixed {}
.seat--disabled {}
```

#### HTML
```html
<!-- 語義化標籤 -->
<!-- 可訪問性（ARIA） -->
<!-- data-* 屬性用於儲存自訂資料 -->

<div class="seat" 
     data-index="5" 
     data-student-id="10"
     role="button"
     aria-label="座位 5">
</div>
```

### Git 工作流程

```bash
# 分支策略
main          # 生產環境
develop       # 開發環境
feature/*     # 功能分支
bugfix/*      # 修復分支
hotfix/*      # 緊急修復

# Commit 訊息格式
feat: 新增男女隔開排座功能
fix: 修正視角切換時鎖定狀態錯誤
docs: 更新 README
style: 調整座位格樣式
refactor: 重構排座演算法
test: 新增單元測試
chore: 更新依賴套件
```

### 文件規範

```markdown
必要文件：
1. README.md - 專案說明、安裝步驟
2. CHANGELOG.md - 版本變更記錄
3. CONTRIBUTING.md - 貢獻指南
4. docs/API.md - API 文件
5. docs/ARCHITECTURE.md - 架構說明
6. docs/USER_GUIDE.md - 使用者指南
```

---

## 🐛 已知問題與限制

### 目前限制

1. **無後端支援**
   - 資料只能本地儲存
   - 無法多裝置同步
   - 無法協作編輯

2. **瀏覽器儲存限制**
   - 不使用 localStorage（Claude.ai 限制）
   - 資料在頁面重新整理後會遺失
   - 必須手動匯出/匯入 JSON

3. **大量學生效能**
   - 超過 100 位學生可能有效能問題
   - 建議最多 50-60 位學生

4. **觸控裝置支援**
   - 拖曳功能在觸控裝置上體驗較差
   - 建議使用桌面瀏覽器

### 已修復的 Bug

#### Bug #1：視角切換時鎖定狀態錯誤（v2.0 已修復）
**問題**：
- 切換視角時，鎖定座位的圖示沒有跟著學生移動
- 原因：使用純數學公式轉換索引，但學生位置已改變

**解決方案**：
- 基於學生身份重新定位
- 儲存矩陣坐標而非視覺索引
- 切換視角後重建 fixedSeats 和 disabledSeats

#### Bug #2：禁用座位在不同視角下位置錯誤（v2.1 已修復）
**問題**：
- 黑板在上時，禁用座位後排座，禁用作用在錯誤位置
- 例如：禁用第3排第2列，但實際第4排第4位被跳過

**根本原因**：
```javascript
// 排座演算法中的錯誤寫法（視角無關）
const visualIndex = (this.rows - 1 - row) * this.cols + col;

// 這個公式只在「黑板在下」時正確！
```

**解決方案**：
1. 新增 `matrixToVisualIndex(matrixRow, matrixCol)` 函式
2. 根據 viewMode 正確計算視覺索引
3. 修改三個排座函式使用新函式

**影響範圍**：
- ✅ `randomArrange()`
- ✅ `genderAlternateArrange()`
- ✅ `fixedArrange()`

### 改進空間

1. **效能優化**
   - 大型座位表（10×15）渲染可以更快
   - 減少不必要的重新渲染

2. **使用者體驗**
   - 新增鍵盤快捷鍵
   - 新增操作提示（tooltips）
   - 改進觸控裝置支援

3. **錯誤處理**
   - 更友善的錯誤訊息
   - 錯誤恢復機制

---

## 📞 技術支援與聯絡

### 文件位置
```
/docs
├── README.md           # 專案說明
├── USER_GUIDE.md       # 使用者指南
├── ARCHITECTURE.md     # 本文件
└── API.md              # API 文件
```

### 問題回報
```
建議使用 Issue Tracker 記錄：
- Bug 回報
- 功能請求
- 改進建議

Issue 模板應包含：
1. 問題描述
2. 重現步驟
3. 預期行為
4. 實際行為
5. 環境資訊（瀏覽器、版本）
6. 截圖（如有）
```

### 程式碼審查清單

在提交程式碼前，請確認：

- [ ] 程式碼符合風格指南
- [ ] 所有函式都有註解
- [ ] 新功能有對應的測試
- [ ] 測試全部通過
- [ ] 沒有 console.log 殘留
- [ ] 沒有註解掉的程式碼
- [ ] 變數命名清楚易懂
- [ ] 沒有魔術數字（使用常數）
- [ ] 錯誤處理完整
- [ ] 更新相關文件

---

## 🎓 學習資源

### 核心概念

#### 1. 資料導向設計
```
推薦閱讀：
- "Data-Oriented Design" by Richard Fabian
- MVC/MVVM 架構模式
```

#### 2. HTML5 Drag and Drop
```
官方文件：
- MDN: HTML Drag and Drop API
- 注意事件順序：dragstart → dragover → drop → dragend
```

#### 3. 矩陣與座標轉換
```
數學基礎：
- 二維陣列索引
- 座標系轉換
- 矩陣鏡像操作
```

### 相關技術

```javascript
前端基礎：
- ES6+ JavaScript
- CSS Grid Layout
- CSS Flexbox
- File API
- JSON 操作

演算法：
- Fisher-Yates Shuffle
- Greedy Algorithm (男女隔開)
- Conflict Detection

設計模式：
- Observer Pattern (事件監聽)
- Strategy Pattern (排座演算法)
- Singleton Pattern (app 物件)
```

---

## 📊 專案統計

### 程式碼規模（v2.1）

```
檔案統計：
├── index.html      ~200 行
├── style.css       ~450 行（新增視覺回饋樣式）
├── app.js          ~900 行（新增 matrixToVisualIndex 等）
└── utils.js        ~200 行
總計：              ~1750 行

函式數量：
- app.js:    ~45 個函式（新增 matrixToVisualIndex）
- utils.js:  ~15 個工具函式
總計：       ~60 個函式

核心演算法：
- visualToMatrixCoords()     座標轉換（視覺→矩陣）
- matrixToVisualIndex()      座標轉換（矩陣→視覺）NEW v2.1
- matrixToSeating()          矩陣轉視覺陣列
- randomArrange()            隨機排座
- genderAlternateArrange()   男女隔開排座
- calculateFirstGender()     起始性別判斷
- createExpectedGenderMatrix() 預期性別矩陣
```

### 開發時間估計

```
功能模組                工時（小時）
─────────────────────────────────
基礎架構與 UI            8-12
學生管理                 4-6
手動排座（拖曳）         10-14（含視覺回饋優化）
自動排座演算法           14-18（含智能判斷）
視角切換                 10-12（含座標轉換系統）
座位狀態管理             6-8
資料持久化               4-6
Bug 修復與優化           6-8（v2.1 座標轉換修復）
測試與除錯               10-14
文件撰寫                 6-8
─────────────────────────────────
總計                     78-106 小時
```

---

## ✅ 交付清單

### 程式碼檔案
- [x] index.html
- [x] style.css
- [x] app.js
- [x] utils.js

### 文件檔案
- [x] README.md（專案說明）
- [x] USER_GUIDE.md（使用者操作指南）
- [x] ARCHITECTURE.md（本技術規劃書）

### 測試檔案
- [ ] test/utils.test.js
- [ ] test/algorithms.test.js
- [ ] test/integration.test.js

### 範例資料
- [ ] samples/students_30.csv
- [ ] samples/students_40.csv
- [ ] samples/demo_seating.json

### 其他
- [ ] .gitignore
- [ ] package.json（如使用 npm）
- [ ] LICENSE

---

## 🔄 版本歷史

### v2.1（當前版本）- 2025-10-17
```
Bug 修復：
- 🐛 修正禁用座位在「黑板在上」視角下位置錯誤的問題
- 新增 matrixToVisualIndex() 函式處理座標轉換
- 修正 randomArrange()、genderAlternateArrange()、fixedArrange() 三個函式

技術改進：
- 完善座標轉換系統（雙向轉換）
- 提升視角切換的邏輯一致性
```

### v2.0 - 2025-10-17
```
重大更新：
- 合併「隨機排座」和「保留固定座位排座」功能
- 改進視角切換時的鎖定狀態處理
- 新增智能排座提示訊息
- 修正座位狀態與學生名單的邏輯一致性
- 改進 UI 操作流程

新增功能：
- 手動拖曳安排自動鎖定
- 學生名單即時更新（已排/未排）
- 詳細的操作提示訊息
- 視角切換時狀態正確保留

優化：
- 排座演算法按「排」順序填入
- 男女隔開排座的起始性別智能判斷
- 所有操作都會更新學生名單顯示
```

### v1.0 - 2025-10-15
```
基礎功能：
- CSV 學生匯入
- 自訂行列數
- 三種排座模式
- 視角切換
- 座位鎖定與禁用
- JSON 匯出/匯入
```

---

## 📝 結語

這是一個設計良好、功能完整的座位安排系統。核心設計理念是**資料導向**和**關注點分離**，確保：

1. **邏輯清晰**：所有排座邏輯只操作 seatMatrix
2. **易於維護**：視覺層只是邏輯層的投影
3. **便於擴充**：模組化設計，各功能獨立
4. **使用者友善**：直覺的拖曳操作，智能的自動排座

接手的開發者應：
1. 先理解座標系統（最關鍵）
2. 了解資料流向（seatMatrix → seating → DOM）
3. 熟悉各個演算法的邏輯
4. 維護邏輯一致性（學生只在名單或座位上）

祝開發順利！🚀

---

**文件版本**：2.1  
**最後更新**：2025-10-17  
**作者**：Claude (Anthropic)  
**審核者**：專案負責人  
**變更記錄**：
- v2.1：新增 matrixToVisualIndex() 說明，更新 Bug 修復記錄
- v2.0：完整技術規劃書初版