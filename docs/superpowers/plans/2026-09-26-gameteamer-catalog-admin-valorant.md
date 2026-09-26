# GameTeamer Catalog, Admin, and VALORANT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task with review checkpoints. Do not delegate without the user's explicit request.

**Goal:** Move Apex pools into a protected, season-editable Supabase catalog, add an online room activity dashboard, and ship a synchronized five-player VALORANT Agent roulette.

**Architecture:** Supabase Postgres and Storage hold editable public catalogs, with Auth plus a private email allowlist and RLS protecting writes. A shared Realtime Presence directory reports anonymous active room sessions; the Valorant room uses its own Presence and Broadcast channel. React Context provides active catalog data to the Apex and Valorant pages while preserving bundled Apex data as a fallback.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Supabase JS v2 (Auth, Postgres, Storage, Realtime), Node.js built-in `fetch` for official VALORANT Agent image downloads.

**Spec:** `docs/superpowers/specs/2026-09-26-seasonal-catalog-and-valorant-rooms-design.md`

## Global Constraints

- Do not expose a Supabase service-role key in browser code or Vite environment variables.
- Keep the owner email out of tracked files; seed the private allowlist through the Supabase SQL Editor.
- Public clients can read active catalog records. Only the allowlisted admin can read inactive records or mutate catalog and Storage data.
- Keep existing public Apex asset paths working; new uploads store public Storage URLs.
- Keep inactive rows instead of deleting catalog records. A Care Package weapon is never selected.
- A valid Apex pool has at least one active Legend and two weapon types outside Care Packages. A valid Valorant pool has at least five active Agents.
- The VALORANT lobby supports at most five participants and assigns five distinct active Agents only when all five player slots are occupied.
- Room activity must not publish player names or joinable room codes, and it is ephemeral with no historical analytics.
- New uploads are PNG, JPEG, or WebP and no larger than 5 MB.
- No Supabase database migration is currently tracked; document manual application through the Supabase SQL Editor.

---

### Task 1: Supabase catalog schema and access policies

**Files:**
- Create: `supabase/migrations/202609260001_catalog_admin.sql`
- The migration will define `public.apex_legends`, `public.apex_weapons`, `public.valorant_agents`, and `public.game_admin_allowlist`.

**Interfaces:**
- Produces tables with stable text IDs and snake-case database columns:
  - `apex_legends(id, name, legend_class, card_image_url, portrait_image_url, is_active, sort_order, updated_at)`
  - `apex_weapons(id, name, weapon_type, ammo_type, image_url, is_care_package, is_active, sort_order, updated_at)`
  - `valorant_agents(id, name, role, image_url, is_active, sort_order, updated_at)`
- Produces `public.is_game_teamer_admin()`, a stable security-definer function that checks the verified Supabase Auth email against `game_admin_allowlist`.
- Produces public-read/admin-write RLS policies, admin-only Storage mutation policies, and Realtime publication entries for all three catalog tables.

- [ ] **Step 1: Create the three catalog tables and constraints**

  Use text IDs, non-empty names, non-negative sort order, active flags defaulting to true, and `updated_at` defaulting to `now()`. Constrain Apex classes, weapon types, ammo types, and VALORANT roles to the values already used by the app or the game's Agent roles. Keep `is_care_package` independent from `is_active`.

- [ ] **Step 2: Add the private allowlist and admin check function**

  Enable RLS on `game_admin_allowlist` and add no client read or write policies. Implement the function with a locked search path and case-insensitive comparison against the JWT email:

  ```sql
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
  ```

  Grant `EXECUTE` to `anon` and `authenticated`; the function returns false for anonymous requests and does not reveal the allowlist. Do not insert the owner's email in this migration.

- [ ] **Step 3: Add catalog and Storage RLS policies**

  Give `anon` and `authenticated` users read access only to active catalog rows; give an allowlisted user read access to inactive rows and insert/update access to all catalog rows. Create public-read bucket `gameteamer-assets` with a 5 MB limit and allowed MIME types `image/png`, `image/jpeg`, and `image/webp`. Permit insert, update, and delete in that bucket only when `is_game_teamer_admin()` returns true.

