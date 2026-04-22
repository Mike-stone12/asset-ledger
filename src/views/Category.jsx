import React from 'react';
import * as echarts from 'echarts';
import Icon from '../components/Icon';
import Sparkline from '../components/Sparkline';
import DeltaPill from '../components/DeltaPill';
import RangeTabs from '../components/RangeTabs';
import KpiMini from '../components/KpiMini';
import { CATEGORIES } from '../data/categories';
import { MOCK_DATA } from '../data/mockData';
import { totalOfSnapshot, categoryTotalsOfSnapshot, rangeFilter, toBase, fromBase, symbolOf, fmtNum, fmtDate } from '../lib/utils';

export default function CategoryView(props) {
  if (props.data.snapshots.length === 0) {
    return (
      <div className="view category-view">
        <section className="empty-state" style={{ padding: 64, background: 'var(--bg-elev)', borderRadius: 12 }}>
          <Icon name="folder" size={32} />
          <div>还没有任何快照，先去「新增快照」录入</div>
          <button className="btn-primary" onClick={() => props.onNavigate('add')}>
            <Icon name="plus" size={14} /> 新增快照
          </button>
        </section>
      </div>
    );
  }
  return <CategoryImpl {...props} />;
}

function CategoryImpl({ data, categoryKey, baseCurrency, onNavigate, appendSnapshot, removeUserSnapshot }) {
  const { snapshots, userSnapshots } = data;
  const fx = MOCK_DATA.fx;
  const cat = CATEGORIES[categoryKey];
  const [range, setRange] = React.useState('1Y');
  const [expandedId, setExpandedId] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null);
  const [editAmount, setEditAmount] = React.useState('');
  const [editComment, setEditComment] = React.useState('');
  const [toast, setToast] = React.useState(null);
  const inputRef = React.useRef(null);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = rangeFilter(snapshots, range);
  const latest = snapshots[snapshots.length - 1];
  const prev = snapshots[snapshots.length - 2];

  const accountsInCat = latest.entries.filter(e => e.category === categoryKey);
  const prevLookup = prev ? Object.fromEntries(prev.entries.map(e => [e.accountId, e])) : {};

  const todayNotes = new Map();
  if (latest.date === today && latest.notes) {
    latest.notes.forEach(n => todayNotes.set(n.accountId, n));
  }

  const latestCatTotal = categoryTotalsOfSnapshot(latest)[categoryKey];
  const prevCatTotal = prev ? categoryTotalsOfSnapshot(prev)[categoryKey] : latestCatTotal;
  const delta = latestCatTotal - prevCatTotal;
  const deltaPct = prevCatTotal ? (delta / prevCatTotal) * 100 : 0;

  const accountRows = accountsInCat.map(a => {
    const amountBase = toBase(a.amount, a.currency);
    const prevEntry = prevLookup[a.accountId];
    const prevBase = prevEntry ? toBase(prevEntry.amount, prevEntry.currency) : amountBase;
    const d = amountBase - prevBase;
    const dp = prevBase ? (d / prevBase) * 100 : 0;
    const pct = latestCatTotal ? (amountBase / latestCatTotal) * 100 : 0;
    const series = filtered.map(s => {
      const e = s.entries.find(x => x.accountId === a.accountId);
      return e ? toBase(e.amount, e.currency) : 0;
    });
    const editMeta = todayNotes.get(a.accountId);
    return { ...a, amountBase, delta: d, deltaPct: dp, pct, series, editMeta };
  }).sort((x, y) => y.amountBase - x.amountBase);

  const catTotalsByDate = filtered.map(s => categoryTotalsOfSnapshot(s)[categoryKey]);

  const startEdit = (a) => {
    setEditingId(a.accountId);
    setEditAmount(String(a.amount));
    setEditComment(todayNotes.get(a.accountId)?.comment || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const cancelEdit = () => { setEditingId(null); setEditAmount(''); setEditComment(''); };

  const saveEdit = (a) => {
    const n = parseFloat(editAmount);
    if (!isFinite(n) || n < 0) return;
    const baseSnap = (userSnapshots.find(s => s.date === today)) || latest;
    const entries = baseSnap.entries.map(e => e.accountId === a.accountId ? { ...e, amount: n } : e);
    const existingNotes = (baseSnap.notes || []).filter(x => x.accountId !== a.accountId);
    const newNote = {
      accountId: a.accountId,
      comment: editComment.trim() || undefined,
      editedAt: new Date().toISOString(),
      prevAmount: a.amount,
    };
    appendSnapshot({ date: today, entries, notes: [...existingNotes, newNote] });
    setToast(`✓ ${a.name} 已更新 · 今日新快照${editComment.trim() ? ' · 备注已记录' : ''}`);
    setTimeout(() => setToast(null), 2400);
    cancelEdit();
  };

  const clearEdit = (accountId) => {
    const todaySnap = userSnapshots.find(s => s.date === today);
    if (!todaySnap) return;
    const remainingNotes = (todaySnap.notes || []).filter(n => n.accountId !== accountId);
    if (remainingNotes.length === 0) {
      removeUserSnapshot(today);
    } else {
      const priorIdx = snapshots.findIndex(s => s.date === today) - 1;
      const priorSnap = priorIdx >= 0 ? snapshots[priorIdx] : null;
      const priorEntry = priorSnap?.entries.find(e => e.accountId === accountId);
      const entries = todaySnap.entries.map(e =>
        e.accountId === accountId && priorEntry ? { ...e, amount: priorEntry.amount } : e
      );
      appendSnapshot({ date: today, entries, notes: remainingNotes });
    }
    setToast('已还原至上一快照值');
    setTimeout(() => setToast(null), 1600);
  };

  const chartRef = React.useRef(null);
  React.useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    const dates = filtered.map(s => s.date);
    const curSym = symbolOf(baseCurrency);
    chart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 60, right: 24, top: 20, bottom: 32 },
      tooltip: {
        trigger: 'axis', backgroundColor: 'rgba(17, 22, 29, 0.95)',
        borderColor: 'rgba(148, 163, 184, 0.2)', borderWidth: 1,
        textStyle: { color: '#E2E8F0' },
        formatter: (params) => {
          const p = params[0];
          const disp = fromBase(p.data, baseCurrency);
          return `<div style="font-size:11px;color:#94A3B8;margin-bottom:4px">${fmtDate(p.axisValue, 'month')}</div>
            <div style="font-family:JetBrains Mono,monospace;font-size:14px;font-weight:600;color:#F1F5F9">${curSym}${fmtNum(disp)}</div>`;
        },
      },
      xAxis: {
        type: 'category', data: dates, boundaryGap: false,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: {
          color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          formatter: v => fmtDate(v, 'month'),
          interval: Math.max(0, Math.floor(dates.length / 8) - 1),
        },
      },
      yAxis: {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)', type: [2, 4] } },
        axisLabel: {
          color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          formatter: v => {
            const d = fromBase(v, baseCurrency);
            return d >= 1e6 ? (d / 1e6).toFixed(1) + 'M' : d >= 1e3 ? (d / 1e3).toFixed(0) + 'K' : Math.round(d);
          },
        },
      },
      series: [{
        type: 'line', data: catTotalsByDate, smooth: 0.3, showSymbol: false,
        lineStyle: { width: 2, color: cat.color },
        itemStyle: { color: cat.color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: cat.color + '40' }, { offset: 1, color: cat.color + '00' },
          ]),
        },
      }],
    });
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => { chart.dispose(); window.removeEventListener('resize', handleResize); };
  }, [range, categoryKey, baseCurrency, snapshots]);

  const symbol = symbolOf(baseCurrency);
  const displayCatTotal = fromBase(latestCatTotal, baseCurrency);
  const displayDelta = fromBase(delta, baseCurrency);

  return (
    <div className="view category-view">
      <section className="kpi-section">
        <div className="kpi-main">
          <div className="kpi-label-row">
            <div className="cat-icon-lg" style={{ color: cat.color, background: `${cat.color}18` }}>
              <Icon name={cat.icon} size={22} />
            </div>
            <div>
              <div className="kpi-label">{cat.label} 总额 · {latest.date}{latest.date === today ? '（含今日编辑）' : ''}</div>
              <div className="kpi-value">
                <span className="kpi-currency">{symbol}</span>
                <span className="kpi-number">{fmtNum(displayCatTotal)}</span>
              </div>
            </div>
          </div>
          <div className="kpi-meta">
            <DeltaPill value={deltaPct} size="md" />
            <span className="kpi-meta-text">较上期 <span className={delta >= 0 ? 'text-pos' : 'text-neg'}>
              {delta >= 0 ? '+' : '−'}{symbol}{fmtNum(Math.abs(displayDelta))}
            </span></span>
            <span className="kpi-divider">·</span>
            <span className="kpi-meta-text">{accountRows.length} 个账户</span>
          </div>
        </div>
        <div className="kpi-side">
          <KpiMini label="占总资产" value={((latestCatTotal / totalOfSnapshot(latest)) * 100).toFixed(1)} unit="%" />
          <KpiMini label="最大账户" value={accountRows[0] ? ((accountRows[0].amountBase / latestCatTotal) * 100).toFixed(0) : 0} unit="%" />
        </div>
      </section>

      <section className="chart-card">
        <div className="chart-head">
          <div>
            <div className="chart-title">{cat.label} 走势</div>
            <div className="chart-sub">点击下方金额修改 · 编辑会以今天为日期新增一条快照</div>
          </div>
          <RangeTabs value={range} onChange={setRange} />
        </div>
        <div ref={chartRef} className="chart-canvas" style={{ height: 280 }} />
      </section>

      <section className="section-header">
        <div>
          <h2>账户明细</h2>
          <p>悬停金额出现笔形图标 · 点击编辑，可选填备注注明来源</p>
        </div>
      </section>
      <section className="account-table">
        <div className="table-head">
          <div>账户</div>
          <div>币种</div>
          <div className="r">当前金额</div>
          <div className="r">占比</div>
          <div className="r">较上期</div>
          <div>趋势</div>
          <div></div>
        </div>
        {accountRows.map(a => {
          const isEditing = editingId === a.accountId;
          const isExpanded = expandedId === a.accountId;
          return (
            <React.Fragment key={a.accountId}>
              <div className={`table-row ${isExpanded ? 'expanded' : ''} ${a.editMeta ? 'edited' : ''}`}>
                <div className="col-account clickable" onClick={() => !isEditing && setExpandedId(isExpanded ? null : a.accountId)}>
                  <span className="cat-dot" style={{ background: cat.color }} />
                  <span className="account-name">{a.name}</span>
                  {a.editMeta && (
                    <span className="edited-badge" title={a.editMeta.comment || '今日已更新'}>
                      <Icon name="sparkles" size={10} />
                      <span>今日已改</span>
                    </span>
                  )}
                </div>
                <div className="col-currency mono muted">{a.currency}</div>
                <div className="r">
                  <button className={`amount-cell ${isEditing ? 'active' : ''}`} onClick={() => isEditing ? cancelEdit() : startEdit(a)} title="点击修改金额">
                    <div className="amount-cell-stack">
                      <span className="mono strong">{symbol}{fmtNum(fromBase(a.amountBase, baseCurrency))}</span>
                      {a.currency !== baseCurrency && (
                        <span className="mono fx-sub">{a.currency} {fmtNum(a.amount)}</span>
                      )}
                    </div>
                    <span className="amount-edit-hint"><Icon name="sparkles" size={11} /></span>
                  </button>
                </div>
                <div className="r mono muted">{a.pct.toFixed(1)}%</div>
                <div className="r">
                  <span className={`mono ${a.delta >= 0 ? 'text-pos' : 'text-neg'}`}>
                    {a.delta >= 0 ? '+' : '−'}{symbol}{fmtNum(Math.abs(fromBase(a.delta, baseCurrency)))}
                  </span>
                </div>
                <div><Sparkline values={a.series} positive={a.delta >= 0} width={100} height={24} /></div>
                <div>
                  <button className="btn-icon-ghost" onClick={() => !isEditing && setExpandedId(isExpanded ? null : a.accountId)}>
                    <Icon name="chevron_down" size={14} className={`chev ${isExpanded ? 'open' : ''}`} />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="edit-panel">
                  <div className="edit-panel-grid">
                    <div className="edit-field">
                      <label>金额 ({a.currency})</label>
                      <input ref={inputRef} className="fi mono" type="number" step="0.01"
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(a); if (e.key === 'Escape') cancelEdit(); }} />
                      {a.currency !== 'CNY' && (
                        <div className="fx-hint">
                          ≈ ¥{fmtNum((parseFloat(editAmount) || 0) * (fx[a.currency] || 1), 2)}
                          <span className="muted"> · 汇率 1 {a.currency} = ¥{fx[a.currency]}</span>
                        </div>
                      )}
                    </div>
                    <div className="edit-field">
                      <label>备注来源（可选）</label>
                      <input className="fi" type="text" placeholder="例如：月末工资入账 / 卖出 100 股 AAPL / 房租收入..."
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(a); if (e.key === 'Escape') cancelEdit(); }} />
                    </div>
                    <div className="edit-info">
                      <div className="edit-info-row">
                        <span className="muted">原值</span>
                        <span className="mono">{a.currency} {fmtNum(a.amount)}</span>
                      </div>
                      <div className="edit-info-row">
                        <span className="muted">新值</span>
                        <span className="mono strong">{a.currency} {fmtNum(parseFloat(editAmount) || 0)}</span>
                      </div>
                      <div className="edit-info-row">
                        <span className="muted">差额</span>
                        {(() => {
                          const diff = (parseFloat(editAmount) || 0) - a.amount;
                          return <span className={`mono ${diff >= 0 ? 'text-pos' : 'text-neg'}`}>
                            {diff >= 0 ? '+' : '−'}{a.currency} {fmtNum(Math.abs(diff))}
                          </span>;
                        })()}
                      </div>
                      {a.currency !== 'CNY' && (
                        <div className="edit-info-row">
                          <span className="muted">折算 CNY</span>
                          <span className="mono strong">¥{fmtNum((parseFloat(editAmount) || 0) * (fx[a.currency] || 1))}</span>
                        </div>
                      )}
                    </div>
                    <div className="edit-actions">
                      <button className="btn-ghost" onClick={cancelEdit}>取消</button>
                      <button className="btn-primary" onClick={() => saveEdit(a)}>
                        <Icon name="check" size={12} /> 保存
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isExpanded && !isEditing && (
                <div className="table-expanded">
                  {a.editMeta && (
                    <div className="edit-trace">
                      <div className="trace-icon"><Icon name="sparkles" size={12} /></div>
                      <div className="trace-body">
                        <div className="trace-title">
                          {fmtDate(a.editMeta.editedAt)} 今日快照新增
                          <span className="muted"> · {a.currency} {fmtNum(a.editMeta.prevAmount)} → {fmtNum(a.amount)}</span>
                        </div>
                        {a.editMeta.comment && <div className="trace-comment">"{a.editMeta.comment}"</div>}
                      </div>
                      <button className="btn-ghost" onClick={() => clearEdit(a.accountId)}>
                        <Icon name="refresh" size={12} /> 还原
                      </button>
                    </div>
                  )}
                  <div className="exp-title">历史快照 · {a.name}</div>
                  <div className="exp-grid">
                    {snapshots.slice().reverse().map(s => {
                      const e = s.entries.find(x => x.accountId === a.accountId);
                      if (!e) return null;
                      return (
                        <div key={s.date} className="exp-row">
                          <span className="mono muted">{fmtDate(s.date, 'month')}</span>
                          <span className="mono">{a.currency} {fmtNum(e.amount)}</span>
                          <span className="mono muted">≈ ¥{fmtNum(toBase(e.amount, e.currency))}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
