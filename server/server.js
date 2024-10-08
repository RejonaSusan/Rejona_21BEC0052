let board = Array(5).fill().map(() => Array(5).fill(''));
let currentPlayer = 'A';

let pawnsA = ["A-P1", "A-P2", "A-P3", "A-H1", "A-H2"];
let pawnsB = ["B-P1", "B-P2", "B-P3", "B-H1", "B-H2"];

let msg = "";

let gameStart = false;
let gameEnd = false;

const clients = new Set();

const broadcast = (clients, message) => {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

const checkGameEnd = () => {
  if (pawnsA.length === 5) {
    gameEnd = true;
    return 'Player A wins! All pawns of Player A are captured.';
  } else if (pawnsB.length === 5) {
    gameEnd = true;
    return 'Player B wins! All pawns of Player B are captured.';
  }
  return null;
};

const isValidMove = (fromRow, fromCol, toRow, toCol, player, pawnType) => {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  if (pawnType === 'P1' || pawnType === 'P2' || pawnType === 'P3') {
    // Pawn: moves one block left, right, up, or down
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  } else if (pawnType === 'H1') {
    // Hero1: moves two blocks left, right, up, or down
    return (rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2);
  } else if (pawnType === 'H2') {
    // Hero2: moves two blocks diagonally in any direction 
    return rowDiff === 2 && colDiff === 2;
  }

  return false;
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
          gameStart,
          msg
        }));
      };

      socket.onmessage = (event) => {
        console.log(`RECEIVED: ${event.data}`);
        const data = JSON.parse(event.data);

        if (data.type === 'PLACE_PAWN') {
          const { row, col, player, pawn } = data;

          if (currentPlayer === pawn.charAt(0)) {
            if (board[row][col] === '') {

              // Ensure Player A places pawns in row 0
              if (player === 'A' && row === 0) {
                board[row][col] = pawn;
                pawnsA = pawnsA.filter(p => p !== pawn);
                currentPlayer = 'B';
                msg = `${player} placed ${pawn} at (${row}, ${col})`;
              }
              // Ensure Player B places pawns in row 4
              else if (player === 'B' && row === 4) {
                board[row][col] = pawn;
                pawnsB = pawnsB.filter(p => p !== pawn);
                currentPlayer = 'A';
                msg = `${player} placed ${pawn} at (${row}, ${col})`;
              } 
              // Error if player places pawn in the wrong row
              else {
                msg = player === 'A' ? "Player A can only place pawns in row 0" : "Player B can only place pawns in row 4";
                socket.send(JSON.stringify({
                  type: 'ERROR',
                  message: msg
                }));
              }

              if (pawnsA.length === 0 && pawnsB.length === 0) {
                gameStart = true;
                msg = "Game started!";
              }

              broadcast([...clients], JSON.stringify({
                type: 'UPDATE_BOARD',
                board,
                pawnsA,
                pawnsB,
                currentPlayer,
                gameStart,
                msg
              }));

            } else {
              msg = "Position already occupied";
              socket.send(JSON.stringify({
                type: 'ERROR',
                message: msg
              }));

              broadcast([...clients], JSON.stringify({
                type: 'UPDATE_BOARD',
                board,
                pawnsA,
                pawnsB,
                currentPlayer,
                gameStart,
                msg
              }));
            }
          } else {
            msg = "Not your turn";
            socket.send(JSON.stringify({
              type: 'ERROR',
              message: msg
            }));

            broadcast([...clients], JSON.stringify({
              type: 'UPDATE_BOARD',
              board,
              pawnsA,
              pawnsB,
              currentPlayer,
              gameStart,
              msg
            }));
          }
        } 
        
        else if (data.type === 'MOVE_PAWN') {
          const { fromRow, fromCol, toRow, toCol, player, pawn } = data;
          const pawnType = pawn.split('-')[1]; // Extract pawn type (P, H1, H2)

          if (gameEnd) {
            socket.send(JSON.stringify({
              type: 'ERROR',
              message: 'Game has already ended'
            }));
            return;
          }
      
          if (currentPlayer !== pawn.charAt(0)) {
            // If it's not the current player's turn
            socket.send(JSON.stringify({
              type: 'ERROR',
              message: 'Not your turn'
            }));
            return;
          }
      
          if (board[fromRow][fromCol] !== pawn) {
            // If the pawn is not at the specified position
            socket.send(JSON.stringify({
              type: 'ERROR',
              message: 'Invalid pawn position'
            }));
            return;
          }

          if(pawnsA.length === 5 || pawnsB.length === 5){

          }
      
          if (isValidMove(fromRow, fromCol, toRow, toCol, player, pawnType)) {
            
            const targetPawn = board[toRow][toCol];            
            if ((targetPawn === '' || (targetPawn.charAt(0) !== player && !pawnType.startsWith('P'))) && currentPlayer === player) {
              // Move pawn

              board[toRow][toCol] = pawn;
              board[fromRow][fromCol] = '';
      
              // Handle capturing
              if (targetPawn !== '' && !pawnType.startsWith('P')) {
                if (player === 'A') {
                  pawnsB = pawnsB.filter(p => p !== targetPawn);
                  pawnsA.push(targetPawn); // Add captured pawn to player A's list
                } else if (player === 'B') {
                  pawnsA = pawnsA.filter(p => p !== targetPawn);
                  pawnsB.push(targetPawn); // Add captured pawn to player B's list
                }
              }
      
              const gameOverMessage = checkGameEnd();
                if (gameOverMessage) {
                  gameEnd = true;
                  msg = gameOverMessage;
                } else {
                  // Switch turn
                  currentPlayer = currentPlayer === 'A' ? 'B' : 'A';
                  msg = `Player ${player} moved ${pawnType} from (${fromRow},${fromCol}) to (${toRow},${toCol})`;
                }
      
              broadcast([...clients], JSON.stringify({
                type: 'UPDATE_BOARD',
                board,
                pawnsA,
                pawnsB,
                currentPlayer,
                gameStart,
                msg: msg
              }));
            } else {
              socket.send(JSON.stringify({
                type: 'ERROR',
                message: 'Invalid move: Target position occupied by own pawn'
              }));

              broadcast([...clients], JSON.stringify({
                type: 'UPDATE_BOARD',
                board,
                pawnsA,
                pawnsB,
                currentPlayer,
                gameStart,
                msg
              }));

            }
          } else {
            socket.send(JSON.stringify({
              type: 'ERROR',
              message: 'Invalid move'
            }));

            broadcast([...clients], JSON.stringify({
              type: 'UPDATE_BOARD',
              board,
              pawnsA,
              pawnsB,
              currentPlayer,
              gameStart,
              msg
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
