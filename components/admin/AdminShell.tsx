import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { CatalogSnapshot } from '../../utils/catalogTypes';
import { CatalogManager } from './CatalogManager';
import {
  LayoutDashboard,
  Boxes,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Hexagon,
  Radio
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminShellProps {
  catalog: CatalogSnapshot;
  onRefreshCatalog: () => Promise<void>;
  onSignOut: () => void;
  userEmail?: string;
  renderRoomsDashboard?: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  catalog,
  onRefreshCatalog,
  onSignOut,
  userEmail,
  renderRoomsDashboard
}) => {
  const [activeSection, setActiveSection] = useState<'DASHBOARD' | 'CATALOG'>('CATALOG');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onRefreshCatalog();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-red-500 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none mix-blend-overlay" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-md shadow-red-500/20">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase tracking-tight text-white">Game Teamer Admin</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono truncate max-w-[200px] sm:max-w-xs">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh database catalogs"
              className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-red-500' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-800 hover:bg-red-500/10 hover:border-red-500/30 text-neutral-400 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
          <button
            onClick={() => setActiveSection('CATALOG')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSection === 'CATALOG'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Seasonal Catalogs</span>
          </button>

          <button
            onClick={() => setActiveSection('DASHBOARD')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSection === 'DASHBOARD'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Live Rooms Dashboard</span>
          </button>
        </div>

        {/* Section View */}
        {activeSection === 'CATALOG' && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CatalogManager catalog={catalog} onRefresh={onRefreshCatalog} />
          </motion.div>
        )}

        {activeSection === 'DASHBOARD' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderRoomsDashboard || (
              <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center text-neutral-400 text-sm">
                Live rooms dashboard will display active rooms here.
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};
