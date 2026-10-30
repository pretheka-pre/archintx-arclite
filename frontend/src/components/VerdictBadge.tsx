import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { VerdictType } from '../api/types';

interface VerdictBadgeProps {
  verdict: VerdictType | string;
  size?: 'sm' | 'md';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const isSmall = size === 'sm';
  const textClasses = isSmall ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const iconSize = isSmall ? 12 : 14;

  switch (verdict) {
    case 'Answered':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${textClasses}`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-400 shrink-0" />
          Answered
        </span>
      );
    case 'Unclear':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${textClasses}`}
        >
          <AlertTriangle size={iconSize} className="text-amber-400 shrink-0" />
          Unclear
        </span>
      );
    case 'Refused':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${textClasses}`}
        >
          <XCircle size={iconSize} className="text-rose-400 shrink-0" />
          Refused
        </span>
      );
  }
};
