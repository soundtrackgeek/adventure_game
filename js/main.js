let game;

// Load available games
async function loadAvailableGames() {
    const gamesList = document.getElementById('gamesList');
    try {
        const timestamp = Date.now();
        const gamesResponse = await fetch(`/list-games?t=${timestamp}`);
        if (!gamesResponse.ok) {
            throw new Error('Failed to fetch games list');
        }
        const availableGames = await gamesResponse.json();
        const games = [];

        for (const gameId of availableGames) {
            try {
                const configResponse = await fetch(`games/${gameId}/data/config.json?t=${timestamp}`);
                if (configResponse.ok) {
                    const config = await configResponse.json();
                    games.push({
                        id: config.id || gameId,
                        name: config.gameName || 'Unnamed Game',
                        description: config.description || 'No description available',
                        thumbnail: config.thumbnail || `games/${gameId}/assets/images/default.jpg`
                    });
                }
            } catch (error) {
                console.warn(`Failed to load config for game ${gameId}:`, error);
            }
        }

        if (games.length === 0) {
            gamesList.innerHTML = '<p>No games available.</p>';
            return;
        }

        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <img src="${game.thumbnail}" alt="${game.name}">
                <h3>${game.name}</h3>
                <p>${game.description}</p>
            `;
            gameCard.onclick = () => startGame(game.id);
            gamesList.appendChild(gameCard);
        });
    } catch (error) {
        console.error('Error loading games:', error);
        gamesList.innerHTML = '<p>Error loading available games.</p>';
    }
}

// Start selected game
async function startGame(gameId) {
    const gameSelect = document.getElementById('game-select');
    const gameInterface = document.getElementById('game-interface');
    const output = document.getElementById('output');

    gameSelect.style.display = 'none';
    gameInterface.style.display = 'grid';

    try {
        const loadingTimeout = setTimeout(() => {
            output.innerHTML = '<p>Loading game data...</p>';
        }, 500);

        const timestamp = Date.now();
        const [roomsResponse, itemsResponse, configResponse] = await Promise.all([
            fetch(`games/${gameId}/data/rooms.json?t=${timestamp}`),
            fetch(`games/${gameId}/data/items.json?t=${timestamp}`),
            fetch(`games/${gameId}/data/config.json?t=${timestamp}`)
        ]);

        if (!roomsResponse.ok || !itemsResponse.ok || !configResponse.ok) {
            throw new Error('Failed to load game data. Try refreshing with Ctrl+F5.');
        }

        const [rooms, items, config] = await Promise.all([
            roomsResponse.json(),
            itemsResponse.json(),
            configResponse.json()
        ]);

        clearTimeout(loadingTimeout);

        if (!rooms || !rooms[config.startingRoom]) {
            throw new Error('Invalid game data structure');
        }

        game = new Game(rooms, items, gameId);
        game.updateInventory();

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
    loadAvailableGames();
    
    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
        commandInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && game) {
                game.processCommand();
            }
        });
    }
});