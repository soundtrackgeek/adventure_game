class ForceDirectedLayout {
    constructor(rooms, startRoom = 'start') {
        this.rooms = rooms;
        this.positions = new Map();
        this.depths = new Map(); // Track depth from start
        this.visited = new Set();
        this.startRoom = startRoom;
        this.mapComplexity = {
            roomCount: 0,
            maxConnections: 0,
            verticalLevels: 0
        };
    }

    initializePositions() {
        // Analyze the map complexity to determine optimal spacing
        this.analyzeMapComplexity();
        
        // Start from the configured starting point
        this.calculateDepths(this.startRoom, 0);
        this.positionRooms();
    }

    // Analyze map complexity to determine optimal layout parameters
    analyzeMapComplexity() {
        this.mapComplexity.roomCount = Object.keys(this.rooms).length;
        
        // Count vertical connections and max connections per room
        let maxVerticalConnections = 0;
        let maxConnectionsPerRoom = 0;
        
        Object.entries(this.rooms).forEach(([roomId, room]) => {
            if (!room.exits) return;
            
            // Count connections for this room
            const connectionCount = Object.keys(room.exits).length;
            maxConnectionsPerRoom = Math.max(maxConnectionsPerRoom, connectionCount);
            
            // Count vertical connections
            if (room.exits.up || room.exits.down) {
                maxVerticalConnections++;
            }
        });
        
        this.mapComplexity.maxConnections = maxConnectionsPerRoom;
        this.mapComplexity.verticalLevels = maxVerticalConnections;
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

        // Dynamically adjust spacing based on map complexity
        const baseSpacing = 18;
        let spacing = baseSpacing;
        let verticalSpacingFactor = 1.0;
        
        // More complex maps need more spacing
        if (this.mapComplexity.roomCount > 15) {
            spacing += 4; // More spacing for larger maps
        }
        
        if (this.mapComplexity.verticalLevels > 3) {
            verticalSpacingFactor = 2.0; // Much more vertical separation for multi-level maps
        } else if (this.mapComplexity.verticalLevels > 1) {
            verticalSpacingFactor = 1.5; // More vertical separation for maps with some vertical movement
        }
        
        // If the map has many connections per room, increase spacing further
        if (this.mapComplexity.maxConnections >= 4) {
            spacing += 2;
            verticalSpacingFactor += 0.5;
        }

        // Position rooms based on their directional depths
        const availableWidth = 90 - spacing; // Increased from 85 to 90 for better distribution
        const availableHeight = 90 - spacing;
        
        // Ensure minimum spacing between adjacent rooms
        const minRoomSpacing = 12;
        
        // Calculate horizontal and vertical scaling factors based on the map size
        const horizontalScale = availableWidth / Math.max(1, (maxEastDepth * 2 + 1));
        const verticalScale = availableHeight / Math.max(1, (maxNorthDepth * 2 + 1));
        
        // Apply room positioning with adjusted spacing
        this.depths.forEach((depthPair, roomId) => {
            // Calculate base positions with consistent spacing
            const baseX = spacing/2 + ((depthPair.east + maxEastDepth) * horizontalScale);
            
            // Apply vertical offset with adjusted spacing factor
            const verticalOffset = depthPair.vertical * (verticalScale / 2) * verticalSpacingFactor;
            const baseY = spacing/2 + ((depthPair.north + maxNorthDepth) * verticalScale) + verticalOffset;
            
            // Apply jitter to prevent exact overlaps for rooms with same coordinates
            const jitterX = this.getUniqueJitter(roomId, 'x', 2);
            const jitterY = this.getUniqueJitter(roomId, 'y', 2);
            
            // Final position with jitter
            const x = Math.min(95, Math.max(5, baseX + jitterX));
            const y = Math.min(95, Math.max(5, baseY + jitterY));
            
            this.positions.set(roomId, { x, y });
        });
        
        // Post-process positions to ensure minimum spacing between rooms
        this.ensureMinimumSpacing(minRoomSpacing);
    }
    
    // Generate a small jitter value unique to each room
    getUniqueJitter(roomId, axis, maxAmount) {
        // Use a simple hash of room ID and axis for deterministic jitter
        let hash = 0;
        for (let i = 0; i < roomId.length; i++) {
            hash = ((hash << 5) - hash) + roomId.charCodeAt(i) + axis.charCodeAt(0);
        }
        // Convert hash to a small jitter between -maxAmount and maxAmount
        return (hash % (maxAmount * 200)) / 100 - maxAmount;
    }
    
    // Ensure rooms have minimum spacing between them
    ensureMinimumSpacing(minDistance) {
        // Get all room positions
        const rooms = Array.from(this.positions.entries());
        
        // Convert percentage-based distances to a comparable scale (0-100)
        const scaledMinDistance = minDistance;
        
        // Check each pair of rooms
        for (let i = 0; i < rooms.length; i++) {
            const [roomId1, pos1] = rooms[i];
            
            for (let j = i + 1; j < rooms.length; j++) {
                const [roomId2, pos2] = rooms[j];
                
                // Calculate Euclidean distance between rooms
                const dx = pos2.x - pos1.x;
                const dy = pos2.y - pos1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If rooms are too close, adjust positions
                if (distance < scaledMinDistance) {
                    // Direction vector from room1 to room2
                    const dirX = dx / distance;
                    const dirY = dy / distance;
                    
                    // Amount to move each room
                    const moveAmount = (scaledMinDistance - distance) / 2;
                    
                    // Move room1 away from room2
                    pos1.x -= dirX * moveAmount;
                    pos1.y -= dirY * moveAmount;
                    
                    // Move room2 away from room1
                    pos2.x += dirX * moveAmount;
                    pos2.y += dirY * moveAmount;
                    
                    // Keep positions within bounds (5% - 95%)
                    pos1.x = Math.min(95, Math.max(5, pos1.x));
                    pos1.y = Math.min(95, Math.max(5, pos1.y));
                    pos2.x = Math.min(95, Math.max(5, pos2.x));
                    pos2.y = Math.min(95, Math.max(5, pos2.y));
                }
            }
        }
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