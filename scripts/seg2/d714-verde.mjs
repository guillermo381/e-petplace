/**
 * D-714 · EL VERDE DOBLE de las functions facturables.
 * ① con la anon key del bundle → REBOTA · ② con sesión de persona → PASA.
 */
import { readFileSync } from 'node:fs';
import { tokenDe, guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const t = await tokenDe(
  env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim(),
  env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim(),
);

const FN = ['extract-vacuna', 'estructurar-nota-clinica', 'escribir-presencia', 'lugares'];
const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(48)} ${obtenido}`);
};

async function llamar(slug, token) {
  const r = await fetch(`${URL}/functions/v1/${slug}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return { status: r.status, cuerpo: (await r.text()).slice(0, 120) };
}

linea('\n══ D-714 · VERDE DOBLE ══\n');
linea('BRAZO ① — con la anon key del bundle: REBOTA\n');
for (const f of FN) {
  const r = await llamar(f, ANON);
  const rebota = r.status === 401 && /sesion_requerida/.test(r.cuerpo);
  anotar(`${f} · anon key`, `HTTP ${r.status} · ${r.cuerpo.slice(0, 55)}`, rebota);
}

linea('\nBRAZO ② — con sesión de persona: PASA la puerta\n');
for (const f of FN) {
  const r = await llamar(f, t);
  // pasa la puerta = NO rebota por sesión; el 400 de validación de entrada es
  // la prueba de que llegó al cuerpo, que es exactamente lo que debe pasar
  const paso = !/sesion_requerida|sesion_invalida/.test(r.cuerpo);
  anotar(`${f} · con sesión`, `HTTP ${r.status} · ${r.cuerpo.slice(0, 55)}`, paso);
}

guardarSeg2('d714-verde.json', filas);
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──\n`);
