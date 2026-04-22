// Mock snapshot data — 18 monthly snapshots for a realistic trajectory
const months = [];
const now = new Date(2026, 3, 1); // Apr 2026
for (let i = 17; i >= 0; i--) {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  months.push(d.toISOString().slice(0, 10));
}

const seed = (n) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const accounts = [
  { id: 'cash-zhao', name: '招商银行活期', category: 'cash', currency: 'CNY', base: 42000, drift: 800, vol: 0.04 },
  { id: 'cash-yuebao', name: '余额宝', category: 'cash', currency: 'CNY', base: 28000, drift: 300, vol: 0.02 },
  { id: 'cash-usd', name: 'HSBC USD 活期', category: 'cash', currency: 'USD', base: 8200, drift: 120, vol: 0.03 },
  { id: 'stock-a', name: '富途 A 股', category: 'stocks', currency: 'CNY', base: 186000, drift: 2800, vol: 0.11 },
  { id: 'stock-us', name: 'IB 美股', category: 'stocks', currency: 'USD', base: 32000, drift: 650, vol: 0.13 },
  { id: 'fund-index', name: '天天基金·宽基', category: 'funds', currency: 'CNY', base: 94000, drift: 1100, vol: 0.06 },
  { id: 'fund-bond', name: '天天基金·债券', category: 'funds', currency: 'CNY', base: 61000, drift: 400, vol: 0.015 },
  { id: 'crypto-btc', name: 'Coinbase BTC', category: 'crypto', currency: 'USD', base: 18000, drift: 900, vol: 0.22 },
  { id: 'crypto-eth', name: 'Coinbase ETH', category: 'crypto', currency: 'USD', base: 9200, drift: 350, vol: 0.24 },
  { id: 'other-pension', name: '企业年金', category: 'other', currency: 'CNY', base: 46000, drift: 600, vol: 0.01 },
  { id: 'other-gold', name: '实物黄金', category: 'other', currency: 'CNY', base: 22000, drift: 180, vol: 0.05 },
];

const fx = { CNY: 1, USD: 7.18, USDT: 7.18 };

const snapshots = months.map((date, i) => {
  const entries = accounts.map((a) => {
    const noise = (seed(i * 31 + a.base) - 0.5) * 2 * a.vol;
    const amount = Math.max(0, a.base + a.drift * i + a.base * noise);
    return {
      accountId: a.id,
      name: a.name,
      category: a.category,
      currency: a.currency,
      amount: Math.round(amount * 100) / 100,
    };
  });
  return { date, entries };
});

export const MOCK_DATA = { accounts, snapshots, fx, baseCurrency: 'CNY' };
