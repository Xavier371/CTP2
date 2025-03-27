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

function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
    };
}

// Modified to handle starting positions based on game mode
function initializePositions() {
    if (gameMode === 'offense') {
        // Blue starts on left, red on right
        bluePos = {
            x: 0,
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        redPos = {
            x: GRID_SIZE - 1,
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } else if (gameMode === 'defense') {
        // Blue starts on right, red on left
        bluePos = {
            x: GRID_SIZE - 1,
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        redPos = {
            x: 0,
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } else {
        // Two player mode - also start on opposite sides
        // Blue on left, red on right (like offense mode)
        bluePos = {
            x: 0,
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        redPos = {
            x: GRID_SIZE - 1,
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    }
}

function initializeEdges() {
    edges = [];
    // Horizontal edges
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE - 1; x++) {
            edges.push({
                x1: x, y1: y,
                x2: x + 1, y2: y,
                active: true
            });
        }
    }
    // Vertical edges
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 1; y++) {
            edges.push({
                x1: x, y1: y,
                x2: x, y2: y + 1,
                active: true
            });
        }
    }
    // Remove two random edges at start
    removeInitialEdges();
}

function removeInitialEdges() {
    let internalEdges = edges.filter(edge => {
        // Check if edge is internal (not on the border)
        return !(edge.x1 === 0 || edge.x1 === GRID_SIZE - 1 || 
                edge.x2 === 0 || edge.x2 === GRID_SIZE - 1 ||
                edge.y1 === 0 || edge.y1 === GRID_SIZE - 1 || 
                edge.y2 === 0 || edge.y2 === GRID_SIZE - 1);
    });
    
    // Remove three random internal edges
    for (let i = 0; i < 3; i++) {
        if (internalEdges.length > 0) {
            const randomIndex = Math.floor(Math.random() * internalEdges.length);
            const selectedEdge = internalEdges[randomIndex];
            
            // Find and deactivate the edge in the main edges array
            const mainEdgeIndex = edges.findIndex(edge => 
                edge.x1 === selectedEdge.x1 && 
                edge.y1 === selectedEdge.y1 && 
                edge.x2 === selectedEdge.x2 && 
                edge.y2 === selectedEdge.y2
            );
            
            if (mainEdgeIndex !== -1) {
                edges[mainEdgeIndex].active = false;
            }
            
            // Remove the selected edge from internalEdges
            internalEdges.splice(randomIndex, 1);
        }
    }
}
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
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

    // Draw points
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
        drawPoint(bluePos, '#8A2BE2'); // Purple when overlapping
    } else {
        drawPoint(redPos, 'red');
        drawPoint(bluePos, 'blue');
    }
}

function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function isEdgeBetweenPoints(edge, pos1, pos2) {
    return (
        (edge.x1 === pos1.x && edge.y1 === pos1.y && edge.x2 === pos2.x && edge.y2 === pos2.y) ||
        (edge.x2 === pos1.x && edge.y2 === pos1.y && edge.x1 === pos2.x && edge.y1 === pos2.y)
    );
}

function removeRandomEdge() {
    const activeEdges = edges.filter(edge => {
        if (!edge.active) return false;
        // Don't remove edge between points if they're adjacent
        if (getDistance(bluePos, redPos) === 1 && 
            isEdgeBetweenPoints(edge, bluePos, redPos)) {
            return false;
        }
        return true;
    });

    if (activeEdges.length > 0) {
        const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
        edge.active = false;
        return true;
    }
    return false;
}

