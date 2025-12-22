export interface GamePreset {
  id: string;
  name: string;
  teamSize: number;
  color: string; // Tailwind class for text color
  borderColor: string; // Tailwind class for border color
}

export const GAMES: GamePreset[] = [
  {
    id: 'apex',
    name: 'APEX LEGENDS',
    teamSize: 3,
    color: 'text-red-500',
    borderColor: 'border-red-500',
  },
  {
    id: 'lol',
    name: 'LEAGUE OF LEGENDS',
    teamSize: 5,
    color: 'text-cyan-500',
    borderColor: 'border-cyan-500',
  },
  {
    id: 'valo',
    name: 'VALORANT',
    teamSize: 5,
    color: 'text-rose-500',
    borderColor: 'border-rose-500',
  },
  {
    id: 'cs2',
    name: 'CS:2',
    teamSize: 5,
    color: 'text-yellow-500',
    borderColor: 'border-yellow-500',
  },
  {
    id: 'overwatch',
    name: 'OVERWATCH 2',
    teamSize: 5,
    color: 'text-orange-500',
    borderColor: 'border-orange-500',
  },
  {
    id: 'custom',
    name: 'CUSTOM_PROTOCOL',
    teamSize: 4,
    color: 'text-zinc-200',
    borderColor: 'border-zinc-200',
  },
];
