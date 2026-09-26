export type LegendClass = 'Assault' | 'Skirmisher' | 'Recon' | 'Support' | 'Controller';

export type WeaponType = 'Assault Rifle' | 'SMG' | 'LMG' | 'Marksman' | 'Sniper' | 'Shotgun' | 'Pistol';

export type AmmoType = 'Energy' | 'Heavy' | 'Light' | 'Sniper' | 'Shotgun' | 'Arrows' | 'Mythic';

export type ValorantRole = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';

export interface Legend {
  id: string;
  name: string;
  class: LegendClass;
  icon?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  ammo: AmmoType;
  image?: string;
  isCarePackage?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ValorantAgent {
  id: string;
  name: string;
  role: ValorantRole;
  image: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CatalogSnapshot {
  apexLegends: Legend[];
  apexWeapons: Weapon[];
  valorantAgents: ValorantAgent[];
}

export interface ApexLegendRow {
  id: string;
  name: string;
  legend_class: LegendClass;
  card_image_url: string;
  portrait_image_url: string;
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
}

export interface ApexWeaponRow {
  id: string;
  name: string;
  weapon_type: WeaponType;
  ammo_type: AmmoType;
  image_url: string;
  is_care_package: boolean;
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
}

export interface ValorantAgentRow {
  id: string;
  name: string;
  role: ValorantRole;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
}