- [ ] **Step 4: Seed the catalog tables**

  Copy every current Legend and weapon from `utils/apexData.ts`, preserving IDs, names, types, ammo, classes, image paths, and the existing Care Package flags. Seed the official Agent roster available on [VALORANT's Agent directory](https://playvalorant.com/en-us/agents/) at implementation time: Astra, Breach, Brimstone, Chamber, Clove, Cypher, Deadlock, Fade, Gekko, Harbor, Iso, Jett, KAY/O, Killjoy, Miks, Neon, Omen, Phoenix, Raze, Reyna, Sage, Skye, Sova, Tejo, Veto, Viper, Vyse, Waylay, and Yoru. Copy each Agent role from its official profile page. Store local image paths under `/valorant/agents/` so these records work without a runtime dependency on Riot's site.

- [ ] **Step 5: Publish catalog changes to Supabase Realtime**

  Add each catalog table to `supabase_realtime` only if it is not already published. Keep the migration safe to apply once without duplicate publication errors.

- [ ] **Step 6: Commit the schema foundation**

  ```powershell
  git add supabase/migrations/202609260001_catalog_admin.sql
  git commit -m "feat: add protected game catalog schema"
  ```

---

### Task 2: Shared catalog service and React provider

**Files:**
- Create: `utils/catalogTypes.ts`
- Create: `utils/catalogService.ts`
- Create: `contexts/CatalogContext.tsx`
- Create: `utils/assetUrl.ts`
- Modify: `App.tsx`

**Interfaces:**
- `CatalogSnapshot` contains `apexLegends: Legend[]`, `apexWeapons: Weapon[]`, and `valorantAgents: ValorantAgent[]`.
- `CatalogContextValue` contains the snapshot, `loading`, `error`, and `refresh(): Promise<void>`.
- `loadPublicCatalog(): Promise<CatalogSnapshot>` reads active rows and maps snake-case database fields into the current camel-case domain types; it rejects when Supabase is unavailable or a read fails.
- `subscribeToCatalogChanges(onChange: () => void): RealtimeChannel` watches all three catalog tables and calls `onChange` to trigger a reload.
- `resolveAssetUrl(value: string | undefined, legacyFolder?: string): string` preserves absolute URLs and resolves old bundled filenames.

- [ ] **Step 1: Define catalog domain types**

  Keep the existing Apex `Legend` and `Weapon` properties accepted by `Loadout`. Add `ValorantAgent` with `id`, `name`, `role`, `image`, and `isActive`; do not reuse Apex types for Valorant.

- [ ] **Step 2: Implement database row mappers and public reads**

  In `catalogService.ts`, map `legend_class` to `Legend.class`, `card_image_url` to `Legend.image`, and `portrait_image_url` to `Legend.icon`. Map weapon and Agent fields similarly. Let the service reject on read failure; in `CatalogProvider`, catch the failure, expose it through `error`, and use the bundled Apex arrays plus an empty Valorant list as fallback data.

- [ ] **Step 3: Implement catalog change subscription**

  Subscribe to Postgres changes on `apex_legends`, `apex_weapons`, and `valorant_agents`. On any event, call `loadPublicCatalog`; return a cleanup function through the returned `RealtimeChannel` so provider unmount removes the channel.

- [ ] **Step 4: Add the provider**

  Load the catalog on mount, subscribe to changes, and expose `refresh`. Mount `CatalogProvider` inside the Router in `App.tsx` so public and admin pages share one catalog state.

- [ ] **Step 5: Add asset URL resolution**

  Resolve `https://...` and `http://...` values unchanged. Keep absolute local paths unchanged. For a legacy filename, prepend `/legends/`, `/icons/`, or `/weapons/` according to the caller. Use `/` when a local path is missing its leading slash.

- [ ] **Step 6: Commit the shared catalog layer**

  ```powershell
  git add utils/catalogTypes.ts utils/catalogService.ts contexts/CatalogContext.tsx utils/assetUrl.ts App.tsx
  git commit -m "feat: add shared Supabase game catalog"
  ```

---

### Task 3: Connect the Apex randomizer to the live catalog

**Files:**
- Modify: `utils/apexData.ts`
- Modify: `utils/apexLogic.ts`
- Modify: `pages/ApexLegends.tsx`
- Modify: `components/apex/LegendCard.tsx`
- Use: `contexts/CatalogContext.tsx` and `utils/assetUrl.ts`

**Interfaces:**
- Change the selection API to `getRandomLoadout(catalog: Pick<CatalogSnapshot, 'apexLegends' | 'apexWeapons'>, excludedLegendIds?: string[], excludedWeaponIds?: string[]): Loadout`.
- Inactive entries are absent from public catalog snapshots; the selector also excludes every `isCarePackage` weapon.

- [ ] **Step 1: Keep bundled arrays as typed fallbacks**

  Update `apexData.ts` exports to match the domain types and retain every current row. Add `isActive: true` to fallback items and keep the current Care Package flags.

- [ ] **Step 2: Make selection accept the current catalog**

  Update `getRandomLoadout` to use its catalog parameter, apply the user's existing Legend exclusions, ignore Care Package weapons, and choose distinct weapon types when possible. If the eligible weapon pool is invalid, return a result with no weapons instead of selecting a Care Package item.

- [ ] **Step 3: Replace page-level constants with provider data**

  In `ApexLegends.tsx`, use `useCatalog()` for random loadouts, available-count labels, Legend filters, and the pool settings modal. Use the provider's `refresh` and error state for connection feedback.

- [ ] **Step 4: Resolve uploaded and legacy images**

  In the Legend picker and `LegendCard`, render `Legend.icon`, `Legend.image`, and `Weapon.image` through `resolveAssetUrl`. Preserve the existing text placeholder when a Legend image cannot load.

- [ ] **Step 5: Commit Apex catalog integration**

  ```powershell
  git add utils/apexData.ts utils/apexLogic.ts pages/ApexLegends.tsx components/apex/LegendCard.tsx
  git commit -m "feat: use live catalog in Apex roulette"
  ```

---

### Task 4: Admin authentication, catalog editor, and image uploads

**Files:**
- Create: `pages/Admin.tsx`
- Create: `components/admin/AdminLogin.tsx`
- Create: `components/admin/AdminShell.tsx`
- Create: `components/admin/CatalogManager.tsx`
- Create: `components/admin/CatalogItemForm.tsx`
- Modify: `utils/catalogService.ts`
- Modify: `App.tsx`

**Interfaces:**
- `isAdminUser(): Promise<boolean>` calls `supabase.rpc('is_game_teamer_admin')` using the active user session.
- `loadAdminCatalog(): Promise<CatalogSnapshot>` reads active and inactive rows after server-side RLS evaluation.
- `saveCatalogEntry(table, entry): Promise<void>` inserts or updates one allowlisted catalog row.
- `uploadCatalogImage(file, table, recordId): Promise<string>` uploads a UUID-named file into `gameteamer-assets` and returns its public URL.

- [ ] **Step 1: Add the admin route and auth state**

  Add `/admin` in `App.tsx` without adding a public home-page link. On page load, call `supabase.auth.getSession()` and `isAdminUser()`. Show the protected dashboard only when both return a valid session and admin authorization. Use `supabase.auth.signInWithPassword` for login and `supabase.auth.signOut` for logout; add no sign-up action.

- [ ] **Step 2: Build the editor shell**

  Add tabs for `Apex Legends`, `Apex weapons`, and `VALORANT Agents`. Display existing rows with active state and current image preview; provide add and edit forms, a reversible deactivate/reactivate action, and a reload action.

- [ ] **Step 3: Validate item forms**

  Require Legend name, class, card image, and portrait image; weapon name, type, ammo, and image; Agent name, role, and image. Reject a file unless it is PNG/JPEG/WebP and `file.size <= 5 * 1024 * 1024`. Prevent changes that would leave fewer than one active Legend, two eligible weapon types, or five active Agents.

- [ ] **Step 4: Implement Storage and row saves**

  Upload each selected image to `gameteamer-assets/{table}/{recordId}/{crypto.randomUUID()}.{extension}`, save the returned public URL in the catalog row, then refresh the shared catalog. If the row write fails after upload, remove the new object when possible and keep the form values with an error message.

- [ ] **Step 5: Add auth and save states**

  Show login errors, an access-denied state for non-allowlisted accounts, upload progress, save progress, and success/error notices. Do not include the owner email or a Supabase secret in source.

- [ ] **Step 6: Commit the admin editor**

  ```powershell
  git add pages/Admin.tsx components/admin utils/catalogService.ts App.tsx
  git commit -m "feat: add protected game catalog admin"
  ```

---

### Task 5: Shared room activity Presence and admin overview

**Files:**
- Create: `utils/roomActivity.ts`
- Create: `components/admin/ActiveRoomsDashboard.tsx`
- Modify: `pages/ApexLegends.tsx`
- Modify: `pages/Admin.tsx`

**Interfaces:**
- `trackActiveRoom({ game, roomInstanceId, sessionId }): Promise<() => Promise<void>>` tracks one anonymous browser session on topic `gameteamer:active-rooms` with Presence key `sessionId`.
- `summarizeActiveRooms(presenceState): ActiveRoomSummary[]` groups sessions by opaque room-instance ID and game and returns room and player counts.
- `ActiveRoomSummary` contains `roomInstanceId`, `game`, and `playerCount`; it contains no room code or player name.

- [ ] **Step 1: Add the shared room directory helper**

  Create one `gameteamer:active-rooms` channel with `config.presence.key = sessionId`. Track `{ roomInstanceId, game, sessionId }` only after `SUBSCRIBED`. Return an untrack/remove cleanup function. Generate session and room-instance IDs with `crypto.randomUUID()`.

- [ ] **Step 2: Give each Apex room a shared opaque instance ID**

  On room creation, generate `roomInstanceId` and include it in the creator's game-room Presence payload. On join, read the existing room's opaque ID before tracking the joiner's Presence. Do not put the room code or display name in the global directory.

- [ ] **Step 3: Start and stop Apex activity tracking**

  Start directory tracking when the game-room channel reaches `SUBSCRIBED` and the lobby is entered. Stop it in the existing leave, disband, room-close, and React cleanup paths. A disconnected browser relies on Supabase Presence removal.

- [ ] **Step 4: Render live room summaries in admin**

  Subscribe to the directory channel in `ActiveRoomsDashboard`, aggregate `sync`, `join`, and `leave` events by room instance, and show totals for active rooms and players grouped by Apex and VALORANT. Show an empty state when no clients are present.

- [ ] **Step 5: Commit activity reporting**

  ```powershell
  git add utils/roomActivity.ts components/admin/ActiveRoomsDashboard.tsx pages/ApexLegends.tsx pages/Admin.tsx
  git commit -m "feat: show active realtime game rooms"
  ```

---

### Task 6: VALORANT Agent assets and unique assignment logic

**Files:**
- Create: `scripts/download_valorant_assets.js`
- Create: `utils/valorantLogic.ts`
- Create: `public/valorant/agents/` images for the roster in Task 1
- Modify: `package.json`
- Use: `utils/catalogTypes.ts`

**Interfaces:**
- `assignAgents(players: ValorantPlayer[], agents: ValorantAgent[], random?: () => number): AgentAssignment[]` requires exactly five unique player IDs and five active Agents, shuffles a copied Agent list, and returns one unique Agent per player.
- `ValorantPlayer` contains `id`, `name`, and stable `onlineAt` fields.
- `AgentAssignment` contains `playerId` and `agent`.

- [ ] **Step 1: Add a downloader for official Agent images**

  Add a manifest for the same 29 names seeded by Task 1, using the official page slugs (`kay-o` for KAY/O). For each `https://playvalorant.com/en-us/agents/{slug}/` page, read the `og:image` URL, remove resize/crop query parameters to use its original PNG, and save to `public/valorant/agents/{id}.png`. Fail with the Agent name and URL if an official page or image cannot be downloaded. Do not use an API key or a third-party asset host.

- [ ] **Step 2: Add the npm asset command and generate the tracked images**

  Add `"download-valorant-assets": "node scripts/download_valorant_assets.js"` to `package.json`. Run `npm run download-valorant-assets`; seed paths from Task 1 must match the resulting `/valorant/agents/{id}.png` paths.

- [ ] **Step 3: Implement the assignment function**

  Validate five distinct player IDs and at least five active Agents. Use an in-place Fisher-Yates shuffle on a copied Agent array, then pair the first five shuffled Agents with players in stable lobby order. Throw a user-displayable error if either input is invalid.

- [ ] **Step 4: Commit VALORANT assets and assignment logic**

  ```powershell
  git add scripts/download_valorant_assets.js utils/valorantLogic.ts package.json public/valorant/agents
  git commit -m "feat: add VALORANT Agent catalog assets"
  ```

---

### Task 7: VALORANT online lobby and routes

**Files:**
- Create: `pages/Valorant.tsx`
- Create: `components/valorant/ValorantPlayerCard.tsx`
- Create: `components/valorant/AgentAssignmentCard.tsx`
- Modify: `utils/roomActivity.ts`
- Modify: `pages/Home.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Room topic is `valorant-room:{roomCode}` and uses Presence `{ userId, userName, onlineAt, roomInstanceId }`.
- Broadcast events are `VALORANT_ROLL`, `ROOM_STATE_REQUEST`, `ROOM_STATE`, and `ROOM_CLOSED`.
- A roll payload has a `rollId` and a map from player ID to serialized `AgentAssignment` so every browser displays the same result.

- [ ] **Step 1: Build create/join setup**

  Mirror the Apex setup flow: accept a display name, generate a six-character room code for create, and accept a room code for join. Reuse the same persistent session ID conventions as Apex, reject an inactive room, and show connection/reconnect states.

- [ ] **Step 2: Track a five-person roster**

  On create, generate a `roomInstanceId` with `crypto.randomUUID()` and include it in the creator's Presence record. On join, read and reuse that ID from an existing participant before tracking the joiner's own record. Track each player on `valorant-room:{roomCode}` with a unique ID and stable `onlineAt`. Sort by `onlineAt` then user ID. Show at most five slots; after Presence sync, reject a participant whose sorted index is five or greater with a room-full message. Use the shared opaque instance ID for the admin directory.

- [ ] **Step 3: Synchronize the current assignment**

  On join, send `ROOM_STATE_REQUEST`. Existing participants respond with their current assignment map using `ROOM_STATE`; on `VALORANT_ROLL`, all clients replace their assignment map by `rollId`. Ignore duplicate `rollId` events and clear assignments for players who leave.

- [ ] **Step 4: Add team roll controls**

  Enable the team roll only when exactly five distinct players and five active Agents are present. Call `assignAgents`, broadcast the payload, and render the same player-to-Agent mapping on all clients. Allow another team roll while the room is open.

- [ ] **Step 5: Add leave, close, and directory cleanup**

  Untrack both the VALORANT room Presence and global room-directory Presence on leave or unmount. Broadcast `ROOM_CLOSED` when the room is closed and return all connected clients to setup.

- [ ] **Step 6: Add navigation**

  Register `/valorant` in `App.tsx` and add a VALORANT roulette card to `Home.tsx`. Render each active Agent image through `resolveAssetUrl` and show its role as display metadata.

- [ ] **Step 7: Commit the VALORANT lobby**

  ```powershell
  git add pages/Valorant.tsx components/valorant utils/roomActivity.ts pages/Home.tsx App.tsx
  git commit -m "feat: add five-player VALORANT roulette lobby"
  ```

---

### Task 8: Supabase setup and owner handoff documentation

**Files:**
- Create: `docs/SUPABASE_SETUP.md`
- Modify: `README.md`

- [ ] **Step 1: Document manual database setup**

  Explain that the owner pastes `supabase/migrations/202609260001_catalog_admin.sql` into the Supabase SQL Editor. Include steps to create the owner Auth user in Supabase Dashboard and then add the exact verified email through SQL Editor:

  ```sql
  insert into public.game_admin_allowlist (email)
  values (lower('YOUR_VERIFIED_ADMIN_EMAIL'))
  on conflict (email) do nothing;
  ```

  Keep the real email out of this document and all tracked files.

- [ ] **Step 2: Document local and Vercel login setup**

  Retain `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as the only browser environment variables. Explain that the Auth email must match the SQL allowlist and that no service-role key belongs in local Vite or Vercel browser variables.

- [ ] **Step 3: Document season and VALORANT content updates**

  Explain how to toggle the Care Package field, edit active state, add an Apex Legend with both image files, add an Agent, upload the asset, and confirm the live catalog refreshes for open pages. Explain that the dashboard shows live rooms only and has no visit history.

- [ ] **Step 4: Update the README**

  Add `/admin`, `/valorant`, the room dashboard, and the required Supabase Auth/Storage setup to the README. Keep the existing `.env.example` limited to the two public Supabase values; do not add a service-role key or the owner email.

- [ ] **Step 5: Commit setup documentation**

  ```powershell
  git add docs/SUPABASE_SETUP.md README.md
  git commit -m "docs: explain catalog admin setup"
  ```
