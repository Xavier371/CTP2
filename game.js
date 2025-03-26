const GRID_SIZE = 10;
const CELL_SIZE = 40;
let canvas, ctx;
let redPos, bluePos;
let edges;
let gameOver = false;
let gameMode = 'offense';

window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;
    
    const modeButton = document.getElementById('modeButton');
    const resetButton = document.getElementById('resetButton');
    const instructionsButton = document.getElementById('instructionsButton');
    const closeInstructionsButton = document.getElementById('closeInstructions');
    const modal = document.getElementById('instructionsModal');
    
    resetGame();
    
    document.addEventListener('keydown', (e) => handleMove(e.key));
    resetButton.addEventListener('click', resetGame);
    
    // Add Enter key reset
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') resetGame();
    });
    
    modeButton.addEventListener('click', toggleMode);
    
    instructionsButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
    closeInstructionsButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function toggleMode() {
    gameMode = gameMode === 'offense' ? 'defense' : 'offense';
    const modeButton = document.getElementById('modeButton');
    modeButton.textContent = gameMode.charAt(0).toUpperCase() + gameMode.slice(1);
    modeButton.className = 'game-button ' + gameMode + '-mode';
    updateGameTitle();
    resetGame();
}

function updateGameTitle() {
    const subtitle = document.getElementById('subtitle');
    subtitle.textContent = gameMode === 'offense' ? 
        'Try to catch the red point!' : 
        'Try to escape from the red point!';
}

function resetGame() {
    // Set positions based on game mode
    if (gameMode === 'offense') {
        bluePos = {x: 0, y: Math.floor(Math.random() * GRID_SIZE)};
        redPos = {x: GRID_SIZE-1, y: Math.floor(Math.random() * GRID_SIZE)};
    } else {
        bluePos = {x: GRID_SIZE-1, y: Math.floor(Math.random() * GRID_SIZE)};
        redPos = {x: 0, y: Math.floor(Math.random() * GRID_SIZE)};
    }
    
    edges = Array(GRID_SIZE).fill().map(() => 
        Array(GRID_SIZE).fill().map(() => ({
            right: true,
            bottom: true
        }))
    );
    
    gameOver = false;
    drawGame();
    updateGameTitle();
}

function removeRandomEdge() {
    const availableEdges = [];
    
    // Collect all edges that won't isolate points
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (i < GRID_SIZE - 1 && edges[i][j].right) {
                // Check if removing this edge would isolate either point
                edges[i][j].right = false;
                if (hasPath(redPos) && hasPath(bluePos)) {
                    availableEdges.push({x: i, y: j, type: 'right'});
                }
                edges[i][j].right = true;
            }
            if (j < GRID_SIZE - 1 && edges[i][j].bottom) {
                edges[i][j].bottom = false;
                if (hasPath(redPos) && hasPath(bluePos)) {
                    availableEdges.push({x: i, y: j, type: 'bottom'});
                }
                edges[i][j].bottom = true;
            }
        }
    }
    
    if (availableEdges.length > 0) {
        const edge = availableEdges[Math.floor(Math.random() * availableEdges.length)];
        edges[edge.x][edge.y][edge.type] = false;
    }
}

function hasPath(pos) {
    // Check if point has at least one connected edge
    if (pos.x > 0 && edges[pos.x-1][pos.y].right) return true;
    if (pos.x < GRID_SIZE-1 && edges[pos.x][pos.y].right) return true;
    if (pos.y > 0 && edges[pos.x][pos.y-1].bottom) return true;
    if (pos.y < GRID_SIZE-1 && edges[pos.x][pos.y].bottom) return true;
    return false;
}

function handleMove(key) {
    if (gameOver) return;

    const oldPos = gameMode === 'defense' ? { ...redPos } : { ...bluePos };
    switch (key) {
        case 'ArrowLeft': if (oldPos.x > 0) oldPos.x--; break;
        case 'ArrowRight': if (oldPos.x < GRID_SIZE - 1) oldPos.x++; break;
        case 'ArrowUp': if (oldPos.y > 0) oldPos.y--; break;
        case 'ArrowDown': if (oldPos.y < GRID_SIZE - 1) oldPos.y++; break;
        default: return;
    }

    if (canMove(gameMode === 'defense' ? redPos : bluePos, oldPos)) {
        if (gameMode === 'defense') {
            redPos = oldPos;
            removeRandomEdge();
            if (!checkGameOver()) {
                moveBlueAttack();
                removeRandomEdge();
            }
        } else {
            bluePos = oldPos;
            removeRandomEdge();
            if (!checkGameOver()) {
                moveRedEvade();
                removeRandomEdge();
            }
        }
    }
    
    checkGameOver();
    drawGame();
}

function canMove(from, to) {
    if (from.x === to.x) {
        // Vertical movement
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        return minY === maxY || edges[from.x][minY].bottom;
    } else if (from.y === to.y) {
        // Horizontal movement
        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        return minX === maxX || edges[minX][from.y].right;
    }
    return false;
}

