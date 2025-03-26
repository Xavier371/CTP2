const GRID_SIZE = 10;
const CELL_SIZE = 40;
let canvas, ctx;
let redPos, bluePos;
let edges;
let gameOver = false;
let gameMode = 'offense';
let isTwoPlayerMode = false;

window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;
    
    resetGame();
    
    document.addEventListener('keydown', (e) => handleMove(e.key));
    document.getElementById('resetButton').addEventListener('click', resetGame);
    document.getElementById('modeButton').addEventListener('click', toggleMode);
    document.getElementById('twoPlayerButton').addEventListener('click', toggleTwoPlayer);
    
    // Add Enter key reset
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') resetGame();
    });

    const modal = document.getElementById('instructionsModal');
    document.getElementById('instructionsButton').onclick = function() {
        modal.style.display = 'block';
    }
    document.getElementById('closeInstructions').onclick = function() {
        modal.style.display = 'none';
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

function toggleMode() {
    if (!isTwoPlayerMode) {
        gameMode = gameMode === 'offense' ? 'defense' : 'offense';
        document.getElementById('modeButton').textContent = gameMode.charAt(0).toUpperCase() + gameMode.slice(1);
        document.getElementById('subtitle').textContent = gameMode === 'offense' ? 
            'Try to catch the red point!' : 
            'Try to escape from the red point!';
        resetGame();
    }
}

function toggleTwoPlayer() {
    isTwoPlayerMode = !isTwoPlayerMode;
    const modeButton = document.getElementById('modeButton');
    const twoPlayerButton = document.getElementById('twoPlayerButton');
    
    if (isTwoPlayerMode) {
        modeButton.style.display = 'none';
        document.getElementById('subtitle').textContent = 'Red: WASD keys, Blue: Arrow keys';
    } else {
        modeButton.style.display = 'inline';
        document.getElementById('subtitle').textContent = gameMode === 'offense' ? 
            'You are blue, try to catch the red point' : 
            'You are blue, try to evade  the red point!';
    }
    resetGame();
}

function resetGame() {
    // Set positions based on game mode
    if (gameMode === 'offense' || isTwoPlayerMode) {
        bluePos = {x: 0, y: Math.floor(Math.random() * GRID_SIZE)};
        redPos = {x: GRID_SIZE-1, y: Math.floor(Math.random() * GRID_SIZE)};
    } else {
        bluePos = {x: GRID_SIZE-1, y: Math.floor(Math.random() * GRID_SIZE)};
        redPos = {x: 0, y: Math.floor(Math.random() * GRID_SIZE)};
    }
    
    // Initialize edges
    edges = Array(GRID_SIZE).fill().map(() => 
        Array(GRID_SIZE).fill().map(() => ({
            right: true,
            bottom: true
        }))
    );
    
    // Remove two random internal edges at start
    let internalEdgesRemoved = 0;
    while (internalEdgesRemoved < 2) {
        const i = 1 + Math.floor(Math.random() * (GRID_SIZE - 2));
        const j = 1 + Math.floor(Math.random() * (GRID_SIZE - 2));
        
        if (Math.random() < 0.5 && edges[i][j].right) {
            edges[i][j].right = false;
            internalEdgesRemoved++;
        } else if (edges[i][j].bottom) {
            edges[i][j].bottom = false;
            internalEdgesRemoved++;
        }
    }
    
    gameOver = false;
    drawGame();
}

function handleMove(key) {
    if (gameOver) return;

    if (isTwoPlayerMode) {
        // Handle WASD for red point
        if (['w', 'a', 's', 'd'].includes(key.toLowerCase())) {
            const oldPos = { ...redPos };
            switch (key.toLowerCase()) {
                case 'w': if (redPos.y > 0) redPos.y--; break;
                case 's': if (redPos.y < GRID_SIZE - 1) redPos.y++; break;
                case 'a': if (redPos.x > 0) redPos.x--; break;
                case 'd': if (redPos.x < GRID_SIZE - 1) redPos.x++; break;
            }
            if (!canMove(oldPos, redPos)) {
                redPos = oldPos;
            } else {
                removeRandomEdge();
            }
        }
        // Handle arrow keys for blue point
        else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            const oldPos = { ...bluePos };
            switch (key) {
                case 'ArrowLeft': if (bluePos.x > 0) bluePos.x--; break;
                case 'ArrowRight': if (bluePos.x < GRID_SIZE - 1) bluePos.x++; break;
                case 'ArrowUp': if (bluePos.y > 0) bluePos.y--; break;
                case 'ArrowDown': if (bluePos.y < GRID_SIZE - 1) bluePos.y++; break;
            }
            if (!canMove(oldPos, bluePos)) {
                bluePos = oldPos;
            } else {
                removeRandomEdge();
            }
        }
    } else {
        // Single player mode
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
    }
    
    checkGameOver();
    drawGame();
}

function canMove(from, to) {
    if (from.x === to.x) {
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        return minY === maxY || edges[from.x][minY].bottom;
    } else if (from.y === to.y) {
        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        return minX === maxX || edges[minX][from.y].right;
    }
    return false;
}

function removeRandomEdge() {
    const availableEdges = [];
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (i < GRID_SIZE - 1 && edges[i][j].right) {
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
    if (pos.x > 0 && edges[pos.x-1][pos.y].right) return true;
    if (pos.x < GRID_SIZE-1 && edges[pos.x][pos.y].right) return true;
    if (pos.y > 0 && edges[pos.x][pos.y-1].bottom) return true;
    if (pos.y < GRID_SIZE-1 && edges[pos.x][pos.y].bottom) return true;
    return false;
}

function checkGameOver() {
    if (Math.abs(redPos.x - bluePos.x) <= 1 && Math.abs(redPos.y - bluePos.y) <= 1) {
        if (canMove(redPos, bluePos)) {
            gameOver = true;
            alert("Blue Wins - Points are joined!");
            return true;
        }
    }
    
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
    
    // Draw grid lines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    // Draw only existing edges (where edges[][] is true)
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            // Draw right edge if it exists
            if (edges[i][j].right && i < GRID_SIZE - 1) {
                ctx.beginPath();
                ctx.moveTo((i + 1) * CELL_SIZE, j * CELL_SIZE);
                ctx.lineTo((i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.stroke();
            }
            // Draw bottom edge if it exists
            if (edges[i][j].bottom && j < GRID_SIZE - 1) {
                ctx.beginPath();
                ctx.moveTo(i * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.lineTo((i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE);
                ctx.stroke();
            }
        }
    }
    
    // Draw outer border
    ctx.strokeRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    
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
