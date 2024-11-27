const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 7,
    speed: 5, // Constant ball speed
    dx: 0,
    dy: 0,
    color: '#0095DD'
};

const paddle = {
    width: 75, // Wider paddle
    height: 12,
    x: (canvas.width - 75) / 2,
    y: canvas.height - 20,
    speed: 8
};

const brickConfig = {
    rows: 5,
    cols: 8,
    width: 48,
    height: 20,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 25,
    colors: [
        '#FF0000', // Red
        '#FF7F00', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3'  // Violet
    ],
    patterns: [
        'standard',
        'pyramid',
        'checkerboard',
        'random',
        'zigzag',
        'diamond',
        'tunnel',
        'spiral'
    ]
};

// Game state
let score = 0;
let lives = 5;
let gameOver = false;
let gameStarted = false;
let ballOnPaddle = true;
let rightPressed = false;
let leftPressed = false;
let highScore = localStorage.getItem('highScore') || 0;
let isPaused = false;
let currentLevel = 1;
let maxLevel = 15;
let combo = 1;
let lastHitTime = 0;
let comboTimeout = 1000; // 1 second to maintain combo

// DOM Elements
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeButton = document.getElementById('resumeButton');
const restartButton = document.getElementById('restartButton');
const soundToggle = document.getElementById('soundToggle');

// Sound management
const sounds = {
    background: document.getElementById('backgroundMusic'),
    hit: document.getElementById('hitSound'),
    levelUp: document.getElementById('levelUpSound'),
    gameOver: document.getElementById('gameOverSound'),
    mystery: document.getElementById('mysterySound'),
    brickHit: new Audio('audio/hit.mp3'),
    ballDrop: new Audio('audio/gameover.mp3'),
    gameOverSound: new Audio('audio/gameover.mp3')
};

let soundEnabled = true;

// Sound toggle button
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔈';
    if (soundEnabled) {
        sounds.background.play();
    } else {
        sounds.background.pause();
    }
});

// Play sound function with different variations for brick hits
function playSound(soundName, variation = 1) {
    if (soundEnabled && sounds[soundName]) {
        // For background music, just check if it's already playing
        if (soundName === 'background') {
            if (sounds.background.paused) {
                sounds.background.play();
            }
            return;
        }
        
        // For brick hits, use pitch variation
        if (soundName === 'brickHit') {
            const sound = sounds[soundName].cloneNode();
            sound.playbackRate = 0.8 + (variation * 0.2); // Vary pitch between 0.8 and 1.4
            sound.volume = sounds[soundName].volume;
            sound.play().catch(error => console.log("Sound play failed:", error));
            return;
        }
        
        // For other sounds, restart them
        const sound = sounds[soundName];
        sound.currentTime = 0;
        sound.play().catch(error => console.log("Sound play failed:", error));
    }
}

// Initialize game sounds
function initSounds() {
    // Set volumes
    sounds.background.volume = 0.3;
    sounds.hit.volume = 0.4;
    sounds.levelUp.volume = 0.5;
    sounds.gameOver.volume = 0.5;
    sounds.mystery.volume = 0.5;
    sounds.brickHit.volume = 0.3;
    sounds.ballDrop.volume = 0.4;
    sounds.gameOverSound.volume = 0.5;
    
    // Start background music
    playSound('background');
}

// Event listeners for pause and restart
resumeButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', restartGame);

// Prevent scrolling during gameplay
window.addEventListener('keydown', function(e) {
    // Space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

// Event listeners
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);

function keyDownHandler(e) {
    if(e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
        e.preventDefault();
    } else if(e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
        e.preventDefault();
    } else if(e.key === ' ' && ballOnPaddle) {
        launchBall();
        e.preventDefault();
    } else if(e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        togglePause();
        e.preventDefault();
    } else if(e.key === 'r' || e.key === 'R') {
        restartGame();
        e.preventDefault();
    }
}

function keyUpHandler(e) {
    if(e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
        e.preventDefault();
    } else if(e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
        e.preventDefault();
    }
}

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
        if(paddle.x < 0) paddle.x = 0;
        if(paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    }
}

