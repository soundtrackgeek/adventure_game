class ForceDirectedLayout {
    constructor(rooms) {
        this.rooms = rooms;
        this.positions = new Map();
        this.depths = new Map(); // Track depth from start
        this.visited = new Set();
    }

    initializePositions() {
        // Start with the jungle clearing (assumed starting point)
        this.calculateDepths('jungleClearing', 0);
        this.positionRooms();
    }

    calculateDepths(roomId, depth) {
        if (this.visited.has(roomId)) return;
        
        this.visited.add(roomId);
        this.depths.set(roomId, depth);
        
        const room = this.rooms[roomId];
        if (!room || !room.exits) return;

        // Process exits in order: north, south, east, west to maintain consistent layout
        const directions = ['north', 'south', 'east', 'west'];
        directions.forEach(direction => {
            if (room.exits[direction]) {
                this.calculateDepths(room.exits[direction], depth + 1);
            }
        });
    }

    positionRooms() {
        // Find maximum depths for vertical and horizontal positioning
        let maxNorthDepth = 0;
        let maxEastDepth = 0;
        
        // Reset visited set for another traversal
        this.visited.clear();
        this.calculateDirectionalDepths('jungleClearing', 0, 0);

        // Calculate total depths to determine layout bounds
        this.depths.forEach((depthPair) => {
            maxNorthDepth = Math.max(maxNorthDepth, Math.abs(depthPair.north));
            maxEastDepth = Math.max(maxEastDepth, Math.abs(depthPair.east));
        });

        // Position rooms based on their directional depths
        this.depths.forEach((depthPair, roomId) => {
            // Convert depths to percentage positions (10-90% range)
            const x = 50 + (depthPair.east * 40 / (maxEastDepth + 1));
            const y = 50 + (depthPair.north * 40 / (maxNorthDepth + 1));
            this.positions.set(roomId, { x, y });
        });
    }

    calculateDirectionalDepths(roomId, northDepth, eastDepth) {
        if (this.visited.has(roomId)) return;
        this.visited.add(roomId);
        
        // Store both north/south and east/west depths
        this.depths.set(roomId, { north: northDepth, east: eastDepth });
        
        const room = this.rooms[roomId];
        if (!room || !room.exits) return;

        // Recursively calculate depths for connected rooms
        if (room.exits.north) {
            this.calculateDirectionalDepths(room.exits.north, northDepth - 1, eastDepth);
        }
        if (room.exits.south) {
            this.calculateDirectionalDepths(room.exits.south, northDepth + 1, eastDepth);
        }
        if (room.exits.east) {
            this.calculateDirectionalDepths(room.exits.east, northDepth, eastDepth + 1);
        }
        if (room.exits.west) {
            this.calculateDirectionalDepths(room.exits.west, northDepth, eastDepth - 1);
        }
    }

    getLayout() {
        // Convert positions Map to object format
        const layout = {};
        this.positions.forEach((pos, roomId) => {
            layout[roomId] = { x: pos.x, y: pos.y };
        });
        return layout;
    }
}