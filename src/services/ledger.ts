import type { LedgerEntry } from "../contracts/voyage";
export function ledgerSummary(entries: LedgerEntry[]) {
  const sum = (fn: (e: LedgerEntry) => number) =>
    entries.reduce((n, e) => n + fn(e), 0);
  const purchaseSpend = -sum((e) => (e.kind === "buy" ? e.cashDelta : 0)),
    salesRevenue = sum((e) => (e.kind === "sell" ? e.cashDelta : 0)),
    travelExpenses = -sum((e) => (e.kind === "travel" ? e.cashDelta : 0)),
    tradingProfit = sum((e) => (e.kind === "sell" ? e.realizedProfit : 0));
  return {
    purchaseSpend,
    salesRevenue,
    travelExpenses,
    tradingProfit,
    netRealizedProfit: tradingProfit - travelExpenses,
    taxes: sum((e) => e.tax),
    cashFlow: sum((e) => e.cashDelta),
  };
}
