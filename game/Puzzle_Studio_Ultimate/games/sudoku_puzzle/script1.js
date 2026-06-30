// 전역 변수
let currentBoard = [];
let solution = [];
let selectedCell = null;
let currentDifficulty = 'medium';

// 난이도별 제거할 숫자 개수
const difficultyLevels = {
    easy: { remove: 35, name: '쉬움' },
    medium: { remove: 45, name: '중간' },
    hard: { remove: 55, name: '어려움' }
};

// 게임 초기화
function init() {
    generateSudoku();
    createBoard();
    document.addEventListener('keydown', handleKeyPress);
}

// 스도쿠 퍼즐 생성
function generateSudoku() {
    // 1. 빈 보드 생성
    solution = Array(9).fill(null).map(() => Array(9).fill(0));
    
    // 2. 완전한 스도쿠 해답 생성
    fillBoard(solution);
    
    // 3. 퍼즐 생성 (해답에서 숫자 제거)
    currentBoard = solution.map(row => [...row]);
    removeNumbers(currentBoard, difficultyLevels[currentDifficulty].remove);
}

// 백트래킹으로 보드 채우기
function fillBoard(board) {
    const empty = findEmpty(board);
    if (!empty) return true; // 보드가 다 채워짐
    
    const [row, col] = empty;
    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    for (let num of numbers) {
        if (isValid(board, num, row, col)) {
            board[row][col] = num;
            
            if (fillBoard(board)) return true;
            
            board[row][col] = 0;
        }
    }
    
    return false;
}

// 빈 칸 찾기
function findEmpty(board) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === 0) return [i, j];
        }
    }
    return null;
}

// 유효한 숫자인지 확인
function isValid(board, num, row, col) {
    // 행 확인
    for (let j = 0; j < 9; j++) {
        if (board[row][j] === num) return false;
    }
    
    // 열 확인
    for (let i = 0; i < 9; i++) {
        if (board[i][col] === num) return false;
    }
    
    // 3x3 박스 확인
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[boxRow + i][boxCol + j] === num) return false;
        }
    }
    
    return true;
}

// 배열 섞기 (Fisher-Yates 알고리즘)
function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 숫자 제거 (퍼즐 생성) - 각 행에서 균등하게 제거
function removeNumbers(board, count) {
    const perRow = Math.floor(count / 9);
    const remainder = count % 9;
    
    // 각 행에서 균등하게 제거
    for (let i = 0; i < 9; i++) {
        const rowPositions = [];
        for (let j = 0; j < 9; j++) {
            rowPositions.push([i, j]);
        }
        
        // Fisher-Yates shuffle로 행 내 위치 섞기
        for (let k = rowPositions.length - 1; k > 0; k--) {
            const l = Math.floor(Math.random() * (k + 1));
            [rowPositions[k], rowPositions[l]] = [rowPositions[l], rowPositions[k]];
        }
        
        // 이 행에서 제거할 개수 (나머지를 앞에서부터 분배)
        const removeCount = perRow + (i < remainder ? 1 : 0);
        
        for (let k = 0; k < removeCount; k++) {
            const [row, col] = rowPositions[k];
            board[row][col] = 0;
        }
    }
}

// 보드 생성
function createBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            if (currentBoard[r][c] !== 0) {
                cell.classList.add('fixed');
                cell.textContent = currentBoard[r][c];
            } else {
                cell.classList.add('user-input');
            }
            
            cell.addEventListener('click', () => selectCell(r, c));
            boardEl.appendChild(cell);
        }
    }
    
    updateHighlights();
}

// 셀 선
function selectCell(row, col) {
    selectedCell = { row, col };
    updateHighlights();
}

// 하이라이트 업데이트
function updateHighlights() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('selected', 'highlight', 'same-number', 'error');
        
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const value = getCurrentValue(r, c);
        
        // 오류 체크
        if (value !== 0 && !isFixed(r, c) && hasConflict(r, c, value)) {
            cell.classList.add('error');
        }
        
        if (selectedCell) {
            const sr = selectedCell.row;
            const sc = selectedCell.col;
            const selectedValue = getCurrentValue(sr, sc);
            
            // 선택된 셀
            if (r === sr && c === sc) {
                cell.classList.add('selected');
            }
            // 같은 행, 열, 3x3 박스
            else if (r === sr || c === sc || 
                    (Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3))) {
                cell.classList.add('highlight');
            }
            
            // 같은 숫자
            if (selectedValue !== 0 && value === selectedValue) {
                cell.classList.add('same-number');
            }
        }
    });
}

