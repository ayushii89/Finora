import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/expenses', icon: 'payments', label: 'Expenses' },
  { to: '/investments', icon: 'trending_up', label: 'Investments' },
  { to: '/planning', icon: 'calendar_today', label: 'Planning' },
  { to: '/insights', icon: 'analytics', label: 'Insights' },
];

export default function SideNavBar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col py-8 z-40 bg-neutral-950/60 backdrop-blur-xl w-72 rounded-r-[24px] border-r border-white/5 overflow-hidden">
      {/* Brand */}
      <div className="px-8 mb-12 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0 shadow-lg">
          <img src="/src/assets/logo.png" alt="STACK" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-black text-violet-400 font-headline tracking-tighter">
            SIERRA
          </h1>
          <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-400 mt-0.5">
            Vault Access
          </p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 bg-gradient-to-r from-violet-500/20 to-blue-500/10 text-violet-300 border-r-4 border-violet-500 px-6 py-4 transition-all'
                : 'flex items-center gap-3 text-neutral-500 px-6 py-4 hover:bg-white/5 hover:text-neutral-200 transition-all hover:translate-x-1'
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-label text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto px-6 space-y-1">
        {user && (
          <NavLink 
            to="/profile"
            className={({ isActive }) => 
              `flex items-center gap-3 p-3 mb-6 rounded-2xl transition-all border border-transparent hover:bg-white/5 hover:border-white/5 group ${isActive ? 'bg-primary/10 border-primary/20' : 'bg-surface-container-low'}`
            }
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary font-bold text-sm shadow-lg group-hover:scale-105 transition-transform">
              {user.name[0]}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">{user.name}</p>
              <p className="text-[10px] text-neutral-500">Wealth Management</p>
            </div>
          </NavLink>
        )}
        <div className="border-t border-white/5 pt-4">

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-neutral-500 px-4 py-3 hover:bg-white/5 hover:text-neutral-200 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-label">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
