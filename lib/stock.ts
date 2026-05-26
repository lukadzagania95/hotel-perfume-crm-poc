export type StockInput = {
  originalProductStock: number;
  currentProductStock: number;
  originalSampleStock: number;
  currentSampleStock: number;
};

export type StockStatus = {
  label: "Full Stock" | "Part Stock" | "Low Stock" | "No Stock";
  tone: "green" | "amber" | "red" | "slate";
  percentRemaining: number;
};

export function clampStockValue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function calculateStockStatus(stock: StockInput): StockStatus {
  const currentTotal =
    clampStockValue(stock.currentProductStock) + clampStockValue(stock.currentSampleStock);
  const originalTotal =
    clampStockValue(stock.originalProductStock) + clampStockValue(stock.originalSampleStock);

  if (currentTotal === 0) {
    return { label: "No Stock", tone: "slate", percentRemaining: 0 };
  }

  if (originalTotal === 0) {
    return { label: "Part Stock", tone: "amber", percentRemaining: 100 };
  }

  const percentRemaining = Math.round((currentTotal / originalTotal) * 100);

  if (
    stock.currentProductStock === stock.originalProductStock &&
    stock.currentSampleStock === stock.originalSampleStock
  ) {
    return { label: "Full Stock", tone: "green", percentRemaining };
  }

  if (percentRemaining > 50) {
    return { label: "Part Stock", tone: "amber", percentRemaining };
  }

  return { label: "Low Stock", tone: "red", percentRemaining };
}