function canMove(from, to) {
    return edges.some(edge => 
        edge.active && 
        ((edge.x1 === from.x && edge.y1 === from.y && edge.x2 === to.x && edge.y2 === to.y) ||
         (edge.x2 === from.x && edge.y2 === from.y && edge.x1 === to.x && edge.y1 === to.y))
    );
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
function moveRedEvade() {
    const validMoves = getValidMoves(redPos);
    if (validMoves.length === 0) return false;

    // Calculate "electric field" direction from blue (battery) to red (electron)
    const fieldVector = {
        x: redPos.x - bluePos.x,
        y: redPos.y - bluePos.y
    };

    function calculatePathFreedom(pos) {
        // Count number of available moves in each direction up to 3 steps away
        let freedom = 0;
        let visited = new Set();
        let queue = [{pos: pos, depth: 0}];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.pos.x},${current.pos.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (current.depth < 3) {
                const nextMoves = getValidMoves(current.pos);
                freedom += nextMoves.length;
                nextMoves.forEach(move => {
                    queue.push({pos: move, depth: current.depth + 1});
                });
            }
        }
        return freedom;
    }

    function scoreMoveWithField(move) {
        // Calculate how well this move aligns with the field direction
        const moveVector = {
            x: move.x - redPos.x,
            y: move.y - redPos.y
        };

        // Dot product to see how well move aligns with field
        const alignment = (moveVector.x * fieldVector.x + moveVector.y * fieldVector.y);
        
        // Calculate freedom score
        const freedom = calculatePathFreedom(move);
        
        // Distance from blue
        const distanceFromBlue = Math.abs(move.x - bluePos.x) + Math.abs(move.y - bluePos.y);
        
        // Combine scores - heavily weight freedom when cornered
        const isCorner = validMoves.length <= 2;
        const freedomWeight = isCorner ? 2 : 1;
        
        return {
            pos: move,
            score: (alignment * 0.5) + (freedom * freedomWeight) + (distanceFromBlue * 0.7)
        };
    }

    // Score all possible moves
    const scoredMoves = validMoves.map(move => scoreMoveWithField(move));
    
    // Sort by score (higher is better)
    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Add some randomness among top moves to avoid predictability
    const topMoves = scoredMoves.slice(0, Math.min(2, scoredMoves.length));
    const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
    
    redPos = selectedMove.pos;
    return true;
}

    function countActiveEdgesAround(pos) {
        return getValidMoves(pos).length;
    }

    // Get all valid moves
    const validMoves = getValidMoves(redPos);
    if (validMoves.length === 0) return false;

    // Calculate scores for each possible move
    const scoredMoves = validMoves.map(move => {
        const repulsionScore = calculateRepulsionScore(move);
        
        // Simulate edge removal impact
        const futureMovesCount = getValidMoves(move).length;
        
        // Final move score combines multiple factors
        return {
            pos: move,
            score: repulsionScore.score * (futureMovesCount / 4)
        };
    });

    // Choose the move with the lowest repulsion score (best escape route)
    scoredMoves.sort((a, b) => a.score - b.score);
    
    // Add some randomness to avoid predictable patterns
    const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
    
    redPos = selectedMove.pos;
    return true;
}
function moveRedAttack() {
    // Get the total number of active edges for weight calculation
    const activeEdgeCount = edges.filter(edge => edge.active).length;
    const edgeWeight = 1 / activeEdgeCount; // Base weight for each edge

    // Run Dijkstra's algorithm with weighted edges
    const result = dijkstraWithWeights(redPos, bluePos, edgeWeight);
    
    if (!result || !result.nextMove) {
        // If no path exists, move towards blue using Manhattan distance
        const validMoves = getValidMoves(redPos);
        if (validMoves.length === 0) return false;
        
        let bestMove = validMoves[0];
        let bestDistance = getManhattanDistance(validMoves[0], bluePos);
        
        validMoves.forEach(move => {
            const distance = getManhattanDistance(move, bluePos);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMove = move;
            }
        });
        
        redPos = bestMove;
        return true;
    }

    redPos = result.nextMove;
    return true;
}

function dijkstraWithWeights(start, end, edgeWeight) {
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    
    // Initialize distances and unvisited set
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const key = `${x},${y}`;
            distances[key] = Infinity;
            unvisited.add(key);
        }
    }
    
    distances[`${start.x},${start.y}`] = 0;
    
    while (unvisited.size > 0) {
        // Find unvisited node with smallest distance
        let currentKey = null;
        let smallestDistance = Infinity;
        
        unvisited.forEach(key => {
            if (distances[key] < smallestDistance) {
                smallestDistance = distances[key];
                currentKey = key;
            }
        });
        
        if (!currentKey || smallestDistance === Infinity) break;
        
        // Convert key back to coordinates
        const [x, y] = currentKey.split(',').map(Number);
        const current = {x, y};
        
        // If we've reached the end, reconstruct the path
        if (x === end.x && y === end.y) {
            // Reconstruct path to find next move
            let curr = currentKey;
            let nextMove = null;
            
            while (previous[curr]) {
                const [prevX, prevY] = previous[curr].split(',').map(Number);
                if (prevX === start.x && prevY === start.y) {
                    nextMove = {x, y};
                }
                curr = previous[curr];
            }
            
            return {
                distance: distances[currentKey],
                nextMove: nextMove
            };
        }
        
        unvisited.delete(currentKey);
        
        // Check all neighbors
        const neighbors = getValidMoves(current);
        neighbors.forEach(neighbor => {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            if (!unvisited.has(neighborKey)) return;
            
            // Calculate new distance including edge weight
            const distance = distances[currentKey] + edgeWeight;
            
            if (distance < distances[neighborKey]) {
                distances[neighborKey] = distance;
                previous[neighborKey] = currentKey;
            }
        });
    }
    
    return null; // No path found
}

function getManhattanDistance(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}
function isMobileDevice() {
    return (window.innerWidth <= 768) || ('ontouchstart' in window);
} 

