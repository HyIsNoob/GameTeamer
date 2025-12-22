import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GAMES, GamePreset } from './constants';
import { shuffleArray, distributeBalanced } from './utils/teamLogic';
import PlayerList from './components/PlayerList';
import TeamDisplay from './components/TeamDisplay';
import GameSelector from './components/GameSelector';

interface TeamResult {
  id: number;
  members: string[];
}

const App: React.FC = () => {
  // --- State ---
  const [players, setPlayers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Initialize from localStorage or default to first game
  const [selectedGame, setSelectedGame] = useState<GamePreset>(() => {
    const savedId = localStorage.getItem('squadAssembler_gameId');
    return GAMES.find(g => g.id === savedId) || GAMES[0];
  });

  // Initialize maxPerTeam based on the (potentially loaded) selectedGame
  const [maxPerTeam, setMaxPerTeam] = useState<number>(selectedGame.teamSize);
  
  const [generatedTeams, setGeneratedTeams] = useState<TeamResult[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    setMaxPerTeam(selectedGame.teamSize);
    localStorage.setItem('squadAssembler_gameId', selectedGame.id);
  }, [selectedGame]);

  // --- Handlers ---

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    
    // Regex for splitting: space, comma, newline, or pipe
    const SEPARATOR_REGEX = /[\s,\n|]+/;

    if (trimmed) {
      // Split input by regex, filter empty strings, and remove duplicates within the new batch
      const newPlayersRaw = trimmed
        .split(SEPARATOR_REGEX)
        .filter(name => name.trim().length > 0);
      
      // Filter out names that are already in the list to ensure uniqueness for Drag and Drop
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
        
        // Show success indicator on button
        setShowAddSuccess(true);
        setTimeout(() => setShowAddSuccess(false), 1500);

        // Force focus back to input to allow rapid entry
        // Use requestAnimationFrame to ensure it runs after render
        requestAnimationFrame(() => {
           inputRef.current?.focus();
        });
      } else if (newPlayersRaw.length > 0) {
        // Handle case where names existed but were duplicates
        alert("Player(s) already in the list.");
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

    // Countdown Logic
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        // Finalize generation
        const shuffled = shuffleArray([...players]);
        const chunks = distributeBalanced(shuffled, maxPerTeam);
        
        const results: TeamResult[] = chunks.map((members, idx) => ({
          id: idx + 1,
          members
        }));

        setGeneratedTeams(results);
        setIsGenerating(false);
      }
    }, 600); // 600ms per number for a snappy 1.8s total wait
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-gray-50 text-gray-900 font-medium">
      
      {/* Header */}
      <header className="w-full max-w-5xl mb-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Squad<span className="text-indigo-600">Assembler</span>
          </h1>
          <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-widest">
            Balanced Team Generator
          </p>
        </div>
        <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-xs font-bold text-gray-500">SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Game Selection */}
          <section className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Game</h2>
            <GameSelector 
              selected={selectedGame} 
              onSelect={setSelectedGame} 
            />
          </section>

          {/* Configuration */}
          <section className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Players Per Team</label>
                <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-xl text-indigo-600 font-extrabold text-lg">
                  {maxPerTeam}
                </div>
             </div>
             <input 
               type="range" 
               min="1" 
               max="10" 
               value={maxPerTeam}
               onChange={(e) => setMaxPerTeam(parseInt(e.target.value))}
               className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
             />
             <div className="flex justify-between text-[10px] text-gray-400 mt-3 font-bold">
                <span>1</span>
                <span>5</span>
                <span>10</span>
             </div>
          </section>

          {/* Player Input */}
          <section className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Add Players</h2>
               {players.length > 0 && (
                 <button 
                  onClick={handleClearPlayers}
                  className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                 >
                   CLEAR ALL
                 </button>
               )}
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
                placeholder="Ex: Hy Khánh Đạt"
                className="flex-1 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-gray-900 placeholder-gray-400 focus:outline-none font-bold transition-all"
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
                      xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
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
              <span className="text-xs font-bold text-gray-400 uppercase">Total Players</span>
              <span className="text-sm font-extrabold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{players.length}</span>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-7 flex flex-col h-full">
           
           <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 relative overflow-hidden flex flex-col">
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Teams Overview
                </h2>
                {generatedTeams && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {generatedTeams.length} TEAMS GENERATED
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isGenerating ? (
                   <motion.div 
                     key="loading"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0, scale: 2, filter: "blur(10px)" }}
                     className="flex-1 flex flex-col items-center justify-center space-y-8 min-h-[300px]"
                   >
                     {/* Countdown Animation */}
                     <div className="relative flex items-center justify-center">
                        <motion.div 
                           animate={{ rotate: 360 }}
                           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                           className="w-32 h-32 rounded-full border-4 border-gray-100 border-t-indigo-600"
                        />
                        <AnimatePresence mode="wait">
                           <motion.span 
                              key={countdown}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 1.5, opacity: 0 }}
                              className="absolute text-5xl font-black text-gray-900"
                           >
                              {countdown}
                           </motion.span>
                        </AnimatePresence>
                     </div>
                     
                     <p className="animate-pulse text-indigo-600 font-extrabold text-sm tracking-[0.2em] uppercase">
                       Drafting Agents...
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
                    className="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-4 min-h-[300px]"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-gray-50 border-4 border-dashed border-gray-200 flex items-center justify-center">
                       <span className="text-4xl font-black text-gray-200">?</span>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest">Ready to Assemble</p>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* BIG ACTION BUTTON AND ERROR MESSAGE */}
           <div className="relative mt-6">
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
                   w-full py-5 rounded-2xl text-lg font-black tracking-wide uppercase transition-all transform active:scale-[0.99] overflow-hidden relative
                   ${isGenerating || players.length < 2
                     ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                     : 'bg-gray-900 text-white shadow-xl shadow-gray-900/20 hover:bg-black hover:shadow-2xl'
                   }
                 `}
               >
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
                      >
                         {generatedTeams ? 'Reroll Teams' : 'Generate Teams'}
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

export default App;