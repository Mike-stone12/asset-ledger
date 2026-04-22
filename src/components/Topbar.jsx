import React from 'react';
import Icon from './Icon';

const SYNC_LABELS = {
  pulling: { text: '同步中...', cls: 'syncing' },
  pushing: { text: '同步中...', cls: 'syncing' },
  synced:  { text: '已同步',    cls: 'ok' },
  error:   { text: '同步失败',  cls: 'err' },
  idle:    { text: '待同步',    cls: 'idle' },
};

export default function Topbar({ title, breadcrumb, onThemeToggle, theme, baseCurrency, onCurrencyChange, syncStatus, syncError, onOpenSettings }) {
  const label = syncStatus !== 'off' && SYNC_LABELS[syncStatus];
  return (
    <header className="topbar">
      <div className="topbar-left">
        {breadcrumb && (
          <div className="breadcrumb">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevron_right" size={12} className="crumb-sep" />}
                {b.onClick
                  ? <button className="crumb-link" onClick={b.onClick}>{b.label}</button>
                  : <span className="crumb-current">{b.label}</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        {label && (
          <button className={`sync-indicator sync-${label.cls}`} onClick={onOpenSettings}
                  title={syncStatus === 'error' && syncError ? syncError : '点击前往设置'}>
            <span className="sync-dot" />
            <span>{label.text}</span>
          </button>
        )}
        <div className="currency-toggle">
          {['CNY', 'USD', 'USDT'].map(c => (
            <button key={c} className={baseCurrency === c ? 'active' : ''} onClick={() => onCurrencyChange(c)}>{c}</button>
          ))}
        </div>
        <button className="icon-btn" onClick={onThemeToggle} aria-label="切换主题">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
        <div className="avatar">LW</div>
      </div>
    </header>
  );
}