function checkGameOver() {
    // Check if points are adjacent
    if (Math.abs(redPos.x - bluePos.x) <= 1 && Math.abs(redPos.y - bluePos.y) <= 1) {
        if (canMove(redPos, bluePos)) {
            gameOver = true;
            alert("Blue Wins - Points are joined!");
            return true;
        }
    }
    
    // Check if points are separated
    const visited = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false));
    const canReach = (pos, target, visited) => {
        if (pos.x === target.x && pos.y === target.y) return true;
        visited[pos.y][pos.x] = true;
        
        const moves = [
            {x: pos.x + 1, y: pos.y},
            {x: pos.x - 1, y: pos.y},
            {x: pos.x, y: pos.y + 1},
            {x: pos.x, y: pos.y - 1}
        ];
        
        for (const move of moves) {
            if (move.x >= 0 && move.x < GRID_SIZE && 
                move.y >= 0 && move.y < GRID_SIZE && 
                !visited[move.y][move.x] && 
                canMove(pos, move)) {
                if (canReach(move, target, visited)) return true;
            }
        }
        return false;
    };
    
    if (!canReach(redPos, bluePos, visited)) {
        gameOver = true;
        alert("Blue Wins - Points are separated!");
        return true;
    }
    
    return false;
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
    
    // Draw edges
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (!edges[i][j].right && i < GRID_SIZE - 1) {
                ctx.beginPath();
                ctx.moveTo((i + 1) * CELL_SIZE, j * CELL_SIZE);
                ctx.lineTo((i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.stroke();
            }
            if (!edges[i][j].bottom && j < GRID_SIZE - 1) {
                ctx.beginPath();
                ctx.moveTo(i * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.lineTo((i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.stroke();
            }
        }
    }
    
    // Draw points
    ctx.beginPath();
    ctx.arc((redPos.x + 0.5) * CELL_SIZE, (redPos.y + 0.5) * CELL_SIZE, CELL_SIZE/3, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc((bluePos.x + 0.5) * CELL_SIZE, (bluePos.y + 0.5) * CELL_SIZE, CELL_SIZE/3, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
}

function moveRedEvade() {
    const moves = [];
    
    // Check all possible moves
    if (redPos.x > 0 && canMove(redPos, {x: redPos.x-1, y: redPos.y})) 
        moves.push({x: redPos.x-1, y: redPos.y});
    if (redPos.x < GRID_SIZE-1 && canMove(redPos, {x: redPos.x+1, y: redPos.y})) 
        moves.push({x: redPos.x+1, y: redPos.y});
    if (redPos.y > 0 && canMove(redPos, {x: redPos.x, y: redPos.y-1})) 
        moves.push({x: redPos.x, y: redPos.y-1});
    if (redPos.y < GRID_SIZE-1 && canMove(redPos, {x: redPos.x, y: redPos.y+1})) 
        moves.push({x: redPos.x, y: redPos.y+1});
    
    if (moves.length > 0) {
        // Choose move that maximizes distance from blue
        let bestMove = moves[0];
        let maxDist = Math.abs(moves[0].x - bluePos.x) + Math.abs(moves[0].y - bluePos.y);
        
        for (const move of moves) {
            const dist = Math.abs(move.x - bluePos.x) + Math.abs(move.y - bluePos.y);
            if (dist > maxDist) {
                maxDist = dist;
                bestMove = move;
            }
        }
        
        redPos = bestMove;
    }
}

function moveBlueAttack() {
    const moves = [];
    
    // Check all possible moves
    if (bluePos.x > 0 && canMove(bluePos, {x: bluePos.x-1, y: bluePos.y})) 
        moves.push({x: bluePos.x-1, y: bluePos.y});
    if (bluePos.x < GRID_SIZE-1 && canMove(bluePos, {x: bluePos.x+1, y: bluePos.y})) 
        moves.push({x: bluePos.x+1, y: bluePos.y});
    if (bluePos.y > 0 && canMove(bluePos, {x: bluePos.x, y: bluePos.y-1})) 
        moves.push({x: bluePos.x, y: bluePos.y-1});
    if (bluePos.y < GRID_SIZE-1 && canMove(bluePos, {x: bluePos.x, y: bluePos.y+1})) 
        moves.push({x: bluePos.x, y: bluePos.y+1});
    
    if (moves.length > 0) {
        // Choose move that minimizes distance to red
        let bestMove = moves[0];
        let minDist = Math.abs(moves[0].x - redPos.x) + Math.abs(moves[0].y - redPos.y);
        
        for (const move of moves) {
            const dist = Math.abs(move.x - redPos.x) + Math.abs(move.y - redPos.y);
            if (dist < minDist) {
                minDist = dist;
                bestMove = move;
            }
        }
        
        bluePos = bestMove;
    }
}
