import React, { useState, useEffect } from 'react';
import { TournamentTeam } from '../../utils/tournamentTypes';
import { soundManager } from '../../utils/soundManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Swords, Shield, Trophy } from 'lucide-react';

interface CoinFlipModalProps {
  isOpen: boolean;
  winnerTeam: TournamentTeam;
  isHost?: boolean;
  onComplete: () => void;
}

export const CoinFlipModal: React.FC<CoinFlipModalProps> = ({
  isOpen,
  winnerTeam,
  isHost = true,
  onComplete
}) => {
  const [isFlipping, setIsFlipping] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsFlipping(true);
      setRevealed(false);
      soundManager.playCoinToss();

      const timer = setTimeout(() => {
        setIsFlipping(false);
        setRevealed(true);
        soundManager.playLockIn();
      }, 2400);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAlphaWinner = winnerTeam === 'ALPHA';
  const otherTeam = isAlphaWinner ? 'OMEGA' : 'ALPHA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="w-full max-w-md bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-neutral-800 rounded-3xl p-8 text-center shadow-2xl space-y-6 overflow-hidden relative"
      >
        {/* Glow ambient background */}
        <div
          className={`absolute inset-0 opacity-20 pointer-events-none transition-all duration-700 ${
            revealed
              ? isAlphaWinner
                ? 'bg-sky-500'
                : 'bg-rose-500'
              : 'bg-amber-500'
          }`}
        />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-amber-400">
              Tung Đồng Xu Phân Định Lượt Đi
            </span>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black uppercase text-white tracking-tight">
            Quyết Định Lợi Thế Lượt Chọn / Cấm
          </h2>
        </div>

        {/* 3D Animated Coin */}
        <div className="relative z-10 py-6 flex items-center justify-center perspective-[1000px]">
          <motion.div
            animate={
              isFlipping
                ? {
                    rotateY: [0, 1800],
                    scale: [1, 1.25, 1],
                    y: [0, -50, 0]
                  }
                : {
                    rotateY: isAlphaWinner ? 0 : 180,
                    scale: 1,
                    y: 0
                  }
            }
            transition={{
              duration: 2.4,
              ease: 'easeInOut'
            }}
            className="w-36 h-36 rounded-full relative transform-style-3d cursor-default shadow-2xl flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front: Alpha (Cyan / Sky) */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-600 via-sky-400 to-blue-700 border-4 border-sky-300 shadow-[0_0_35px_rgba(56,189,248,0.6)] flex flex-col items-center justify-center backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Shield className="w-12 h-12 text-white drop-shadow-md" />
              <span className="text-sm font-black uppercase tracking-widest text-white mt-1">
                ALPHA
              </span>
            </div>

            {/* Back: Omega (Rose / Red) */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-orange-600 border-4 border-rose-300 shadow-[0_0_35px_rgba(244,63,94,0.6)] flex flex-col items-center justify-center backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <Swords className="w-12 h-12 text-white drop-shadow-md" />
              <span className="text-sm font-black uppercase tracking-widest text-white mt-1">
                OMEGA
              </span>
            </div>
          </motion.div>
        </div>

        {/* Toss Result Banner */}
        <div className="relative z-10 min-h-[90px] flex flex-col items-center justify-center">
          {revealed ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div
                className={`text-xl font-black uppercase tracking-tight ${
                  isAlphaWinner ? 'text-sky-400' : 'text-rose-400'
                }`}
              >
                Team {winnerTeam} Thắng Tung Xu!
              </div>

              {/* Tournament Fairness rule banner */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800 text-xs font-mono space-y-1.5 shadow-inner">
                <div className="text-[10px] text-amber-400 uppercase font-black tracking-wider flex items-center justify-center gap-1">
                  <span>⚖️ Quy Tắc Cân Bằng Giải Đấu:</span>
                </div>
                <div className="text-white font-bold">
                  🗺️ Team <span className={isAlphaWinner ? 'text-sky-400' : 'text-rose-400'}>{winnerTeam}</span> sẽ cấm Map TRƯỚC.
                </div>
                <div className="text-neutral-300 font-bold">
                  ⚔️ Team <span className={isAlphaWinner ? 'text-rose-400' : 'text-sky-400'}>{otherTeam}</span> sẽ cấm Tướng TRƯỚC.
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 animate-pulse">
              Đồng xu đang xoay trên không...
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="relative z-10 pt-2">
          {revealed && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onComplete}
              className={`w-full py-3.5 rounded-2xl text-black font-black uppercase text-xs tracking-wider shadow-xl transition-all ${
                isAlphaWinner
                  ? 'bg-sky-400 hover:bg-sky-300 shadow-sky-950/50'
                  : 'bg-rose-500 hover:bg-rose-400 shadow-rose-950/50'
              }`}
            >
              {isHost ? 'Bắt Đầu Giai Đoạn Ban / Pick →' : 'Đang Đợi Bắt Đầu (Hoặc Bấm Vào Đây) →'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
