# 🪑 學生座位安排系統

一個功能完整的 Web-based 學生座位安排系統，支援手動拖曳與智能自動排座。

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 主要功能

- 📊 **CSV 學生匯入**：支援批次匯入學生資料
- 🎯 **雙視角切換**：黑板在下/上兩種視角自由切換
- 🖱️ **拖曳排座**：直覺的拖曳操作，自動鎖定
- 🤖 **智能排座**：隨機排座 & 男女隔開排座
- 🔒 **座位管理**：支援鎖定與禁用座位
- 💾 **資料持久化**：JSON 匯出/匯入功能
- 📱 **響應式設計**：適配不同螢幕尺寸

## 🚀 線上展示

👉 [立即體驗](https://smallshieh.github.io/seat-arrangement-system/)

## 📸 螢幕截圖

（建議在這裡放置系統截圖）

## 🎯 快速開始

### 方法 1：直接使用（無需安裝）

1. 下載專案檔案
2. 用瀏覽器開啟 `index.html`
3. 開始使用！

### 方法 2：使用 GitHub Pages（線上版本）

訪問：`https://your-username.github.io/seat-arrangement-system/`

## 📖 使用說明

### 基本流程

1. **匯入學生**
   - 準備 CSV 檔案（格式：座號,姓名,性別）
   - 點擊「選擇檔案」→「匯入」

2. **手動安排特殊學生**（可選）
   - 從左側名單拖曳學生到座位
   - 自動鎖定該座位

3. **自動排座**
   - 點擊「🎲 隨機排座」或「👥 男女隔開排座」
   - 系統自動保留鎖定座位

4. **調整與儲存**
   - 拖曳調整個別座位
   - 點擊「💾 匯出座位表」儲存

詳細操作請參考：[使用者指南](docs/USER_GUIDE.md)

## 🔧 技術架構

- **前端**：Vanilla JavaScript（無框架依賴）
- **樣式**：CSS3（Grid + Flexbox）
- **資料結構**：資料導向設計
- **演算法**：Fisher-Yates Shuffle、Greedy Algorithm

詳細架構請參考：[技術規劃書](docs/ARCHITECTURE.md)

## 📋 CSV 格式範例
```csv
1,王小明,男
2,李小華,女
3,張大同,男
4,陳美美,女
```

支援性別格式：男/女、M/F、male/female

## 🎨 功能特色

### 雙視角支援

- **黑板在下**：適合傳統教室（講台在前）
- **黑板在上**：適合翻轉教室或特殊配置

### 智能排座演算法

#### 隨機排座
- 自動檢測鎖定座位
- 按排順序填入（第1排→第2排...）

#### 男女隔開排座
- 智能判斷起始性別
- 支援鎖定座位
- 自動衝突檢測

### 直覺的操作

- ✅ 拖曳學生到座位 → 自動鎖定
- ✅ 拖曳學生回名單 → 取消安排
- ✅ 座位間互拖 → 交換位置
- ✅ 視覺回饋清晰（綠色可放置、紅色不可）

## 🛠️ 開發

### 本地開發
```bash
# 克隆專案
git clone https://github.com/smallshieh/seat-arrangement-system.git

# 進入目錄
cd seat-arrangement-system

# 用瀏覽器開啟 index.html
# 或使用本地伺服器（推薦）
python -m http.server 8000
# 訪問 http://localhost:8000
```

### 專案結構
seat-arrangement-system/
├── index.html          # 主頁面
├── style.css           # 樣式
├── app.js              # 主邏輯
├── utils.js            # 工具函式
├── docs/               # 文件
│   ├── USER_GUIDE.md
│   └── ARCHITECTURE.md
└── samples/            # 範例資料
## 🤝 貢獻

歡迎貢獻！請遵循以下步驟：

1. Fork 這個專案
2. 建立您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

## 📝 更新日誌

### v2.0（當前版本）
- ✨ 合併隨機排座與保留固定座位功能
- ✨ 改進視角切換邏輯
- ✨ 新增智能排座提示
- 🐛 修正座位狀態邏輯一致性

### v1.0
- 🎉 初始版本發布
- ✨ 基礎排座功能
- ✨ CSV 匯入/JSON 匯出

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

## 👤 作者

**您的名字**

- GitHub: [@smallshieh](https://github.com/smallshieh)
- Email: your.email@example.com

## 🙏 致謝

- 感謝 [Claude](https://claude.ai) 協助開發
- 靈感來源：實際教室座位安排需求

## 🐛 問題回報

發現 Bug？有功能建議？

請到 [Issues](https://github.com/your-username/seat-arrangement-system/issues) 頁面提交。

## ⭐ 給個星星

如果這個專案對您有幫助，請給個星星 ⭐

---

**專案狀態**：✅ 積極維護中

**最後更新**：2025-10-17
