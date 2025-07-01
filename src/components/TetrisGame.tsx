import React, { useRef, useEffect, useState } from "react";

const COLS = 10;
const ROWS = 20;
const BASE_BLOCK_SIZE = 24;
const FIXED_HEIGHT = 480;

const COLORS = [
  "#000",
  "#f44336", // I
  "#2196f3", // J
  "#4caf50", // L
  "#ffeb3b", // O
  "#9c27b0", // S
  "#ff9800", // T
  "#00bcd4", // Z
];

const SHAPES = [
  [],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ], // L
  [
    [4, 4],
    [4, 4],
  ], // O
  [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ], // S
  [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // T
  [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ], // Z
];

function randomPiece() {
  const typeId = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  return {
    typeId,
    shape: SHAPES[typeId],
    x: Math.floor(COLS / 2) - 2,
    y: 0,
  };
}

function rotate(matrix: number[][]) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function collide(board: number[][], piece: any) {
  for (let y = 0; y < piece.shape.length; ++y) {
    for (let x = 0; x < piece.shape[y].length; ++x) {
      if (
        piece.shape[y][x] &&
        (board[y + piece.y] && board[y + piece.y][x + piece.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(board: number[][], piece: any) {
  piece.shape.forEach((row: number[], y: number) => {
    row.forEach((value, x) => {
      if (value) board[y + piece.y][x + piece.x] = value;
    });
  });
}

function clearLines(board: number[][]) {
  let lines = 0;
  outer: for (let y = board.length - 1; y >= 0; --y) {
    for (let x = 0; x < COLS; ++x) {
      if (!board[y][x]) continue outer;
    }
    board.splice(y, 1);
    board.unshift(Array(COLS).fill(0));
    lines++;
    y++;
  }
  return lines;
}

const TetrisGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [focused, setFocused] = useState(false);
  const [blockSize, setBlockSize] = useState(BASE_BLOCK_SIZE);
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<number[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const pieceRef = useRef<any>(randomPiece());
  const dropTime = useRef(0);

  // Responsive block size
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight || window.innerHeight * 0.8;
        const newBlockSize = Math.floor((height * 0.8) / ROWS);
        setBlockSize(Math.max(16, Math.min(newBlockSize, 64)));
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!running) return;
    let lastTime = 0;
    let animationId: number;

    function draw() {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, COLS * blockSize, ROWS * blockSize);
      // Draw board
      for (let y = 0; y < ROWS; ++y) {
        for (let x = 0; x < COLS; ++x) {
          if (boardRef.current[y][x]) {
            ctx.fillStyle = COLORS[boardRef.current[y][x]];
            ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
          }
        }
      }
      // Draw piece
      pieceRef.current.shape.forEach((row: number[], y: number) => {
        row.forEach((value, x) => {
          if (value) {
            ctx.fillStyle = COLORS[value];
            ctx.fillRect((x + pieceRef.current.x) * blockSize, (y + pieceRef.current.y) * blockSize, blockSize - 1, blockSize - 1);
          }
        });
      });
    }

    function update(time: number) {
      if (!running) return;
      const delta = time - lastTime;
      lastTime = time;
      dropTime.current += delta;
      if (dropTime.current > 500) {
        dropTime.current = 0;
        movePiece(0, 1);
      }
      draw();
      animationId = requestAnimationFrame(update);
    }
    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
    // eslint-disable-next-line
  }, [running, blockSize]);

  useEffect(() => {
    if (!running || !focused) return;
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "Space"].includes(e.key) || ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") movePiece(-1, 0);
      if (e.key === "ArrowRight") movePiece(1, 0);
      if (e.key === "ArrowDown") movePiece(0, 1);
      if (e.key === "ArrowUp") rotatePiece();
      if (e.key === " " || e.code === "Space") {
        hardDrop();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [running, gameOver, focused]);

  function movePiece(dx: number, dy: number) {
    const piece = { ...pieceRef.current, x: pieceRef.current.x + dx, y: pieceRef.current.y + dy };
    if (!collide(boardRef.current, piece)) {
      pieceRef.current = piece;
    } else if (dy === 1) {
      merge(boardRef.current, pieceRef.current);
      const lines = clearLines(boardRef.current);
      if (lines) setScore(s => s + lines * 100);
      pieceRef.current = randomPiece();
      if (collide(boardRef.current, pieceRef.current)) {
        setGameOver(true);
        setRunning(false);
      }
    }
  }

  function rotatePiece() {
    const rotated = rotate(pieceRef.current.shape);
    const piece = { ...pieceRef.current, shape: rotated };
    if (!collide(boardRef.current, piece)) {
      pieceRef.current.shape = rotated;
    }
  }

  function handleStart() {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    pieceRef.current = randomPiece();
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  function hardDrop() {
    let moved = false;
    while (!collide(boardRef.current, { ...pieceRef.current, y: pieceRef.current.y + 1 })) {
      pieceRef.current.y += 1;
      moved = true;
    }
    if (moved) movePiece(0, 1); // lock in
  }

  function handleFocus() {
    setFocused(true);
    containerRef.current?.focus();
  }
  function handleBlur() {
    setFocused(false);
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`flex flex-col items-center outline-none w-full ${focused ? 'ring-2 ring-blue-500' : ''}`}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{ width: '100%' }}
    >
      <canvas
        ref={canvasRef}
        width={COLS * blockSize}
        height={ROWS * blockSize}
        style={{
          borderRadius: 8,
          background: '#f8fafc',
          boxShadow: '0 2px 16px #0001',
          width: 'auto',
          height: '80%',
          maxHeight: '80vh',
          display: 'block',
          margin: '0 auto',
        }}
      />
      <div className="mt-2 text-xs text-gray-500">Arrow keys: move/rotate. Space: drop. Score: {score}</div>
      {gameOver && <div className="mt-2 text-lg font-bold text-red-600">Game Over</div>}
      <button
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition"
        onClick={handleStart}
        disabled={running}
      >
        {gameOver ? "Play Again" : "Start"}
      </button>
      <button
        className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded shadow hover:bg-gray-300 transition text-xs"
        onClick={handleFocus}
        style={{ outline: 'none' }}
      >
        {focused ? 'Game Focused (Spacebar enabled)' : 'Focus Game'}
      </button>
    </div>
  );
};

export default TetrisGame; 