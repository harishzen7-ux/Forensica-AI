import React from 'react';

export function SelectionTile({ icon, title, label, onClick, noAnimation }: { icon: React.ReactNode; title: string; label: string; onClick: () => void; noAnimation?: boolean }) {
  return (
    <div 
      onClick={onClick} 
      className={`cloud-tile flex flex-col items-center justify-center gap-2 sm:gap-4 text-center group p-4 sm:p-8 ${noAnimation ? 'hover:scale-100 active:scale-100 hover:shadow-none transition-none' : ''}`}
    >
      <div className={`p-3 sm:p-4 bg-card-surface rounded-2xl transition-colors ${noAnimation ? '' : 'group-hover:bg-card-stroke'}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg sm:text-xl font-bold font-oxanium">{title}</h3>
        <p className="text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1 font-oxanium opacity-60 text-text-muted group-hover:text-[var(--tile-hover-text)]">{label}</p>
      </div>
    </div>
  );
}
