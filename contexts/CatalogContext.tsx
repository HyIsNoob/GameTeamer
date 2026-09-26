import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CatalogSnapshot, Legend, ValorantAgent, Weapon } from '../utils/catalogTypes';
import { APEX_LEGENDS, APEX_WEAPONS } from '../utils/apexData';
import { loadPublicCatalog, subscribeToCatalogChanges } from '../utils/catalogService';

export const FALLBACK_VALORANT_AGENTS: ValorantAgent[] = [
  { id: 'jett', name: 'Jett', role: 'Duelist', image: '/valorant/agents/jett.png', isActive: true, sortOrder: 1 },
  { id: 'phoenix', name: 'Phoenix', role: 'Duelist', image: '/valorant/agents/phoenix.png', isActive: true, sortOrder: 2 },
  { id: 'reyna', name: 'Reyna', role: 'Duelist', image: '/valorant/agents/reyna.png', isActive: true, sortOrder: 3 },
  { id: 'raze', name: 'Raze', role: 'Duelist', image: '/valorant/agents/raze.png', isActive: true, sortOrder: 4 },
  { id: 'yoru', name: 'Yoru', role: 'Duelist', image: '/valorant/agents/yoru.png', isActive: true, sortOrder: 5 },
  { id: 'iso', name: 'Iso', role: 'Duelist', image: '/valorant/agents/iso.png', isActive: true, sortOrder: 6 },
  { id: 'neon', name: 'Neon', role: 'Duelist', image: '/valorant/agents/neon.png', isActive: true, sortOrder: 7 },
  { id: 'sova', name: 'Sova', role: 'Initiator', image: '/valorant/agents/sova.png', isActive: true, sortOrder: 8 },
  { id: 'breach', name: 'Breach', role: 'Initiator', image: '/valorant/agents/breach.png', isActive: true, sortOrder: 9 },
  { id: 'skye', name: 'Skye', role: 'Initiator', image: '/valorant/agents/skye.png', isActive: true, sortOrder: 10 },
  { id: 'kayo', name: 'KAY/O', role: 'Initiator', image: '/valorant/agents/kayo.png', isActive: true, sortOrder: 11 },
  { id: 'fade', name: 'Fade', role: 'Initiator', image: '/valorant/agents/fade.png', isActive: true, sortOrder: 12 },
  { id: 'gekko', name: 'Gekko', role: 'Initiator', image: '/valorant/agents/gekko.png', isActive: true, sortOrder: 13 },
  { id: 'tejo', name: 'Tejo', role: 'Initiator', image: '/valorant/agents/tejo.png', isActive: true, sortOrder: 14 },
  { id: 'brimstone', name: 'Brimstone', role: 'Controller', image: '/valorant/agents/brimstone.png', isActive: true, sortOrder: 15 },
  { id: 'omen', name: 'Omen', role: 'Controller', image: '/valorant/agents/omen.png', isActive: true, sortOrder: 16 },
  { id: 'viper', name: 'Viper', role: 'Controller', image: '/valorant/agents/viper.png', isActive: true, sortOrder: 17 },
  { id: 'astra', name: 'Astra', role: 'Controller', image: '/valorant/agents/astra.png', isActive: true, sortOrder: 18 },
  { id: 'harbor', name: 'Harbor', role: 'Controller', image: '/valorant/agents/harbor.png', isActive: true, sortOrder: 19 },
  { id: 'clove', name: 'Clove', role: 'Controller', image: '/valorant/agents/clove.png', isActive: true, sortOrder: 20 },
  { id: 'sage', name: 'Sage', role: 'Sentinel', image: '/valorant/agents/sage.png', isActive: true, sortOrder: 21 },
  { id: 'cypher', name: 'Cypher', role: 'Sentinel', image: '/valorant/agents/cypher.png', isActive: true, sortOrder: 22 },
  { id: 'killjoy', name: 'Killjoy', role: 'Sentinel', image: '/valorant/agents/killjoy.png', isActive: true, sortOrder: 23 },
  { id: 'chamber', name: 'Chamber', role: 'Sentinel', image: '/valorant/agents/chamber.png', isActive: true, sortOrder: 24 },
  { id: 'deadlock', name: 'Deadlock', role: 'Sentinel', image: '/valorant/agents/deadlock.png', isActive: true, sortOrder: 25 },
  { id: 'vyse', name: 'Vyse', role: 'Sentinel', image: '/valorant/agents/vyse.png', isActive: true, sortOrder: 26 }
];

export const getFallbackCatalog = (): CatalogSnapshot => ({
  apexLegends: APEX_LEGENDS.map(l => ({ ...l, isActive: true })),
  apexWeapons: APEX_WEAPONS.map(w => ({ ...w, isActive: true })),
  valorantAgents: FALLBACK_VALORANT_AGENTS
});

interface CatalogContextType {
  catalog: CatalogSnapshot;
  loading: boolean;
  error: string | null;
  isFallback: boolean;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType>({
  catalog: getFallbackCatalog(),
  loading: true,
  error: null,
  isFallback: false,
  refresh: async () => {}
});

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<CatalogSnapshot>(getFallbackCatalog());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadPublicCatalog();
      setCatalog(data);
      setError(null);
      setIsFallback(false);
    } catch (err: any) {
      console.warn('Failed to load catalog from Supabase, falling back to bundled data:', err.message);
      setError(err.message || 'Failed to load catalog from server');
      setIsFallback(true);
      setCatalog(getFallbackCatalog());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToCatalogChanges(() => {
      refresh();
    });
    return () => {
      unsubscribe();
    };
  }, [refresh]);

  const contextValue = React.useMemo(
    () => ({ catalog, loading, error, isFallback, refresh }),
    [catalog, loading, error, isFallback, refresh]
  );

  return (
    <CatalogContext.Provider value={contextValue}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => useContext(CatalogContext);
