import type {
  AgentBan,
  DecidedMap,
  TournamentPlayer,
  TournamentSettings,
  TournamentState,
  TournamentTeam,
  VetoActionType,
  VetoSide,
  VetoStep
} from './tournamentTypes.ts';
import { VALORANT_MAP_POOL } from './tournamentTypes.ts';

/**
 * Generates the sequence of veto steps based on match format (BO1, BO3, BO5)
 * and available maps count.
 */
export const generateVetoSteps = (
  settings: TournamentSettings,
  enabledMapIds: string[] = settings.enabledMapIds,
  firstTeam: TournamentTeam = 'ALPHA'
): VetoStep[] => {
  const steps: VetoStep[] = [];
  const mapCount = enabledMapIds.length;
  let stepIndex = 0;
  const secondTeam: TournamentTeam = firstTeam === 'ALPHA' ? 'OMEGA' : 'ALPHA';

  if (settings.format === 'BO1') {
    // Alternate bans until 1 map remains, then secondTeam picks starting side
    let currentTeam: TournamentTeam = firstTeam;
    const totalBansNeeded = Math.max(0, mapCount - 1);

    for (let i = 0; i < totalBansNeeded; i++) {
      steps.push({
        stepIndex: stepIndex++,
        team: currentTeam,
        type: 'BAN',
        description: `Team ${currentTeam} bans a map`
      });
      currentTeam = currentTeam === 'ALPHA' ? 'OMEGA' : 'ALPHA';
    }

    // Side selection for the remaining decider map by the second team
    steps.push({
      stepIndex: stepIndex++,
      team: secondTeam,
      type: 'SIDE',
      description: `Team ${secondTeam} selects starting side for Decider Map`
    });
  } else if (settings.format === 'BO3') {
    // Standard esports BO3 veto with firstTeam advantage
    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'BAN', description: `Team ${firstTeam} bans a map` });
    steps.push({ stepIndex: stepIndex++, team: secondTeam, type: 'BAN', description: `Team ${secondTeam} bans a map` });

    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'PICK', description: `Team ${firstTeam} picks Map 1` });
    steps.push({ stepIndex: stepIndex++, team: secondTeam, type: 'SIDE', description: `Team ${secondTeam} selects starting side for Map 1` });

    steps.push({ stepIndex: stepIndex++, team: secondTeam, type: 'PICK', description: `Team ${secondTeam} picks Map 2` });
    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'SIDE', description: `Team ${firstTeam} selects starting side for Map 2` });

    // Remaining maps banned until 1 decider remains
    let remainingToDecide = mapCount - 4; // 2 banned + 2 picked
    let banTeam: TournamentTeam = firstTeam;
    while (remainingToDecide > 1) {
      steps.push({
        stepIndex: stepIndex++,
        team: banTeam,
        type: 'BAN',
        description: `Team ${banTeam} bans a map`
      });
      banTeam = banTeam === 'ALPHA' ? 'OMEGA' : 'ALPHA';
      remainingToDecide--;
    }

    // Side selection for decider
    steps.push({
      stepIndex: stepIndex++,
      team: firstTeam,
      type: 'SIDE',
      description: `Team ${firstTeam} selects starting side for Decider Map 3`
    });
  } else {
    // BO5
    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'BAN', description: `Team ${firstTeam} bans a map` });
    steps.push({ stepIndex: stepIndex++, team: secondTeam, type: 'BAN', description: `Team ${secondTeam} bans a map` });

    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'PICK', description: `Team ${firstTeam} picks Map 1` });
    steps.push({ stepIndex: stepIndex++, team: secondTeam, type: 'SIDE', description: `Team ${secondTeam} selects side for Map 1` });

    steps.push({ stepIndex: stepIndex++, team: secondTeam, type: 'PICK', description: `Team ${secondTeam} picks Map 2` });
    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'SIDE', description: `Team ${firstTeam} selects side for Map 2` });

    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'PICK', description: `Team ${firstTeam} picks Map 3` });
    steps.push({ stepIndex: stepIndex++, team: secondTeam, type: 'SIDE', description: `Team ${secondTeam} selects side for Map 3` });

    steps.push({ stepIndex: stepIndex++, team: secondTeam, type: 'PICK', description: `Team ${secondTeam} picks Map 4` });
    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'SIDE', description: `Team ${firstTeam} selects side for Map 4` });

    steps.push({ stepIndex: stepIndex++, team: firstTeam, type: 'SIDE', description: `Team ${firstTeam} selects side for Decider Map 5` });
  }

  return steps;
};

