export interface Legend {
  id: string;
  name: string;
  class: 'Assault' | 'Skirmisher' | 'Recon' | 'Support' | 'Controller';
  icon?: string;
  image?: string;
}

export interface Weapon {
  id: string;
  name: string;
  type: 'Assault Rifle' | 'SMG' | 'LMG' | 'Marksman' | 'Sniper' | 'Shotgun' | 'Pistol';
  ammo: 'Energy' | 'Heavy' | 'Light' | 'Sniper' | 'Shotgun';
  image?: string;
}

export const APEX_LEGENDS: Legend[] = [
  { id: "bangalore", name: "Bangalore", class: "Assault", image: "Bangalore_Legend_Card.png", icon: "Portrait_Bangalore_square.png" },
  { id: "fuse", name: "Fuse", class: "Assault", image: "Fuse_Legend_Card.png", icon: "Portrait_Fuse_square.png" },
  { id: "ash", name: "Ash", class: "Assault", image: "Ash_Legend_Card.png", icon: "Portrait_Ash_square.png" },
  { id: "mad_maggie", name: "Mad Maggie", class: "Assault", image: "Mad_Maggie_Legend_Card.png", icon: "Portrait_Mad_Maggie_square.png" },
  { id: "ballistic", name: "Ballistic", class: "Assault", image: "Ballistic_Legend_Card.png", icon: "Portrait_Ballistic_square.png" },
  { id: "wraith", name: "Wraith", class: "Skirmisher", image: "Wraith_Legend_Card.png", icon: "Portrait_Wraith_square.png" },
  { id: "octane", name: "Octane", class: "Skirmisher", image: "Octane_Legend_Card.png", icon: "Portrait_Octane_square.png" },
  { id: "horizon", name: "Horizon", class: "Skirmisher", image: "Horizon_Legend_Card.png", icon: "Portrait_Horizon_square.png" },
  { id: "valkyrie", name: "Valkyrie", class: "Skirmisher", image: "Valkyrie_Legend_Card.png", icon: "Portrait_Valkyrie_square.png" },
  { id: "pathfinder", name: "Pathfinder", class: "Skirmisher", image: "Pathfinder_Legend_Card.png", icon: "Portrait_Pathfinder_square.png" },
  { id: "revenant", name: "Revenant", class: "Skirmisher", image: "Revenant_Reborn_Legend_Card.png", icon: "Portrait_Revenant_square.png" },
  { id: "alter", name: "Alter", class: "Skirmisher", image: "Alter_Legend_Card.png", icon: "Portrait_Alter_square.png" },
  { id: "bloodhound", name: "Bloodhound", class: "Recon", image: "Bloodhound_Legend_Card.png", icon: "Portrait_Bloodhound_square.png" },
  { id: "crypto", name: "Crypto", class: "Recon", image: "Crypto_Legend_Card.png", icon: "Portrait_Crypto_square.png" },
  { id: "seer", name: "Seer", class: "Recon", image: "Seer_Legend_Card.png", icon: "Portrait_Seer_square.png" },
  { id: "vantage", name: "Vantage", class: "Recon", image: "Vantage_Legend_Card.png", icon: "Portrait_Vantage_square.png" },
  { id: "gibraltar", name: "Gibraltar", class: "Support", image: "Gibraltar_Legend_Card.png", icon: "Portrait_Gibraltar_square.png" },
  { id: "lifeline", name: "Lifeline", class: "Support", image: "Lifeline_Legend_Card.png", icon: "Portrait_Lifeline_square.png" },
  { id: "mirage", name: "Mirage", class: "Support", image: "Mirage_Legend_Card.png", icon: "Portrait_Mirage_square.png" },
  { id: "loba", name: "Loba", class: "Support", image: "Loba_Legend_Card.png", icon: "Portrait_Loba_square.png" },
  { id: "newcastle", name: "Newcastle", class: "Support", image: "Newcastle_Legend_Card.png", icon: "Portrait_Newcastle_square.png" },
  { id: "conduit", name: "Conduit", class: "Support", image: "Conduit_Legend_Card.png", icon: "Portrait_Conduit_square.png" },
  { id: "caustic", name: "Caustic", class: "Controller", image: "Caustic_Legend_Card.png", icon: "Portrait_Caustic_square.png" },
  { id: "wattson", name: "Wattson", class: "Controller", image: "Wattson_Legend_Card.png", icon: "Portrait_Wattson_square.png" },
  { id: "rampart", name: "Rampart", class: "Controller", image: "Rampart_Legend_Card.png", icon: "Portrait_Rampart_square.png" },
  { id: "catalyst", name: "Catalyst", class: "Controller", image: "Catalyst_Legend_Card.png", icon: "Portrait_Catalyst_square.png" }
];

