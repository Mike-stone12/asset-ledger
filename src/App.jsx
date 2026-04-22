import React from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './views/Dashboard';
import CategoryView from './views/Category';
import AddSnapshotView from './views/Add';
import ExportView from './views/Export';
import AccountsView from './views/Accounts';
import SettingsView from './views/Settings';
import { CATEGORIES } from './data/categories';
import { MOCK_DATA } from './data/mockData';
import { githubFetchContents, githubPutContents } from './lib/github';

const GITHUB_CONFIG_DEFAULT = { owner: '', repo: '', branch: 'main', path: 'data/snapshots.json' };

export default function App() {
  const [theme, setTheme] = React.useState('dark');
  const [collapsed, setCollapsed] = React.useState(false);
  const [baseCurrency, setBaseCurrency] = React.useState('CNY');
  const [view, setView] = React.useState({ name: 'dashboard', params: null });

  const [userSnapshots, setUserSnapshots] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('ledger.userSnapshots') || '[]'); }
    catch { return []; }
  });
  React.useEffect(() => {
    localStorage.setItem('ledger.userSnapshots', JSON.stringify(userSnapshots));
  }, [userSnapshots]);

  const [userAccounts, setUserAccounts] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('ledger.userAccounts') || '[]'); }
    catch { return []; }
  });
  React.useEffect(() => {
    localStorage.setItem('ledger.userAccounts', JSON.stringify(userAccounts));
  }, [userAccounts]);

  const [githubConfig, setGithubConfig] = React.useState(() => {
    try { return { ...GITHUB_CONFIG_DEFAULT, ...JSON.parse(localStorage.getItem('ledger.githubConfig') || '{}') }; }
    catch { return GITHUB_CONFIG_DEFAULT; }
  });
  React.useEffect(() => {
    localStorage.setItem('ledger.githubConfig', JSON.stringify(githubConfig));
  }, [githubConfig]);

  const [githubToken, setGithubToken] = React.useState(() => sessionStorage.getItem('ledger.githubToken') || '');
  React.useEffect(() => {
    if (githubToken) sessionStorage.setItem('ledger.githubToken', githubToken);
    else sessionStorage.removeItem('ledger.githubToken');
  }, [githubToken]);

  const data = React.useMemo(() => {
    const byDate = new Map();
    MOCK_DATA.snapshots.forEach(s => byDate.set(s.date, s));
    userSnapshots.forEach(s => byDate.set(s.date, s));
    const snapshots = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

    const accountsById = new Map();
    MOCK_DATA.accounts.forEach(a => accountsById.set(a.id, {
      id: a.id, name: a.name, category: a.category, currency: a.currency, archived: false,
    }));
    userAccounts.forEach(a => accountsById.set(a.id, a));
    const accounts = Array.from(accountsById.values());

    return {
      accounts,
      activeAccounts: accounts.filter(a => !a.archived),
      fx: MOCK_DATA.fx,
      snapshots,
      userSnapshots,
      userAccounts,
    };
  }, [userSnapshots, userAccounts]);

  const appendSnapshot = React.useCallback((snap) => {
    setUserSnapshots(prev => {
      const filtered = prev.filter(s => s.date !== snap.date);
      return [...filtered, snap].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const removeUserSnapshot = React.useCallback((date) => {
    setUserSnapshots(prev => prev.filter(s => s.date !== date));
  }, []);

  const upsertAccount = React.useCallback((acc) => {
    setUserAccounts(prev => {
      const filtered = prev.filter(a => a.id !== acc.id);
      return [...filtered, acc];
    });
  }, []);

  const archiveAccount = React.useCallback((id, archived) => {
    setUserAccounts(prev => {
      const existing = prev.find(a => a.id === id);
      const mock = MOCK_DATA.accounts.find(a => a.id === id);
      const base = existing || (mock
        ? { id: mock.id, name: mock.name, category: mock.category, currency: mock.currency, archived: false }
        : null);
      if (!base) return prev;
      const next = { ...base, archived };
      return [...prev.filter(a => a.id !== id), next];
    });
  }, []);

  const githubPull = React.useCallback(async () => {
    const r = await githubFetchContents({ ...githubConfig, token: githubToken });
    if (r.notFound) return { notFound: true };
    const parsed = JSON.parse(r.content);
    const remote = Array.isArray(parsed) ? parsed : (parsed.userSnapshots || parsed.snapshots || []);
    setUserSnapshots(remote);
    if (parsed.userAccounts) setUserAccounts(parsed.userAccounts);
    return { sha: r.sha, count: remote.length };
  }, [githubConfig, githubToken]);

  const githubPush = React.useCallback(async (commitMessage, overrides = {}) => {
    const existing = await githubFetchContents({ ...githubConfig, token: githubToken });
    const sha = existing.notFound ? undefined : existing.sha;

    const snapsToPush = overrides.userSnapshots ?? userSnapshots;
    const accsToPush = overrides.userAccounts ?? userAccounts;
    const payload = JSON.stringify({ updatedAt: new Date().toISOString(), userSnapshots: snapsToPush, userAccounts: accsToPush }, null, 2);

    const res = await githubPutContents({
      ...githubConfig,
      token: githubToken,
      content: payload,
      sha,
      message: commitMessage,
    });
    localStorage.setItem('ledger.lastPushAt', new Date().toISOString());
    return { commitUrl: res.commit?.html_url };
  }, [githubConfig, githubToken, userSnapshots, userAccounts]);

  // Persist view
  React.useEffect(() => {
    const saved = localStorage.getItem('ledger.view');
    if (saved) { try { setView(JSON.parse(saved)); } catch {} }
  }, []);
  React.useEffect(() => { localStorage.setItem('ledger.view', JSON.stringify(view)); }, [view]);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navigate = (name, params = null) => setView({ name, params });

  const titles = {
    dashboard: { title: '仪表盘', breadcrumb: null },
    category: {
      title: (CATEGORIES[view.params]?.label || view.params) + ' · 明细',
      breadcrumb: [
        { label: '仪表盘', onClick: () => navigate('dashboard') },
        { label: CATEGORIES[view.params]?.label || view.params },
      ],
    },
    add: { title: '新增资产快照', breadcrumb: [
      { label: '仪表盘', onClick: () => navigate('dashboard') }, { label: '新增快照' },
    ]},
    export: { title: '导出与分析', breadcrumb: [
      { label: '仪表盘', onClick: () => navigate('dashboard') }, { label: '导出分析' },
    ]},
    accounts: { title: '账户管理', breadcrumb: [
      { label: '仪表盘', onClick: () => navigate('dashboard') }, { label: '账户管理' },
    ]},
    settings: { title: '设置', breadcrumb: [
      { label: '仪表盘', onClick: () => navigate('dashboard') }, { label: '设置' },
    ]},
  };
  const currentTitle = titles[view.name] || titles.dashboard;

  return (
    <div className="app">
      <Sidebar
        currentView={view.name}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        data={data}
      />
      <div className="main">
        <Topbar
          title={currentTitle.title}
          breadcrumb={currentTitle.breadcrumb}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          theme={theme}
          baseCurrency={baseCurrency}
          onCurrencyChange={setBaseCurrency}
        />
        {view.name === 'dashboard' && <DashboardView data={data} baseCurrency={baseCurrency} onNavigate={navigate} />}
        {view.name === 'category' && <CategoryView data={data} categoryKey={view.params} baseCurrency={baseCurrency} onNavigate={navigate} appendSnapshot={appendSnapshot} removeUserSnapshot={removeUserSnapshot} />}
        {view.name === 'add' && <AddSnapshotView data={data} baseCurrency={baseCurrency} onNavigate={navigate} appendSnapshot={appendSnapshot} githubPush={githubPush} githubConfig={githubConfig} />}
        {view.name === 'export' && <ExportView data={data} baseCurrency={baseCurrency} />}
        {view.name === 'accounts' && <AccountsView data={data} baseCurrency={baseCurrency} upsertAccount={upsertAccount} archiveAccount={archiveAccount} onNavigate={navigate} />}
        {view.name === 'settings' && <SettingsView data={data} githubConfig={githubConfig} setGithubConfig={setGithubConfig} githubToken={githubToken} setGithubToken={setGithubToken} githubPull={githubPull} githubPush={githubPush} setUserSnapshots={setUserSnapshots} setUserAccounts={setUserAccounts} />}
      </div>
    </div>
  );
}
