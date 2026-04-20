import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function LaunchAnimation({ onComplete }: { onComplete: () => void, key?: string }) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = useMemo(() => [
    "INITIALIZING_NEURAL_CORE",
    "DECRYPTING_SIGNAL_LAYERS",
    "MAPPING_SYNTHETIC_PATTERNS",
    "VERIFYING_BIOMETRIC_COHERENCE",
    "COMPILING_FORENSIC_REPORT",
    "SYSTEM_READY"
  ], []);

  useEffect(() => {
    const duration = 3000; 
    const interval = 30;
    const increment = 100 / (duration / interval);
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => onComplete(), 800);
          return 100;
        }
        return Math.min(100, prev + increment);
      });
    }, interval);

    const statusTimer = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % statusMessages.length);
    }, 500);

    return () => {
      clearInterval(progressTimer);
      clearInterval(statusTimer);
    };
  }, [onComplete, statusMessages.length]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.05,
        filter: "blur(20px)"
      }}
      transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center overflow-hidden font-oxanium"
    >
      {/* Background Grid & Scanline */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <motion.div 
          animate={{ top: ['-10%', '110%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[20vh] bg-gradient-to-b from-transparent via-accent/5 to-transparent z-10"
        />
      </div>

      {/* Central Composition */}
      <div className="relative w-full max-w-2xl px-10 flex flex-col items-center gap-12 -translate-y-15">
        
        {/* Animated Logo/Core Symbol */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-accent/20 border-t-accent rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border border-dashed border-accent/40 rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-accent/50 shadow-[0_0_30px_var(--accent-glow)]"
          >
            <div className="w-4 h-4 bg-accent rounded-sm rotate-45" />
          </motion.div>
        </div>

        {/* Loading Content */}
        <div className="w-full space-y-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[10px] md:text-xs text-accent font-bold uppercase tracking-[0.5em]"
              >
                {statusMessages[statusIndex]}
              </motion.p>
            </AnimatePresence>
            <h1 className="text-white text-4xl md:text-6xl font-bold tracking-tighter font-display">
              Forensica AI
            </h1>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-accent"
                />
                <span className="text-[10px] text-accent/60 uppercase tracking-widest font-mono">Neural_Link_V4.2</span>
              </div>
              <span className="text-3xl md:text-5xl font-bold text-white font-oxanium leading-none">{Math.round(progress)}%</span>
            </div>
            
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="absolute inset-y-0 left-0 bg-accent shadow-[0_0_20px_var(--accent-glow)]"
              />
              <motion.div 
                animate={{ left: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </div>

            <div className="flex justify-between items-center text-[8px] md:text-[10px] text-accent/30 font-mono uppercase tracking-[0.2em]">
              <div className="flex gap-4">
                <span>ENC: AES-256</span>
                <span>SIG: SHA-512</span>
              </div>
              <span>LOC: ASIA_SE_1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Data Fragments */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%',
              opacity: 0 
            }}
            animate={{ 
              opacity: [0, 1, 0],
              y: [null, '-=50']
            }}
            transition={{ 
              duration: 3 + Math.random() * 4, 
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute text-[8px] font-mono text-accent whitespace-nowrap"
          >
            {`0x${Math.random().toString(16).substring(2, 10).toUpperCase()}_FRAGMENT_${i}`}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
