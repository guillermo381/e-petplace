import { createClient } from '@supabase/supabase-js';
const URL = process.env.SUPA_URL, ANON = process.env.SUPA_ANON;
const s = createClient(URL, ANON, { auth: { persistSession: false } });
const { data, error } = await s.auth.signInWithPassword({
  email: 'guillo381+8@gmail.com', password: 'S87prueba!2026',
});
if (error) { console.error('login rojo:', error.message); process.exit(1); }
console.log('sesión ok · uid', data.user.id);

const COMPRA = process.argv[2], TARJETA = process.argv[3];
const r = await fetch(`${URL}/functions/v1/pagos-cobro`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    apikey: ANON,
    authorization: `Bearer ${data.session.access_token}`,
  },
  body: JSON.stringify({ compra_id: COMPRA, tarjeta_id: TARJETA }),
});
console.log('HTTP', r.status);
console.log(await r.text());
