/**
 * 學生座位安排系統 - 主應用程式
 * 資料導向設計：所有邏輯操作基於 seatMatrix，UI 由矩陣轉換而來
 */

const app = {
    // 狀態資料
    rows: 6,
    cols: 5,
    students: [],           // 學生清單
    seating: [],           // 視覺層座位陣列
    seatMatrix: [],        // 邏輯矩陣 [col][row]
    fixedSeats: new Set(), // 鎖定座位索引
    disabledSeats: new Set(), // 禁用座位索引
    viewMode: 'bottom',    // 視角模式：'bottom' (黑板在下) 或 'top' (黑板在上)

    /**
     * 初始化應用程式
     */
    init() {
        this.initSeats(this.rows, this.cols);
        this.render();
    },

    /**
     * 初始化座位結構
     * @param {number} rows - 行數
     * @param {number} cols - 列數
     */
    initSeats(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.seating = Array(rows * cols).fill(null);
        this.seatMatrix = utils.createMatrix(cols, rows);
        this.updateSeatInfo();
    },

    /**
     * 重設座位格（更新行列數）
     */
    resetSeatGrid() {
        const rows = parseInt(document.getElementById('rows').value);
        const cols = parseInt(document.getElementById('cols').value);
        
        if (rows < 1 || cols < 1 || rows > 15 || cols > 15) {
            this.showMessage('請輸入有效的行列數 (1-15)', 'error');
            return;
        }

        if (confirm('更新座位格將清空所有座位安排，是否繼續？')) {
            this.fixedSeats.clear();
            this.disabledSeats.clear();
            this.initSeats(rows, cols);
            this.render();
            this.renderStudentList(); // 重新渲染名單，所有學生回到名單
            this.showMessage('座位格已更新，所有學生已回到名單', 'info');
        }
    },

    /**
     * 切換視角模式
     */
    switchViewMode() {
        const newMode = document.getElementById('viewMode').value;
        if (newMode === this.viewMode) return;

        const oldViewMode = this.viewMode;

        // 儲存鎖定和禁用座位上的學生/狀態
        const fixedStudents = [];
        for (const idx of this.fixedSeats) {
            if (this.seating[idx]) {
                fixedStudents.push({
                    student: this.seating[idx],
                    matrixCoords: this.visualToMatrixCoords(idx)
                });
            }
        }

        const disabledMatrixCoords = [];
        for (const idx of this.disabledSeats) {
            disabledMatrixCoords.push(this.visualToMatrixCoords(idx));
        }

        // 切換視角
        this.viewMode = newMode;

        // 重新從矩陣轉換座位（視角改變）
        this.matrixToSeating();

        // 重建鎖定座位：根據矩陣坐標找到新的視覺索引
        this.fixedSeats.clear();
        for (const fixed of fixedStudents) {
            // 在新 seating 中找到該學生的新索引
            const newIndex = this.seating.findIndex(s => 
                s && s.id === fixed.student.id
            );
            if (newIndex !== -1) {
                this.fixedSeats.add(newIndex);
            }
        }

        // 重建禁用座位：根據矩陣坐標找到新的視覺索引
        this.disabledSeats.clear();
        for (const coords of disabledMatrixCoords) {
            // 根據矩陣坐標計算新的視覺索引
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const visualIndex = r * this.cols + c;
                    const checkCoords = this.visualToMatrixCoords(visualIndex);
                    if (checkCoords.row === coords.row && checkCoords.col === coords.col) {
                        this.disabledSeats.add(visualIndex);
                        break;
                    }
                }
            }
        }

        this.render();
        this.renderStudentList();
        this.showMessage(`已切換視角：${newMode === 'bottom' ? '黑板在下' : '黑板在上'}`, 'info');
    },

    /**
     * 轉換視角之間的索引
     * @param {number} index - 舊視角的索引
     * @param {string} fromMode - 來源視角
     * @param {string} toMode - 目標視角
     * @returns {number} 新視角的索引
     */
    convertIndexBetweenViews(index, fromMode, toMode) {
        if (fromMode === toMode) return index;

        // 視角切換時的對應關係：
        // 黑板在下 ↔ 黑板在上 = 左右完全鏡像
        
        const row = Math.floor(index / this.cols);
        const col = index % this.cols;

        // 左右鏡像：新列 = (總列數 - 1) - 舊列
        const newCol = this.cols - 1 - col;
        const newIndex = row * this.cols + newCol;
        
        return newIndex;
    },

    /**
     * 處理 CSV 匯入
     */
    handleCSVImport() {
        const file = document.getElementById('csvFile').files[0];
        if (!file) {
            this.showMessage('請選擇 CSV 檔案', 'error');
            return;
        }

        utils.readFile(file)
            .then(content => {
                this.importFromCSV(content);
                this.showMessage(`成功匯入 ${this.students.length} 位學生`, 'info');
            })
            .catch(err => {
                this.showMessage('CSV 讀取錯誤: ' + err.message, 'error');
            });
    },

    /**
     * 從 CSV 文字匯入學生資料
     * @param {string} text - CSV 文字內容
     */
    importFromCSV(text) {
        this.students = utils.parseCSV(text);
        this.renderStudentList();
    },

    /**
     * 鎖定/解鎖座位
     * @param {number} index - 座位索引
     */
    toggleLock(index) {
        if (this.disabledSeats.has(index)) {
            this.showMessage('禁用座位無法鎖定', 'warning');
            return;
        }

        if (!this.seating[index]) {
            this.showMessage('空座位無法鎖定', 'warning');
            return;
        }

        if (this.fixedSeats.has(index)) {
            this.fixedSeats.delete(index);
        } else {
            this.fixedSeats.add(index);
        }
        this.render();
        this.renderStudentList(); // 確保名單狀態正確
    },

    /**
     * 禁用/解禁座位
     * @param {number} index - 座位索引
     */
    toggleBan(index) {
        if (this.disabledSeats.has(index)) {
            // 解除禁用
            this.disabledSeats.delete(index);
        } else {
            // 禁用座位：需要將學生退回名單
            this.disabledSeats.add(index);
            
            // 如果座位上有學生，清空並退回名單（無需操作，renderStudentList 會自動顯示）
            if (this.seating[index]) {
                this.seating[index] = null;
            }
            
            // 解除鎖定
            this.fixedSeats.delete(index);
            
            // 更新矩陣
            this.visualToMatrix(index, null);
        }
        
        this.render();
        this.renderStudentList(); // 重新渲染名單，學生會回到名單
    },

    /**
     * 拖曳開始事件
     * @param {DragEvent} e - 拖曳事件
     * @param {number} index - 座位索引
     */
    handleDragStart(e, index) {
        if (this.disabledSeats.has(index) || !this.seating[index]) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'seat',
            index: index
        }));
    },

    /**
     * 拖曳經過事件
     * @param {DragEvent} e - 拖曳事件
     * @param {number} index - 座位索引
     */
    handleDragOver(e, index) {
        e.preventDefault();
        
        // 判斷拖曳來源
        let dragData;
        try {
            const jsonData = e.dataTransfer.types.includes('application/json');
            if (jsonData) {
                // 來自學生名單或座位
                if (this.disabledSeats.has(index)) {
                    e.currentTarget.classList.add('cannot-drop');
                } else if (this.fixedSeats.has(index) && this.seating[index]) {
                    e.currentTarget.classList.add('cannot-drop');
                } else {
                    e.currentTarget.classList.add('can-drop');
                }
            }
        } catch (err) {
            // 拖曳進行中無法讀取 dataTransfer 內容
            if (this.disabledSeats.has(index)) {
                e.currentTarget.classList.add('cannot-drop');
            } else {
                e.currentTarget.classList.add('can-drop');
            }
        }
    },

    /**
     * 拖曳離開事件
     * @param {DragEvent} e - 拖曳事件
     */
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over', 'can-drop', 'cannot-drop');
    },

    /**
     * 放下事件（交換、移動學生，或從名單放入）
     * @param {DragEvent} e - 拖曳事件
     * @param {number} targetIndex - 目標座位索引
     */
    handleDrop(e, targetIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over', 'can-drop', 'cannot-drop');

        // 檢查是否為禁用座位
        if (this.disabledSeats.has(targetIndex)) {
            this.showMessage('無法放置到禁用座位', 'warning');
            return;
        }

        try {
            // 嘗試解析 JSON 數據（學生名單）
            const jsonStr = e.dataTransfer.getData('application/json');
            if (jsonStr) {
                const data = JSON.parse(jsonStr);
                
                if (data.type === 'student') {
                    // 從學生名單拖入
                    this.assignStudentToSeat(data.student, targetIndex);
                    return;
                } else if (data.type === 'seat') {
                    // 座位間拖曳（使用原有邏輯）
                    const sourceIndex = data.index;
                    this.handleSeatToSeatDrag(sourceIndex, targetIndex);
                    return;
                }
            }
            
            // 備用：純文字數據（座位索引）
            const plainData = e.dataTransfer.getData('text/plain');
            if (plainData && !isNaN(plainData)) {
                const sourceIndex = parseInt(plainData);
                this.handleSeatToSeatDrag(sourceIndex, targetIndex);
            }
        } catch (err) {
            console.error('Drop error:', err);
            this.showMessage('操作失敗', 'error');
        }
    },

    /**
     * 從學生名單安排學生到座位
     */
    assignStudentToSeat(student, targetIndex) {
        // 檢查目標座位是否已被鎖定
        if (this.fixedSeats.has(targetIndex) && this.seating[targetIndex]) {
            this.showMessage('無法放置到已鎖定的座位', 'warning');
            return;
        }

        // 檢查學生是否已被安排
        const existingIndex = this.seating.findIndex(s => s && s.id === student.id);
        if (existingIndex !== -1) {
            this.showMessage(`${student.name} 已經在座位 ${existingIndex + 1}`, 'warning');
            return;
        }

        // 安排學生並自動鎖定
        this.seating[targetIndex] = student;
        this.visualToMatrix(targetIndex, student);
        this.fixedSeats.add(targetIndex);

        this.render();
        this.renderStudentList();
        this.showMessage(`已安排 ${student.name} 到座位 ${targetIndex + 1}（自動鎖定）`, 'info');
    },

    /**
     * 座位間拖曳（原有邏輯）
     */
    handleSeatToSeatDrag(sourceIndex, targetIndex) {
        if (sourceIndex === targetIndex) return;
        
        if (this.fixedSeats.has(targetIndex) && this.seating[targetIndex]) {
            this.showMessage('無法放置到已鎖定的座位', 'warning');
            return;
        }

        const sourceStudent = this.seating[sourceIndex];
        const targetStudent = this.seating[targetIndex];

        this.seating[sourceIndex] = targetStudent;
        this.seating[targetIndex] = sourceStudent;

        this.visualToMatrix(sourceIndex, targetStudent);
        this.visualToMatrix(targetIndex, sourceStudent);

        // 更新鎖定狀態
        const sourceWasFixed = this.fixedSeats.has(sourceIndex);
        const targetWasFixed = this.fixedSeats.has(targetIndex);

        if (sourceWasFixed) {
            this.fixedSeats.delete(sourceIndex);
            if (targetStudent) this.fixedSeats.add(sourceIndex);
        }
        if (targetWasFixed) {
            this.fixedSeats.delete(targetIndex);
        }
        if (sourceStudent && sourceWasFixed) {
            this.fixedSeats.add(targetIndex);
        }

        this.render();
        this.renderStudentList();
    },

    /**
     * 自動排座位（主入口）
     * @param {string} mode - 排座模式：'random', 'gender'
     */
    autoArrangeSeats(mode) {
        if (this.students.length === 0) {
            this.showMessage('請先匯入學生清單', 'warning');
            return;
        }

        const availableCount = this.seating.length - this.disabledSeats.size;
        if (this.students.length > availableCount) {
            this.showMessage(`學生人數 (${this.students.length}) 超過可用座位 (${availableCount})`, 'error');
            return;
        }

        // 執行對應的排座演算法
        if (mode === 'random') {
            // 隨機排座：自動檢測是否有鎖定座位
            if (this.fixedSeats.size > 0) {
                this.fixedArrange(); // 有鎖定座位 → 保留固定座位排座
            } else {
                this.randomArrange(); // 無鎖定座位 → 純隨機排座
            }
        } else if (mode === 'gender') {
            this.genderAlternateArrange();
        }

        // 將矩陣轉換為視覺層
        this.matrixToSeating();
        this.render();
        this.renderStudentList(); // 更新學生名單
        
        // 生成提示訊息
        this.generateArrangeMessage(mode);
    },

    /**
     * 生成排座完成的提示訊息
     * @param {string} mode - 排座模式
     */
    generateArrangeMessage(mode) {
        const lockedCount = this.fixedSeats.size;
        let message = '';

        if (mode === 'random') {
            if (lockedCount > 0) {
                message = `已完成隨機排座（保留 ${lockedCount} 個鎖定座位）`;
            } else {
                message = '已完成隨機排座';
            }
        } else if (mode === 'gender') {
            if (lockedCount > 0) {
                message = `已完成男女隔開排座（保留 ${lockedCount} 個鎖定座位）`;
            } else {
                message = '已完成男女隔開排座';
            }
        }

        this.showMessage(message, 'info');
    },

    /**
     * 隨機排座演算法（改進版：考慮鎖定座位、禁用座位，按排順序填入）
     */
    randomArrange() {
        // 保留鎖定座位的學生
        const fixedStudents = [];
        const newSeatMatrix = utils.createMatrix(this.cols, this.rows);
        
        for (const idx of this.fixedSeats) {
            if (this.seating[idx]) {
                const coords = this.visualToMatrixCoords(idx);
                newSeatMatrix[coords.row][coords.col] = this.seating[idx];
                fixedStudents.push(this.seating[idx]);
            }
        }
        
        this.seatMatrix = newSeatMatrix;
        
        // 取得可用學生（排除已鎖定的）
        const availableStudents = this.students.filter(s => 
            !fixedStudents.some(f => f.id === s.id)
        );
        
        // 洗牌
        const shuffled = utils.shuffle(availableStudents);
        let studentIndex = 0;

        // 按照「排」的順序填入：第1排 → 第2排 → ...
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                // 跳過已鎖定的座位
                if (this.seatMatrix[col][row]) continue;
                
                // 檢查是否為禁用座位（使用正確的視覺索引計算）
                const visualIndex = this.matrixToVisualIndex(col, row);
                if (this.disabledSeats.has(visualIndex)) continue;
                
                // 填入下一個學生
                if (studentIndex < shuffled.length) {
                    this.seatMatrix[col][row] = shuffled[studentIndex++];
                }
            }
        }
    },

    /**
     * 男女隔開排座演算法（優化版）
     * 先預測每個座位應該的性別，再檢查鎖定座位是否衝突
     */
    genderAlternateArrange() {
        // 處理鎖定座位
        const fixedStudents = [];
        const fixedPositions = []; // 記錄鎖定座位的矩陣位置和性別
        
        for (const idx of this.fixedSeats) {
            if (this.seating[idx]) {
                const coords = this.visualToMatrixCoords(idx);
                fixedStudents.push(this.seating[idx]);
                fixedPositions.push({
                    col: coords.row,
                    row: coords.col,
                    gender: this.seating[idx].gender,
                    visualIndex: idx
                });
            }
        }

        // 從全部學生計算男女人數（不管是否已被排定，禁用座位也不影響）
        const totalMaleCount = this.students.filter(s => s.gender === 'male').length;
        const totalFemaleCount = this.students.filter(s => s.gender === 'female').length;

        // 決定起始性別（只基於學生人數）
        let firstGender = this.calculateFirstGender(
            totalMaleCount, 
            totalFemaleCount, 
            fixedPositions
        );

        // 建立預期性別矩陣
        const expectedGenderMatrix = this.createExpectedGenderMatrix(firstGender);

        // 檢查鎖定座位是否與預期性別衝突
        const conflicts = [];
        for (const fixed of fixedPositions) {
            const expected = expectedGenderMatrix[fixed.col][fixed.row];
            if (expected && expected !== fixed.gender) {
                conflicts.push({
                    position: `第${this.getRowLabel(fixed.col)}排第${fixed.row + 1}個座位`,
                    expected: expected === 'male' ? '男生' : '女生',
                    actual: fixed.gender === 'male' ? '男生' : '女生',
                    visualIndex: fixed.visualIndex
                });
            }
        }

        // 如果有衝突，詢問使用者
        if (conflicts.length > 0) {
            let message = '發現以下鎖定座位與男女隔開規則衝突：\n\n';
            conflicts.forEach(c => {
                message += `${c.position}：應為 ${c.expected}，但鎖定了 ${c.actual}\n`;
            });
            message += '\n是否繼續排座？（將盡量保持隔開，但可能無法完美）';
            
            if (!confirm(message)) {
                this.showMessage('已取消排座，請調整鎖定座位後重試', 'info');
                return;
            }
        }

        // 開始排座
        this.seatMatrix = utils.createMatrix(this.cols, this.rows);
        
        // 先放入鎖定學生
        for (const fixed of fixedPositions) {
            this.seatMatrix[fixed.col][fixed.row] = this.seating[fixed.visualIndex];
        }

        // 可用學生池（排除已鎖定的學生）
        const availableStudents = this.students.filter(s => 
            !fixedStudents.some(f => f.id === s.id)
        );

        // 準備學生池
        let males = utils.shuffle(availableStudents.filter(s => s.gender === 'male'));
        let females = utils.shuffle(availableStudents.filter(s => s.gender === 'female'));

        // 根據預期性別矩陣填充
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                // 跳過已鎖定座位
                if (this.seatMatrix[col][row]) continue;

                // 檢查是否為禁用座位（使用正確的視覺索引計算）
                const visualIndex = this.matrixToVisualIndex(col, row);
                if (this.disabledSeats.has(visualIndex)) continue;

                const expectedGender = expectedGenderMatrix[col][row];
                let student = null;

                // 優先按照預期性別放置
                if (expectedGender === 'male' && males.length > 0) {
                    student = males.pop();
                } else if (expectedGender === 'female' && females.length > 0) {
                    student = females.pop();
                } else {
                    // 預期性別已用完，使用剩餘的
                    if (males.length > 0) {
                        student = males.pop();
                    } else if (females.length > 0) {
                        student = females.pop();
                    }
                }

                if (student) {
                    this.seatMatrix[col][row] = student;
                }
            }
        }

        // 提示結果
        if (conflicts.length > 0) {
            this.showMessage('已完成排座，但因鎖定座位衝突，部分位置可能無法完美隔開', 'warning');
        }
    },

    /**
     * 計算起始性別（優先尊重第一個位置的鎖定）
     * @param {number} maleCount - 男生總數
     * @param {number} femaleCount - 女生總數
     * @param {Array} fixedPositions - 鎖定座位資訊
     * @returns {string} 'male' 或 'female'
     */
    calculateFirstGender(maleCount, femaleCount, fixedPositions) {
        // 檢查第一個位置(左下角)是否已被鎖定
        const firstPositionFixed = fixedPositions.find(f => f.col === 0 && f.row === 0);
        
        // 優先權1：使用者指定（鎖定第一個位置）
        if (firstPositionFixed) {
            return firstPositionFixed.gender;
        }
        
        // 優先權2：根據男女人數判斷
        if (maleCount > femaleCount) {
            return 'male';
        }
        if (femaleCount > maleCount) {
            return 'female';
        }
        
        // 優先權3：男女人數相等且使用者未指定，使用固定規則
        return 'male';
    },

    /**
     * 建立預期性別矩陣（基於完美男女隔開的假設）
     * @param {string} firstGender - 第一個座位的性別
     * @returns {Array} 二維陣列，每個位置記錄預期性別
     */
    createExpectedGenderMatrix(firstGender) {
        const matrix = Array.from({ length: this.cols }, () => Array(this.rows).fill(null));
        let currentGender = firstGender;

        for (let col = 0; col < this.cols; col++) {
            // 每列的起始性別
            if (col > 0) {
                // 從第二列開始，嘗試與前一列第一個位置不同性別
                const prevFirstGender = matrix[col - 1][0];
                currentGender = prevFirstGender === 'male' ? 'female' : 'male';
            }

            for (let row = 0; row < this.rows; row++) {
                matrix[col][row] = currentGender;
                currentGender = currentGender === 'male' ? 'female' : 'male';
            }
        }

        return matrix;
    },

    /**
     * 取得排數標籤（純數字）
     * @param {number} col - 列索引
     * @returns {number} 排數
     */
    getRowLabel(col) {
        if (this.viewMode === 'bottom') {
            return col + 1;
        } else {
            return this.cols - col;
        }
    },

    /**
     * 保留固定座位排座演算法（改進版：按排順序填入）
     */
    fixedArrange() {
        // 保留鎖定座位的學生
        const fixedStudents = [];
        const newSeatMatrix = utils.createMatrix(this.cols, this.rows);
        
        for (const idx of this.fixedSeats) {
            if (this.seating[idx]) {
                const coords = this.visualToMatrixCoords(idx);
                newSeatMatrix[coords.row][coords.col] = this.seating[idx];
                fixedStudents.push(this.seating[idx]);
            }
        }
        
        this.seatMatrix = newSeatMatrix;

        // 取得可用學生（排除已鎖定的）
        const availableStudents = utils.shuffle(
            this.students.filter(s => !fixedStudents.some(f => f.id === s.id))
        );

        let studentIndex = 0;
        
        // 按照「排」的順序填入：第1排 → 第2排 → ...
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                // 跳過已鎖定的座位
                if (this.seatMatrix[col][row]) continue;
                
                // 檢查是否為禁用座位（使用正確的視覺索引計算）
                const visualIndex = this.matrixToVisualIndex(col, row);
                if (this.disabledSeats.has(visualIndex)) continue;
                
                // 填入下一個學生
                if (studentIndex < availableStudents.length) {
                    this.seatMatrix[col][row] = availableStudents[studentIndex++];
                }
            }
        }
    },

    /**
     * 視覺索引轉矩陣坐標
     * @param {number} visualIndex - 視覺索引
     * @returns {Object} {row, col} 矩陣坐標
     */
    visualToMatrixCoords(visualIndex) {
        const r = Math.floor(visualIndex / this.cols);
        const c = visualIndex % this.cols;
        
        // 根據視角模式決定矩陣坐標
        let matrixRow, matrixCol;
        
        if (this.viewMode === 'bottom') {
            // 黑板在下：最左邊是第1排，該排從下到上（matrixCol 從0到rows-1）
            matrixRow = c;
            matrixCol = this.rows - 1 - r;
        } else {
            // 黑板在上：最右邊是第1排，該排從上到下（matrixCol 從rows-1到0）
            matrixRow = this.cols - 1 - c;
            matrixCol = r;
        }
        
        return { row: matrixRow, col: matrixCol };
    },

    /**
     * 更新矩陣中的學生（從視覺索引）
     * @param {number} visualIndex - 視覺索引
     * @param {Object|null} student - 學生物件
     */
    visualToMatrix(visualIndex, student) {
        const coords = this.visualToMatrixCoords(visualIndex);
        this.seatMatrix[coords.row][coords.col] = student;
    },

    /**
     * 矩陣坐標轉視覺索引（visualToMatrixCoords 的反向操作）
     * @param {number} matrixRow - 矩陣行索引
     * @param {number} matrixCol - 矩陣列索引
     * @returns {number} 視覺索引
     */
    matrixToVisualIndex(matrixRow, matrixCol) {
        let visualRow, visualCol;
        
        if (this.viewMode === 'bottom') {
            // 黑板在下：最左邊是第1排
            visualRow = this.rows - 1 - matrixCol;
            visualCol = matrixRow;
        } else {
            // 黑板在上：最右邊是第1排
            visualRow = matrixCol;
            visualCol = this.cols - 1 - matrixRow;
        }
        
        return visualRow * this.cols + visualCol;
    },

    /**
     * 矩陣轉視覺陣列
     * 將 seatMatrix 映射到 seating[]
     */
    matrixToSeating() {
        this.seating = Array(this.rows * this.cols).fill(null);
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let matrixRow, matrixCol;
                
                if (this.viewMode === 'bottom') {
                    // 黑板在下：最左邊是第1排，該排從下到上
                    matrixRow = c;
                    matrixCol = this.rows - 1 - r;
                } else {
                    // 黑板在上：最右邊是第1排，該排從上到下
                    matrixRow = this.cols - 1 - c;
                    matrixCol = r;
                }
                
                const visualIndex = r * this.cols + c;
                this.seating[visualIndex] = this.seatMatrix[matrixRow][matrixCol];
            }
        }
    },

    /**
     * 清空座位
     */
    clearSeats() {
        if (confirm('確定要清空所有座位安排嗎？')) {
            this.seating = Array(this.rows * this.cols).fill(null);
            this.seatMatrix = utils.createMatrix(this.cols, this.rows);
            this.fixedSeats.clear();
            this.disabledSeats.clear();
            this.render();
            this.renderStudentList(); // 重新渲染名單，所有學生回到名單
            this.showMessage('座位已清空，所有學生已回到名單', 'info');
        }
    },

    /**
     * 清空所有資料
     */
    clearAllData() {
        if (confirm('確定要清空所有資料嗎？這將包括學生名單、座位安排和所有設定。')) {
            this.students = [];
            this.clearSeats();
            this.renderStudentList();
            this.showMessage('所有資料已清空', 'info');
        }
    },

    /**
     * 匯出座位表為 JSON
     */
    exportSeating() {
        const data = {
            rows: this.rows,
            cols: this.cols,
            students: this.students,
            seating: this.seating,
            fixedSeats: Array.from(this.fixedSeats),
            disabledSeats: Array.from(this.disabledSeats),
            viewMode: this.viewMode // 儲存當前視角
        };

        const filename = `座位表_${utils.formatDate()}.json`;
        utils.downloadFile(JSON.stringify(data, null, 2), filename);
        this.showMessage('座位表已匯出', 'info');
    },

    /**
     * 匯入座位表 JSON
     */
    importSeating() {
        const input = document.getElementById('jsonFileInput');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            utils.readFile(file)
                .then(content => {
                    const data = JSON.parse(content);
                    this.rows = data.rows;
                    this.cols = data.cols;
                    this.students = data.students || [];
                    this.viewMode = data.viewMode || 'bottom'; // 載入儲存的視角
                    
                    // 設定視角選單
                    document.getElementById('viewMode').value = this.viewMode;
                    
                    this.seating = data.seating || [];
                    this.fixedSeats = new Set(data.fixedSeats || []);
                    this.disabledSeats = new Set(data.disabledSeats || []);
                    
                    // 重建矩陣
                    this.seatMatrix = utils.createMatrix(this.cols, this.rows);
                    for (let i = 0; i < this.seating.length; i++) {
                        if (this.seating[i]) {
                            this.visualToMatrix(i, this.seating[i]);
                        }
                    }

                    document.getElementById('rows').value = this.rows;
                    document.getElementById('cols').value = this.cols;
                    
                    this.renderStudentList();
                    this.render();
                    this.showMessage('座位表已匯入', 'info');
                })
                .catch(err => {
                    this.showMessage('JSON 格式錯誤: ' + err.message, 'error');
                });
        };
        input.click();
    },

    /**
     * 渲染學生列表
     */
    renderStudentList() {
        const container = document.getElementById('studentListContainer');
        container.innerHTML = '';
        
        // 取得已安排的學生 ID
        const assignedStudentIds = new Set(
            this.seating.filter(s => s !== null).map(s => s.id)
        );
        
        this.students.forEach(student => {
            const div = document.createElement('div');
            div.className = 'student-item';
            div.draggable = true;
            
            // 如果學生已被安排，添加 assigned class（會隱藏）
            if (assignedStudentIds.has(student.id)) {
                div.classList.add('assigned');
            }
            
            div.innerHTML = `
                <span class="gender-icon">${utils.getGenderIcon(student.gender)}</span>
                <span>${student.id} - ${student.name}</span>
            `;
            
            // 學生名單拖曳事件
            div.addEventListener('dragstart', (e) => this.handleStudentDragStart(e, student));
            div.addEventListener('dragend', (e) => this.handleStudentDragEnd(e));
            
            container.appendChild(div);
        });

        // 更新學生計數（只計算未安排的）
        const unassignedCount = this.students.length - assignedStudentIds.size;
        document.getElementById('studentCount').textContent = `${unassignedCount}/${this.students.length}`;
        
        // 為學生名單區域添加 drop 事件（接收從座位拖回的學生）
        const studentList = document.querySelector('.student-list');
        studentList.addEventListener('dragover', (e) => this.handleStudentListDragOver(e));
        studentList.addEventListener('dragleave', (e) => this.handleStudentListDragLeave(e));
        studentList.addEventListener('drop', (e) => this.handleStudentListDrop(e));
    },

    /**
     * 學生從名單拖曳開始
     */
    handleStudentDragStart(e, student) {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'student',
            student: student
        }));
        e.currentTarget.classList.add('dragging');
    },

    /**
     * 學生拖曳結束
     */
    handleStudentDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
    },

    /**
     * 學生名單區域 dragover（接收從座位拖回的學生）
     */
    handleStudentListDragOver(e) {
        const data = e.dataTransfer.types.includes('application/json') || 
                     e.dataTransfer.types.includes('text/plain');
        if (data) {
            e.preventDefault();
            e.currentTarget.classList.add('drag-target');
        }
    },

    /**
     * 學生名單區域 dragleave
     */
    handleStudentListDragLeave(e) {
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-target');
        }
    },

    /**
     * 學生名單區域 drop（取消學生安排）
     */
    handleStudentListDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-target');
        
        try {
            // 檢查是否從座位拖回
            const plainData = e.dataTransfer.getData('text/plain');
            if (plainData && !isNaN(plainData)) {
                const sourceIndex = parseInt(plainData);
                const student = this.seating[sourceIndex];
                
                if (student) {
                    // 取消安排 + 解除鎖定
                    this.seating[sourceIndex] = null;
                    this.visualToMatrix(sourceIndex, null);
                    this.fixedSeats.delete(sourceIndex);
                    
                    this.render();
                    this.renderStudentList();
                    this.showMessage(`已取消 ${student.name} 的座位安排`, 'info');
                }
            }
        } catch (err) {
            console.error('Drop error:', err);
        }
    },

    /**
     * 渲染座位表（主渲染函式）
     */
    render() {
        const seatingArea = document.querySelector('.seating-area');
        
        // 更新視角指示器
        let viewIndicator = seatingArea.querySelector('.view-indicator');
        if (!viewIndicator) {
            viewIndicator = document.createElement('div');
            viewIndicator.className = 'view-indicator';
            seatingArea.insertBefore(viewIndicator, seatingArea.firstChild);
        }
        viewIndicator.textContent = this.viewMode === 'bottom' ? '👀 視角：黑板在下方' : '👀 視角：黑板在上方';

        // 建立或更新座位容器
        let seatsContainer = seatingArea.querySelector('.seats-container');
        if (!seatsContainer) {
            seatsContainer = document.createElement('div');
            seatsContainer.className = 'seats-container';
            seatingArea.appendChild(seatsContainer);
        }
        seatsContainer.innerHTML = '';

        // 根據視角決定元素順序
        if (this.viewMode === 'bottom') {
            // 黑板在下：座位 → 排標籤 → 黑板
            this.renderSeatsGrid(seatsContainer);
            this.renderRowLabels(seatsContainer, 'bottom');
            this.renderBlackboard(seatsContainer);
        } else {
            // 黑板在上：黑板 → 排標籤 → 座位
            this.renderBlackboard(seatsContainer);
            this.renderRowLabels(seatsContainer, 'top');
            this.renderSeatsGrid(seatsContainer);
        }

        this.updateSeatInfo();
    },

    /**
     * 渲染黑板
     * @param {HTMLElement} container - 容器元素
     */
    renderBlackboard(container) {
        const blackboard = document.createElement('div');
        blackboard.className = 'blackboard';
        blackboard.textContent = '黑板 / 講台';
        container.appendChild(blackboard);
    },

    /**
     * 渲染排標籤
     * @param {HTMLElement} container - 容器元素
     * @param {string} position - 'top' 或 'bottom'
     */
    renderRowLabels(container, position) {
        const rowLabels = document.createElement('div');
        rowLabels.className = `row-labels ${position}`;
        
        for (let c = 0; c < this.cols; c++) {
            const label = document.createElement('div');
            label.className = 'row-label';
            
            if (this.viewMode === 'bottom') {
                // 黑板在下：從左到右為第1排、第2排...
                // 第1排：最下方→最上方
                label.innerHTML = `第 ${c + 1} 排<br><small style="font-size:11px;opacity:0.8;">(下→上)</small>`;
            } else {
                // 黑板在上：從右到左為第1排、第2排...
                // 第1排：最上方→最下方
                label.innerHTML = `第 ${this.cols - c} 排<br><small style="font-size:11px;opacity:0.8;">(上→下)</small>`;
            }
            
            rowLabels.appendChild(label);
        }
        container.appendChild(rowLabels);
    },

    /**
     * 渲染座位格
     * @param {HTMLElement} container - 容器元素
     */
    renderSeatsGrid(container) {
        const grid = document.createElement('div');
        grid.id = 'seatsGrid';
        grid.className = 'seats-grid';
        grid.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;

        for (let i = 0; i < this.rows * this.cols; i++) {
            const seat = document.createElement('div');
            seat.className = 'seat';
            seat.draggable = true;
            
            const student = this.seating[i];
            
            if (student) {
                seat.classList.add('occupied', student.gender);
            }
            
            if (this.fixedSeats.has(i)) {
                seat.classList.add('fixed');
            }
            
            if (this.disabledSeats.has(i)) {
                seat.classList.add('disabled');
                seat.draggable = false;
            }

            seat.innerHTML = `
                <div class="seat-actions">
                    <button class="lock-btn ${this.fixedSeats.has(i) ? 'active' : ''}" 
                            onclick="app.toggleLock(${i})">🔒</button>
                    <button class="ban-btn ${this.disabledSeats.has(i) ? 'ban-active' : ''}" 
                            onclick="app.toggleBan(${i})">🚫</button>
                </div>
                <div class="seat-content">
                    <div class="seat-number">座位 ${i + 1}</div>
                    ${student ? `
                        <div class="student-info">
                            <div>${utils.getGenderIcon(student.gender)} ${student.name}</div>
                            <div class="student-id">座號: ${student.id}</div>
                        </div>
                    ` : '<div style="color: #ccc;">空位</div>'}
                </div>
            `;

            seat.addEventListener('dragstart', (e) => this.handleDragStart(e, i));
            seat.addEventListener('dragover', (e) => this.handleDragOver(e, i));
            seat.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            seat.addEventListener('drop', (e) => this.handleDrop(e, i));

            grid.appendChild(seat);
        }

        container.appendChild(grid);
    },

    /**
     * 更新座位資訊顯示
     */
    updateSeatInfo() {
        const occupied = this.seating.filter(s => s !== null).length;
        const total = this.rows * this.cols;
        const disabled = this.disabledSeats.size;
        document.getElementById('seatInfo').textContent = 
            `${this.rows}列 × ${this.cols}行 | 已安排: ${occupied} | 總座位: ${total} | 禁用: ${disabled}`;
    },

    /**
     * 顯示訊息
     * @param {string} text - 訊息內容
     * @param {string} type - 訊息類型：'info', 'warning', 'error'
     */
    showMessage(text, type = 'info') {
        const msg = document.getElementById('message');
        msg.textContent = text;
        msg.className = `message ${type} show`;
        setTimeout(() => {
            msg.classList.remove('show');
        }, 5000);
    }
};

// 初始化應用程式
window.onload = () => app.init();
