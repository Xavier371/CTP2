const GRID_SIZE = 6;
const CELL_SIZE = 80;
const POINT_RADIUS = 8;
const POINT_OFFSET = CELL_SIZE / 2;

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

canvas.width = CELL_SIZE * GRID_SIZE;
canvas.height = CELL_SIZE * GRID_SIZE;

let bluePos = { x: 0, y: GRID_SIZE - 1 };
let redPos = { x: GRID_SIZE - 1, y: 0 };
let edges = [];
let gameOver = false;
let gameMode = 'offense'; // 'offense', 'defense', or 'twoPlayer'
let redTurn = true; // Red always moves first

function updateGameTitle() {
    const title = document.getElementById('gameTitle');
    if (gameMode === 'offense') {
        title.innerHTML = 'You are the <span style="color: blue">blue</span> point, try to <i>catch</i> the <span style="color: red">red</span> point';
    } else if (gameMode === 'defense') {
        title.innerHTML = 'You are the <span style="color: blue">blue</span> point, try to <i>evade</i> the <span style="color: red">red</span> point';
    } else {
        title.innerHTML = 'Two Player Mode';
    }
}

function initializePositions() {
    if (gameMode === 'offense') {
        bluePos = { x: 0, y: Math.floor(Math.random() * GRID_SIZE) };
        redPos = { x: GRID_SIZE - 1, y: Math.floor(Math.random() * GRID_SIZE) };
    } else if (gameMode === 'defense') {
        bluePos = { x: GRID_SIZE - 1, y: Math.floor(Math.random() * GRID_SIZE) };
        redPos = { x: 0, y: Math.floor(Math.random() * GRID_SIZE) };
    } else {
        bluePos = { x: 0, y: Math.floor(Math.random() * GRID_SIZE) };
        redPos = { x: GRID_SIZE - 1, y: Math.floor(Math.random() * GRID_SIZE) };
    }
}

function initializeEdges() {
    edges = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE - 1; x++) {
            edges.push({ x1: x, y1: y, x2: x + 1, y2: y, active: true });
        }
    }
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 1; y++) {
            edges.push({ x1: x, y1: y, x2: x, y2: y + 1, active: true });
        }
    }
    removeInitialEdges();
}

