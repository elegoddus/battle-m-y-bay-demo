'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Faction } from '@/types/game';
import { Radar, Plane } from 'lucide-react';

export default function LobbyPage() {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [faction, setFaction] = useState<Faction>('A');
  const [isCreator, setIsCreator] = useState(true);
  const router = useRouter();
  
  const { setLobbyInfo, setPlayerNumber } = useGameStore();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !roomId) return;
    
    setLobbyInfo(nickname, roomId, password, faction);
    setPlayerNumber(isCreator ? 1 : 2);
    
    router.push(`/game/${roomId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="flex items-center gap-4 mb-8">
        <Radar className="w-10 h-10 md:w-16 md:h-16 animate-pulse text-green-500" />
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-widest text-green-500 uppercase drop-shadow-[0_0_10px_rgba(0,255,0,0.8)] text-center">
          Flane Battle
        </h1>
      </div>

      <div className="w-full max-w-lg p-6 md:p-10 border border-green-800 bg-green-950/40 shadow-[0_0_15px_rgba(0,255,0,0.2)] rounded-xl backdrop-blur-md">
        <form onSubmit={handleJoin} className="flex flex-col gap-6">
          
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-green-400">Danh xưng (Nickname)</label>
            <input 
              type="text" 
              required
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full bg-black border border-green-800 p-4 rounded text-green-100 placeholder:text-green-800/50 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
              placeholder="VD: Maverick"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-green-400">Phe phái</label>
            <div className="grid grid-cols-4 gap-3">
              {(['A', 'J', 'R', 'V'] as Faction[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFaction(f)}
                  className={`py-2 flex justify-center border rounded ${faction === f ? 'bg-green-800/50 border-green-400 text-white shadow-[0_0_10px_rgba(0,255,0,0.5)]' : 'border-green-900 text-green-700 hover:border-green-700'}`}
                >
                  <Plane className="w-5 h-5" /> {f}
                </button>
              ))}
            </div>
            <p className="text-xs text-green-700 mt-2 text-center font-mono">A: Mỹ | J: Nhật | R: Nga | V: VN</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <button 
              type="button"
              onClick={() => setIsCreator(true)}
              className={`py-3 border rounded font-bold uppercase tracking-wider transition-colors ${isCreator ? 'bg-green-800/60 border-green-400 text-green-100 shadow-[0_0_10px_rgba(0,255,0,0.3)]' : 'border-green-900 text-green-800 hover:border-green-700'}`}
            >
              Tạo phòng
            </button>
            <button 
              type="button"
              onClick={() => setIsCreator(false)}
              className={`py-3 border rounded font-bold uppercase tracking-wider transition-colors ${!isCreator ? 'bg-green-800/60 border-green-400 text-green-100 shadow-[0_0_10px_rgba(0,255,0,0.3)]' : 'border-green-900 text-green-800 hover:border-green-700'}`}
            >
              Vào phòng
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-green-400">Mã phòng (Room ID)</label>
            <input 
              type="text" 
              required
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              className="w-full bg-black border border-green-800 p-4 rounded text-green-100 placeholder:text-green-800/50 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors font-mono"
              placeholder="VD: delta-force-1"
            />
          </div>

          <button 
            type="submit"
            className="mt-4 py-4 w-full bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest rounded transition-all duration-300 shadow-[0_0_15px_rgba(0,255,0,0.4)] hover:shadow-[0_0_25px_rgba(0,255,0,0.6)]"
          >
            {isCreator ? 'Khởi tạo Chiến dịch' : 'Tham gia Chiến dịch'}
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-green-800 text-xs text-center max-w-md">
        <p>CẢNH BÁO MẬT: Kết nối bảo mật chuẩn giao thức Supabase Realtime.</p>
        <p>Hệ thống tự động đồng bộ tác chiến.</p>
      </div>
    </div>
  );
}
