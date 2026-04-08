const healthScore = 842;
const maxScore = 1000;

export default function Insights() {
  return (
    <div className="min-h-screen p-12 max-w-[1600px] mx-auto space-y-16">
      {/* Financial Health Score Hero */}
      <section className="relative overflow-hidden glass-card rounded-[48px] p-16 flex flex-col items-center justify-center text-center space-y-12 border border-white/5 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <p className="text-[10px] uppercase tracking-[0.5em] text-violet-400 font-bold">Wealth Integrity Index</p>
          <h2 className="text-6xl font-headline font-black tracking-tighter text-on-surface uppercase leading-none">
            Financial <br /> <span className="gradient-text">Health Score</span>
          </h2>
        </div>

        <div className="relative flex items-center justify-center z-10">
          <svg className="w-80 h-80 -rotate-90">
            <circle className="text-white/5" cx="160" cy="160" fill="transparent" r="140" stroke="currentColor" strokeWidth="24" />
            <circle 
              className="text-primary drop-shadow-[0_0_12px_rgba(208,188,255,0.4)]" 
              cx="160" cy="160" fill="transparent" r="140" stroke="currentColor" 
              strokeWidth="24"
              strokeDasharray="879.64" 
              strokeDashoffset={879.64 - (879.64 * healthScore) / maxScore}
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-8xl font-black font-headline text-on-surface tracking-tighter">{healthScore}</span>
            <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-2">Optimal Rating</span>
          </div>
        </div>

        <div className="max-w-2xl text-neutral-500 font-body leading-relaxed text-lg relative z-10">
          Your financial health is in the <span className="text-primary font-bold">Top 2%</span> of global private tier users. Maintain your current diversification strategy to ensure long-term wealth preservation.
        </div>
      </section>

      {/* Analysis Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Diversification Insight */}
        <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[100px]">pie_chart</span>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-headline font-bold text-on-surface">Asset Diversification</h3>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">Current allocation shows a heavy concentration in North American Equities. Consider diversifying into Emerging Markets or Private Credit.</p>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Equities', val: '64%', color: 'bg-violet-400' },
              { label: 'Fixed Income', val: '18%', color: 'bg-blue-400' },
              { label: 'Commodities', val: '12%', color: 'bg-amber-400' },
              { label: 'Real Estate', val: '6%', color: 'bg-emerald-400' },
            ].map((d) => (
              <div key={d.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-neutral-500">{d.label}</span>
                  <span className="text-on-surface">{d.val}</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${d.color} rounded-full`} style={{ width: d.val }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[100px]">smart_toy</span>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-headline font-bold text-on-surface">AI Wealth Advisor</h3>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">Predictive analysis based on your spending patterns and global market trends.</p>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Tax Optimization', desc: 'Identify ₹1.2M in potential deductions for Q1.', icon: 'account_balance' },
              { title: 'Liquidity Warning', desc: 'Maintain ₹400k more in cash reserves for upcoming liabilities.', icon: 'warning' },
              { title: 'Dividend Capture', desc: 'Upcoming ₹14.2k payout from AAPL next month.', icon: 'payments' },
            ].map((rec) => (
              <div key={rec.title} className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined">{rec.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{rec.title}</h4>
                  <p className="text-xs text-neutral-500 mt-1">{rec.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
