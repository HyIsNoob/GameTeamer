import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateRP, RANK_TIERS, MatchResultv2 } from '../../utils/rankLogic';
import { Trophy, Plus, Trash2, TrendingUp, TrendingDown, Users, Sword, Shield, Target } from 'lucide-react';

interface ScoreboardProps {
    results: MatchResultv2[];
    onAddResult?: (result: MatchResultv2) => void;
    onClear?: () => void;
    isHost: boolean;
    players: any[]; // PlayerState[]
    myId?: string;
}

// Helper to persist ranks
const getSavedRanks = () => {
    try {
        const s = localStorage.getItem('apex_player_ranks');
        return s ? JSON.parse(s) : {};
    } catch { return {}; }
};

// Helper to get rank colors
const getRankColor = (tier: string) => {
    switch (tier) {
        case 'Rookie': return 'text-gray-400 border-gray-600 bg-gray-900/50';
        case 'Bronze': return 'text-orange-400 border-orange-700 bg-orange-900/30';
        case 'Silver': return 'text-slate-300 border-slate-500 bg-slate-800/50';
        case 'Gold': return 'text-yellow-400 border-yellow-600 bg-yellow-900/30';
        case 'Platinum': return 'text-cyan-400 border-cyan-600 bg-cyan-900/30';
        case 'Diamond': return 'text-blue-400 border-blue-600 bg-blue-900/30';
        case 'Master': return 'text-purple-400 border-purple-600 bg-purple-900/30';
        case 'Predator': return 'text-red-500 border-red-600 bg-red-900/30';
        default: return 'text-gray-400 border-gray-600';
    }
};

