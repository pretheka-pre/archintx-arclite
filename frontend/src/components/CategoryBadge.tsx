import React from 'react';
import { BookOpen, Award, Briefcase, User, HelpCircle } from 'lucide-react';
import type { FAQCategory } from '../api/types';

interface CategoryBadgeProps {
  category: FAQCategory | string | null | undefined;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md' }) => {
  const isSmall = size === 'sm';
  const textClasses = isSmall ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const iconSize = isSmall ? 12 : 14;

  if (!category) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700/50 ${textClasses}`}
      >
        <HelpCircle size={iconSize} className="text-slate-400 shrink-0" />
        General
      </span>
    );
  }

  const normalized = category.trim().toLowerCase();

  if (normalized === 'courses') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ${textClasses}`}
      >
        <BookOpen size={iconSize} className="text-indigo-400 shrink-0" />
        Courses
      </span>
    );
  }

  if (normalized === 'certificates') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 ${textClasses}`}
      >
        <Award size={iconSize} className="text-purple-400 shrink-0" />
        Certificates
      </span>
    );
  }

  if (normalized === 'jobs') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 ${textClasses}`}
      >
        <Briefcase size={iconSize} className="text-teal-400 shrink-0" />
        Jobs
      </span>
    );
  }

  if (normalized === 'account') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 ${textClasses}`}
      >
        <User size={iconSize} className="text-sky-400 shrink-0" />
        Account
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${textClasses}`}
    >
      <HelpCircle size={iconSize} className="text-slate-400 shrink-0" />
      {category}
    </span>
  );
};
