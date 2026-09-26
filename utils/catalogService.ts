import { isSupabaseConfigured, supabase } from './supabase';
import {
  ApexLegendRow,
  ApexWeaponRow,
  CatalogSnapshot,
  Legend,
  ValorantAgent,
  ValorantAgentRow,
  Weapon
} from './catalogTypes';

export const mapLegendRow = (row: ApexLegendRow): Legend => ({
  id: row.id,
  name: row.name,
  class: row.legend_class,
  image: row.card_image_url,
  icon: row.portrait_image_url,
  isActive: row.is_active,
  sortOrder: row.sort_order
});

export const mapWeaponRow = (row: ApexWeaponRow): Weapon => ({
  id: row.id,
  name: row.name,
  type: row.weapon_type,
  ammo: row.ammo_type,
  image: row.image_url,
  isCarePackage: row.is_care_package,
  isActive: row.is_active,
  sortOrder: row.sort_order
});

export const mapAgentRow = (row: ValorantAgentRow): ValorantAgent => ({
  id: row.id,
  name: row.name,
  role: row.role,
  image: row.image_url,
  isActive: row.is_active,
  sortOrder: row.sort_order
});

export const loadPublicCatalog = async (): Promise<CatalogSnapshot> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const [legendsRes, weaponsRes, agentsRes] = await Promise.all([
    supabase
      .from('apex_legends')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('apex_weapons')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('valorant_agents')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
  ]);

  if (legendsRes.error) throw legendsRes.error;
  if (weaponsRes.error) throw weaponsRes.error;
  if (agentsRes.error) throw agentsRes.error;

  return {
    apexLegends: (legendsRes.data as ApexLegendRow[]).map(mapLegendRow),
    apexWeapons: (weaponsRes.data as ApexWeaponRow[]).map(mapWeaponRow),
    valorantAgents: (agentsRes.data as ValorantAgentRow[]).map(mapAgentRow)
  };
};

export const subscribeToCatalogChanges = (onChange: () => void): (() => void) => {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('catalog-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'apex_legends' },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'apex_weapons' },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'valorant_agents' },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const isAdminUser = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return false;

    const { data, error } = await supabase.rpc('is_game_teamer_admin');
    if (error) {
      console.warn('Admin check error:', error.message);
      return false;
    }
    return Boolean(data);
  } catch (err) {
    console.error('Failed to verify admin status:', err);
    return false;
  }
};

export const loadAdminCatalog = async (): Promise<CatalogSnapshot> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const [legendsRes, weaponsRes, agentsRes] = await Promise.all([
    supabase
      .from('apex_legends')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('apex_weapons')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('valorant_agents')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
  ]);

  if (legendsRes.error) throw legendsRes.error;
  if (weaponsRes.error) throw weaponsRes.error;
  if (agentsRes.error) throw agentsRes.error;

  return {
    apexLegends: (legendsRes.data as ApexLegendRow[]).map(mapLegendRow),
    apexWeapons: (weaponsRes.data as ApexWeaponRow[]).map(mapWeaponRow),
    valorantAgents: (agentsRes.data as ValorantAgentRow[]).map(mapAgentRow)
  };
};

export const saveLegend = async (legend: Legend): Promise<void> => {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const payload: Partial<ApexLegendRow> = {
    id: legend.id,
    name: legend.name,
    legend_class: legend.class,
    card_image_url: legend.image || '',
    portrait_image_url: legend.icon || '',
    is_active: legend.isActive ?? true,
    sort_order: legend.sortOrder ?? 0,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('apex_legends').upsert(payload);
  if (error) throw error;
};

export const saveWeapon = async (weapon: Weapon): Promise<void> => {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const payload: Partial<ApexWeaponRow> = {
    id: weapon.id,
    name: weapon.name,
    weapon_type: weapon.type,
    ammo_type: weapon.ammo,
    image_url: weapon.image || '',
    is_care_package: weapon.isCarePackage ?? false,
    is_active: weapon.isActive ?? true,
    sort_order: weapon.sortOrder ?? 0,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('apex_weapons').upsert(payload);
  if (error) throw error;
};

export const saveAgent = async (agent: ValorantAgent): Promise<void> => {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const payload: Partial<ValorantAgentRow> = {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    image_url: agent.image || '',
    is_active: agent.isActive ?? true,
    sort_order: agent.sortOrder ?? 0,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('valorant_agents').upsert(payload);
  if (error) throw error;
};

export const uploadCatalogImage = async (
  file: File,
  folder: 'apex_legends' | 'apex_weapons' | 'valorant_agents',
  recordId: string
): Promise<string> => {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only PNG, JPEG, and WebP images are allowed.');
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Image size must not exceed 5 MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const cleanRecordId = recordId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const filePath = `${folder}/${cleanRecordId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('gameteamer-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('gameteamer-assets').getPublicUrl(filePath);
  return data.publicUrl;
};
