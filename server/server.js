let board = Array(5).fill().map(() => Array(5).fill(''));
let currentPlayer = 'A';

let pawnsA = ["A-P1", "A-P2", "A-P3", "A-H1", "A-H2"];
let pawnsB = ["B-P1", "B-P2", "B-P3", "B-H1", "B-H2"];

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
          currentPlayer,
          gameStart 
        }));
      };

      socket.onmessage = (event) => {
        console.log(`RECEIVED: ${event.data}`);
        const data = JSON.parse(event.data);
      
        if (data.type === 'PLACE_PAWN') {
          const { row, col, player, pawn } = data;
      
          if (currentPlayer === player) {
            if (board[row][col] === '') {
              if (currentPlayer === player) {
                const opponentPlayer = player === 'A' ? 'B' : 'A';
                // Ensure Player A places pawns in row 0
                if (player === 'A' && row === 0) {
                  if (board[row][col] === '') {
                    board[row][col] = pawn;
                    pawnsA = pawnsA.filter(p => p !== pawn);
                    currentPlayer = 'B';
                  } else {
                    socket.send(JSON.stringify({
                      type: 'ERROR',
                      message: 'Position already occupied'
                    }));
                    console.log("Position already occupied");
                  }
                } 
                // Ensure Player B places pawns in row 4
                else if (player === 'B' && row === 4) {
                  if (board[row][col] === '') {
                    board[row][col] = pawn;
                    pawnsB = pawnsB.filter(p => p !== pawn);
                    currentPlayer = 'A';
                  } else {
                    socket.send(JSON.stringify({
                      type: 'ERROR',
                      message: 'Position already occupied'
                    }));
                    console.log("Position already occupied");
                  }
                } 
                // Error if player places pawn in the wrong row
                else {
                  socket.send(JSON.stringify({
                    type: 'ERROR',
                    message: player === 'A' ? 'Player A can only place pawns in row 0' : 'Player B can only place pawns in row 4'
                  }));
                  console.log(player === 'A' ? 'Player A can only place pawns in row 0' : 'Player B can only place pawns in row 4');
                }
              } else {
                socket.send(JSON.stringify({
                  type: 'ERROR',
                  message: 'Not your turn'
                }));
                console.log("Not your turn");
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
        } else if (data.type === 'MOVE_PAWN') { // New block for moving pawns
          const { fromRow, fromCol, toRow, toCol, player } = data;
      
          if (board[fromRow][fromCol] !== '' && board[toRow][toCol] === '' && currentPlayer === player) {
            const pawn = board[fromRow][fromCol];
            board[fromRow][fromCol] = '';
            board[toRow][toCol] = pawn;
            currentPlayer = currentPlayer === 'A' ? 'B' : 'A';
      
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
              message: 'Invalid move'
            }));
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
