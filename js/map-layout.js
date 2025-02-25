class ForceDirectedLayout {
    constructor(rooms, startRoom = 'start') {
        this.rooms = rooms;
        this.positions = new Map();
        this.depths = new Map(); // Track depth from start
        this.visited = new Set();
        this.startRoom = startRoom;
    }

    initializePositions() {
        // Start from the configured starting point
        this.calculateDepths(this.startRoom, 0);
        this.positionRooms();
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
        let maxSouthDepth = 0;
        let maxEastDepth = 0;
        let maxWestDepth = 0;
        let maxUpDepth = 0;
        let maxDownDepth = 0;
        
        // Reset visited set for another traversal
        this.visited.clear();
        
        // Start with a clean grid-based approach where each direction has its own coordinate system
        this.mapRoomsToGrid(this.startRoom, 0, 0, 0);
        
        // Calculate total depths to determine layout bounds
        this.depths.forEach((coords) => {
            maxNorthDepth = Math.max(maxNorthDepth, -coords.y);  // North is negative Y
            maxSouthDepth = Math.max(maxSouthDepth, coords.y);   // South is positive Y
            maxEastDepth = Math.max(maxEastDepth, coords.x);     // East is positive X
            maxWestDepth = Math.max(maxWestDepth, -coords.x);    // West is negative X
            maxUpDepth = Math.max(maxUpDepth, -coords.z);        // Up is negative Z
            maxDownDepth = Math.max(maxDownDepth, coords.z);     // Down is positive Z
        });
        
        // Calculate available width and height in the map container
        const margin = 10; // Margin from edges, in percentage
        const availableWidth = 100 - (2 * margin);
        const availableHeight = 100 - (2 * margin);

        // Calculate total grid width and height
        const totalGridWidth = maxEastDepth + maxWestDepth + 1;   // +1 for the center cell
        const totalGridHeight = maxNorthDepth + maxSouthDepth + 1; // +1 for the center cell
        
        // Calculate cell size in percentage
        const horizontalSpacing = Math.min(20, availableWidth / Math.max(totalGridWidth, 1));
        const verticalSpacing = Math.min(20, availableHeight / Math.max(totalGridHeight, 1));
        
        // Position rooms on the grid
        this.depths.forEach((coords, roomId) => {
            // Calculate position as percentage coordinates
            // Convert grid coordinates to percentage positions
            // Note that y increases downward in CSS, so we invert the y calculation
            const x = margin + ((coords.x + maxWestDepth) * horizontalSpacing);
            const y = margin + ((coords.y + maxNorthDepth) * verticalSpacing);
            
            // Apply vertical level adjustment
            // For each level up/down, slightly offset the position
            const verticalOffset = coords.z * 3; // Small offset for each vertical level
            
            // Set the final position
            this.positions.set(roomId, { 
                x: x,
                y: y + verticalOffset
            });
        });
    }

    mapRoomsToGrid(roomId, x, y, z) {
        if (this.visited.has(roomId)) return;
        this.visited.add(roomId);
        
        // Store coordinates for this room
        this.depths.set(roomId, { x, y, z });
        
        const room = this.rooms[roomId];
        if (!room || !room.exits) return;

        // Directions directly correspond to coordinate changes
        const directionOffsets = {
            north: { x: 0, y: -1, z: 0 },  // North decreases Y
            south: { x: 0, y: 1, z: 0 },   // South increases Y
            east:  { x: 1, y: 0, z: 0 },   // East increases X
            west:  { x: -1, y: 0, z: 0 },  // West decreases X
            up:    { x: 0, y: 0, z: -1 },  // Up decreases Z (for vertical stacking)
            down:  { x: 0, y: 0, z: 1 }    // Down increases Z (for vertical stacking)
        };

        // Process each exit direction
        for (const [direction, targetRoomId] of Object.entries(room.exits)) {
            if (directionOffsets[direction]) {
                const offset = directionOffsets[direction];
                this.mapRoomsToGrid(
                    targetRoomId, 
                    x + offset.x, 
                    y + offset.y, 
                    z + offset.z
                );
            }
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