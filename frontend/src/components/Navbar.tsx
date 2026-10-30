import React from 'react';
import { Bot, BarChart3, Database, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'chat' | 'login' | 'faqs' | 'analytics';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { isAuthenticated, email, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/20 group-hover:scale-105 transition-transform duration-200">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">Arc Lite</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">ArchintX AI Knowledge Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'chat'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Bot size={15} />
            <span>Chat Assistant</span>
          </button>

          {isAuthenticated ? (
            <>
              <button
                onClick={() => setActiveTab('faqs')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  activeTab === 'faqs'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Database size={15} />
                <span>FAQ Manager</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <BarChart3 size={15} />
                <span>Analytics</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === 'login'
                  ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <LogIn size={15} />
              <span>Staff Portal</span>
            </button>
          )}
        </nav>

        {/* User Account State */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span className="truncate max-w-[150px] font-mono text-[11px]">{email}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setActiveTab('chat');
                }}
                title="Sign out of staff portal"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
            >
              Staff Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
