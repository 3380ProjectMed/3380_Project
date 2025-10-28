// Force relative URLs - works for both dev (via proxy) and production (via nginx)
const API_BASE = '';

export const makeUrl = (path, params) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!params) return p;
  const qs = new URLSearchParams(params).toString();
  return `${p}${qs ? `?${qs}` : ''}`;  
};

export async function apiRequest(
  path,
  { method = 'GET', params, body, headers = {}, credentials = 'include', json = true } = {}
) {
  const init = { method, headers: { ...headers }, credentials };
  if (body !== undefined) {
    if (json && !(body instanceof FormData)) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    } else {
      init.body = body;
    }
  }
  const res = await fetch(makeUrl(path, params), init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`); 
  }
  return json ? res.json() : res;
}
