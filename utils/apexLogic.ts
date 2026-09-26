import { APEX_LEGENDS, APEX_WEAPONS } from './apexData';
import { Legend, Weapon } from './catalogTypes';

export interface Loadout {
  legend?: Legend;
  primary?: Weapon;
  secondary?: Weapon;
  role?: string; // For 'ROLE' mode
}

export interface CatalogPool {
  apexLegends: Legend[];
  apexWeapons: Weapon[];
}

export function getRandomLoadout(
  catalogOrExcludes?: CatalogPool | string[],
  excludedLegendIdsOrWeapons?: string[],
  excludedWeaponIds: string[] = []
): Loadout {
  let catalog: CatalogPool;
  let excludedLegendIds: string[] = [];
  let excludedWeapons: string[] = excludedWeaponIds;

  if (Array.isArray(catalogOrExcludes)) {
    catalog = { apexLegends: APEX_LEGENDS, apexWeapons: APEX_WEAPONS };
    excludedLegendIds = catalogOrExcludes;
    excludedWeapons = excludedLegendIdsOrWeapons || [];
  } else if (catalogOrExcludes && typeof catalogOrExcludes === 'object' && 'apexLegends' in catalogOrExcludes) {
    catalog = catalogOrExcludes;
    excludedLegendIds = excludedLegendIdsOrWeapons || [];
    excludedWeapons = excludedWeaponIds || [];
  } else {
    catalog = { apexLegends: APEX_LEGENDS, apexWeapons: APEX_WEAPONS };
    excludedLegendIds = [];
    excludedWeapons = [];
  }

  // Active legends only
  const activeLegends = (catalog.apexLegends || APEX_LEGENDS).filter(l => l.isActive !== false);
  const availableLegends = activeLegends.filter(l => !excludedLegendIds.includes(l.id));

  // Fallback if all are excluded
  const legendPool = availableLegends.length > 0 ? availableLegends : activeLegends;
  const legend = legendPool.length > 0 ? legendPool[Math.floor(Math.random() * legendPool.length)] : undefined;

  // Active weapons, not Care Package, not excluded
  const activeWeapons = (catalog.apexWeapons || APEX_WEAPONS).filter(w => w.isActive !== false);
  const availableWeapons = activeWeapons.filter(w => 
    !excludedWeapons.includes(w.id) &&
    !w.isCarePackage
  );

  const weaponPool = availableWeapons.length > 0 
    ? availableWeapons 
    : activeWeapons.filter(w => !w.isCarePackage);

  if (weaponPool.length === 0) {
    return { legend };
  }

  // Pick Primary
  const primary = weaponPool[Math.floor(Math.random() * weaponPool.length)];

  // Pick Secondary distinct from Primary Type
  const secondaryCandidates = weaponPool.filter(w => w.type !== primary.type);

  const secondary = secondaryCandidates.length > 0
    ? secondaryCandidates[Math.floor(Math.random() * secondaryCandidates.length)]
    : weaponPool.find(w => w.id !== primary.id) || primary;

  return { legend, primary, secondary };
}
