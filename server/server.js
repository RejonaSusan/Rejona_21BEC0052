let board = Array(5).fill().map(() => Array(5).fill("NA"));
let currentPlayer = 'A';

let pawnsA = ["P1", "P2", "P3", "H1", "H2"];
let pawnsB = ["P1", "P2", "P3", "H1", "H2"];

let gameStart = false;

const clients = new Set();

const broadcast = (clients, message) => {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

Deno.serve({
  port: 80,
  handler: async (request) => {
    if (request.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request);

      socket.onopen = () => {
        console.log("CONNECTED");
        clients.add(socket);
        socket.send(JSON.stringify({
          type: 'INITIAL_STATE',
          board,
          pawnsA,
          pawnsB,
          currentPlayer 
        }));
      };

      socket.onmessage = (event) => {
        console.log(`RECEIVED: ${event.data}`);
        const data = JSON.parse(event.data);

        if (data.type === 'PLACE_PAWN') {
          const { row, col, player, pawn } = data;

          if (currentPlayer === player) {
            if (board[row][col] === "NA") {
              if (player === 'A' && row === 0) {
                board[row][col] = pawn;
                pawnsA = pawnsA.filter(p => p !== pawn);
                currentPlayer = 'B';
              } else if (player === 'B' && row === 4) {
                board[row][col] = pawn;
                pawnsB = pawnsB.filter(p => p !== pawn);
                currentPlayer = 'A';
              }

              if (pawnsA.length === 0 && pawnsB.length === 0) {
                gameStart = true;
              }

              broadcast([...clients], JSON.stringify({
                type: 'UPDATE_BOARD',
                board,
                pawnsA,
                pawnsB,
                currentPlayer,
                gameStart
              }));
            } else {
              socket.send(JSON.stringify({
                type: 'ERROR',
                message: 'Position already occupied'
              }));
              console.log("Position already occupied");
            }
          }
        } else if (data.type === 'MOVE_PAWN' && gameStart) {
          const { row, col, player, direction } = data;
          const pawn = board[row][col];

          if (pawn !== "NA" && currentPlayer === player) {
            // Update the board based on the direction
            let newRow = row, newCol = col;

            switch (direction) {
              case 'up':
                newRow = Math.max(row - 1, 0);
                break;
              case 'down':
                newRow = Math.min(row + 1, 4);
                break;
              case 'left':
                newCol = Math.max(col - 1, 0);
                break;
              case 'right':
                newCol = Math.min(col + 1, 4);
                break;
            }

            if (board[newRow][newCol] === "NA") {
              board[newRow][newCol] = pawn;
              board[row][col] = "NA";
              currentPlayer = currentPlayer === 'A' ? 'B' : 'A';
              broadcast([...clients], JSON.stringify({
                type: 'UPDATE_BOARD',
                board,
                currentPlayer
              }));
            }
          }
        }
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
      
        if (data.type === 'PLACE_PAWN') {
          const { row, col, player, pawn } = data;
      
          if (currentPlayer === player) {
            if (board[row][col] === "NA") {
              if (player === 'A' && row === 0) {
                board[row][col] = pawn;
                pawnsA = pawnsA.filter(p => p !== pawn);
                currentPlayer = 'B';
              } else if (player === 'B' && row === 4) {
                board[row][col] = pawn;
                pawnsB = pawnsB.filter(p => p !== pawn);
                currentPlayer = 'A';
              }
      
              if (pawnsA.length === 0 && pawnsB.length === 0) {
                gameStart = true;
              }
              
              broadcast([...clients], JSON.stringify({
                type: 'UPDATE_BOARD',
                board,
                pawnsA,
                pawnsB,
                currentPlayer
              }));
            } else {
              socket.send(JSON.stringify({
                type: 'ERROR'
              }));
              console.log("Position already occupied");
            }
          }
        } else if (data.type === 'MOVE_PAWN' && gameStart) {
          const { row, col, player, direction } = data;
          const pawn = board[row][col];
          
          if (pawn !== "NA" && currentPlayer === player) {
            let newRow = row, newCol = col;
      
            switch (direction) {
              case 'up':
                newRow = Math.max(row - 1, 0);
                break;
              case 'down':
                newRow = Math.min(row + 1, 4);
                break;
              case 'left':
                newCol = Math.max(col - 1, 0);
                break;
              case 'right':
                newCol = Math.min(col + 1, 4);
                break;
            }
      
            if (board[newRow][newCol] === "NA") {
              board[newRow][newCol] = pawn;
              board[row][col] = "NA";
              currentPlayer = currentPlayer === 'A' ? 'B' : 'A';
              broadcast([...clients], JSON.stringify({
                type: 'UPDATE_BOARD',
                board,
                currentPlayer
              }));
            }
          }
        }
      };
      

      socket.onclose = () => {
        console.log("DISCONNECTED");
        clients.delete(socket);
      };

      socket.onerror = (error) => console.error("ERROR:", error);

      return response;
    } else {
      const file = await Deno.open("./index.html", { read: true });
      return new Response(file.readable);
    }
  },
});
