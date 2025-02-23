# Temple Adventure Game
A text-based adventure game in vanilla JavaScript

## How to Run
Since this game loads JSON files, you'll need to run it through a local web server. Here's how to do it:

### Using Python (recommended)

1. Make sure you have Python installed on your computer
2. Open a terminal/command prompt in this directory
3. Run one of these commands depending on your Python version:
   - Python 3.x: `python -m http.server 8000`
   - Python 2.x: `python -m SimpleHTTPServer 8000`
4. Open your web browser and go to: `http://localhost:8000`

## How to Play
- Use commands like "go north", "take torch", or "use key"
- Collect items and explore the temple
- Save your progress with "save" command
- Load a previous game with "load" command
- Watch your progress on the progress bar
- Use the mini-map to track explored areas
- Be careful of traps and curses!
- Try to escape with the Golden Idol to win

## Game Features
- Text-based adventure gameplay
- Multiple rooms to explore
- Items to collect and use
- Various win and death conditions
- Inventory system
- Save/load game functionality
- Interactive puzzle system with:
  - Item combinations
  - Sequence puzzles
  - Anagram puzzles
- Mini-map showing explored areas
- Progress tracking system
  - Visual progress bar
  - Item collection tracking
  - Room exploration tracking

## Creating Your Own Adventure

The game engine is designed to be modular, allowing you to create your own adventures by modifying the JSON configuration files in the `data` folder.

### Configuration Files

1. `config.json` - Game-wide settings and messages
   ```json
   {
     "gameName": "Your Game Name",
     "welcomeMessage": "Welcome to your adventure!",
     "startingRoom": "firstRoom",
     // ...other settings
   }
   ```

2. `rooms.json` - Define your game's locations
   ```json
   {
     "firstRoom": {
       "description": "You find yourself in...",
       "image": "assets/images/your-room.jpg",
       "exits": { 
         "north": "secondRoom",
         "east": "thirdRoom"
       },
       "items": ["key", "note"],
       "narrationAudio": "assets/sounds/narration/room-audio.mp3",
       "choices": [
         "Go north to Second Room",
         "Go east to Third Room",
         "Take key",
         "Take note"
       ],
       "requiredItems": {
         "north": ["key"],
         "east": ["torch"]
       },
       "deathMessages": {
         "east": "Without light, you fall into a pit!"
       },
       "itemUse": {
         "map": "The map shows a secret passage to the east."
       }
     }
   }
   ```

3. `items.json` - Define collectible items
   ```json
   {
     "key": {
       "description": "A rusty old key.",
       "usableIn": ["lockedRoom"]
     },
     "magicRing": {
       "description": "A ring with protective powers.",
       "usableFor": ["dragon", "curse"]
     }
   }
   ```

4. `rules.json` - Game logic and special conditions
   ```json
   {
     "roomConditions": {
       "darkCave": {
         "enter": {
           "requires": {
             "state": "torchLit",
             "value": true,
             "message": "Too dark to enter without light."
           }
         }
       }
     },
     "itemConditions": {
       "treasure": {
         "take": {
           "requires": {
             "inventory": "gloves",
             "failureMessage": "The treasure is too hot to touch!",
             "gameOver": true
           }
         }
       }
     },
     "stateChangingItems": {
       "torch": {
         "toggleState": "torchLit",
         "messages": {
           "true": "You light the torch, illuminating your surroundings.",
           "false": "You extinguish the torch."
         }
       }
     },
     "winConditions": [
       {
         "room": "exit",
         "requires": {
           "inventory": ["treasure", "map"]
         },
         "message": "You escaped with the treasure! You win!"
       }
     ]
   }
   ```

5. `dialogues.json` - Define NPC conversations and dialogue trees
   ```json
   {
     "npcId": {
       "name": "Display Name",
       "initialNode": "startingNodeId",
       "nodes": {
         "startingNodeId": {
           "text": "What the NPC says in this node",
           "options": [
             {
               "text": "Player's first response choice",
               "nextNode": "node2"
             },
             {
               "text": "Player's second response choice",
               "nextNode": "node3"
             }
           ]
         },
         "node2": {
           "text": "NPC's response to first choice",
           "options": [
             {
               "text": "Go back",
               "nextNode": "startingNodeId"
             }
           ]
         },
         "node3": {
           "text": "NPC's response to second choice",
           "options": [
             {
               "text": "End conversation",
               "nextNode": "end"
             }
           ]
         },
         "end": {
           "text": "Farewell message when conversation ends",
           "options": []
         }
       }
     }
   }
   ```

