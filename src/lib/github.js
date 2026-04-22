// GitHub Contents API helpers
const b64encode = (str) => btoa(unescape(encodeURIComponent(str)));
const b64decode = (str) => decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));

const apiHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
});

export async function githubFetchContents({ owner, repo, branch, path, token }) {
  if (!owner || !repo || !token) throw new Error('请先在设置里配置 owner/repo/token');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch || 'main')}`;
  const res = await fetch(url, { headers: apiHeaders(token) });
  if (res.status === 404) return { notFound: true };
  if (!res.ok) throw new Error(`拉取失败 ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return { sha: json.sha, content: b64decode(json.content) };
}

export async function githubPutContents({ owner, repo, branch, path, token, content, sha, message }) {
  if (!owner || !repo || !token) throw new Error('请先在设置里配置 owner/repo/token');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const body = {
    message: message || `chore: update ledger (${new Date().toISOString().slice(0, 10)})`,
    content: b64encode(content),
    branch: branch || 'main',
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...apiHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`推送失败 ${res.status}: ${await res.text()}`);
  return await res.json();
}

export async function githubCheckRepo({ owner, repo, token }) {
  if (!owner || !repo || !token) throw new Error('缺少参数');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: apiHeaders(token) });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.json()).message || 'unknown'}`);
  return await res.json();
}
