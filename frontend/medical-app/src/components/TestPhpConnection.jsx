import { useEffect, useState } from 'react';
import { pingPhp, pingDb } from "../api";

export default function ConnectivityCheck() {
  const [php, setPhp] = useState(null);
  const [db, setDb]   = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const p = await pingPhp();
        const d = await pingDb();
        setPhp(p); setDb(d);
      } catch (e) { setErr(String(e)); }
    })();
  }, []);

  if (err) return <pre style={{color:'crimson'}}>Error: {err}</pre>;
  return (
    <pre>{JSON.stringify({ php, db }, null, 2)}</pre>
  );
}
