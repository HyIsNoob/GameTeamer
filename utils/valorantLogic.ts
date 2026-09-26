import { ValorantAgent } from './catalogTypes';

export interface ValorantPlayer {
  id: string;
  name: string;
  onlineAt?: string;
  slotIndex?: number;
}

export interface AgentAssignment {
  playerId: string;
  playerName: string;
  agent: ValorantAgent;
}

export const generateValorantRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Assigns distinct active agents to between 1 and 5 distinct players.
 * Throws an error if fewer than 1 player or fewer active agents than players are provided.
 */
export const assignAgents = (
  players: ValorantPlayer[],
  agents: ValorantAgent[],
  random: () => number = Math.random
): AgentAssignment[] => {
  // 1. Validate between 1 and 5 unique players
  if (players.length < 1 || players.length > 5) {
    throw new Error('Valorant roulette requires between 1 and 5 players in the lobby.');
  }

  const uniquePlayerIds = new Set(players.map((p) => p.id));
  if (uniquePlayerIds.size !== players.length) {
    throw new Error('Each player in the lobby must have a unique identifier.');
  }

  // 2. Validate at least as many active agents as players
  const activeAgents = agents.filter((a) => a.isActive !== false);
  if (activeAgents.length < players.length) {
    throw new Error(`Need at least ${players.length} active VALORANT agents to assign (found ${activeAgents.length}).`);
  }

  // 3. Stable sort players by slotIndex or onlineAt
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.slotIndex !== undefined && b.slotIndex !== undefined) {
      return a.slotIndex - b.slotIndex;
    }
    return (a.onlineAt || '').localeCompare(b.onlineAt || '');
  });

  // 4. In-place Fisher-Yates shuffle on copied agents
  const shuffledAgents = [...activeAgents];
  for (let i = shuffledAgents.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffledAgents[i];
    shuffledAgents[i] = shuffledAgents[j];
    shuffledAgents[j] = temp;
  }

  // 5. Pair first N shuffled agents with players
  return sortedPlayers.map((player, idx) => ({
    playerId: player.id,
    playerName: player.name,
    agent: shuffledAgents[idx]
  }));
};
