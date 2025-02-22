let game;

// Load game data
async function loadGameData() {
    try {
        const [roomsResponse, itemsResponse] = await Promise.all([
            fetch('./data/rooms.json'),
            fetch('./data/items.json')
        ]);
        const rooms = await roomsResponse.json();
        const items = await itemsResponse.json();
        
        // Initialize game after loading data
        game = new Game(rooms, items);
        game.displayText(`${rooms.jungleClearing.description}<br>Choices: ${rooms.jungleClearing.choices.join(', ')}`);
        game.updateInventory();

        // Setup click handler after game is initialized
        document.querySelector('button').onclick = () => game.processCommand();
    } catch (error) {
        console.error('Error loading game data:', error);
        document.getElementById('output').innerHTML = '<p>Error loading game data. Please check the console.</p>';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    
    document.getElementById('commandInput').addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && game) {
            game.processCommand();
        }
    });
});