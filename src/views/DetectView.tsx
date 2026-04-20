import React from 'react';
import { motion } from 'motion/react';
import { Camera, Video, FileText, Mic, ChevronLeft, Upload, Info, AlertCircle, RefreshCcw, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Page, Modality, DetectionResult } from '../types';
import { AnalysisProgress } from '../components/Analysis/AnalysisProgress';
import { AnalysisResult } from '../components/Analysis/AnalysisResult';

interface DetectViewProps {
  selectedModality: Modality;
  onNavigate: (page: Page, modality?: Modality | null) => void;
  isAnalyzing: boolean;
  result: DetectionResult | null;
  textInput: string;
  setTextInput: (val: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyze: () => void;
  handleFeedback: (rating: number, isCorrect: boolean) => void;
  feedbackSubmitted: boolean;
  resetAnalysis: () => void;
  analysisError: string | null;
}

export function DetectView({
  selectedModality,
  onNavigate,
  isAnalyzing,
  result,
  textInput,
  setTextInput,
  file,
  setFile,
  previewUrl,
  setPreviewUrl,
  handleFileChange,
  handleAnalyze,
  handleFeedback,
  feedbackSubmitted,
  resetAnalysis,
  analysisError
}: DetectViewProps) {
  return (
    <motion.div 
      key="detect"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="w-full max-w-3xl px-4 font-oxanium"
    >
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-16 py-8">
        {/* Minimalist Header - Floating */}
        <div className="text-center space-y-3">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-oxanium font-bold tracking-tighter text-text-main"
          >
            {selectedModality === 'photo' && 'Visual'}
            {selectedModality === 'video' && 'Motion'}
            {selectedModality === 'text' && 'Linguistic'}
            {selectedModality === 'audio' && 'Acoustic'}
            <span className="text-accent ml-2">Audit</span>
          </motion.h2>
          <p className="text-[10px] font-oxanium uppercase tracking-[0.4em] text-text-muted opacity-50">Neural Gateway • V4.2</p>
        </div>

        {analysisError === 'RATE_LIMIT_EXCEEDED' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg overflow-hidden relative rounded-2xl border border-accent/30 bg-card-surface/40 backdrop-blur-xl p-8 text-center shadow-[0_0_50px_rgba(var(--accent-glow),0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
            <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-oxanium font-bold text-text-main mb-2 tracking-wide uppercase">Upgrade to Premium</h3>
            <p className="text-sm font-oxanium text-text-muted mb-6">You have exceeded the free tier rate limit. Buy premium to access Forensica AI further and unlock unlimited multimodal analysis.</p>
            <button onClick={resetAnalysis} className="px-8 py-3 rounded-full bg-accent text-white font-oxanium font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(var(--accent-glow),0.5)] transition-all">
              Acknowledge
            </button>
          </motion.div>
        ) : analysisError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-6 py-3 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400 font-medium font-oxanium">{analysisError}</span>
            <button onClick={resetAnalysis} className="ml-2 p-1 hover:bg-red-500/20 rounded-full transition-colors">
              <RefreshCcw className="w-3 h-3 text-red-400" />
            </button>
          </motion.div>
        )}

        {!result && !isAnalyzing && (
          <div className="w-full max-w-3xl space-y-16">
            {/* The Neural Portal */}
            <div className="relative flex justify-center">
              {selectedModality === 'text' ? (
                <div className="w-full relative group">
                  <textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Begin data stream..."
                    className="w-full h-48 bg-transparent text-center text-2xl md:text-3xl font-oxanium font-light leading-relaxed resize-none focus:outline-none placeholder:text-text-muted/10 transition-all"
                  />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                  <div className="mt-8 text-center">
                    <span className="text-[10px] font-oxanium text-text-muted/40 uppercase tracking-[0.3em]">
                      {textInput.length > 0 ? `${textInput.split(/\s+/).filter(Boolean).length} Words Captured` : 'Awaiting Input'}
                    </span>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => !file && document.getElementById('file-upload')?.click()}
                  className={`relative group cursor-pointer transition-all duration-1000 ${file ? 'scale-110' : 'hover:scale-105'}`}
                >
                  {/* Portal Rings */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-16 border border-dashed border-accent/5 rounded-full pointer-events-none"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-8 border border-accent/10 rounded-full pointer-events-none"
                  />
                  
                  {/* Main Portal Body */}
                  <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full border border-card-stroke/50 bg-card-surface/20 backdrop-blur-xl flex items-center justify-center overflow-hidden transition-all duration-700
                    ${!file ? 'hover:border-accent/40 shadow-[0_0_50px_rgba(var(--accent-glow),0.05)]' : 'border-accent/30 shadow-[0_0_80px_rgba(var(--accent-glow),0.1)]'}`}
                  >
                    {!file ? (
                      <div className="flex flex-col items-center gap-4 text-center p-8">
                        <div className="p-5 rounded-3xl bg-accent/5 text-accent group-hover:scale-110 transition-transform duration-500">
                          {selectedModality === 'photo' && <Camera className="w-8 h-8" />}
                          {selectedModality === 'video' && <Video className="w-8 h-8" />}
                          {selectedModality === 'audio' && <Mic className="w-8 h-8" />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-oxanium font-bold text-text-main uppercase tracking-widest">Ingest</p>
                          <p className="text-[9px] text-text-muted font-oxanium uppercase tracking-[0.2em]">Drop or Select</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 group/file">
                        {previewUrl && selectedModality === 'photo' ? (
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover/file:opacity-100 transition-opacity duration-700" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-accent/5">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                              {selectedModality === 'video' ? <Video className="text-accent" /> : <Mic className="text-accent" />}
                            </div>
                            <p className="text-[10px] font-oxanium text-accent uppercase tracking-widest">Data Locked</p>
                          </div>
                        )}
                        
                        {/* File Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/file:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center">
                          <p className="text-xs font-bold text-white truncate w-full mb-1 font-oxanium">{file.name}</p>
                          <p className="text-[9px] text-white/60 font-oxanium uppercase tracking-widest mb-4">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white text-[9px] font-bold uppercase tracking-widest transition-all font-oxanium"
                          >
                            Eject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                </div>
              )}
            </div>

            {/* Minimalist Action - Floating Button */}
            <div className="flex flex-col items-center">
              <motion.button 
                initial={false}
                animate={{ 
                  scale: (selectedModality === 'text' ? textInput.length > 0 : !!file) ? 1 : 0.9,
                  opacity: (selectedModality === 'text' ? textInput.length > 0 : !!file) ? 1 : 0.2
                }}
                disabled={(selectedModality === 'text' ? !textInput : !file) || isAnalyzing}
                onClick={handleAnalyze}
                className="relative px-16 py-5 rounded-full bg-text-main text-bg-app font-oxanium font-bold text-xs uppercase tracking-[0.4em] transition-all
                hover:bg-accent hover:text-white hover:shadow-[0_0_50px_rgba(var(--accent-glow),0.3)]
                disabled:cursor-not-allowed group overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  Execute Audit
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent/80 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
              
              <div className="mt-12 flex items-center gap-12 text-[8px] font-oxanium text-text-muted uppercase tracking-[0.4em] opacity-30">
                <span>End-to-End Encryption</span>
                <span className="w-1 h-1 rounded-full bg-text-muted" />
                <span>Neural Engine V4</span>
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && <AnalysisProgress />}

        {result && (
          <AnalysisResult 
            result={result} 
            onNewAnalysis={resetAnalysis} 
            onChangeModality={() => onNavigate('selection')} 
            onFeedback={handleFeedback}
            feedbackSubmitted={feedbackSubmitted}
          />
        )}
      </div>
    </motion.div>
  );
}
