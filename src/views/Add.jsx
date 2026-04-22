import React from 'react';
import Icon from '../components/Icon';
import { CATEGORIES } from '../data/categories';
import { toBase, fmtNum, fmtDate } from '../lib/utils';

export default function AddSnapshotView({ data, baseCurrency, onNavigate, appendSnapshot, githubPush, githubConfig }) {
  const { snapshots, activeAccounts } = data;
  const synthesizeAccountId = (name) => 'manual-' + name.toLowerCase().replace(/\s+/g, '-').slice(0, 40);
  const [submitting, setSubmitting] = React.useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = React.useState(today);
  const [rows, setRows] = React.useState(() => [
    { id: crypto.randomUUID(), name: '', category: 'cash', currency: 'CNY', amount: '' },
  ]);
  const [showGhModal, setShowGhModal] = React.useState(false);
  const [commitMsg, setCommitMsg] = React.useState('');
  const [toast, setToast] = React.useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const addRow = () => setRows([...rows, { id: crypto.randomUUID(), name: '', category: 'cash', currency: 'CNY', amount: '' }]);
  const removeRow = (id) => setRows(rows.filter(r => r.id !== id));
  const updateRow = (id, patch) => setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));

  const copyFromLast = () => {
    const last = snapshots[snapshots.length - 1];
    setRows(last.entries.map(e => ({
      id: crypto.randomUUID(),
      accountId: e.accountId,
      name: e.name,
      category: e.category,
      currency: e.currency,
      amount: String(e.amount),
    })));
    showToast(`已从 ${fmtDate(last.date)} 复制 ${last.entries.length} 个账户`);
  };

  const totalBase = rows.reduce((acc, r) => {
    const n = parseFloat(r.amount);
    if (!isFinite(n)) return acc;
    return acc + toBase(n, r.currency);
  }, 0);

  const validRows = rows.filter(r => r.name && parseFloat(r.amount) > 0);

  const asJson = {
    date,
    entries: validRows.map(r => ({
      accountId: r.accountId || synthesizeAccountId(r.name),
      name: r.name,
      category: r.category,
      currency: r.currency,
      amount: parseFloat(r.amount),
    })),
  };

  const saveLocal = () => {
    appendSnapshot(asJson);
    showToast(`✓ 快照 ${date} 已保存到本地`);
  };

  const downloadJson = () => {
    appendSnapshot(asJson);
    const blob = new Blob([JSON.stringify(asJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshot-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ 已保存并下载 JSON');
  };

  const commitToGithub = async () => {
    setSubmitting(true);
    const prev = data.userSnapshots.filter(s => s.date !== asJson.date);
    const nextUserSnapshots = [...prev, asJson].sort((a, b) => a.date.localeCompare(b.date));
    appendSnapshot(asJson);
    try {
      await githubPush(commitMsg.trim() || `snapshot: ${date}`, { userSnapshots: nextUserSnapshots });
      setShowGhModal(false);
      showToast('✓ 已保存并推送到 GitHub');
      setCommitMsg('');
    } catch (e) {
      showToast(`✗ GitHub 推送失败：${e.message}，数据已保存本地`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="view add-view">
      <section className="add-head">
        <div className="add-head-left">
          <div className="add-date-picker">
            <label>快照日期</label>
            <div className="date-input">
              <Icon name="calendar" size={14} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <button className="btn-ghost" onClick={copyFromLast}>
            <Icon name="copy" size={14} /> 从上次快照复制
          </button>
        </div>
        <div className="add-head-right">
          <div className="total-preview">
            <div className="total-preview-label">合计 · 折算 CNY</div>
            <div className="total-preview-value mono">¥{fmtNum(totalBase)}</div>
          </div>
        </div>
      </section>

      <section className="form-table">
        <div className="form-table-head">
          <div>账户名称</div>
          <div>类别</div>
          <div>币种</div>
          <div className="r">金额</div>
          <div className="r muted">折算 CNY</div>
          <div></div>
        </div>
        {rows.map((r) => {
          const n = parseFloat(r.amount);
          const base = isFinite(n) ? toBase(n, r.currency) : 0;
          return (
            <div key={r.id} className="form-table-row">
              <div>
                <input className="fi" list="ledger-accounts-dl" placeholder="输入或选择账户" value={r.name}
                  onChange={e => {
                    const name = e.target.value;
                    const match = activeAccounts.find(a => a.name === name);
                    if (match) updateRow(r.id, { name, accountId: match.id, category: match.category, currency: match.currency });
                    else updateRow(r.id, { name, accountId: undefined });
                  }} />
              </div>
              <div>
                <select className="fi" value={r.category} onChange={e => updateRow(r.id, { category: e.target.value })}>
                  {Object.values(CATEGORIES).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <select className="fi mono" value={r.currency} onChange={e => updateRow(r.id, { currency: e.target.value })}>
                  {['CNY', 'USD', 'USDT'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="r">
                <input className="fi mono r" type="number" placeholder="0.00" value={r.amount}
                  onChange={e => updateRow(r.id, { amount: e.target.value })} />
              </div>
              <div className="r mono muted">¥{fmtNum(base, 2)}</div>
              <div>
                <button className="btn-icon-ghost" onClick={() => removeRow(r.id)} aria-label="删除">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          );
        })}
        <button className="form-add-row" onClick={addRow}>
          <Icon name="plus" size={14} /> 添加账户行
        </button>
      </section>

      <datalist id="ledger-accounts-dl">
        {activeAccounts.map(a => <option key={a.id} value={a.name} />)}
      </datalist>

      <section className="submit-row">
        <div className="submit-summary">
          <span className="muted">将保存</span>
          <span className="mono strong">{validRows.length}</span>
          <span className="muted">个账户 ·</span>
          <span className="mono strong">¥{fmtNum(totalBase)}</span>
          <span className="muted">· 日期</span>
          <span className="mono strong">{date}</span>
        </div>
        <div className="submit-actions">
          <button className="btn-ghost" onClick={downloadJson} disabled={!validRows.length}>
            <Icon name="download" size={14} /> 下载 JSON
          </button>
          <button className="btn-secondary" onClick={() => setShowGhModal(true)} disabled={!validRows.length}>
            <Icon name="github" size={14} /> 提交到 GitHub
          </button>
          <button className="btn-primary" onClick={saveLocal} disabled={!validRows.length}>
            <Icon name="check" size={14} /> 保存到本地
          </button>
        </div>
      </section>

      {showGhModal && (
        <div className="modal-backdrop" onClick={() => !submitting && setShowGhModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Icon name="github" size={18} />
              <h3>保存并推送到 GitHub</h3>
              <button className="btn-icon-ghost" onClick={() => !submitting && setShowGhModal(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>
            <div className="modal-body">
              {githubConfig.owner && githubConfig.repo ? (
                <>
                  <div className="field">
                    <label>仓库</label>
                    <div className="fi-static mono">{githubConfig.owner}/{githubConfig.repo} · {githubConfig.branch}</div>
                  </div>
                  <div className="field">
                    <label>文件路径</label>
                    <div className="fi-static mono">{githubConfig.path}</div>
                    <div className="field-hint">整个 userSnapshots 合并推送（包括这次新增的 {date}）</div>
                  </div>
                  <div className="field">
                    <label>提交信息（可选）</label>
                    <input className="fi mono" placeholder={`snapshot: ${date}`} value={commitMsg} onChange={e => setCommitMsg(e.target.value)} />
                  </div>
                  <details className="json-preview">
                    <summary>预览本次新增 JSON</summary>
                    <pre className="mono">{JSON.stringify(asJson, null, 2)}</pre>
                  </details>
                </>
              ) : (
                <div className="field">
                  <div className="fi-static" style={{ color: 'var(--neg)' }}>
                    尚未配置 GitHub 仓库。去「设置」页完成 owner / repo / token 配置后再试。
                  </div>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={() => setShowGhModal(false)} disabled={submitting}>取消</button>
              {githubConfig.owner && githubConfig.repo ? (
                <button className="btn-primary" disabled={submitting} onClick={commitToGithub}>
                  <Icon name="upload" size={14} /> {submitting ? '推送中...' : '推送'}
                </button>
              ) : (
                <button className="btn-primary" onClick={() => { setShowGhModal(false); onNavigate('settings'); }}>
                  去配置 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
