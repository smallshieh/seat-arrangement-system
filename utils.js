/**
 * 工具函式庫
 * 提供常用的陣列操作、深拷貝等功能
 */

const utils = {
    /**
     * 陣列洗牌（Fisher-Yates 演算法）
     * @param {Array} array - 要洗牌的陣列
     * @returns {Array} 洗牌後的新陣列
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /**
     * 深拷貝物件
     * @param {*} obj - 要拷貝的物件
     * @returns {*} 深拷貝後的新物件
     */
    deepCopy(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepCopy(item));
        }
        
        if (obj instanceof Set) {
            return new Set([...obj]);
        }
        
        if (obj instanceof Map) {
            return new Map([...obj]);
        }
        
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepCopy(obj[key]);
            }
        }
        return clonedObj;
    },

    /**
     * 解析 CSV 文字內容
     * @param {string} text - CSV 文字內容
     * @returns {Array} 解析後的學生陣列
     */
    parseCSV(text) {
        const lines = text.trim().split('\n');
        const students = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',').map(p => p.trim());
            if (parts.length < 3) continue;

            let gender = parts[2].toLowerCase();
            if (gender === '男' || gender === 'm') {
                gender = 'male';
            } else if (gender === '女' || gender === 'f') {
                gender = 'female';
            }

            students.push({
                id: parts[0],
                name: parts[1],
                gender: gender
            });
        }

        return students;
    },

    /**
     * 正規化性別字串
     * @param {string} gender - 性別輸入
     * @returns {string} 正規化的性別 ('male' 或 'female')
     */
    normalizeGender(gender) {
        const g = gender.toLowerCase();
        if (g === '男' || g === 'm' || g === 'male') return 'male';
        if (g === '女' || g === 'f' || g === 'female') return 'female';
        return gender;
    },

    /**
     * 取得性別圖示
     * @param {string} gender - 性別
     * @returns {string} emoji 圖示
     */
    getGenderIcon(gender) {
        return gender === 'male' ? '👦' : '👧';
    },

    /**
     * 建立空矩陣
     * @param {number} rows - 行數
     * @param {number} cols - 列數
     * @returns {Array} 二維陣列
     */
    createMatrix(rows, cols) {
        return Array.from({ length: rows }, () => Array(cols).fill(null));
    },

    /**
     * 檢查索引是否有效
     * @param {number} index - 索引值
     * @param {number} total - 總數
     * @returns {boolean} 是否有效
     */
    isValidIndex(index, total) {
        return index >= 0 && index < total;
    },

    /**
     * 下載檔案
     * @param {string} content - 檔案內容
     * @param {string} filename - 檔案名稱
     * @param {string} contentType - MIME 類型
     */
    downloadFile(content, filename, contentType = 'application/json') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * 讀取檔案內容
     * @param {File} file - 檔案物件
     * @returns {Promise<string>} 檔案內容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * 格式化日期為字串
     * @param {Date} date - 日期物件
     * @returns {string} 格式化的日期字串 (YYYY-MM-DD)
     */
    formatDate(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    /**
     * 計算陣列中元素出現次數
     * @param {Array} array - 陣列
     * @param {Function} keyFn - 取得 key 的函式
     * @returns {Object} key: count 的物件
     */
    countBy(array, keyFn) {
        const counts = {};
        array.forEach(item => {
            const key = keyFn(item);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    },

    /**
     * 陣列分組
     * @param {Array} array - 陣列
     * @param {Function} keyFn - 取得 key 的函式
     * @returns {Object} key: array 的物件
     */
    groupBy(array, keyFn) {
        const groups = {};
        array.forEach(item => {
            const key = keyFn(item);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    },

    /**
     * 延遲執行
     * @param {number} ms - 毫秒數
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 限制字串長度
     * @param {string} str - 字串
     * @param {number} maxLength - 最大長度
     * @returns {string} 截斷後的字串
     */
    truncate(str, maxLength) {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }
};

// 如果在 Node.js 環境中，匯出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
}