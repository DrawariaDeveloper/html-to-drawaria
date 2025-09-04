/*
 * Neon Runner - HTML5 Endless Runner
 * This script contains all the game logic, rendering, and event handling.
 */

// Global game state variables and constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const music = document.getElementById('bg-music');

let gameRunning = false;
let gameStarted = false;
let score = 0;
let distance = 0;
const gameSpeed = 2; // Base speed
let speedMultiplier = 1.0;

const groundY = 340;
const gravity = 0.8;
const jumpPower = -15;

// Game object arrays
let obstacles = [];
let coins = [];
let particles = [];
let buildings = [];
let clouds = [];

// Player object
const player = {
    x: 100,
    y: 300,
    width: 30,
    height: 40,
    velocityY: 0,
    jumping: false,
    onGround: true,
    color: '#00ffff',
    trail: []
};

// --- Game Initialization and Setup ---

/**
 * Initializes the background elements like buildings and clouds.
 */
function initBackground() {
    for (let i = 0; i < 10; i++) {
        buildings.push({
            x: i * 120,
            y: Math.random() * 200 + 50,
            width: 80 + Math.random() * 60,
            height: Math.random() * 150 + 100,
            color: `hsl(${Math.random() * 360}, 70%, 30%)`
        });
    }

    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 100 + 20,
            size: Math.random() * 40 + 20,
            speed: 0.5 + Math.random() * 0.5
        });
    }
}

/**
 * Creates and adds a new obstacle to the game.
 */
function createObstacle() {
    const types = ['spike', 'wall', 'pit'];
    const type = types[Math.floor(Math.random() * types.length)];

    obstacles.push({
        x: canvas.width,
        y: type === 'pit' ? groundY : groundY - 30,
        width: type === 'wall' ? 20 : 30,
        height: type === 'pit' ? 20 : 30,
        type: type,
        color: type === 'spike' ? '#ff0080' : type === 'wall' ? '#ff4000' : '#8000ff'
    });
}

/**
 * Creates and adds a new coin to the game.
 */
function createCoin() {
    coins.push({
        x: canvas.width,
        y: Math.random() * 100 + 150,
        size: 15,
        rotation: 0,
        collected: false
    });
}

/**
 * Creates and adds visual particles at a given position.
 * @param {number} x - The x-coordinate for the particles.
 * @param {number} y - The y-coordinate for the particles.
 * @param {string} color - The color of the particles.
 * @param {number} [count=10] - The number of particles to create.
 */
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * -8 - 2,
            life: 60,
            maxLife: 60,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// --- Game Logic and Update Functions ---

/**
 * Updates the player's position and state (jumping, trail).
 */
function updatePlayer() {
    if (!player.onGround) {
        player.velocityY += gravity;
    }
    player.y += player.velocityY;

    if (player.y >= groundY - player.height) {
        player.y = groundY - player.height;
        player.velocityY = 0;
        player.onGround = true;
        player.jumping = false;
    } else {
        player.onGround = false;
    }

    player.trail.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        life: 20
    });

    if (player.trail.length > 10) {
        player.trail.shift();
    }

    player.trail.forEach(point => point.life--);
    player.trail = player.trail.filter(point => point.life > 0);
}

/**
 * Updates the position of all obstacles and handles removal of off-screen obstacles.
 */
function updateObstacles() {
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed * speedMultiplier;

        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score += 10;
        }
    });
}

/**
 * Updates the position and rotation of all coins and handles collection.
 */
function updateCoins() {
    coins.forEach((coin, index) => {
        coin.x -= gameSpeed * speedMultiplier;
        coin.rotation += 0.1;

        if (coin.x + coin.size < 0) {
            coins.splice(index, 1);
        } else if (!coin.collected &&
            coin.x < player.x + player.width &&
            coin.x + coin.size > player.x &&
            coin.y < player.y + player.height &&
            coin.y + coin.size > player.y) {
            coin.collected = true;
            score += 50;
            createParticles(coin.x + coin.size / 2, coin.y + coin.size / 2, '#ffff00', 8);
            coins.splice(index, 1);
        }
    });
}

/**
 * Updates the position of background elements to create a parallax effect.
 */
function updateBackground() {
    buildings.forEach(building => {
        building.x -= gameSpeed * speedMultiplier * 0.3;
        if (building.x + building.width < 0) {
            building.x = canvas.width;
            building.height = Math.random() * 150 + 100;
            building.color = `hsl(${Math.random() * 360}, 70%, 30%)`;
        }
    });

    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.size < 0) {
            cloud.x = canvas.width;
        }
    });
}

