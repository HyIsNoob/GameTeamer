import assert from 'assert';
import {
  generateVetoSteps,
  executeVetoAction,
  executeAgentBan,
  randomizeTournamentMaps,
  formatMatchSummaryDiscord
} from '../utils/tournamentLogic.ts';
import { createInitialTournamentState, VALORANT_MAP_POOL } from '../utils/tournamentTypes.ts';

console.log('Testing Tournament Logic...');

// Test 1: generateVetoSteps for BO1
{
  const state = createInitialTournamentState('ROOM1', 'HOST1');
  const steps = generateVetoSteps(state.settings, ['ascent', 'bind', 'haven', 'split', 'icebox', 'breeze', 'lotus']);
  // 7 maps: 6 bans + 1 side = 7 steps
  assert.strictEqual(steps.length, 7, 'BO1 with 7 maps should generate 7 steps (6 bans + 1 side)');
  assert.strictEqual(steps[0].type, 'BAN');
  assert.strictEqual(steps[0].team, 'ALPHA');
  assert.strictEqual(steps[1].team, 'OMEGA');
  assert.strictEqual(steps[6].type, 'SIDE');
  assert.strictEqual(steps[6].team, 'OMEGA');
  console.log('✔ Test 1: BO1 Veto steps generation passed');
}

// Test 2: generateVetoSteps for BO3
{
  const state = createInitialTournamentState('ROOM1', 'HOST1');
  state.settings.format = 'BO3';
  const steps = generateVetoSteps(state.settings, ['ascent', 'bind', 'haven', 'split', 'icebox', 'breeze', 'lotus']);
  // 7 maps: Alpha Ban, Omega Ban, Alpha Pick, Omega Side, Omega Pick, Alpha Side, Alpha Ban, Omega Ban, Alpha Side Decider = 9 steps
  assert.strictEqual(steps.length, 9, 'BO3 with 7 maps should generate 9 steps');
  console.log('✔ Test 2: BO3 Veto steps generation passed');
}

// Test 3: executeVetoAction through a BO1 sequence
{
  let state = createInitialTournamentState('ROOM1', 'HOST1');
  state.settings.format = 'BO1';
  state.settings.bansPerTeam = 1; // 1 ban per team in agent phase
  state.settings.enabledMapIds = ['ascent', 'bind', 'haven'];
  state.phase = 'MAP_VETO';

  // Step 0: Alpha ban ascent
  state = executeVetoAction(state, { team: 'ALPHA', type: 'BAN', targetMapId: 'ascent' });
  assert.strictEqual(state.bannedMapIds.length, 1);
  assert.strictEqual(state.currentVetoStepIndex, 1);

  // Step 1: Omega ban bind
  state = executeVetoAction(state, { team: 'OMEGA', type: 'BAN', targetMapId: 'bind' });
  assert.strictEqual(state.bannedMapIds.length, 2);
  assert.strictEqual(state.decidedMaps.length, 1);
  assert.strictEqual(state.decidedMaps[0].mapId, 'haven');

  // Step 2: Omega pick side for decider map (haven)
  state = executeVetoAction(state, { team: 'OMEGA', type: 'SIDE', side: 'ATTACK' });
  assert.strictEqual(state.decidedMaps[0].startingSides?.omega, 'ATTACK');
  assert.strictEqual(state.decidedMaps[0].startingSides?.alpha, 'DEFENSE');

  // Should automatically transition to AGENT_BAN because bansPerTeam = 1
  assert.strictEqual(state.phase, 'AGENT_BAN');
  assert.strictEqual(state.currentAgentBanTeam, 'ALPHA');
  console.log('✔ Test 3: executeVetoAction BO1 full run passed');

  // Test 4: executeAgentBan
  state = executeAgentBan(state, 'jett', 'Jett', 'ALPHA');
  assert.strictEqual(state.agentBans.length, 1);
  assert.strictEqual(state.currentAgentBanTeam, 'OMEGA');

  state = executeAgentBan(state, 'reyna', 'Reyna', 'OMEGA');
  assert.strictEqual(state.agentBans.length, 2);
  assert.strictEqual(state.phase, 'MATCH_READY', 'All agent bans done, phase must be MATCH_READY');
  assert.strictEqual(state.currentAgentBanTeam, null);
  console.log('✔ Test 4: executeAgentBan full run passed');
}

// Test 5: randomizeTournamentMaps
{
  const randomMaps = randomizeTournamentMaps('BO3', ['ascent', 'bind', 'haven', 'split', 'icebox']);
  assert.strictEqual(randomMaps.length, 3);
  assert.ok(randomMaps[0].startingSides);
  console.log('✔ Test 5: randomizeTournamentMaps passed');
}

console.log('All tournament logic unit tests passed successfully! 🎉');
