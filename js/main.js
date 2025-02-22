let game;

// Load game data
async function loadGameData() {
    try {
        // Show loading state
        document.getElementById('output').innerHTML = '<p>Loading game data...</p>';
        
        const [roomsResponse, itemsResponse] = await Promise.all([
            fetch('./data/rooms.json').catch(() => {
                throw new Error('Failed to load rooms data. Check if rooms.json exists.');
            }),
            fetch('./data/items.json').catch(() => {
                throw new Error('Failed to load items data. Check if items.json exists.');
            })
        ]);

        if (!roomsResponse.ok || !itemsResponse.ok) {
            throw new Error('One or more game data files failed to load.');
        }

        const rooms = await roomsResponse.json();
        const items = await itemsResponse.json();
        
        // Initialize game after loading data
        game = new Game(rooms, items);
        
        // Display initial game state
        const initialText = `Welcome to Temple Adventure!\n\n${rooms.jungleClearing.description}\n\nAvailable actions: ${rooms.jungleClearing.choices.join(', ')}\n\nType 'help' for a list of commands.`;
        game.displayText(initialText);
        game.updateInventory();

        // Setup click handler after game is initialized
        const button = document.querySelector('button');
        if (button) {
            button.onclick = () => game.processCommand();
        }
    } catch (error) {
        console.error('Error loading game data:', error);
        document.getElementById('output').innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
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