/**
 * Randomly picks N maps from enabled map pool with randomized starting sides.
 */
export const randomizeTournamentMaps = (
  format: 'BO1' | 'BO3' | 'BO5',
  enabledMapIds: string[]
): DecidedMap[] => {
  const needed = format === 'BO1' ? 1 : format === 'BO3' ? 3 : 5;
  const pool = [...enabledMapIds];
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selectedIds = pool.slice(0, needed);
  return selectedIds.map((id, index) => {
    const mapObj = VALORANT_MAP_POOL.find((m) => m.id === id);
    const alphaStartsAttack = Math.random() > 0.5;
    return {
      mapId: id,
      mapName: mapObj?.name || id.toUpperCase(),
      orderIndex: index + 1,
      pickedBy: 'RANDOM',
      startingSides: {
        alpha: alphaStartsAttack ? 'ATTACK' : 'DEFENSE',
        omega: alphaStartsAttack ? 'DEFENSE' : 'ATTACK',
        chosenBy: 'ALPHA'
      }
    };
  });
};

/**
 * Pure state reducer executing a Veto Action (Map Ban, Map Pick, or Side Pick).
 */
export const executeVetoAction = (
  state: TournamentState,
  action: {
    team: TournamentTeam;
    type: VetoActionType;
    targetMapId?: string;
    side?: VetoSide;
  }
): TournamentState => {
  const steps = generateVetoSteps(state.settings, state.settings.enabledMapIds, state.firstPickTeam || 'ALPHA');
  const currentStep = steps[state.currentVetoStepIndex];

  if (!currentStep) {
    throw new Error('Veto phase is already complete.');
  }

  if (currentStep.team !== action.team) {
    throw new Error(`It is Team ${currentStep.team}'s turn, not Team ${action.team}.`);
  }

  if (currentStep.type !== action.type) {
    throw new Error(`Expected action ${currentStep.type}, received ${action.type}.`);
  }

  const newState: TournamentState = {
    ...state,
    timestamp: Date.now()
  };

  if (action.type === 'BAN') {
    if (!action.targetMapId) throw new Error('Missing target map for ban.');
    if (newState.bannedMapIds.includes(action.targetMapId)) throw new Error('Map is already banned.');
    if (newState.decidedMaps.some((m) => m.mapId === action.targetMapId)) throw new Error('Map is already picked.');

    newState.bannedMapIds = [...newState.bannedMapIds, action.targetMapId];
    newState.bannedMapHistory = [
      ...newState.bannedMapHistory,
      { mapId: action.targetMapId, team: action.team, stepIndex: state.currentVetoStepIndex }
    ];
    newState.currentVetoStepIndex += 1;

    // Check if only 1 map remains and next step is a SIDE step for the decider
    const remainingMaps = state.settings.enabledMapIds.filter(
      (id) => !newState.bannedMapIds.includes(id) && !newState.decidedMaps.some((d) => d.mapId === id)
    );

    if (remainingMaps.length === 1 && !newState.decidedMaps.some((d) => d.pickedBy === 'DECIDER')) {
      const deciderId = remainingMaps[0];
      const deciderMapObj = VALORANT_MAP_POOL.find((m) => m.id === deciderId);
      newState.decidedMaps = [
        ...newState.decidedMaps,
        {
          mapId: deciderId,
          mapName: deciderMapObj?.name || deciderId.toUpperCase(),
          orderIndex: newState.decidedMaps.length + 1,
          pickedBy: 'DECIDER'
        }
      ];
    }
  } else if (action.type === 'PICK') {
    if (!action.targetMapId) throw new Error('Missing target map for pick.');
    if (newState.bannedMapIds.includes(action.targetMapId)) throw new Error('Map is banned.');
    if (newState.decidedMaps.some((m) => m.mapId === action.targetMapId)) throw new Error('Map is already picked.');

    const mapObj = VALORANT_MAP_POOL.find((m) => m.id === action.targetMapId);
    newState.decidedMaps = [
      ...newState.decidedMaps,
      {
        mapId: action.targetMapId,
        mapName: mapObj?.name || action.targetMapId.toUpperCase(),
        orderIndex: newState.decidedMaps.length + 1,
        pickedBy: action.team
      }
    ];
    newState.currentVetoStepIndex += 1;
  } else if (action.type === 'SIDE') {
    if (!action.side) throw new Error('Missing side choice.');

    // Assign side to the current active map
    const targetMapIndex = newState.decidedMaps.length - 1;
    if (targetMapIndex >= 0) {
      const map = { ...newState.decidedMaps[targetMapIndex] };
      const teamIsAlpha = action.team === 'ALPHA';
      const chosenSide = action.side;
      const otherSide: VetoSide = chosenSide === 'ATTACK' ? 'DEFENSE' : 'ATTACK';

      map.startingSides = {
        alpha: teamIsAlpha ? chosenSide : otherSide,
        omega: teamIsAlpha ? otherSide : chosenSide,
        chosenBy: action.team
      };

      const updatedDecided = [...newState.decidedMaps];
      updatedDecided[targetMapIndex] = map;
      newState.decidedMaps = updatedDecided;
    }
    newState.currentVetoStepIndex += 1;
  }

  // Check if map veto is finished
  if (newState.currentVetoStepIndex >= steps.length) {
    if (newState.settings.bansPerTeam > 0) {
      newState.phase = 'AGENT_BAN';
      // Fair rule: Team who banned map first gets agent banned by opponent first!
      newState.currentAgentBanTeam = newState.firstPickTeam === 'ALPHA' ? 'OMEGA' : 'ALPHA';
    } else {
      newState.phase = 'MATCH_READY';
      newState.currentAgentBanTeam = null;
    }
  }

  return newState;
};

