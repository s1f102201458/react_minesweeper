import { useState, useEffect} from "react";
import createBoard from "./createBoard";
import Cell from "./Cell";

const Board = ({ row, col, mines }) => {
  const [gameData, setGameData] = useState({});
  const [resetGame, setResetGame] = useState(true);
  const [count, setCount] = useState(0);
  const [startCount, setStartCount] = useState(false);

  useEffect(() => {
    let interval;
    //startCountがtrueの場合、タイマーを進めない
    if(!startCount){return ()=>{}};
    if (startCount) {
      //startCountがtrueの場合、タイマーを開始
      interval = setInterval(() => {
        setCount((prevCount) => prevCount + 1);
      }, 1000);
    }

    if (gameData.gameStatus === "You Win" || gameData.gameStatus === "You Lost") {
      //プレイヤーの勝利または敗北でゲームが終了した場合はタイマーを停止する
      clearInterval(interval);
      //タイマーを再開しないようにする
      setStartCount(false);
    }
    return () => {
      //タイマーを停止
      clearInterval(interval);
      //タイマーを再開しないようにする
      setStartCount(false);
    };
  }, [startCount, gameData.gameStatus]);

  useEffect(() => {
    //リセットのフラグがtrueの場合
    if (resetGame) {
    //新たなボードを生成
      const newBoard = createBoard(row, col, mines);
      //コンソール上に表示
      console.log(newBoard);
      //ゲームデータを初期化する
      setGameData({
        //新たなボードを設定
        board: newBoard,
        //ゲーム状況の表示を初期化
        gameStatus: "Game in Progress",
        //地雷でないマスの数を計算
        cellsWithoutMines: row * col - mines,
        //地雷の数を設定
        numOfMines: mines,
      });
      //リセットのフラグをfalseへ戻す
      setResetGame(false);
      //タイマーをリセット
      setCount(0);
      setStartCount(false);
    }
  }, [resetGame]);

  const handleRevealCell = (x, y) => {
    if(!startCount){
      setStartCount(true);
    }
    // プレイヤーの勝利または敗北でゲームが終了した場合は処理を行わない
    if (gameData.gameStatus === "You Lost" || gameData.gameStatus === "You Win") {
      return;
    }
    // 既にオープンされているマスまたはフラグが立っているマスの場合は処理を行わない
    if (gameData.board[x][y].revealed || gameData.board[x][y].flagged) {
      return;
    }
    // ゲームデータをコピー
    const newGameData = { ...gameData };
    // クリックしたマスが地雷の場合
    if (newGameData.board[x][y].value === "X") {
      // すべての地雷マスをオープンする
      newGameData.board.forEach((row) => {
        //各セルについて
        row.forEach((cell) => {
        //地雷のマスであった場合
          if (cell.value === "X") {
            //マスをオープンする
            cell.revealed = true;
          }
        });
      });
      //失敗を表示
      newGameData.gameStatus = "You Lost";
    }
    // クリックしたマスの周囲に地雷がない場合 
    else if (newGameData.board[x][y].value === 0) {
      //周辺の空のセルをオープンする
      const newRevealedData = revealEmpty(x, y, newGameData);
      //ゲームデータを更新
      setGameData(newRevealedData);
      return;
    } 
    // クリックしたマスに1個以上の地雷がある場合
    else {
      // 選択したマスをオープンする 
      newGameData.board[x][y].revealed = true;
      // 地雷のないセルの数を減らす
      newGameData.cellsWithoutMines--;
      // 地雷のないセルがすべてオープンされた場合
      if (newGameData.cellsWithoutMines === 0) {
        //成功を表示
        newGameData.gameStatus = "You Win";
      }
    }
    //ゲームデータを更新
    setGameData(newGameData);
  };

  const revealEmpty = (x,y,data) => {
    if(!startCount){
      setStartCount(true);
    }
    if(data.board[x][y].revealed){return;}

    data.board[x][y].revealed = true;
    data.cellsWithoutMines--;
    if(data.cellsWithoutMines === 0){
        data.gameStatus = 'You Win';
    }
    //マスの周辺に地雷がない場合は、その周辺のマスを一度に開示
    if(data.board[x][y].value === 0){
        for(let y2 = Math.max(y-1, 0); y2 < Math.min(y+2, col); y2++){
            for(let x2 = Math.max(x-1, 0); x2 < Math.min(x+2 , row); x2++){
                if(x2 != x || y2 != y){revealEmpty(x2, y2, data);}
            }
        }
    }
    return data;
  }

  const handleUpdateFlag = (e, x, y) => {
    // デフォルトの動作を行わないようにする
    e.preventDefault();
    // プレイヤーの勝利または敗北でゲームが終了した場合は処理を行わない
    if (gameData.gameStatus === "You Lost" || gameData.gameStatus === "You win") {
      return;
    }
    // セルがすでに開いている場合は処理を行わない
    if (gameData.board[x][y].revealed) {
      return;
    }

    setGameData((prev) => {
      // 以前のボードをコピー
      const newBoard = [...prev.board];
      // セルのフラグを取得
      const newFlag = newBoard[x][y].flagged;
      // 地雷の残りの数を取得
      let newNumOfMines = prev.numOfMines;
      // フラグを反転させる処理を行う
      newFlag ? (newBoard[x][y].flagged = false) : (newBoard[x][y].flagged = true);
      //地雷の数を更新する
      newFlag ? newNumOfMines++ : newNumOfMines--;
      // 値を返す
      return {
        ...prev,
        numOfMines: newNumOfMines,
        board: newBoard,
      };
    });
  };

  if (!gameData.board) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>🚩{gameData.numOfMines}&nbsp;&nbsp; ⏱️{count} &nbsp;&nbsp;
      <button onClick = {() => {setResetGame(true);}}>Reset</button>
      </div>
      <div>Game Status: {gameData.gameStatus}</div>
      <div>
        {gameData.board.map((singleRow, index1) => {
          return (
            <div style={{ display: "flex" }} key={index1}>
              {singleRow.map((singleCell, index2) => {
                return (
                  <Cell
                    details={singleCell}
                    onUpdateFlag={handleUpdateFlag}
                    onRevealCell={handleRevealCell}
                    key={index2}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Board;
