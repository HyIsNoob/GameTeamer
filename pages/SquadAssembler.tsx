import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GAMES, GamePreset } from '../constants';
import { shuffleArray, distributeBalanced, distributeIntoCount } from '../utils/teamLogic';
import PlayerList from '../components/PlayerList';
import TeamDisplay from '../components/TeamDisplay';
import GameSelector from '../components/GameSelector';

interface TeamResult {
  id: number;
  members: string[];
}

type GenerationMode = 'MAX_SIZE' | 'FIXED_COUNT';

const SEPARATORS = {
  AUTO: { label: 'Auto (Spaces, Commas)', regex: /[\s,\n|]+/ },
  NEWLINE: { label: 'New Lines Only', regex: /[\n]+/ },
  COMMA: { label: 'Commas Only', regex: /[,]+/ },
  CUSTOM: { label: 'Custom Regex', regex: null }, // Handled dynamically
};

const SquadAssembler: React.FC = () => {
  // --- State ---
  const [players, setPlayers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Initialize from localStorage or default to first game
  const [selectedGame, setSelectedGame] = useState<GamePreset>(() => {
    const savedId = localStorage.getItem('squadAssembler_gameId');
    return GAMES.find(g => g.id === savedId) || GAMES[0];
  });

  // Configuration State
  const [generationMode, setGenerationMode] = useState<GenerationMode>('MAX_SIZE');
  const [maxPerTeam, setMaxPerTeam] = useState<number>(selectedGame.teamSize);
  const [fixedTeamCount, setFixedTeamCount] = useState<number>(2);
  
  // Input Handling State
  const [separatorKey, setSeparatorKey] = useState<keyof typeof SEPARATORS>('AUTO');
  const [customRegexStr, setCustomRegexStr] = useState<string>(';');
  
  const [generatedTeams, setGeneratedTeams] = useState<TeamResult[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    // When game changes, default to its max team size, but don't override mode immediately unless it makes sense
    setMaxPerTeam(selectedGame.teamSize);
    localStorage.setItem('squadAssembler_gameId', selectedGame.id);
  }, [selectedGame]);

  // --- Handlers ---

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    
    if (trimmed) {
      let regex: RegExp;

      if (separatorKey === 'CUSTOM') {
        try {
          // Create regex from string, default to comma if empty to prevent crash
          regex = new RegExp(customRegexStr || ',', 'g');
        } catch (err) {
          setError("Invalid Custom Regex");
          setTimeout(() => setError(null), 2000);
          return;
        }
      } else {
        regex = SEPARATORS[separatorKey].regex!;
      }

      const newPlayersRaw = trimmed
        .split(regex)
        .filter(name => name.trim().length > 0);
      
      const uniqueNewPlayers = newPlayersRaw.filter(
        (name, index, self) => 
          self.indexOf(name) === index && !players.includes(name)
      );

      if (uniqueNewPlayers.length > 0) {
        setPlayers(prev => {
          const updated = [...prev, ...uniqueNewPlayers];
          if (updated.length >= 2) setError(null);
          return updated;
        });
        setInputValue('');
        
        setShowAddSuccess(true);
        setTimeout(() => setShowAddSuccess(false), 1500);

        requestAnimationFrame(() => {
           inputRef.current?.focus();
        });
      } else if (newPlayersRaw.length > 0) {
        setError("Player(s) already in the list or invalid format.");
        setTimeout(() => setError(null), 2000);
      }
    }
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearPlayers = () => {
    if (window.confirm('Clear all players?')) {
      setPlayers([]);
      setGeneratedTeams(null);
      setError(null);
    }
  };

  const handleGenerateTeams = () => {
    if (players.length < 2) {
      setError("Deploy at least 2 operatives to initiate squad formation.");
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    setGeneratedTeams(null);
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        
        // --- Core Logic ---
        const shuffled = shuffleArray([...players]);
        let chunks: string[][] = [];

        if (generationMode === 'MAX_SIZE') {
          chunks = distributeBalanced(shuffled, maxPerTeam);
        } else {
          // If fixed count is greater than players, cap it
          const actualTeamCount = Math.min(fixedTeamCount, players.length);
          chunks = distributeIntoCount(shuffled, actualTeamCount);
        }
        
        const results: TeamResult[] = chunks.map((members, idx) => ({
          id: idx + 1,
          members
        }));

        setGeneratedTeams(results);
        setIsGenerating(false);
      }
    }, 600); // 600ms per tick
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-gray-50 text-gray-900 font-medium">
      
      {/* Header */}
      <header className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Squad<span className="text-indigo-600">Assembler</span>
          </h1>
          <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-widest">
            Tactical Team Generator
          </p>
        </div>
        <div className="flex gap-4">
            <Link to="/apex" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm shadow-red-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all">
                <span>Apex Legends Online</span>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </Link>
            <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-xs font-bold text-gray-500">SYSTEM ONLINE</span>
            </div>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Game Selection */}
          <section className="bg-white p-5 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Game</h2>
            <GameSelector 
              selected={selectedGame} 
              onSelect={setSelectedGame} 
            />
          </section>

          {/* Configuration */}
          <section className="bg-white p-5 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
             <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
               {(['MAX_SIZE', 'FIXED_COUNT'] as const).map(mode => (
                 <button
                   key={mode}
                   onClick={() => setGenerationMode(mode)}
                   className={`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-wide rounded-lg transition-all ${
                     generationMode === mode 
                       ? 'bg-white text-indigo-600 shadow-sm' 
                       : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   {mode === 'MAX_SIZE' ? 'Limit per Team' : 'Exact Team Count'}
                 </button>
               ))}
             </div>

             {generationMode === 'MAX_SIZE' ? (
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Players per Team</label>
                    <input 
                      type="number"
                      min="1"
                      max="20"
                      value={maxPerTeam}
                      onChange={(e) => setMaxPerTeam(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-10 text-center bg-indigo-50 rounded-xl text-indigo-600 font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                 </div>
                 <input 
                   type="range" 
                   min="1" 
                   max="10" 
                   value={maxPerTeam}
                   onChange={(e) => setMaxPerTeam(parseInt(e.target.value))}
                   className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
                 />
                 <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>1</span>
                    <span>10</span>
                 </div>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Number of Teams</label>
                    <input 
                      type="number"
                      min="2"
                      max="50"
                      value={fixedTeamCount}
                      onChange={(e) => setFixedTeamCount(Math.max(2, parseInt(e.target.value) || 2))}
                      className="w-16 h-10 text-center bg-indigo-50 rounded-xl text-indigo-600 font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                 </div>
                 <input 
                   type="range" 
                   min="2" 
                   max="20" 
                   value={fixedTeamCount}
                   onChange={(e) => setFixedTeamCount(parseInt(e.target.value))}
                   className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
                 />
                 <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>2</span>
                    <span>20</span>
                 </div>
               </div>
             )}
          </section>

          {/* Player Input */}
          <section className="bg-white p-5 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="flex flex-col gap-3 mb-4">
               <div className="flex justify-between items-center">
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Roster</h2>
                 {players.length > 0 && (
                   <button 
                    onClick={handleClearPlayers}
                    className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors"
                   >
                     CLEAR
                   </button>
                 )}
               </div>

               {/* Separator Controls */}
               <div className="flex gap-2 items-center">
                 <select 
                   value={separatorKey}
                   onChange={(e) => setSeparatorKey(e.target.value as keyof typeof SEPARATORS)}
                   className="flex-1 text-[10px] font-bold text-gray-500 bg-gray-50 border-none rounded-lg px-2 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
                 >
                   {Object.entries(SEPARATORS).map(([key, val]) => (
                     <option key={key} value={key}>{val.label}</option>
                   ))}
                 </select>
                 
                 {separatorKey === 'CUSTOM' && (
                    <input 
                      type="text"
                      value={customRegexStr}
                      onChange={(e) => setCustomRegexStr(e.target.value)}
                      placeholder="Regex..."
                      className="w-24 text-[10px] font-mono bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                 )}
               </div>
            </div>
            
            <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (showAddSuccess) setShowAddSuccess(false);
                  if (error) setError(null);
                }}
                placeholder={separatorKey === 'CUSTOM' ? "Enter names using your regex..." : "Enter names..."}
                className="flex-1 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-gray-900 placeholder-gray-400 focus:outline-none font-bold transition-all text-sm"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() && !showAddSuccess}
                className={`
                  w-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all shadow-lg
                  ${showAddSuccess 
                    ? 'bg-green-500 text-white shadow-green-200 scale-105' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }
                `}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {showAddSuccess ? (
                    <motion.svg 
                      key="check"
                      initial={{ scale: 0, rotate: -45 }} 
                      animate={{ scale: 1, rotate: 0 }} 
                      exit={{ scale: 0 }}
                      xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </motion.svg>
                  ) : (
                    <motion.span
                      key="plus"
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      exit={{ scale: 0 }}
                    >
                      +
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </form>

            <PlayerList 
              players={players} 
              onRemove={handleRemovePlayer} 
              onReorder={setPlayers}
            />
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">Active Agents</span>
              <span className="text-sm font-extrabold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{players.length}</span>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-7 flex flex-col h-full">
           
           <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 relative overflow-hidden flex flex-col min-h-[400px]">
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6 z-10 relative">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Teams Overview
                </h2>
                {generatedTeams && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {generatedTeams.length} SQUADS
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isGenerating ? (
                   <motion.div 
                     key="loading"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                     className="flex-1 flex flex-col items-center justify-center space-y-8 z-10"
                   >
                     {/* Enhanced Countdown Animation */}
                     <div className="relative flex items-center justify-center">
                        <motion.div 
                           animate={{ rotate: 360 }}
                           transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                           className="w-40 h-40 rounded-full border-[6px] border-gray-100 border-t-indigo-500 border-r-indigo-400"
                        />
                        <motion.div 
                           animate={{ rotate: -180 }}
                           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                           className="absolute w-32 h-32 rounded-full border-[4px] border-transparent border-b-cyan-400 opacity-50"
                        />
                        <AnimatePresence mode="wait">
                           <motion.span 
                              key={countdown}
                              initial={{ scale: 0.5, opacity: 0, y: 10 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 1.5, opacity: 0, y: -10 }}
                              className="absolute text-6xl font-black text-gray-900"
                           >
                              {countdown}
                           </motion.span>
                        </AnimatePresence>
                     </div>
                     
                     <p className="animate-pulse text-indigo-600 font-extrabold text-sm tracking-[0.2em] uppercase">
                       Calculating Optimal Synergy...
                     </p>
                   </motion.div>
                ) : generatedTeams ? (
                  <TeamDisplay teams={generatedTeams} gameColor={selectedGame.color} />
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-4 z-10"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-gray-50 border-4 border-dashed border-gray-200 flex items-center justify-center">
                       <span className="text-4xl font-black text-gray-200">?</span>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest">Awaiting Command</p>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* BIG ACTION BUTTON AND ERROR MESSAGE */}
           <div className="relative mt-6 pb-6 lg:pb-0">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute bottom-full mb-3 w-full bg-red-500 text-white text-sm font-bold p-3 rounded-xl text-center shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

               <button
                 onClick={handleGenerateTeams}
                 disabled={isGenerating || players.length < 2}
                 className={`
                   w-full py-5 rounded-2xl text-lg font-black tracking-wide uppercase transition-all transform active:scale-[0.99] overflow-hidden relative group
                   ${isGenerating || players.length < 2
                     ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                     : 'bg-gray-900 text-white shadow-xl shadow-gray-900/20 hover:bg-black hover:shadow-2xl'
                   }
                 `}
               >
                 {/* Decorative background swirl for button */}
                 {!isGenerating && players.length >= 2 && (
                   <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 translate-x-[-150%]"
                      animate={{ translateX: ['-150%', '150%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 3 }}
                   />
                 )}

                 <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div
                        key="generating"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-center gap-3"
                      >
                         <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         <span>INITIALIZING...</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="text"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative z-10"
                      >
                         {generatedTeams ? 'REROLL SQUADS' : 'GENERATE SQUADS'}
                      </motion.span>
                    )}
                 </AnimatePresence>
               </button>
           </div>

        </div>
      </main>
    </div>
  );
};

export default SquadAssembler;
