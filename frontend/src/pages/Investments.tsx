import { useEffect, useRef, useState } from 'react';
import PortfolioGraph from '../components/PortfolioGraph';
import { useAuth } from '../context/AuthContext';

interface PortfolioEntry {
  symbol: string;
  quantity: number;
  price: number;
  purchasePrice?: number;
  totalCost: number;
  totalPurchaseCost?: number;
}

interface PortfolioEditDraft {
  quantity: string;
  price: string;
}

const SYMBOL_HEADER_ALIASES = ['symbol', 'ticker', 'asset', 'name', 'instrument'];
const QUANTITY_HEADER_ALIASES = ['quantity', 'qty', 'amount', 'units', 'shares'];
const PURCHASE_PRICE_HEADER_ALIASES = ['purchaseprice', 'buyprice', 'avgprice', 'cost'];
const CURRENT_PRICE_HEADER_ALIASES = ['currentprice', 'marketprice', 'ltp', 'lastprice', 'price', 'value'];
const PORTFOLIO_STORAGE_KEY_PREFIX = 'portfolio';

function deriveUnitPrice(totalCost: number, quantity: number, fallback = 0) {
  if (quantity === 0) {
    return fallback;
  }

  return totalCost / quantity;
}

function normalizePortfolioEntry(entry: {
  symbol: string;
  quantity: number;
  price: number;
  purchasePrice?: number;
  totalCost?: number;
  totalPurchaseCost?: number;
}): PortfolioEntry {
  const symbol = entry.symbol.trim();
  const quantity = entry.quantity;
  const totalCost = entry.totalCost ?? quantity * entry.price;
  const price = deriveUnitPrice(totalCost, quantity, entry.price);

  const totalPurchaseCost =
    entry.totalPurchaseCost ??
    (entry.purchasePrice !== undefined ? quantity * entry.purchasePrice : undefined);

  const purchasePrice =
    totalPurchaseCost !== undefined
      ? deriveUnitPrice(totalPurchaseCost, quantity, entry.purchasePrice ?? 0)
      : undefined;

  return {
    symbol,
    quantity,
    price,
    totalCost,
    ...(purchasePrice !== undefined ? { purchasePrice } : {}),
    ...(totalPurchaseCost !== undefined ? { totalPurchaseCost } : {}),
  };
}

function toPortfolioEntry(raw: unknown): PortfolioEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  if (typeof candidate.symbol !== 'string') {
    return null;
  }

  const quantity = Number(candidate.quantity);
  const price = Number(candidate.price);

  if (!Number.isFinite(quantity) || !Number.isFinite(price)) {
    return null;
  }

  const purchasePrice =
    candidate.purchasePrice !== undefined ? Number(candidate.purchasePrice) : undefined;
  const totalCost = candidate.totalCost !== undefined ? Number(candidate.totalCost) : undefined;
  const totalPurchaseCost =
    candidate.totalPurchaseCost !== undefined ? Number(candidate.totalPurchaseCost) : undefined;

  if (
    (purchasePrice !== undefined && !Number.isFinite(purchasePrice)) ||
    (totalCost !== undefined && !Number.isFinite(totalCost)) ||
    (totalPurchaseCost !== undefined && !Number.isFinite(totalPurchaseCost))
  ) {
    return null;
  }

  return normalizePortfolioEntry({
    symbol: candidate.symbol,
    quantity,
    price,
    ...(purchasePrice !== undefined ? { purchasePrice } : {}),
    ...(totalCost !== undefined ? { totalCost } : {}),
    ...(totalPurchaseCost !== undefined ? { totalPurchaseCost } : {}),
  });
}