function initializeMobileControls() {
    const redControls = {
        'up-btn': 'w',
        'down-btn': 's',
        'left-btn': 'a',
        'right-btn': 'd'
    };

    const blueControls = {
        'up-btn': 'ArrowUp',
        'down-btn': 'ArrowDown',
        'left-btn': 'ArrowLeft',
        'right-btn': 'ArrowRight'
    };

    for (const [className, _] of Object.entries(redControls)) {
        document.querySelector(`.${className}`).addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent zoom
            const key = gameMode === 'twoPlayer' && redTurn ? 
                redControls[className] : blueControls[className];
            handleMove(key);
            updateMobileButtonColors();
        });
    }
}

function updateMobileButtonColors() {
    if (!isMobileDevice()) return;
    
    const buttons = document.querySelectorAll('.mobile-btn');
    if (gameMode === 'twoPlayer') {
        const color = redTurn ? '#FF4444' : '#4169E1';
        buttons.forEach(btn => {
            btn.style.backgroundColor = color;
        });
    } else {
        buttons.forEach(btn => {
            btn.style.backgroundColor = '#4169E1';
        });
    }
}

// Add this to prevent any touch zooming
document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });


function checkGameOver() {
    if (bluePos.x === redPos.x && bluePos.y === redPos.y) {
        gameOver = true;
        if (gameMode === 'offense') {
            document.getElementById('message').textContent = 'Blue Wins - Points are joined';
        } else if (gameMode === 'defense') {
            document.getElementById('message').textContent = 'Red Wins - Points are joined';
        } else {
            document.getElementById('message').textContent = 'Blue Wins - Points are joined';
        }
        return true;
    }
    
    const path = findShortestPath(bluePos, redPos);
    if (!path) {
        gameOver = true;
        if (gameMode === 'offense') {
            document.getElementById('message').textContent = 'Red Wins - Points are separated';
        } else if (gameMode === 'defense') {
            document.getElementById('message').textContent = 'Blue Wins - Points are separated';
        } else {
            document.getElementById('message').textContent = 'Red Wins - Points are separated';
        }
        return true;
    }
    
    return false;
}

function handleMove(key) {
    if (gameOver) return;

    if (gameMode === 'twoPlayer') {
        if (redTurn) {
            // Red's turn (WASD only)
            const oldPos = { ...redPos };
            switch (key.toLowerCase()) {
                case 'w': if (redPos.y > 0) redPos.y--; break;
                case 's': if (redPos.y < GRID_SIZE - 1) redPos.y++; break;
                case 'a': if (redPos.x > 0) redPos.x--; break;
                case 'd': if (redPos.x < GRID_SIZE - 1) redPos.x++; break;
                default: return;
            }

            if (canMove(oldPos, redPos)) {
                removeRandomEdge();
                redTurn = false;
                if (checkGameOver()) {
                    drawGame();
                    return;
                }
            } else {
                redPos = oldPos;
            }
        } else {
            // Blue's turn (Arrow keys only)
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
                redTurn = true;
                if (checkGameOver()) {
                    drawGame();
                    return;
                }
            } else {
                bluePos = oldPos;
            }
        }
    } else {
        // Single-player mode logic - Arrow keys only for blue
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
                if (gameMode === 'offense') {
                    moveRedEvade();
                } else {
                    moveRedAttack();
                }
                removeRandomEdge();
                checkGameOver();
            }
        } else {
            bluePos = oldPos;
        }
    }
    
    drawGame();
}

function toggleMode() {
    if (gameMode === 'offense') {
        gameMode = 'defense';
        document.getElementById('modeBtn').textContent = 'Defense';
    } else if (gameMode === 'defense') {
        gameMode = 'twoPlayer';
        document.getElementById('modeBtn').textContent = 'Two Player';
    } else {
        gameMode = 'offense';
        document.getElementById('modeBtn').textContent = 'Offense';
    }
    resetGame();
}

function showInstructions() {
    const modal = document.getElementById('instructionsModal');
    modal.style.display = "block";
}

function closeInstructions() {
    const modal = document.getElementById('instructionsModal');
    modal.style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById('instructionsModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Updated event listener to include Enter key reset
document.addEventListener('keydown', (e) => {
    e.preventDefault();
    
    if (e.key === 'Enter') {
        resetGame();
        return;
    }
    
    if (gameMode === 'twoPlayer') {
        if (redTurn && ['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
            handleMove(e.key);
        } else if (!redTurn && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            handleMove(e.key);
        }
    } else {
        // Single player mode - only arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            handleMove(e.key);
        }
    }
});

function resetGame() {
    gameOver = false;
    redTurn = true;  // Red always starts
    document.getElementById('message').textContent = '';
    
    // Initialize edges first (includes removing two random edges)
    initializeEdges();
    
    // Initialize positions based on game mode
    initializePositions();
    
    updateGameTitle();
    drawGame();
    updateMobileButtonColors();

}

// Initialize game
resetGame();

// Initialize mobile controls if needed
if (isMobileDevice()) {
    initializeMobileControls();
    updateMobileButtonColors();
}
