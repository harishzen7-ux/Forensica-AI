import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Calendar, Clock, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { Page, SystemStats, HistoryItem } from '../types';

interface HomeViewProps {
  onNavigate: (page: Page) => void;
  stats: SystemStats | null;
  history: HistoryItem[];
  onClearHistory: () => void;
}

export function HomeView({ onNavigate, stats, history, onClearHistory }: HomeViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [localHistory, setLocalHistory] = useState(history);
  const [localStats, setLocalStats] = useState(stats);

  React.useEffect(() => {
    setLocalHistory(history);
  }, [history]);

  React.useEffect(() => {
    setLocalStats(stats);
  }, [stats]);

  const handleClearHistory = () => {
    onClearHistory();
    setLocalHistory([]);
    if (localStats) {
      setLocalStats({ ...localStats, totalAttempts: 0 });
    }
  };

  return (
    <motion.div 
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative px-4 sm:px-0"
    >
      <div className="space-y-8 text-center lg:text-left flex flex-col justify-start">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight font-display">
            <span>Hi, Welcome to</span> <span className="bg-gradient-to-br from-accent via-accent to-accent/50 bg-clip-text text-transparent">Forensica AI</span>
          </h1>
        </div>

        <div className="flex flex-col items-center lg:items-start gap-6">
          <motion.button 
            onClick={() => onNavigate('selection')}
            whileHover={{ 
              boxShadow: "0 0 30px var(--accent-glow)",
            }}
            className="relative group cursor-pointer"
          >
            {/* Background with corner brackets */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--home-tile-from)] to-[var(--home-tile-to)] rounded-lg backdrop-blur-sm border border-[var(--home-tile-border)] transition-all duration-300 group-hover:bg-none group-hover:bg-[var(--tile-hover-bg)] group-hover:border-[var(--tile-hover-bg)] light:light-home-tile" />
            
           
            
            <div className="relative px-8 py-4 flex items-center justify-between gap-4">
              <span className="text-lg font-oxanium font-bold text-accent group-hover:text-[var(--tile-hover-text)] transition-colors">Get Started</span>
              <motion.div 
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-1 h-6 bg-gradient-to-b from-accent to-transparent rounded-full"
              />
            </div>
          </motion.button>
          
          <div className="pt-2">
            <button 
              onClick={() => onNavigate('specs')}
              className="group flex flex-col items-center lg:items-start gap-1 text-text-muted hover:text-text-main active:text-accent active:scale-95 transition-all duration-200"
            >
              <span className="text-xs sm:text-sm uppercase tracking-widest font-semibold font-oxanium">SEE WHAT FORENSICA AI CAN DO?</span>
              <div className="h-px w-0 group-hover:w-full bg-text-main group-active:bg-accent transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-6 pt-10">
        {localStats && (
          <div className="space-y-6 pt-65">
            {/* Historical Data Tile - Minimalist Futuristic */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowHistory(true)}
              whileHover={{ 
                boxShadow: "0 0 30px var(--accent-glow)",
              }}
              className="relative group cursor-pointer"
            >
              {/* Minimalist border with corner accents */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--home-tile-from)] to-[var(--home-tile-to)] rounded-lg backdrop-blur-sm border border-[var(--home-tile-analyzed-border)] transition-all duration-300 group-hover:bg-none group-hover:bg-[var(--tile-hover-bg)] group-hover:border-[var(--tile-hover-bg)] light:light-home-tile" />
              
              
              <div className="relative p-5 flex items-end justify-between">
                <div className="space-y-2">
                  <span className="text-lg font-oxanium font-bold text-accent group-hover:text-[var(--tile-hover-text)] transition-colors">Analyzed</span>
      
                  <p className="text-5xl font-display text-accent font-bold group-hover:text-[var(--tile-hover-text)] transition-colors">{localStats?.totalAttempts.toLocaleString() ?? 0}</p>
                </div>
                <motion.div 
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-1 h-12 bg-gradient-to-b from-accent to-transparent rounded-full"
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[80vh] bg-white/10 rounded-xl overflow-hidden flex flex-col backdrop-blur-md border border-white/20"
            >
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-white/60 pointer-events-none" />
              <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-white/60 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-3 h-3 border-b border-l border-white/60 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-white/60 pointer-events-none" />

              <div className="p-4 sm:p-6 border-b border-white/20 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white uppercase tracking-wide">ANALYSIS_ARCHIVE</h2>
                  <p className="text-[8px] text-white/60 uppercase tracking-[0.3em] mt-1">Total Records: {localHistory.length}</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                {localHistory.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-white/30 space-y-4">
                    <div className="text-4xl opacity-50">━━━</div>
                    <p className="font-display uppercase tracking-[0.2em] text-[9px]">No_Records_Found</p>
                  </div>
                ) : (
                  localHistory.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative p-4 rounded-lg bg-white/10 border border-white/20 hover:border-white/40 transition-all group overflow-hidden"
                    >
                      {/* Animated left bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-white to-transparent" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pl-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-display uppercase tracking-[0.2em] text-white">{item.modality}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.source === 'AI' ? 'bg-error/20 text-error' : 'bg-success/20 text-success'}`}>
                              {item.source}
                            </span>
                          </div>
                          <p className="text-xs text-white/80 line-clamp-2 font-sans">{item.justification}</p>
                        </div>
                        <div className="flex gap-3 text-[8px] text-white/50 whitespace-nowrap shrink-0">
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              <div className="p-4 sm:p-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[8px] text-white/50 uppercase tracking-[0.3em]">NEURAL_ENGINE_V4</p>
                {localHistory.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all records?')) {
                        handleClearHistory();
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error/10 text-error/60 hover:bg-error/20 hover:text-error transition-all text-[8px] font-bold uppercase tracking-widest"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
