'use client';

import { useGameStore } from '@/store/gameStore';
import { Plane, CellState } from '@/types/game';

interface GameGridProps {
  isOpponent?: boolean;
  onAttack?: (x: number, y: number) => void;
}

export default function GameGrid({ isOpponent, onAttack }: GameGridProps) {
  const { gridSize, myPlanes, myGridHits, opponentGridHits, faction } = useGameStore();

  const getCellState = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (isOpponent) {
      return opponentGridHits[key] || 'empty';
    }
    return myGridHits[key] || 'empty';
  };

  const getMyPlaneAt = (x: number, y: number): { plane: Plane, isHead: boolean } | null => {
    if (isOpponent) return null;
    
    // Find if a plane is currently at this position
    for (const plane of myPlanes) {
      if (plane.isDestroyed) continue;
      const currentPos = plane.path[plane.currentPathIndex];
      if (currentPos.x === x && currentPos.y === y) {
        return { plane, isHead: true };
      }
      // Also show path faintly
      if (plane.path.some(c => c.x === x && c.y === y)) {
        return { plane, isHead: false };
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-bold uppercase tracking-widest text-green-500 mb-4 shadow-black drop-shadow-md">
        {isOpponent ? 'VÙNG TRỜI ĐỊCH' : 'VÙNG TRỜI CỦA BẠN'}
      </h3>
      <div 
        className="radar-grid border-2 border-green-600 grid relative"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, width: 'min(100%, 400px)', aspectRatio: '1/1' }}
      >
        {/* Radar sweeping line animation could be added here */}
        
        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);
          const state = getCellState(x, y);
          const planeData = getMyPlaneAt(x, y);
          
          let cellClass = "border-r border-b border-green-900/30 relative flex items-center justify-center transition-colors ";
          let cellBg = 'transparent';
          
          if (!isOpponent && onAttack) {
             cellClass += " cursor-pointer hover:bg-green-500/20";
          } else if (isOpponent && onAttack && state === 'empty') {
             cellClass += " cursor-crosshair hover:bg-red-500/30";
          }

          if (state === 'miss') {
            cellBg = 'rgba(100, 100, 100, 0.5)'; // Gray
          } else if (state === 'hit_path') {
            cellBg = 'rgba(255, 255, 0, 0.4)'; // Yellow
            cellClass += " radar-wave";
          } else if (state === 'hit_plane') {
            cellBg = 'rgba(255, 0, 0, 0.6)'; // Red
          } else if (planeData) {
            if (planeData.isHead) {
               cellBg = planeData.plane.isStunned ? 'rgba(255, 165, 0, 0.6)' : 'rgba(0, 255, 0, 0.4)'; // Stunned = orange, normal = green
            } else {
               cellBg = 'rgba(0, 255, 0, 0.1)'; // Path
            }
          }

          return (
            <div 
              key={i} 
              className={cellClass}
              style={{ backgroundColor: cellBg }}
              onClick={() => {
                if (isOpponent && onAttack && state === 'empty') {
                  onAttack(x, y);
                }
              }}
            >
              {state === 'miss' && <div className="w-2 h-2 rounded-full bg-gray-500"></div>}
              {state === 'hit_plane' && <div className="text-red-500 font-bold text-lg">X</div>}
              {planeData?.isHead && !isOpponent && (
                <img 
                  src={`/maybay/${faction}_FL${planeData.plane.id.replace('p','')}.png`} 
                  alt="plane" 
                  className={`w-[80%] h-[80%] object-contain ${planeData.plane.isStunned ? 'opacity-50 grayscale' : ''}`}
                  onError={(e) => { e.currentTarget.style.display = 'none' }} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
