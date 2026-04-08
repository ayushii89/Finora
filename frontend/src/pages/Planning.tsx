const planningTools = [
  { id: 1, title: 'Retirement Architect', desc: 'Simulate long-term wealth accumulation and withdrawal strategies.', icon: 'architecture', color: 'bg-violet-500/20 text-violet-300' },
  { id: 2, title: 'Tax-Loss Harvesting', desc: 'Identify opportunities to offset capital gains with strategic sales.', icon: 'content_cut', color: 'bg-blue-500/20 text-blue-300' },
  { id: 3, title: 'Estate Vault', desc: 'Securely manage beneficiaries and legacy distribution documents.', icon: 'encrypted', color: 'bg-amber-500/20 text-amber-400' },
  { id: 4, title: 'Philanthropic Advisor', desc: 'Optimize charitable giving for maximum impact and tax efficiency.', icon: 'volunteer_activism', color: 'bg-emerald-500/20 text-emerald-400' },
];

export default function Planning() {
  return (
    <div className="min-h-screen p-12 max-w-[1600px] mx-auto space-y-16">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-12">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            Strategic Module
          </div>
          <h2 className="text-6xl font-headline font-black tracking-tighter text-on-surface uppercase leading-none">
            Financial <br /> <span className="gradient-text">Planning</span>
          </h2>
          <p className="text-neutral-500 text-lg font-body leading-relaxed">
            Advanced simulation tools designed for private tier wealth management. Model your financial future with institutional-grade precision.
          </p>
        </div>
        <div className="flex gap-4 mb-2">
          <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold transition-all">Saved Scenarios</button>
          <button className="px-8 py-3 btn-primary text-on-primary rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform">Create New Model</button>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {planningTools.map((tool) => (
          <div key={tool.id} className="glass-panel group p-10 rounded-3xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[120px]">{tool.icon}</span>
            </div>
            
            <div className={`w-16 h-16 rounded-2xl ${tool.color} flex items-center justify-center mb-8 shadow-inner`}>
              <span className="material-symbols-outlined text-3xl">{tool.icon}</span>
            </div>
            
            <div className="space-y-4 relative z-10">
              <h3 className="text-2xl font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{tool.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-sm font-body">{tool.desc}</p>
              
              <div className="pt-6 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                Launch Module <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Active Goal Tracking */}
      <section className="space-y-8">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.3em]">Operational Objectives</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            { name: 'Mediterranean Estate', current: '₹12.4M', target: '₹15M', pct: '82%', color: 'bg-violet-400' },
            { name: 'Venture Capital Pool', current: '₹2.8M', target: '₹5M', pct: '56%', color: 'bg-blue-400' },
            { name: 'Philanthropic Trust', current: '₹4.1M', target: '₹10M', pct: '41%', color: 'bg-amber-400' },
          ].map((goal) => (
            <div key={goal.name} className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-on-surface">{goal.name}</h4>
                <span className="text-xs font-bold text-neutral-500">{goal.pct}</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${goal.color} rounded-full`} style={{ width: goal.pct }} />
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                <span className="text-neutral-500">Current: {goal.current}</span>
                <span className="text-primary">Target: {goal.target}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
