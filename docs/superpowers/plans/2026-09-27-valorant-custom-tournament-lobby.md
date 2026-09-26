# VALORANT 10-Player Custom Tournament & Scrim Lobby Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete 10-player (5v5) custom scrim and tournament lobby (`/tournament`) supporting BO1/BO3/BO5 format, turn-based Map Veto or Random Map roll, Captain Agent Bans, and esports broadcast briefing with real-time Supabase synchronization.

**Architecture:** Realtime Supabase broadcast (`tournament-room:${code}`) with presence tracking for up to 10 players across Team Alpha and Team Omega. Optimistic local state updates with broadcast synchronization. Modular components for settings, rosters, map veto, agent ban, and match summary.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, Supabase Realtime, Web Audio API (`soundManager`).

**Spec:** [docs/superpowers/specs/2026-09-27-valorant-custom-tournament-lobby-design.md](file:///d:/fileluu/Tools/GameTeamer/docs/superpowers/specs/2026-09-27-valorant-custom-tournament-lobby-design.md)

---

## Tasks

### Task 1: Tournament Data Types & Map Pool Definition
**Files:**
- Create: `utils/tournamentTypes.ts`

**Interfaces:**
- Produces:
  - `ValorantMap` interface with name, id, image, description.
  - `VALORANT_MAP_POOL`: list of all 11 active maps.
  - `TournamentFormat`: `'BO1' | 'BO3' | 'BO5'`.
  - `MapSelectionMode`: `'VETO' | 'RANDOM'`.
  - `TournamentPhase`: `'LOBBY' | 'MAP_VETO' | 'AGENT_BAN' | 'MATCH_READY'`.
  - `TournamentSettings`: format, mode, bansPerTeam, enabledMapIds.
  - `VetoAction`: team (`'ALPHA' | 'OMEGA'`), type (`'BAN' | 'PICK' | 'SIDE'`), targetId, side (`'ATTACK' | 'DEFENSE'`).
  - `TournamentState`: full reactive state structure.

- [ ] **Step 1: Write `utils/tournamentTypes.ts`**
- [ ] **Step 2: Commit types**

---

### Task 2: Tournament Veto Engine & Test Logic
**Files:**
- Create: `utils/tournamentLogic.ts`
- Test: `tests/tournamentLogic.test.ts` (run with node or vitest/tsx)

**Interfaces:**
- Produces:
  - `generateVetoSteps(settings, availableMapIds)`: returns ordered steps of who bans/picks when.
  - `executeVetoStep(currentState, action)`: pure transition function returning updated state.
  - `randomizeMaps(count, enabledMapIds)`: random map selector for fast roll mode.
  - `copyMatchSummaryText(state)`: formats markdown/Discord summary.

- [ ] **Step 1: Write `tests/tournamentLogic.test.ts` with test cases for BO1, BO3, and Agent bans**
- [ ] **Step 2: Implement `utils/tournamentLogic.ts` to satisfy all test cases**
- [ ] **Step 3: Run tests and verify 100% pass**
- [ ] **Step 4: Commit tournament logic**

---

### Task 3: 5v5 Roster Board & Team Slot Component
**Files:**
- Create: `components/tournament/TournamentRosterView.tsx`

**Interfaces:**
- Consumes: `TournamentState`, `myId`, `players`, `onSwitchTeam`, `onSetCaptain`
- Displays Team Alpha (5 slots) and Team Omega (5 slots) with Captain badges, player status, and Switch Team buttons.

- [ ] **Step 1: Create `components/tournament/TournamentRosterView.tsx` with Framer Motion animations**
- [ ] **Step 2: Verify responsive 5v5 layout (desktop 2-column, mobile stack)**
- [ ] **Step 3: Commit roster component**

---

### Task 4: Interactive Map Veto Board & Random Roll Component
**Files:**
- Create: `components/tournament/MapVetoBoard.tsx`

**Interfaces:**
- Consumes: `TournamentState`, `isCaptain`, `myTeam`, `onAction`
- Displays cards for all maps in pool:
  - Banned state (slashed red, dimmed, shows banning team).
  - Picked state (glowing green/amber, shows map #1, #2, #3, and chosen starting side).
  - Available state with clickable "Ban Map" or "Pick Map" button when it's user's turn.
  - Random roll mode animation and sound.

- [ ] **Step 1: Create `components/tournament/MapVetoBoard.tsx`**
- [ ] **Step 2: Add side selection modal (Attack vs Defense)**
- [ ] **Step 3: Commit map veto component**

---

### Task 5: Captain Agent Ban Board Component
**Files:**
- Create: `components/tournament/AgentBanBoard.tsx`

**Interfaces:**
- Consumes: `TournamentState`, `agents`, `isCaptain`, `myTeam`, `onBanAgent`
- Displays all 26 Agents grouped or filtered by role.
- Shows banned count indicator per team (e.g. `Alpha: 1/2, Omega: 0/2`).
- Clicking an active agent triggers confirmation to ban with buzzer sound.

- [ ] **Step 1: Create `components/tournament/AgentBanBoard.tsx`**
- [ ] **Step 2: Commit agent ban board**

---

### Task 6: Tournament Settings Modal & Match Briefing Modal
**Files:**
- Create: `components/tournament/TournamentSettingsModal.tsx`
- Create: `components/tournament/MatchSummaryModal.tsx`

**Interfaces:**
- `TournamentSettingsModal`: allows Host to change BO format, map selection mode, bans per team, and toggle individual maps.
- `MatchSummaryModal`: displays official esports match card with Decided Maps, Banned Agents, Rosters, and "Copy for Discord" button.

- [ ] **Step 1: Implement `TournamentSettingsModal.tsx`**
- [ ] **Step 2: Implement `MatchSummaryModal.tsx` with clipboard copy helper**
- [ ] **Step 3: Commit modals**

---

### Task 7: Main Tournament Page & Realtime Orchestration
**Files:**
- Create: `pages/Tournament.tsx`
- Modify: `App.tsx`
- Modify: `pages/Home.tsx`

**Interfaces:**
- Route: `/tournament`
- Presence sync for 10 players (`team`, `slotIndex`, `isCaptain`).
- Channel broadcast: `TOURNAMENT_ACTION`, `TOURNAMENT_RESET`, `STATE_SYNC`.
- Homepage: Add 4th card "VALORANT 5v5 Tournament".

- [ ] **Step 1: Implement `pages/Tournament.tsx` with complete state machine**
- [ ] **Step 2: Register `/tournament` route in `App.tsx`**
- [ ] **Step 3: Add Tournament Card in `pages/Home.tsx`**
- [ ] **Step 4: Test build with `npm run build`**
- [ ] **Step 5: Verify in browser with subagent**
- [ ] **Step 6: Commit and push to GitHub `origin/main`**
