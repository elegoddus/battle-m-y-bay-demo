export type Faction = 'A' | 'J' | 'R' | 'V' | 'F';

export type PlaneType = 'main' | 'speed' | 'stealth' | 'recon';

export interface Coordinate {
  x: number;
  y: number;
}

export interface Plane {
  id: string; // e.g. 'p1', 'p2'
  type: PlaneType;
  path: Coordinate[];
  currentPathIndex: number; // Index in path array where plane currently is
  isDestroyed: boolean;
  isStunned: boolean;
  hasUsedBombard: boolean; // only for 'main'
}

export type CellState = 'empty' | 'miss' | 'hit_path' | 'hit_plane';

export interface GameState {
  myPlanes: Plane[];
  myGridHits: { [key: string]: CellState }; // track what opponent hit on my grid (key: "x,y")
  opponentGridHits: { [key: string]: CellState }; // track what I hit on opponent grid
  
  gridSize: number;
  phase: 'lobby' | 'setup' | 'playing' | 'gameover';
  turn: number; // 1 or 2
  winner: number | null; // 1 or 2
  
  // Lobby info
  nickname: string;
  faction: Faction;
  roomId: string;
  playerNumber: 1 | 2;
  roomPassword?: string;
  
  // Chat / Logs
  logs: string[];
}
