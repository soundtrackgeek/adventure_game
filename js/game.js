class Game {
    constructor(rooms, items) {
        this.rooms = rooms;
        this.items = items;
        this.config = null;
        this.rules = null;
        this.puzzles = null;
        this.gameState = {
            currentRoom: null,
            inventory: [],
            gameOver: false,
            state: {},
            playedSongs: [],
            solvedPuzzles: [],
            sequenceProgress: {},
            visitedRooms: new Set(), // Track visited rooms
            totalItems: 0, // Track total collectible items
            collectedItems: 0 // Track collected items
        };

        // Room positions for the mini-map (percentage-based)
        this.roomPositions = {
            jungleClearing: { x: 50, y: 90 },
            templeEntrance: { x: 50, y: 75 },
            hallOfStatues: { x: 50, y: 60 },
            trapRoom: { x: 70, y: 60 },
            library: { x: 70, y: 45 },
            altarRoom: { x: 30, y: 60 },
            undergroundTunnel: { x: 85, y: 60 },
            chamberOfIdol: { x: 85, y: 45 },
            treasureRoom: { x: 85, y: 30 },
            exitPath: { x: 85, y: 15 }
        };

        this.loadConfigurations().then(() => {
            this.gameState.currentRoom = this.config.startingRoom;
            
            // Initialize total items count
            this.countTotalItems();
            
            // Initialize audio elements
            this.setupAudio();
            
            // Show initial room and update UI
            this.displayInitialRoom();
            this.displayLocationImage();
            this.updateMiniMap();
            this.updateProgress();
        });
    }

    async loadConfigurations() {
        try {
            const [configResponse, rulesResponse, puzzlesResponse] = await Promise.all([
                fetch('data/config.json'),
                fetch('data/rules.json'),
                fetch('data/puzzles.json')
            ]);
            this.config = await configResponse.json();
            this.rules = await rulesResponse.json();
            this.puzzles = await puzzlesResponse.json();
        } catch (error) {
            console.error('Error loading configurations:', error);
        }
    }

    setupAudio() {
        this.songs = [];
        this.audioElement = document.getElementById('bgMusic');
        this.narrationElement = document.getElementById('narration');
        if (!this.audioElement || !this.narrationElement) {
            console.error('Audio elements not found');
            return;
        }

        // Set initial volumes
        this.audioElement.volume = this.config.bgMusicVolume;
        this.narrationElement.volume = 1.0;
        this.musicInitialized = false;

        // Set up audio error handling
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
        });

        // Initialize audio systems when ready
        const initAudioOnInteraction = () => {
            if (!this.musicInitialized) {
                this.loadMusicFiles().then(() => {
                    this.initializeMusic();
                    const currentRoom = this.rooms[this.gameState.currentRoom];
                    if (currentRoom && currentRoom.narrationAudio) {
                        this.playNarration(currentRoom.narrationAudio);
                    }
                    this.musicInitialized = true;
                });
            }
        };

        // Listen for both click and keypress events
        document.addEventListener('click', initAudioOnInteraction, { once: true });
        document.addEventListener('keypress', initAudioOnInteraction, { once: true });
    }

    async loadMusicFiles() {
        try {
            const response = await fetch('assets/sounds/');
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = doc.getElementsByTagName('a');
            
            this.songs = Array.from(links)
                .map(link => link.href)
                .filter(href => href.endsWith('.m4a'))
                .map(href => href.split('/').pop())
                .filter(filename => !filename.includes('narration'));

            if (this.songs.length === 0) {
                console.warn('No music files found in assets/sounds/');
            }
        } catch (error) {
            console.error('Error loading music files:', error);
        }
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
            const initialText = `${this.config.welcomeMessage}\n\n\n${currentRoom.description}\n\n\nAvailable actions: ${currentRoom.choices.join(', ')}\n\nType 'help' for a list of commands.`;
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
            if (this.gameState.inventory.length > 0) {
                const formattedItems = this.gameState.inventory.map(item => this.formatItemName(item));
                inventoryList.textContent = formattedItems.join(', ');
            } else {
                inventoryList.textContent = 'empty';
            }
        }
    }

    processCommand() {
        if (this.gameState.gameOver) {
            this.displayText(this.config.gameOverMessage);
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
            case 'solve':
                response = this.handleAnagramPuzzle(object);
                break;
            case 'save':
                response = this.saveGame();
                break;
            case 'load':
                response = this.loadGame();
                break;
            default:
                response = this.config.invalidCommandMessage;
        }

        this.displayText(response);
        if (!this.gameState.gameOver) {
            this.checkWinOrDeath();
        }
        this.updateInventory();
    }

    handleMovement(direction) {
        if (!direction) {
            return this.config.invalidDirectionMessage;
        }

        const currentRoom = this.rooms[this.gameState.currentRoom];
        
        for (let dir in currentRoom.exits) {
            if (direction.includes(dir)) {
                const nextRoom = currentRoom.exits[dir];
                
                // Check room entry conditions
                const roomRules = this.rules.roomConditions[nextRoom];
                if (roomRules && roomRules.enter) {
                    const condition = roomRules.enter.requires;
                    if (!this.checkCondition(condition)) {
                        return condition.message;
                    }
                }

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
                
                this.gameState.currentRoom = nextRoom;
                this.gameState.visitedRooms.add(nextRoom); // Mark room as visited
                this.displayLocationImage();
                this.updateMiniMap(); // Update mini-map after movement
                
                const newRoom = this.rooms[nextRoom];
                if (newRoom.narrationAudio) {
                    this.playNarration(newRoom.narrationAudio);
                }
                
                return `${newRoom.description}\n\n\nAvailable actions: ${newRoom.choices.join(', ')}`;
            }
        }
        return this.config.cantGoMessage;
    }

    // Helper method to format item name for display
    formatItemName(itemName) {
        return itemName.replace(/([A-Z])/g, ' $1')  // Add space before capitals
                      .replace(/^./, str => str.toUpperCase())  // Capitalize first letter
                      .trim();  // Remove any leading/trailing spaces
    }

    handleTake(itemName) {
        if (!itemName) {
            return this.config.invalidItemMessage;
        }

        const currentRoom = this.rooms[this.gameState.currentRoom];
        
        const normalizedInput = this.normalizeItemName(itemName);
        const itemIndex = currentRoom.items.findIndex(item => 
            this.normalizeItemName(item) === normalizedInput
        );
        
        if (itemIndex !== -1) {
            const actualItemName = currentRoom.items[itemIndex];

            // Check item conditions
            const itemRules = this.rules.itemConditions[actualItemName];
            if (itemRules && itemRules.take) {
                const condition = itemRules.take.requires;
                if (!this.checkCondition(condition)) {
                    this.gameState.gameOver = condition.gameOver || false;
                    return condition.failureMessage;
                }
            }

            currentRoom.items.splice(itemIndex, 1);
            this.gameState.inventory.push(actualItemName);
            this.gameState.collectedItems++; // Increment collected items count
            this.updateProgress(); // Update progress bar
            return `You take the ${this.formatItemName(actualItemName)}.`;
        }
        return this.config.noSuchItemMessage;
    }

    handleUse(itemName) {
        if (!itemName) {
            return this.config.invalidItemMessage;
        }

        // Check if trying to combine items (format: "use item1 with/and item2")
        const withIndex = itemName.indexOf(" with ");
        const andIndex = itemName.indexOf(" and ");
        const separator = withIndex !== -1 ? " with " : andIndex !== -1 ? " and " : null;
        const separatorIndex = withIndex !== -1 ? withIndex : andIndex;

        if (separator) {
            // Get the full item names before normalizing
            const item1Text = itemName.substring(0, separatorIndex);
            const item2Text = itemName.substring(separatorIndex + separator.length);
            
            // Find actual item names from inventory that match when normalized
            const item1 = this.gameState.inventory.find(item => 
                this.normalizeItemName(item) === this.normalizeItemName(item1Text)
            );
            const item2 = this.gameState.inventory.find(item => 
                this.normalizeItemName(item) === this.normalizeItemName(item2Text)
            );
            
            if (item1 && item2) {
                return this.handleCombination(item1, item2);
            }
            return this.config.dontHaveItemMessage;
        }

        // Normalize the input item name to match inventory format
        const normalizedInput = this.normalizeItemName(itemName);
        
        // Check for special room actions
        const roomActions = this.rules.specialActions[this.gameState.currentRoom];
        if (roomActions && roomActions.use && roomActions.use[normalizedInput]) {
            const action = roomActions.use[normalizedInput];
            this.gameState.gameOver = action.gameOver || false;
            return action.message;
        }

        // Check if player has the item
        if (!this.gameState.inventory.some(item => this.normalizeItemName(item) === normalizedInput)) {
            return this.config.dontHaveItemMessage;
        }

        // Get the actual item name from inventory
        const actualItemName = this.gameState.inventory.find(item => 
            this.normalizeItemName(item) === normalizedInput
        );

        // Check for room-specific item use messages
        const currentRoom = this.rooms[this.gameState.currentRoom];
        if (currentRoom.itemUse && currentRoom.itemUse[actualItemName]) {
            return currentRoom.itemUse[actualItemName];
        }

        // Handle state-changing items
        const stateItem = this.rules.stateChangingItems?.[actualItemName];
        if (stateItem) {
            const currentState = this.gameState.state[stateItem.toggleState] || false;
            this.gameState.state[stateItem.toggleState] = !currentState;
            return stateItem.messages[(!currentState).toString()];
        }

        return this.config.cantUseMessage;
    }

    // Helper method to normalize item names
    normalizeItemName(itemName) {
        // Remove spaces and convert to lowercase
        return itemName.toLowerCase().replace(/\s+/g, '');
    }

    handleCombination(item1, item2) {
        if (!this.puzzles?.combinations) {
            return "Item combination is not possible.";
        }

        if (!this.gameState.inventory.includes(item1) || !this.gameState.inventory.includes(item2)) {
            return this.config.dontHaveItemMessage;
        }

        // Check for alternative names in combinations
        const findActualItemName = (itemName) => {
            for (const combinationKey in this.puzzles.combinations) {
                const combination = this.puzzles.combinations[combinationKey];
                if (combination.alternativeNames) {
                    for (const [actualName, alternatives] of Object.entries(combination.alternativeNames)) {
                        if (alternatives.includes(itemName.toLowerCase())) {
                            return actualName;
                        }
                    }
                }
            }
            return itemName;
        };

        // Get actual item names considering alternatives
        const actualItem1 = findActualItemName(item1);
        const actualItem2 = findActualItemName(item2);

        // Normalize the item names for combination checking
        const normalizedItem1 = this.normalizeItemName(actualItem1);
        const normalizedItem2 = this.normalizeItemName(actualItem2);

        // Instead of directly accessing the combination by key, iterate to match normalized keys
        const targetKey1 = `${normalizedItem1}_${normalizedItem2}`;
        const targetKey2 = `${normalizedItem2}_${normalizedItem1}`;
        let combination = null;
        for (const key in this.puzzles.combinations) {
            const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
            if (normalizedKey === targetKey1 || normalizedKey === targetKey2) {
                combination = this.puzzles.combinations[key];
                break;
            }
        }

        if (!combination) {
            return "Those items cannot be combined.";
        }

        // Remove ingredients if specified
        if (combination.removeIngredients) {
            this.gameState.inventory = this.gameState.inventory.filter(
                item => item !== item1 && item !== item2
            );
        }

        // Add result item
        this.gameState.inventory.push(combination.result);
        this.updateInventory();

        return combination.message;
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
            return this.config.inventoryEmptyMessage;
        }
        return this.config.inventoryContentsPrefix + this.gameState.inventory.join(", ");
    }

    handleHelp() {
        return `Available commands:
- go [direction]: Move in a direction
- take [item]: Pick up an item
- use [item]: Use an item
- use [item] with [item]: Combine two items
- look: Look around
- inventory: Check your inventory
- solve [answer]: Solve an anagram puzzle
- save: Save your current game
- load: Load your last saved game
- help: Show this help message`;
    }

    handleAnagramPuzzle(answer) {
        const currentRoom = this.rooms[this.gameState.currentRoom];
        const anagramPuzzles = this.puzzles?.anagrams;
        
        if (!anagramPuzzles) {
            return "There are no anagram puzzles to solve.";
        }

        // Find a puzzle that hasn't been solved in the current room
        const puzzleId = Object.keys(anagramPuzzles).find(id => 
            !this.gameState.solvedPuzzles.includes(id) &&
            currentRoom.puzzles?.includes(id)
        );

        if (!puzzleId) {
            return "There are no anagram puzzles to solve here.";
        }

        const puzzle = anagramPuzzles[puzzleId];
        if (answer.toLowerCase() === puzzle.solution.toLowerCase()) {
            this.gameState.solvedPuzzles.push(puzzleId);
            if (puzzle.reward) {
                this.gameState.inventory.push(puzzle.reward);
                this.updateInventory();
                return `Correct! You've solved the puzzle and received: ${puzzle.reward}`;
            }
            return "Correct! You've solved the puzzle!";
        }

        return puzzle.hint || "That's not the correct solution.";
    }

    checkWinOrDeath() {
        // Check win conditions
        for (const condition of this.rules.winConditions) {
            if (this.gameState.currentRoom === condition.room) {
                if (this.checkCondition(condition.requires)) {
                    this.displayText(condition.message);
                    this.gameState.gameOver = true;
                    return;
                }
            }
        }

        // Check death conditions
        for (const condition of this.rules.deathConditions) {
            if (this.gameState.currentRoom === condition.room) {
                if (this.checkCondition(condition.when)) {
                    if (!condition.chance || Math.random() < condition.chance) {
                        this.displayText(condition.message);
                        this.gameState.gameOver = true;
                        return;
                    }
                }
            }
        }
    }

    checkCondition(condition) {
        if (!condition) return true;

        if (condition.inventory) {
            if (Array.isArray(condition.inventory)) {
                return condition.inventory.every(item => 
                    this.gameState.inventory.includes(item)
                );
            } else {
                return this.gameState.inventory.includes(condition.inventory);
            }
        }

        if (condition.state) {
            return this.gameState.state[condition.state] === condition.value;
        }

        return true;
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

        if (this.audioElement) {
            this.audioElement.volume = this.config.bgMusicVolumeDuringNarration;
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
                this.audioElement.volume = this.config.bgMusicVolume;
            }
        });

        // Restore background music volume when narration ends
        this.narrationElement.onended = () => {
            if (this.audioElement) {
                this.audioElement.volume = this.config.bgMusicVolume;
            }
        };
    }

    saveGame() {
        const saveData = {
            currentRoom: this.gameState.currentRoom,
            inventory: this.gameState.inventory,
            gameOver: this.gameState.gameOver,
            state: this.gameState.state,
            solvedPuzzles: this.gameState.solvedPuzzles,
            sequenceProgress: this.gameState.sequenceProgress
        };
        
        try {
            localStorage.setItem('templeAdventureSave', JSON.stringify(saveData));
            return this.config.saveSuccessMessage;
        } catch (error) {
            console.error('Error saving game:', error);
            return this.config.saveErrorMessage;
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem('templeAdventureSave');
            if (!saveData) {
                return this.config.loadErrorMessage;
            }

            const parsedData = JSON.parse(saveData);
            this.gameState.currentRoom = parsedData.currentRoom;
            this.gameState.inventory = parsedData.inventory;
            this.gameState.gameOver = parsedData.gameOver;
            this.gameState.state = parsedData.state;
            this.gameState.solvedPuzzles = parsedData.solvedPuzzles;
            this.gameState.sequenceProgress = parsedData.sequenceProgress;

            // Update display
            this.displayLocationImage();
            this.updateInventory();
            
            // Return the current room description with load success message
            return `${this.config.loadSuccessMessage}\n\n${this.handleLook()}`;
        } catch (error) {
            console.error('Error loading game:', error);
            return this.config.loadCorruptedMessage;
        }
    }

    countTotalItems() {
        this.gameState.totalItems = Object.values(this.rooms).reduce((total, room) => {
            return total + (room.items ? room.items.length : 0);
        }, 0);
    }

    updateProgress() {
        const progress = Math.floor((this.gameState.collectedItems / this.gameState.totalItems) * 100);
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}% Complete (${this.gameState.collectedItems}/${this.gameState.totalItems} Items)`;
        }
    }

    updateMiniMap() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;

        // Clear existing map
        mapContainer.innerHTML = '';

        // Draw connections first (so they appear behind rooms)
        Object.entries(this.rooms).forEach(([roomId, room]) => {
            const exits = room.exits || {};
            Object.entries(exits).forEach(([direction, targetRoomId]) => {
                this.drawConnection(mapContainer, roomId, targetRoomId);
            });
        });

        // Draw rooms
        Object.keys(this.rooms).forEach(roomId => {
            this.drawRoom(mapContainer, roomId);
        });
    }

    drawRoom(container, roomId) {
        const position = this.roomPositions[roomId];
        if (!position) return;

        const room = document.createElement('div');
        room.className = 'map-room';
        if (this.gameState.visitedRooms.has(roomId)) {
            room.classList.add('visited');
        }
        if (this.gameState.currentRoom === roomId) {
            room.classList.add('current');
        }

        room.style.left = `${position.x}%`;
        room.style.top = `${position.y}%`;
        room.style.transform = 'translate(-50%, -50%)';
        room.title = this.formatRoomName(roomId);

        container.appendChild(room);
    }

    drawConnection(container, fromRoomId, toRoomId) {
        const from = this.roomPositions[fromRoomId];
        const to = this.roomPositions[toRoomId];
        if (!from || !to) return;

        const connection = document.createElement('div');
        connection.className = 'map-connection';
        if (this.gameState.visitedRooms.has(fromRoomId) && 
            this.gameState.visitedRooms.has(toRoomId)) {
            connection.classList.add('visited');
        }

        // Calculate connection position and dimensions
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        connection.style.width = `${length}%`;
        connection.style.height = '2px';
        connection.style.left = `${from.x}%`;
        connection.style.top = `${from.y}%`;
        connection.style.transformOrigin = 'left center';
        connection.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

        container.appendChild(connection);
    }

    formatRoomName(roomId) {
        return roomId
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/^\w/, c => c.toUpperCase());
    }
}