export const stocks = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', price: 138.25, change: 4.82, marketCap: '3.38T', pe: 54.8, description: 'Accelerated computing and AI infrastructure leader.' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 232.11, change: 1.36, marketCap: '3.52T', pe: 37.4, description: 'Consumer technology ecosystem with hardware and services.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', price: 417.88, change: 0.78, marketCap: '3.11T', pe: 34.2, description: 'Cloud, productivity, and enterprise software platform.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance', price: 247.64, change: -0.42, marketCap: '690.4B', pe: 14.7, description: 'Diversified global financial services institution.' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare', price: 812.36, change: 2.95, marketCap: '769.7B', pe: 88.3, description: 'Pharmaceutical company focused on metabolic and immune health.' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', price: 116.42, change: -1.12, marketCap: '497.3B', pe: 15.2, description: 'Integrated energy company spanning upstream and downstream.' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'Consumer', price: 205.35, change: 2.14, marketCap: '2.16T', pe: 42.1, description: 'Global commerce, cloud computing, and advertising platform.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer', price: 348.72, change: -2.31, marketCap: '1.12T', pe: 91.6, description: 'Electric vehicles, energy storage, and mobility software.' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', price: 326.51, change: 0.46, marketCap: '652.6B', pe: 33.8, description: 'Global digital payments network.' },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', price: 523.18, change: -0.86, marketCap: '480.2B', pe: 31.1, description: 'Health benefits and care delivery services.' }
];

export const marketTrend = [
  { label: '09:30', value: 72 }, { label: '10:30', value: 76 }, { label: '11:30', value: 74 },
  { label: '12:30', value: 81 }, { label: '13:30', value: 79 }, { label: '14:30', value: 86 }, { label: '15:30', value: 91 }
];

export const activitySeed = [
  { id: 1, type: 'buy', symbol: 'NVDA', title: 'Added NVIDIA position', detail: '8 shares at $128.40', time: 'Today, 09:42' },
  { id: 2, type: 'sell', symbol: 'JPM', title: 'Reduced JPMorgan position', detail: '4 shares at $249.10', time: 'Yesterday, 15:18' },
  { id: 3, type: 'watch', symbol: 'LLY', title: 'Added to watchlist', detail: 'Healthcare momentum review', time: 'Nov 18, 11:06' }
];

export async function fetchSimulatedStocks() {
  return new Promise((resolve) => setTimeout(() => resolve(stocks), 450));
}
