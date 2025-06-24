const PIECES = {
  wP: "♙",
  wR: "♖",
  wN: "♘",
  wB: "♗",
  wQ: "♕",
  wK: "♔",
  bP: "♟",
  bR: "♜",
  bN: "♞",
  bB: "♝",
  bQ: "♛",
  bK: "♚",
};

const initialBoard = [
  [
    { type: "R", color: "b" },
    { type: "N", color: "b" },
    { type: "B", color: "b" },
    { type: "Q", color: "b" },
    { type: "K", color: "b" },
    { type: "B", color: "b" },
    { type: "N", color: "b" },
    { type: "R", color: "b" },
  ],
  Array(8).fill({ type: "P", color: "b" }),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill({ type: "P", color: "w" }),
  [
    { type: "R", color: "w" },
    { type: "N", color: "w" },
    { type: "B", color: "w" },
    { type: "Q", color: "w" },
    { type: "K", color: "w" },
    { type: "B", color: "w" },
    { type: "N", color: "w" },
    { type: "R", color: "w" },
  ],
];

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

let board = cloneBoard(initialBoard);
let turn = "w";
let selectedSquare = null;
let legalMoves = [];
let gameOver = false;
let winner = null;

const boardEl = document.getElementById("board");
const turnIndicator = document.getElementById("turnIndicator");
const gameStatus = document.getElementById("gameStatus");
const resetBtn = document.getElementById("resetBtn");

const knightMoves = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

const kingMoves = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function renderBoard() {
  boardEl.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const squareColor = (row + col) % 2 === 0 ? "light" : "dark";
      const square = document.createElement("div");
      square.className = `square ${squareColor}`;
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = board[row][col];
      if (piece) {
        const pieceKey = piece.color + piece.type;
        square.textContent = PIECES[pieceKey];
        square.classList.add(piece.color === "w" ? "text-blue-900" : "text-red-900");
      }

      if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
        square.classList.add("highlight");
      }

      const move = legalMoves.find((m) => m.row === row && m.col === col);
      if (move) {
        square.classList.add(move.capture ? "capture-highlight" : "move-highlight");
      }

      square.addEventListener("click", () => onSquareClick(row, col));
      boardEl.appendChild(square);
    }
  }
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getPiece(row, col) {
  return inBounds(row, col) ? board[row][col] : null;
}

function isEmpty(row, col) {
  return getPiece(row, col) === null;
}

function isOpponent(row, col, color) {
  const p = getPiece(row, col);
  return p && p.color !== color;
}

function generateMoves(row, col) {
  const piece = getPiece(row, col);
  if (!piece) return [];
  const moves = [];
  const color = piece.color;

  switch (piece.type) {
    case "P": {
      const dir = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      if (isEmpty(row + dir, col)) {
        moves.push({ row: row + dir, col: col, capture: false });
        if (row === startRow && isEmpty(row + 2 * dir, col)) {
          moves.push({ row: row + 2 * dir, col: col, capture: false });
        }
      }
      for (const dc of [-1, 1]) {
        const nr = row + dir;
        const nc = col + dc;
        if (inBounds(nr, nc) && isOpponent(nr, nc, color)) {
          moves.push({ row: nr, col: nc, capture: true });
        }
      }
      break;
    }
    case "N": {
      for (const [dr, dc] of knightMoves) {
        const nr = row + dr;
        const nc = col + dc;
        if (!inBounds(nr, nc)) continue;
        const target = getPiece(nr, nc);
        moves.push({ row: nr, col: nc, capture: !!(target && target.color !== color) });
      }
      break;
    }
    case "B":
    case "R":
    case "Q": {
      const directions = [];
      if (piece.type === "B" || piece.type === "Q") {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (piece.type === "R" || piece.type === "Q") {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      for (const [dr, dc] of directions) {
        let nr = row + dr;
        let nc = col + dc;
        while (inBounds(nr, nc)) {
          const target = getPiece(nr, nc);
          if (!target) {
            moves.push({ row: nr, col: nc, capture: false });
          } else {
            if (target.color !== color) {
              moves.push({ row: nr, col: nc, capture: true });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }
    case "K": {
      for (const [dr, dc] of kingMoves) {
        const nr = row + dr;
        const nc = col + dc;
        if (!inBounds(nr, nc)) continue;
        const target = getPiece(nr, nc);
        moves.push({ row: nr, col: nc, capture: !!(target && target.color !== color) });
      }
      break;
    }
  }

  return moves;
}

function kingExists(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = getPiece(r, c);
      if (p && p.type === "K" && p.color === color) return true;
    }
  }
  return false;
}

function checkGameOver() {
  if (!kingExists("w")) {
    gameOver = true;
    winner = "b";
    return true;
  }
  if (!kingExists("b")) {
    gameOver = true;
    winner = "w";
    return true;
  }
  return false;
}

function onSquareClick(row, col) {
  if (gameOver) return;

  const piece = getPiece(row, col);

  if (!selectedSquare) {
    if (piece && piece.color === turn) {
      selectedSquare = { row, col };
      legalMoves = generateMoves(row, col);
      renderBoard();
    }
    return;
  }

  if (selectedSquare.row === row && selectedSquare.col === col) {
    selectedSquare = null;
    legalMoves = [];
    renderBoard();
    return;
  }

  const move = legalMoves.find((m) => m.row === row && m.col === col);
  if (move) {
    board[row][col] = board[selectedSquare.row][selectedSquare.col];
    board[selectedSquare.row][selectedSquare.col] = null;

    if (board[row][col].type === "P" && (row === 0 || row === 7)) {
      board[row][col].type = "Q";
    }

    turn = turn === "w" ? "b" : "w";
    selectedSquare = null;
    legalMoves = [];

    if (checkGameOver()) {
      updateStatus();
      renderBoard();
      return;
    }

    updateStatus();
    renderBoard();
  } else if (piece && piece.color === turn) {
    selectedSquare = { row, col };
    legalMoves = generateMoves(row, col);
    renderBoard();
  }
}

function updateStatus() {
  if (gameOver) {
    if (winner === "draw") {
      gameStatus.textContent = "Game ended in a draw.";
      turnIndicator.textContent = "Game Over";
      turnIndicator.className = "text-gray-700";
    } else {
      gameStatus.textContent = (winner === "w" ? "White" : "Black") + " wins! Game over.";
      turnIndicator.textContent = "Game Over";
      turnIndicator.className = "text-gray-700";
    }
  } else {
    turnIndicator.textContent = (turn === "w" ? "White" : "Black") + " to move";
    turnIndicator.className = turn === "w" ? "text-blue-600" : "text-red-600";
    gameStatus.textContent = "Game in progress...";
  }
}

function resetGame() {
  board = cloneBoard(initialBoard);
  turn = "w";
  selectedSquare = null;
  legalMoves = [];
  gameOver = false;
  winner = null;
  updateStatus();
  renderBoard();
}

resetBtn.addEventListener("click", resetGame);

resetGame();
