import React, { useState, useEffect } from 'react';
import { Settings, Map, RefreshCw, Key } from 'lucide-react';

interface MapWidgetProps {
   className?: string;
}

interface MapData {
   current: {
     map: string;
     remainingTimer: string;
     asset: string; // URL to image
   };
   next: {
     map: string;
   };
}

export const MapWidget: React.FC<MapWidgetProps> = ({ className }) => {
   const [apiKey, setApiKey] = useState(() => localStorage.getItem('apex_api_key') || '');
   const [loading, setLoading] = useState(false);
   const [data, setData] = useState<MapData | null>(null);
   const [showConfig, setShowConfig] = useState(false);
   const [error, setError] = useState('');

   const fetchMap = async () => {
       if (!apiKey) return;
       setLoading(true);
       setError('');
       try {
           const res = await fetch(`https://api.mozambiquehe.re/maprotation?version=2&auth=${apiKey}`);
           if (!res.ok) throw new Error('Failed to fetch. Check API Key.');
           const json = await res.json();
           
           // Extract Battle Royale Pubs or Ranked
           const br = json.battle_royale; // 'battle_royale' usually contains pubs
           if (br && br.current) {
               setData({
                   current: {
                       map: br.current.map,
                       remainingTimer: br.current.remainingTimer,
                       asset: br.current.asset
                   },
                   next: {
                       map: br.next.map
                   }
               });
           }
       } catch (err) {
           setError('Invalid Key or Network Error');
           console.error(err);
       } finally {
           setLoading(false);
       }
   };

   useEffect(() => {
       if (apiKey) fetchMap();
   }, []); // Init

   const handleSaveKey = () => {
       localStorage.setItem('apex_api_key', apiKey);
       setShowConfig(false);
       fetchMap();
   };

   if (!apiKey || showConfig) {
       return (
           <div className={`bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg ${className}`}>
               <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-white text-xs flex items-center gap-2"><Key size={14}/> API Configuration</h3>
                   {data && <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-white">✕</button>}
               </div>
               <p className="text-[10px] text-gray-400 mb-2">
                   Get free key at <a href="https://portal.apexlegendsapi.com/" target="_blank" className="text-blue-400 underline">apexlegendsapi.com</a>
               </p>
               <input 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste API Key here..."
                  className="w-full bg-black/50 border border-gray-600 rounded px-2 py-1 text-xs text-white mb-2"
               />
               <button onClick={handleSaveKey} className="w-full bg-blue-600 text-white text-xs font-bold py-1 rounded">
                   Save & Sync
               </button>
           </div>
       );
   }

   return (
       <div className={`bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg relative group ${className}`}>
            {/* Background Image */}
            {data?.current.asset && (
                <div className="absolute inset-0">
                    <img src={data.current.asset} className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                </div>
            )}
            
            <div className="relative z-10 p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-yellow-500 rounded-lg text-black">
                            <Map size={16} />
                         </div>
                         <div>
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Current Map</h3>
                            {loading ? (
                                <span className="text-lg font-black text-white italic">Loading...</span>
                            ) : (
                                <span className="text-lg font-black text-white italic uppercase tracking-tighter">{data?.current.map || 'Unknown'}</span>
                            )}
                         </div>
                    </div>
                     <button onClick={() => setShowConfig(true)} className="text-gray-500 hover:text-white p-1 bg-black/50 rounded-full backdrop-blur">
                        <Settings size={12} />
                    </button>
                </div>

                {!loading && data && (
                    <div className="mt-4 flex items-center justify-between">
                         <div className="flex flex-col">
                             <span className="text-[10px] text-gray-400 uppercase">Time Remaining</span>
                             <span className="text-sm font-mono font-bold text-yellow-400">{data.current.remainingTimer}</span>
                         </div>
                         <div className="text-right">
                             <span className="text-[10px] text-gray-400 uppercase">Next Map</span>
                             <p className="text-xs font-bold text-white">{data.next.map}</p>
                         </div>
                    </div>
                )}
                
                {error && (
                    <div className="mt-2 text-[10px] text-red-500 bg-red-900/20 p-1 rounded border border-red-900/50">
                        {error}
                    </div>
                )}
            </div>
       </div>
   );
};