function mergePortfolioEntries(existing: PortfolioEntry[], incoming: PortfolioEntry[]) {
  const mergedMap = new Map<string, PortfolioEntry>();

  for (const entry of existing) {
    const key = entry.symbol.trim().toLowerCase();
    if (!key) {
      continue;
    }
    mergedMap.set(key, normalizePortfolioEntry(entry));
  }

  for (const entry of incoming) {
    const key = entry.symbol.trim().toLowerCase();
    if (!key) {
      continue;
    }

    const normalizedEntry = normalizePortfolioEntry(entry);

    const current = mergedMap.get(key);

    if (!current) {
      mergedMap.set(key, normalizedEntry);
      continue;
    }

    const newTotalQuantity = current.quantity + normalizedEntry.quantity;
    const newTotalCost = current.totalCost + normalizedEntry.totalCost;
    const newPrice = deriveUnitPrice(newTotalCost, newTotalQuantity, normalizedEntry.price);

    const currentTotalPurchaseCost =
      current.totalPurchaseCost ??
      (current.purchasePrice !== undefined ? current.quantity * current.purchasePrice : undefined);

    const incomingTotalPurchaseCost =
      normalizedEntry.totalPurchaseCost ??
      (normalizedEntry.purchasePrice !== undefined
        ? normalizedEntry.quantity * normalizedEntry.purchasePrice
        : undefined);

    const hasPurchaseCost =
      currentTotalPurchaseCost !== undefined || incomingTotalPurchaseCost !== undefined;

    const newTotalPurchaseCost = hasPurchaseCost
      ? (currentTotalPurchaseCost ?? 0) + (incomingTotalPurchaseCost ?? 0)
      : undefined;

    const newPurchasePrice =
      newTotalPurchaseCost !== undefined
        ? deriveUnitPrice(newTotalPurchaseCost, newTotalQuantity, 0)
        : undefined;

    mergedMap.set(key, {
      ...normalizePortfolioEntry({
        symbol: current.symbol,
        quantity: newTotalQuantity,
        price: newPrice,
        totalCost: newTotalCost,
        ...(newPurchasePrice !== undefined ? { purchasePrice: newPurchasePrice } : {}),
        ...(newTotalPurchaseCost !== undefined
          ? { totalPurchaseCost: newTotalPurchaseCost }
          : {}),
      }),
    });
  }

  return Array.from(mergedMap.values());
}

function normalizeHeader(header: string) {
  return header.toLowerCase().trim().replace(/[\s_-]+/g, '');
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
}

function parsePortfolioCsv(csvText: string): PortfolioEntry[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0]
    .split(',')
    .map((header) => header.trim().toLowerCase().replace(/^\ufeff/, ''));

  console.log('Detected headers:', headers);

  const symbolIndex = findHeaderIndex(headers, SYMBOL_HEADER_ALIASES);
  const quantityIndex = findHeaderIndex(headers, QUANTITY_HEADER_ALIASES);
  const purchasePriceIndex = findHeaderIndex(headers, PURCHASE_PRICE_HEADER_ALIASES);
  const currentPriceIndex = findHeaderIndex(headers, CURRENT_PRICE_HEADER_ALIASES);

  if (
    symbolIndex === -1 ||
    quantityIndex === -1 ||
    (purchasePriceIndex === -1 && currentPriceIndex === -1)
  ) {
    throw new Error('CSV must include Symbol, Quantity, and Price columns');
  }

  const parsedRows: PortfolioEntry[] = [];

  for (const line of lines.slice(1)) {
    const values = line.split(',').map((value) => value.trim());

    if (values.every((value) => value === '')) {
      continue;
    }

    const symbol = values[symbolIndex] ?? '';
    const quantityRaw = values[quantityIndex] ?? '';
    const purchasePriceRaw = purchasePriceIndex !== -1 ? values[purchasePriceIndex] ?? '' : '';
    const currentPriceRaw = currentPriceIndex !== -1 ? values[currentPriceIndex] ?? '' : '';

    const quantity = Number(quantityRaw);
    const purchasePrice = purchasePriceRaw ? Number(purchasePriceRaw) : undefined;
    const currentPrice = currentPriceRaw ? Number(currentPriceRaw) : undefined;
    const price = currentPrice ?? purchasePrice;

    if (
      !symbol ||
      Number.isNaN(quantity) ||
      (purchasePrice !== undefined && Number.isNaN(purchasePrice)) ||
      (currentPrice !== undefined && Number.isNaN(currentPrice)) ||
      price === undefined ||
      Number.isNaN(price)
    ) {
      throw new Error('Invalid data row found in CSV.');
    }

    const totalCost = quantity * price;
    const totalPurchaseCost =
      purchasePrice !== undefined ? quantity * purchasePrice : undefined;

    parsedRows.push(normalizePortfolioEntry({
      symbol,
      quantity,
      price,
      totalCost,
      ...(purchasePrice !== undefined ? { purchasePrice } : {}),
      ...(totalPurchaseCost !== undefined ? { totalPurchaseCost } : {}),
    }));
  }

  return parsedRows;
}

