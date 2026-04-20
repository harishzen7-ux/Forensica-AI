import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SpecItem } from '../components/SpecItem';
import { Page } from '../types';

interface SpecsViewProps {
  onNavigate: (page: Page) => void;
}

export function SpecsView({ onNavigate }: SpecsViewProps) {
  return (
    <motion.div
      key="specs"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="w-full max-w-4xl py-12"
    >
      <motion.button
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-card-surface border border-card-stroke text-text-muted hover:text-text-main hover:border-accent/30 transition-all mb-12 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:text-accent transition-colors" />
        <span className="text-xs font-display font-bold uppercase tracking-widest">Return to Terminal</span>
      </motion.button>

      <h2 className="text-5xl font-bold mb-8 font-oxanium">Specifications</h2>

      <div className="space-y-12">
        <section className="space-y-4">
          <h3 className="text-2xl font-bold font-oxanium">The System</h3>
          <p className="text-text-muted leading-relaxed text-lg">
            This system analyzes AI-generated and manipulated photos, videos, text, and audio through a local ensemble pipeline.
            Whether it is a deepfake video, synthetic voice, altered image, or AI-written content, the backend coordinates modality-specific detectors and returns a unified forensic score.
          </p>
        </section>

       <div className="grid md:grid-cols-2 gap-8"> 
        <SpecItem title="Deepfake Detection" desc="Coordinate multiple local detectors for manipulated faces, synthetic media, and temporal anomalies." /> 
        <SpecItem title="Image Authenticity Analysis" desc="Run local visual forensics and ensemble scoring for altered and AI-created images." /> 
        <SpecItem title="Video Verification" desc="Blend frame, temporal, and transformer-style signals into one backend verdict." /> 
        <SpecItem title="AI Text Detection" desc="Aggregate text detector outputs into a single forensic confidence score." /> 
        <SpecItem title="Audio Forensics" desc="Evaluate spoofing, synthetic speech, and waveform anomalies through the local audio pipeline." />
         </div>

        <section className="space-y-6 pt-8 border-t border-card-stroke">
          <h3 className="text-2xl font-bold font-oxanium">How It Works</h3>
          <ol className="space-y-4">
            <li className="flex gap-4 items-start">
              <span className="bg-text-main text-bg-app w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">1</span>
              <p className="text-text-muted">Upload your file or paste your text content.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="bg-text-main text-bg-app w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">2</span>
              <p className="text-text-muted">The local backend scans for manipulation patterns, synthetic artifacts, and modality-specific anomalies.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="bg-text-main text-bg-app w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">3</span>
              <p className="text-text-muted">Receive a clear authenticity score with detailed ensemble-backed forensic analysis.</p>
            </li>
          </ol>
        </section>

        <section className="space-y-6 pt-8 border-t border-card-stroke">
          <h3 className="text-2xl font-bold font-oxanium">Why This System</h3>
          <ul className="grid md:grid-cols-2 gap-4">
            <li className="flex items-center gap-3 text-text-muted">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Multi-format detection
            </li>
            <li className="flex items-center gap-3 text-text-muted">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Neural Engine processing
            </li>
            <li className="flex items-center gap-3 text-text-muted">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Clear confidence scoring
            </li>
            <li className="flex items-center gap-3 text-text-muted">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Secure and privacy-focused
            </li>
          </ul>
        </section>

        <div className="pt-12 text-center">
          <p className="text-3xl font-bold italic opacity-50 mb-8 font-oxanium">Truth, Verified.</p>
          <button onClick={() => onNavigate('selection')} className="btn-cloud font-oxanium">Get Started Now</button>
        </div>
      </div>
    </motion.div>
  );
}
