import Icon from './Icon';
import { CATEGORIES } from '../data/categories';

export default function Sidebar({ currentView, onNavigate, collapsed, onToggle, data }) {
  const items = [
    { id: 'dashboard', icon: 'dashboard', label: '仪表盘' },
    { id: 'add',       icon: 'plus',      label: '新增快照' },
    { id: 'accounts',  icon: 'users',     label: '账户管理' },
    { id: 'export',    icon: 'export',    label: '导出分析' },
    { id: 'settings',  icon: 'settings',  label: '设置' },
  ];
  const latest = data?.snapshots?.[data.snapshots.length - 1];
  const daysSince = latest
    ? Math.max(0, Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000))
    : 0;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-head">
        <div className="brand">
          <div className="brand-mark">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 14l4-5 3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="5" r="2" fill="currentColor" />
            </svg>
          </div>
          {!collapsed && (
            <div className="brand-text">
              <div className="brand-title">Ledger</div>
              <div className="brand-sub">个人资产追踪</div>
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={onToggle} aria-label="折叠侧边栏">
          <Icon name="sidebar" size={16} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {items.map(it => (
          <button
            key={it.id}
            className={`nav-item ${currentView === it.id || (currentView === 'category' && it.id === 'dashboard') ? 'active' : ''}`}
            onClick={() => onNavigate(it.id)}
          >
            <Icon name={it.icon} size={18} />
            {!collapsed && <span>{it.label}</span>}
          </button>
        ))}

        {!collapsed && <div className="nav-section-label">快捷访问</div>}
        {!collapsed && Object.values(CATEGORIES).map(c => (
          <button key={c.key} className="nav-item nav-sub" onClick={() => onNavigate('category', c.key)}>
            <span className="cat-dot" style={{ background: c.color }} />
            <span>{c.label}</span>
          </button>
        ))}
      </nav>

      {!collapsed && latest && (
        <div className="sidebar-foot">
          <div className="foot-card">
            <div className="foot-label">最近快照</div>
            <div className="foot-value">{latest.date}</div>
            <div className="foot-sub">{daysSince === 0 ? '今天' : `距今 ${daysSince} 天`}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
