import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Check, X } from 'lucide-react';
import { DetectionResult } from '../../types';

interface AnalysisResultProps {
  result: DetectionResult;
  onNewAnalysis: () => void;
  onChangeModality: () => void;
  onFeedback: (rating: number, isCorrect: boolean) => void;
  feedbackSubmitted: boolean;
}

export function AnalysisResult({ 
  result, 
  onNewAnalysis, 
  onChangeModality,
  onFeedback,
  feedbackSubmitted
}: AnalysisResultProps) {
  const [rating, setRating] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group"
    >
      {/* Corner Accents */}
      <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-accent/40 rounded-tl-xl z-10" />
      <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-accent/40 rounded-tr-xl z-10" />
      <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-accent/40 rounded-bl-xl z-10" />
      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-accent/40 rounded-br-xl z-10" />

      <div className="cloud-tile !p-6 md:!p-10 no-anim-cloud space-y-8 border-accent/20 relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none select-none">
          <h2 className="text-8xl font-oxanium font-bold rotate-12">VERIFIED</h2>
        </div>

        {/* Report Header */}
        <div className="flex items-center justify-between border-b border-card-stroke pb-6">
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-oxanium font-bold text-text-main tracking-tight uppercase">Forensic Report</h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-oxanium text-accent/60 uppercase tracking-[0.2em]">ID: {Math.random().toString(36).substring(2, 11).toUpperCase()}</span>
              <span className="w-1 h-1 rounded-full bg-card-stroke" />
              <span className="text-[10px] font-oxanium text-text-muted uppercase tracking-[0.2em]">Timestamp: {new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="px-3 py-1 rounded-md bg-accent/10 border border-accent/20">
              <span className="text-[10px] font-oxanium text-accent font-bold uppercase tracking-widest">Neural Scan Complete</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="relative w-48 h-48 shrink-0">
            {/* Animated Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border border-dashed border-accent/20 rounded-full"
            />
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-text-main/5"
              />
              <motion.circle
                initial={{ strokeDashoffset: 502 }}
                animate={{ strokeDashoffset: 502 - (502 * result.score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={502}
                className={`${result.score > 50 ? 'text-success' : 'text-error'} transition-all duration-1000 shadow-[0_0_20px_currentColor]`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-text-main font-oxanium">{result.score}</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-text-muted font-oxanium mt-1">Genuine Score</span>
            </div>
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase border ${result.generation_source === 'HUMAN' ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'}`}>
                  {result.generation_source} ORIGIN DETECTED
                </div>
                <div className="px-4 py-1.5 rounded-lg bg-card-surface border border-card-stroke text-[10px] font-oxanium text-text-muted uppercase tracking-widest">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </div>
              </div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent-glow)]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold font-oxanium">Forensic Justification</span>
              </div>
              <div className="relative p-4 bg-card-surface border border-card-stroke rounded-xl">
                <p className="text-text-main/90 leading-relaxed font-oxanium text-sm sm:text-base italic">
                  "{result.justification}"
                </p>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-accent/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Breakdown - Technical Grid */}
        {result.breakdown && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-oxanium text-text-muted uppercase tracking-[0.2em]">Neural Parameter Breakdown</span>
              <div className="h-px flex-1 bg-card-stroke" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.breakdown.map((item, index) => (
                <div key={index} className="relative group/item">
                  <div className="bg-card-surface/50 p-4 rounded-xl border border-card-stroke space-y-3 transition-all group-hover/item:border-accent/30">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted font-oxanium">{item.label}</span>
                      <span className="text-xs font-oxanium font-bold text-accent">{Math.round(item.value)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-card-stroke rounded-full overflow-hidden p-[1px]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className="h-full bg-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Section - System Calibration */}
        <div className="pt-8 border-t border-card-stroke">
          {!feedbackSubmitted ? (
            <div className="bg-card-surface/30 rounded-2xl p-6 border border-card-stroke border-dashed">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-text-main font-oxanium">System Calibration</h4>
                  </div>
                  <p className="text-xs text-text-muted font-oxanium uppercase tracking-widest">Validate analysis accuracy to optimize neural weights</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-xl border border-card-stroke">
                      <button 
                        onClick={() => setIsCorrect(true)}
                        className={`p-2.5 rounded-lg transition-all ${isCorrect === true ? 'bg-success text-white shadow-[0_0_20px_var(--success)]' : 'hover:bg-card-stroke text-text-muted'}`}
                        title="Accurate"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setIsCorrect(false)}
                        className={`p-2.5 rounded-lg transition-all ${isCorrect === false ? 'bg-error text-white shadow-[0_0_20px_var(--error)]' : 'hover:bg-card-stroke text-text-muted'}`}
                        title="Inaccurate"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1 transition-all hover:scale-125 group/star"
                        >
                          <Star 
                            className={`w-6 h-6 transition-colors ${star <= rating ? 'fill-accent text-accent' : 'text-text-muted/20 group-hover/star:text-accent/40'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={rating === 0 || isCorrect === null}
                    onClick={() => onFeedback(rating, isCorrect!)}
                    className="w-full sm:w-auto px-10 py-3 bg-text-main text-bg-app rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-accent hover:text-white transition-all shadow-xl shadow-accent/10 font-oxanium"
                  >
                    Submit Data
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-4 py-6 bg-success/5 border border-dashed border-success/30 rounded-2xl"
            >
              <div className="p-2 bg-success/20 rounded-full">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div className="text-center sm:text-left">
                <span className="text-sm font-bold text-success uppercase tracking-[0.2em] font-oxanium block">Intelligence Synchronized</span>
                <span className="text-[10px] text-success/60 uppercase tracking-widest font-oxanium">Feedback successfully integrated into neural buffer</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onNewAnalysis}
            className="flex-1 py-4 rounded-xl border border-card-stroke hover:bg-card-surface transition-all font-oxanium text-[10px] uppercase tracking-[0.3em] text-text-muted hover:text-text-main"
          >
            Reset Forensic Buffer
          </button>
          <button 
            onClick={onChangeModality}
            className="flex-1 py-4 rounded-xl bg-card-surface border border-accent/30 text-accent font-bold hover:bg-accent hover:text-white transition-all text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-accent/5 font-oxanium"
          >
            Switch Modality Module
          </button>
        </div>
      </div>
    </motion.div>
  );
}
