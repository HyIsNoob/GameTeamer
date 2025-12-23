/**
 * Standard Fisher-Yates shuffle algorithm.
 * Guarantees unbiased permutation.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Distributes players into teams based on max players per team.
 * 
 * Logic:
 * 1. Calculate minimum number of teams needed (Total / MaxSize).
 * 2. Distribute players round-robin into that many teams.
 * 
 * Example: 4 Players, Max 3.
 * Teams needed = ceil(4/3) = 2.
 * P1->T1, P2->T2, P3->T1, P4->T2.
 * Result: 2 teams of 2.
 */
export function distributeBalanced<T>(players: T[], maxPerTeam: number): T[][] {
  if (players.length === 0) return [];

  // Calculate N teams
  const numTeams = Math.ceil(players.length / maxPerTeam);
  
  // Create buckets
  const teams: T[][] = Array.from({ length: numTeams }, () => []);
  
  // Round-robin distribution
  players.forEach((player, index) => {
    teams[index % numTeams].push(player);
  });
  
  return teams;
}

/**
 * Distributes players into a fixed number of teams.
 * 
 * Logic:
 * Round-robin distribution into N buckets.
 */
export function distributeIntoCount<T>(players: T[], teamCount: number): T[][] {
  if (players.length === 0 || teamCount < 1) return [];

  const teams: T[][] = Array.from({ length: teamCount }, () => []);
  
  players.forEach((player, index) => {
    teams[index % teamCount].push(player);
  });

  return teams;
}