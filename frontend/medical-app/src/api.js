// src/api.js
async function j(path, init) {
  const r = await fetch(path, { credentials: 'include', ...(init||{}) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export const pingPhp = () => j('/api/health.php');
export const pingDb  = () => j('/api/dbcheck.php');
