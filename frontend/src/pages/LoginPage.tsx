import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      setErrorMessage(detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setEmail('admin@archintx.com');
    setPassword('ArchintX2026!Secure');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/50 border border-emerald-400/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Staff Portal Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access protected Arc Lite FAQ configuration and real-time conversation analytics.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-2.5 rounded-xl text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@archintx.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Helper for Demo / Testing */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 mb-2">Default Seeded Admin Credentials:</p>
          <button
            type="button"
            onClick={fillDefaultCredentials}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono text-emerald-400 transition-colors"
          >
            <Key size={12} />
            <span>Fill admin@archintx.com</span>
          </button>
        </div>
      </div>
    </div>
  );
};
