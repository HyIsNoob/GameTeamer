export const RANK_TIERS = ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Predator'];

export const ENTRY_COSTS: Record<string, number> = {
    'Rookie': 0,
    'Bronze': 10,
    'Silver': 20,
    'Gold': 38,
    'Platinum': 48,
    'Diamond': 65,
    'Master': 90,
    'Predator': 90
};

export const PLACEMENT_POINTS: Record<number, number> = {
    1: 125, 2: 100, 3: 75, 4: 55, 5: 45,
    6: 40, 7: 30, 8: 30, 9: 20, 10: 20,
    11: 10, 12: 10, 13: 10, 14: 10, 15: 10,
    16: 0, 17: 0, 18: 0, 19: 0, 20: 0
};

// KP Value per K/A/P based on Placement (Season 26)
export const KP_VALUE_BY_PLACEMENT: Record<number, number> = {
    1: 20, 2: 18, 3: 16, 4: 14, 5: 12,
    6: 10, 7: 10, 8: 10, 9: 8, 10: 8,
    11: 6, 12: 6, 13: 6, 14: 6, 15: 6,
    16: 4, 17: 4, 18: 4, 19: 4, 20: 4
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
            skillBonus: number; // Added for manual bonus (Skill/Top Streak/Challenger)
            tier: string;
            rp: number;
        }
    };
    totalSquadRP: number;
    timestamp: number;
}

export const calculateRP = (tier: string, placement: number, kills: number, assists: number, participation: number, skillBonus: number = 0): { total: number, breakdown: any } => {
    const entry = ENTRY_COSTS[tier] || 0;
    const placePts = PLACEMENT_POINTS[placement] || 0;
    
    // Season 26 Logic:
    // KP = Kills + Assists + (Participation * 0.5)
    // Cap at 8 KP for full value. Excess KP is worth 50%.
    
    const kpVal = KP_VALUE_BY_PLACEMENT[placement] || 10;
    
    const rawKP = kills + assists + (participation * 0.5);
    const fullKP = Math.min(rawKP, 8);
    const overflowKP = Math.max(0, rawKP - 8);
    
    const kpPoints = (fullKP * kpVal) + (overflowKP * (kpVal * 0.5));
    
    const total = (placePts + kpPoints + skillBonus) - entry;
    
    return {
        total: Math.floor(total),
        breakdown: {
            entry: -entry,
            placement: placePts,
            kp: Math.floor(kpPoints),
            skill: skillBonus
        }
    };
};