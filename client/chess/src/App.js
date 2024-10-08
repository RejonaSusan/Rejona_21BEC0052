import { useEffect, useState } from 'react';
import "./App.css";

function App() {
  const wsUri = "ws://127.0.0.1/";
  const websocket = new WebSocket(wsUri);

  const [board, setBoard] = useState(Array(5).fill().map(() => Array(5).fill('')));
  const [draggedPawn, setDraggedPawn] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('A');
  const [pawnsA, setPawnsA] = useState(["A-P1", "A-P2", "A-P3", "A-H1", "A-H2"]);
  const [pawnsB, setPawnsB] = useState(["B-P1", "B-P2", "B-P3", "B-H1", "B-H2"]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameStart, setGameStart] = useState(false);
  const [msg, setMsg] = useState('');


  const handleCellClick = (rowId, colId) => {
    if (gameStart && selectedCell) {
      const pawn = board[selectedCell.row][selectedCell.col];
      websocket.send(JSON.stringify({
        type: 'MOVE_PAWN',
        fromRow: selectedCell.row,
        fromCol: selectedCell.col,
        toRow: rowId,
        toCol: colId,
        player: currentPlayer,
        pawn: pawn
      }));
      setSelectedCell(null);
    } else if (board[rowId][colId] !== '') {
      setSelectedCell({ row: rowId, col: colId });
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
      switch(data.type){
        case 'INITIAL_STATE':
          setBoard(data.board);
          setPawnsA(data.pawnsA);
          setPawnsB(data.pawnsB);
          setCurrentPlayer(data.currentPlayer);
          setGameStart(data.gameStart);
          setMsg(data.msg || '');
          break;
        case 'UPDATE_BOARD':
          setBoard(data.board);
          setPawnsA(data.pawnsA);
          setPawnsB(data.pawnsB);
          setCurrentPlayer(data.currentPlayer);
          setGameStart(data.gameStart);
          setMsg(data.msg || '');
          break;
        case 'ERROR':
          setMsg(data.msg || '');
          break;
        default:
          setMsg(data.msg || '');
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
    <div className='flex flex-col items-center justify-center text-center bg-black text-white p-5'>
      <h1 className='text-xl mt-5'>{msg}</h1>
      <h1 className='text-xl mb-5'>It is {currentPlayer}'s turn</h1>

      <div className='flex flex-row'>
        <div className="p-5 flex flex-col gap-3 justify-center items-center mr-20">
          <div className='p-2'><h2>Player 1</h2></div>
          {pawnsA.map((pawn, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => dragStart(e, pawn)}
              className="w-20 h-10 border border-white flex items-center justify-center bg-gray-800 text-white"
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
              className="w-20 h-10 border border-white flex items-center justify-center bg-gray-800 text-white"
            >
              {pawn}
            </div>
          ))}
        </div>
      </div>

      <div className='p-5 mt-10 bg-gray-800 text-white rounded'>
        <h2 className='text-lg mb-2'>Game Rules:</h2>
        <ul className='list-disc list-inside'>
          <li><strong>Pawns (P1, P2, P3):</strong> Move one step horizontally or vertically; cannot capture.</li>
          <li><strong>Heroes (H1, H2):</strong> H1 moves two steps horizontally or vertically; H2 moves two steps diagonally.</li>
          <li><strong>Capture:</strong> Only Heroes (H1, H2) can capture opponent's pawns or heroes.</li>
        </ul>
      </div>
  </div>

  );
}

export default App;
