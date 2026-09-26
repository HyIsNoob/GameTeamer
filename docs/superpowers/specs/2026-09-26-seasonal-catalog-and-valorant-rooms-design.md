# Seasonal Catalog, Admin Dashboard, and VALORANT Rooms

**Status:** Approved design

## Goal

Let the site owner update the active Apex Legends weapon and Legend pools, see which Apex and VALORANT rooms are open now, and run a synchronized five-player VALORANT Agent roulette.

## Current project

GameTeamer is a React 19, TypeScript, and Vite application. `App.tsx` defines the routes. Apex Legends and weapons are hard-coded in `utils/apexData.ts`; `utils/apexLogic.ts` selects from those arrays, and the Apex page reads them directly. Images are bundled under `public/`. Supabase is currently used for Realtime Broadcast and Presence, with no database tables or Auth flow. VALORANT is listed as a Squad Assembler preset but has no Agent roulette.

## Approved product behavior

### Admin and game catalogs

- Add a protected `/admin` route with Supabase Auth sign-in. There is no public sign-up flow.
- Only an email in a server-controlled Supabase allowlist can view the dashboard or write catalog and image data. The browser uses only the existing publishable/anon key; it never receives a service-role key.
- Keep the owner email out of Git. Bootstrap the allowlist once through the Supabase SQL editor after creating the owner Auth account.
- The dashboard has sections for Apex Legends, Apex weapons, and VALORANT Agents.
- Each catalog supports adding, editing, and deactivating entries. Deactivation is reversible and keeps existing room payloads and user preferences valid.
- Apex weapon entries include name, weapon type, ammo type, image, active status, and a Care Package toggle. Only active weapons outside Care Packages can be selected.
- Apex Legend entries include name, class, card image, portrait image, and active status. Both image fields are required for a new Legend.
- VALORANT Agent entries include name, role, image, and active status. Roles are display metadata; the roulette does not enforce a role composition.
- Validate image uploads as PNG, JPEG, or WebP up to 5 MB. Store new images in a public-read Supabase Storage bucket with writes restricted to the admin. Existing bundled image paths remain supported.
- The initial Apex catalog is seeded from the current `utils/apexData.ts` values, including its existing Care Package flags. The initial VALORANT catalog is seeded from the official Agent roster available during implementation; its current official roster is listed at [VALORANT Agents](https://playvalorant.com/en-us/agents/).
- Keep at least one active Legend, at least two eligible weapon types, and at least five active VALORANT Agents so each randomizer can produce a valid result.
- Public pages can read active catalog data without signing in. Catalog writes and Storage mutations use database RLS policies backed by the admin allowlist.
- After an admin saves a change, open Apex and VALORANT pages receive catalog updates through Supabase Realtime. New sessions load the latest catalog from Supabase.

### Live-room dashboard

- The admin overview shows the number of active rooms and players, grouped by Apex and VALORANT, plus a live list of active rooms and their player counts.
- Use a shared Supabase Realtime Presence directory. A participant publishes only an opaque room-instance ID, game ID, and session ID; do not publish player names or join codes. The admin aggregates sessions by room instance.
- Room state is ephemeral. Presence removes disconnected clients automatically; the app also untracks a player on a normal leave. When the last participant leaves, the room disappears from the dashboard.
- Show online rooms and players only. Historical visitor totals, trend charts, and room history are out of scope. Existing Vercel Analytics remains unchanged and is not queried by the admin page.

### VALORANT online roulette

- Add a `/valorant` page and a VALORANT card on the home page.
- Players create or join a lobby with a room code, enter a display name, and see the live roster. A lobby has up to five player slots; the team roulette is available only when five distinct players are present.
- Any lobby participant can trigger a team roll. The app selects five distinct active Agents and assigns one to each player, then broadcasts the same result to everyone in the room.
- All clients show the same roster and result. A joining client requests the current room state so it can display an already completed roll.
- Participants can roll again while the lobby is open. Leaving the lobby ends that participant's Presence session. This feature covers pre-match Agent selection only; it does not add match stats, roles-based composition rules, or persistent match history.
- Reject additional joins when the room is full and prevent a roll when fewer than five active Agents are available.

### Apex integration

- Replace direct reads of `APEX_LEGENDS` and `APEX_WEAPONS` in the public Apex flow with a shared catalog service, retaining the current bundled arrays as a safe fallback when Supabase catalog data is unavailable.
- Update the randomizer, exclusion picker, Legend card, and image rendering to consume catalog records and both legacy local asset paths and uploaded URLs.
- Existing Apex room presence and broadcast behavior remains in place. Each active Apex lobby also publishes its anonymous session to the shared room directory.

## Data and component boundaries

- Add Supabase migrations for the three public-read catalog tables, private admin allowlist, RLS policies, Realtime publication, and Storage access policies.
- Add a catalog service responsible for load, edit, upload, and realtime subscription operations.
- Keep the admin page responsible for authentication state, catalog forms, image previews, and current-room overview.
- Keep VALORANT room state and randomization separate from Apex code, using the same Supabase Realtime patterns for presence and broadcast.
- Keep shared room-directory Presence separate from game-specific room channels. It reports aggregate activity and contains no player names or joinable codes.

## Failure and loading behavior

- Show a clear setup or connection message if Supabase is unavailable. Apex may use its bundled catalog fallback; VALORANT cannot start a roll without a valid Agent catalog.
- Admin pages show access denied for a signed-in email outside the allowlist. A failed sign-in keeps the user on the login view.
- Validate required names, categories, and images before saving. If an upload succeeds but the catalog write fails, remove the newly uploaded orphan when possible and keep the form open with an error.
- Disable randomization while room membership or the catalog is loading, when the room is not full, or when the eligible pool is too small.
- Supabase Presence and Broadcast are best-effort realtime channels. If a connection drops, show reconnecting status and rebuild the visible roster from Presence after reconnect.

## Out of scope

- Historical usage analytics or visitor graphs in `/admin`.
- VALORANT match tracking, player accounts, MMR, map selection, or role-balanced team composition.
- Public registration or multiple owner roles.
- Replacing existing bundled artwork for catalog entries that the admin has not uploaded new images for.