function removeInitialEdges() {
    let internalEdges = edges.filter(edge => {
        return !(edge.x1 === 0 || edge.x1 === GRID_SIZE - 1 || 
                 edge.x2 === 0 || edge.x2 === GRID_SIZE - 1 ||
                 edge.y1 === 0 || edge.y1 === GRID_SIZE - 1 || 
                 edge.y2 === 0 || edge.y2 === GRID_SIZE - 1);
    });
    
    for (let i = 0; i < 3; i++) {
        if (internalEdges.length > 0) {
            const randomIndex = Math.floor(Math.random() * internalEdges.length);
            const selectedEdge = internalEdges[randomIndex];
            const mainEdgeIndex = edges.findIndex(edge => 
                edge.x1 === selectedEdge.x1 && 
                edge.y1 === selectedEdge.y1 && 
                edge.x2 === selectedEdge.x2 && 
                edge.y2 === selectedEdge.y2
            );
            if (mainEdgeIndex !== -1) {
                edges[mainEdgeIndex].active = false;
            }
            internalEdges.splice(randomIndex, 1);
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    edges.forEach(edge => {
        if (edge.active) {
            ctx.beginPath();
            ctx.moveTo(edge.x1 * CELL_SIZE + POINT_OFFSET, edge.y1 * CELL_SIZE + POINT_OFFSET);
            ctx.lineTo(edge.x2 * CELL_SIZE + POINT_OFFSET, edge.y2 * CELL_SIZE + POINT_OFFSET);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });

    const drawPoint = (pos, color) => {
        ctx.beginPath();
        ctx.arc(
            pos.x * CELL_SIZE + POINT_OFFSET,
            pos.y * CELL_SIZE + POINT_OFFSET,
            POINT_RADIUS,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
        drawPoint(bluePos, '#8A2BE2');
    } else {
        drawPoint(redPos, 'red');
        drawPoint(bluePos, 'blue');
    }
}

function getValidMoves(pos) {
    const moves = [];
    const directions = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];

    directions.forEach(dir => {
        const newPos = { x: pos.x + dir.dx, y: pos.y + dir.dy };
        if (newPos.x >= 0 && newPos.x < GRID_SIZE && 
            newPos.y >= 0 && newPos.y < GRID_SIZE && 
            canMove(pos, newPos)) {
            moves.push(newPos);
        }
    });
    return moves;
}

function canMove(from, to) {
    return edges.some(edge => 
        edge.active && 
        ((edge.x1 === from.x && edge.y1 === from.y && edge.x2 === to.x && edge.y2 === to.y) ||
         (edge.x2 === from.x && edge.y2 === from.y && edge.x1 === to.x && edge.y1 === to.y))
    );
}

function moveRedEvade() {
    const validMoves = getValidMoves(redPos);
    if (validMoves.length === 0) return false;

    const shortestPathToBlue = findShortestPath(redPos, bluePos);

    const scoredMoves = validMoves.map(move => {
        let score = 0;

        if (shortestPathToBlue && shortestPathToBlue[1] && 
            move.x === shortestPathToBlue[1].x && move.y === shortestPathToBlue[1].y) {
            score -= 100;
        }

        const longestPath = findLongestPathAwayFromBlue(move);
        score += longestPath.length;

        return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    redPos = scoredMoves[0].move;
    return true;
}

function findShortestPath(start, end) {
    const visited = new Set();
    const queue = [[start]];
    
    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];
        const key = `${current.x},${current.y}`;
        
        if (current.x === end.x && current.y === end.y) return path;
        if (visited.has(key)) continue;
        
        visited.add(key);
        const moves = getValidMoves(current);
        moves.forEach(move => {
            if (!visited.has(`${move.x},${move.y}`)) {
                queue.push([...path, move]);
            }
        });
    }
    
    return null;
}

function findLongestPathAwayFromBlue(start) {
    const visited = new Set();
    const queue = [[start]];
    let longestPath = [];

    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];
        const key = `${current.x},${current.y}`;

        if (visited.has(key)) continue;
        visited.add(key);

        const moves = getValidMoves(current);
        moves.forEach(move => {
            if (!visited.has(`${move.x},${move.y}`)) {
                const newPath = [...path, move];
                queue.push(newPath);

                if (newPath.length > longestPath.length) {
                    longestPath = newPath;
                }
            }
        });
    }

    return longestPath;
}

function checkGameOver() {
    if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
        gameOver = true;
        document.getElementById('message').textContent = 'Blue Wins - Points are joined';
        return true;
    }
    
    const path = findShortestPath(bluePos, redPos);
    if (!path) {
        gameOver = true;
        document.getElementById('message').textContent = 'Red Wins - Points are separated';
        return true;
    }
    
    return false;
}

function handleMove(key) {
    if (gameOver) return;

    const oldPos = { ...bluePos };
    switch (key) {
        case 'ArrowLeft': if (bluePos.x > 0) bluePos.x--; break;
        case 'ArrowRight': if (bluePos.x < GRID_SIZE - 1) bluePos.x++; break;
        case 'ArrowUp': if (bluePos.y > 0) bluePos.y--; break;
        case 'ArrowDown': if (bluePos.y < GRID_SIZE - 1) bluePos.y++; break;
        default: return;
    }

    if (canMove(oldPos, bluePos)) {
        removeRandomEdge();
        if (!checkGameOver()) {
            moveRedEvade();
            removeRandomEdge();
            checkGameOver();
        }
    } else {
        bluePos = oldPos;
    }
    
    drawGame();
}

function resetGame() {
    gameOver = false;
    redTurn = true;
    document.getElementById('message').textContent = '';
    initializeEdges();
    initializePositions();
    updateGameTitle();
    drawGame();
}

document.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.key === 'Enter') {
        resetGame();
        return;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        handleMove(e.key);
    }
});

resetGame();
