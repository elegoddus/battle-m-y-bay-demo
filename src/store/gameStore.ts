import { create } from 'zustand';
import { GameState, Plane, Faction, CellState } from '@/types/game';

interface GameStore extends GameState {
  setLobbyInfo: (nickname: string, roomId: string, password?: string, faction?: Faction) => void;
  setPlayerNumber: (num: 1 | 2) => void;
  setPhase: (phase: GameState['phase']) => void;
  setMyPlanes: (planes: Plane[]) => void;
  setGridSize: (size: number) => void;
  addLog: (log: string) => void;
  
  // Combat actions
  setTurn: (turn: number) => void;
  receiveAttack: (x: number, y: number) => { hitType: CellState, planeId?: string, isStealth?: boolean };
  recordOpponentHit: (x: number, y: number, state: CellState) => void;
  movePlanes: () => void;
  setWinner: (winner: number) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  myPlanes: [],
  myGridHits: {},
  opponentGridHits: {},
  gridSize: 10,
  phase: 'lobby',
  turn: 1,
  winner: null,
  nickname: '',
  faction: 'A',
  roomId: '',
  playerNumber: 1,
  logs: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  setLobbyInfo: (nickname, roomId, password, faction = 'A') => 
    set({ nickname, roomId, roomPassword: password, faction }),
    
  setPlayerNumber: (num) => set({ playerNumber: num }),
  setPhase: (phase) => set({ phase }),
  setMyPlanes: (planes) => set({ myPlanes: planes }),
  setGridSize: (size) => set({ gridSize: size }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  
  setTurn: (turn) => set({ turn }),
  
  receiveAttack: (x, y) => {
    const { myPlanes, myGridHits, addLog } = get();
    const key = `${x},${y}`;
    
    // If already hit, just return miss
    if (myGridHits[key]) return { hitType: 'miss' };

    let hitType: CellState = 'miss';
    let hitPlaneId: string | undefined;
    let isStealth = false;

    // Check hit plane
    const hitPlane = myPlanes.find(p => !p.isDestroyed && p.path[p.currentPathIndex].x === x && p.path[p.currentPathIndex].y === y);
    
    if (hitPlane) {
      hitType = 'hit_plane';
      hitPlaneId = hitPlane.id;
      
      // Destroy plane
      const updatedPlanes = myPlanes.map(p => p.id === hitPlane.id ? { ...p, isDestroyed: true } : p);
      set({ myPlanes: updatedPlanes, myGridHits: { ...myGridHits, [key]: 'hit_plane' } });
      
      return { hitType, planeId: hitPlane.id, isStealth: hitPlane.type === 'stealth' };
    }

    // Check hit path
    const pathHitPlane = myPlanes.find(p => !p.isDestroyed && p.path.some(coord => coord.x === x && coord.y === y));
    if (pathHitPlane) {
      if (pathHitPlane.type === 'stealth') {
        // Stealth plane path hit shows as miss
        hitType = 'miss';
        isStealth = true;
      } else {
        hitType = 'hit_path';
        hitPlaneId = pathHitPlane.id;
        // Stun plane
        const updatedPlanes = myPlanes.map(p => p.id === pathHitPlane.id ? { ...p, isStunned: true } : p);
        set({ myPlanes: updatedPlanes, myGridHits: { ...myGridHits, [key]: 'hit_path' } });
        return { hitType, planeId: pathHitPlane.id, isStealth: false };
      }
    }
    
    // Miss
    set({ myGridHits: { ...myGridHits, [key]: hitType } });
    return { hitType, isStealth };
  },

  recordOpponentHit: (x, y, state) => {
    const { opponentGridHits } = get();
    set({ opponentGridHits: { ...opponentGridHits, [`${x},${y}`]: state } });
  },

  movePlanes: () => {
    const { myPlanes } = get();
    const newPlanes = myPlanes.map(plane => {
      if (plane.isDestroyed) return plane;
      if (plane.isStunned) {
        return { ...plane, isStunned: false }; // remove stun but don't move
      }
      
      let steps = plane.type === 'speed' ? 2 : 1;
      let newIndex = (plane.currentPathIndex + steps) % plane.path.length;
      return { ...plane, currentPathIndex: newIndex };
    });
    set({ myPlanes: newPlanes });
  },
  
  setWinner: (winner) => set({ winner, phase: 'gameover' }),
  resetGame: () => set(initialState)
}));
