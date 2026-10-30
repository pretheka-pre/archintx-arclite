import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import type { ActiveTab } from './components/Navbar';
import { ChatPage } from './pages/ChatPage';
import { LoginPage } from './pages/LoginPage';
import { FaqManagement } from './pages/FaqManagement';
import { AnalyticsPage } from './pages/AnalyticsPage';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const { isAuthenticated } = useAuth();

  const handleTabChange = (tab: ActiveTab) => {
    if ((tab === 'faqs' || tab === 'analytics') && !isAuthenticated) {
      setActiveTab('login');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="flex-1">
        {activeTab === 'chat' && <ChatPage />}
        {activeTab === 'login' && (
          <LoginPage onLoginSuccess={() => setActiveTab('faqs')} />
        )}
        {activeTab === 'faqs' && (
          isAuthenticated ? <FaqManagement /> : <LoginPage onLoginSuccess={() => setActiveTab('faqs')} />
        )}
        {activeTab === 'analytics' && (
          isAuthenticated ? <AnalyticsPage /> : <LoginPage onLoginSuccess={() => setActiveTab('analytics')} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} ArchintX. Arc Lite AI-Powered FAQ Engine.</p>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>FastAPI + PostgreSQL</span>
            <span>•</span>
            <span>TF-IDF + Cosine Similarity</span>
            <span>•</span>
            <span>React + Vite</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
