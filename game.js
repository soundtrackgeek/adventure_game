// Game state
const gameState = {
    currentRoom: 'jungleClearing',
    inventory: [],
    gameOver: false
};

// Room data
const rooms = {
    jungleClearing: {
        description: "You stand in a dense jungle clearing. An ancient temple looms ahead.",
        exits: { north: "templeEntrance" },
        items: ["torch"],
        choices: ["Go north to the Temple Entrance", "Take torch"]
    },
    templeEntrance: {
        description: "The grand entrance of the temple. Stone carvings depict ancient rituals.",
        exits: { south: "jungleClearing", north: "hallOfStatues" },
        items: [],
        choices: ["Go south to Jungle Clearing", "Go north to Hall of Statues"]
    },
    hallOfStatues: {
        description: "A hall filled with statues of warriors. One holds a map.",
        exits: { south: "templeEntrance", east: "trapRoom", west: "altarRoom" },
        items: ["map"],
        choices: ["Go south to Temple Entrance", "Go east to Trap Room", "Go west to Altar Room", "Take map"]
    },
    trapRoom: {
        description: "This room is filled with deadly traps. Tread carefully.",
        exits: { west: "hallOfStatues", north: "library", east: "undergroundTunnel" },
        items: [],
        choices: ["Go west to Hall of Statues", "Go north to Library", "Go east to Underground Tunnel", "Cross traps"]
    },
    library: {
        description: "An ancient library with dusty scrolls. A key rests on a shelf.",
        exits: { south: "trapRoom", east: "treasureRoom" },
        items: ["key"],
        choices: ["Go south to Trap Room", "Go east to Treasure Room", "Take key"]
    },
    altarRoom: {
        description: "A room with an altar covered in symbols. An amulet glows faintly.",
        exits: { east: "hallOfStatues" },
        items: ["amulet"],
        choices: ["Go east to Hall of Statues", "Take amulet"]
    },
    undergroundTunnel: {
        description: "A dark tunnel leading deeper into the temple.",
        exits: { west: "trapRoom", north: "chamberOfIdol" },
        items: [],
        choices: ["Go west to Trap Room", "Go north to Chamber of the Idol"]
    },
    chamberOfIdol: {
        description: "The Golden Idol rests on a pedestal, guarded by a shadowy figure.",
        exits: { south: "undergroundTunnel", north: "exitPath" },
        items: ["goldenIdol"],
        choices: ["Go south to Underground Tunnel", "Go north to Exit Path", "Take golden idol"]
    },
    treasureRoom: {
        description: "A room filled with gold and jewels, and a sword in the corner.",
        exits: { west: "library" },
        items: ["sword", "cursedTreasure"],
        choices: ["Go west to Library", "Take sword", "Take cursed treasure"]
    },
    exitPath: {
        description: "A path leading out of the temple back to the jungle.",
        exits: { south: "chamberOfIdol" },
        items: [],
        choices: ["Go south to Chamber of the Idol"]
    }
};

// Item data
const items = {
    torch: { description: "A torch to light dark areas.", usableIn: ["undergroundTunnel"] },
    key: { description: "A key to unlock doors." },
    amulet: { description: "Protects against curses.", usableFor: ["goldenIdol", "cursedTreasure"] },
    sword: { description: "A sharp sword for defense." },
    map: { description: "A map of the temple." },
    goldenIdol: { description: "The priceless Golden Idol.", winCondition: true },
    cursedTreasure: { description: "Treasure that brings misfortune.", cursed: true }
};

// Display text in the output area
function displayText(text) {
    const output = document.getElementById('output');
    output.innerHTML += `<p>${text}</p>`;
    output.scrollTop = output.scrollHeight;
}

// Update inventory display
function updateInventory() {
    document.getElementById('inventoryList').textContent = gameState.inventory.join(', ') || 'empty';
}

// Process player commands
function processCommand() {
    if (gameState.gameOver) return;

    const input = document.getElementById('commandInput').value.trim().toLowerCase();
    document.getElementById('commandInput').value = '';
    const words = input.split(' ');
    const verb = words[0];
    const object = words.slice(1).join(' ');

    let response = '';
    switch (verb) {
        case 'go':
            response = handleMovement(object);
            break;
        case 'take':
            response = handleTake(object);
            break;
        case 'use':
            response = handleUse(object);
            break;
        default:
            response = "I don’t understand that command. Try 'go [direction]', 'take [item]', or 'use [item]'.";
    }

    displayText(response);
    checkWinOrDeath();
    updateInventory();
}

// Handle movement
function handleMovement(direction) {
    const currentRoom = rooms[gameState.currentRoom];
    for (let dir in currentRoom.exits) {
        if (direction.includes(dir)) {
            gameState.currentRoom = currentRoom.exits[dir];
            return `${rooms[gameState.currentRoom].description}<br>Choices: ${rooms[gameState.currentRoom].choices.join(', ')}`;
        }
    }
    return "You can’t go that way.";
}

// Handle taking items
function handleTake(itemName) {
    const currentRoom = rooms[gameState.currentRoom];
    const itemIndex = currentRoom.items.indexOf(itemName);
    if (itemIndex !== -1) {
        currentRoom.items.splice(itemIndex, 1);
        gameState.inventory.push(itemName);
        return `You take the ${itemName}.`;
    }
    return "There’s no such item here.";
}

// Handle using items
function handleUse(itemName) {
    if (!gameState.inventory.includes(itemName)) {
        return "You don’t have that item.";
    }
    const item = items[itemName];
    const currentRoom = gameState.currentRoom;

    if (itemName === 'torch' && currentRoom === 'undergroundTunnel') {
        return "You light the tunnel with the torch, revealing the path ahead.";
    }
    return "You can’t use that here.";
}

// Check win or death conditions
function checkWinOrDeath() {
    const currentRoom = gameState.currentRoom;

    // Trap Room death
    if (currentRoom === 'trapRoom' && document.getElementById('commandInput').value.toLowerCase() === 'cross traps') {
        displayText("You step on a pressure plate. Spikes shoot from the walls. You’re dead!");
        gameState.gameOver = true;
    }

    // Underground Tunnel death without torch
    if (currentRoom === 'undergroundTunnel' && !gameState.inventory.includes('torch')) {
        if (Math.random() < 0.5) {
            displayText("You stumble in the dark and fall into a pit. Game over!");
            gameState.gameOver = true;
        }
    }

    // Golden Idol death without amulet
    if (gameState.inventory.includes('goldenIdol') && !gameState.inventory.includes('amulet')) {
        displayText("The idol’s curse consumes you as you touch it. You collapse, dead.");
        gameState.gameOver = true;
    }

    // Cursed Treasure death without amulet
    if (gameState.inventory.includes('cursedTreasure') && !gameState.inventory.includes('amulet')) {
        displayText("The cursed treasure drains your life force. You’re dead!");
        gameState.gameOver = true;
    }

    // Win condition 1: Exit with Golden Idol
    if (currentRoom === 'exitPath' && gameState.inventory.includes('goldenIdol') && gameState.inventory.includes('amulet')) {
        displayText("You escape with the Golden Idol! Congratulations, you win!");
        gameState.gameOver = true;
    }

    // Win condition 2: Treasure Room with map and key
    if (currentRoom === 'treasureRoom' && gameState.inventory.includes('map') && gameState.inventory.includes('key')) {
        displayText("Using the map and key, you find a secret exit with untold riches. You win!");
        gameState.gameOver = true;
    }
}

// Initialize the game
displayText(`${rooms.jungleClearing.description}<br>Choices: ${rooms.jungleClearing.choices.join(', ')}`);
updateInventory();