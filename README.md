# Ledger · 个人资产追踪

Vite + React 版本。数据存浏览器 localStorage，可选 GitHub 私有仓库同步。

## 首次运行

需要 Node.js 18+。如没装：

```powershell
winget install OpenJS.NodeJS.LTS
```

或从 https://nodejs.org/ 下 LTS MSI 安装。装完重开终端让 PATH 生效。

```bash
cd ledger
npm install
npm run dev
```

浏览器自动打开 http://localhost:5173

## 脚本

- `npm run dev` — 开发服务器（热重载）
- `npm run build` — 产物输出到 `dist/`
- `npm run preview` — 本地预览 build 产物

## 部署到 GitHub Pages

1. `npm run build` → 生成 `dist/`
2. 将 `dist/` 的内容推到仓库的 `gh-pages` 分支（或用 GitHub Actions）
3. 在仓库 Settings → Pages 启用

`vite.config.js` 已设 `base: './'`，子路径部署不用改。

## 项目结构

```
src/
  main.jsx          入口
  App.jsx           顶层状态 + 路由 + GitHub 同步
  styles.css        设计系统 + 组件样式
  data/
    categories.js   5 类资产定义（颜色/图标/中文名）
    mockData.js     18 个月示例数据
  lib/
    utils.js        格式化 / 换算 / 快照聚合
    github.js       Contents API 封装
  components/
    Icon / Sidebar / Topbar / Sparkline / DeltaPill / RangeTabs / KpiMini
  views/
    Dashboard / Category / Add / Export / Accounts / Settings
```

## 数据模型

- **MOCK_DATA**（静态）：示例账户 + 18 个月历史快照，不可变
- **ledger.userSnapshots**（localStorage）：用户编辑/新增的快照，按日期与 mock 合并，同日期以用户数据为准
- **ledger.userAccounts**（localStorage）：用户的账户覆盖（改名、改类别、归档、新建）
- **ledger.githubConfig**（localStorage）：owner/repo/branch/path
- **ledger.githubToken**（sessionStorage，可选 localStorage）：PAT，默认关浏览器失效

## GitHub 同步

设置页填 owner/repo/path/token → 测试连接 → 推送 → 另一台机器拉取。单文件 PUT，覆盖式同步，拉取会覆盖本地。

Token 需要目标仓库的 **Contents: Read and write** 权限。fine-grained PAT 创建入口：https://github.com/settings/tokens?type=beta
