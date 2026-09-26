export interface ValorantMap {
  id: string;
  name: string;
  splash: string;
  siteCount: number;
  description: string;
}

export const VALORANT_MAP_POOL: ValorantMap[] = [
  { id: 'ascent', name: 'Ascent', splash: '/valorant/maps/ascent.png', siteCount: 2, description: 'Open courtyard with closable security doors.' },
  { id: 'bind', name: 'Bind', splash: '/valorant/maps/bind.png', siteCount: 2, description: 'No middle area with one-way teleporters.' },
  { id: 'haven', name: 'Haven', splash: '/valorant/maps/haven.png', siteCount: 3, description: 'Three bomb sites requiring fast rotations.' },
  { id: 'split', name: 'Split', splash: '/valorant/maps/split.png', siteCount: 2, description: 'Verticality and ascenders dominated mid.' },
  { id: 'icebox', name: 'Icebox', splash: '/valorant/maps/icebox.png', siteCount: 2, description: 'Complex vertical shipping container yard.' },
  { id: 'breeze', name: 'Breeze', splash: '/valorant/maps/breeze.png', siteCount: 2, description: 'Expansive long-range island fortress.' },
  { id: 'fracture', name: 'Fracture', splash: '/valorant/maps/fracture.png', siteCount: 2, description: 'H-shaped split facility with dual spawn sides.' },
  { id: 'pearl', name: 'Pearl', splash: '/valorant/maps/pearl.png', siteCount: 2, description: 'Underwater city with traditional three-lane layout.' },
  { id: 'lotus', name: 'Lotus', splash: '/valorant/maps/lotus.png', siteCount: 3, description: 'Ancient ruins featuring three sites and rotating doors.' },
  { id: 'sunset', name: 'Sunset', splash: '/valorant/maps/sunset.png', siteCount: 2, description: 'Los Angeles urban battleground with central food court.' },
  { id: 'abyss', name: 'Abyss', splash: '/valorant/maps/abyss.png', siteCount: 2, description: 'No-boundary subterranean cavern with lethal drops.' }
];

export type TournamentFormat = 'BO1' | 'BO3' | 'BO5';
export type MapSelectionMode = 'VETO' | 'RANDOM';
export type TournamentTeam = 'ALPHA' | 'OMEGA';
export type VetoActionType = 'BAN' | 'PICK' | 'SIDE';
export type VetoSide = 'ATTACK' | 'DEFENSE';

export interface TournamentPlayer {
  id: string;
  name: string;
  team: TournamentTeam;
  slotIndex: number; // 0 to 4 within team
  isCaptain: boolean;
  onlineAt?: string;
}

export interface VetoStep {
  stepIndex: number;
  team: TournamentTeam;
  type: VetoActionType;
  description: string;
  relatedMapId?: string; // If picking side for a chosen map
}

export interface DecidedMap {
  mapId: string;
  mapName: string;
  orderIndex: number; // 1, 2, 3...
  pickedBy: TournamentTeam | 'DECIDER' | 'RANDOM';
  startingSides?: {
    alpha: VetoSide;
    omega: VetoSide;
    chosenBy?: TournamentTeam;
  };
}

export interface AgentBan {
  agentId: string;
  agentName: string;
  bannedBy: TournamentTeam;
  orderIndex: number;
}

export interface TournamentSettings {
  format: TournamentFormat;
  mode: MapSelectionMode;
  bansPerTeam: number; // 0, 1, 2, 3
  enabledMapIds: string[];
}

export type TournamentPhase = 'LOBBY' | 'MAP_VETO' | 'AGENT_BAN' | 'MATCH_READY';

export interface TournamentState {
  roomId: string;
  hostId: string;
  settings: TournamentSettings;
  phase: TournamentPhase;
  bannedMapIds: string[];
  bannedMapHistory: Array<{ mapId: string; team: TournamentTeam; stepIndex: number }>;
  decidedMaps: DecidedMap[];
  currentVetoStepIndex: number;
  agentBans: AgentBan[];
  currentAgentBanTeam: TournamentTeam | null;
  timestamp: number;
}

export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  format: 'BO1',
  mode: 'VETO',
  bansPerTeam: 2,
  enabledMapIds: VALORANT_MAP_POOL.map((m) => m.id)
};

export const createInitialTournamentState = (roomId: string, hostId: string): TournamentState => ({
  roomId,
  hostId,
  settings: { ...DEFAULT_TOURNAMENT_SETTINGS },
  phase: 'LOBBY',
  bannedMapIds: [],
  bannedMapHistory: [],
  decidedMaps: [],
  currentVetoStepIndex: 0,
  agentBans: [],
  currentAgentBanTeam: null,
  timestamp: Date.now()
});
