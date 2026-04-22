import React from 'react';
import * as echarts from 'echarts';
import Icon from '../components/Icon';
import Sparkline from '../components/Sparkline';
import DeltaPill from '../components/DeltaPill';
import RangeTabs from '../components/RangeTabs';
import KpiMini from '../components/KpiMini';
import { CATEGORIES } from '../data/categories';
import { totalOfSnapshot, categoryTotalsOfSnapshot, rangeFilter, fromBase, symbolOf, fmtNum, fmtDate, fmtPct } from '../lib/utils';

export default function DashboardView(props) {
  if (props.data.snapshots.length === 0) return <EmptyDashboard onNavigate={props.onNavigate} />;
  return <DashboardImpl {...props} />;
}

function EmptyDashboard({ onNavigate }) {
  return (
    <div className="view dashboard">
      <section className="empty-welcome">
        <div className="empty-welcome-icon">
          <Icon name="dashboard" size={32} />
        </div>
        <h2>开始记录你的资产</h2>
        <p>两步即可开始使用：先在「账户管理」里创建你的账户（银行、券商、交易所等），再去「新增快照」录入当前余额。</p>
        <div className="empty-welcome-steps">
          <button className="btn-primary" onClick={() => onNavigate('accounts')}>
            <Icon name="users" size={14} /> 先去添加账户
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('add')}>
            <Icon name="plus" size={14} /> 或直接新增快照
          </button>
        </div>
      </section>
    </div>
  );
}

