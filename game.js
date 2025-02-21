class GraphGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.nodeRadius = 20;
        
        // Mouse interaction properties
        this.isDragging = false;
        this.selectedNode = null;
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Add event listeners for buttons
        document.getElementById('addNode').addEventListener('click', () => this.addNode());
        document.getElementById('addEdge').addEventListener('click', () => this.addEdge());
        document.getElementById('deleteNode').addEventListener('click', () => this.deleteNode());
        document.getElementById('deleteEdge').addEventListener('click', () => this.deleteEdge());

        // Mouse event listeners with preventDefault
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleMouseDown(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e);
        });
        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.handleMouseUp();
        });
        
        // Touch event listeners
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp();
        });
    }

    resizeCanvas() {
        const size = Math.min(window.innerWidth - 40, window.innerHeight - 100);
        this.canvas.width = size;
        this.canvas.height = size;
        this.draw();
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
        const pos = this.getMousePos(e);
        this.checkNodeSelection(pos.x, pos.y);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.checkNodeSelection(pos.x, pos.y);
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedNode !== null) {
            const pos = this.getMousePos(e);
            this.nodes[this.selectedNode].x = pos.x;
            this.nodes[this.selectedNode].y = pos.y;
            this.draw();
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.isDragging && this.selectedNode !== null) {
            const pos = this.getTouchPos(e);
            this.nodes[this.selectedNode].x = pos.x;
            this.nodes[this.selectedNode].y = pos.y;
            this.draw();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.selectedNode = null;
    }

    checkNodeSelection(x, y) {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const distance = Math.hypot(node.x - x, node.y - y);
            if (distance < this.nodeRadius) {
                this.isDragging = true;
                this.selectedNode = i;
                return;
            }
        }
    }

    addNode() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const x = this.nodeRadius + Math.random() * (this.canvas.width - 2 * this.nodeRadius);
            const y = this.nodeRadius + Math.random() * (this.canvas.height - 2 * this.nodeRadius);
            
            if (!this.nodes.some(node => 
                Math.hypot(node.x - x, node.y - y) < 2.5 * this.nodeRadius)) {
                this.nodes.push({ x, y });
                this.draw();
                return;
            }
            attempts++;
        }
        alert("Couldn't find space for new node!");
    }

    getAvailableNodePairs() {
        const pairs = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (!this.edges.some(edge => 
                    (edge.from === i && edge.to === j) ||
                    (edge.from === j && edge.to === i))) {
                    pairs.push([i, j]);
                }
            }
        }
        return pairs;
    }

    addEdge() {
        if (this.nodes.length < 2) {
            alert("Need at least 2 nodes to create an edge!");
            return;
        }

        const availablePairs = this.getAvailableNodePairs();
        if (availablePairs.length === 0) {
            alert("No more possible edges to add!");
            return;
        }

        const randomPairIndex = Math.floor(Math.random() * availablePairs.length);
        const [node1Index, node2Index] = availablePairs[randomPairIndex];
        
        this.edges.push({ from: node1Index, to: node2Index });
        this.draw();
    }

    deleteNode() {
        if (this.nodes.length === 0) return;
        
        const nodeIndex = Math.floor(Math.random() * this.nodes.length);
        this.nodes.splice(nodeIndex, 1);
        
        // Remove all edges connected to this node
        this.edges = this.edges.filter(edge => 
            edge.from !== nodeIndex && edge.to !== nodeIndex);
        
        // Update indices of remaining edges
        this.edges = this.edges.map(edge => ({
            from: edge.from > nodeIndex ? edge.from - 1 : edge.from,
            to: edge.to > nodeIndex ? edge.to - 1 : edge.to
        }));
        
        this.draw();
    }

    deleteEdge() {
        if (this.edges.length === 0) return;
        
        const edgeIndex = Math.floor(Math.random() * this.edges.length);
        this.edges.splice(edgeIndex, 1);
        this.draw();
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
            this.ctx.fillStyle = index === this.selectedNode ? '#45a049' : '#4CAF50';
            this.ctx.fill();
            this.ctx.strokeStyle = '#45a049';
            this.ctx.stroke();

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
