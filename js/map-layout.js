class ForceDirectedLayout {
    constructor(rooms) {
        this.rooms = rooms;
        this.positions = new Map();
        this.velocities = new Map();
        this.springLength = 30; // Desired length between connected rooms
        this.springStrength = 0.1;
        this.repulsionStrength = 1000;
        this.damping = 0.8;
        this.timestep = 0.5;
        this.centerForceStrength = 0.03;
    }

    initializePositions() {
        // Start with rooms in a circle
        const roomIds = Object.keys(this.rooms);
        const angleStep = (2 * Math.PI) / roomIds.length;
        
        roomIds.forEach((roomId, index) => {
            const angle = index * angleStep;
            const radius = 40;
            this.positions.set(roomId, {
                x: 50 + radius * Math.cos(angle),
                y: 50 + radius * Math.sin(angle)
            });
            this.velocities.set(roomId, { x: 0, y: 0 });
        });
    }

    calculateForces() {
        const forces = new Map(Array.from(this.positions.keys()).map(id => [id, { x: 0, y: 0 }]));

        // Spring forces between connected rooms
        Object.entries(this.rooms).forEach(([roomId, room]) => {
            const exits = room.exits || {};
            Object.values(exits).forEach(targetRoomId => {
                const pos1 = this.positions.get(roomId);
                const pos2 = this.positions.get(targetRoomId);
                if (pos1 && pos2) {
                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const force = (distance - this.springLength) * this.springStrength;
                    
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;

                    forces.get(roomId).x += fx;
                    forces.get(roomId).y += fy;
                    forces.get(targetRoomId).x -= fx;
                    forces.get(targetRoomId).y -= fy;
                }
            });
        });

        // Repulsion forces between all rooms
        const roomIds = Array.from(this.positions.keys());
        for (let i = 0; i < roomIds.length; i++) {
            for (let j = i + 1; j < roomIds.length; j++) {
                const id1 = roomIds[i];
                const id2 = roomIds[j];
                const pos1 = this.positions.get(id1);
                const pos2 = this.positions.get(id2);

                const dx = pos2.x - pos1.x;
                const dy = pos2.y - pos1.y;
                const distSq = dx * dx + dy * dy;
                const distance = Math.sqrt(distSq);
                
                const force = this.repulsionStrength / distSq;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                forces.get(id1).x -= fx;
                forces.get(id1).y -= fy;
                forces.get(id2).x += fx;
                forces.get(id2).y += fy;
            }
        }

        // Center force to keep layout centered
        roomIds.forEach(roomId => {
            const pos = this.positions.get(roomId);
            forces.get(roomId).x += (50 - pos.x) * this.centerForceStrength;
            forces.get(roomId).y += (50 - pos.y) * this.centerForceStrength;
        });

        return forces;
    }

    step() {
        const forces = this.calculateForces();

        // Update velocities and positions
        this.positions.forEach((pos, roomId) => {
            const velocity = this.velocities.get(roomId);
            const force = forces.get(roomId);

            velocity.x = (velocity.x + force.x * this.timestep) * this.damping;
            velocity.y = (velocity.y + force.y * this.timestep) * this.damping;

            pos.x += velocity.x * this.timestep;
            pos.y += velocity.y * this.timestep;

            // Keep positions within bounds (0-100%)
            pos.x = Math.max(10, Math.min(90, pos.x));
            pos.y = Math.max(10, Math.min(90, pos.y));
        });
    }

    getLayout() {
        // Run simulation steps until stabilized
        const maxSteps = 200;
        let steps = 0;
        let totalKineticEnergy = Infinity;

        while (totalKineticEnergy > 0.01 && steps < maxSteps) {
            this.step();
            
            // Calculate total kinetic energy to check for stability
            totalKineticEnergy = 0;
            this.velocities.forEach(velocity => {
                totalKineticEnergy += velocity.x * velocity.x + velocity.y * velocity.y;
            });
            
            steps++;
        }

        // Convert positions Map to object format
        const layout = {};
        this.positions.forEach((pos, roomId) => {
            layout[roomId] = { x: pos.x, y: pos.y };
        });
        return layout;
    }
}