import React from 'react';
import { motion } from 'motion/react';
import { Camera, Video, FileText, Mic } from 'lucide-react';
import { SelectionTile } from '../components/SelectionTile';
import { Page, Modality } from '../types';

interface SelectionViewProps {
  onNavigate: (page: Page, modality: Modality) => void;
}

export function SelectionView({ onNavigate }: SelectionViewProps) {
  return (
    <motion.div 
      key="selection"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="w-full max-w-5xl text-center px-4"
    >
      <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-12 font-roboto">What do you want me to detect?</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SelectionTile 
          icon={<Camera className="w-8 h-8" />}
          title="Photo"
          label="Fake Ends Here"
          onClick={() => onNavigate('detect', 'photo')}
          noAnimation
        />
        <SelectionTile 
          icon={<Video className="w-8 h-8" />}
          title="Video"
          label="Deepfake Clarity"
          onClick={() => onNavigate('detect', 'video')}
        />
        <SelectionTile 
          icon={<FileText className="w-8 h-8" />}
          title="Text"
          label="Text Authenticity"
          onClick={() => onNavigate('detect', 'text')}
        />
        <SelectionTile 
          icon={<Mic className="w-8 h-8" />}
          title="Audio"
          label="Audio Forensics"
          onClick={() => onNavigate('detect', 'audio')}
        />
      </div>
    </motion.div>
  );
}
