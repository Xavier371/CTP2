class GraphGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.nodeRadius = 20;
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Add event listeners
        document.getElementById('addNode').addEventListener('click', () => this.addNode());
        document.getElementById('addEdge').addEventListener('click', () => this.addEdge());
        document.getElementById('deleteNode').addEventListener('click', () => this.deleteNode());
        document.getElementById('deleteEdge').addEventListener('click', () => this.deleteEdge());
    }

    resizeCanvas() {
        // Make canvas a square that fits the screen
        const size = Math.min(window.innerWidth - 40, window.innerHeight - 100);
        this.canvas.width = size;
        this.canvas.height = size;
        this.draw();
    }

    addNode() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const x = this.nodeRadius + Math.random() * (this.canvas.width - 2 * this.nodeRadius);
            const y = this.nodeRadius + Math.random() * (this.canvas.height - 2 * this.nodeRadius);
            
            // Check if the new node overlaps with existing nodes
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

    addEdge() {
        if (this.nodes.length < 2) {
            alert("Need at least 2 nodes to create an edge!");
            return;
        }

        const node1Index = Math.floor(Math.random() * this.nodes.length);
        let node2Index;
        do {
            node2Index = Math.floor(Math.random() * this.nodes.length);
        } while (node1Index === node2Index);

        // Check if edge already exists
        if (!this.edges.some(edge => 
            (edge.from === node1Index && edge.to === node2Index) ||
            (edge.from === node2Index && edge.to === node1Index))) {
            this.edges.push({ from: node1Index, to: node2Index });
            this.draw();
        }
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
            this.ctx.fillStyle = '#4CAF50';
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