function launchBall() {
    if(ballOnPaddle) {
        ballOnPaddle = false;
        ball.dy = -ball.speed;
        // Launch at a random angle between -60 and 60 degrees
        const angle = (Math.random() * Math.PI / 1.5) - Math.PI / 3;
        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);
        
        // Ensure minimum vertical speed on launch
        const adjustedSpeed = ensureMinVerticalSpeed(ball.dx, ball.dy);
        ball.dx = adjustedSpeed.dx;
        ball.dy = adjustedSpeed.dy;
        
        gameStarted = true;
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseOverlay.classList.toggle('active', isPaused);
    
    if (!isPaused) {
        // Resume game loop
        requestAnimationFrame(draw);
    } else {
        sounds.background.pause();
    }
}

function restartGame() {
    // Reset game state
    score = 0;
    lives = 5;
    currentLevel = 1;
    gameOver = false;
    ballOnPaddle = true;
    gameStarted = false;
    isPaused = false;
    
    // Reset ball and paddle
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.dx = 0;
    ball.dy = 0;
    paddle.width = 75;
    paddle.x = (canvas.width - paddle.width) / 2;
    
    // Update UI
    document.getElementById('score').textContent = '0';
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = '1';
    updateCombo(1);
    
    // Hide pause overlay if visible
    pauseOverlay.classList.remove('active');
    
    // Initialize new game
    initBricks();
    if (soundEnabled) {
        sounds.background.currentTime = 0;
        sounds.background.play();
    }
    requestAnimationFrame(draw);
}

// Level-specific configurations
function getLevelConfig(level) {
    return {
        brickStrength: Math.min(3, 1 + Math.floor(level / 5)),
        brickDensity: Math.min(0.9, 0.5 + (level * 0.02)),
        paddleWidth: Math.max(50, 75 - (level * 1.5))
    };
}

// Add slight randomization to ball direction
function randomizeDirection(dx, dy) {
    // Add small random angle (-5 to 5 degrees)
    const currentAngle = Math.atan2(dy, dx);
    const randomAngle = currentAngle + (Math.random() * 0.175 - 0.0875); // ±5 degrees in radians
    
    // Maintain current speed
    const speed = Math.sqrt(dx * dx + dy * dy);
    return {
        dx: Math.cos(randomAngle) * speed,
        dy: Math.sin(randomAngle) * speed
    };
}

// Ensure minimum vertical movement
function ensureMinVerticalSpeed(dx, dy) {
    const minVerticalRatio = 0.3; // Minimum 30% of speed should be vertical
    const speed = Math.sqrt(dx * dx + dy * dy);
    const absdy = Math.abs(dy);
    
    if (absdy / speed < minVerticalRatio) {
        const newdy = (dy > 0 ? 1 : -1) * speed * minVerticalRatio;
        const newdx = (dx > 0 ? 1 : -1) * Math.sqrt(speed * speed - newdy * newdy);
        return { dx: newdx, dy: newdy };
    }
    
    return { dx, dy };
}

