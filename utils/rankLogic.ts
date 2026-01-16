export const RANK_TIERS = ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Predator'];

export const ENTRY_COSTS: Record<string, number> = {
    'Rookie': 0,
    'Bronze': 10,
    'Silver': 20,
    'Gold': 40,
    'Platinum': 60,
    'Diamond': 80,
    'Master': 100,
    'Predator': 100
};

export const PLACEMENT_POINTS: Record<number, number> = {
    1: 125, 2: 95, 3: 70, 4: 55, 5: 45,
    6: 30, 7: 20, 8: 10, 9: 10, 10: 10,
    11: 5, 12: 5, 13: 5, 14: 0, 15: 0,
    16: 0, 17: 0, 18: 0, 19: 0, 20: 0
};

// Approximate KP Value based on recent seasons (Season 20+)
// KP value scales with placement.
export const KP_VALUE_BY_PLACEMENT: Record<number, number> = {
    1: 26, 2: 24, 3: 22, 4: 20, 5: 18,
    6: 16, 7: 15, 8: 14, 9: 13, 10: 12,
    11: 10, 12: 9, 13: 8, 14: 5, 15: 4, 
    16: 2, 17: 1, 18: 1, 19: 1, 20: 1
};

export interface MatchResult {
    id: string;
    placement: number;
    kills: number;
    assists: number;
    participation: number; // usually worth 50% of KP
    tier: string;
    totalRP: number;
    delta: number;
    timestamp: number;
    map?: string;
}

export interface MatchResultv2 {
    id: string;
    teamPlacement: number;
    details: {
        [playerId: string]: {
            kills: number;
            assists: number;
            damage: number;
            participation: number;
            tier: string;
            rp: number;
        }
    };
    totalSquadRP: number;
    timestamp: number;
}

export const calculateRP = (tier: string, placement: number, kills: number, assists: number, participation: number): { total: number, breakdown: any } => {
    const entry = ENTRY_COSTS[tier] || 0;
    const placePts = PLACEMENT_POINTS[placement] || 0;
    
    // Cap KP per match is usually soft-capped or scaled, but in S20 it's mostly about value scaling.
    // Total KP (Kills + Assists) count fully. Participation counts partial.
    // We will simplify: (K + A) * Value + (P * Value * 0.5)
    
    const kpVal = KP_VALUE_BY_PLACEMENT[placement] || 10;
    
    const kpPoints = (kills + assists) * kpVal;
    const partPoints = participation * (kpVal * 0.5);
    
    const total = (placePts + kpPoints + partPoints) - entry;
    
    return {
        total: Math.floor(total),
        breakdown: {
            entry: -entry,
            placement: placePts,
            kp: Math.floor(kpPoints + partPoints)
        }
    };
};