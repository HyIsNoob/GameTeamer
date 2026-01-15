import { APEX_LEGENDS, APEX_WEAPONS, Legend, Weapon } from './apexData';

export interface Loadout {
  legend?: Legend;
  primary?: Weapon;
  secondary?: Weapon;
  role?: string; // For 'ROLE' mode
}

export const getRandomLoadout = (excludedLegendIds: string[] = [], excludedWeaponIds: string[] = []): Loadout => {
  // Filter available legends
  const availableLegends = APEX_LEGENDS.filter(l => !excludedLegendIds.includes(l.id));
  
  // Fallback if all are excluded
  let pool = availableLegends;
  if (pool.length === 0) {
      pool = APEX_LEGENDS;
  }

  // Pick Legend
  const legend = pool[Math.floor(Math.random() * pool.length)];

  // Pick Weapons
  // 1. Filter out excluded weapons AND Care Package weapons (Global)
  const availableWeapons = APEX_WEAPONS.filter(w => 
    !excludedWeaponIds.includes(w.id) &&
    !w.isCarePackage
  );
  
  const weaponPool = availableWeapons.length > 0 ? availableWeapons : APEX_WEAPONS;

  // Logic: Pick Primary, then Pick Secondary distinct from Primary Type
  const primary = weaponPool[Math.floor(Math.random() * weaponPool.length)];
  
  // Filter weapons that have different TYPE from primary
  const secondaryCandidates = weaponPool.filter(w => w.type !== primary.type);
  
  const secondary = secondaryCandidates.length > 0
    ? secondaryCandidates[Math.floor(Math.random() * secondaryCandidates.length)]
    : weaponPool.find(w => w.id !== primary.id) || primary;

  return { legend, primary, secondary };
};
