export function getHoldingMetrics(holding, stocks) {
  const stock = stocks.find((item) => item.symbol === holding.symbol);
  const currentPrice = stock?.price ?? holding.purchasePrice;
  const totalValue = currentPrice * holding.quantity;
  const investedValue = holding.purchasePrice * holding.quantity;
  const profitLoss = totalValue - investedValue;
  const profitLossPercent = investedValue ? (profitLoss / investedValue) * 100 : 0;
  return { ...holding, currentPrice, totalValue, investedValue, profitLoss, profitLossPercent, stock };
}

export function calculatePortfolio(holdings, stocks) {
  const metrics = holdings.map((holding) => getHoldingMetrics(holding, stocks));
  const totalValue = metrics.reduce((sum, item) => sum + item.totalValue, 0);
  const totalInvestment = metrics.reduce((sum, item) => sum + item.investedValue, 0);
  return {
    metrics,
    totalValue,
    totalInvestment,
    profitLoss: totalValue - totalInvestment,
    profitLossPercent: totalInvestment ? ((totalValue - totalInvestment) / totalInvestment) * 100 : 0
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
