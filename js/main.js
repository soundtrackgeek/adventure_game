let rooms = {};
let items = {};
let game;

// Load game data
async function loadGameData() {
    try {
        const [roomsResponse, itemsResponse] = await Promise.all([
            fetch('data/rooms.json'),
            fetch('data/items.json')
        ]);
        rooms = await roomsResponse.json();
        items = await itemsResponse.json();
        
        // Initialize game after loading data
        game = new Game(rooms, items);
        game.displayText(`${rooms.jungleClearing.description}<br>Choices: ${rooms.jungleClearing.choices.join(', ')}`);
        game.updateInventory();
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    
    document.getElementById('commandInput').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            game.processCommand();
        }
    });
});