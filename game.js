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
        
        // Double click/tap for color change
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    resizeCanvas() {
        const size = Math.min(window.innerWidth - 40, window.innerHeight - 100);
        this.canvas.width = size;
        this.canvas.height = size;
        this.draw();
    }

    initializeRandomGraph() {
        // Generate 3-7 nodes
        const nodeCount = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < nodeCount; i++) {
            const x = this.nodeRadius + Math.random() * (this.canvas.width - 2 * this.nodeRadius);
            const y = this.nodeRadius + Math.random() * (this.canvas.height - 2 * this.nodeRadius);
            this.nodes.push({ x, y, colorIndex: 0 });
        }

        // Generate random edges
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

    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    findNodeAtPosition(pos) {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const distance = Math.hypot(node.x - pos.x, node.y - pos.y);
            if (distance <= this.nodeRadius) {
                return i;
            }
        }
        return null;
    }

    findEdgeAtPosition(pos) {
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            const node1 = this.nodes[edge.from];
            const node2 = this.nodes[edge.to];
            
            const A = pos.x - node1.x;
            const B = pos.y - node1.y;
            const C = node2.x - node1.x;
            const D = node2.y - node1.y;
            
            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            
            if (len_sq !== 0) {
                param = dot / len_sq;
            }
            
            let xx, yy;
            if (param < 0) {
                xx = node1.x;
                yy = node1.y;
            } else if (param > 1) {
                xx = node2.x;
                yy = node2.y;
            } else {
                xx = node1.x + param * C;
                yy = node1.y + param * D;
            }
            
            const distance = Math.hypot(pos.x - xx, pos.y - yy);
            if (distance < 10) {
                return i;
            }
        }
        return null;
    }

    handleStart(e) {
        e.preventDefault();
        const pos = this.getEventPos(e);
        const nodeIndex = this.findNodeAtPosition(pos);
        
        if (nodeIndex !== null) {
            // Start dragging
            this.isDragging = true;
            this.draggedNode = nodeIndex;
            
            // If no node is highlighted or this is the highlighted node, just drag
            if (this.highlightedNode === null || this.highlightedNode === nodeIndex) {
                // Continue with drag
            } else {
                // Create edge with highlighted node
                if (!this.edges.some(edge => 
                    (edge.from === this.highlightedNode && edge.to === nodeIndex) ||
                    (edge.from === nodeIndex && edge.to === this.highlightedNode))) {
                    this.edges.push({
                        from: Math.min(this.highlightedNode, nodeIndex),
                        to: Math.max(this.highlightedNode, nodeIndex)
                    });
                }
                this.highlightedNode = null;
            }
        } else {
            const edgeIndex = this.findEdgeAtPosition(pos);
            if (edgeIndex !== null) {
                // Delete edge
                this.edges.splice(edgeIndex, 1);
                this.highlightedNode = null;
            } else {
                // Create new node
                this.nodes.push({
                    x: pos.x,
                    y: pos.y,
                    colorIndex: 0
                });
                this.highlightedNode = null;
            }
        }
        this.draw();
    }

    handleMove(e) {
        e.preventDefault();
        if (this.isDragging && this.draggedNode !== null) {
            const pos = this.getEventPos(e);
            this.nodes[this.draggedNode].x = pos.x;
            this.nodes[this.draggedNode].y = pos.y;
            this.draw();
        }
    }

    handleEnd(e) {
        e.preventDefault();
        if (!this.isDragging && this.draggedNode !== null) {
            // This was a click/tap, not a drag
            if (this.highlightedNode === null) {
                this.highlightedNode = this.draggedNode;
            } else {
                this.highlightedNode = null;
            }
        }
        this.isDragging = false;
        this.draggedNode = null;
        this.draw();
    }

    handleDoubleClick(e) {
        e.preventDefault();
        const pos = this.getEventPos(e);
        const nodeIndex = this.findNodeAtPosition(pos);
        if (nodeIndex !== null) {
            this.nodes[nodeIndex].colorIndex = (this.nodes[nodeIndex].colorIndex + 1) % this.colors.length;
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
