import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Crosshair, Hexagon, Sparkles, Swords, Trophy } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans overflow-x-hidden relative selection:bg-red-500 selection:text-white flex flex-col justify-center">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 z-0 pointer-events-none mix-blend-overlay" />
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        {/* Header Title */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Hexagon className="text-red-500 w-6 h-6 fill-current animate-pulse" />
            <span className="text-red-500 font-black tracking-[0.3em] uppercase text-xs">Game Teamer</span>
            <Hexagon className="text-red-500 w-6 h-6 fill-current animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-400 drop-shadow-xl">
            CHOOSE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-500">
              TACTICAL PATH
            </span>
          </h1>
        </motion.div>

        {/* Selection Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl"
        >
          {/* Option 1: Apex Online */}
          <Link to="/apex" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-96 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 hover:border-red-500/80 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col items-center justify-between p-7 group-hover:shadow-[0_0_50px_-10px_rgba(239,68,68,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-transparent to-neutral-950 pointer-events-none" />
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                <Crosshair className="w-24 h-24 text-red-500 rotate-12" />
              </div>

              <div className="z-10 text-center w-full">
                <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-orange-600 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-red-900/40 transform group-hover:rotate-6 transition-transform duration-300">
                  <Crosshair className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-3">Apex Roulette</h2>
                <p className="text-neutral-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                  Randomize Legends and Weapons with seasonal Care Package filtering & online squad synchronization.
                </p>
              </div>

              <div className="z-10 inline-flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-xs group-hover:text-red-300">
                Deploy Squad <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.div>
          </Link>

          {/* Option 2: VALORANT Agent Roulette */}
          <Link to="/valorant" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-96 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 hover:border-rose-500/80 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col items-center justify-between p-7 group-hover:shadow-[0_0_50px_-10px_rgba(244,63,94,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-950/30 via-transparent to-neutral-950 pointer-events-none" />
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                <Sparkles className="w-24 h-24 text-rose-500 rotate-12" />
              </div>

              <div className="z-10 text-center w-full">
                <div className="w-16 h-16 bg-gradient-to-tr from-rose-600 to-red-600 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-rose-900/40 transform group-hover:rotate-6 transition-transform duration-300">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-3">Agent Roulette</h2>
                <p className="text-neutral-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                  1-5 Player online lobby roulette. Randomly assigns unique official Agents at the start of your match.
                </p>
              </div>

              <div className="z-10 inline-flex items-center gap-2 text-rose-400 font-bold uppercase tracking-widest text-xs group-hover:text-rose-300">
                Lock In Agents <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.div>
          </Link>

          {/* Option 3: VALORANT 5v5 Custom Match & Veto */}
          <Link to="/tournament" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-96 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 hover:border-amber-500/80 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col items-center justify-between p-7 group-hover:shadow-[0_0_50px_-10px_rgba(245,158,11,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-transparent to-neutral-950 pointer-events-none" />
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                <Swords className="w-24 h-24 text-amber-500 rotate-12" />
              </div>

              <div className="z-10 text-center w-full">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-amber-900/40 transform group-hover:rotate-6 transition-transform duration-300">
                  <Swords className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-3">5v5 Tournament</h2>
                <p className="text-neutral-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                  10-Player scrim lobby. Map veto (BO1/BO3/BO5), Captain agent bans, and team roster staging.
                </p>
              </div>

              <div className="z-10 inline-flex items-center gap-2 text-amber-400 font-bold uppercase tracking-widest text-xs group-hover:text-amber-300">
                Start Tournament <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.div>
          </Link>

          {/* Option 4: Squad Assembler */}
          <Link to="/squads" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-96 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 hover:border-blue-500/80 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col items-center justify-between p-7 group-hover:shadow-[0_0_50px_-10px_rgba(59,130,246,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-neutral-950 pointer-events-none" />
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                <Users className="w-24 h-24 text-blue-500 -rotate-12" />
              </div>

              <div className="z-10 text-center w-full">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-600 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-blue-900/40 transform group-hover:-rotate-6 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-3">Squad Assembler</h2>
                <p className="text-neutral-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                  Quickly generate balanced random teams from a list of player names. Supports 2v2, 3v3, 5v5, and more.
                </p>
              </div>

              <div className="z-10 inline-flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs group-hover:text-blue-300">
                Assemble Teams <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