To add an NPC to a room, include their ID in the room's configuration:
```json
{
  "someRoom": {
    "description": "A room with an NPC",
    "npcs": ["npcId"],
    "choices": ["Other actions", "Talk to npc"]
  }
}
```

### Creating Puzzles

The game includes a puzzle system that allows you to create various types of interactive puzzles. Puzzles are defined in `puzzles.json`.

1. **Item Combinations**
   ```json
   {
     "combinations": {
       "torch_flint": {
         "ingredients": ["torch", "flint"],
         "result": "litTorch",
         "message": "You strike the flint against the torch, lighting it!",
         "removeIngredients": true
       }
     }
   }
   ```
   Players can combine items using the command: `use item1 with item2`

2. **Sequence Puzzles**
   ```json
   {
     "sequences": {
       "altarRitual": {
         "requiredSequence": ["placeOffering", "lightCandles", "chantSpell"],
         "message": "The ritual is complete!",
         "reward": "ancientKey"
       }
     }
   }
   ```
   Players must perform actions in the correct order to complete the puzzle.

3. **Anagram Puzzles**
   ```json
   {
     "anagrams": {
       "libraryScroll": {
         "scrambled": "ARCANE GATES",
         "solution": "SACRED GATE",
         "hint": "Rearrange the letters to reveal the true name",
         "reward": "scrollOfWisdom"
       }
     }
   }
   ```
   Players can solve anagrams using the command: `solve [answer]`

To add puzzles to a room, include a `puzzles` array in the room definition:
```json
{
  "library": {
    "description": "A dusty library...",
    "puzzles": ["libraryScroll"]
  }
}
```

### Tips for Creating Puzzles

1. **Item Combinations**
   - Make combinations logical and intuitive
   - Provide hints through item descriptions or room text
   - Consider whether ingredients should be consumed
   - Use combinations to create tools needed for progression

2. **Sequence Puzzles**
   - Base sequences on environmental storytelling
   - Include hints in room descriptions
   - Consider making steps discoverable through exploration
   - Use sequences for ritual or mechanical interactions

3. **Anagram Puzzles**
   - Keep solutions relevant to the game's theme
   - Provide clear hints
   - Consider puzzle difficulty based on word length
   - Use rewards that make sense in context

4. **General Puzzle Tips**
   - Ensure puzzles fit the game's theme and setting
   - Provide adequate clues in room descriptions
   - Make rewards meaningful for game progression
   - Test all possible solutions and edge cases
   - Consider adding multiple ways to solve puzzles

### Creating Dialogues

The dialogue system allows you to create interactive conversations with NPCs. Each dialogue is structured as a tree where player choices determine the conversation path.

#### Dialogue Components

1. **NPC Definition**
   - `name`: The display name of the NPC
   - `initialNode`: The starting point of the conversation
   - `nodes`: Collection of dialogue nodes

2. **Dialogue Nodes**
   - `text`: What the NPC says
   - `options`: List of player response choices
   - Each option has:
     - `text`: The response text
     - `nextNode`: Which node to go to next

3. **Special Nodes**
   - Use `"nextNode": "end"` to end the conversation
   - The `end` node should have empty options

#### Example Dialogue

Here's an example of a merchant NPC:
```json
{
  "merchant": {
    "name": "Traveling Merchant",
    "initialNode": "greeting",
    "nodes": {
      "greeting": {
        "text": "Welcome, traveler! Care to see my wares?",
        "options": [
          {
            "text": "Show me what you have",
            "nextNode": "showItems"
          },
          {
            "text": "Ask about rumors",
            "nextNode": "rumors"
          },
          {
            "text": "Goodbye",
            "nextNode": "end"
          }
        ]
      },
      "showItems": {
        "text": "I have potions, scrolls, and rare artifacts. What interests you?",
        "options": [
          {
            "text": "Tell me about the potions",
            "nextNode": "potions"
          },
          {
            "text": "Back to main topics",
            "nextNode": "greeting"
          }
        ]
      },
      "rumors": {
        "text": "They say the temple's treasures are protected by ancient magic. Only those with special amulets can touch them safely.",
        "options": [
          {
            "text": "Back to main topics",
            "nextNode": "greeting"
          }
        ]
      },
      "potions": {
        "text": "Ah, my potions are quite special. Each one carefully brewed with rare ingredients.",
        "options": [
          {
            "text": "Back to items",
            "nextNode": "showItems"
          }
        ]
      },
      "end": {
        "text": "Safe travels, friend!",
        "options": []
      }
    }
  }
}
```

