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
 * Assigns exactly 5 distinct active agents to 5 distinct players.
 * Throws an error if fewer than 5 players or fewer than 5 active agents are provided.
 */
export const assignAgents = (
  players: ValorantPlayer[],
  agents: ValorantAgent[],
  random: () => number = Math.random
): AgentAssignment[] => {
  // 1. Validate exactly 5 unique players
  const uniquePlayerIds = new Set(players.map((p) => p.id));
  if (players.length !== 5 || uniquePlayerIds.size !== 5) {
    throw new Error('A 5-player squad roulette requires exactly 5 distinct players.');
  }

  // 2. Validate at least 5 active agents
  const activeAgents = agents.filter((a) => a.isActive !== false);
  if (activeAgents.length < 5) {
    throw new Error(`Need at least 5 active VALORANT agents to assign (found ${activeAgents.length}).`);
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

  // 5. Pair first 5 shuffled agents with players
  return sortedPlayers.map((player, idx) => ({
    playerId: player.id,
    playerName: player.name,
    agent: shuffledAgents[idx]
  }));
};
