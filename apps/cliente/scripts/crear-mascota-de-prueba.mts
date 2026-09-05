/**
 * ⭐ **UNA MASCOTA DE PRUEBA, POR LA PUERTA ÚNICA** (S113-C · lote 1.2).
 *
 * El mandato pide guardar vacunas **de verdad** y **no sobre Thor**. Para eso
 * hace falta una mascota descartable, y se crea por **el mismo wrapper que usa
 * la app** (`agregarMascotaAFamilia`) — no por SQL: *una siembra que entra por
 * debajo de la puerta prueba la base, no el producto*, y además se saltaría la
 * RLS que es justamente lo que hay que atravesar.
 *
 * Se salta las seis pantallas del alta a propósito: **el alta no es lo que este
 * lote mide**. Lo que se mide es el guardado del carnet, y para eso la mascota
 * es el fixture, no el sujeto.
 */
import { readFileSync } from 'node:fs';

import { agregarMascotaAFamilia, iniciarSesion, initApi } from '@epetplace/api';

/* La API se inicializa como en el entry de la app: mismo cliente, mismas
   opciones. Las claves salen del `.env.local` que ya usa el bundler — no se
   teclean acá ni se imprimen. */
const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const NOMBRE = process.env.NOMBRE ?? 'Prueba C113';

const s = await iniciarSesion({ email: CORREO, password: CLAVE });
if (!s.ok) {
  console.log(`🔴 no pude entrar: ${s.codigo}`);
  process.exit(2);
}
console.log(`cuenta: ${CORREO}`);

const r = await agregarMascotaAFamilia({
  nombre_mascota: NOMBRE,
  especie: 'perro',
  fecha_nacimiento: '2026-07-20',
  precision_fecha: 'exacta',
  sexo: 'macho',
});
if (!r.ok) {
  console.log(`🔴 no se creó: ${r.codigo} · ${r.mensaje}`);
  process.exit(2);
}
console.log(`✅ creada: ${NOMBRE} · id ${r.data.mascota_id}`);
