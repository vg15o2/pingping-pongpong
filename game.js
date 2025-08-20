// Canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayMessage = document.getElementById('overlayMessage');
const playAgainBtn = document.getElementById('playAgainBtn');

// Game constants
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_RADIUS = 12;
const PADDLE_MARGIN = 20;
const PLAYER_COLOR = '#2ecc40';
const AI_COLOR = '#ff4136';
const BALL_COLOR = '#ffe066';
const LINE_COLOR = '#fff';
const WIN_SCORE = 5;
const PLAYER_SPEED = 7;
const SPEED_BOOST_MULTIPLIER = 2;

// Fullscreen / resize helpers
let defaultCanvasWidth = canvas.width;
let defaultCanvasHeight = canvas.height;

function resizeCanvas(newWidth, newHeight) {
	const previousWidth = canvas.width;
	const previousHeight = canvas.height;

	// Update the canvas internal resolution for crisp rendering
	canvas.width = Math.max(200, Math.floor(newWidth));
	canvas.height = Math.max(200, Math.floor(newHeight));

	// Scale positions proportionally to preserve relative placement
	const scaleX = canvas.width / previousWidth;
	const scaleY = canvas.height / previousHeight;
	playerY *= scaleY;
	aiY *= scaleY;
	ball.x *= scaleX;
	ball.y *= scaleY;

	// Clamp paddles within bounds after resize
	if (playerY < 0) playerY = 0;
	if (playerY > canvas.height - PADDLE_HEIGHT) playerY = canvas.height - PADDLE_HEIGHT;
	if (aiY < 0) aiY = 0;
	if (aiY > canvas.height - PADDLE_HEIGHT) aiY = canvas.height - PADDLE_HEIGHT;
}

function enterFullscreen() {
	if (!document.fullscreenElement) {
		canvas.requestFullscreen().catch(() => {});
	}
}

function exitFullscreen() {
	if (document.fullscreenElement) {
		document.exitFullscreen().catch(() => {});
	}
}

function toggleFullscreen() {
	if (document.fullscreenElement) {
		exitFullscreen();
	} else {
		enterFullscreen();
	}
}

// Adjust canvas when entering/leaving fullscreen or when the window resizes in fullscreen
document.addEventListener('fullscreenchange', function() {
	if (document.fullscreenElement === canvas) {
		resizeCanvas(window.innerWidth, window.innerHeight);
	} else {
		resizeCanvas(defaultCanvasWidth, defaultCanvasHeight);
	}
});

window.addEventListener('resize', function() {
	if (document.fullscreenElement === canvas) {
		resizeCanvas(window.innerWidth, window.innerHeight);
	}
});

// Keyboard: F to toggle fullscreen
document.addEventListener('keydown', function(e) {
	if (e.key === 'f' || e.key === 'F') {
		toggleFullscreen();
	} else if (e.key === 'Control') {
		ctrlPressed = true;
		e.preventDefault();
	} else if (e.key === 'ArrowUp') {
		upPressed = true;
		e.preventDefault();
	} else if (e.key === 'ArrowDown') {
		downPressed = true;
		e.preventDefault();
	}
});

// Arrow key release handling
document.addEventListener('keyup', function(e) {
	if (e.key === 'Control') {
		ctrlPressed = false;
		e.preventDefault();
	}
	if (e.key === 'ArrowUp') {
		upPressed = false;
		e.preventDefault();
	} else if (e.key === 'ArrowDown') {
		downPressed = false;
		e.preventDefault();
	}
});

// Double-click canvas to toggle fullscreen
canvas.addEventListener('dblclick', function() {
	toggleFullscreen();
});

// Game state
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let playerScore = 0;
let aiScore = 0;
let upPressed = false;
let downPressed = false;
let ctrlPressed = false;
let isRunning = true;
let animationId = null;

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

// Player paddle movement via arrow keys
function movePlayer() {
    const speed = ctrlPressed ? PLAYER_SPEED * SPEED_BOOST_MULTIPLIER : PLAYER_SPEED;
    if (upPressed) {
        playerY -= speed;
    }
    if (downPressed) {
        playerY += speed;
    }
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - PADDLE_HEIGHT)
        playerY = canvas.height - PADDLE_HEIGHT;
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
        if (aiScore >= WIN_SCORE) {
            endGame('You lose!');
            return;
        }
        resetBall();
    }
    if (ball.x > canvas.width) {
        playerScore++;
        if (playerScore >= WIN_SCORE) {
            endGame('You win!');
            return;
        }
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

// End game and show overlay
function endGame(message) {
    isRunning = false;
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    overlayMessage.textContent = message;
    overlay.style.display = 'flex';
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

// Restart game state
function restartGame() {
    playerScore = 0;
    aiScore = 0;
    playerY = (canvas.height - PADDLE_HEIGHT) / 2;
    aiY = (canvas.height - PADDLE_HEIGHT) / 2;
    resetBall();
    overlay.style.display = 'none';
    isRunning = true;
    animationId = requestAnimationFrame(gameLoop);
}

// Main loop
function gameLoop() {
    if (!isRunning) return;
    movePlayer();
    moveAI();
    moveBall();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

// Play again button
playAgainBtn.addEventListener('click', function() {
    restartGame();
});
