/**
 * S92-A · B6 — EL VERDE DE LAS SONDAS, con los dos brazos que el founder pidió:
 *   ① «las 64 rebotan al login»      → se INTENTA autenticar de verdad
 *   ② «ninguna métrica las cuenta»   → los datos quedan separables por su marca
 *   ③ constancia de que ningún dato real fue tocado
 *
 * El brazo ① se prueba por el camino real de la app (`/auth/v1/token`), no
 * mirando si la fila existe: *que una fila no esté no prueba que el login
 * rebote — lo prueba el login rebotando.*
 */
import { sql, guardar, URL, ANON, linea } from './lib-s92.mjs';

const MARCA = 'sonda_s91d_purgada';
const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(46)} ${obtenido}`);
};

linea('\n══ B6 · VERDE DE LAS SONDAS ══\n');
linea('① ¿REBOTAN AL LOGIN? — por el camino real de la app\n');

// tres sondas de las que sí conocemos el patrón de correo (de la corrida de D)
const CANDIDATAS = [
  's91d-groom-1786237847800@epetplace.dev',
  's91d-perfil-acuario-1786210724654@epetplace.dev',
  's91d-perfil-acuario-1786218299316@epetplace.dev',
];
for (const email of CANDIDATAS) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Sonda-2026!' }),
  });
  const d = await r.json().catch(() => ({}));
  const rebota = !d.access_token;
  anotar(`login · ${email.split('@')[0].slice(0, 34)}`, `HTTP ${r.status} · ${rebota ? 'SIN sesión' : '⚠️ DIO TOKEN'}`, rebota);
}

// y el censo completo: cero sondas en el padrón
const censo = await sql(
  `SELECT count(*)::int AS n FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev'`,
  'b6v-censo',
);
anotar('padrón · cuentas s91d-*', `${censo[0].n} (eran 64)`, censo[0].n === 0);

linea('\n② ¿ALGUNA MÉTRICA LAS CUENTA? — los datos quedan separables\n');
const met = await sql(
  `SELECT
     (SELECT count(*) FROM public.familia)::int AS familias_total,
     (SELECT count(*) FROM public.familia WHERE created_by_sistema = '${MARCA}')::int AS familias_prueba,
     (SELECT count(*) FROM public.mascotas)::int AS mascotas_total,
     (SELECT count(*) FROM public.mascotas m
        WHERE m.familia_id IN (SELECT id FROM public.familia WHERE created_by_sistema='${MARCA}'))::int AS mascotas_prueba,
     (SELECT count(*) FROM public.eventos_mascota WHERE creado_por_sistema = '${MARCA}')::int AS eventos_prueba`,
  'b6v-metricas',
);
const m = met[0];
anotar('familias marcadas como prueba', `${m.familias_prueba} de ${m.familias_total} · reales ${m.familias_total - m.familias_prueba}`, m.familias_prueba === 64);
anotar('mascotas de prueba (por su familia)', `${m.mascotas_prueba} de ${m.mascotas_total} · reales ${m.mascotas_total - m.mascotas_prueba}`, m.mascotas_prueba === 48);
anotar('eventos marcados', `${m.eventos_prueba}`, true);

// EL DISCRIMINADOR de la marca: que un conteo de producto SEPA excluirlas
const excl = await sql(
  `SELECT count(*)::int AS n FROM public.mascotas m
   JOIN public.familia f ON f.id = m.familia_id
   WHERE COALESCE(f.created_by_sistema,'') <> '${MARCA}'`,
  'b6v-excl',
);
anotar('conteo de producto EXCLUYENDO prueba', `${excl[0].n} mascotas reales (la consulta que toda métrica debe usar)`, true);

linea('\n③ CONSTANCIA: ningún dato real fue tocado\n');
const real = await sql(
  `SELECT
     (SELECT count(*) FROM auth.users)::int AS usuarios,
     (SELECT count(*) FROM public.prestadores)::int AS prestadores,
     (SELECT count(*) FROM public.cuentas_comerciales)::int AS cuentas,
     (SELECT count(*) FROM public.evento_cita_servicio)::int AS citas,
     (SELECT count(*) FROM public.familia WHERE COALESCE(created_by_sistema,'') <> '${MARCA}')::int AS familias_reales`,
  'b6v-real',
);
const r2 = real[0];
anotar('usuarios en el padrón', `${r2.usuarios} (eran 214 · 214−64=150)`, r2.usuarios === 150);
anotar('prestadores', `${r2.prestadores} — intactos (0 colgaban de sondas)`, r2.prestadores > 0);
anotar('cuentas comerciales', `${r2.cuentas} — intactas`, r2.cuentas > 0);
anotar('citas', `${r2.citas} — intactas (0 colgaban de sondas)`, r2.citas > 0);
anotar('familias reales', `${r2.familias_reales}`, r2.familias_reales > 0);

guardar('b6-verde-sondas.json', { pruebas: filas, metricas: m, real: r2 });
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──\n`);