export const APEX_WEAPONS: Weapon[] = [
  { id: "havoc", name: "Havoc Rifle", type: "Assault Rifle", ammo: "Energy", image: "HAVOC_Rifle.png" },
  { id: "flatline", name: "VK-47 Flatline", type: "Assault Rifle", ammo: "Heavy", image: "VK-47_Flatline.png" },
  { id: "hemlok", name: "Hemlok Burst AR", type: "Assault Rifle", ammo: "Heavy", image: "Hemlok_Burst_AR.png" },
  { id: "r301", name: "R-301 Carbine", type: "Assault Rifle", ammo: "Light", image: "R-301_Carbine.png" },
  { id: "nemesis", name: "Nemesis Burst AR", type: "Assault Rifle", ammo: "Energy", image: "Nemesis_Burst_AR.png" },
  { id: "alternator", name: "Alternator SMG", type: "SMG", ammo: "Light", image: "Alternator_SMG.png" },
  { id: "prowler", name: "Prowler Burst PDW", type: "SMG", ammo: "Heavy", image: "Prowler_Burst_PDW.png" },
  { id: "r99", name: "R-99 SMG", type: "SMG", ammo: "Light", image: "R-99_SMG.png" },
  { id: "volt", name: "Volt SMG", type: "SMG", ammo: "Energy", image: "Volt_SMG.png" },
  { id: "car", name: "C.A.R. SMG", type: "SMG", ammo: "Heavy", image: "C.A.R._SMG.png" },
  { id: "devotion", name: "Devotion LMG", type: "LMG", ammo: "Energy", image: "Devotion_LMG.png" },
  { id: "lstar", name: "L-STAR EMG", type: "LMG", ammo: "Energy", image: "L-STAR_EMG.png" },
  { id: "spitfire", name: "M600 Spitfire", type: "LMG", ammo: "Light", image: "M600_Spitfire.png" },
  { id: "rampage", name: "Rampage LMG", type: "LMG", ammo: "Heavy", image: "Rampage_LMG.png" },
  { id: "g7_scout", name: "G7 Scout", type: "Marksman", ammo: "Light", image: "G7_Scout.png" },
  { id: "triple_take", name: "Triple Take", type: "Marksman", ammo: "Energy", image: "Triple_Take.png" },
  { id: "3030", name: "30-30 Repeater", type: "Marksman", ammo: "Heavy", image: "30-30_Repeater.png" },
  { id: "bocek", name: "Bocek Compound Bow", type: "Marksman", ammo: "Sniper", image: "Bocek_Compound_Bow.png" },
  { id: "charge_rifle", name: "Charge Rifle", type: "Sniper", ammo: "Sniper", image: "Charge_Rifle.png" },
  { id: "longbow", name: "Longbow DMR", type: "Sniper", ammo: "Sniper", image: "Longbow_DMR.png" },
  { id: "sentinel", name: "Sentinel", type: "Sniper", ammo: "Sniper", image: "Sentinel.png" },
  { id: "eva8", name: "EVA-8 Auto", type: "Shotgun", ammo: "Shotgun", image: "EVA-8_Auto.png" },
  { id: "mastiff", name: "Mastiff Shotgun", type: "Shotgun", ammo: "Shotgun", image: "Mastiff_Shotgun.png" },
  { id: "mozambique", name: "Mozambique", type: "Shotgun", ammo: "Shotgun", image: "Mozambique_Shotgun.png" },
  { id: "peacekeeper", "name": "Peacekeeper", type: "Shotgun", ammo: "Shotgun", image: "Peacekeeper.png" },
  { id: "p2020", name: "P2020", type: "Pistol", ammo: "Light", image: "P2020.png" },
  { id: "re45", name: "RE-45 Auto", type: "Pistol", ammo: "Light", image: "RE-45_Auto.png" },
  { id: "wingman", name: "Wingman", type: "Pistol", ammo: "Sniper", image: "Wingman.png" }
];
