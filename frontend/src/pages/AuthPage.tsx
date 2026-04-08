import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const SIGNUP_PASSWORD_MIN_LENGTH = 8;
const SIGNUP_PASSWORD_ERROR = 'Password must be at least 8 characters long';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const isSignupPasswordError = error === SIGNUP_PASSWORD_ERROR;

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(fd.get('email') as string, fd.get('password') as string);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = (fd.get('password') as string) || '';

    if (password.length < SIGNUP_PASSWORD_MIN_LENGTH) {
      setError(SIGNUP_PASSWORD_ERROR);
      return;
    }

    setLoading(true);
    try {
      await signup(
        fd.get('name') as string,
        fd.get('email') as string,
        password,
        fd.get('currency') as string || 'INR'
      );
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Top-right Sign In button - Only visible on Landing view */}
      {view === 'landing' && (
        <div className="fixed top-6 right-8 z-50">
          <button
            onClick={() => setView('login')}
            className="px-6 py-2.5 rounded-full text-sm font-bold text-primary border border-primary/30 bg-primary/5 backdrop-blur-sm hover:bg-primary/15 hover:border-primary/50 transition-all duration-200"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Ambient Aurora Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(75, 0, 130, 0.4) 0%, #131316 80%)' }} />
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] blur-[120px] opacity-20" style={{ background: 'radial-gradient(circle, #d0bcff 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] blur-[100px] opacity-10" style={{ background: 'radial-gradient(circle, #adc6ff 0%, transparent 70%)' }} />
      </div>

      {/* Card */}
      <main className="relative z-10 w-full max-w-lg px-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-12 space-y-6 text-center">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(208,188,255,0.3)] overflow-hidden flex items-center justify-center">
             {!logoError ? (
               <img 
                 src={logo} 
                 alt="SIERRA" 
                 className="w-full h-full object-cover scale-110" 
                 onError={() => setLogoError(true)} 
               />
             ) : (
               <span className="material-symbols-outlined text-4xl text-primary">account_balance_wallet</span>
             )}
          </div>
          <div className="space-y-1">
            <h1 className="font-headline text-4xl font-extrabold tracking-[-0.04em] gradient-text uppercase">
              SIERRA
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 font-bold">Private Tier Wealth</p>
          </div>
        </div>

        {error && !(view === 'signup' && isSignupPasswordError) && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm text-center">
            {error}
          </div>
        )}

        {/* Landing View */}
        {view === 'landing' && (
          <div className="glass-card rounded-lg p-10 border border-outline-variant/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-10">
              <h2 className="font-headline text-5xl font-extrabold text-on-surface leading-[1.1] tracking-[-0.03em] mb-4">
                Access <br /> Private Tier
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Access your private tier wealth management portfolio and global insights.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setView('signup')}
                className="w-full h-14 bg-gradient-to-r from-primary to-secondary text-on-primary font-headline font-bold rounded-full shadow-[0_12px_24px_rgba(208,188,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                Get Started
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Login View */}
        {view === 'login' && (
          <div className="glass-card rounded-lg p-10 border border-outline-variant/10 shadow-2xl flex flex-col gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline tracking-tight text-on-background">Welcome Back</h2>
              <p className="text-on-surface-variant opacity-80">Access your private digital vault.</p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium px-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium px-1">
                  Security Key
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <button
                disabled={loading}
                className="w-full h-14 btn-primary mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Authorize Access'}
                {!loading && <span className="material-symbols-outlined text-xl">key</span>}
              </button>
            </form>
            <p className="text-center text-sm text-on-surface-variant">
              Don't have access?{' '}
              <button onClick={() => setView('signup')} className="text-primary font-bold hover:underline">
                Request Entry
              </button>
            </p>
          </div>
        )}

        {/* Signup View */}
        {view === 'signup' && (
          <div className="glass-card rounded-lg p-10 border border-outline-variant/10 shadow-2xl flex flex-col gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline tracking-tight text-on-background">New Portfolio</h2>
              <p className="text-on-surface-variant opacity-80">Initialize your private wealth vault.</p>
            </div>
            <form className="space-y-4" onSubmit={handleSignup}>
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium px-1">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium px-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium px-1">
                  Security Key
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  onChange={() => {
                    if (error) setError(null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 focus:outline-none focus:border-primary/50 transition-all"
                />
                {isSignupPasswordError && (
                  <p className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
                    {SIGNUP_PASSWORD_ERROR}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium px-1">
                  Currency
                </label>
                <select
                  name="currency"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 focus:outline-none focus:border-primary/50 transition-all appearance-none"
                >
                  <option value="INR" className="bg-neutral-900">INR (₹)</option>
                  <option value="USD" className="bg-neutral-900">USD ($)</option>
                  <option value="EUR" className="bg-neutral-900">EUR (€)</option>
                </select>
              </div>
              <button
                disabled={loading}
                className="w-full h-14 btn-primary mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Initializing...' : 'Create Portfolio'}
                {!loading && <span className="material-symbols-outlined text-xl">verified_user</span>}
              </button>
            </form>
            <p className="text-center text-sm text-on-surface-variant">
              Already have access?{' '}
              <button onClick={() => setView('login')} className="text-primary font-bold hover:underline">
                Sign In
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
