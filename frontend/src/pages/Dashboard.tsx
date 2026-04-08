import { useEffect, useMemo, useState } from 'react';
import PortfolioGraph from '../components/PortfolioGraph';
import { useAuth } from '../context/AuthContext';

interface PortfolioEntry {
  symbol: string;
  quantity: number;
  totalCost: number;
  totalPurchaseCost?: number;
}

type CurrencyCode = 'INR' | 'USD' | 'EUR';

interface FinancialProfile {
  income: number;
  budget: number;
  currency: CurrencyCode;
}

interface FinancialFormState {
  income: string;
  budget: string;
  currency: CurrencyCode;
}

interface FinancialFormErrors {
  income?: string;
  budget?: string;
}

const PORTFOLIO_STORAGE_KEY_PREFIX = 'portfolio';
const FINANCIAL_PROFILE_STORAGE_KEY = 'financialProfile';
const SUPPORTED_CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR'];

function isSupportedCurrency(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

function normalizePortfolioEntry(raw: unknown): PortfolioEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const entry = raw as Record<string, unknown>;

  if (typeof entry.symbol !== 'string') {
    return null;
  }

  const symbol = entry.symbol.trim();
  const quantity = Number(entry.quantity);
  const price = Number(entry.price);
  const purchasePrice =
    entry.purchasePrice !== undefined ? Number(entry.purchasePrice) : undefined;
  const totalCostRaw =
    entry.totalCost !== undefined ? Number(entry.totalCost) : undefined;
  const totalPurchaseCostRaw =
    entry.totalPurchaseCost !== undefined ? Number(entry.totalPurchaseCost) : undefined;

  if (!symbol || !Number.isFinite(quantity)) {
    return null;
  }

  const totalCost =
    totalCostRaw !== undefined && Number.isFinite(totalCostRaw)
      ? totalCostRaw
      : Number.isFinite(price)
        ? quantity * price
        : undefined;

  if (totalCost === undefined || !Number.isFinite(totalCost)) {
    return null;
  }

  const totalPurchaseCost =
    totalPurchaseCostRaw !== undefined && Number.isFinite(totalPurchaseCostRaw)
      ? totalPurchaseCostRaw
      : purchasePrice !== undefined && Number.isFinite(purchasePrice)
        ? quantity * purchasePrice
        : undefined;

  return {
    symbol,
    quantity,
    totalCost,
    ...(totalPurchaseCost !== undefined ? { totalPurchaseCost } : {}),
  };
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [showFinancialOnboarding, setShowFinancialOnboarding] = useState(false);
  const [financialForm, setFinancialForm] = useState<FinancialFormState>({
    income: '',
    budget: '',
    currency: 'INR',
  });
  const [financialErrors, setFinancialErrors] = useState<FinancialFormErrors>({});
  const userId = user?._id ?? user?.id ?? null;
  const portfolioStorageKey = userId
    ? `${PORTFOLIO_STORAGE_KEY_PREFIX}_${userId}`
    : null;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!portfolioStorageKey) {
      setPortfolio([]);
      return;
    }

    const savedPortfolio = localStorage.getItem(portfolioStorageKey);

    if (!savedPortfolio) {
      setPortfolio([]);
      return;
    }

    try {
      const parsed = JSON.parse(savedPortfolio);

      if (!Array.isArray(parsed)) {
        throw new Error('Invalid portfolio payload');
      }

      const normalized = parsed
        .map((entry) => normalizePortfolioEntry(entry))
        .filter((entry): entry is PortfolioEntry => entry !== null);

      setPortfolio(normalized);
    } catch {
      setPortfolio([]);
    }
  }, [isLoading, portfolioStorageKey]);

  useEffect(() => {
    const savedProfile = localStorage.getItem(FINANCIAL_PROFILE_STORAGE_KEY);

    if (!savedProfile) {
      setShowFinancialOnboarding(true);
      return;
    }

    try {
      const parsed = JSON.parse(savedProfile) as Partial<Record<keyof FinancialProfile, unknown>>;
      const income = Number(parsed.income);
      const budget = Number(parsed.budget);
      const currency = typeof parsed.currency === 'string' ? parsed.currency.toUpperCase() : '';

      if (
        !Number.isFinite(income) ||
        income <= 0 ||
        !Number.isFinite(budget) ||
        budget <= 0 ||
        !isSupportedCurrency(currency)
      ) {
        throw new Error('Invalid financial profile');
      }

      setShowFinancialOnboarding(false);
    } catch {
      localStorage.removeItem(FINANCIAL_PROFILE_STORAGE_KEY);
      setShowFinancialOnboarding(true);
    }
  }, []);

  const totalPortfolioValue = useMemo(
    () => portfolio.reduce((sum, entry) => sum + entry.totalCost, 0),
    [portfolio]
  );

  const totalPnl = useMemo(
    () =>
      portfolio.reduce((sum, entry) => {
        if (entry.totalPurchaseCost === undefined) {
          return sum;
        }

        return sum + (entry.totalCost - entry.totalPurchaseCost);
      }, 0),
    [portfolio]
  );

  const hasPnlData = useMemo(
    () => portfolio.some((entry) => entry.totalPurchaseCost !== undefined),
    [portfolio]
  );

  const topHolding = useMemo(() => {
    if (portfolio.length === 0) {
      return null;
    }

    return portfolio.reduce((top, current) =>
      current.totalCost > top.totalCost ? current : top
    );
  }, [portfolio]);

  const formatInr = (value: number) =>
    `₹${value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  const handleFinancialProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const income = Number(financialForm.income);
    const budget = Number(financialForm.budget);
    const nextErrors: FinancialFormErrors = {};

    if (!Number.isFinite(income) || income <= 0) {
      nextErrors.income = 'Monthly income must be greater than 0';
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      nextErrors.budget = 'Monthly budget must be greater than 0';
    }

    if (nextErrors.income || nextErrors.budget) {
      setFinancialErrors(nextErrors);
      return;
    }

    const profile: FinancialProfile = {
      income,
      budget,
      currency: financialForm.currency,
    };

    localStorage.setItem(FINANCIAL_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setFinancialErrors({});
    setShowFinancialOnboarding(false);
  };

  const pnlColorClass =
    totalPnl > 0 ? 'text-green-400' : totalPnl < 0 ? 'text-red-400' : 'text-neutral-400';

  return (
    <div className="p-8 space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">Total Portfolio Value</p>
          <h2 className="mt-3 text-3xl font-bold font-headline text-white">
            {formatInr(totalPortfolioValue)}
          </h2>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">Total P&amp;L</p>
          <h2 className={`mt-3 text-3xl font-bold font-headline ${hasPnlData ? pnlColorClass : 'text-neutral-400'}`}>
            {hasPnlData ? formatInr(totalPnl) : '—'}
          </h2>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">Top Holding</p>
          {topHolding ? (
            <>
              <h2 className="mt-3 text-3xl font-bold font-headline text-white">{topHolding.symbol}</h2>
              <p className="mt-2 text-sm text-neutral-300">{formatInr(topHolding.totalCost)}</p>
            </>
          ) : (
            <h2 className="mt-3 text-3xl font-bold font-headline text-neutral-400">—</h2>
          )}
        </div>
      </section>

      <PortfolioGraph portfolio={portfolio} />

      {showFinancialOnboarding && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
            <h3 className="text-xl font-semibold tracking-wide text-white">Complete Your Financial Profile</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Add your monthly income, budget, and preferred currency to personalize budgeting insights.
            </p>

            <form onSubmit={handleFinancialProfileSubmit} className="mt-6 space-y-5 text-left">
              <div>
                <label className="block mb-2 text-xs uppercase tracking-wider text-neutral-400">Monthly Income</label>
                <input
                  type="number"
                  min="0"
                  value={financialForm.income}
                  onChange={(e) => {
                    setFinancialForm((prev) => ({ ...prev, income: e.target.value }));
                    if (financialErrors.income) {
                      setFinancialErrors((prev) => ({ ...prev, income: undefined }));
                    }
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="Enter monthly income"
                  required
                />
                {financialErrors.income && (
                  <p className="mt-2 text-xs text-error">{financialErrors.income}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-xs uppercase tracking-wider text-neutral-400">Monthly Budget</label>
                <input
                  type="number"
                  min="0"
                  value={financialForm.budget}
                  onChange={(e) => {
                    setFinancialForm((prev) => ({ ...prev, budget: e.target.value }));
                    if (financialErrors.budget) {
                      setFinancialErrors((prev) => ({ ...prev, budget: undefined }));
                    }
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="Enter monthly budget"
                  required
                />
                {financialErrors.budget && (
                  <p className="mt-2 text-xs text-error">{financialErrors.budget}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-xs uppercase tracking-wider text-neutral-400">Currency</label>
                <select
                  value={financialForm.currency}
                  onChange={(e) => {
                    const nextCurrency = e.target.value;
                    if (isSupportedCurrency(nextCurrency)) {
                      setFinancialForm((prev) => ({ ...prev, currency: nextCurrency }));
                    }
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="INR" className="bg-neutral-900">INR (₹)</option>
                  <option value="USD" className="bg-neutral-900">USD ($)</option>
                  <option value="EUR" className="bg-neutral-900">EUR (€)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl py-3 font-medium transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Save Financial Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