function initBricks() {
    bricks = [];
    const levelConfig = getLevelConfig(currentLevel);
    currentPattern = brickConfig.patterns[currentLevel % brickConfig.patterns.length];
    
    // Brick types
    const BRICK_TYPES = {
        NORMAL: 'normal',
        MYSTERY: 'mystery'
    };
    
    for(let c = 0; c < brickConfig.cols; c++) {
        bricks[c] = [];
        for(let r = 0; r < brickConfig.rows; r++) {
            const brickX = (c * (brickConfig.width + brickConfig.padding)) + brickConfig.offsetLeft;
            const brickY = (r * (brickConfig.height + brickConfig.padding)) + brickConfig.offsetTop;
            
            let status = 0;
            let brickType = BRICK_TYPES.NORMAL;
            
            switch(currentPattern) {
                case 'pyramid':
                    // Create pyramid shape
                    if (r <= brickConfig.rows/2 && 
                        c >= (brickConfig.cols/2 - r) && 
                        c <= (brickConfig.cols/2 + r)) {
                        status = 1;
                    }
                    break;
                    
                case 'checkerboard':
                    // Alternating pattern
                    if ((r + c) % 2 === 0) {
                        status = 1;
                    }
                    break;
                    
                case 'zigzag':
                    // Zigzag pattern
                    if ((r % 2 === 0 && c < brickConfig.cols - 2) || 
                        (r % 2 === 1 && c > 1)) {
                        status = 1;
                    }
                    break;
                    
                case 'random':
                    // Random pattern with 70% chance of brick
                    if (Math.random() < 0.7) {
                        status = 1;
                    }
                    break;
                    
                case 'diamond':
                    if (Math.abs(c - brickConfig.cols/2) + Math.abs(r - brickConfig.rows/2) <= 3) {
                        status = 1;
                    }
                    break;
                case 'tunnel':
                    if (c === 0 || c === brickConfig.cols-1 || r === 0 || r === brickConfig.rows-1) {
                        status = 1;
                    }
                    break;
                case 'spiral':
                    const centerX = brickConfig.cols/2;
                    const centerY = brickConfig.rows/2;
                    const angle = Math.atan2(r - centerY, c - centerX);
                    const distance = Math.sqrt(Math.pow(c - centerX, 2) + Math.pow(r - centerY, 2));
                    if (angle + distance > currentLevel % 3) {
                        status = 1;
                    }
                    break;
                default: // 'standard'
                    status = 1;
                    break;
            }
            
            if (status === 1 && Math.random() < levelConfig.brickDensity) {
                const color = brickConfig.colors[Math.floor(Math.random() * brickConfig.colors.length)];
                const strength = levelConfig.brickStrength;
                
                // 10% chance for a mystery brick
                if (Math.random() < 0.1) {
                    brickType = BRICK_TYPES.MYSTERY;
                }
                
                bricks[c][r] = {
                    x: brickX,
                    y: brickY,
                    status: strength,
                    color: color,
                    type: brickType
                };
            } else {
                bricks[c][r] = { x: brickX, y: brickY, status: 0 };
            }
        }
    }
    
    // Update UI
    document.getElementById('level').textContent = currentLevel;
    updateCombo(1);
    paddle.width = levelConfig.paddleWidth;
}

function updateCombo(newCombo) {
    combo = newCombo;
    document.getElementById('combo').textContent = 'x' + combo;
}

function drawBricks() {
    for(let c = 0; c < brickConfig.cols; c++) {
        for(let r = 0; r < brickConfig.rows; r++) {
            const brick = bricks[c][r];
            if(brick.status > 0) {
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brickConfig.width, brickConfig.height);
                ctx.fillStyle = brick.color;
                ctx.fill();
                ctx.closePath();
                
                // Draw strength indicator dots
                if (brick.status > 1) {
                    const dotSpacing = 6;
                    const startX = brick.x + brickConfig.width - 10;
                    const centerY = brick.y + brickConfig.height / 2;
                    
                    for (let i = 0; i < brick.status - 1; i++) {
                        ctx.beginPath();
                        ctx.arc(startX - (i * dotSpacing), centerY, 2, 0, Math.PI * 2);
                        ctx.fillStyle = '#fff';
                        ctx.fill();
                        ctx.closePath();
                    }
                }
                
                // Draw ? symbol for mystery bricks
                if (brick.type === 'mystery') {
                    ctx.font = '16px Orbitron';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?', brick.x + brickConfig.width/2, brick.y + brickConfig.height/2);
                }
            }
        }
    }
}