export const Scoreboard: React.FC<ScoreboardProps> = ({ results, onAddResult, onClear, isHost, players, myId }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    
    // Form State
    const [teamPlacement, setTeamPlacement] = useState(20);
    const [playerStats, setPlayerStats] = useState<{
        [id: string]: { kills: number, assists: number, damage: number, participation: number, tier: string }
    }>({});

    // Initialize/Sync Form with current players
    useEffect(() => {
        if (isFormOpen) {
            const savedRanks = getSavedRanks();
            const initialStats: any = { ...playerStats };
            
            players.forEach(p => {
                if (!initialStats[p.id]) {
                    initialStats[p.id] = {
                        kills: 0,
                        assists: 0,
                        damage: 0,
                        participation: 0,
                        tier: savedRanks[p.id] || RANK_TIERS[3] // Default Gold
                    };
                }
            });
            setPlayerStats(initialStats);
        }
    }, [isFormOpen, players]);

    const handleStatChange = (playerId: string, field: string, value: any) => {
        setPlayerStats(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCalculating(true);
        
        // Mock delay for animation
        await new Promise(r => setTimeout(r, 600));

        const details: any = {};
        let totalSquadRP = 0;
        const ranksToSave = getSavedRanks();

        players.forEach(p => {
            const stats = playerStats[p.id] || { kills: 0, assists: 0, damage: 0, participation: 0, tier: 'Gold' };
            const calc = calculateRP(stats.tier, teamPlacement, stats.kills, stats.assists, stats.participation);
            
            details[p.id] = {
                ...stats,
                rp: calc.total
            };
            totalSquadRP += calc.total;
            ranksToSave[p.id] = stats.tier;
        });

        const newResult: MatchResultv2 = {
            id: Math.random().toString(36).substr(2, 9),
            teamPlacement,
            details,
            totalSquadRP,
            timestamp: Date.now()
        };
        
        // Save Ranks persistence
        localStorage.setItem('apex_player_ranks', JSON.stringify(ranksToSave));
        
        onAddResult?.(newResult);
        // setIsFormOpen(false); // Keep open per user request
        
        // Reset stats but keep tiers? For now reset kills/assists
        const resetStats: any = {};
        players.forEach(p => {
             const old = playerStats[p.id];
             if(old) {
                 resetStats[p.id] = { ...old, kills: 0, assists: 0, damage: 0, participation: 0 };
             }
        });
        setPlayerStats(resetStats);
        setTeamPlacement(20);
        setIsCalculating(false);
    };

    // We need to calculate Total Session RP for display.
    // Ideally we sum up RP for "Me" or "Squad Average"? 
    // Let's show Squad Total Delta for now.
    const sessionSquadRP = results.reduce((acc, curr) => acc + curr.totalSquadRP, 0);
    const myTotalRP = myId ? results.reduce((acc, curr) => acc + (curr.details[myId]?.rp || 0), 0) : 0;
    
    // Determine which score to show on button: My RP if possible, else Squad RP
    const buttonRP = myId ? myTotalRP : sessionSquadRP;
    const buttonLabel = myId ? "MY RP" : "SQUAD RP";
    const buttonColorPositive = myId ? 'text-blue-400 border-blue-900/50 bg-blue-900/30' : 'text-green-400 border-green-900/50 bg-green-900/30';
    const buttonColorNegative = 'text-red-400 border-red-900/50 bg-red-900/30';

    return (
        <>
        {/* Trigger Button - Main View */}
        <button 
           onClick={() => setIsFormOpen(true)}
           className={`px-4 py-3 font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-3 border ${
               buttonRP >= 0 
               ? buttonColorPositive
               : buttonColorNegative
           }`}
           title="Session Scoreboard"
        >
             <Trophy size={20} className={buttonRP >= 0 ? (myId ? "text-blue-500" : "text-green-500") : "text-red-500"} />
             <div className="flex flex-col items-start leading-tight">
                 <span className="text-[9px] opacity-75 tracking-wider">{buttonLabel}</span>
                 <span className="text-sm font-mono">{buttonRP > 0 ? '+' : ''}{buttonRP}</span>
             </div>
        </button>

        {/* Modal Overlay via Portal */}
        {isFormOpen && createPortal(
            <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 text-left" 
                onClick={() => setIsFormOpen(false)}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-gray-900 border border-gray-700 w-full max-w-[95vw] lg:max-w-7xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative" 
                    onClick={e => e.stopPropagation()}
                >
                    
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800 bg-gray-950 flex justify-between items-center shrink-0">
                        <div>
                             <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
                                <Trophy className="text-yellow-500" size={28}/> Session Scoreboard
                             </h2>
                             <p className={`text-sm font-mono font-bold ${sessionSquadRP >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                Session RP: {sessionSquadRP}
                             </p>
                        </div>
                        <div className="flex gap-3">
                             {isHost && (
                                <button 
                                onClick={onClear}
                                className="bg-red-900/20 hover:bg-red-900/40 text-red-500 p-2 rounded-lg transition-colors border border-red-900/30"
                                title="Clear All History"
                                >
                                    <Trash2 size={20} />
                                </button>
                             )}
                             <button 
                                onClick={() => setIsFormOpen(false)} 
                                className="bg-white text-black px-6 py-2 rounded-xl font-bold uppercase hover:scale-105 active:scale-95 transition-transform"
                             >
                                Close
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                        
                        {/* LEFT: Input Form (Host Only) */}
                        {isHost ? (
                           <div className="w-full lg:w-1/3 bg-gray-900 border-r border-gray-800 overflow-y-auto p-6 flex flex-col gap-6">
                               <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl">
                                   <label className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Squad Placement</label>
                                   <div className="flex items-center gap-4">
                                       <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xl">#</span>
                                            <input 
                                                type="number" min="1" max="20"
                                                value={teamPlacement === 0 ? '' : teamPlacement}
                                                placeholder="0"
                                                onChange={e => setTeamPlacement(e.target.value === '' ? 0 : Number(e.target.value))}
                                                className="w-full bg-black/40 border-2 border-blue-500/30 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-white font-black text-xl text-center outline-none transition-colors placeholder-gray-700"
                                            />
                                       </div>
                                   </div>
                               </div>

                               <div className="space-y-4">
                                   {players.map(p => {
                                       const stats = playerStats[p.id] || { kills: 0, assists: 0, damage: 0, participation: 0, tier: 'Gold' };
                                       const rankStyle = getRankColor(stats.tier);
                                       const totalKills = results.reduce((acc, r) => acc + (r.details[p.id]?.kills || 0), 0);
                                       const totalDamage = results.reduce((acc, r) => acc + (r.details[p.id]?.damage || 0), 0);
                                       
                                       return (
                                           <div key={p.id} className={`p-3 rounded-2xl border transition-colors ${rankStyle}`}>
                                               <div className="flex justify-between items-start mb-2">
                                                   <div className="flex flex-col min-w-0 mr-2">
                                                       <span className="font-black text-sm uppercase tracking-wide truncate shadow-black drop-shadow-md">{p.name || 'Unknown'}</span>
                                                       <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold opacity-75 mt-0.5 shadow-black drop-shadow-sm">
                                                            <span title="Session Kills">KILLS: {totalKills}</span>
                                                            <span>|</span>
                                                            <span className="flex-1 whitespace-nowrap" title="Session Damage">DMG: {totalDamage.toLocaleString()}</span>
                                                       </div>
                                                   </div>
                                                   <div className="relative group shrink-0">
                                                       <select 
                                                          value={stats.tier}
                                                          onChange={e => handleStatChange(p.id, 'tier', e.target.value)}
                                                          className="appearance-none bg-black/60 border border-current rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold uppercase outline-none hover:bg-black/80 transition-colors cursor-pointer"
                                                       >
                                                          {RANK_TIERS.map(t => <option key={t} value={t} className="bg-gray-900 text-white">{t}</option>)}
                                                       </select>
                                                       <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                       </div>
                                                   </div>
                                               </div>
                                               
                                               <div className="grid grid-cols-4 gap-2">
                                                   <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col justify-center">
                                                       <label className="text-[9px] uppercase text-gray-400 font-bold block mb-1 text-center">Kill</label>
                                                       <input 
                                                            type="number" min="0" 
                                                            value={stats.kills === 0 ? '' : stats.kills} 
                                                            placeholder="0"
                                                            onChange={e => handleStatChange(p.id, 'kills', e.target.value === '' ? 0 : Number(e.target.value))} 
                                                            className="w-full bg-transparent text-center font-mono font-bold text-white outline-none focus:text-blue-400 text-lg p-0 placeholder-gray-700"
                                                       />
                                                   </div>
                                                   <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col justify-center">
                                                       <label className="text-[9px] uppercase text-gray-400 font-bold block mb-1 text-center">Ast</label>
                                                       <input 
                                                            type="number" min="0" 
                                                            value={stats.assists === 0 ? '' : stats.assists} 
                                                            placeholder="0"
                                                            onChange={e => handleStatChange(p.id, 'assists', e.target.value === '' ? 0 : Number(e.target.value))} 
                                                            className="w-full bg-transparent text-center font-mono font-bold text-white outline-none focus:text-blue-400 text-lg p-0 placeholder-gray-700"
                                                       />
                                                   </div>
                                                   <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col justify-center">
                                                       <label className="text-[9px] uppercase text-gray-400 font-bold block mb-1 text-center">Part</label>
                                                       <input 
                                                            type="number" min="0" 
                                                            value={stats.participation === 0 ? '' : stats.participation} 
                                                            placeholder="0"
                                                            onChange={e => handleStatChange(p.id, 'participation', e.target.value === '' ? 0 : Number(e.target.value))} 
                                                            className="w-full bg-transparent text-center font-mono font-bold text-white outline-none focus:text-blue-400 text-lg p-0 placeholder-gray-700"
                                                       />
                                                   </div>
                                                   <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col justify-center">
                                                       <label className="text-[9px] uppercase text-gray-400 font-bold block mb-1 text-center">Dmg</label>
                                                       <input 
                                                            type="number" min="0" 
                                                            value={stats.damage === 0 ? '' : stats.damage} 
                                                            placeholder="0"
                                                            onChange={e => handleStatChange(p.id, 'damage', e.target.value === '' ? 0 : Number(e.target.value))} 
                                                            className="w-full bg-transparent text-center font-mono font-bold text-white outline-none focus:text-blue-400 text-sm py-1 p-0 placeholder-gray-700"
                                                       />
                                                   </div>
                                               </div>
                                           </div>
                                       );
                                   })}
                               </div>

                               <button 
                                   onClick={handleSubmit} 
                                   disabled={isCalculating}
                                   className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-black uppercase rounded-xl shadow-lg hover:shadow-green-900/20 active:scale-95 transition-all mt-auto flex items-center justify-center gap-2 overflow-hidden relative"
                               >
                                   {isCalculating ? (
                                       <>
                                       <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                       Calculating...
                                       </>
                                   ) : (
                                       <>Calculate & Save Match</>
                                   )}
                                   {!isCalculating && <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-300 pointer-events-none"/>}
                               </button>
                           </div>
                        ) : (
                            <div className="w-full lg:w-1/3 bg-gray-900/50 p-10 flex flex-col items-center justify-center text-center border-r border-gray-800">
                                <Trophy size={64} className="text-gray-700 mb-4" />
                                <h3 className="text-xl font-bold text-gray-400 uppercase">Host Controls</h3>
                                <p className="text-gray-600 text-sm mt-2 max-w-xs">Only the squad leader can input match data.</p>
                            </div>
                        )}

                        {/* RIGHT: History List */}
                        <div className="flex-1 bg-black/20 overflow-y-auto p-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 sticky top-0 bg-gray-900/95 py-2 backdrop-blur z-10">Match History</h3>
                            <div className="space-y-3">
                                {results.length === 0 ? (
                                    <div className="text-center py-20 opacity-30">
                                        <p className="text-sm">No matches recorded yet.</p>
                                    </div>
                                ) : (
                                    results.map((res, idx) => (
                                        <div key={res.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
                                             <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-3">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center font-black text-xl text-gray-500">
                                                         #{results.length - idx}
                                                     </div>
                                                     <div>
                                                         <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mb-1 ${
                                                            res.teamPlacement === 1 ? 'bg-yellow-500 text-black' : 
                                                            res.teamPlacement <= 5 ? 'bg-blue-900 text-blue-200' : 'bg-gray-700 text-gray-400'
                                                         }`}>
                                                            #{res.teamPlacement} Place
                                                         </div>
                                                         <div className="text-[10px] text-gray-500">
                                                             {new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div className={`text-xl font-black ${res.totalSquadRP >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                     {res.totalSquadRP > 0 ? '+' : ''}{res.totalSquadRP} <span className="text-[10px] text-gray-500 font-medium">SQUAD RP</span>
                                                 </div>
                                             </div>
                                             
                                             <div className="grid grid-cols-1 gap-2 mt-2">
                                                 {Object.entries(res.details).map(([pid, detail]) => {
                                                     const pName = players.find(p => p.id === pid)?.name || 'Unknown';
                                                     const rankStyle = getRankColor(detail.tier);
                                                     
                                                     return (
                                                         <div key={pid} className={`p-2 rounded-lg flex justify-between items-center text-xs border bg-opacity-10 ${rankStyle}`}>
                                                              <div className="flex flex-col min-w-0">
                                                                  <span className="font-bold truncate pr-2">{pName}</span>
                                                                  <div className="flex items-center gap-2 opacity-70 text-[10px]">
                                                                    <span className="uppercase font-black">{detail.tier}</span>
                                                                    <span>•</span>
                                                                    <span className="font-mono">{detail.kills}/{detail.assists}/{detail.participation}</span>
                                                                  </div>
                                                              </div>
                                                              <div className={`font-black font-mono ${detail.rp >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                  {detail.rp > 0 ? '+' : ''}{detail.rp}
                                                              </div>
                                                         </div>
                                                     );
                                                 })}
                                             </div>

                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            </AnimatePresence>,
            document.body
        )}
        </>
    );
};