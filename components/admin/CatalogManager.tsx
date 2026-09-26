import React, { useState, useEffect } from 'react';
import { CatalogSnapshot, Legend, ValorantAgent, Weapon } from '../../utils/catalogTypes';
import { saveAgent, saveLegend, saveWeapon } from '../../utils/catalogService';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { CatalogItemForm, ItemType } from './CatalogItemForm';
import {
  Crosshair,
  Shield,
  Plus,
  Edit2,
  Package,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CatalogManagerProps {
  catalog: CatalogSnapshot;
  onRefresh: () => Promise<void>;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ catalog, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'WEAPONS' | 'LEGENDS' | 'AGENTS'>('WEAPONS');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: ItemType; item: any } | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Optimistic local catalog state for instant UI response
  const [localCatalog, setLocalCatalog] = useState<CatalogSnapshot>(catalog);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useEffect(() => {
    setLocalCatalog(catalog);
  }, [catalog]);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 5000);
  };

  // Toggle Care Package on weapon directly with instant optimistic feedback
  const handleToggleCarePackage = async (weapon: Weapon) => {
    const updated: Weapon = {
      ...weapon,
      isCarePackage: !weapon.isCarePackage
    };

    // Validate: cannot move to care package if it leaves fewer than 2 weapon types outside care packages
    if (updated.isCarePackage) {
      const remainingActiveOutside = localCatalog.apexWeapons.filter(
        (w) => w.id !== weapon.id && w.isActive !== false && !w.isCarePackage
      );
      const uniqueTypes = new Set(remainingActiveOutside.map((w) => w.type));
      if (uniqueTypes.size < 2) {
        showNotice('error', 'Cannot move to Care Package: at least 2 distinct weapon types must remain in ground pool.');
        return;
      }
    }

    // 1. Optimistic update
    setLocalCatalog((prev) => ({
      ...prev,
      apexWeapons: prev.apexWeapons.map((w) => (w.id === weapon.id ? updated : w))
    }));
    setBusyItemId(weapon.id);

    try {
      await saveWeapon(updated);
      await onRefresh();
      showNotice(
        'success',
        `${weapon.name} ${updated.isCarePackage ? 'moved into Care Package' : 'returned to ground loot'}!`
      );
    } catch (err: any) {
      // Revert optimistic update
      setLocalCatalog(catalog);
      showNotice('error', err.message || 'Failed to update weapon Care Package status.');
    } finally {
      setBusyItemId(null);
    }
  };

  // Toggle Active on weapon
  const handleToggleActiveWeapon = async (weapon: Weapon) => {
    const willBeActive = !weapon.isActive;
    if (!willBeActive && !weapon.isCarePackage) {
      const remainingOutside = localCatalog.apexWeapons.filter(
        (w) => w.id !== weapon.id && w.isActive !== false && !w.isCarePackage
      );
      const uniqueTypes = new Set(remainingOutside.map((w) => w.type));
      if (uniqueTypes.size < 2) {
        showNotice('error', 'Cannot deactivate: at least 2 distinct weapon types must remain active outside Care Package.');
        return;
      }
    }

    const updated: Weapon = { ...weapon, isActive: willBeActive };
    setLocalCatalog((prev) => ({
      ...prev,
      apexWeapons: prev.apexWeapons.map((w) => (w.id === weapon.id ? updated : w))
    }));
    setBusyItemId(weapon.id);

    try {
      await saveWeapon(updated);
      await onRefresh();
      showNotice('success', `${weapon.name} is now ${willBeActive ? 'active' : 'inactive'}.`);
    } catch (err: any) {
      setLocalCatalog(catalog);
      showNotice('error', err.message || 'Failed to toggle weapon state.');
    } finally {
      setBusyItemId(null);
    }
  };

  // Toggle Active on legend
  const handleToggleActiveLegend = async (legend: Legend) => {
    const willBeActive = !legend.isActive;
    if (!willBeActive) {
      const remaining = localCatalog.apexLegends.filter((l) => l.id !== legend.id && l.isActive !== false);
      if (remaining.length < 1) {
        showNotice('error', 'Cannot deactivate: at least 1 active Legend must remain.');
        return;
      }
    }

    const updated: Legend = { ...legend, isActive: willBeActive };
    setLocalCatalog((prev) => ({
      ...prev,
      apexLegends: prev.apexLegends.map((l) => (l.id === legend.id ? updated : l))
    }));
    setBusyItemId(legend.id);

    try {
      await saveLegend(updated);
      await onRefresh();
      showNotice('success', `${legend.name} is now ${willBeActive ? 'active' : 'inactive'}.`);
    } catch (err: any) {
      setLocalCatalog(catalog);
      showNotice('error', err.message || 'Failed to toggle legend state.');
    } finally {
      setBusyItemId(null);
    }
  };

  // Toggle Active on agent
  const handleToggleActiveAgent = async (agent: ValorantAgent) => {
    const willBeActive = !agent.isActive;
    if (!willBeActive) {
      const remaining = localCatalog.valorantAgents.filter((a) => a.id !== agent.id && a.isActive !== false);
      if (remaining.length < 1) {
        showNotice('error', 'Cannot deactivate: at least 1 active VALORANT Agent must remain in the pool.');
        return;
      }
    }

    const updated: ValorantAgent = { ...agent, isActive: willBeActive };
    setLocalCatalog((prev) => ({
      ...prev,
      valorantAgents: prev.valorantAgents.map((a) => (a.id === agent.id ? updated : a))
    }));
    setBusyItemId(agent.id);

    try {
      await saveAgent(updated);
      await onRefresh();
      showNotice('success', `${agent.name} is now ${willBeActive ? 'active' : 'inactive'}.`);
    } catch (err: any) {
      setLocalCatalog(catalog);
      showNotice('error', err.message || 'Failed to toggle agent state.');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleSaveItem = async (item: any) => {
    try {
      if (editingItem?.type === 'WEAPON') {
        await saveWeapon(item);
      } else if (editingItem?.type === 'LEGEND') {
        await saveLegend(item);
      } else if (editingItem?.type === 'AGENT') {
        await saveAgent(item);
      }
      await onRefresh();
      showNotice('success', `${item.name} saved successfully.`);
      setEditingItem(null);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to save item.');
      throw err;
    }
  };

  // Filtered lists from localCatalog
  const filteredWeapons = localCatalog.apexWeapons.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.type.toLowerCase().includes(search.toLowerCase()) ||
      w.ammo.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLegends = localCatalog.apexLegends.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.class.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAgents = localCatalog.valorantAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Floating Notice Toast - fixed top-20 right-6 so it stays visible during scrolling */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold shadow-2xl backdrop-blur-xl border max-w-md ${
              notice.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50'
                : 'bg-red-950/90 border-red-500/40 text-red-300 shadow-red-950/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <span className="leading-snug">{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs and Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-900/60 backdrop-blur-md p-3 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('WEAPONS'); setSearch(''); }}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'WEAPONS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>Apex Weapons ({catalog.apexWeapons.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('LEGENDS'); setSearch(''); }}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'LEGENDS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Apex Legends ({catalog.apexLegends.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('AGENTS'); setSearch(''); }}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'AGENTS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>VALORANT Agents ({catalog.valorantAgents.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <button
            onClick={() => {
              if (activeTab === 'WEAPONS') setEditingItem({ type: 'WEAPON', item: null });
              else if (activeTab === 'LEGENDS') setEditingItem({ type: 'LEGEND', item: null });
              else setEditingItem({ type: 'AGENT', item: null });
            }}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-900/30 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab === 'WEAPONS' ? 'Weapon' : activeTab === 'LEGENDS' ? 'Legend' : 'Agent'}</span>
          </button>
        </div>
      </div>

      {/* Weapons Tab Content */}
      {activeTab === 'WEAPONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWeapons.map((w) => (
            <motion.div
              key={w.id}
              layout
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                w.isActive === false
                  ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                  : w.isCarePackage
                  ? 'bg-red-950/20 border-red-900/40 shadow-lg shadow-red-950/20'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white uppercase tracking-tight">{w.name}</span>
                    {w.isCarePackage && (
                      <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Package className="w-3 h-3" />
                        Care Package
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingItem({ type: 'WEAPON', item: w })}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-20 bg-neutral-950/80 rounded-xl border border-neutral-800/80 p-2 flex items-center justify-center mb-3 overflow-hidden">
                  <img
                    src={resolveAssetUrl(w.image || `${w.id}.png`, 'weapons')}
                    alt={w.name}
                    className="max-h-full max-w-full object-contain drop-shadow"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300">{w.type}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-400">{w.ammo}</span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-800/80">
                <button
                  disabled={busyItemId === w.id}
                  onClick={() => handleToggleCarePackage(w)}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 ${
                    w.isCarePackage
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  {busyItemId === w.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Package className="w-3 h-3" />
                  )}
                  <span>{w.isCarePackage ? 'Leave Package' : 'Put In Package'}</span>
                </button>

                <button
                  disabled={busyItemId === w.id}
                  onClick={() => handleToggleActiveWeapon(w)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                    w.isActive !== false
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {w.isActive !== false ? 'Active' : 'Disabled'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Legends Tab Content */}
      {activeTab === 'LEGENDS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLegends.map((leg) => (
            <motion.div
              key={leg.id}
              layout
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                leg.isActive === false
                  ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-sm text-white uppercase tracking-tight truncate">{leg.name}</span>
                  <button
                    onClick={() => setEditingItem({ type: 'LEGEND', item: leg })}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-32 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden mb-3 relative group">
                  <img
                    src={resolveAssetUrl(leg.image || `${leg.id}.png`, 'legends')}
                    alt={leg.name}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div className="absolute bottom-2 left-2 w-8 h-8 rounded-lg bg-black/70 border border-white/10 overflow-hidden">
                    <img
                      src={resolveAssetUrl(leg.icon, 'icons')}
                      alt={leg.name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300">{leg.class}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md ${
                      leg.isActive !== false ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500 bg-neutral-800'
                    }`}
                  >
                    {leg.isActive !== false ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800">
                <button
                  disabled={busyItemId === leg.id}
                  onClick={() => handleToggleActiveLegend(leg)}
                  className={`w-full py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                    leg.isActive !== false
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {busyItemId === leg.id && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{leg.isActive !== false ? 'Active in Pool' : 'Hidden from Pool'}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* VALORANT Agents Tab Content */}
      {activeTab === 'AGENTS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAgents.map((agent) => (
            <motion.div
              key={agent.id}
              layout
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                agent.isActive === false
                  ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-sm text-white uppercase tracking-tight truncate">{agent.name}</span>
                  <button
                    onClick={() => setEditingItem({ type: 'AGENT', item: agent })}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-36 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden mb-3 relative">
                  <img
                    src={resolveAssetUrl(agent.image)}
                    alt={agent.name}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300">{agent.role}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md ${
                      agent.isActive !== false ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500 bg-neutral-800'
                    }`}
                  >
                    {agent.isActive !== false ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800">
                <button
                  disabled={busyItemId === agent.id}
                  onClick={() => handleToggleActiveAgent(agent)}
                  className={`w-full py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                    agent.isActive !== false
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {busyItemId === agent.id && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{agent.isActive !== false ? 'Active in Roulette' : 'Hidden from Roulette'}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingItem && (
        <CatalogItemForm
          type={editingItem.type}
          item={editingItem.item}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};
