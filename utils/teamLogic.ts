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
 * Distributes players into teams as evenly as possible.
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

  // If maxPerTeam is greater than total players, we just need 1 team
  // But if the user wants to split, we rely on the math.
  // Actually, usually if players < maxPerTeam, it's just 1 team.
  // But strictly following the "limit" logic:
  
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
