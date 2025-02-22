class Game {
    constructor(rooms, items) {
        this.rooms = rooms;
        this.items = items;
        this.gameState = {
            currentRoom: 'jungleClearing',
            inventory: [],
            gameOver: false,
            torchLit: false
        };
        // Ensure output element exists and is cleared
        const output = document.getElementById('output');
        if (!output) {
            console.error('Output element not found');
            return;
        }
        output.innerHTML = '';
        
        // Immediately show initial room description
        this.displayInitialRoom();
    }

    displayInitialRoom() {
        const currentRoom = this.rooms[this.gameState.currentRoom];
        if (currentRoom) {
            const initialText = `Welcome to Temple Adventure!\n\n\n${currentRoom.description}\n\n\nAvailable actions: ${currentRoom.choices.join(', ')}\n\nType 'help' for a list of commands.`;
            this.displayText(initialText);
        } else {
            console.error('Initial room not found:', this.gameState.currentRoom);
        }
    }

    displayText(text) {
        const output = document.getElementById('output');
        if (output) {
            output.innerHTML += `<p>${text}</p>`;
            output.scrollTop = output.scrollHeight;
        } else {
            console.error('Output element not found while trying to display:', text);
        }
    }

    updateInventory() {
        const inventoryList = document.getElementById('inventoryList');
        if (inventoryList) {
            inventoryList.textContent = this.gameState.inventory.length > 0 ? 
                this.gameState.inventory.join(', ') : 'empty';
        }
    }

    processCommand() {
        if (this.gameState.gameOver) {
            this.displayText("Game is over. Refresh the page to start a new game.");
            return;
        }

        const input = document.getElementById('commandInput').value.trim().toLowerCase();
        document.getElementById('commandInput').value = '';
        const words = input.split(' ');
        const verb = words[0];
        const object = words.slice(1).join(' ');

        if (!input) {
            this.displayText("Please enter a command.");
            return;
        }

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
            case 'look':
                response = this.handleLook();
                break;
            case 'inventory':
                response = this.handleInventory();
                break;
            case 'help':
                response = this.handleHelp();
                break;
            default:
                response = "I don't understand that command. Try 'help' for available commands.";
        }

        this.displayText(response);
        if (!this.gameState.gameOver) {
            this.checkWinOrDeath();
        }
        this.updateInventory();
    }

    handleMovement(direction) {
        const currentRoom = this.rooms[this.gameState.currentRoom];
        
        if (!direction) {
            return "Which direction do you want to go?";
        }

        for (let dir in currentRoom.exits) {
            if (direction.includes(dir)) {
                const nextRoom = currentRoom.exits[dir];
                
                // Special case for underground tunnel
                if (nextRoom === 'undergroundTunnel' && !this.gameState.torchLit) {
                    return "It's too dark to enter without a lit torch.";
                }
                
                this.gameState.currentRoom = nextRoom;
                return `${this.rooms[nextRoom].description}\n\n\nAvailable actions: ${this.rooms[nextRoom].choices.join(', ')}`;
            }
        }
        return "You can't go that way.";
    }

    handleTake(itemName) {
        if (!itemName) {
            return "What do you want to take?";
        }

        const currentRoom = this.rooms[this.gameState.currentRoom];
        
        // Normalize the input item name (remove spaces and convert to lowercase)
        const normalizedInput = itemName.toLowerCase().replace(/\s+/g, '');
        
        // Find the item by comparing normalized versions
        const itemIndex = currentRoom.items.findIndex(item => 
            item.toLowerCase().replace(/\s+/g, '') === normalizedInput
        );
        
        if (itemIndex !== -1) {
            const actualItemName = currentRoom.items[itemIndex];  // Use the actual cased name
            // Special case for cursed items
            if (actualItemName === 'goldenIdol' && !this.gameState.inventory.includes('amulet')) {
                this.gameState.gameOver = true;
                return "As you touch the Golden Idol, its curse consumes you. You're dead!";
            }
            if (actualItemName === 'cursedTreasure' && !this.gameState.inventory.includes('amulet')) {
                this.gameState.gameOver = true;
                return "The cursed treasure drains your life force. You're dead!";
            }

            currentRoom.items.splice(itemIndex, 1);
            this.gameState.inventory.push(actualItemName);
            return `You take the ${actualItemName}.`;
        }
        return "There's no such item here.";
    }

    handleUse(itemName) {
        if (!itemName) {
            return "What do you want to use?";
        }

        const currentRoom = this.gameState.currentRoom;

        if (currentRoom === 'trapRoom' && itemName === 'traps') {
            this.gameState.gameOver = true;
            return "You step on a pressure plate. Spikes shoot from the walls. You're dead!";
        }

        if (!this.gameState.inventory.includes(itemName)) {
            return "You don't have that item.";
        }

        switch(itemName) {
            case 'torch':
                this.gameState.torchLit = !this.gameState.torchLit;
                return this.gameState.torchLit ? 
                    "You light the torch, illuminating your surroundings." : 
                    "You extinguish the torch.";
            
            case 'key':
                if (currentRoom === 'treasureRoom') {
                    return "You use the key to unlock a secret compartment.";
                }
                return "There's nothing here to unlock.";

            case 'map':
                return "The map shows the temple layout: Entrance → Hall of Statues → Various rooms including the Chamber of Idol";

            case 'amulet':
                return "The amulet glows with protective energy.";

            default:
                return "You can't use that item here.";
        }
    }

    handleLook() {
        const currentRoom = this.rooms[this.gameState.currentRoom];
        let description = currentRoom.description;
        
        if (currentRoom.items.length > 0) {
            description += "\nYou see: " + currentRoom.items.join(", ");
        }
        
        description += "\n\n\nAvailable actions: " + currentRoom.choices.join(", ");
        return description;
    }

    handleInventory() {
        if (this.gameState.inventory.length === 0) {
            return "Your inventory is empty.";
        }
        return "You are carrying: " + this.gameState.inventory.join(", ");
    }

    handleHelp() {
        return `Available commands:
- go [direction]: Move in a direction (north, south, east, west)
- take [item]: Pick up an item
- use [item]: Use an item in your inventory
- look: Examine your surroundings
- inventory: Check what you're carrying
- help: Show this help message`;
    }

    checkWinOrDeath() {
        const currentRoom = this.gameState.currentRoom;

        // Death conditions
        if (currentRoom === 'trapRoom' && 
            document.getElementById('commandInput').value.toLowerCase() === 'use traps') {
            this.displayText("You step on a pressure plate. Spikes shoot from the walls. You're dead!");
            this.gameState.gameOver = true;
            return;
        }

        if (currentRoom === 'undergroundTunnel' && !this.gameState.torchLit) {
            if (Math.random() < 0.5) {
                this.displayText("You stumble in the dark and fall into a pit. Game over!");
                this.gameState.gameOver = true;
                return;
            }
        }

        // Win conditions
        if (currentRoom === 'exitPath' && 
            this.gameState.inventory.includes('goldenIdol') && 
            this.gameState.inventory.includes('amulet')) {
            this.displayText("Congratulations! You've escaped with the Golden Idol protected by the amulet. You win!");
            this.gameState.gameOver = true;
            return;
        }

        if (currentRoom === 'treasureRoom' && 
            this.gameState.inventory.includes('map') && 
            this.gameState.inventory.includes('key')) {
            this.displayText("Using the map and key, you discover a secret passage to safety with the treasure. You win!");
            this.gameState.gameOver = true;
            return;
        }
    }
}