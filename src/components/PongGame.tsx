import React, { useRef, useEffect, useState } from "react";

const WIDTH = 400;
const HEIGHT = 260;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 60;
const BALL_SIZE = 10;
const PADDLE_SPEED = 4;
const BALL_SPEED = 3;
const WIN_SCORE = 5;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

const initialGameState = () => ({
  leftY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  rightY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  ballX: WIDTH / 2 - BALL_SIZE / 2,
  ballY: HEIGHT / 2 - BALL_SIZE / 2,
  ballVX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
  ballVY: BALL_SPEED * (Math.random() * 2 - 1),
  leftScore: 0,
  rightScore: 0,
  upPressed: false,
  downPressed: false,
  wPressed: false,
  sPressed: false,
});

const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(initialGameState());
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [, setRerender] = useState(0); // force rerender for winner

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") gameRef.current.upPressed = true;
      if (e.key === "ArrowDown") gameRef.current.downPressed = true;
      if (e.key === "w" || e.key === "W") gameRef.current.wPressed = true;
      if (e.key === "s" || e.key === "S") gameRef.current.sPressed = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") gameRef.current.upPressed = false;
      if (e.key === "ArrowDown") gameRef.current.downPressed = false;
      if (e.key === "w" || e.key === "W") gameRef.current.wPressed = false;
      if (e.key === "s" || e.key === "S") gameRef.current.sPressed = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    let animationId: number;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      // Draw paddles
      ctx.fillStyle = "#222";
      ctx.fillRect(0, gameRef.current.leftY, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(WIDTH - PADDLE_WIDTH, gameRef.current.rightY, PADDLE_WIDTH, PADDLE_HEIGHT);
      // Draw ball
      ctx.fillStyle = "#0070f3";
      ctx.fillRect(gameRef.current.ballX, gameRef.current.ballY, BALL_SIZE, BALL_SIZE);
      // Draw score
      ctx.font = "20px Arial";
      ctx.fillStyle = "#444";
      ctx.textAlign = "center";
      ctx.fillText(`${gameRef.current.leftScore} : ${gameRef.current.rightScore}`, WIDTH / 2, 30);
    }

    function update() {
      // Player paddle
      if (gameRef.current.wPressed || gameRef.current.upPressed) {
        gameRef.current.leftY -= PADDLE_SPEED;
      }
      if (gameRef.current.sPressed || gameRef.current.downPressed) {
        gameRef.current.leftY += PADDLE_SPEED;
      }
      gameRef.current.leftY = clamp(gameRef.current.leftY, 0, HEIGHT - PADDLE_HEIGHT);
      // AI paddle (simple follow)
      if (gameRef.current.ballY + BALL_SIZE / 2 > gameRef.current.rightY + PADDLE_HEIGHT / 2) {
        gameRef.current.rightY += PADDLE_SPEED * 0.85;
      } else {
        gameRef.current.rightY -= PADDLE_SPEED * 0.85;
      }
      gameRef.current.rightY = clamp(gameRef.current.rightY, 0, HEIGHT - PADDLE_HEIGHT);
      // Ball movement
      gameRef.current.ballX += gameRef.current.ballVX;
      gameRef.current.ballY += gameRef.current.ballVY;
      // Collisions with top/bottom
      if (gameRef.current.ballY <= 0 || gameRef.current.ballY + BALL_SIZE >= HEIGHT) {
        gameRef.current.ballVY *= -1;
      }
      // Collisions with paddles
      // Left paddle
      if (
        gameRef.current.ballX <= PADDLE_WIDTH &&
        gameRef.current.ballY + BALL_SIZE > gameRef.current.leftY &&
        gameRef.current.ballY < gameRef.current.leftY + PADDLE_HEIGHT
      ) {
        gameRef.current.ballVX *= -1;
        // Add some spin
        gameRef.current.ballVY += (Math.random() - 0.5) * 2;
        gameRef.current.ballX = PADDLE_WIDTH;
      }
      // Right paddle
      if (
        gameRef.current.ballX + BALL_SIZE >= WIDTH - PADDLE_WIDTH &&
        gameRef.current.ballY + BALL_SIZE > gameRef.current.rightY &&
        gameRef.current.ballY < gameRef.current.rightY + PADDLE_HEIGHT
      ) {
        gameRef.current.ballVX *= -1;
        gameRef.current.ballVY += (Math.random() - 0.5) * 2;
        gameRef.current.ballX = WIDTH - PADDLE_WIDTH - BALL_SIZE;
      }
      // Score
      if (gameRef.current.ballX < 0) {
        gameRef.current.rightScore++;
        resetBall(-1);
      } else if (gameRef.current.ballX > WIDTH) {
        gameRef.current.leftScore++;
        resetBall(1);
      }
      // Check for win
      if (gameRef.current.leftScore >= WIN_SCORE) {
        setWinner("You Win!");
        setIsRunning(false);
        setRerender((r) => r + 1);
      } else if (gameRef.current.rightScore >= WIN_SCORE) {
        setWinner("AI Wins!");
        setIsRunning(false);
        setRerender((r) => r + 1);
      }
    }

    function resetBall(dir: number) {
      gameRef.current.ballX = WIDTH / 2 - BALL_SIZE / 2;
      gameRef.current.ballY = HEIGHT / 2 - BALL_SIZE / 2;
      gameRef.current.ballVX = BALL_SPEED * dir;
      gameRef.current.ballVY = BALL_SPEED * (Math.random() * 2 - 1);
    }

    function loop() {
      update();
      draw();
      if (isRunning) animationId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning]);

  const handleStart = () => {
    gameRef.current = initialGameState();
    setWinner(null);
    setIsRunning(true);
  };

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{ borderRadius: 12, background: '#f8fafc', boxShadow: '0 2px 16px #0001' }} />
      <div className="mt-2 text-xs text-gray-500">Use W/S or ↑/↓ to move. First to {WIN_SCORE} wins!</div>
      {winner && <div className="mt-2 text-lg font-bold text-blue-600">{winner}</div>}
      <button
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition"
        onClick={handleStart}
        disabled={isRunning}
      >
        {winner ? "Play Again" : "Start"}
      </button>
    </div>
  );
};

export default PongGame; 