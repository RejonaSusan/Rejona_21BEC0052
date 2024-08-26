import { useEffect, useState } from 'react';
import "./App.css";

function App() {
  const wsUri = "ws://127.0.0.1/";
  const websocket = new WebSocket(wsUri);

  const [board, setBoard] = useState(Array(5).fill().map(() => Array(5).fill("NA")));
  const [draggedPawn, setDraggedPawn] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('A');
  const [pawnsA, setPawnsA] = useState(["P1", "P2", "P3", "H1", "H2"]);
  const [pawnsB, setPawnsB] = useState(["P1", "P2", "P3", "H1", "H2"]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameStart, setGameStart] = useState(false);

  const handleCellClick = (rowId, colId) => {
    // Logic to handle cell clicks
    if(gameStart && board[rowId][colId] !== "NA"){
      console.log(`Cell clicked: (${rowId}, ${colId})`);
      setSelectedCell({row: rowId, col: colId});
    }else{
      console.log("invalid select");
    }
  };

  const dragStart = (e, pawn) => {
    setDraggedPawn(pawn);
  };

  const handleDrop = (e, rowId, colId) => {
    e.preventDefault();
    const pawn = draggedPawn;
    
    websocket.send(JSON.stringify({
      type: 'PLACE_PAWN',
      row: rowId,
      col: colId,
      player: currentPlayer,
      pawn: pawn
    }));
    setDraggedPawn(null);
  };

  const dragEnd = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    websocket.onopen = () => {
      console.log("connected");
    };

    websocket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'INITIAL_STATE') {
        setBoard(data.board);
        setPawnsA(data.pawnsA);
        setPawnsB(data.pawnsB);
        setCurrentPlayer(data.currentPlayer);
        setGameStarted(data.gameStart);
      } else if (data.type === 'UPDATE_BOARD') {
        setBoard(data.board);
        setPawnsA(data.pawnsA);
        setPawnsB(data.pawnsB);
        setCurrentPlayer(data.currentPlayer);
        setGameStarted(data.gameStart);
      }
    };

    websocket.onclose = () => {
      console.log("disconnected");
    };

    websocket.onerror = (e) => {
      console.log("error" + e.data);
    };
  }, [wsUri]);

  return (
    <div className='flex flex-row items-center justify-center text-center bg-black text-white p-5'>
      <div className="p-5 flex flex-col gap-3 justify-center items-center mr-20">
        <div className='p-2'><h2>Player 1</h2></div>
        {pawnsA.map((pawn, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => dragStart(e, pawn)}
            className="w-10 h-10 border border-white flex items-center justify-center bg-gray-800 text-white"
          >
            {pawn}
          </div>
        ))}
      </div>

      <div className='p-5 grid gap-5 justify-center grid-cols-5'>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className='w-20 h-20 border border-white flex items-center justify-center bg-gray-900'
              onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
              onDragOver={dragEnd}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell}
            </div>
          ))
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 justify-center items-center ml-20">
        <div className='p-2'><h2>Player 2</h2></div>
        {pawnsB.map((pawn, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => dragStart(e, pawn)}
            className="w-10 h-10 border border-white flex items-center justify-center bg-gray-800 text-white"
          >
            {pawn}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
