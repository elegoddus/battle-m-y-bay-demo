'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useGameRealtime } from '@/hooks/useGameRealtime';
import SetupBoard from '@/components/SetupBoard';
import GameGrid from '@/components/GameGrid';
import { Radar, Terminal } from 'lucide-react';

export default function GamePage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const { 
    nickname, phase, turn, playerNumber, winner, logs,
    myPlanes, opponentGridHits 
  } = useGameStore();

  const { isConnected, opponentJoined, opponentReady, myReady, sendReady, sendAttack, opponentRemaining } = useGameRealtime(params.roomId);

  useEffect(() => {
    if (!nickname) {
      router.push('/');
    }
  }, [nickname, router]);

  if (!nickname) return null;

  const isMyTurn = turn === playerNumber;

  const handleAttack = (x: number, y: number) => {
    if (!isMyTurn) return;
    sendAttack(x, y);
  };

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Header */}
      <header className="border-b border-green-800 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-green-500 drop-shadow-[0_0_5px_rgba(0,255,0,0.8)] flex items-center gap-2">
            <Radar className="animate-spin-slow w-6 h-6" /> KHU VỰC CHIẾN SỰ: {params.roomId.toUpperCase()}
          </h1>
          <p className="text-xs text-green-600 mt-1 uppercase">Định danh: {nickname} | Trạm: {playerNumber}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-green-400">
            Tình trạng Liên lạc: {isConnected ? <span className="text-green-500 font-bold">BẢO MẬT</span> : <span className="text-red-500 animate-pulse">ĐANG THIẾT LẬP...</span>}
          </div>
          <div className="text-sm font-mono text-green-400">
            Kẻ địch: {opponentJoined ? <span className="text-red-500 font-bold drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">PHÁT HIỆN</span> : <span className="text-gray-500">CHƯA XÁC ĐỊNH</span>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {phase === 'lobby' && (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <Radar className="w-24 h-24 animate-pulse text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-green-500">Đang chờ lệnh...</h2>
            {!opponentJoined ? (
              <p className="text-green-600 mt-2">Chờ đối thủ tham gia kênh liên lạc...</p>
            ) : (
              <button 
                onClick={() => useGameStore.getState().setPhase('setup')}
                className="mt-6 px-8 py-3 bg-green-600 text-black font-bold uppercase rounded shadow-[0_0_15px_rgba(0,255,0,0.5)] hover:bg-green-500"
              >
                Tiến vào Bãi Đáp
              </button>
            )}
          </div>
        )}

        {phase === 'setup' && (
          <div className="animate-fade-in">
            {!myReady ? (
              <SetupBoard onReady={sendReady} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[40vh] border border-green-800 bg-green-950/20">
                <h2 className="text-2xl font-bold text-green-500 mb-4">Đội bay đã vào vị trí!</h2>
                <p className="text-green-600">Đang chờ đối thủ dàn trận...</p>
              </div>
            )}
          </div>
        )}

        {phase === 'playing' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex justify-between items-center bg-green-900/30 p-4 border border-green-800 rounded">
              <div className="text-lg font-bold">
                Lượt của: <span className={isMyTurn ? "text-green-400 drop-shadow-[0_0_5px_rgba(0,255,0,0.8)] animate-pulse" : "text-red-500"}>
                  {isMyTurn ? "BẠN" : "ĐỐI THỦ"}
                </span>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-xs text-green-600 uppercase">Phe ta</div>
                  <div className="text-2xl font-bold text-green-500">{myPlanes.filter(p => !p.isDestroyed).length}/4</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-red-800 uppercase">Kẻ địch</div>
                  <div className="text-2xl font-bold text-red-500">{opponentRemaining}/4</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
              <div className={`transition-opacity duration-300 ${!isMyTurn ? 'opacity-50' : 'opacity-100 shadow-[0_0_30px_rgba(255,0,0,0.1)]'}`}>
                <GameGrid isOpponent={true} onAttack={handleAttack} />
              </div>
              
              <div className={`transition-opacity duration-300 ${isMyTurn ? 'opacity-50' : 'opacity-100 shadow-[0_0_30px_rgba(0,255,0,0.1)]'}`}>
                <GameGrid isOpponent={false} />
              </div>
            </div>
            
            {/* Action Logs */}
            <div className="border border-green-800 rounded p-4 bg-black/80 h-40 overflow-y-auto flex flex-col-reverse">
              {logs.slice().reverse().map((log, i) => (
                <div key={i} className="flex gap-2 items-start text-sm mb-1">
                  <Terminal className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
                  <span className={log.includes('BẠN') || log.includes('Bạn') ? 'text-green-400' : 'text-red-400'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'gameover' && (
          <div className="flex flex-col items-center justify-center h-[50vh] animate-bounce-in">
            <h1 className={`text-6xl font-bold uppercase tracking-widest ${winner === playerNumber ? 'text-green-500 drop-shadow-[0_0_20px_rgba(0,255,0,1)]' : 'text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,1)]'}`}>
              {winner === playerNumber ? 'CHIẾN THẮNG' : 'THẤT BẠI'}
            </h1>
            <button 
              onClick={() => router.push('/')}
              className="mt-8 px-6 py-2 border border-green-500 text-green-500 hover:bg-green-900/50"
            >
              Rời chiến trường
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
