import React from 'react';
import { motion } from 'motion/react';
import { StatusLog } from '../StatusLog';

export function AnalysisProgress() {
  return (
    <div className="cloud-tile !py-12 no-anim-cloud flex flex-col items-center justify-center gap-10 relative overflow-hidden min-h-[400px]">
      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Scanning Line */}
      <motion.div 
        initial={{ top: '0%' }}
        animate={{ top: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-text-main/50 to-transparent z-10 shadow-[0_0_15px_rgba(var(--text-main),0.5)]"
      />

      {/* Multi-layered Neural Loader */}
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* Outer rotating ring with data-bits */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border border-text-main/5 rounded-full will-change-transform"
        >
          {[0, 90, 180, 270].map((angle, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-accent/40 rounded-full"
              style={{ 
                top: '50%', 
                left: '50%', 
                transform: `rotate(${angle}deg) translateY(-112px)` 
              }}
            />
          ))}
        </motion.div>
        
        {/* Middle pulsing ring */}
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-8 border-2 border-accent/20 rounded-full will-change-transform"
        />

        {/* Core Neural Nodes & Connections */}
        <div className="relative w-40 h-40">
          <svg 
            viewBox="0 0 100 100" 
            className="absolute inset-0 w-full h-full overflow-visible"
          >
            <defs>
              <filter id="neural-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* Connection Lines */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const x2 = 50 + Math.cos(angle * Math.PI / 180) * 35;
              const y2 = 50 + Math.sin(angle * Math.PI / 180) * 35;
              return (
                <motion.line
                  key={`line-${i}`}
                  x1="50" y1="50"
                  x2={x2} y2={y2}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-accent/30"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              );
            })}

            {/* Orbiting Nodes */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const x = 50 + Math.cos(angle * Math.PI / 180) * 35;
              const y = 50 + Math.sin(angle * Math.PI / 180) * 35;
              return (
                <motion.circle
                  key={`node-${i}`}
                  cx={x} cy={y}
                  r="2.5"
                  className="fill-accent"
                  style={{ filter: 'url(#neural-glow)' }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              );
            })}
          </svg>
          
          {/* Central Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 20px var(--accent-glow)",
                  "0 0 40px var(--accent-glow)",
                  "0 0 20px var(--accent-glow)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 bg-accent/10 border border-accent/40 rounded-full flex items-center justify-center backdrop-blur-md relative z-10 will-change-transform"
            >
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-1 border border-dashed border-accent/30 rounded-full"
              />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-t-accent border-r-transparent border-b-accent border-l-transparent rounded-full"
              />
            </motion.div>
          </div>
        </div>

        {/* Scanning Beam (Circular) */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-accent/40 border-r-transparent border-b-transparent border-l-transparent opacity-40 will-change-transform"
        />
      </div>

      <div className="text-center space-y-6 z-10">
        <div className="space-y-2">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold tracking-tight text-text-main font-oxanium"
          >
            Forensic Analysis in Progress
          </motion.p>
          <p className="text-text-muted text-sm font-oxanium uppercase tracking-widest">AI Core V4.2 Active</p>
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold font-oxanium">Neural Evolution in Progress</span>
          </div>
        </div>

        {/* Status Logs */}
        <div className="glass-card bg-card-surface p-4 w-72 mx-auto text-left font-oxanium text-[10px] space-y-1 overflow-hidden h-28 border border-card-stroke">
          <StatusLog delay={0} text="> INITIALIZING NEURAL ENGINE V4.2..." />
          <StatusLog delay={500} text="> DECONSTRUCTING SIGNAL FREQUENCIES..." />
          <StatusLog delay={1200} text="> MAPPING SYNTHETIC ARTIFACTS..." />
          <StatusLog delay={1800} text="> CROSS-REFERENCING HISTORICAL DATASETS..." />
          <StatusLog delay={2500} text="> ANALYZING STYLOMETRIC VARIANCE..." />
          <StatusLog delay={3200} text="> CALCULATING PROBABILISTIC MODELS..." />
          <StatusLog delay={3800} text="> VERIFYING BIOMETRIC COHERENCE..." />
          <StatusLog delay={4500} text="> COMPILING FINAL FORENSIC REPORT..." />
        </div>
      </div>
    </div>
  );
}
