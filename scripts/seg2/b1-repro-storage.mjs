/**
 * S92-BIS · B1 — EL REPRO POR BUCKET, CON OBJETOS QUE EXISTEN.
 *
 * ── LA TRAMPA DE ESTA SESIÓN, ESCRITA POR ADELANTADO (R4) ────────────────────
 * **Un 404 de Storage NO prueba que el permiso esté cerrado**: puede ser que el
 * path no exista. Es la misma clase del error que S92 declaró en su §⑦ (leer un
 * 404 de PostgREST como «el permiso pasó»). Por eso cada prueba usa **un objeto
 * REAL, leído antes de `storage.objects`**, y por eso el reporte dice siempre
 * contra qué objeto midió.
 *
 * Se prueban cuatro preguntas por bucket:
 *   ① ¿un ANÓNIMO descarga por la ruta pública?
 *   ② ¿un ANÓNIMO descarga por la ruta autenticada, con la anon key del bundle?
 *   ③ ¿un AUTENTICADO CUALQUIERA descarga un objeto AJENO?
 *   ④ ¿un AUTENTICADO CUALQUIERA puede ESCRIBIR en el bucket? ← el precedente
 *      exacto de S47, donde `mascotas` dejaba pisar fotos ajenas.
 *
 * ⚠️ La ④ escribe de verdad, así que va a un path propio e inventado
 * (`seg2-probe/…`), **jamás sobre un objeto existente**: probar que se puede
 * pisar el avatar de alguien pisándolo sería el peor modo de tener razón. Lo que
 * se sube se borra en el acto y el residuo se mide.
 */
import { sql, tokenDe, guardarSeg2, objetoPublico, objetoAutenticado, listarBucket, subirObjeto, borrarObjeto, URL, ANON, linea } from './lib-seg2.mjs';
import { readFileSync } from 'node:fs';

const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

/** Un objeto REAL por bucket — sin esto, el repro no mide nada (R4). */
const muestras = await sql(
  `SELECT DISTINCT ON (bucket_id) bucket_id, name
   FROM storage.objects ORDER BY bucket_id, created_at DESC`,
  'b1-muestras',
);
const porBucket = Object.fromEntries(muestras.map((m) => [m.bucket_id, m.name]));

const buckets = await sql(`SELECT id, public FROM storage.buckets ORDER BY id`, 'b1-b2');

// un usuario cualquiera, recién creado: no es dueño de NADA
const correoAjeno = `seg2-storage-${Date.now()}@epetplace.dev`;
const r = await fetch(`${URL}/auth/v1/signup`, {
  method: 'POST',
  headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: correoAjeno, password: 'Seg2-2026!' }),
});
const dAjeno = await r.json().catch(() => ({}));
const tokenAjeno = dAjeno.access_token;
const tokenTitular = await tokenDe(DEMO_MAIL, DEMO_PW);

const filas = [];
linea('\n══ B1 · REPRO POR BUCKET — con objetos que EXISTEN ══\n');
linea(`  ajeno: una cuenta creada recién, dueña de nada (${correoAjeno.split('@')[0]})\n`);

for (const b of buckets) {
  const objeto = porBucket[b.id];
  linea(`\n── ${b.id}${b.public ? '  [PÚBLICO]' : '  [privado]'} ──`);
  if (!objeto) {
    linea('   (bucket vacío: no se puede reproducir sin un objeto real — R4/R5, va como NO MEDIDO)');
    filas.push({ bucket: b.id, publico: b.public, objeto: null, veredicto: 'NO MEDIDO — bucket vacío' });
    continue;
  }
  const corto = objeto.length > 46 ? objeto.slice(0, 43) + '…' : objeto;
  linea(`   objeto de prueba: ${corto}`);

  const pub = await objetoPublico(b.id, objeto);
  const anon = await objetoAutenticado(b.id, objeto);
  const ajeno = tokenAjeno ? await objetoAutenticado(b.id, objeto, tokenAjeno) : { status: null };
  const lista = tokenAjeno ? await listarBucket(b.id, tokenAjeno) : { status: null, objetos: 0 };

  const ok = (s) => s === 200;
  linea(`   ① anónimo por ruta PÚBLICA .......... ${pub.status}${ok(pub.status) ? ` 🔴 DESCARGA (${pub.bytes} bytes, ${pub.tipo})` : ' rebota'}`);
  linea(`   ② anónimo con la anon key ........... ${anon.status}${ok(anon.status) ? ` 🔴 DESCARGA (${anon.bytes} bytes)` : ' rebota'}`);
  linea(`   ③ autenticado AJENO ................. ${ajeno.status}${ok(ajeno.status) ? ` 🔴 DESCARGA (${ajeno.bytes} bytes)` : ' rebota'}`);
  linea(`   ④ ajeno LISTA el bucket ............. ${lista.status}${lista.status === 200 ? ` 🔴 enumera (${lista.objetos} objetos)` : ' rebota'}`);

  // ⑤ ESCRITURA — a un path propio, jamás sobre algo existente
  let escritura = { status: null };
  let limpieza = 'no aplica';
  if (tokenAjeno) {
    const path = `seg2-probe/${Date.now()}.txt`;
    escritura = await subirObjeto(b.id, path, tokenAjeno);
    if (escritura.status === 200 || escritura.status === 201) {
      const del = await borrarObjeto(b.id, path, tokenAjeno);
      limpieza = `borrado: HTTP ${del.status}`;
    }
  }
  linea(`   ⑤ ajeno ESCRIBE (path propio) ....... ${escritura.status}${escritura.status < 300 ? ` 🔴 SUBIÓ · ${limpieza}` : ' rebota'}`);

  filas.push({
    bucket: b.id,
    publico: b.public,
    objeto: corto,
    publica: pub.status,
    anon: anon.status,
    ajeno: ajeno.status,
    lista: lista.status === 200 ? lista.objetos : `rebota ${lista.status}`,
    escritura: escritura.status,
    limpieza,
  });
}

guardarSeg2('b1-repro-storage.json', { correoAjeno, filas });

linea('\n\n══ RESUMEN — dónde entra un desconocido ══\n');
linea('  bucket                   pub  anon  ajeno  lista  escribe');
linea('  ' + '─'.repeat(64));
for (const f of filas) {
  if (f.veredicto) {
    linea(`  ${f.bucket.padEnd(24)} ${f.veredicto}`);
    continue;
  }
  const m = (s) => (s === 200 || s === 201 ? '🔴' : '  ');
  linea(
    `  ${f.bucket.padEnd(24)} ${m(f.publica)}${String(f.publica).padStart(4)} ${m(f.anon)}${String(f.anon).padStart(4)} ${m(f.ajeno)}${String(f.ajeno).padStart(5)} ${String(f.lista).padStart(6)} ${m(f.escritura)}${String(f.escritura).padStart(5)}`,
  );
}
linea('');
