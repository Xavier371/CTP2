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
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
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
                this.edges.push({ from, to });
            }
        }
        this.draw();
    }

    handleKeyPress(e) {
        if (e.code === 'Space') {
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
        const buffer = 20; // Allow some padding around the line endpoints
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

        if (nodeIndex !== -1) {
            const currentTime = Date.now();
            if (currentTime - this.lastClickTime < 300) {
                // Handle multiple clicks
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
                }
            } else {
                // Single click - start drag or highlight
                this.clickCount = 1;
                this.isDragging = true;
                this.draggedNode = nodeIndex;
                this.highlightedNode = nodeIndex;
                if (this.lastClickedNode !== null && this.lastClickedNode !== nodeIndex) {
                    // Create edge between two nodes
                    if (!this.edges.some(edge => 
                        (edge.from === this.lastClickedNode && edge.to === nodeIndex) ||
                        (edge.from === nodeIndex && edge.to === this.lastClickedNode)
                    )) {
                        this.edges.push({
                            from: this.lastClickedNode,
                            to: nodeIndex
                        });
                    }
                    this.lastClickedNode = null;
                } else {
                    this.lastClickedNode = nodeIndex;
                }
            }
            this.lastClickTime = currentTime;
        } else {
            // Check for edge click
            const edgeIndex = this.findEdgeAtPosition(pos);
            if (edgeIndex !== -1) {
                this.edges.splice(edgeIndex, 1);
            }
            this.lastClickedNode = null;
        }
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
            this.highlightedNode = null;  // Remove highlight after dragging
            this.draw();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw edges
        this.edges.forEach(edge => {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            this.ctx.strokeStyle = '#666';
            this.ctx.stroke();
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
            this.ctx.lineWidth = 1;
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