function collisionDetection() {
    let hitDetected = false;
    let bricksRemaining = false;
    
    // Calculate ball's next position
    const nextBallX = ball.x + ball.dx;
    const nextBallY = ball.y + ball.dy;
    
    // Check each brick for collision
    for(let c = 0; c < brickConfig.cols; c++) {
        for(let r = 0; r < brickConfig.rows; r++) {
            const brick = bricks[c][r];
            if(brick.status > 0) {
                bricksRemaining = true;
                
                // Calculate brick edges
                const brickLeft = brick.x;
                const brickRight = brick.x + brickConfig.width;
                const brickTop = brick.y;
                const brickBottom = brick.y + brickConfig.height;
                
                // Check if ball's next position will be inside brick boundaries
                if (nextBallX + ball.radius > brickLeft && 
                    nextBallX - ball.radius < brickRight && 
                    nextBallY + ball.radius > brickTop && 
                    nextBallY - ball.radius < brickBottom) {
                    
                    // Determine which side of the brick was hit
                    const ballCenterX = ball.x;
                    const ballCenterY = ball.y;
                    
                    // Calculate distances from ball center to brick edges
                    const distLeft = Math.abs(ballCenterX - brickLeft);
                    const distRight = Math.abs(ballCenterX - brickRight);
                    const distTop = Math.abs(ballCenterY - brickTop);
                    const distBottom = Math.abs(ballCenterY - brickBottom);
                    
                    // Find the minimum distance to determine collision side
                    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
                    
                    // Reverse appropriate velocity component based on collision side
                    if (minDist === distLeft || minDist === distRight) {
                        ball.dx = -ball.dx;
                    }
                    if (minDist === distTop || minDist === distBottom) {
                        ball.dy = -ball.dy;
                    }
                    
                    // Handle mystery brick hit
                    if (brick.type === 'mystery') {
                        playSound('mystery');
                        // Award bonus points for the mystery brick
                        score += Math.floor(50 * combo);
                        document.getElementById('score').textContent = score;
                        
                        // Show special effect
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.font = '24px Orbitron';
                        ctx.fillStyle = '#00ff9d';
                        ctx.textAlign = 'center';
                        ctx.fillText('LEVEL SKIP!', canvas.width/2, canvas.height/2);
                        
                        // Prepare for next level
                        if (currentLevel < maxLevel) {
                            currentLevel++;
                            // Reset ball and paddle
                            ballOnPaddle = true;
                            ball.dx = 0;
                            ball.dy = 0;
                            ball.x = paddle.x + paddle.width/2;
                            ball.y = paddle.y - ball.radius;
                            
                            // Start next level after a short delay
                            setTimeout(() => {
                                // Initialize new level
                                initBricks();
                                // Update level display
                                document.getElementById('level').textContent = currentLevel;
                                // Reset combo
                                updateCombo(1);
                                // Clear the screen
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                            }, 1500);
                            
                            return true;
                        } else {
                            showVictoryScreen();
                            return true;
                        }
                    }
                    
                    brick.status--;
                    playSound('brickHit', Math.random());
                    
                    // Combo system
                    const now = Date.now();
                    if (now - lastHitTime < comboTimeout) {
                        updateCombo(Math.min(combo + 0.5, 4));
                    } else {
                        updateCombo(1);
                    }
                    lastHitTime = now;
                    
                    // Score calculation
                    const baseScore = 5;
                    score += Math.floor(baseScore * combo);
                    document.getElementById('score').textContent = score;
                    
                    if(score > highScore) {
                        highScore = score;
                        localStorage.setItem('highScore', highScore);
                        document.getElementById('highScore').textContent = highScore;
                    }
                    
                    hitDetected = true;
                }
            }
        }
    }
    
    // Check if level is complete
    if (!bricksRemaining) {
        startNextLevel();
    }
    
    return hitDetected;
}

