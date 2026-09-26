import React, { useState } from 'react';
import {
  TournamentFormat,
  MapSelectionMode,
  TournamentSettings,
  VALORANT_MAP_POOL
} from '../../utils/tournamentTypes';
import { Settings2, X, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TournamentSettingsModalProps {
  settings: TournamentSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: TournamentSettings) => void;
}

export const TournamentSettingsModal: React.FC<TournamentSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave
}) => {
  const [format, setFormat] = useState<TournamentFormat>(settings.format);
  const [mode, setMode] = useState<MapSelectionMode>(settings.mode);
  const [bansPerTeam, setBansPerTeam] = useState<number>(settings.bansPerTeam);
  const [enabledMapIds, setEnabledMapIds] = useState<string[]>(settings.enabledMapIds);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleMap = (mapId: string) => {
    if (enabledMapIds.includes(mapId)) {
      setEnabledMapIds(enabledMapIds.filter((id) => id !== mapId));
    } else {
      setEnabledMapIds([...enabledMapIds, mapId]);
    }
  };

  const selectCompetitiveSeven = () => {
    // Current VCT 7 active map pool: Ascent, Bind, Haven, Split, Sunset, Lotus, Abyss
    const compPool = ['ascent', 'bind', 'haven', 'split', 'sunset', 'lotus', 'abyss'];
    setEnabledMapIds(compPool);
  };

  const selectAllMaps = () => {
    setEnabledMapIds(VALORANT_MAP_POOL.map((m) => m.id));
  };

  const handleSave = () => {
    const minNeeded = format === 'BO1' ? 3 : format === 'BO3' ? 5 : 7;
    if (enabledMapIds.length < minNeeded) {
      setError(`Match format ${format} requires at least ${minNeeded} enabled maps (currently ${enabledMapIds.length}).`);
      return;
    }

    onSave({
      format,
      mode,
      bansPerTeam,
      enabledMapIds
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wide">
                Tournament Lobby Settings
              </h2>
              <p className="text-xs text-neutral-400">Configure match rules, veto format, and map pool.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Match Format */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Match Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['BO1', 'BO3', 'BO5'] as TournamentFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
                    format === fmt
                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/50'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {fmt} {fmt === 'BO1' ? '(1 Map)' : fmt === 'BO3' ? '(Best of 3)' : '(Best of 5)'}
                </button>
              ))}
            </div>
          </div>

          {/* Map Selection Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Map Selection Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('VETO')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  mode === 'VETO'
                    ? 'bg-neutral-950 border-rose-500 text-white shadow-lg'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-black uppercase">Turn-Based Map Veto</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Captains alternate banning and picking maps.</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('RANDOM')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  mode === 'RANDOM'
                    ? 'bg-neutral-950 border-rose-500 text-white shadow-lg'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-black uppercase">Random Map Roll</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">System instantly shuffles and selects maps.</div>
              </button>
            </div>
          </div>

          {/* Agent Bans per Team */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Agent Bans (Per Team)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBansPerTeam(num)}
                  className={`py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                    bansPerTeam === num
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {num === 0 ? 'No Bans' : `${num} Ban${num > 1 ? 's' : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Map Pool Toggles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Active Map Pool ({enabledMapIds.length}/{VALORANT_MAP_POOL.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectCompetitiveSeven}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase"
                >
                  VCT 7 Pool
                </button>
                <span className="text-neutral-600">|</span>
                <button
                  type="button"
                  onClick={selectAllMaps}
                  className="text-[10px] text-neutral-400 hover:text-white font-bold uppercase"
                >
                  All 11 Maps
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VALORANT_MAP_POOL.map((m) => {
                const isSelected = enabledMapIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMap(m.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold uppercase tracking-wide transition-all ${
                      isSelected
                        ? 'bg-neutral-950 border-rose-500/60 text-white'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span>{m.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-950/50 transition-all"
          >
            Save & Apply Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
};
