-- 202609260001_catalog_admin.sql
-- Migration: Protected game catalog, admin allowlist, RLS policies, and realtime publication

-- 1. Create Catalog Tables
create table if not exists public.apex_legends (
  id text primary key,
  name text not null,
  legend_class text not null check (legend_class in ('Assault', 'Skirmisher', 'Recon', 'Support', 'Controller')),
  card_image_url text not null,
  portrait_image_url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.apex_weapons (
  id text primary key,
  name text not null,
  weapon_type text not null check (weapon_type in ('Assault Rifle', 'SMG', 'LMG', 'Marksman', 'Sniper', 'Shotgun', 'Pistol')),
  ammo_type text not null check (ammo_type in ('Energy', 'Heavy', 'Light', 'Sniper', 'Shotgun', 'Arrows', 'Mythic')),
  image_url text not null,
  is_care_package boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.valorant_agents (
  id text primary key,
  name text not null,
  role text not null check (role in ('Duelist', 'Initiator', 'Controller', 'Sentinel')),
  image_url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 2. Create Private Admin Allowlist and Admin Check Function
create table if not exists public.game_admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.game_admin_allowlist enable row level security;
-- No client policies on game_admin_allowlist: only direct SQL Editor or service role can access

create or replace function public.is_game_teamer_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.game_admin_allowlist
    where lower(email) = lower((select auth.jwt() ->> 'email'))
  );
$$;

grant execute on function public.is_game_teamer_admin() to anon, authenticated;

-- 3. Row Level Security for Catalogs
alter table public.apex_legends enable row level security;
alter table public.apex_weapons enable row level security;
alter table public.valorant_agents enable row level security;

-- apex_legends policies
drop policy if exists "Public read active apex_legends or admin read all" on public.apex_legends;
create policy "Public read active apex_legends or admin read all"
  on public.apex_legends for select
  to anon, authenticated
  using (is_active = true or public.is_game_teamer_admin() = true);

drop policy if exists "Admin insert apex_legends" on public.apex_legends;
create policy "Admin insert apex_legends"
  on public.apex_legends for insert
  to authenticated
  with check (public.is_game_teamer_admin() = true);

drop policy if exists "Admin update apex_legends" on public.apex_legends;
create policy "Admin update apex_legends"
  on public.apex_legends for update
  to authenticated
  using (public.is_game_teamer_admin() = true)
  with check (public.is_game_teamer_admin() = true);

drop policy if exists "Admin delete apex_legends" on public.apex_legends;
create policy "Admin delete apex_legends"
  on public.apex_legends for delete
  to authenticated
  using (public.is_game_teamer_admin() = true);

-- apex_weapons policies
drop policy if exists "Public read active apex_weapons or admin read all" on public.apex_weapons;
create policy "Public read active apex_weapons or admin read all"
  on public.apex_weapons for select
  to anon, authenticated
  using (is_active = true or public.is_game_teamer_admin() = true);

drop policy if exists "Admin insert apex_weapons" on public.apex_weapons;
create policy "Admin insert apex_weapons"
  on public.apex_weapons for insert
  to authenticated
  with check (public.is_game_teamer_admin() = true);

drop policy if exists "Admin update apex_weapons" on public.apex_weapons;
create policy "Admin update apex_weapons"
  on public.apex_weapons for update
  to authenticated
  using (public.is_game_teamer_admin() = true)
  with check (public.is_game_teamer_admin() = true);

drop policy if exists "Admin delete apex_weapons" on public.apex_weapons;
create policy "Admin delete apex_weapons"
  on public.apex_weapons for delete
  to authenticated
  using (public.is_game_teamer_admin() = true);

-- valorant_agents policies
drop policy if exists "Public read active valorant_agents or admin read all" on public.valorant_agents;
create policy "Public read active valorant_agents or admin read all"
  on public.valorant_agents for select
  to anon, authenticated
  using (is_active = true or public.is_game_teamer_admin() = true);

drop policy if exists "Admin insert valorant_agents" on public.valorant_agents;
create policy "Admin insert valorant_agents"
  on public.valorant_agents for insert
  to authenticated
  with check (public.is_game_teamer_admin() = true);

drop policy if exists "Admin update valorant_agents" on public.valorant_agents;
create policy "Admin update valorant_agents"
  on public.valorant_agents for update
  to authenticated
  using (public.is_game_teamer_admin() = true)
  with check (public.is_game_teamer_admin() = true);

drop policy if exists "Admin delete valorant_agents" on public.valorant_agents;
create policy "Admin delete valorant_agents"
  on public.valorant_agents for delete
  to authenticated
  using (public.is_game_teamer_admin() = true);

-- 4. Storage Bucket Setup
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gameteamer-assets',
  'gameteamer-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

drop policy if exists "Public read gameteamer-assets" on storage.objects;
create policy "Public read gameteamer-assets"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'gameteamer-assets');

drop policy if exists "Admin insert gameteamer-assets" on storage.objects;
create policy "Admin insert gameteamer-assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gameteamer-assets' and public.is_game_teamer_admin() = true);

drop policy if exists "Admin update gameteamer-assets" on storage.objects;
create policy "Admin update gameteamer-assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gameteamer-assets' and public.is_game_teamer_admin() = true)
  with check (bucket_id = 'gameteamer-assets' and public.is_game_teamer_admin() = true);

drop policy if exists "Admin delete gameteamer-assets" on storage.objects;
create policy "Admin delete gameteamer-assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gameteamer-assets' and public.is_game_teamer_admin() = true);

-- 5. Seed Initial Catalog Data

-- Seed Apex Legends
insert into public.apex_legends (id, name, legend_class, card_image_url, portrait_image_url, is_active, sort_order)
values
  ('bangalore', 'Bangalore', 'Assault', 'bangalore.jpg', 'Portrait_Bangalore_square.png', true, 1),
  ('fuse', 'Fuse', 'Assault', 'fuse.jpg', 'Portrait_Fuse_square.png', true, 2),
  ('mad_maggie', 'Mad Maggie', 'Assault', 'mad_maggie.jpg', 'Portrait_Mad_Maggie_square.png', true, 3),
  ('ballistic', 'Ballistic', 'Assault', 'ballistic.jpg', 'Portrait_Ballistic_square.png', true, 4),
  ('revenant', 'Revenant', 'Assault', 'revenant.jpg', 'Portrait_Revenant_square.png', true, 5),
  ('ash', 'Ash', 'Skirmisher', 'ash.jpg', 'Portrait_Ash_square.png', true, 6),
  ('wraith', 'Wraith', 'Skirmisher', 'wraith.jpg', 'Portrait_Wraith_square.png', true, 7),
  ('octane', 'Octane', 'Skirmisher', 'octane.jpg', 'Portrait_Octane_square.png', true, 8),
  ('horizon', 'Horizon', 'Skirmisher', 'horizon.jpg', 'Portrait_Horizon_square.png', true, 9),
  ('pathfinder', 'Pathfinder', 'Skirmisher', 'pathfinder.jpg', 'Portrait_Pathfinder_square.png', true, 10),
  ('alter', 'Alter', 'Skirmisher', 'alter.jpg', 'Portrait_Alter_square.png', true, 11),
  ('valkyrie', 'Valkyrie', 'Recon', 'valkyrie.jpg', 'Portrait_Valkyrie_square.png', true, 12),
  ('bloodhound', 'Bloodhound', 'Recon', 'bloodhound.jpg', 'Portrait_Bloodhound_square.png', true, 13),
  ('crypto', 'Crypto', 'Recon', 'crypto.jpg', 'Portrait_Crypto_square.png', true, 14),
  ('seer', 'Seer', 'Recon', 'seer.jpg', 'Portrait_Seer_square.png', true, 15),
  ('vantage', 'Vantage', 'Recon', 'vantage.jpg', 'Portrait_Vantage_square.png', true, 16),
  ('sparrow', 'Sparrow', 'Recon', 'sparrow.jpg', 'Portrait_Sparrow_square.png', true, 17),
  ('gibraltar', 'Gibraltar', 'Support', 'gibraltar.jpg', 'Portrait_Gibraltar_square.png', true, 18),
  ('lifeline', 'Lifeline', 'Support', 'lifeline.jpg', 'Portrait_Lifeline_square.png', true, 19),
  ('mirage', 'Mirage', 'Support', 'mirage.jpg', 'Portrait_Mirage_square.png', true, 20),
  ('loba', 'Loba', 'Support', 'loba.jpg', 'Portrait_Loba_square.png', true, 21),
  ('newcastle', 'Newcastle', 'Support', 'newcastle.jpg', 'Portrait_Newcastle_square.png', true, 22),
  ('conduit', 'Conduit', 'Support', 'conduit.jpg', 'Portrait_Conduit_square.png', true, 23),
  ('caustic', 'Caustic', 'Controller', 'caustic.jpg', 'Portrait_Caustic_square.png', true, 24),
  ('wattson', 'Wattson', 'Controller', 'wattson.jpg', 'Portrait_Wattson_square.png', true, 25),
  ('rampart', 'Rampart', 'Controller', 'rampart.jpg', 'Portrait_Rampart_square.png', true, 26),
  ('catalyst', 'Catalyst', 'Controller', 'catalyst.jpg', 'Portrait_Catalyst_square.png', true, 27)
on conflict (id) do update set
  name = excluded.name,
  legend_class = excluded.legend_class,
  card_image_url = excluded.card_image_url,
  portrait_image_url = excluded.portrait_image_url,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

-- Seed Apex Weapons
insert into public.apex_weapons (id, name, weapon_type, ammo_type, image_url, is_care_package, is_active, sort_order)
values
  ('havoc', 'Havoc Rifle', 'Assault Rifle', 'Energy', 'HAVOC_Rifle.png', false, true, 1),
  ('flatline', 'VK-47 Flatline', 'Assault Rifle', 'Heavy', 'VK-47_Flatline.png', false, true, 2),
  ('hemlok', 'Hemlok Burst AR', 'Assault Rifle', 'Heavy', 'Hemlok_Burst_AR.png', false, true, 3),
  ('r301', 'R-301 Carbine', 'Assault Rifle', 'Light', 'R-301_Carbine.png', false, true, 4),
  ('nemesis', 'Nemesis Burst AR', 'Assault Rifle', 'Energy', 'Nemesis_Burst_AR.png', false, true, 5),
  ('alternator', 'Alternator SMG', 'SMG', 'Light', 'Alternator_SMG.png', false, true, 6),
  ('prowler', 'Prowler Burst PDW', 'SMG', 'Heavy', 'Prowler_Burst_PDW.png', false, true, 7),
  ('r99', 'R-99 SMG', 'SMG', 'Light', 'R-99_SMG.png', false, true, 8),
  ('volt', 'Volt SMG', 'SMG', 'Energy', 'Volt_SMG.png', false, true, 9),
  ('car', 'C.A.R. SMG', 'SMG', 'Heavy', 'C.A.R._SMG.png', true, true, 10),
  ('devotion', 'Devotion LMG', 'LMG', 'Energy', 'Devotion_LMG.png', false, true, 11),
  ('lstar', 'L-STAR EMG', 'LMG', 'Energy', 'L-STAR_EMG.png', false, true, 12),
  ('spitfire', 'M600 Spitfire', 'LMG', 'Light', 'M600_Spitfire.png', false, true, 13),
  ('rampage', 'Rampage LMG', 'LMG', 'Heavy', 'Rampage_LMG.png', false, true, 14),
  ('g7_scout', 'G7 Scout', 'Marksman', 'Light', 'G7_Scout.png', false, true, 15),
  ('triple_take', 'Triple Take', 'Marksman', 'Energy', 'Triple_Take.png', false, true, 16),
  ('3030', '30-30 Repeater', 'Marksman', 'Heavy', '30-30_Repeater.png', false, true, 17),
  ('bocek', 'Bocek Compound Bow', 'Marksman', 'Sniper', 'Bocek_Compound_Bow.png', false, true, 18),
  ('charge_rifle', 'Charge Rifle', 'Sniper', 'Sniper', 'Charge_Rifle.png', false, true, 19),
  ('longbow', 'Longbow DMR', 'Sniper', 'Sniper', 'Longbow_DMR.png', false, true, 20),
  ('sentinel', 'Sentinel', 'Sniper', 'Sniper', 'Sentinel.png', false, true, 21),
  ('kraber', 'Kraber .50-Cal Sniper', 'Sniper', 'Sniper', 'Kraber_.50-Cal_Sniper.png', true, true, 22),
  ('eva8', 'EVA-8 Auto', 'Shotgun', 'Shotgun', 'EVA-8_Auto.png', false, true, 23),
  ('mastiff', 'Mastiff Shotgun', 'Shotgun', 'Shotgun', 'Mastiff_Shotgun.png', false, true, 24),
  ('mozambique', 'Mozambique', 'Shotgun', 'Shotgun', 'Mozambique_Shotgun.png', false, true, 25),
  ('peacekeeper', 'Peacekeeper', 'Shotgun', 'Shotgun', 'Peacekeeper.png', false, true, 26),
  ('p2020', 'P2020', 'Pistol', 'Light', 'P2020.png', true, true, 27),
  ('re45', 'RE-45 Auto', 'Pistol', 'Energy', 'RE-45_Auto.png', false, true, 28),
  ('wingman', 'Wingman', 'Pistol', 'Sniper', 'Wingman.png', false, true, 29)
on conflict (id) do update set
  name = excluded.name,
  weapon_type = excluded.weapon_type,
  ammo_type = excluded.ammo_type,
  image_url = excluded.image_url,
  is_care_package = excluded.is_care_package,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

-- Seed VALORANT Agents (Roster)
insert into public.valorant_agents (id, name, role, image_url, is_active, sort_order)
values
  ('astra', 'Astra', 'Controller', '/valorant/agents/astra.png', true, 1),
  ('breach', 'Breach', 'Initiator', '/valorant/agents/breach.png', true, 2),
  ('brimstone', 'Brimstone', 'Controller', '/valorant/agents/brimstone.png', true, 3),
  ('chamber', 'Chamber', 'Sentinel', '/valorant/agents/chamber.png', true, 4),
  ('clove', 'Clove', 'Controller', '/valorant/agents/clove.png', true, 5),
  ('cypher', 'Cypher', 'Sentinel', '/valorant/agents/cypher.png', true, 6),
  ('deadlock', 'Deadlock', 'Sentinel', '/valorant/agents/deadlock.png', true, 7),
  ('fade', 'Fade', 'Initiator', '/valorant/agents/fade.png', true, 8),
  ('gekko', 'Gekko', 'Initiator', '/valorant/agents/gekko.png', true, 9),
  ('harbor', 'Harbor', 'Controller', '/valorant/agents/harbor.png', true, 10),
  ('iso', 'Iso', 'Duelist', '/valorant/agents/iso.png', true, 11),
  ('jett', 'Jett', 'Duelist', '/valorant/agents/jett.png', true, 12),
  ('kayo', 'KAY/O', 'Initiator', '/valorant/agents/kayo.png', true, 13),
  ('killjoy', 'Killjoy', 'Sentinel', '/valorant/agents/killjoy.png', true, 14),
  ('neon', 'Neon', 'Duelist', '/valorant/agents/neon.png', true, 15),
  ('omen', 'Omen', 'Controller', '/valorant/agents/omen.png', true, 16),
  ('phoenix', 'Phoenix', 'Duelist', '/valorant/agents/phoenix.png', true, 17),
  ('raze', 'Raze', 'Duelist', '/valorant/agents/raze.png', true, 18),
  ('reyna', 'Reyna', 'Duelist', '/valorant/agents/reyna.png', true, 19),
  ('sage', 'Sage', 'Sentinel', '/valorant/agents/sage.png', true, 20),
  ('skye', 'Skye', 'Initiator', '/valorant/agents/skye.png', true, 21),
  ('sova', 'Sova', 'Initiator', '/valorant/agents/sova.png', true, 22),
  ('tejo', 'Tejo', 'Initiator', '/valorant/agents/tejo.png', true, 23),
  ('viper', 'Viper', 'Controller', '/valorant/agents/viper.png', true, 24),
  ('vyse', 'Vyse', 'Sentinel', '/valorant/agents/vyse.png', true, 25),
  ('yoru', 'Yoru', 'Duelist', '/valorant/agents/yoru.png', true, 26)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  image_url = excluded.image_url,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

-- 6. Add Tables to Supabase Realtime Publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'apex_legends') then
    alter publication supabase_realtime add table public.apex_legends;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'apex_weapons') then
    alter publication supabase_realtime add table public.apex_weapons;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'valorant_agents') then
    alter publication supabase_realtime add table public.valorant_agents;
  end if;
end $$;
