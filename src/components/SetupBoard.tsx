'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Plane, Coordinate, PlaneType } from '@/types/game';

interface SetupBoardProps {
  onReady: () => void;
}

export default function SetupBoard({ onReady }: SetupBoardProps) {
  const { gridSize, setMyPlanes, faction } = useGameStore();
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [selectedType, setSelectedType] = useState<PlaneType | null>(null);
  const [currentPath, setCurrentPath] = useState<Coordinate[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const planeTypes: { type: PlaneType, label: string, color: string, id: string }[] = [
    { type: 'main', label: 'Chủ Lực', color: 'bg-red-500', id: 'p1' },
    { type: 'speed', label: 'Tốc Độ', color: 'bg-blue-500', id: 'p2' },
    { type: 'stealth', label: 'Tàng Hình', color: 'bg-purple-500', id: 'p3' },
    { type: 'recon', label: 'Do Thám', color: 'bg-gray-400', id: 'p4' },
  ];

  const totalPathTiles = planes.reduce((acc, p) => acc + p.path.length, 0) + currentPath.length;
  const targetTiles = Math.floor((gridSize * gridSize) / 5);

  const handleCellClick = (x: number, y: number) => {
    if (!selectedType) return;
    
    // Check if type already exists
    if (planes.some(p => p.type === selectedType)) {
      return; // Already placed this type
    }

    if (!isDrawing) {
      // Start drawing
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    } else {
      // Add to path
      // Only allow adjacent cells
      const last = currentPath[currentPath.length - 1];
      const isAdjacent = Math.abs(last.x - x) <= 1 && Math.abs(last.y - y) <= 1 && !(last.x === x && last.y === y);
      
      if (isAdjacent && currentPath.length < 10) {
        // Prevent intersecting its own path? Or allow? Let's allow but prevent same cell.
        if (!currentPath.some(c => c.x === x && c.y === y)) {
          setCurrentPath([...currentPath, { x, y }]);
        }
      }
    }
  };

  const finishDrawing = () => {
    if (currentPath.length >= 3 && currentPath.length <= 10 && selectedType) {
      const typeInfo = planeTypes.find(t => t.type === selectedType);
      const newPlane: Plane = {
        id: typeInfo!.id,
        type: selectedType,
        path: currentPath,
        currentPathIndex: 0,
        isDestroyed: false,
        isStunned: false,
        hasUsedBombard: false,
      };
      setPlanes([...planes, newPlane]);
      setCurrentPath([]);
      setIsDrawing(false);
      setSelectedType(null);
    } else {
      // Reset
      setCurrentPath([]);
      setIsDrawing(false);
      alert('Đường bay phải dài từ 3 đến 10 ô!');
    }
  };

  const cancelDrawing = () => {
    setCurrentPath([]);
    setIsDrawing(false);
  }

  const removePlane = (type: PlaneType) => {
    setPlanes(planes.filter(p => p.type !== type));
  };

  const handleReady = () => {
    if (planes.length !== 4) {
      alert('Bạn phải đặt đủ 4 máy bay!');
      return;
    }
    if (totalPathTiles !== targetTiles) {
      alert(`Tổng ô đường bay phải chính xác bằng ${targetTiles} ô (Hiện tại: ${totalPathTiles})`);
      return;
    }
    setMyPlanes(planes);
    onReady();
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Controls */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-green-800 pb-2">Giai Đoạn Thiết Lập</h2>
        <div className="text-sm text-green-400 mb-2">
          Tổng ô đường bay: <span className={totalPathTiles === targetTiles ? 'text-green-500 font-bold' : 'text-red-500'}>{totalPathTiles} / {targetTiles}</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {planeTypes.map(pt => {
            const isPlaced = planes.some(p => p.type === pt.type);
            const isSelected = selectedType === pt.type;
            
            return (
              <div key={pt.type} className={`p-3 border rounded flex justify-between items-center ${isPlaced ? 'border-green-800 opacity-50' : isSelected ? 'border-green-400 bg-green-900/30' : 'border-green-800 hover:border-green-500 cursor-pointer'}`}
                onClick={() => {
                  if (!isPlaced && !isDrawing) setSelectedType(pt.type);
                }}
              >
                <div className="flex items-center gap-2">
                  {/* Plane Icon based on faction */}
                  <img src={`/maybay/${faction}_FL${pt.id.replace('p','')}.png`} alt={pt.label} className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <span className="font-bold">{pt.label}</span>
                </div>
                {isPlaced && (
                  <button onClick={() => removePlane(pt.type)} className="text-red-500 text-xs hover:text-red-400 border border-red-800 px-2 rounded">Bỏ</button>
                )}
              </div>
            );
          })}
        </div>

        {isDrawing && (
          <div className="mt-4 p-4 border border-yellow-600 bg-yellow-900/20 rounded">
            <p className="text-sm text-yellow-500 mb-2">Đang vẽ đường bay ({currentPath.length} ô)...</p>
            <div className="flex gap-2">
              <button onClick={finishDrawing} className="px-4 py-1 bg-yellow-600 text-black text-xs font-bold rounded">Xong</button>
              <button onClick={cancelDrawing} className="px-4 py-1 border border-red-500 text-red-500 text-xs font-bold rounded">Hủy</button>
            </div>
          </div>
        )}

        <button 
          onClick={handleReady}
          className={`mt-4 py-3 font-bold tracking-wider uppercase rounded ${planes.length === 4 && totalPathTiles === targetTiles ? 'bg-green-600 text-black hover:bg-green-500 shadow-[0_0_15px_rgba(0,255,0,0.5)]' : 'bg-green-900/50 text-green-700 cursor-not-allowed border border-green-800'}`}
        >
          Sẵn Sàng Tác Chiến
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 flex justify-center items-center">
        <div 
          className="radar-grid border border-green-500 grid"
          style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, width: 'min(100%, 500px)', aspectRatio: '1/1' }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            
            // Check if cell is in placed planes
            const placedPlane = planes.find(p => p.path.some(c => c.x === x && c.y === y));
            // Check if in current path
            const isInCurrentPath = currentPath.some(c => c.x === x && c.y === y);
            
            let cellBg = 'transparent';
            if (isInCurrentPath) {
              const idx = currentPath.findIndex(c => c.x === x && c.y === y);
              cellBg = idx === 0 ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 0, 0.2)'; // Highlight start
            } else if (placedPlane) {
              const idx = placedPlane.path.findIndex(c => c.x === x && c.y === y);
              const colorInfo = planeTypes.find(t => t.type === placedPlane.type)?.color || 'bg-white';
              cellBg = idx === 0 ? 'rgba(0, 255, 0, 0.6)' : 'rgba(0, 255, 0, 0.2)';
            }

            return (
              <div 
                key={i} 
                onClick={() => handleCellClick(x, y)}
                className="border-r border-b border-green-900/50 relative cursor-pointer hover:bg-green-500/20 transition-colors"
                style={{ backgroundColor: cellBg }}
              >
                {(isInCurrentPath || placedPlane) && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] opacity-50">
                    {isInCurrentPath ? currentPath.findIndex(c => c.x === x && c.y === y) + 1 : placedPlane?.path.findIndex(c => c.x === x && c.y === y)! + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
