let game;

// Load game data
async function loadGameData() {
    try {
        // Force clear any existing content
        const output = document.getElementById('output');
        if (!output) {
            throw new Error('Output element not found');
        }
        output.innerHTML = '<p>Loading game data...</p>';
        
        // Force reload the JSON files
        const timestamp = Date.now();
        const [roomsResponse, itemsResponse] = await Promise.all([
            fetch(`./data/rooms.json?t=${timestamp}`),
            fetch(`./data/items.json?t=${timestamp}`)
        ]);

        if (!roomsResponse.ok || !itemsResponse.ok) {
            throw new Error('Failed to load game data. Try refreshing with Ctrl+F5.');
        }

        const [rooms, items] = await Promise.all([
            roomsResponse.json(),
            itemsResponse.json()
        ]);

        if (!rooms || !rooms.jungleClearing) {
            throw new Error('Invalid game data structure');
        }

        // Clear any existing game state
        game = null;
        // Create new game instance
        game = new Game(rooms, items);
        game.updateInventory();

        // Setup click handler after game is initialized
        const button = document.querySelector('button');
        if (button) {
            button.onclick = () => game.processCommand();
        }
    } catch (error) {
        console.error('Error during game initialization:', error);
        if (output) {
            output.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
}

// Event listeners
window.addEventListener('load', () => {
    loadGameData();
    
    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
        commandInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && game) {
                game.processCommand();
            }
        });
    }
});