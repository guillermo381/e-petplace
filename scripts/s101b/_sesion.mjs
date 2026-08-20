/* Sesión para la cuenta del disparo, SIN tocar su contraseña.
   `generateLink` + `verify` = el camino oficial de Supabase con service_role:
   emite un token de un uso y lo canjea. **No cambia nada de la cuenta.** */
import { createClient } from '@supabase/supabase-js';
const URL = process.env.SUPA_URL, ANON = process.env.SUPA_ANON, SR = process.env.SUPA_SR;
const admin = createClient(URL, SR, { auth: { persistSession: false } });
const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink', email: 'guillo381+8@gmail.com',
});
if (error) { console.error('generateLink rojo:', error.message); process.exit(1); }
const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const v = await anon.auth.verifyOtp({
  type: 'magiclink', token_hash: data.properties.hashed_token,
});
if (v.error) { console.error('verify rojo:', v.error.message); process.exit(1); }
console.log(JSON.stringify({ uid: v.data.user.id, jwt: v.data.session.access_token }));