// 현재 값 가져오기
function getCurrentValue(row, col) {
    if (isFixed(row, col)) {
        return currentBoard[row][col];
    }
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    return cell.textContent ? parseInt(cell.textContent) : 0;
}

// 고정된 셀인지 확인
function isFixed(row, col) {
    return currentBoard[row][col] !== 0;
}

// 충돌 확인
function hasConflict(row, col, value) {
    // 행 확인
    for (let j = 0; j < 9; j++) {
        if (j !== col && getCurrentValue(row, j) === value) return true;
    }
    
    // 열 확인
    for (let i = 0; i < 9; i++) {
        if (i !== row && getCurrentValue(i, col) === value) return true;
    }
    
    // 3x3 박스 확인
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const r = boxRow + i;
            const c = boxCol + j;
            if ((r !== row || c !== col) && getCurrentValue(r, c) === value) {
                return true;
            }
        }
    }
    
    return false;
}

// 키보드 입력 처리
function handleKeyPress(e) {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    
    // 고정된 셀도 방향키로 이동 가능
    if (e.key === 'ArrowUp' && row > 0) {
        selectCell(row - 1, col);
        e.preventDefault();
    } else if (e.key === 'ArrowDown' && row < 8) {
        selectCell(row + 1, col);
        e.preventDefault();
    } else if (e.key === 'ArrowLeft' && col > 0) {
        selectCell(row, col - 1);
        e.preventDefault();
    } else if (e.key === 'ArrowRight' && col < 8) {
        selectCell(row, col + 1);
        e.preventDefault();
    } else if (!isFixed(row, col)) {
        // 고정된 셀이 아닐 때만 숫자 입력/삭제 가능
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        
        if (e.key >= '1' && e.key <= '9') {
            cell.textContent = e.key;
            cell.classList.add('user-input');
            updateHighlights();
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            cell.textContent = '';
            updateHighlights();
        }
    }
}

// 정답 확인
function checkPuzzle() {
    const messageEl = document.getElementById('message');
    let isComplete = true;
    let isCorrect = true;
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const value = getCurrentValue(r, c);
            if (value === 0) {
                isComplete = false;
                break;
            }
            if (value !== solution[r][c]) {
                isCorrect = false;
            }
        }
    }
    
    if (!isComplete) {
        messageEl.textContent = '⚠️ 빈칸을 모두 채워주세요!';
        messageEl.style.color = '#e67e22';
    } else if (isCorrect) {
        messageEl.textContent = '🎉 축하합니다! 정답입니다! 🎉';
        messageEl.style.color = '#27ae60';
    } else {
        messageEl.textContent = '❌ 정답이 아닙니다. 빨간색 숫자를 확인해보세요.';
        messageEl.style.color = '#e74c3c';
    }
}

// 다시 풀기
function resetPuzzle() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        
        if (!isFixed(r, c)) {
            cell.textContent = '';
        }
    });
    
    document.getElementById('message').textContent = '';
    selectedCell = null;
    updateHighlights();
}

// 새로 시작 (새로운 퍼즐 생성)
function newGame() {
    generateSudoku();
    createBoard();
    document.getElementById('message').textContent = '🎮 새로운 퍼즐이 생성되었습니다!';
    document.getElementById('message').style.color = '#3498db';
    selectedCell = null;
}

// 정답 보기
function showSolution() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        cell.textContent = solution[r][c];
        if (!isFixed(r, c)) {
            cell.classList.add('user-input');
        }
    });
    
    document.getElementById('message').textContent = '💡 정답을 표시했습니다.';
    document.getElementById('message').style.color = '#2980b9';
    selectedCell = null;
    updateHighlights();
}

// 난이도 설정
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    // 버튼 스일 업데이트
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    newGame();
}

// 페이지 로드 시 초기화
window.onload = init;