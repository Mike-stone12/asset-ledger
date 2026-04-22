import React from 'react';
import Icon from '../components/Icon';
import { CATEGORIES } from '../data/categories';
import { totalOfSnapshot, categoryTotalsOfSnapshot, fmtNum, fmtPct, fmtDate } from '../lib/utils';

const PROFILE_DEFAULTS = { age: '30', risk: '中等', horizon: '长期', notes: '' };

export default function ExportView({ data, baseCurrency }) {
  const { snapshots } = data;
  const [active, setActive] = React.useState('json');
  const [copied, setCopied] = React.useState(false);
  const [profile, setProfile] = React.useState(() => {
    try { return { ...PROFILE_DEFAULTS, ...JSON.parse(localStorage.getItem('ledger.profile') || '{}') }; }
    catch { return PROFILE_DEFAULTS; }
  });
  const [profileOpen, setProfileOpen] = React.useState(false);
  React.useEffect(() => { localStorage.setItem('ledger.profile', JSON.stringify(profile)); }, [profile]);
  const updateProfile = (patch) => setProfile(p => ({ ...p, ...patch }));

  const latest = snapshots[snapshots.length - 1];
  const prev = snapshots[snapshots.length - 2];
  const latestTotal = totalOfSnapshot(latest);
  const prevTotal = prev ? totalOfSnapshot(prev) : latestTotal;
  const delta = latestTotal - prevTotal;
  const deltaPct = prevTotal ? (delta / prevTotal) * 100 : 0;
  const latestCats = categoryTotalsOfSnapshot(latest);

  const jsonContent = JSON.stringify({ snapshots: snapshots.slice(-3) }, null, 2);

  const mdContent = [
    `# 资产快照 · ${fmtDate(latest.date, 'long')}`,
    ``,
    `**净资产总额**：¥${fmtNum(latestTotal)}`,
    `**较上期**：${delta >= 0 ? '+' : '−'}¥${fmtNum(Math.abs(delta))} (${fmtPct(deltaPct)})`,
    ``,
    `## 按类别分布`,
    ``,
    `| 类别 | 金额 (CNY) | 占比 |`,
    `| --- | ---: | ---: |`,
    ...Object.entries(latestCats).map(([k, v]) => {
      const label = CATEGORIES[k]?.label || k;
      const pct = latestTotal ? (v / latestTotal) * 100 : 0;
      return `| ${label} | ${fmtNum(v)} | ${pct.toFixed(1)}% |`;
    }),
    ``,
    `## 账户明细`,
    ``,
    `| 账户 | 类别 | 币种 | 金额 |`,
    `| --- | --- | --- | ---: |`,
    ...latest.entries.map(e => `| ${e.name} | ${CATEGORIES[e.category]?.label || e.category} | ${e.currency} | ${fmtNum(e.amount)} |`),
  ].join('\n');

  const profileLine = [
    profile.age && `年龄 ${profile.age}`,
    profile.risk && `风险偏好 ${profile.risk}`,
    profile.horizon && `时间维度 ${profile.horizon}`,
  ].filter(Boolean).join(' · ');

  const promptContent = `你是一位资产配置顾问。请帮我分析下面这份个人资产快照，重点回答：

1. 当前资产配置是否合理？是否存在过度集中或风险敞口？
2. 流动资金、权益类、债券、加密、实物资产之间的比例是否与我的情况${profileLine ? `（${profileLine}）` : ''}匹配？
3. 相比上期的变化中，哪些值得警惕？哪些是积极信号？
4. 给出 3 条可执行的调整建议，按优先级排序。

请使用中文回答，先给结论再给理由。避免空泛的一般性建议。
${profile.notes ? `\n补充背景：${profile.notes}\n` : ''}
---

${mdContent}`;

  const options = [
    { key: 'json', icon: 'doc', title: '导出为 JSON', sub: '原始结构化数据，可直接存档或再导入', content: jsonContent, lang: 'json' },
    { key: 'md', icon: 'doc', title: '导出 Markdown 摘要', sub: '格式化表格，便于粘贴到笔记或 LLM', content: mdContent, lang: 'markdown' },
    { key: 'prompt', icon: 'sparkles', title: '复制为分析 Prompt', sub: '预置指令 + 你的个人背景 + 数据', content: promptContent, lang: 'text' },
  ];

  const activeOpt = options.find(o => o.key === active);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(activeOpt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const download = () => {
    const ext = active === 'json' ? 'json' : active === 'md' ? 'md' : 'txt';
    const blob = new Blob([activeOpt.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-export-${latest.date}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view export-view">
      <div className="export-cards">
        {options.map(o => (
          <button key={o.key} className={`export-card ${active === o.key ? 'active' : ''}`} onClick={() => setActive(o.key)}>
            <div className="export-card-icon">
              <Icon name={o.icon} size={18} />
            </div>
            <div className="export-card-body">
              <div className="export-card-title">{o.title}</div>
              <div className="export-card-sub">{o.sub}</div>
            </div>
            {active === o.key && <div className="export-card-badge"><Icon name="check" size={12} /></div>}
          </button>
        ))}
      </div>

      {active === 'prompt' && (
        <section className="profile-card">
          <div className="profile-head">
            <div>
              <div className="profile-title">个人背景 <span className="muted">（注入 Prompt，仅本地保存）</span></div>
              <div className="profile-sub">{profileLine || '尚未填写 · 会以"通用投资者"口吻分析'}</div>
            </div>
            <button className="btn-ghost" onClick={() => setProfileOpen(v => !v)}>
              <Icon name={profileOpen ? 'chevron_down' : 'chevron_right'} size={14} />
              {profileOpen ? '收起' : '展开编辑'}
            </button>
          </div>
          {profileOpen && (
            <div className="profile-body">
              <div className="profile-grid">
                <div className="field">
                  <label>年龄</label>
                  <input className="fi mono" type="text" placeholder="例如 32"
                    value={profile.age} onChange={e => updateProfile({ age: e.target.value })} />
                </div>
                <div className="field">
                  <label>风险偏好</label>
                  <select className="fi" value={profile.risk} onChange={e => updateProfile({ risk: e.target.value })}>
                    <option value="保守">保守</option>
                    <option value="中等偏保守">中等偏保守</option>
                    <option value="中等">中等</option>
                    <option value="中等偏激进">中等偏激进</option>
                    <option value="激进">激进</option>
                  </select>
                </div>
                <div className="field">
                  <label>时间维度</label>
                  <select className="fi" value={profile.horizon} onChange={e => updateProfile({ horizon: e.target.value })}>
                    <option value="短期（1 年内）">短期（1 年内）</option>
                    <option value="中期（1-3 年）">中期（1-3 年）</option>
                    <option value="长期">长期</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>补充背景（可选）</label>
                <textarea className="fi" rows={3} placeholder="例如：短期有购房计划 / 稳定工资收入 / 月定投 5000..."
                  value={profile.notes} onChange={e => updateProfile({ notes: e.target.value })} />
              </div>
            </div>
          )}
        </section>
      )}

      <section className="preview-card">
        <div className="preview-head">
          <div>
            <div className="preview-title">预览 · {activeOpt.title}</div>
            <div className="preview-sub">{activeOpt.content.length.toLocaleString()} 字符 · {activeOpt.lang}</div>
          </div>
          <div className="preview-actions">
            <button className="btn-secondary" onClick={copy}>
              <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? '已复制' : '复制'}
            </button>
            <button className="btn-primary" onClick={download}>
              <Icon name="download" size={14} /> 下载
            </button>
          </div>
        </div>
        <pre className="preview-content mono">{activeOpt.content}</pre>
      </section>
    </div>
  );
}
