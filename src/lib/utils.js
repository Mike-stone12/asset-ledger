import { CATEGORIES } from '../data/categories';
import { MOCK_DATA } from '../data/mockData';

const CURRENCY_SYMBOLS = { CNY: '¥', USD: '$', USDT: '₮' };

export const symbolOf = (code) => CURRENCY_SYMBOLS[code] || (code + ' ');

export const toBase = (amount, currency) => amount * (MOCK_DATA.fx[currency] ?? 1);

export const fromBase = (baseAmount, targetCurrency) => baseAmount / (MOCK_DATA.fx[targetCurrency] ?? 1);

export const totalOfSnapshot = (snap) =>
  snap.entries.reduce((acc, e) => acc + toBase(e.amount, e.currency), 0);

export const categoryTotalsOfSnapshot = (snap) => {
  const out = {};
  Object.keys(CATEGORIES).forEach((k) => (out[k] = 0));
  snap.entries.forEach((e) => {
    const cat = CATEGORIES[e.category] ? e.category : 'other';
    out[cat] = (out[cat] || 0) + toBase(e.amount, e.currency);
  });
  return out;
};

export const fmtNum = (n, decimals = 0) => {
  if (n == null || Number.isNaN(n)) return '—';
  const fixed = Number(n).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${withCommas}.${dec}` : withCommas;
};

export const fmtPct = (n, decimals = 2) => {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return sign + Math.abs(n).toFixed(decimals) + '%';
};

export const fmtDate = (iso, style = 'short') => {
  const d = new Date(iso);
  if (style === 'month') {
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  if (style === 'long') {
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const rangeFilter = (snapshots, rangeKey) => {
  if (rangeKey === 'ALL') return snapshots;
  const months = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[rangeKey] ?? 12;
  const cutoff = new Date(snapshots[snapshots.length - 1].date);
  cutoff.setMonth(cutoff.getMonth() - months);
  return snapshots.filter((s) => new Date(s.date) >= cutoff);
};
