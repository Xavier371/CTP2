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
        
        // Set canvas size and initialize game
        this.resizeCanvas();
        this.initializeRandomGraph();
        
        // Mouse event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleEnd(e));
        
        // Touch event listeners
        this.canvas.addEventListener('touchstart', (e) => this.handleStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleEnd(e));
    }

    resizeCanvas() {
        const size = Math.min(
            window.innerWidth * 0.75,  // Reduce width to 75% of screen width
            window.innerHeight * 0.6   // Reduce height to 60% of screen height
        );
        
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.canvas.width = size;
        this.canvas.height = size;
        this.draw();
    }

    initializeRandomGraph() {
        const nodeCount = Math.floor(Math.random() * 5) + 3;
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

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.edges.forEach(edge => {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            this.ctx.strokeStyle = '#666';
            this.ctx.stroke();
        });

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
}

let gameInstance = null;
window.onload = () => {
    gameInstance = new GraphGame();
};

document.addEventListener("DOMContentLoaded", function () {
    const instructionsOverlay = document.querySelector(".instructions-overlay");
    const gameCanvas = document.getElementById("gameCanvas");
    const toggleButton = document.getElementById("toggleInstructions");

    toggleButton.addEventListener("click", function () {
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

GraphGame.prototype.hideGraph = function () {
    this.pausedNodes = this.nodes.length ? [...this.nodes] : [];
    this.pausedEdges = this.edges.length ? [...this.edges] : [];
    this.nodes = [];
    this.edges = [];
    this.draw();
};

GraphGame.prototype.showGraph = function () {
    this.nodes = this.pausedNodes && this.pausedNodes.length ? [...this.pausedNodes] : [];
    this.edges = this.pausedEdges && this.pausedEdges.length ? [...this.pausedEdges] : [];
    this.draw();
};
