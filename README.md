# Pawn & Hero Board Game

Welcome to the Pawn & Hero Board Game! This is a simple yet strategic two-player game where each player controls a set of pawns and heroes, with the objective to outmaneuver and capture the opponent's pieces.

## Table of Contents

- [Getting Started](#getting-started)
- [Running the Game](#running-the-game)
- [Game Rules](#game-rules)
- [Gameplay](#gameplay)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- [Deno](https://deno.land/) (for server-side code)
- [Node.js](https://nodejs.org/) (for client-side development)
- A modern web browser

### Installing Dependencies

1. **Clone the repository**:

    ```bash
    git clone https://github.com/yourusername/pawn-hero-game.git
    cd pawn-hero-game
    ```

2. **Install Node.js dependencies**:

    ```bash
    npm install
    ```

## Running the Game

### Start the Deno Server

1. **Run the server**:

    ```bash
    deno run --allow-net --allow-read server.js
    ```

    This will start the WebSocket server on `ws://127.0.0.1:80`.

2. **Open the Game in the Browser**:

    Open your browser and navigate to `http://127.0.0.1` to start playing the game.

## Game Rules

### Overview

The game is played on a 5x5 grid. Each player controls a set of pawns and heroes, with different movement capabilities.

### Pieces and Movements

- **Pawns (P1, P2, P3)**:
  - Moves one step horizontally or vertically.
  - Cannot capture opponent's pieces.

- **Hero 1 (H1)**:
  - Moves two steps horizontally or vertically.
  - Can capture opponent's pawns and heroes.

- **Hero 2 (H2)**:
  - Moves two steps diagonally.
  - Can capture opponent's pawns and heroes.

### Objective

The goal is to capture all of the opponent's pawns. The first player to achieve this wins the game.

### How to Play

- **Place Pawns**:
  - Player A places pawns in row 0.
  - Player B places pawns in row 4.
  
- **Move Pieces**:
  - Once all pawns are placed, the game begins. Players take turns moving their pieces according to the movement rules.
  - Heroes can capture opponent pieces by landing on them.

- **Win Condition**:
  - A player wins when they capture all of the opponent's pawns.

## Gameplay

1. **Drag and Drop**:
   - Drag your pawns from your side to the board to place them.
   - Once placed, click on a piece to select it and then click on the target cell to move.

2. **Turn-Based Play**:
   - Players take turns placing and moving pieces.
   - Follow the game rules to strategize and outmaneuver your opponent.

3. **Victory**:
   - Capture all of your opponent's pawns to win the game.

## Contributing

Contributions are welcome! Feel free to fork this repository and submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
