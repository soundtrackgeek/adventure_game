class Game {
    constructor(rooms, items) {
        this.rooms = rooms;
        this.items = items;
        this.gameState = {
            currentRoom: 'jungleClearing',
            inventory: [],
            gameOver: false
        };
    }

    displayText(text) {
        const output = document.getElementById('output');
        output.innerHTML += `<p>${text}</p>`;
        output.scrollTop = output.scrollHeight;
    }

    updateInventory() {
        document.getElementById('inventoryList').textContent = this.gameState.inventory.join(', ') || 'empty';
    }

    processCommand() {
        if (this.gameState.gameOver) return;

        const input = document.getElementById('commandInput').value.trim().toLowerCase();
        document.getElementById('commandInput').value = '';
        const words = input.split(' ');
        const verb = words[0];
        const object = words.slice(1).join(' ');

        let response = '';
        switch (verb) {
            case 'go':
                response = this.handleMovement(object);
                break;
            case 'take':
                response = this.handleTake(object);
                break;
            case 'use':
                response = this.handleUse(object);
                break;
            default:
                response = "I don't understand that command. Try 'go [direction]', 'take [item]', or 'use [item]'.";
        }

        this.displayText(response);
        this.checkWinOrDeath();
        this.updateInventory();
    }

    handleMovement(direction) {
        const currentRoom = this.rooms[this.gameState.currentRoom];
        for (let dir in currentRoom.exits) {
            if (direction.includes(dir)) {
                this.gameState.currentRoom = currentRoom.exits[dir];
                return `${this.rooms[this.gameState.currentRoom].description}<br>Choices: ${this.rooms[this.gameState.currentRoom].choices.join(', ')}`;
            }
        }
        return "You can't go that way.";
    }

    handleTake(itemName) {
        const currentRoom = this.rooms[this.gameState.currentRoom];
        const itemIndex = currentRoom.items.indexOf(itemName);
        if (itemIndex !== -1) {
            currentRoom.items.splice(itemIndex, 1);
            this.gameState.inventory.push(itemName);
            return `You take the ${itemName}.`;
        }
        return "There's no such item here.";
    }

    handleUse(itemName) {
        if (!this.gameState.inventory.includes(itemName)) {
            return "You don't have that item.";
        }
        const item = this.items[itemName];
        const currentRoom = this.gameState.currentRoom;

        if (itemName === 'torch' && currentRoom === 'undergroundTunnel') {
            return "You light the tunnel with the torch, revealing the path ahead.";
        }
        return "You can't use that here.";
    }

    checkWinOrDeath() {
        const currentRoom = this.gameState.currentRoom;

        // Trap Room death
        if (currentRoom === 'trapRoom' && document.getElementById('commandInput').value.toLowerCase() === 'cross traps') {
            this.displayText("You step on a pressure plate. Spikes shoot from the walls. You're dead!");
            this.gameState.gameOver = true;
        }

        // Underground Tunnel death without torch
        if (currentRoom === 'undergroundTunnel' && !this.gameState.inventory.includes('torch')) {
            if (Math.random() < 0.5) {
                this.displayText("You stumble in the dark and fall into a pit. Game over!");
                this.gameState.gameOver = true;
            }
        }

        // Golden Idol death without amulet
        if (this.gameState.inventory.includes('goldenIdol') && !this.gameState.inventory.includes('amulet')) {
            this.displayText("The idol's curse consumes you as you touch it. You collapse, dead.");
            this.gameState.gameOver = true;
        }

        // Cursed Treasure death without amulet
        if (this.gameState.inventory.includes('cursedTreasure') && !this.gameState.inventory.includes('amulet')) {
            this.displayText("The cursed treasure drains your life force. You're dead!");
            this.gameState.gameOver = true;
        }

        // Win conditions
        if (currentRoom === 'exitPath' && this.gameState.inventory.includes('goldenIdol') && this.gameState.inventory.includes('amulet')) {
            this.displayText("You escape with the Golden Idol! Congratulations, you win!");
            this.gameState.gameOver = true;
        }

        if (currentRoom === 'treasureRoom' && this.gameState.inventory.includes('map') && this.gameState.inventory.includes('key')) {
            this.displayText("Using the map and key, you find a secret exit with untold riches. You win!");
            this.gameState.gameOver = true;
        }
    }
}