#### Tips for Creating Dialogues

1. **Plan Your Structure**
   - Draw out your dialogue tree before implementing
   - Consider all conversation paths
   - Plan for ways to return to previous topics

2. **Writing Good Dialogue**
   - Keep NPC responses concise but informative
   - Make options clearly distinct from each other
   - Use dialogue to provide hints and story elements

3. **Testing**
   - Test all conversation paths
   - Ensure all nodes can be reached
   - Verify that "end" nodes properly close the dialogue

4. **Integration**
   - Add NPCs to appropriate rooms
   - Include "Talk to [npc]" in room choices
   - Use dialogue to enhance the story and provide clues

Players can interact with NPCs using the `talk` command:
```
> talk merchant
> 1 (selects first option)
> 2 (selects second option)
```

### Example: Creating a Sci-Fi Adventure

Here's how you might structure a sci-fi adventure:

1. Update `config.json`:
   ```json
   {
     "gameName": "Space Station Alpha",
     "welcomeMessage": "Welcome to Space Station Alpha. Warning: Life support systems critical.",
     "startingRoom": "airlock"
   }
   ```

2. Add rooms in `rooms.json`:
   ```json
   {
     "airlock": {
       "description": "You're in the station's airlock. Emergency lights flash red, casting eerie shadows.",
       "exits": { "north": "corridor" },
       "items": ["spacesuit"],
       "choices": ["Go north to Corridor", "Take spacesuit"]
     },
     "corridor": {
       "description": "A long corridor stretches before you. Sparks fly from damaged circuits.",
       "exits": { 
         "north": "bridge",
         "east": "engineering" 
       },
       "requiredItems": {
         "east": ["keycard"]
       }
     }
   }
   ```

3. Define items in `items.json`:
   ```json
   {
     "spacesuit": {
       "description": "A pressurized suit for space walks.",
       "usableIn": ["vacuum"]
     },
     "keycard": {
       "description": "Security clearance card."
     }
   }
   ```

4. Set up rules in `rules.json`:
   ```json
   {
     "roomConditions": {
       "vacuum": {
         "enter": {
           "requires": {
             "inventory": "spacesuit",
             "failureMessage": "You're instantly exposed to the vacuum of space. Game Over!",
             "gameOver": true
           }
         }
       }
     },
     "winConditions": [
       {
         "room": "escapePod",
         "requires": {
           "inventory": ["dataCore"]
         },
         "message": "You escape with the vital station data. Mission accomplished!"
       }
     ]
   }
   ```

### Tips for Creating Adventures

1. Plan your map first - sketch out rooms and connections
2. Create atmospheric descriptions that fit your theme
3. Design puzzles around item requirements and room conditions
4. Consider using state-changing items for interactive puzzles
5. Test all possible paths through your game
6. Add appropriate images to `assets/images/` for each room
7. Record narration audio (optional) and place in `assets/sounds/narration/`

### Creating State-Changing Items

State-changing items are special items that can toggle game states when used. This is useful for creating interactive puzzles or environmental changes. To create a state-changing item:

1. Add the item to your `items.json` as normal
2. In `rules.json`, add an entry under `stateChangingItems`:
   ```json
   "itemName": {
     "toggleState": "stateName",
     "messages": {
       "true": "Message when state is turned on",
       "false": "Message when state is turned off"
     }
   }
   ```

Example uses:
- A torch that can be lit/unlit
- A lever that opens/closes doors
- A switch that powers machines on/off
- A magical crystal that reveals/hides hidden passages

The state can then be checked in room conditions to control access or trigger special events.

### Required Assets

- Room images should be placed in `assets/images/`
- Audio narration (optional) goes in `assets/sounds/narration/`
- Background music (optional) goes in `assets/sounds/`

Images should be in jpg/png format, and audio in mp3/m4a format.