function DashboardImpl({ data, baseCurrency, onNavigate }) {
  const { snapshots, accounts } = data;
  const [range, setRange] = React.useState('1Y');
  const [visibleCats, setVisibleCats] = React.useState({});

  const filtered = React.useMemo(() => rangeFilter(snapshots, range), [range, snapshots]);
  const latest = snapshots[snapshots.length - 1];
  const prev = snapshots[snapshots.length - 2];
  const latestTotal = totalOfSnapshot(latest);
  const prevTotal = prev ? totalOfSnapshot(prev) : latestTotal;
  const delta = latestTotal - prevTotal;
  const deltaPct = prevTotal ? (delta / prevTotal) * 100 : 0;
  const periodStart = filtered[0];
  const periodDelta = latestTotal - totalOfSnapshot(periodStart);
  const periodPct = (periodDelta / totalOfSnapshot(periodStart)) * 100;

  const chartRef = React.useRef(null);
  const chartInstRef = React.useRef(null);
  const toDisp = (v) => fromBase(v, baseCurrency);

  React.useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    chartInstRef.current = chart;
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      chart.dispose();
      chartInstRef.current = null;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    const chart = chartInstRef.current;
    if (!chart) return;
    const dates = filtered.map(s => s.date);
    const totals = filtered.map(s => toDisp(totalOfSnapshot(s)));

    const activeCats = Object.values(CATEGORIES).filter(c => visibleCats[c.key]);
    const categorySeries = activeCats.map(c => ({
      name: c.label,
      type: 'line',
      data: filtered.map(s => toDisp(categoryTotalsOfSnapshot(s)[c.key])),
      smooth: 0.3,
      showSymbol: false,
      lineStyle: { width: 1.8, color: c.color },
      itemStyle: { color: c.color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: c.color + '33' },
          { offset: 1, color: c.color + '00' },
        ]),
      },
      z: 2,
    }));

    const curSym = symbolOf(baseCurrency);
    chart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 64, right: 24, top: 24, bottom: 32 },
      animation: true, animationDuration: 350,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17, 22, 29, 0.95)',
        borderColor: 'rgba(148, 163, 184, 0.2)', borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontFamily: 'Inter' }, padding: [10, 14],
        formatter: (params) => {
          const i = params[0].dataIndex;
          const snap = filtered[i];
          const total = toDisp(totalOfSnapshot(snap));
          const cats = categoryTotalsOfSnapshot(snap);
          let html = `<div style="font-family:Inter;font-size:11px;color:#94A3B8;margin-bottom:6px">${fmtDate(snap.date, 'month')}</div>`;
          html += `<div style="font-family:JetBrains Mono,monospace;font-size:16px;font-weight:600;color:#F1F5F9;margin-bottom:10px">${curSym}${fmtNum(total)}</div>`;
          html += '<div style="display:grid;grid-template-columns:auto auto;gap:4px 16px;font-size:11px">';
          Object.entries(cats).forEach(([k, v]) => {
            const c = CATEGORIES[k];
            if (!c) return;
            const active = visibleCats[k];
            html += `<div style="display:flex;align-items:center;gap:6px;color:${active ? '#F1F5F9' : '#CBD5E1'};font-weight:${active ? 500 : 400}"><span style="width:6px;height:6px;border-radius:50%;background:${c.color}"></span>${c.label}</div>`;
            html += `<div style="font-family:JetBrains Mono,monospace;color:#E2E8F0;text-align:right">${curSym}${fmtNum(toDisp(v))}</div>`;
          });
          html += '</div>';
          return html;
        },
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(148, 163, 184, 0.3)', type: [4, 4] } },
      },
      xAxis: {
        type: 'category', data: dates, boundaryGap: false,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: {
          color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          formatter: (v) => fmtDate(v, 'month'),
          interval: Math.max(0, Math.floor(dates.length / 8) - 1),
        },
      },
      yAxis: {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)', type: [2, 4] } },
        axisLabel: {
          color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          formatter: (v) => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v,
        },
      },
      series: [
        {
          name: '总资产', type: 'line', data: totals, smooth: 0.3,
          showSymbol: false, symbol: 'circle', symbolSize: 7,
          emphasis: { scale: 1.4 },
          lineStyle: { width: 2.2, color: '#5EEAD4' },
          itemStyle: { color: '#5EEAD4', borderColor: '#0B0F14', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(94, 234, 212, 0.25)' },
              { offset: 1, color: 'rgba(94, 234, 212, 0.0)' },
            ]),
          },
          z: 3,
        },
        ...categorySeries,
      ],
    }, { notMerge: true });
  }, [filtered, visibleCats, baseCurrency]);

  const toggleCat = (k) => setVisibleCats(v => ({ ...v, [k]: !v[k] }));

  const latestCatTotals = categoryTotalsOfSnapshot(latest);
  const prevCatTotals = categoryTotalsOfSnapshot(prev);
  const categoryCards = Object.values(CATEGORIES).map(c => {
    const amount = latestCatTotals[c.key];
    const prevAmount = prevCatTotals[c.key];
    const d = amount - prevAmount;
    const dp = prevAmount ? (d / prevAmount) * 100 : 0;
    const pct = latestTotal ? (amount / latestTotal) * 100 : 0;
    const series = filtered.map(s => categoryTotalsOfSnapshot(s)[c.key]);
    return { ...c, amount, delta: d, deltaPct: dp, pct, series };
  });

  const currencySymbol = symbolOf(baseCurrency);
  const displayTotal = toDisp(latestTotal);
  const displayDelta = toDisp(delta);

  return (
    <div className="view dashboard">
      <section className="kpi-section">
        <div className="kpi-main">
          <div className="kpi-label">净资产总额 · 截至 {fmtDate(latest.date, 'long')}</div>
          <div className="kpi-value">
            <span className="kpi-currency">{currencySymbol}</span>
            <span className="kpi-number">{fmtNum(displayTotal)}</span>
          </div>
          <div className="kpi-meta">
            <DeltaPill value={deltaPct} size="md" />
            <span className="kpi-meta-text">
              较上期 <span className={delta >= 0 ? 'text-pos' : 'text-neg'}>
                {delta >= 0 ? '+' : '−'}{currencySymbol}{fmtNum(Math.abs(displayDelta))}
              </span>
            </span>
            <span className="kpi-divider">·</span>
            <span className="kpi-meta-text">
              {range} 区间 <span className={periodDelta >= 0 ? 'text-pos' : 'text-neg'}>
                {periodDelta >= 0 ? '+' : '−'}{currencySymbol}{fmtNum(Math.abs(toDisp(periodDelta)))}
              </span>
              <span className="muted"> ({fmtPct(periodPct)})</span>
            </span>
          </div>
        </div>
        <div className="kpi-side">
          <KpiMini label="快照总数" value={snapshots.length} unit="条" />
          <KpiMini label="账户数" value={accounts.length} unit="个" />
          <KpiMini label="类别数" value={Object.keys(CATEGORIES).length} unit="项" />
        </div>
      </section>

      <section className="chart-card">
        <div className="chart-head">
          <div>
            <div className="chart-title">净资产走势</div>
            <div className="chart-sub">按月度快照聚合 · 点击下方类别可叠加该类别趋势线</div>
          </div>
          <RangeTabs value={range} onChange={setRange} />
        </div>
        <div ref={chartRef} className="chart-canvas" />
        <div className="chart-legend interactive">
          {Object.values(CATEGORIES).map(c => {
            const active = !!visibleCats[c.key];
            return (
              <button key={c.key}
                className={`legend-item toggle ${active ? 'active' : ''}`}
                onClick={() => toggleCat(c.key)}
                style={active ? { borderColor: c.color, background: c.color + '18', color: c.color } : {}}>
                <span className="legend-dot" style={{ background: active ? c.color : 'transparent', borderColor: c.color }} />
                <span>{c.label}</span>
              </button>
            );
          })}
          <span className="legend-hint muted">点击切换叠加</span>
        </div>
      </section>

      <section className="section-header">
        <div>
          <h2>按类别分布</h2>
          <p>点击卡片查看该类别下的账户明细 · 在详情页可直接修改金额并备注来源</p>
        </div>
      </section>
      <section className="cat-grid">
        {categoryCards.map(c => (
          <button key={c.key} className="cat-card" onClick={() => onNavigate('category', c.key)}>
            <div className="cat-card-head">
              <div className="cat-icon" style={{ color: c.color, background: `${c.color}18` }}>
                <Icon name={c.icon} size={18} />
              </div>
              <div className="cat-card-meta">
                <div className="cat-name">{c.label}</div>
                <div className="cat-pct">占比 {c.pct.toFixed(1)}%</div>
              </div>
              <DeltaPill value={c.deltaPct} size="xs" />
            </div>
            <div className="cat-amount">
              <span className="cat-currency">{currencySymbol}</span>
              <span className="cat-number">{fmtNum(toDisp(c.amount))}</span>
            </div>
            <div className="cat-spark-row">
              <Sparkline values={c.series} positive={c.delta >= 0} width={140} height={32} />
              <div className="cat-delta-text">
                <span className={c.delta >= 0 ? 'text-pos' : 'text-neg'}>
                  {c.delta >= 0 ? '+' : '−'}{currencySymbol}{fmtNum(Math.abs(toDisp(c.delta)))}
                </span>
                <span className="muted">较上期</span>
              </div>
            </div>
            <div className="cat-progress">
              <div className="cat-progress-fill" style={{ width: `${c.pct}%`, background: c.color }} />
            </div>
          </button>
        ))}
      </section>

      <section className="section-header">
        <div>
          <h2>最近快照</h2>
          <p>每次编辑都会在今天生成一条</p>
        </div>
        <button className="btn-ghost" onClick={() => onNavigate('add')}>
          <Icon name="plus" size={14} /> 新增快照
        </button>
      </section>
      <section className="snapshot-list">
        {snapshots.slice(-6).reverse().map((s, i) => {
          const total = totalOfSnapshot(s);
          const prevSnap = snapshots[snapshots.length - 1 - i - 1];
          const prevT = prevSnap ? totalOfSnapshot(prevSnap) : total;
          const d = total - prevT;
          const dp = prevT ? (d / prevT) * 100 : 0;
          return (
            <div key={s.date} className="snap-row">
              <div className="snap-date">
                <Icon name="calendar" size={14} />
                <span>{fmtDate(s.date)}</span>
              </div>
              <div className="snap-accounts muted">{s.entries.length} 个账户</div>
              <div className="snap-total">{currencySymbol}{fmtNum(toDisp(total))}</div>
              <DeltaPill value={dp} size="sm" />
              <button className="btn-icon-ghost" aria-label="查看"><Icon name="chevron_right" size={14} /></button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
