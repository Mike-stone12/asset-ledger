import React from 'react';
import Icon from './Icon';

export default function Topbar({ title, breadcrumb, onThemeToggle, theme, baseCurrency, onCurrencyChange }) {
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