export default function Investments() {
  const { user, isLoading } = useAuth();
  const [selectedCsvName, setSelectedCsvName] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [editingSymbolKey, setEditingSymbolKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PortfolioEditDraft | null>(null);
  const [hasHydratedPortfolio, setHasHydratedPortfolio] = useState(false);
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const userId = user?._id ?? user?.id ?? null;
  const portfolioStorageKey = userId
    ? `${PORTFOLIO_STORAGE_KEY_PREFIX}_${userId}`
    : null;
  const totalPortfolioValue = portfolio.reduce(
    (sum, entry) => sum + entry.totalCost,
    0
  );
  const totalPnl = portfolio.reduce((sum, entry) => {
    const purchaseTotal =
      entry.totalPurchaseCost ??
      (entry.purchasePrice !== undefined ? entry.quantity * entry.purchasePrice : undefined);

    if (purchaseTotal === undefined) {
      return sum;
    }

    return sum + (entry.totalCost - purchaseTotal);
  }, 0);
  const hasPnlData = portfolio.some(
    (entry) => entry.totalPurchaseCost !== undefined || entry.purchasePrice !== undefined
  );

  const formatInr = (value: number) =>
    `₹${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatNumber = (value: number) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  const getPnlColorClass = (value: number) => {
    if (value > 0) {
      return 'text-green-400';
    }
    if (value < 0) {
      return 'text-red-400';
    }
    return 'text-neutral-400';
  };

  const getEntryKey = (symbol: string) => symbol.trim().toLowerCase();

  const getDerivedPrice = (entry: PortfolioEntry) =>
    deriveUnitPrice(entry.totalCost, entry.quantity, entry.price);

  const getDerivedPurchasePrice = (entry: PortfolioEntry) => {
    const totalPurchaseCost =
      entry.totalPurchaseCost ??
      (entry.purchasePrice !== undefined ? entry.quantity * entry.purchasePrice : undefined);

    if (totalPurchaseCost === undefined) {
      return undefined;
    }

    return deriveUnitPrice(totalPurchaseCost, entry.quantity, entry.purchasePrice ?? 0);
  };

  const handleStartEdit = (entry: PortfolioEntry) => {
    const derivedPrice = getDerivedPrice(entry);

    setEditingSymbolKey(getEntryKey(entry.symbol));
    setEditDraft({
      quantity: String(entry.quantity),
      price: String(derivedPrice),
    });
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingSymbolKey(null);
    setEditDraft(null);
    setEditError(null);
  };

  const handleSaveEdit = (entryKey: string) => {
    if (!editDraft) {
      return;
    }

    const nextQuantity = Number(editDraft.quantity);
    const nextPrice = Number(editDraft.price);

    if (
      Number.isNaN(nextQuantity) ||
      Number.isNaN(nextPrice) ||
      nextQuantity < 0 ||
      nextPrice < 0
    ) {
      setEditError('Quantity and price must be valid non-negative numbers.');
      return;
    }

    setPortfolio((prevPortfolio) =>
      prevPortfolio.map((entry) =>
        getEntryKey(entry.symbol) === entryKey
          ? (() => {
              const nextTotalCost = nextQuantity * nextPrice;
              const existingPurchasePrice = getDerivedPurchasePrice(entry);
              const nextTotalPurchaseCost =
                existingPurchasePrice !== undefined
                  ? nextQuantity * existingPurchasePrice
                  : undefined;

              return normalizePortfolioEntry({
                ...entry,
                quantity: nextQuantity,
                price: nextPrice,
                totalCost: nextTotalCost,
                ...(nextTotalPurchaseCost !== undefined
                  ? { totalPurchaseCost: nextTotalPurchaseCost }
                  : {}),
              });
            })()
          : entry
      )
    );

    handleCancelEdit();
  };

  const handleDeleteEntry = (entryKey: string) => {
    setPortfolio((prevPortfolio) =>
      prevPortfolio.filter((entry) => getEntryKey(entry.symbol) !== entryKey)
    );

    if (editingSymbolKey === entryKey) {
      handleCancelEdit();
    }
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setHydratedStorageKey(null);

    if (!portfolioStorageKey) {
      setPortfolio([]);
      setHasHydratedPortfolio(false);
      return;
    }

    const saved = localStorage.getItem(portfolioStorageKey);

    if (!saved) {
      setHasHydratedPortfolio(true);
      setHydratedStorageKey(portfolioStorageKey);
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        throw new Error('Invalid portfolio payload');
      }

      const hydratedPortfolio = parsed
        .map((rawEntry) => toPortfolioEntry(rawEntry))
        .filter((entry): entry is PortfolioEntry => entry !== null);

      setPortfolio(hydratedPortfolio);
    } catch {
      localStorage.removeItem(portfolioStorageKey);
      setPortfolio([]);
    } finally {
      setHasHydratedPortfolio(true);
      setHydratedStorageKey(portfolioStorageKey);
    }
  }, [isLoading, portfolioStorageKey]);

  useEffect(() => {
    if (
      isLoading ||
      !hasHydratedPortfolio ||
      !portfolioStorageKey ||
      hydratedStorageKey !== portfolioStorageKey
    ) {
      return;
    }

    localStorage.setItem(portfolioStorageKey, JSON.stringify(portfolio));
  }, [hasHydratedPortfolio, hydratedStorageKey, isLoading, portfolio, portfolioStorageKey]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isCsvFile =
      file.name.toLowerCase().endsWith('.csv') ||
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel';

    if (!isCsvFile) {
      setCsvError('Please select a valid CSV file.');
      setSelectedCsvName(null);
      setPortfolio([]);
      event.target.value = '';
      return;
    }

    setSelectedCsvName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const csvText = typeof reader.result === 'string' ? reader.result : '';
        const parsedPortfolio = parsePortfolioCsv(csvText);

        setPortfolio((prevPortfolio) => mergePortfolioEntries(prevPortfolio, parsedPortfolio));
        setCsvError(null);
        console.log('Parsed portfolio data:', parsedPortfolio);
      } catch (error) {
        setPortfolio([]);
        if (error instanceof Error) {
          setCsvError(error.message);
          return;
        }
        setCsvError('Failed to parse CSV file. Please ensure the format is valid.');
      }
    };

    reader.onerror = () => {
      setPortfolio([]);
      setCsvError('Unable to read CSV file. Please try again.');
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen">
      <div className="p-12 max-w-[1600px] mx-auto">
        <section className="min-h-[70vh] flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold font-headline text-white">No investments yet</h2>
            <p className="mt-3 text-neutral-400">
              Start building your portfolio by adding or importing assets
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl font-medium transition-all hover:brightness-110">
                Add Investment
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                className="px-5 py-2.5 bg-white/10 border border-white/15 text-white rounded-xl font-medium transition-all hover:bg-white/15"
              >
                Import CSV
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvFileSelect}
            />
            {selectedCsvName && !csvError && (
              <p className="mt-3 text-sm text-neutral-400">Selected file: {selectedCsvName}</p>
            )}
            {csvError && <p className="mt-3 text-sm text-error">{csvError}</p>}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Portfolio Preview</h3>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">Total: {formatInr(totalPortfolioValue)}</p>
                  <p className={`text-sm font-medium ${hasPnlData ? getPnlColorClass(totalPnl) : 'text-neutral-400'}`}>
                    Total P&amp;L: {hasPnlData ? formatInr(totalPnl) : '—'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs uppercase tracking-wider text-neutral-400 border-b border-white/10 pb-2 mb-3 mt-4">
                <span className="w-1/6">Symbol</span>
                <span className="w-1/6 text-right">Quantity</span>
                <span className="w-1/6 text-right">Price</span>
                <span className="w-1/6 text-right">Value</span>
                <span className="w-1/6 text-right">P&amp;L</span>
                <span className="w-1/6 text-right">Actions</span>
              </div>

              {editError && (
                <p className="mb-3 text-sm text-error text-right">{editError}</p>
              )}

              {portfolio.length === 0 ? (
                <p className="py-4 text-sm text-neutral-400 text-center">No data loaded</p>
              ) : (
                <div>
                  {portfolio.map((entry, index) => {
                    const entryKey = getEntryKey(entry.symbol);
                    const isEditing = editingSymbolKey === entryKey;
                    const derivedEntryPrice = getDerivedPrice(entry);
                    const derivedPurchasePrice = getDerivedPurchasePrice(entry);
                    const draftQuantity = isEditing && editDraft ? Number(editDraft.quantity) : entry.quantity;
                    const draftPrice = isEditing && editDraft ? Number(editDraft.price) : derivedEntryPrice;
                    const hasValidDraft = Number.isFinite(draftQuantity) && Number.isFinite(draftPrice);
                    const effectiveQuantity = hasValidDraft ? draftQuantity : entry.quantity;
                    const effectivePrice = hasValidDraft ? draftPrice : derivedEntryPrice;
                    const rowValue = effectiveQuantity * effectivePrice;
                    const rowPnl =
                      derivedPurchasePrice !== undefined
                        ? (effectivePrice - derivedPurchasePrice) * effectiveQuantity
                        : null;

                    return (
                      <div
                        key={`${entry.symbol}-${index}`}
                        className="flex justify-between items-center py-3 border-b border-white/5 hover:bg-white/5 rounded-lg px-2 transition-all"
                      >
                        <span className="w-1/6 font-semibold text-white">{entry.symbol}</span>
                        <span className="w-1/6 text-right text-neutral-300">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editDraft?.quantity ?? ''}
                              onChange={(e) =>
                                setEditDraft((prev) => ({
                                  quantity: e.target.value,
                                  price: prev?.price ?? String(derivedEntryPrice),
                                }))
                              }
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                          ) : (
                            formatNumber(entry.quantity)
                          )}
                        </span>
                        <span className="w-1/6 text-right text-neutral-300">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editDraft?.price ?? ''}
                              onChange={(e) =>
                                setEditDraft((prev) => ({
                                  quantity: prev?.quantity ?? String(entry.quantity),
                                  price: e.target.value,
                                }))
                              }
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                          ) : (
                            formatNumber(derivedEntryPrice)
                          )}
                        </span>
                        <span className="w-1/6 text-right text-violet-300 font-medium">
                          {formatNumber(rowValue)}
                        </span>
                        <span
                          className={`w-1/6 text-right ${
                            rowPnl === null ? 'text-neutral-400' : getPnlColorClass(rowPnl)
                          }`}
                        >
                          {rowPnl === null ? '—' : formatInr(rowPnl)}
                        </span>

                        <span className="w-1/6 flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(entryKey)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-gradient-to-r from-violet-500 to-blue-500 rounded-md hover:brightness-110 transition-all"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-2.5 py-1 text-xs font-medium text-neutral-300 bg-white/10 border border-white/10 rounded-md hover:bg-white/15 transition-all"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(entry)}
                                className="px-2.5 py-1 text-xs font-medium text-neutral-200 bg-white/10 border border-white/10 rounded-md hover:bg-white/15 transition-all"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entryKey)}
                                className="px-2.5 py-1 text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-all"
                                aria-label={`Delete ${entry.symbol}`}
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6">
              <PortfolioGraph portfolio={portfolio} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
