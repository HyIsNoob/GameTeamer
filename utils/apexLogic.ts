import { APEX_LEGENDS, APEX_WEAPONS, Legend, Weapon } from './apexData';

export interface Loadout {
  legend: Legend;
  primary: Weapon;
  secondary: Weapon;
}

export const getRandomLoadout = (excludedLegendIds: string[] = []): Loadout => {
  // Filter available legends
  const availableLegends = APEX_LEGENDS.filter(l => !excludedLegendIds.includes(l.id));
  
  // Fallback if all are excluded (shouldn't happen in normal logic, but safety first)
  // If fallback, at least respect the "Not Owned" isn't strictly possible if we want unique, 
  // but if collision forces it, we prioritize "Game works" over "Unique".
  // Ideally, if pool is empty, we must pick *something*. 
  let pool = availableLegends;
  if (pool.length === 0) {
      // Emergency Fallback: Pick any legend not in specific "Hard Bans" if we had that, 
      // but here we just reset to all because valid game state is better than crash.
      pool = APEX_LEGENDS;
  }

  // Pick Legend
  const legend = pool[Math.floor(Math.random() * pool.length)];

  // Pick Weapons
  // Logic: Pick Primary, then Pick Secondary distinct from Primary Type
  const primary = APEX_WEAPONS[Math.floor(Math.random() * APEX_WEAPONS.length)];
  
  // Filter weapons that have different TYPE from primary
  // Exception: If primary is unique type? No, usually plenty of types.
  // Requirement: "2 loại súng nên khác loại nhau" -> Type based differentness.
  const secondaryCandidates = APEX_WEAPONS.filter(w => w.type !== primary.type);
  
  const secondary = secondaryCandidates.length > 0
    ? secondaryCandidates[Math.floor(Math.random() * secondaryCandidates.length)]
    : APEX_WEAPONS.find(w => w.id !== primary.id) || primary; // Fallback

  return { legend, primary, secondary };
};
