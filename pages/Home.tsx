import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Crosshair, Hexagon } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans overflow-hidden relative selection:bg-red-500 selection:text-white">
      {/* Background Video/Image Placeholder - using CSS gradient for now */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black z-0" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 z-0 opacity-10" 
         style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      </div>

      <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col items-center justify-center">
        
        {/* Header Title */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Hexagon className="text-red-500 w-8 h-8 fill-current animate-pulse" />
            <span className="text-red-500 font-bold tracking-[0.3em] uppercase text-sm">Game Teamer</span>
            <Hexagon className="text-red-500 w-8 h-8 fill-current animate-pulse" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter not-italic text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg">
            CHOOSE YOUR <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">PATH</span>
          </h1>
        </motion.div>

        {/* Selection Cards - Animated */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, staggerChildren: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl"
        >
          
          {/* Option 1: Apex Online */}
          <Link to="/apex" className="group">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-96 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-red-500 transition-colors duration-300 rounded-3xl overflow-hidden flex flex-col items-center justify-center group-hover:shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black/80 z-0" />
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                <Crosshair className="w-24 h-24 text-red-500 rotate-12" />
              </div>
              
              <div className="z-10 text-center p-8">
                <div className="w-20 h-20 bg-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                  <Crosshair className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Apex Roulette</h2>
                <p className="text-gray-400 font-medium max-w-xs mx-auto mb-8">
                  Randomize Legends and Weapons. Realtime sync with your squad. Synchronized global reroll.
                </p>
                <div className="inline-flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-sm group-hover:text-red-300">
                  Deploy Now <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Option 2: Random Team */}
          <Link to="/squads" className="group">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-96 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500 transition-colors duration-300 rounded-3xl overflow-hidden flex flex-col items-center justify-center group-hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black/80 z-0" />
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                <Users className="w-24 h-24 text-blue-500 -rotate-12" />
              </div>
              
              <div className="z-10 text-center p-8">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform group-hover:-rotate-6 transition-transform duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Squad Assembler</h2>
                <p className="text-gray-400 font-medium max-w-xs mx-auto mb-8">
                  Randomly assign teams from a list of names. Supports various squad sizes and configurations.
                </p>
                <div className="inline-flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-sm group-hover:text-blue-300">
                  Assemble Now <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </motion.div>
          </Link>

        </motion.div>
        
      </div>
    </div>
  );
};

export default LandingPage;
