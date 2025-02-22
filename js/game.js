class Game {
    constructor(rooms, items) {
        this.rooms = rooms;
        this.items = items;
        this.gameState = {
            currentRoom: 'jungleClearing',
            inventory: [],
            gameOver: false,
            torchLit: false,
            playedSongs: [] // Track played songs
        };
        
        // Ensure output element exists and is cleared
        const output = document.getElementById('output');
        if (!output) {
            console.error('Output element not found');
            return;
        }
        output.innerHTML = '';
        
        // Initialize music system
        this.songs = [
            'Ancient Echoes Distort.m4a',
            'Ancient Echoes Within.m4a',
            'Ancient Pulse.m4a',
            'Ancient Transmutation.m4a',
            'Forgotten Deity.m4a',
            'Temple of Echoes.m4a'
        ];
        this.audioElement = document.getElementById('bgMusic');
        this.narrationElement = document.getElementById('narration');
        if (!this.audioElement || !this.narrationElement) {
            console.error('Audio elements not found');
            return;
        }

        // Set background music volume lower
        this.audioElement.volume = 0.3;
        this.musicInitialized = false;

        // Set up audio error handling
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
        });

        // Initialize audio systems on first click
        document.addEventListener('click', () => {
            if (!this.musicInitialized) {
                this.initializeMusic();
                // Play the initial room's narration after music starts
                const currentRoom = this.rooms[this.gameState.currentRoom];
                if (currentRoom && currentRoom.narrationAudio) {
                    this.playNarration(currentRoom.narrationAudio);
                }
                this.musicInitialized = true;
            }
        }, { once: true });  // Changed to once: true since we only need this once

        // Show initial room description
        this.displayInitialRoom();
        this.displayLocationImage();
    }

    initializeMusic() {
        if (!this.audioElement) return;

        const playNextSong = () => {
            // If all songs have been played, reset the playlist
            if (this.gameState.playedSongs.length === this.songs.length) {
                this.gameState.playedSongs = [];
            }

            // Get available songs (not yet played)
            const availableSongs = this.songs.filter(song => 
                !this.gameState.playedSongs.includes(song)
            );

            // Randomly select a song
            const randomIndex = Math.floor(Math.random() * availableSongs.length);
            const selectedSong = availableSongs[randomIndex];
            
            // Add to played songs
            this.gameState.playedSongs.push(selectedSong);
            
            // Play the song
            this.audioElement.src = `assets/sounds/${selectedSong}`;
            this.audioElement.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        };

        // Play next song when current one ends
        this.audioElement.addEventListener('ended', playNextSong);
        
        // Start playing the first song
        playNextSong();
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

    displayLocationImage() {
        const currentRoom = this.rooms[this.gameState.currentRoom];
        if (currentRoom && currentRoom.image) {
            const imageContainer = document.getElementById('locationImage');
            if (imageContainer) {
                imageContainer.innerHTML = `<img src="${currentRoom.image}" alt="Location: ${this.gameState.currentRoom}">`;
            }
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
                
                // Check required items for movement
                if (currentRoom.requiredItems && currentRoom.requiredItems[dir]) {
                    const required = currentRoom.requiredItems[dir];
                    if (!required.every(item => this.gameState.inventory.includes(item))) {
                        if (currentRoom.deathMessages && currentRoom.deathMessages[dir]) {
                            this.gameState.gameOver = true;
                            return currentRoom.deathMessages[dir];
                        }
                        return `You need ${required.join(" and ")} to go that way.`;
                    }
                }

                // Special case for underground tunnel
                if (nextRoom === 'undergroundTunnel' && !this.gameState.torchLit) {
                    return "It's too dark to enter without a lit torch.";
                }
                
                this.gameState.currentRoom = nextRoom;
                this.displayLocationImage();
                
                // Play narration for the new room
                const newRoom = this.rooms[nextRoom];
                if (newRoom.narrationAudio) {
                    this.playNarration(newRoom.narrationAudio);
                }
                
                return `${newRoom.description}\n\n\nAvailable actions: ${newRoom.choices.join(', ')}`;
            }
        }
        return "You can't go that way.";
    }

    handleTake(itemName) {
        if (!itemName) {
            return "What do you want to take?";
        }

        const currentRoom = this.rooms[this.gameState.currentRoom];
        
        const normalizedInput = itemName.toLowerCase().replace(/\s+/g, '');
        const itemIndex = currentRoom.items.findIndex(item => 
            item.toLowerCase().replace(/\s+/g, '') === normalizedInput
        );
        
        if (itemIndex !== -1) {
            const actualItemName = currentRoom.items[itemIndex];

            // Check required items before taking
            if (currentRoom.requiredItems && currentRoom.requiredItems[actualItemName]) {
                const required = currentRoom.requiredItems[actualItemName];
                if (!required.every(item => this.gameState.inventory.includes(item))) {
                    if (currentRoom.deathMessages && currentRoom.deathMessages[actualItemName]) {
                        this.gameState.gameOver = true;
                        return currentRoom.deathMessages[actualItemName];
                    }
                    return `You need ${required.join(" and ")} to take that.`;
                }
            }

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

        const currentRoom = this.rooms[this.gameState.currentRoom];

        if (currentRoom === 'trapRoom' && itemName === 'traps') {
            this.gameState.gameOver = true;
            return "You step on a pressure plate. Spikes shoot from the walls. You're dead!";
        }

        if (!this.gameState.inventory.includes(itemName)) {
            return "You don't have that item.";
        }

        // Check for room-specific item use messages
        if (currentRoom.itemUse && currentRoom.itemUse[itemName]) {
            return currentRoom.itemUse[itemName];
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

        // Play narration when looking around
        if (currentRoom.narrationAudio) {
            this.playNarration(currentRoom.narrationAudio);
        }

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

    displayRoom(roomName) {
        const room = this.rooms[roomName];
        if (!room) return false;

        const text = room.description + '\n\n' + 'Available actions: ' + room.choices.join(', ');
        this.displayText(text);
        this.displayLocationImage();
        this.playNarration(room.narrationAudio);
        return true;
    }

    playNarration(audioPath) {
        if (!audioPath || !this.narrationElement) return;

        // Lower background music volume during narration
        if (this.audioElement) {
            this.audioElement.volume = 0.1;
        }

        // Stop any currently playing narration
        this.narrationElement.pause();
        this.narrationElement.currentTime = 0;

        this.narrationElement.src = audioPath;
        console.log('Playing narration:', audioPath);
        this.narrationElement.play().catch(error => {
            console.error('Error playing narration:', error, audioPath);
            // Restore background music volume if narration fails
            if (this.audioElement) {
                this.audioElement.volume = 0.3;
            }
        });

        // Restore background music volume when narration ends
        this.narrationElement.onended = () => {
            if (this.audioElement) {
                this.audioElement.volume = 0.3;
            }
        };
    }
}