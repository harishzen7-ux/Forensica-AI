import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ChevronLeft, ShieldCheck, Zap, Target, Cpu, Binary, Globe } from 'lucide-react';
import { Page, SystemStats } from '../types';

interface EvolutionViewProps {
  onNavigate: (page: Page) => void;
  stats: SystemStats | null;
}

export function EvolutionView({ onNavigate, stats }: EvolutionViewProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const intelligenceStatuses = [
    { 
      name: "Novice", 
      range: "0-25%", 
      desc: "Initial system state. Basic pattern recognition active. Focuses on obvious artifacts and metadata inconsistencies.",
      icon: <Zap className="w-8 h-8" />,
      details: ["Metadata Validation", "Basic Noise Analysis", "JPEG Artifact Detection"]
    },
    { 
      name: "Advanced", 
      range: "26-50%", 
      desc: "Enhanced neural pathways. Improved artifact detection. Capable of identifying subtle GAN-generated features.",
      icon: <Target className="w-8 h-8" />,
      details: ["GAN Signature Identification", "Frequency Domain Analysis", "Color Space Anomalies"]
    },
    { 
      name: "Expert", 
      range: "51-75%", 
      desc: "High-precision analysis. Deep biometric verification enabled. Analyzes physiological signals in video and audio.",
      icon: <ShieldCheck className="w-8 h-8" />,
      details: ["Biometric Consistency", "Eye Tracking Analysis", "Voice Stress Profiling"]
    },
    { 
      name: "Master", 
      range: "76-90%", 
      desc: "Superior forensic accuracy. Cross-dataset synthesis active. Understands semantic context and logical flow.",
      icon: <Cpu className="w-8 h-8" />,
      details: ["Semantic Verification", "Cross-Modality Sync", "Temporal Consistency"]
    },
    { 
      name: "Quantum", 
      range: "91-100%", 
      desc: "Peak intelligence. Real-time probabilistic deconstruction. Predictive modeling of future manipulation techniques.",
      icon: <Binary className="w-8 h-8" />,
      details: ["Probabilistic Deconstruction", "Zero-Day Attack Detection", "Neural Network Reverse Engineering"]
    }
  ];

  return (
    <motion.div 
      key="evolution"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full min-h-screen pt-12 pb-32 relative"
    >
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-[100] shadow-[0_0_10px_var(--accent-glow)]"
        style={{ scaleX }}
      />

      <div className="max-w-6xl mx-auto px-6">
        <button 
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-3 text-text-muted hover:text-accent active:scale-95 mb-20 transition-all duration-300 uppercase tracking-[0.3em] text-[10px] font-display"
        >
          <div className="w-8 h-8 rounded-full border border-card-stroke flex items-center justify-center group-hover:border-accent/50 group-hover:bg-accent/5 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Terminal
        </button>

        <header className="mb-32 relative">
          {/* Decorative Globe */}
          <div className="absolute -top-20 -right-20 opacity-5 pointer-events-none">
            <Globe className="w-[500px] h-[500px] text-accent" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="h-px w-12 bg-accent" />
            <span className="text-accent text-xs font-display uppercase tracking-[0.4em]">System Progression</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-7xl md:text-[120px] font-bold font-oxanium tracking-tighter leading-[0.85] mb-12"
          >
            NEURAL<br />EVOLUTION
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-2xl"
          >
            <p className="text-xl text-text-muted leading-relaxed font-sans">
              The system is a living entity. With every analysis, our neural networks evolve, 
              learning new patterns of manipulation and strengthening the shield of digital truth.
            </p>
          </motion.div>
        </header>

        {/* Current Status Banner */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-48 p-10 glass-card border-accent/20 bg-card-surface relative overflow-hidden"
          >
            <div className="relative z-10 grid md:grid-cols-3 gap-12 items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-display text-accent uppercase tracking-[0.3em] font-bold">Current Intelligence</p>
                <h2 className="text-4xl font-bold font-oxanium text-text-main">{stats.intelligenceStatus}</h2>
                <p className="text-xs text-text-muted font-sans">System operating at peak efficiency.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-display text-text-muted uppercase tracking-[0.3em]">Learning Progress</p>
                  <span className="text-xl font-bold font-display text-accent">{stats.learningProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-card-stroke rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.learningProgress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-accent shadow-[0_0_15px_var(--accent-glow)]"
                  />
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-[10px] font-display text-text-muted uppercase tracking-[0.3em] mb-1">Core Version</p>
                <p className="text-2xl font-display font-bold text-text-main/90">{stats.neuralVersion}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Evolution Timeline */}
        <div className="space-y-48">
          {intelligenceStatuses.map((tier, index) => (
            <motion.section 
              key={tier.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative grid md:grid-cols-[1fr_2fr] gap-16 items-start"
            >
              {/* Oversized Number Background */}
              <div className="absolute -left-8 -top-16 text-[180px] md:text-[240px] font-oxanium font-black text-white/[0.03] select-none pointer-events-none leading-none">
                0{index + 1}
              </div>

              <div className="sticky top-32 space-y-8 z-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${stats?.intelligenceStatus === tier.name ? 'bg-accent text-white shadow-[0_0_40px_var(--accent-glow)]' : 'bg-card-surface text-text-muted/30 border border-card-stroke'}`}>
                  {tier.icon}
                </div>
                <div>
                  <h3 className={`text-5xl font-bold font-oxanium mb-3 ${stats?.intelligenceStatus === tier.name ? 'text-accent' : 'text-text-main'}`}>
                    {tier.name}
                  </h3>
                  <p className="text-xs font-display text-text-muted uppercase tracking-[0.2em] font-bold">{tier.range}</p>
                </div>
              </div>

              <div className="space-y-12 z-10">
                <p className="text-2xl md:text-3xl font-light text-text-muted leading-relaxed font-sans">
                  {tier.desc}
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {tier.details.map((detail) => (
                    <div key={detail} className="p-6 rounded-2xl bg-card-surface border border-card-stroke hover:border-accent/40 transition-all duration-300 group cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
                        <span className="text-[11px] font-display uppercase tracking-widest text-text-muted group-hover:text-text-main transition-colors">
                          {detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <footer className="mt-64 text-center space-y-16">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <p className="text-4xl md:text-6xl font-bold italic opacity-10 font-oxanium tracking-tight">The Future is Verified.</p>
          <button 
            onClick={() => onNavigate('selection')}
            className="px-12 py-5 bg-accent hover:opacity-90 text-white font-oxanium text-lg rounded-full transition-all duration-300 shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_40px_var(--accent-glow)] active:scale-95"
            aria-label="Begin Analysis"
          >
            Begin Analysis
          </button>
        </footer>
      </div>
    </motion.div>
  );
}
