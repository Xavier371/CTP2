class GraphGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.nodeRadius = 20;
        
        // Interaction states
        this.isDragging = false;
        this.selectedNode = null;
        this.draggedNode = null;
        this.lastClickTime = 0;
        this.colors = ['#4CAF50', '#f44336', '#2196F3']; // green, red, blue
        
        // Set canvas size and initialize game
        this.resizeCanvas();
        this.initializeRandomGraph();
        
        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleMouseUp());
    }

    resizeCanvas() {
        const size = Math.min(window.innerWidth - 40, window.innerHeight - 100);
        this.canvas.width = size;
        this.canvas.height = size;
        this.draw();
    }

    initializeRandomGraph() {
        const nodeCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 nodes
        
        for (let i = 0; i < nodeCount; i++) {
            this.addRandomNode();
        }

        const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
        const edgeCount = Math.floor(Math.random() * (maxPossibleEdges - 2 + 1)) + 2;
        
        for (let i = 0; i < edgeCount; i++) {
            this.addRandomEdge();
        }
    }

    addRandomNode() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const x = this.nodeRadius + Math.random() * (this.canvas.width - 2 * this.nodeRadius);
            const y = this.nodeRadius + Math.random() * (this.canvas.height - 2 * this.nodeRadius);
            
            if (!this.nodes.some(node => 
                Math.hypot(node.x - x, node.y - y) < 2.5 * this.nodeRadius)) {
                this.nodes.push({ 
                    x, 
                    y, 
                    colorIndex: 0 // Start with green
                });
                return;
            }
            attempts++;
        }
    }

    addRandomEdge() {
        if (this.nodes.length < 2) return;

        const availablePairs = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (!this.edges.some(edge => 
                    (edge.from === i && edge.to === j) ||
                    (edge.from === j && edge.to === i))) {
                    availablePairs.push([i, j]);
                }
            }
        }

        if (availablePairs.length > 0) {
            const [from, to] = availablePairs[Math.floor(Math.random() * availablePairs.length)];
            this.edges.push({ from, to });
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const touch = e.touches[0];
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    handleMouseDown(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        this.startInteraction(pos);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.startInteraction(pos);
    }

    handleMouseMove(e) {
        if (this.isDragging && this.draggedNode !== null) {
            const pos = this.getMousePos(e);
            this.nodes[this.draggedNode].x = pos.x;
            this.nodes[this.draggedNode].y = pos.y;
            this.draw();
        }
    }

    handleTouchMove(e) {
        if (this.isDragging && this.draggedNode !== null) {
            e.preventDefault();
            const pos = this.getTouchPos(e);
            this.nodes[this.draggedNode].x = pos.x;
            this.nodes[this.draggedNode].y = pos.y;
            this.draw();
        }
    }

    handleMouseUp() {
        if (!this.isDragging && this.draggedNode !== null) {
            // This was a click, not a drag
            this.handleNodeClick(this.draggedNode);
        }
        this.isDragging = false;
        this.draggedNode = null;
        this.draw();
    }

    startInteraction(pos) {
        // Always check for node first
        const clickedNode = this.findClickedNode(pos);
        if (clickedNode !== null) {
            const currentTime = new Date().getTime();
            if (currentTime - this.lastClickTime < 300 && this.draggedNode === clickedNode) {
                // Double click detected - change color
                this.nodes[clickedNode].colorIndex = (this.nodes[clickedNode].colorIndex + 1) % this.colors.length;
                this.draggedNode = null;
                this.selectedNode = null;
            } else {
                // Single click/drag start
                this.isDragging = true;
                this.draggedNode = clickedNode;
            }
            this.lastClickTime = currentTime;
            this.draw();
            return;
        }

        // If no node clicked, check for edge
        const clickedEdge = this.findClickedEdge(pos);
        if (clickedEdge !== null) {
            this.edges.splice(clickedEdge, 1);
            this.draw();
            return;
        }

        // If nothing clicked, reset selection
        this.selectedNode = null;
        this.draw();
    }

    handleNodeClick(nodeIndex) {
        if (this.selectedNode === null) {
            this.selectedNode = nodeIndex;
        } else if (this.selectedNode !== nodeIndex) {
            // Create new edge if it doesn't exist
            if (!this.edges.some(edge => 
                (edge.from === this.selectedNode && edge.to === nodeIndex) ||
                (edge.from === nodeIndex && edge.to === this.selectedNode))) {
                this.edges.push({
                    from: Math.min(this.selectedNode, nodeIndex),
                    to: Math.max(this.selectedNode, nodeIndex)
                });
            }
            this.selectedNode = null;
        }
        this.draw();
    }

    findClickedNode(pos) {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const distance = Math.hypot(node.x - pos.x, node.y - pos.y);
            if (distance <= this.nodeRadius) {
                return i;
            }
        }
        return null;
    }

    findClickedEdge(pos) {
        const threshold = 10;
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            const node1 = this.nodes[edge.from];
            const node2 = this.nodes[edge.to];
            
            const distance = this.pointToLineDistance(
                pos.x, pos.y,
                node1.x, node1.y,
                node2.x, node2.y
            );
            
            if (distance < threshold) {
                return i;
            }
        }
        return null;
    }

    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
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
            this.ctx.strokeStyle = '#333';
            this.ctx.stroke();

            // Highlight selected node
            if (index === this.selectedNode) {
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 3, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#000';
                this.ctx.stroke();
            }

            // Add node index
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(index.toString(), node.x, node.y);
        });
    }
}

// Initialize the game when the page loads
window.onload = () => new GraphGame();
