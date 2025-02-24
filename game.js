class GraphGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.nodeRadius = 20;
        
        // Interaction states
        this.isDragging = false;
        this.draggedNode = null;
        this.highlightedNode = null;
        this.lastClickTime = 0;
        this.clickCount = 0;
        this.lastClickedNode = null;
        this.lastClickedEdge = null;
        this.colors = ['#4CAF50', '#f44336', '#2196F3']; // green, red, blue
        
        // Initialize game
        this.resizeCanvas();
        this.initializeRandomGraph();
        
        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleEnd(e));
        window.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    resizeCanvas() {
        const container = document.getElementById('canvasContainer');
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
        this.draw();
    }

    initializeRandomGraph() {
        const nodeCount = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < nodeCount; i++) {
            const x = this.nodeRadius + Math.random() * (this.canvas.width - 2 * this.nodeRadius);
            const y = this.nodeRadius + Math.random() * (this.canvas.height - 2 * this.nodeRadius);
            this.nodes.push({ x, y, colorIndex: 0 });
        }

        const edgeCount = Math.floor(Math.random() * (nodeCount * 2)) + 1;
        for (let i = 0; i < edgeCount; i++) {
            const from = Math.floor(Math.random() * nodeCount);
            let to = Math.floor(Math.random() * nodeCount);
            while (to === from) {
                to = Math.floor(Math.random() * nodeCount);
            }
            if (!this.edges.some(edge => 
                (edge.from === from && edge.to === to) ||
                (edge.from === to && edge.to === from))) {
                this.edges.push({ from, to, directed: false });
            }
        }
        this.draw();
    }

    handleKeyPress(e) {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            const x = this.nodeRadius + Math.random() * (this.canvas.width - 2 * this.nodeRadius);
            const y = this.nodeRadius + Math.random() * (this.canvas.height - 2 * this.nodeRadius);
            this.nodes.push({ x, y, colorIndex: 0 });
            this.draw();
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    findNodeAtPosition(pos) {
        return this.nodes.findIndex(node => 
            Math.hypot(node.x - pos.x, node.y - pos.y) < this.nodeRadius
        );
    }

    findEdgeAtPosition(pos) {
        return this.edges.findIndex(edge => {
            const from = this.nodes[edge.from];
            const to = this.nodes[edge.to];
            const distance = this.pointToLineDistance(pos, from, to);
            return distance < 10 && this.isPointBetweenEndpoints(pos, from, to);
        });
    }

    pointToLineDistance(point, lineStart, lineEnd) {
        const numerator = Math.abs(
            (lineEnd.y - lineStart.y) * point.x -
            (lineEnd.x - lineStart.x) * point.y +
            lineEnd.x * lineStart.y -
            lineEnd.y * lineStart.x
        );
        const denominator = Math.hypot(
            lineEnd.y - lineStart.y,
            lineEnd.x - lineStart.x
        );
        return numerator / denominator;
    }

    isPointBetweenEndpoints(point, lineStart, lineEnd) {
        const buffer = 20;
        const minX = Math.min(lineStart.x, lineEnd.x) - buffer;
        const maxX = Math.max(lineStart.x, lineEnd.x) + buffer;
        const minY = Math.min(lineStart.y, lineEnd.y) - buffer;
        const maxY = Math.max(lineStart.y, lineEnd.y) + buffer;
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }

    handleStart(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        const nodeIndex = this.findNodeAtPosition(pos);
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastClickTime;

        if (nodeIndex !== -1) {
            // Node clicked
            if (nodeIndex === this.lastClickedNode && timeDiff < 300) {
                // Multiple clicks on same node
                this.clickCount++;
                
                if (this.clickCount === 2) {
                    // Double click - change color
                    this.nodes[nodeIndex].colorIndex = (this.nodes[nodeIndex].colorIndex + 1) % this.colors.length;
                } else if (this.clickCount === 3) {
                    // Triple click - delete node
                    this.nodes.splice(nodeIndex, 1);
                    this.edges = this.edges.filter(edge => 
                        edge.from !== nodeIndex && edge.to !== nodeIndex
                    );
                    this.edges.forEach(edge => {
                        if (edge.from > nodeIndex) edge.from--;
                        if (edge.to > nodeIndex) edge.to--;
                    });
                    this.highlightedNode = null;
                    this.clickCount = 0;
                }
            } else {
                // Single click or first click on new node
                this.clickCount = 1;
                this.isDragging = true;
                this.draggedNode = nodeIndex;

                // Handle highlighting and edge creation
                if (this.highlightedNode === nodeIndex) {
                    // Unhighlight if clicking the same node
                    this.highlightedNode = null;
                } else if (this.highlightedNode !== null) {
                    // Create edge between highlighted and current node
                    if (!this.edges.some(edge => 
                        (edge.from === this.highlightedNode && edge.to === nodeIndex) ||
                        (edge.from === nodeIndex && edge.to === this.highlightedNode)
                    )) {
                        this.edges.push({
                            from: this.highlightedNode,
                            to: nodeIndex,
                            directed: false
                        });
                    }
                    this.highlightedNode = null;
                } else {
                    // Highlight new node
                    this.highlightedNode = nodeIndex;
                }
            }
            this.lastClickedNode = nodeIndex;
        } else {
            // Handle edge or empty space clicks
            const edgeIndex = this.findEdgeAtPosition(pos);
            if (edgeIndex !== -1) {
                if (timeDiff < 300 && edgeIndex === this.lastClickedEdge) {
                    // Double click on edge - toggle direction
                    this.edges[edgeIndex].directed = !this.edges[edgeIndex].directed;
                } else {
                    // Single click on edge - delete
                    this.edges.splice(edgeIndex, 1);
                }
                this.lastClickedEdge = edgeIndex;
            } else {
                // Clicked empty space - add new node
                const x = pos.x;
                const y = pos.y;
                this.nodes.push({ x, y, colorIndex: 0 });
                this.highlightedNode = null;
                this.lastClickedEdge = null;
            }
        }
        
        this.lastClickTime = currentTime;
        this.draw();
    }

    handleMove(e) {
        e.preventDefault();
        if (this.isDragging && this.draggedNode !== null) {
            const pos = this.getMousePos(e);
            this.nodes[this.draggedNode].x = pos.x;
            this.nodes[this.draggedNode].y = pos.y;
            this.draw();
        }
    }

    handleEnd(e) {
        e.preventDefault();
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedNode = null;
            this.highlightedNode = null; // Unhighlight after dragging
            this.clickCount = 0; // Reset click counter
            this.draw();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw edges
        this.edges.forEach(edge => {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];
            
            // Calculate the direction vector
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const unitX = dx / length;
            const unitY = dy / length;

            // Calculate start and end points accounting for node radius
            const startX = fromNode.x + unitX * this.nodeRadius;
            const startY = fromNode.y + unitY * this.nodeRadius;
            const endX = toNode.x - unitX * this.nodeRadius;
            const endY = toNode.y - unitY * this.nodeRadius;

            // Draw the main line
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw arrow if edge is directed
            if (edge.directed) {
                const arrowLength = 15;
                const arrowWidth = 8;
                
                // Draw arrow at end point
                const arrowStartX = endX - unitX * arrowLength;
                const arrowStartY = endY - unitY * arrowLength;
                const perpX = -unitY * arrowWidth;
                const perpY = unitX * arrowWidth;

                this.ctx.beginPath();
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(arrowStartX + perpX, arrowStartY + perpY);
                this.ctx.lineTo(arrowStartX - perpX, arrowStartY - perpY);
                this.ctx.closePath();
                this.ctx.fillStyle = '#666';
                this.ctx.fill();
            }
        });

        // Draw nodes
        this.nodes.forEach((node, index) => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors[node.colorIndex];
            this.ctx.fill();
            this.ctx.strokeStyle = index === this.highlightedNode ? '#000' : '#333';
            this.ctx.lineWidth = index === this.highlightedNode ? 3 : 1;
            this.ctx.stroke();
            
            // Draw node number
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(index.toString(), node.x, node.y);
        });
    }

    hideGraph() {
        this.pausedNodes = [...this.nodes];
        this.pausedEdges = [...this.edges];
        this.nodes = [];
        this.edges = [];
        this.draw();
    }

    showGraph() {
        this.nodes = [...this.pausedNodes];
        this.edges = [...this.pausedEdges];
        this.draw();
    }
}

let gameInstance = null;
window.onload = () => {
    gameInstance = new GraphGame();
};

document.addEventListener("DOMContentLoaded", function() {
    const instructionsOverlay = document.querySelector(".instructions-overlay");
    const gameCanvas = document.getElementById("gameCanvas");
    const toggleButton = document.getElementById("toggleInstructions");

    toggleButton.addEventListener("click", function() {
        if (instructionsOverlay.style.display === "none" || instructionsOverlay.style.display === "") {
            instructionsOverlay.style.display = "flex";
            gameCanvas.classList.add("hidden");
            toggleButton.textContent = "Resume Game";
            if (gameInstance) gameInstance.hideGraph();
        } else {
            instructionsOverlay.style.display = "none";
            gameCanvas.classList.remove("hidden");
            toggleButton.textContent = "Instructions";
            if (gameInstance) gameInstance.showGraph();
        }
    });
});