/**
 * Updates the position and life of all particles.
 */
function updateParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3;
        particle.life--;

        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

/**
 * Checks for collision between the player and any obstacles.
 */
function checkCollisions() {
    obstacles.forEach(obstacle => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {

            createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff0000', 15);
            gameRunning = false;
            document.getElementById('finalDistance').textContent = Math.floor(distance);
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOverScreen').style.display = 'block';
        }
    });
}

// --- Drawing Functions ---

/**
 * Draws the background, including the sky, buildings, and ground.
 */
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000428');
    gradient.addColorStop(1, '#004e92');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    buildings.forEach(building => {
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, canvas.height - building.y, building.width, building.height);
        ctx.shadowColor = building.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(building.x + 2, canvas.height - building.y + 2, building.width - 4, 4);
        ctx.shadowBlur = 0;
    });

    clouds.forEach(cloud => {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#333';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

/**
 * Draws the player, including its trail and details.
 */
function drawPlayer() {
    player.trail.forEach((point, index) => {
        const alpha = point.life / 20;
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = player.color;
        ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.fillRect(player.x + 2, player.y + 2, player.width - 4, player.height - 4);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 5, player.y + 5, 20, 3);
    ctx.fillRect(player.x + 12, player.y + 8, 6, 15);
    ctx.fillRect(player.x + 8, player.y + 12, 8, 2);
    ctx.fillRect(player.x + 16, player.y + 12, 8, 2);

    if (player.onGround) {
        ctx.fillRect(player.x + 10, player.y + 23, 3, 12);
        ctx.fillRect(player.x + 17, player.y + 23, 3, 12);
    } else {
        ctx.fillRect(player.x + 8, player.y + 23, 3, 10);
        ctx.fillRect(player.x + 19, player.y + 25, 3, 8);
    }
}

/**
 * Draws all obstacles.
 */
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        if (obstacle.type === 'spike') {
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }

        ctx.shadowColor = obstacle.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(obstacle.x + 2, obstacle.y + 2, Math.max(1, obstacle.width - 4), Math.max(1, obstacle.height - 4));
        ctx.shadowBlur = 0;
    });
}

/**
 * Draws all coins.
 */
function drawCoins() {
    coins.forEach(coin => {
        ctx.save();
        ctx.translate(coin.x + coin.size / 2, coin.y + coin.size / 2);
        ctx.rotate(coin.rotation);

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, coin.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, coin.size - 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(0, 0, coin.size - 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

/**
 * Draws all particles.
 */
function drawParticles() {
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
}

// --- Main Game Loop and Control Functions ---

/**
 * The main game loop that updates and draws all game elements.
 */
function gameLoop() {
    if (!gameRunning) return;

    speedMultiplier = 1.0 + distance / 1000;
    distance += gameSpeed * speedMultiplier * 0.1;

    document.getElementById('score').textContent = score;
    document.getElementById('distance').textContent = Math.floor(distance);
    document.getElementById('speed').textContent = speedMultiplier.toFixed(1);

    if (Math.random() < 0.008) createObstacle();
    if (Math.random() < 0.015) createCoin();

    updatePlayer();
    updateObstacles();
    updateCoins();
    updateBackground();
    updateParticles();
    checkCollisions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPlayer();
    drawObstacles();
    drawCoins();
    drawParticles();

    requestAnimationFrame(gameLoop);
}

/**
 * Makes the player jump.
 */
function jump() {
    if (player.onGround && gameRunning) {
        player.velocityY = jumpPower;
        player.jumping = true;
        player.onGround = false;
    }
}

/**
 * Starts the game from the main menu.
 */
window.startGame = function() {
    document.getElementById('startScreen').style.display = 'none';
    gameRunning = true;
    gameStarted = true;
    gameLoop();
}

/**
 * Restarts the game after a game over.
 */
window.restartGame = function() {
    gameRunning = true;
    score = 0;
    distance = 0;
    speedMultiplier = 1.0;

    player.x = 100;
    player.y = 300;
    player.velocityY = 0;
    player.jumping = false;
    player.onGround = true;
    player.trail = [];

    obstacles = [];
    coins = [];
    particles = [];

    document.getElementById('gameOverScreen').style.display = 'none';
    gameLoop();
}

// --- Event Listeners and Initial Setup ---

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);

document.body.addEventListener('click', () => {
    if (music.paused) {
        music.play();
    }
});

initBackground();