function startNextLevel() {
    if (currentLevel < maxLevel) {
        playSound('levelUp');
        // Stop ball movement
        ballOnPaddle = true;
        ball.dx = 0;
        ball.dy = 0;
        
        // Show level completion message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '24px Orbitron';
        ctx.fillStyle = '#00ff9d';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL ' + currentLevel + ' COMPLETE!', canvas.width/2, canvas.height/2 - 30);
        
        // Show bonus points
        const levelBonus = currentLevel * 100;
        score += levelBonus;
        document.getElementById('score').textContent = score;
        
        ctx.font = '18px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.fillText('BONUS: ' + levelBonus + ' POINTS', canvas.width/2, canvas.height/2 + 10);
        ctx.fillText('GET READY FOR LEVEL ' + (currentLevel + 1), canvas.width/2, canvas.height/2 + 40);
        
        // Increment level immediately
        currentLevel++;
        
        // Start next level after delay
        setTimeout(() => {
            document.getElementById('level').textContent = currentLevel;
            
            // Reset ball and paddle position
            ball.x = paddle.x + paddle.width/2;
            ball.y = canvas.height - 30;
            paddle.x = (canvas.width - paddle.width) / 2;
            
            // Update paddle width for new level
            const levelConfig = getLevelConfig(currentLevel);
            paddle.width = levelConfig.paddleWidth;
            
            // Reset combo
            updateCombo(1);
            
            // Initialize new level
            initBricks();
            
            // Clear the screen and continue game
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 3000);
    } else {
        // Game completed
        sounds.background.pause();
        playSound('gameOverSound');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '28px Orbitron';
        ctx.fillStyle = '#00ff9d';
        ctx.textAlign = 'center';
        ctx.fillText('CONGRATULATIONS!', canvas.width/2, canvas.height/2 - 40);
        
        ctx.font = '20px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.fillText('YOU COMPLETED ALL LEVELS!', canvas.width/2, canvas.height/2);
        ctx.fillText('FINAL SCORE: ' + score, canvas.width/2, canvas.height/2 + 40);
        
        // Add completion bonus
        const completionBonus = 1000;
        score += completionBonus;
        
        setTimeout(() => {
            ctx.font = '18px Orbitron';
            ctx.fillStyle = '#00ff9d';
            ctx.fillText('COMPLETION BONUS: ' + completionBonus + ' POINTS', canvas.width/2, canvas.height/2 + 80);
            ctx.fillText('PRESS R TO PLAY AGAIN', canvas.width/2, canvas.height/2 + 120);
            document.getElementById('score').textContent = score;
            
            if(score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('NEW HIGH SCORE!', canvas.width/2, canvas.height/2 - 80);
            }
        }, 1000);
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

function drawStartMessage() {
    if(!gameStarted) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#0095DD';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', canvas.width/2, canvas.height/2);
    }
}

function drawPauseScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pause text
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2 - 30);
    
    // Instructions
    ctx.font = '20px Arial';
    ctx.fillText('Press P or ESC to Resume', canvas.width/2, canvas.height/2 + 20);
    
    // Controls reminder
    ctx.font = '16px Arial';
    ctx.fillText('← → : Move Paddle', canvas.width/2, canvas.height/2 + 60);
    ctx.fillText('SPACE : Launch Ball', canvas.width/2, canvas.height/2 + 85);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '48px Orbitron';
    ctx.fillStyle = '#ff0000';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);
    
    ctx.font = '24px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.fillText('Final Score: ' + score, canvas.width/2, canvas.height/2 + 10);
    
    if (score > highScore) {
        ctx.fillStyle = '#00ff9d';
        ctx.fillText('NEW HIGH SCORE!', canvas.width/2, canvas.height/2 + 50);
    }
    
    ctx.font = '18px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.fillText('Press SPACE to play again', canvas.width/2, canvas.height/2 + 90);
}

function checkGameOver() {
    if (lives <= 0) {
        gameOver = true;
        playSound('gameOver');
        drawGameOver();
        return true;
    }
    return false;
}

