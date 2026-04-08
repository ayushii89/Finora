import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopNavBar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 w-full z-30 flex justify-between items-center px-8 h-20 bg-neutral-900/40 backdrop-blur-md border-b border-white/10 shadow-[0_8px_32px_0_rgba(139,92,246,0.1)]">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
            search
          </span>
          <input
            className="bg-surface-container-lowest/50 border border-outline-variant/20 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 w-64 transition-all bg-white/5"
            placeholder="Search assets..."
            type="text"
          />
        </div>
        <nav className="hidden md:flex items-center gap-6">

          <Link to="/investments" className="text-neutral-400 hover:text-neutral-200 transition-colors font-label text-sm">
            Portfolio
          </Link>
          <Link to="/expenses" className="text-neutral-400 hover:text-neutral-200 transition-colors font-label text-sm ml-6">
            Activity
          </Link>

        </nav>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          to="/profile"
          className="h-10 w-10 rounded-full border-2 border-primary/30 flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-on-primary font-bold text-sm ml-2 hover:scale-110 active:scale-95 transition-all shadow-lg overflow-hidden group"
        >
          {user?.name?.[0] ?? 'U'}
        </Link>
      </div>
    </header>
  );
}
