import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [budget, setBudget] = useState(user?.monthlyBudget || 0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await apiRequest('PATCH', '/user/budget', { monthlyBudget: budget });
      updateUser({ monthlyBudget: budget });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Budget updated successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update budget' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const currencySymbol = user.currency === 'INR' ? '₹' : user.currency === 'USD' ? '$' : '€';

  return (
    <div className="min-h-screen p-8 lg:p-12 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <section className="max-w-5xl mx-auto space-y-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-surface-container-low p-12 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 text-on-surface">
            <span className="material-symbols-outlined text-[160px]">person</span>
          </div>
          
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary font-black text-6xl shadow-2xl border-4 border-white/10 relative z-10 transition-transform hover:scale-105 active:scale-95 cursor-pointer">
            {user.name[0]}
          </div>

          <div className="space-y-4 text-center md:text-left relative z-10">
            <h2 className="text-5xl font-black font-headline tracking-tighter text-on-surface uppercase leading-none">
              {user.name}
            </h2>
            <p className="text-on-surface-variant font-body opacity-80">{user.email}</p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              Private Tier Member
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-error/10 border-error/20 text-error'} text-sm text-center`}>
            {message.text}
          </div>
        )}

        {/* Financial Core Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Budget Card */}
          <div className="glass-card p-10 rounded-2xl border border-white/5 space-y-8 relative group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Operational Flow</p>
                <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Monthly Operating Budget</h3>
              </div>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              ) : (
                <div className="flex gap-2">
                   <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                  <button 
                    disabled={loading}
                    onClick={handleSave}
                    className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-2xl">{currencySymbol}</span>
                  <input 
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-xl py-6 pl-12 pr-4 text-4xl font-black font-headline text-white focus:border-secondary/50 outline-none transition-all"
                  />
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black font-headline tracking-tighter text-on-surface">
                    {currencySymbol}{user.monthlyBudget?.toLocaleString() || '0'}
                  </span>
                  <span className="text-neutral-500 text-sm font-label uppercase">/ month</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="glass-card p-10 rounded-2xl border border-white/5 space-y-8">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Identity Profile</p>
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Account Metadata</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-sm text-neutral-500">Member Since</span>
                <span className="text-sm font-bold">March 2026</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-sm text-neutral-500">Preferred Currency</span>
                <span className="text-sm font-bold uppercase">{user.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Security Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
