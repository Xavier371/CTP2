class GraphGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.nodeRadius = 20;
        
        // Node selection for edge creation
        this.selectedNode = null;
        this.lastClickTime = 0;
        this.colors = ['#4CAF50', '#f44336', '#2196F3']; // green, red, blue
        
        // Set canvas size and initialize game
        this.resizeCanvas();
        this.initializeRandomGraph();
        
        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousedown', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
    }

    resizeCanvas() {
        const size = Math.min(window.innerWidth - 40, window.innerHeight - 100);
        this.canvas.width = size;
        this.canvas.height = size;
        this.draw();
    }

    initializeRandomGraph() {
        // Generate random number of nodes between 3 and 7
        const nodeCount = Math.floor(Math.random() * 5) + 3;
        
        // Create nodes
        for (let i = 0; i < nodeCount; i++) {
            this.addRandomNode();
        }

        // Add random edges (minimum 2)
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
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    handleClick(e) {
        const pos = this.getMousePos(e);
        this.handleInteraction(pos);
    }

    handleTouch(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.handleInteraction(pos);
    }

    handleInteraction(pos) {
        // Check for edge deletion first
        const clickedEdge = this.findClickedEdge(pos);
        if (clickedEdge !== null) {
            this.edges.splice(clickedEdge, 1);
            this.draw();
            return;
        }

        // Check for node interaction
        const clickedNode = this.findClickedNode(pos);
        if (clickedNode !== null) {
            const currentTime = new Date().getTime();
            
            // Check for double click/tap
            if (currentTime - this.lastClickTime < 300 && this.selectedNode === clickedNode) {
                // Rotate color
                this.nodes[clickedNode].colorIndex = (this.nodes[clickedNode].colorIndex + 1) % this.colors.length;
                this.selectedNode = null;
            } else {
                // Handle single click for edge creation
                if (this.selectedNode === null) {
                    this.selectedNode = clickedNode;
                } else {
                    if (this.selectedNode !== clickedNode) {
                        // Create new edge if it doesn't exist
                        if (!this.edges.some(edge => 
                            (edge.from === this.selectedNode && edge.to === clickedNode) ||
                            (edge.from === clickedNode && edge.to === this.selectedNode))) {
                            this.edges.push({
                                from: Math.min(this.selectedNode, clickedNode),
                                to: Math.max(this.selectedNode, clickedNode)
                            });
                        }
                    }
                    this.selectedNode = null;
                }
            }
            
            this.lastClickTime = currentTime;
            this.draw();
        } else {
            this.selectedNode = null;
        }
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
        const threshold = 10; // Distance threshold for edge clicking
        
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            const node1 = this.nodes[edge.from];
            const node2 = this.nodes[edge.to];
            
            // Calculate distance from point to line segment
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
