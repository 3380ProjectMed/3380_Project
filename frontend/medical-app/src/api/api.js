// src/api.js
export async function j(path, init) {
  const r = await fetch(path, { credentials: 'include', ...(init || {}) });
  
  // Always parse the JSON response first
  let body;
  try {
    body = await r.json();
  } catch (e) {
    // If JSON parsing fails, throw a generic error
    throw new Error(`HTTP ${r.status}: Unable to parse response`);
  }
  
  // If response is not OK, but we have a JSON body with error info, return it
  // This allows the calling code to check r.success and r.message
  if (!r.ok) {
    // If the backend follows your API pattern (success, message, data)
    // just return the body so the frontend can check success/message
    return body;
  }
  
  // Response is OK, return the body
  return body;
}

export const pingPhp = () => j('/api/health.php');
export const pingDb  = () => j('/api/dbcheck.php');
export default { pingPhp, pingDb, j };