/**
 * Records a game score for a decided map and checks for series victory.
 */
export const recordMapScore = (
  state: TournamentState,
  mapId: string,
  alphaScore: number,
  omegaScore: number
): TournamentState => {
  const mapIndex = state.decidedMaps.findIndex((m) => m.mapId === mapId);
  if (mapIndex === -1) throw new Error('Map not found in decided maps.');

  const winner: TournamentTeam = alphaScore > omegaScore ? 'ALPHA' : 'OMEGA';
  const existingScoreIndex = state.mapScores.findIndex((s) => s.mapId === mapId);

  const updatedScores = [...state.mapScores];
  const newScore = {
    mapId,
    orderIndex: mapIndex + 1,
    alphaScore,
    omegaScore,
    winner
  };

  if (existingScoreIndex >= 0) {
    updatedScores[existingScoreIndex] = newScore;
  } else {
    updatedScores.push(newScore);
  }

  // Count wins
  const alphaWins = updatedScores.filter((s) => s.winner === 'ALPHA').length;
  const omegaWins = updatedScores.filter((s) => s.winner === 'OMEGA').length;

  const winsNeeded = state.settings.format === 'BO1' ? 1 : state.settings.format === 'BO3' ? 2 : 3;

  let matchWinner: TournamentTeam | null = null;
  let phase = state.phase;

  if (alphaWins >= winsNeeded) {
    matchWinner = 'ALPHA';
    phase = 'VICTORY';
  } else if (omegaWins >= winsNeeded) {
    matchWinner = 'OMEGA';
    phase = 'VICTORY';
  }

  return {
    ...state,
    mapScores: updatedScores,
    matchWinner,
    phase,
    timestamp: Date.now()
  };
};

