**Team & Loadout Randomizer for Gamers**

GameTeamer is a web application that helps you generate random teams and loadouts for popular games.
Currently supported:
- **Apex Legends** - Random Legend + Weapon Loadout with Online Multiplayer
- **Squad Assembler** - Random team generation from a player list

**Live Demo:** [https://gameteamer.vercel.app/](https://gameteamer.vercel.app/)

---

## Features

<img width="1758" height="871" alt="image" src="https://github.com/user-attachments/assets/95911b63-78c8-4f25-9a02-dbf39f05bb27" />


### Apex Legends Randomizer
- **Random Legend & Weapons** - Automatically selects a random character and 2 different weapon types.
- **Online Multiplayer** - Create rooms and share with friends via Room Code.
- **Real-time Sync** - Instant synchronization between players.
- **Legend Pool Management** - Exclude Legends you don't own.
- **Care Package Filter** - Automatically filters out Care Package weapons (Kraber, Bocek, Devotion, etc.).
- **Ban System** - Exclude specific Legends you don't want to play.

<img width="1837" height="864" alt="image" src="https://github.com/user-attachments/assets/31a86a3a-85e4-4c30-aa51-fb482060792d" />


### Squad Assembler
- Generate random teams from a list of names.
- Supports multiple team configurations (2v2, 3v3, 4v4, 5v5, 6v6).
- Quick copy results.

<img width="1595" height="845" alt="image" src="https://github.com/user-attachments/assets/30870f96-bdc9-42fc-aba1-060cbfb3fd88" />


---

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Realtime**: Supabase Realtime
- **Icons**: Lucide React
- **Analytics**: Vercel Analytics

---

## Installation & Running Locally

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Clone repository
```bash
git clone https://github.com/HyIsNoob/GameTeamer.git
cd GameTeamer
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run development server
```bash
npm run dev
```

Open your browser at `http://localhost:5173`

### 5. Build for production
```bash
npm run build
```

---

## Project Structure

```
GameTeamer/
├── components/           # React components
│   ├── apex/            # Apex Legends specific components
│   │   └── LegendCard.tsx
│   ├── GameSelector.tsx
│   ├── PlayerList.tsx
│   └── TeamDisplay.tsx
├── pages/               # Page components
│   ├── Home.tsx         # Landing page
│   ├── ApexLegends.tsx  # Apex randomizer
│   └── SquadAssembler.tsx
├── utils/               # Utility functions & data
│   ├── apexData.ts      # Legends & weapons data
│   ├── apexLogic.ts     # Randomizer logic
│   ├── teamLogic.ts     # Squad generator logic
│   └── supabase.ts      # Supabase client
├── public/              # Static assets
│   ├── legends/         # Legend card images
│   ├── icons/           # Legend portrait icons
│   └── weapons/         # Weapon images
└── App.tsx              # Root component with routing
```

---

## Usage Guide

### Apex Legends Online

1. **Create Room**:
   - Enter player name.
   - Configure Legend Pool (exclude unowned Legends).
   - Click "Launch Lobby".
   - Share Room Code with friends.

2. **Join Room**:
   - Switch to "Join Room" tab.
   - Enter Room Code.
   - Click "Join Squad".

3. **Random Loadout**:
   - Click "Reroll Loadout" for individual reroll.
   - Or click "Deploy Team Randomizer" to reroll for the entire squad.

### Squad Assembler

1. Enter list of player names (one per line).
2. Select team configuration (e.g., 3v3).
3. Click "Generate Teams".
4. Copy results.

---

## Supabase Configuration

1. Create a project on [Supabase](https://supabase.com).
2. Enable Realtime in Project Settings.
3. Copy URL and Anon Key to `.env.local`.

---

## Changelog

### v2.0 (Current)
- Apex Legends Online Multiplayer support (Real-time).
- Care Package weapon filtering.
- Custom confirmation modal.
- Updated Legend roles for latest season.
- New Legend added: Sparrow.
- Vercel Analytics integration.

### v1.0
- Squad Assembler tool.
- Basic UI/UX.

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Author

**Hy** - [@HyIsNoob](https://github.com/HyIsNoob)

---

<div align="center">
For the Gaming Community
</div>
