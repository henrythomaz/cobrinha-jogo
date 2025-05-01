// Configurações iniciais
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const size = 30;

// Elementos da UI
const scoreElement = document.querySelector(".score-value");
const finalScoreElement = document.querySelector(".final-score > span");
const highScoreElement = document.querySelector(".high-score-value") || { textContent: '0' };
const menuScreen = document.querySelector(".menu-screen");
const playButton = document.querySelector(".btn-play");
const buttons = {
    up: document.querySelector(".btn-up"),
    down: document.querySelector(".btn-down"),
    left: document.querySelector(".btn-left"),
    right: document.querySelector(".btn-right")
};

// Efeitos de áudio
const eatSound = new Audio('../assets/audio.mp3');
eatSound.volume = 0.3;

// Estado do jogo
let snake = [];
let food = {};
let direction = null;
let gameLoopId = null;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let foodJustEaten = false;

// Inicialização do jogo
function initGame() {
    // Configuração do canvas
    resizeCanvas();
    
    // Posição inicial da cobra (centro do canvas)
    const startX = Math.floor(canvas.width / 2 / size) * size;
    const startY = Math.floor(canvas.height / 2 / size) * size;
    snake = [{ x: startX, y: startY }];
    
    // Comida inicial
    spawnFood();
    
    // Resetar estado
    direction = null;
    scoreElement.textContent = '00';
    highScoreElement.textContent = highScore;
    
    // Esconder menu
    menuScreen.style.display = 'none';
    canvas.style.filter = 'none';
}

// Redimensionar canvas
function resizeCanvas() {
    if (window.innerWidth <= 768) {
        canvas.width = 330;
        canvas.height = 330;
    } else {
        canvas.width = 450;
        canvas.height = 450;
    }
}

// Gerar nova comida
function spawnFood() {
    let validPosition = false;
    let newX, newY;
    
    while (!validPosition) {
        newX = randomPosition();
        newY = randomPosition();
        
        // Verifica se não está em cima da cobra
        validPosition = !snake.some(segment => segment.x === newX && segment.y === newY);
    }
    
    food = {
        x: newX,
        y: newY,
        color: randomColor(),
        dx: Math.random() < 0.5 ? 1 : -1,
        dy: Math.random() < 0.5 ? 1 : -1
    };
}

// Funções auxiliares
function randomPosition() {
    const number = Math.floor(Math.random() * (canvas.width - size));
    return Math.round(number / size) * size;
}

function randomColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
}

// Atualizar pontuação
function updateScore() {
    const currentScore = parseInt(scoreElement.textContent) + 10;
    scoreElement.textContent = currentScore < 10 ? `0${currentScore}` : currentScore;
    
    // Verificar recorde
    if (currentScore > highScore) {
        highScore = currentScore;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
        
        // Efeito visual
        highScoreElement.classList.add('pulse');
        setTimeout(() => highScoreElement.classList.remove('pulse'), 1000);
    }
}

// Desenhar elementos
function drawGrid() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#191919";
    
    for (let i = size; i < canvas.width; i += size) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawFood() {
    ctx.shadowColor = food.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = food.color;
    ctx.fillRect(food.x, food.y, size, size);
    ctx.shadowBlur = 0;
}

function drawSnake() {
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === snake.length - 1 ? "#f8f8f2" : "#ddd";
        ctx.fillRect(segment.x, segment.y, size, size);
    });
}

// Movimentação
function moveFood() {
    // Verificar bordas e inverter direção
    if (food.x <= 0 || food.x >= canvas.width - size) {
        food.dx *= -1;
        food.color = randomColor();
    }
    if (food.y <= 0 || food.y >= canvas.height - size) {
        food.dy *= -1;
        food.color = randomColor();
    }
    
    // Mover comida
    food.x += size * food.dx;
    food.y += size * food.dy;
}

// Remova a variável foodJustEaten - não será mais necessária
// let foodJustEaten = false; // REMOVER ESTA LINHA

function checkFoodCollision() {
    const head = snake[snake.length - 1];
    
    if (head.x === food.x && head.y === food.y) {
        updateScore();
        eatSound.play();
        
        // Apenas marca que a cobra deve crescer (não remove o último segmento no próximo movimento)
        // Não adicionamos um segmento aqui, isso será tratado no moveSnake()
        spawnFood();
        return true; // Indica que comeu a fruta
    }
    return false;
}

function moveSnake() {
    if (!direction) return;
    
    const head = snake[snake.length - 1];
    let newHead;
    
    switch(direction) {
        case 'up': newHead = { x: head.x, y: head.y - size }; break;
        case 'down': newHead = { x: head.x, y: head.y + size }; break;
        case 'left': newHead = { x: head.x - size, y: head.y }; break;
        case 'right': newHead = { x: head.x + size, y: head.y }; break;
    }
    
    snake.push(newHead);
    
    // Só remove a cauda se não tiver comido a fruta
    if (!checkFoodCollision()) {
        snake.shift();
    }
}

function checkWallCollision() {
    const head = snake[snake.length - 1];
    const limit = canvas.width - size;
    
    return head.x < 0 || head.x > limit || head.y < 0 || head.y > limit;
}

function checkSelfCollision() {
    const head = snake[snake.length - 1];
    // Ignora a cabeça na verificação
    return snake.slice(0, -1).some(segment => segment.x === head.x && segment.y === head.y);
}

// Game over
function gameOver() {
    clearTimeout(gameLoopId);
    finalScoreElement.textContent = scoreElement.textContent;
    menuScreen.style.display = 'flex';
    canvas.style.filter = 'blur(3px)';
}

// Loop principal
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    moveFood();
    moveSnake(); // A detecção de comida agora acontece dentro do moveSnake()
    
    if (checkWallCollision() || checkSelfCollision()) {
        return gameOver();
    }
    
    drawGrid();
    drawFood();
    drawSnake();
    
    gameLoopId = setTimeout(gameLoop, 250);
}

// Event listeners
window.addEventListener('resize', () => {
    resizeCanvas();
    initGame();
});

document.addEventListener('keydown', (e) => {
    const key = e.key;
    
    if (key === 'ArrowUp' && direction !== 'down') direction = 'up';
    if (key === 'ArrowDown' && direction !== 'up') direction = 'down';
    if (key === 'ArrowLeft' && direction !== 'right') direction = 'left';
    if (key === 'ArrowRight' && direction !== 'left') direction = 'right';
});

// Controles touch
buttons.up.addEventListener('click', () => direction !== 'down' && (direction = 'up'));
buttons.down.addEventListener('click', () => direction !== 'up' && (direction = 'down'));
buttons.left.addEventListener('click', () => direction !== 'right' && (direction = 'left'));
buttons.right.addEventListener('click', () => direction !== 'left' && (direction = 'right'));

// Botão play
playButton.addEventListener('click', () => {
    initGame();
    gameLoop();
});

// Iniciar jogo
initGame();
gameLoop();