function draw() {
    if (gameOver || isPaused) {
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    
    if (!gameStarted) {
        drawStartMessage();
    }
    
    if(ballOnPaddle) {
        ball.x = paddle.x + paddle.width/2;
        ball.y = paddle.y - ball.radius;
    } else {
        // Ball movement and collision logic
        const nextX = ball.x + ball.dx;
        const nextY = ball.y + ball.dy;
        
        // Wall collisions with randomization
        if(nextX + ball.radius > canvas.width || nextX - ball.radius < 0) {
            ball.dx = -ball.dx;
            // Add slight randomization to prevent infinite bounces
            const newDirection = randomizeDirection(ball.dx, ball.dy);
            ball.dx = newDirection.dx;
            ball.dy = newDirection.dy;
            
            // Ensure minimum vertical movement
            const adjustedSpeed = ensureMinVerticalSpeed(ball.dx, ball.dy);
            ball.dx = adjustedSpeed.dx;
            ball.dy = adjustedSpeed.dy;
        }
        
        if(nextY - ball.radius < 0) {
            ball.dy = -ball.dy;
            // Add slight randomization on ceiling hits
            const newDirection = randomizeDirection(ball.dx, ball.dy);
            ball.dx = newDirection.dx;
            ball.dy = newDirection.dy;
        }
        
        // Paddle collision with improved angle calculation
        if(nextY + ball.radius > paddle.y) {
            if(nextX > paddle.x && nextX < paddle.x + paddle.width) {
                // Calculate hit position relative to paddle center (-1 to 1)
                const hitPoint = (nextX - (paddle.x + paddle.width/2)) / (paddle.width/2);
                
                // Calculate new angle (maximum 75 degrees)
                const maxAngle = Math.PI * 0.75;
                const angle = hitPoint * maxAngle;
                
                // Set new velocity based on angle
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                ball.dx = Math.sin(angle) * speed;
                ball.dy = -Math.abs(Math.cos(angle) * speed);
                
                // Add slight randomization to prevent patterns
                const newDirection = randomizeDirection(ball.dx, ball.dy);
                ball.dx = newDirection.dx;
                ball.dy = -Math.abs(newDirection.dy); // Ensure upward movement
                
                // Ensure ball is above paddle
                ball.y = paddle.y - ball.radius;
            } else if(nextY + ball.radius > canvas.height) {
                // Ball dropped past paddle
                playSound('ballDrop');
                lives--;
                document.getElementById('lives').textContent = lives;
                
                if (!checkGameOver()) {
                    ballOnPaddle = true;
                    ball.dx = 0;
                    ball.dy = 0;
                }
            }
        }
        
        ball.x += ball.dx;
        ball.y += ball.dy;
    }
    
    // Check for collisions with bricks
    collisionDetection();
    
    // Paddle movement
    if(rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }
    if(leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    
    requestAnimationFrame(draw);
}

function showVictoryScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '28px Orbitron';
    ctx.fillStyle = '#00ff9d';
    ctx.textAlign = 'center';
    ctx.fillText('CONGRATULATIONS!', canvas.width/2, canvas.height/2 - 40);
    
    ctx.font = '20px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.fillText('YOU COMPLETED ALL LEVELS!', canvas.width/2, canvas.height/2);
    ctx.fillText('FINAL SCORE: ' + score, canvas.width/2, canvas.height/2 + 40);
    
    // Add completion bonus
    const completionBonus = 1000;
    score += completionBonus;
    
    setTimeout(() => {
        ctx.font = '18px Orbitron';
        ctx.fillStyle = '#00ff9d';
        ctx.fillText('COMPLETION BONUS: ' + completionBonus + ' POINTS', canvas.width/2, canvas.height/2 + 80);
        ctx.fillText('PRESS R TO PLAY AGAIN', canvas.width/2, canvas.height/2 + 120);
        document.getElementById('score').textContent = score;
        
        if(score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            ctx.fillStyle = '#FFD700';
            ctx.fillText('NEW HIGH SCORE!', canvas.width/2, canvas.height/2 - 80);
        }
    }, 1000);
}

function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '28px Orbitron';
    ctx.fillStyle = '#FF0000';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);
    
    ctx.font = '18px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.fillText('Final Score: ' + score, canvas.width/2, canvas.height/2 + 10);
    ctx.fillText('Press R to Restart', canvas.width/2, canvas.height/2 + 40);
    
    if(score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        ctx.fillStyle = '#00ff9d';
        ctx.fillText('NEW HIGH SCORE!', canvas.width/2, canvas.height/2 - 60);
    }
}

// Initialize game
initSounds();
initBricks();
document.getElementById('score').textContent = '0';
document.getElementById('lives').textContent = lives;
document.getElementById('highScore').textContent = highScore;
draw();
