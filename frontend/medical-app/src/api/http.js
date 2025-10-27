// src/api/http.js
const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? '/api' : ''); // dev proxy vs prod same-origin

const makeUrl = (path, params) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!params) return `${API_BASE}${p}`;
  const qs = new URLSearchParams(params).toString();
  return `${API_BASE}${p}${qs ? `?${qs}` : ''}`;
};

// Generic fetch wrapper
export async function apiRequest(path, {
  method = 'GET',
  params,
  body,
  headers = {},
  credentials = 'include',     // cookies/session
  json = true,                  // auto JSON encode/decode
} = {}) {
  const init = { method, headers: { ...headers }, credentials };

  if (body !== undefined) {
    if (json && !(body instanceof FormData)) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    } else {
      init.body = body; // FormData / raw
    }
  }

  const res = await fetch(makeUrl(path, params), init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${text}`);
  }
  return json ? res.json() : res;
}
