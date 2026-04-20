import React from 'react';

export function SpecItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass-card p-6 space-y-2">
      <h4 className="font-bold text-lg">{title}</h4>
      <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