/**
 * Pure state reducer executing an Agent Ban by a Captain.
 */
export const executeAgentBan = (
  state: TournamentState,
  agentId: string,
  agentName: string,
  team: TournamentTeam
): TournamentState => {
  if (state.phase !== 'AGENT_BAN') {
    throw new Error('Not currently in the Agent Ban phase.');
  }

  if (state.currentAgentBanTeam !== team) {
    throw new Error(`It is Team ${state.currentAgentBanTeam}'s turn to ban an agent.`);
  }

  if (state.agentBans.some((b) => b.agentId === agentId)) {
    throw new Error(`Agent ${agentName} has already been banned.`);
  }

  const totalBansTarget = state.settings.bansPerTeam * 2;
  const newBans: AgentBan[] = [
    ...state.agentBans,
    {
      agentId,
      agentName,
      bannedBy: team,
      orderIndex: state.agentBans.length + 1
    }
  ];

  const newState: TournamentState = {
    ...state,
    agentBans: newBans,
    timestamp: Date.now()
  };

  if (newBans.length >= totalBansTarget) {
    newState.phase = 'MATCH_READY';
    newState.currentAgentBanTeam = null;
  } else {
    // Alternate teams
    newState.currentAgentBanTeam = team === 'ALPHA' ? 'OMEGA' : 'ALPHA';
  }

  return newState;
};

/**
 * Generates an esports-ready Discord/Chat match summary.
 */
export const formatMatchSummaryDiscord = (
  state: TournamentState,
  players: TournamentPlayer[]
): string => {
  const alphaPlayers = players.filter((p) => p.team === 'ALPHA').map((p) => (p.isCaptain ? `⭐ **${p.name}** (C)` : p.name));
  const omegaPlayers = players.filter((p) => p.team === 'OMEGA').map((p) => (p.isCaptain ? `⭐ **${p.name}** (C)` : p.name));

  const mapsText = state.decidedMaps
    .map((m) => {
      const sides = m.startingSides
        ? ` (Alpha: ${m.startingSides.alpha === 'ATTACK' ? '⚔️ Atk' : '🛡️ Def'} | Omega: ${m.startingSides.omega === 'ATTACK' ? '⚔️ Atk' : '🛡️ Def'})`
        : '';
      return `  • Map ${m.orderIndex}: **${m.mapName}**${sides}`;
    })
    .join('\n');

  const bannedMapsText =
    state.bannedMapHistory.length > 0
      ? state.bannedMapHistory.map((b) => `~${b.mapId.toUpperCase()}~ (${b.team})`).join(', ')
      : 'None';

  const bannedAgentsText =
    state.agentBans.length > 0
      ? state.agentBans.map((b) => `🚫 **${b.agentName}** (${b.bannedBy})`).join('  |  ')
      : 'No agent bans';

  return `
🏆 **VALORANT 5v5 SCRIM / TOURNAMENT BRIEFING**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 **Format:** ${state.settings.format} (${state.settings.mode === 'VETO' ? 'Map Veto' : 'Random Maps'})
🗺️ **Map(s) to Play:**
${mapsText || '  • (Pending)'}

🚫 **Banned Maps:** ${bannedMapsText}
❌ **Banned Agents:** ${bannedAgentsText}

🔵 **Team Alpha (Blue):**
${alphaPlayers.length > 0 ? alphaPlayers.join(', ') : '(Empty)'}

🔴 **Team Omega (Red):**
${omegaPlayers.length > 0 ? omegaPlayers.join(', ') : '(Empty)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GL & HF! Generated by GameTeamer.
`.trim();
};
