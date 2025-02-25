class ForceDirectedLayout {
    constructor(rooms, startRoom = 'start') {
        this.rooms = rooms;
        this.positions = new Map();
        this.depths = new Map(); // Track depth from start
        this.visited = new Set();
        this.startRoom = startRoom;
        // Add game-specific spacing factors
        this.gameId = null;
    }

    initializePositions() {
        // Detect game type from rooms structure to apply game-specific adjustments
        this.detectGameType();
        
        // Start from the configured starting point
        this.calculateDepths(this.startRoom, 0);
        this.positionRooms();
    }

    // Detect game type to apply specific layout adjustments
    detectGameType() {
        // Check for game-specific room patterns
        const roomIds = Object.keys(this.rooms);
        
        if (roomIds.includes('lobby') && roomIds.includes('securityOffice') && roomIds.includes('serverRoom')) {
            this.gameId = 'cyberpunk_heist';
        } else if (roomIds.includes('entryHall')) {
            this.gameId = 'silo_descent';
        } else if (roomIds.includes('templeEntrance') || roomIds.includes('jungleClearing')) {
            this.gameId = 'temple_adventure';
        }
    }

    calculateDepths(roomId, depth) {
        if (this.visited.has(roomId)) return;
        
        this.visited.add(roomId);
        this.depths.set(roomId, depth);
        
        const room = this.rooms[roomId];
        if (!room || !room.exits) return;

        // Process exits in order to maintain consistent layout
        const directions = ['north', 'south', 'east', 'west', 'up', 'down'];
        directions.forEach(direction => {
            if (room.exits[direction]) {
                this.calculateDepths(room.exits[direction], depth + 1);
            }
        });
    }

    positionRooms() {
        // Find maximum depths for positioning
        let maxNorthDepth = 0;
        let maxEastDepth = 0;
        let maxVerticalDepth = 0;
        
        // Reset visited set for another traversal
        this.visited.clear();
        this.calculateDirectionalDepths(this.startRoom, 0, 0, 0);

        // Calculate total depths to determine layout bounds
        this.depths.forEach((depthPair) => {
            maxNorthDepth = Math.max(maxNorthDepth, Math.abs(depthPair.north));
            maxEastDepth = Math.max(maxEastDepth, Math.abs(depthPair.east));
            maxVerticalDepth = Math.max(maxVerticalDepth, Math.abs(depthPair.vertical));
        });

        // Apply game-specific spacing adjustments
        let spacing = 18; // Increase default spacing from 15 to 18
        let verticalSpacingFactor = 1;
        
        // Apply game-specific adjustments
        if (this.gameId === 'cyberpunk_heist') {
            spacing = 20; // More spacing for Cyberpunk Heist
            verticalSpacingFactor = 1.5; // Increase vertical separation
        } else if (this.gameId === 'silo_descent') {
            spacing = 20; // More spacing for Silo Descent
            verticalSpacingFactor = 2; // Even more vertical separation for Silo Descent
        }

        // Position rooms based on their directional depths
        const availableWidth = 85 - spacing;
        const availableHeight = 85 - spacing;

        this.depths.forEach((depthPair, roomId) => {
            // Convert depths to percentage positions with wider spacing
            const x = spacing + ((depthPair.east + maxEastDepth) * availableWidth / (maxEastDepth * 2 + 1));
            
            // Combine north/south with up/down for y-position, with improved vertical spacing
            const verticalOffset = depthPair.vertical * (availableHeight / (maxVerticalDepth * 4 + 1)) * verticalSpacingFactor;
            const y = spacing + ((depthPair.north + maxNorthDepth) * availableHeight / (maxNorthDepth * 2 + 1)) + verticalOffset;
            
            this.positions.set(roomId, { x, y });
        });
    }

    calculateDirectionalDepths(roomId, northDepth, eastDepth, verticalDepth) {
        if (this.visited.has(roomId)) return;
        this.visited.add(roomId);
        
        // Store north/south, east/west, and up/down depths
        this.depths.set(roomId, { 
            north: northDepth, 
            east: eastDepth,
            vertical: verticalDepth 
        });
        
        const room = this.rooms[roomId];
        if (!room || !room.exits) return;

        // Recursively calculate depths for connected rooms
        if (room.exits.north) {
            this.calculateDirectionalDepths(room.exits.north, northDepth - 1, eastDepth, verticalDepth);
        }
        if (room.exits.south) {
            this.calculateDirectionalDepths(room.exits.south, northDepth + 1, eastDepth, verticalDepth);
        }
        if (room.exits.east) {
            this.calculateDirectionalDepths(room.exits.east, northDepth, eastDepth + 1, verticalDepth);
        }
        if (room.exits.west) {
            this.calculateDirectionalDepths(room.exits.west, northDepth, eastDepth - 1, verticalDepth);
        }
        if (room.exits.up) {
            this.calculateDirectionalDepths(room.exits.up, northDepth, eastDepth, verticalDepth - 1);
        }
        if (room.exits.down) {
            this.calculateDirectionalDepths(room.exits.down, northDepth, eastDepth, verticalDepth + 1);
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