import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  notes: string;
  date: string;
}

const CATEGORY_OPTIONS = [
  { value: 'FOOD', label: 'Food & Dining' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'RENT', label: 'Rent' },
  { value: 'OTHER', label: 'Other' },
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('FOOD');
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'FOOD', notes: '' });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find((option) => option.value === selectedCategory)?.label || 'Select category';

  const fetchExpenses = async () => {
    try {
      const res = await apiRequest('GET', '/expenses?limit=50');
      setExpenses(res.data.expenses);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Backend expects integer (smallest currency unit)
      const amount = Math.round(Number(newExpense.amount));
      await apiRequest('POST', '/expenses', {
        amount,
        category: newExpense.category,
        notes: newExpense.notes,
      });
      setNewExpense({ amount: '', category: 'FOOD', notes: '' });
      setSelectedCategory('FOOD');
      setIsCategoryOpen(false);
      setIsAdding(false);
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await apiRequest('DELETE', `/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error('Failed to delete expense', err);
    }
  };

  const currencySymbol = user?.currency === 'INR' ? '₹' : user?.currency === 'USD' ? '$' : '€';

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black font-headline">Activity</h2>
          <p className="text-neutral-500">Track and manage your private expenditures</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary px-6 py-3 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          New Expense
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="relative overflow-hidden w-full max-w-md p-8 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)] animate-modal-enter transition-all duration-200 ease-out">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            <div className="relative z-10 flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold tracking-wide text-white">Record Expenditure</h3>
              <button onClick={() => setIsAdding(false)} className="text-neutral-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {error && <p className="mb-4 text-error text-sm bg-error/10 p-3 rounded-lg border border-error/20">{error}</p>}
            <form onSubmit={handleAddExpense} className="relative z-10 space-y-7">
              <div className="space-y-2">
                <label className="block mb-2 text-xs uppercase tracking-wider text-neutral-400">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-xs uppercase tracking-wider text-neutral-400">Category</label>
                <div className="relative w-full max-w-sm" ref={categoryDropdownRef}>
                  <div className="rounded-2xl p-[1px] bg-gradient-to-r from-violet-500/10 to-blue-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen((prev) => !prev)}
                      className="w-full bg-black/60 backdrop-blur-xl border border-white/10 hover:border-violet-500/30 rounded-2xl px-4 py-3 text-white text-sm font-medium tracking-wide flex justify-between items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200 active:scale-[0.98]"
                    >
                      <span>{selectedCategoryLabel}</span>
                      <span
                        className={`material-symbols-outlined text-[18px] text-neutral-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>

                  <div
                    className={`absolute top-full left-0 w-full mt-3 max-h-60 py-2 pr-1 bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-y-auto scroll-smooth z-[60] origin-top transition-all duration-150 ease-out ${isCategoryOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
                  >
                    {CATEGORY_OPTIONS.map((option, idx) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(option.value);
                          setNewExpense({ ...newExpense, category: option.value });
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full text-left text-sm px-4 py-3.5 cursor-pointer transition-all duration-150 ${idx !== CATEGORY_OPTIONS.length - 1 ? 'border-b border-white/5' : ''} ${selectedCategory === option.value ? 'bg-gradient-to-r from-violet-500/25 to-blue-500/15 text-violet-300 font-semibold' : 'text-neutral-400 hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-blue-500/10 hover:text-white hover:translate-x-1'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-xs uppercase tracking-wider text-neutral-400">Notes</label>
                <textarea
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  placeholder="What was this for?"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none min-h-[100px]"
                />
              </div>
              <div className="border-t border-white/5 pt-4">
                <button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl py-3 font-medium shadow-[0_0_25px_rgba(139,92,246,0.35)] hover:brightness-110 hover:shadow-lg hover:-translate-y-[1px] active:scale-[0.98] transition-all mt-1">
                  Confirm Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-neutral-400 font-bold">Transaction</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-neutral-400 font-bold">Category</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-neutral-400 font-bold">Date</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-neutral-400 font-bold text-right">Amount</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-neutral-400 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{expense.notes || 'No notes'}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">ID: {expense._id.slice(-6)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs capitalize">
                      <span className="material-symbols-outlined text-sm">
                        {expense.category.toLowerCase() === 'food' ? 'restaurant' : 
                         expense.category.toLowerCase() === 'transport' ? 'directions_car' : 
                         expense.category.toLowerCase() === 'entertainment' ? 'movie' : 
                         expense.category.toLowerCase() === 'shopping' ? 'shopping_bag' : 
                         expense.category.toLowerCase() === 'utilities' ? 'bolt' : 
                         expense.category.toLowerCase() === 'travel' ? 'flight' : 
                         expense.category.toLowerCase() === 'rent' ? 'home' : 
                         'receipt_long'}
                      </span>
                      {expense.category.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {new Date(expense.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-primary">
                    {currencySymbol}{expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteExpense(expense._id)}
                      className="p-2 text-neutral-500 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-neutral-500">
                    <span className="material-symbols-outlined text-4xl mb-2">history</span>
                    <p>No transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
