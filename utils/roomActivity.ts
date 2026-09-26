import { isSupabaseConfigured, supabase } from './supabase';

export interface RoomSessionPayload {
  roomInstanceId: string;
  game: 'APEX' | 'VALORANT';
  sessionId: string;
  joinedAt?: number;
}

export interface ActiveRoomSummary {
  roomInstanceId: string;
  game: 'APEX' | 'VALORANT';
  playerCount: number;
}

export interface GlobalRoomStats {
  totalRooms: number;
  totalPlayers: number;
  apexRooms: number;
  apexPlayers: number;
  valorantRooms: number;
  valorantPlayers: number;
}

export const trackActiveRoom = async ({
  game,
  roomInstanceId,
  sessionId
}: RoomSessionPayload): Promise<() => Promise<void>> => {
  if (!isSupabaseConfigured) {
    return async () => {};
  }

  const channel = supabase.channel('gameteamer:active-rooms', {
    config: {
      presence: { key: sessionId }
    }
  });

  return new Promise((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            roomInstanceId,
            game,
            sessionId,
            joinedAt: Date.now()
          });
        } catch (e) {
          console.warn('Failed to track room activity presence:', e);
        }
      }

      // Cleanup function
      const cleanup = async () => {
        try {
          await channel.untrack();
        } catch (_) {}
        supabase.removeChannel(channel);
      };

      resolve(cleanup);
    });
  });
};

export const summarizeActiveRooms = (
  presenceState: Record<string, RoomSessionPayload[]>
): ActiveRoomSummary[] => {
  const roomMap = new Map<string, { game: 'APEX' | 'VALORANT'; count: number }>();

  Object.values(presenceState).forEach((presences) => {
    presences.forEach((item) => {
      if (!item.roomInstanceId || !item.game) return;
      const key = `${item.game}:${item.roomInstanceId}`;
      const existing = roomMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        roomMap.set(key, { game: item.game, count: 1 });
      }
    });
  });

  const summaries: ActiveRoomSummary[] = [];
  roomMap.forEach((val, key) => {
    const [, roomInstanceId] = key.split(':');
    summaries.push({
      roomInstanceId,
      game: val.game,
      playerCount: val.count
    });
  });

  return summaries;
};

export const calculateRoomStats = (summaries: ActiveRoomSummary[]): GlobalRoomStats => {
  let apexRooms = 0;
  let apexPlayers = 0;
  let valorantRooms = 0;
  let valorantPlayers = 0;

  summaries.forEach((s) => {
    if (s.game === 'APEX') {
      apexRooms += 1;
      apexPlayers += s.playerCount;
    } else if (s.game === 'VALORANT') {
      valorantRooms += 1;
      valorantPlayers += s.playerCount;
    }
  });

  return {
    totalRooms: summaries.length,
    totalPlayers: apexPlayers + valorantPlayers,
    apexRooms,
    apexPlayers,
    valorantRooms,
    valorantPlayers
  };
};
