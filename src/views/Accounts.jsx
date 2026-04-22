import React from 'react';
import Icon from '../components/Icon';
import { CATEGORIES } from '../data/categories';
import { toBase, fmtNum } from '../lib/utils';

export default function AccountsView({ data, baseCurrency, upsertAccount, archiveAccount, onNavigate }) {
  const { accounts, snapshots } = data;
  const [editingId, setEditingId] = React.useState(null);
  const [draft, setDraft] = React.useState({ name: '', category: 'cash', currency: 'CNY' });
  const [showArchived, setShowArchived] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const latest = snapshots[snapshots.length - 1];
  const latestByAccount = Object.fromEntries((latest?.entries || []).map(e => [e.accountId, e]));

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const list = accounts
    .filter(a => showArchived || !a.archived)
    .map(a => {
      const entry = latestByAccount[a.id];
      const amount = entry ? entry.amount : 0;
      const amountBase = entry ? toBase(entry.amount, entry.currency) : 0;
      return { ...a, amount, amountBase, hasHistory: !!entry };
    })
    .sort((x, y) => y.amountBase - x.amountBase);

  const activeCount = accounts.filter(a => !a.archived).length;
  const archivedCount = accounts.filter(a => a.archived).length;

  const startEdit = (a) => {
    setEditingId(a.id);
    setDraft({ name: a.name, category: a.category, currency: a.currency });
    setAdding(false);
  };
  const cancelEdit = () => { setEditingId(null); setAdding(false); };
  const saveEdit = (id) => {
    if (!draft.name.trim()) return;
    const existing = accounts.find(a => a.id === id);
    upsertAccount({ ...existing, name: draft.name.trim(), category: draft.category, currency: draft.currency });
    showToast(`✓ ${draft.name} 已更新`);
    cancelEdit();
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setDraft({ name: '', category: 'cash', currency: 'CNY' });
  };
  const saveAdd = () => {
    if (!draft.name.trim()) return;
    const id = 'acc-' + Date.now().toString(36);
    upsertAccount({ id, name: draft.name.trim(), category: draft.category, currency: draft.currency, archived: false, createdAt: new Date().toISOString() });
    showToast(`✓ 新增账户：${draft.name}`);
    cancelEdit();
  };

  const toggleArchive = (a) => {
    archiveAccount(a.id, !a.archived);
    showToast(a.archived ? `已恢复：${a.name}` : `已归档：${a.name}`);
  };

  return (
    <div className="view accounts-view">
      <section className="add-head">
        <div className="add-head-left">
          <div>
            <div className="kpi-label">账户库</div>
            <div className="kpi-meta" style={{ marginTop: 4 }}>
              <span className="mono strong">{accounts.length}</span>
              <span className="muted">个账户 ·</span>
              <span className="mono text-pos">{activeCount}</span>
              <span className="muted">启用</span>
              {archivedCount > 0 && <>
                <span className="kpi-divider">·</span>
                <span className="mono muted">{archivedCount}</span>
                <span className="muted">已归档</span>
              </>}
            </div>
          </div>
        </div>
        <div className="add-head-right">
          {archivedCount > 0 && (
            <button className={`btn-secondary ${showArchived ? 'active' : ''}`} onClick={() => setShowArchived(v => !v)}>
              <Icon name="archive" size={14} />
              {showArchived ? `隐藏归档 (${archivedCount})` : `查看归档 (${archivedCount})`}
            </button>
          )}
          <button className="btn-primary" onClick={startAdd} disabled={adding}>
            <Icon name="plus" size={14} /> 添加账户
          </button>
        </div>
      </section>

      <section className="account-mgr-table">
        <div className="mgr-head">
          <div>账户名称</div>
          <div>类别</div>
          <div>币种</div>
          <div className="r">最新金额</div>
          <div className="r">折算 CNY</div>
          <div>状态</div>
          <div></div>
        </div>

        {adding && (
          <div className="mgr-row mgr-row-edit">
            <input className="fi" placeholder="账户名称" autoFocus
              value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') saveAdd(); if (e.key === 'Escape') cancelEdit(); }} />
            <select className="fi" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
              {Object.values(CATEGORIES).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select className="fi mono" value={draft.currency} onChange={e => setDraft({ ...draft, currency: e.target.value })}>
              {['CNY', 'USD', 'USDT'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="r mono muted">—</div>
            <div className="r mono muted">—</div>
            <div className="muted">新账户</div>
            <div className="mgr-actions">
              <button className="btn-ghost" onClick={cancelEdit}>取消</button>
              <button className="btn-primary" onClick={saveAdd} disabled={!draft.name.trim()}>
                <Icon name="check" size={12} /> 保存
              </button>
            </div>
          </div>
        )}

        {list.length === 0 && !adding && (
          <div className="empty-state">
            <Icon name="folder" size={24} />
            <div>{showArchived ? '没有账户' : '没有启用的账户，点"添加账户"创建'}</div>
          </div>
        )}

        {list.map(a => {
          const isEditing = editingId === a.id;
          const cat = CATEGORIES[a.category];
          if (isEditing) {
            return (
              <div key={a.id} className="mgr-row mgr-row-edit">
                <input className="fi" autoFocus
                  value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(a.id); if (e.key === 'Escape') cancelEdit(); }} />
                <select className="fi" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
                  {Object.values(CATEGORIES).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select className="fi mono" value={draft.currency} onChange={e => setDraft({ ...draft, currency: e.target.value })}>
                  {['CNY', 'USD', 'USDT'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="r mono muted">{a.hasHistory ? `${a.currency} ${fmtNum(a.amount)}` : '—'}</div>
                <div className="r mono muted">{a.hasHistory ? `¥${fmtNum(a.amountBase)}` : '—'}</div>
                <div className="muted">编辑中</div>
                <div className="mgr-actions">
                  <button className="btn-ghost" onClick={cancelEdit}>取消</button>
                  <button className="btn-primary" onClick={() => saveEdit(a.id)} disabled={!draft.name.trim()}>
                    <Icon name="check" size={12} /> 保存
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div key={a.id} className={`mgr-row ${a.archived ? 'archived' : ''}`}>
              <div className="col-account">
                <span className="cat-dot" style={{ background: cat?.color || '#94A3B8' }} />
                <span className="account-name">{a.name}</span>
              </div>
              <div className="muted">{cat?.label || a.category}</div>
              <div className="mono muted">{a.currency}</div>
              <div className="r mono">{a.hasHistory ? `${a.currency} ${fmtNum(a.amount)}` : <span className="muted">—</span>}</div>
              <div className="r mono">{a.hasHistory ? `¥${fmtNum(a.amountBase)}` : <span className="muted">—</span>}</div>
              <div>
                {a.archived ? <span className="badge-muted">已归档</span> : <span className="badge-active">启用</span>}
              </div>
              <div className="mgr-actions">
                <button className="btn-ghost" onClick={() => startEdit(a)} title="编辑">
                  <Icon name="sparkles" size={12} /> 编辑
                </button>
                <button className="btn-ghost" onClick={() => toggleArchive(a)} title={a.archived ? '恢复' : '归档'}>
                  <Icon name={a.archived ? 'refresh' : 'archive'} size={12} />
                  {a.archived ? '恢复' : '归档'}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
