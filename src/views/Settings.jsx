import React from 'react';
import Icon from '../components/Icon';
import { githubCheckRepo } from '../lib/github';

export default function SettingsView({
  data, githubConfig, setGithubConfig, githubToken, setGithubToken,
  githubPull, githubPush, setUserSnapshots, setUserAccounts,
  autoSync, setAutoSync, syncStatus, syncError,
}) {
  const [testing, setTesting] = React.useState(false);
  const [pulling, setPulling] = React.useState(false);
  const [pushing, setPushing] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [commitMsg, setCommitMsg] = React.useState('');
  const [rememberToken, setRememberToken] = React.useState(() => localStorage.getItem('ledger.rememberToken') === '1');

  React.useEffect(() => {
    localStorage.setItem('ledger.rememberToken', rememberToken ? '1' : '0');
    if (rememberToken && githubToken) localStorage.setItem('ledger.githubToken', githubToken);
    else localStorage.removeItem('ledger.githubToken');
  }, [rememberToken, githubToken]);

  React.useEffect(() => {
    if (rememberToken && !githubToken) {
      const saved = localStorage.getItem('ledger.githubToken');
      if (saved) setGithubToken(saved);
    }
  }, []);

  const updateConfig = (patch) => setGithubConfig({ ...githubConfig, ...patch });

  const lastPushAt = localStorage.getItem('ledger.lastPushAt');
  const tokenOk = !!githubToken;
  const configOk = githubConfig.owner && githubConfig.repo && githubConfig.path;
  const canSync = tokenOk && configOk;

  const showStatus = (type, msg, link) => {
    setStatus({ type, msg, link });
    setTimeout(() => setStatus(null), 6000);
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const json = await githubCheckRepo({ owner: githubConfig.owner, repo: githubConfig.repo, token: githubToken });
      showStatus('ok', `✓ 连接成功：${json.full_name} · ${json.private ? '私有' : '公开'} · 默认分支 ${json.default_branch}`);
    } catch (e) {
      showStatus('err', `✗ 连接失败：${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const onPull = async () => {
    if (!confirm('拉取会覆盖本地的用户快照和账户修改，继续？')) return;
    setPulling(true);
    try {
      const r = await githubPull();
      if (r.notFound) showStatus('warn', '远端文件不存在，先在本地编辑后"推送"创建');
      else showStatus('ok', `✓ 已从 GitHub 拉取 ${r.count} 条快照`);
    } catch (e) {
      showStatus('err', `✗ 拉取失败：${e.message}`);
    } finally {
      setPulling(false);
    }
  };

  const onPush = async () => {
    setPushing(true);
    try {
      const r = await githubPush(commitMsg.trim() || undefined);
      showStatus('ok', '✓ 已推送到 GitHub', r.commitUrl);
      setCommitMsg('');
    } catch (e) {
      showStatus('err', `✗ 推送失败：${e.message}`);
    } finally {
      setPushing(false);
    }
  };

  const exportLocal = () => {
    const payload = { userSnapshots: data.userSnapshots, userAccounts: data.userAccounts, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('ok', '✓ 本地数据已导出');
  };

  const clearLocal = () => {
    if (!confirm('将清空所有"用户编辑的快照"和"账户修改"，原 mock 数据不受影响。继续？')) return;
    setUserSnapshots([]);
    setUserAccounts([]);
    showStatus('ok', '✓ 已清空本地用户数据');
  };

  return (
    <div className="view settings-view">
      <section className="settings-section">
        <div className="settings-head">
          <div>
            <h2>GitHub 同步</h2>
            <p className="muted">配置一个私有仓库用于跨设备同步 · Token 默认只存当前会话，关闭浏览器即失效</p>
          </div>
          <div className={`pill ${canSync ? 'pill-ok' : 'pill-warn'}`}>
            <Icon name="github" size={12} />
            {canSync ? '已配置' : '未完成配置'}
          </div>
        </div>

        <div className="settings-grid">
          <div className="field">
            <label>Owner（用户名/组织）</label>
            <input className="fi mono" placeholder="例如 your-github-name"
              value={githubConfig.owner} onChange={e => updateConfig({ owner: e.target.value.trim() })} />
          </div>
          <div className="field">
            <label>Repo（仓库名）</label>
            <input className="fi mono" placeholder="例如 asset-ledger"
              value={githubConfig.repo} onChange={e => updateConfig({ repo: e.target.value.trim() })} />
          </div>
          <div className="field">
            <label>Branch</label>
            <input className="fi mono" placeholder="main"
              value={githubConfig.branch} onChange={e => updateConfig({ branch: e.target.value.trim() || 'main' })} />
          </div>
          <div className="field">
            <label>路径</label>
            <input className="fi mono" placeholder="data/snapshots.json"
              value={githubConfig.path} onChange={e => updateConfig({ path: e.target.value.trim() || 'data/snapshots.json' })} />
          </div>
          <div className="field field-full">
            <label>Personal Access Token（classic/fine-grained 均可，需 repo 写权限）</label>
            <input className="fi mono" type="password" placeholder="ghp_•••••••••••••••••• 或 github_pat_•••"
              value={githubToken} onChange={e => setGithubToken(e.target.value.trim())} />
            <label className="checkbox-row">
              <input type="checkbox" checked={rememberToken} onChange={e => setRememberToken(e.target.checked)} />
              <span>记住 Token（写入 localStorage；不勾选仅 sessionStorage）</span>
            </label>
            <div className="field-hint">
              <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener">创建 fine-grained token →</a>
              <span className="muted" style={{ marginLeft: 12 }}>给目标仓库的 Contents: Read and write 权限</span>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-secondary" onClick={testConnection} disabled={!canSync || testing}>
            <Icon name="refresh" size={14} /> {testing ? '测试中...' : '测试连接'}
          </button>
          <button className="btn-secondary" onClick={onPull} disabled={!canSync || pulling}>
            <Icon name="download" size={14} /> {pulling ? '拉取中...' : '从 GitHub 拉取'}
          </button>
          <div className="push-compose">
            <input className="fi mono" placeholder="提交信息（可选）"
              value={commitMsg} onChange={e => setCommitMsg(e.target.value)} />
            <button className="btn-primary" onClick={onPush} disabled={!canSync || pushing}>
              <Icon name="upload" size={14} /> {pushing ? '推送中...' : '推送到 GitHub'}
            </button>
          </div>
        </div>

        {status && (
          <div className={`settings-status status-${status.type}`}>
            <span>{status.msg}</span>
            {status.link && <a href={status.link} target="_blank" rel="noopener" className="status-link">查看 commit →</a>}
          </div>
        )}

        <div className="auto-sync-row">
          <label className="auto-sync-toggle">
            <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} disabled={!canSync} />
            <span className="auto-sync-title">自动同步</span>
            <span className="auto-sync-sub muted">
              打开网页时自动从 GitHub 拉取 · 本地改动 3 秒后自动推送
              {!canSync && '（需先完成上面的配置）'}
            </span>
          </label>
          {autoSync && canSync && (
            <div className={`auto-sync-status status-${syncStatus === 'error' ? 'err' : syncStatus === 'synced' ? 'ok' : 'warn'}`}>
              {syncStatus === 'pulling' && '正在拉取远端...'}
              {syncStatus === 'pushing' && '正在推送...'}
              {syncStatus === 'synced' && '✓ 已同步'}
              {syncStatus === 'error' && `✗ ${syncError || '同步失败'}`}
              {syncStatus === 'idle' && '待命'}
            </div>
          )}
        </div>

        <div className="settings-meta">
          <span className="muted">最近推送：</span>
          <span className="mono">{lastPushAt ? new Date(lastPushAt).toLocaleString() : '从未'}</span>
          <span className="kpi-divider">·</span>
          <span className="muted">用户快照：</span>
          <span className="mono strong">{data.userSnapshots.length}</span>
          <span className="muted">条</span>
          <span className="kpi-divider">·</span>
          <span className="muted">用户账户改动：</span>
          <span className="mono strong">{data.userAccounts.length}</span>
          <span className="muted">条</span>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-head">
          <div>
            <h2>本地数据</h2>
            <p className="muted">数据保存在浏览器 localStorage · 清空或换浏览器前记得导出或推送到 GitHub</p>
          </div>
        </div>
        <div className="settings-actions">
          <button className="btn-secondary" onClick={exportLocal}>
            <Icon name="download" size={14} /> 导出本地备份
          </button>
          <button className="btn-ghost danger" onClick={clearLocal}>
            <Icon name="trash" size={14} /> 清空本地用户数据
          </button>
        </div>
      </section>
    </div>
  );
}
