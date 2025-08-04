// Canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_RADIUS = 12;
const PADDLE_MARGIN = 20;
const PLAYER_COLOR = '#2ecc40';
const AI_COLOR = '#ff4136';
const BALL_COLOR = '#ffe066';
const LINE_COLOR = '#fff';

// Game state
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let playerScore = 0;
let aiScore = 0;

// Ball
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 6 * (Math.random() > 0.5 ? 1 : -1),
    vy: 4 * (Math.random() > 0.5 ? 1 : -1)
};

// Mouse control for player's paddle
canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - PADDLE_HEIGHT)
        playerY = canvas.height - PADDLE_HEIGHT;
});

// Draw everything
function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw middle dashed line
    ctx.strokeStyle = LINE_COLOR;
    ctx.setLineDash([18, 14]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(PADDLE_MARGIN, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = AI_COLOR;
    ctx.fillRect(canvas.width - PADDLE_MARGIN - PADDLE_WIDTH, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Draw scores
    ctx.font = '36px Arial';
    ctx.fillStyle = LINE_COLOR;
    ctx.fillText(playerScore, canvas.width / 4, 50);
    ctx.fillText(aiScore, canvas.width * 3 / 4, 50);
}

// AI paddle movement
function moveAI() {
    const aiCenter = aiY + PADDLE_HEIGHT / 2;
    if (ball.y < aiCenter - 18) {
        aiY -= 4.5;
    } else if (ball.y > aiCenter + 18) {
        aiY += 4.5;
    }
    // Clamp
    if (aiY < 0) aiY = 0;
    if (aiY > canvas.height - PADDLE_HEIGHT)
        aiY = canvas.height - PADDLE_HEIGHT;
}

// Ball movement and collision
function moveBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top and bottom wall collision
    if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy *= -1;
    }
    if (ball.y + BALL_RADIUS > canvas.height) {
        ball.y = canvas.height - BALL_RADIUS;
        ball.vy *= -1;
    }

    // Left paddle collision (player)
    if (ball.x - BALL_RADIUS < PADDLE_MARGIN + PADDLE_WIDTH &&
        ball.y + BALL_RADIUS > playerY &&
        ball.y - BALL_RADIUS < playerY + PADDLE_HEIGHT) {
        ball.x = PADDLE_MARGIN + PADDLE_WIDTH + BALL_RADIUS;
        ball.vx *= -1.05; // Slightly increase speed on hit
        // Add some "spin"
        const hitPoint = (ball.y - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.vy += hitPoint * 4;
    }

    // Right paddle collision (AI)
    if (ball.x + BALL_RADIUS > canvas.width - PADDLE_MARGIN - PADDLE_WIDTH &&
        ball.y + BALL_RADIUS > aiY &&
        ball.y - BALL_RADIUS < aiY + PADDLE_HEIGHT) {
        ball.x = canvas.width - PADDLE_MARGIN - PADDLE_WIDTH - BALL_RADIUS;
        ball.vx *= -1.05;
        // Add some "spin"
        const hitPoint = (ball.y - (aiY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.vy += hitPoint * 4;
    }

    // Scoring
    if (ball.x < 0) {
        aiScore++;
        resetBall();
    }
    if (ball.x > canvas.width) {
        playerScore++;
        resetBall();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx = 6 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = 4 * (Math.random() > 0.5 ? 1 : -1);
}

// Main loop
function gameLoop() {
    moveAI();
    moveBall();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();