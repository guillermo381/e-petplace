/**
 * S92-BIS · B1 — EL VERDE DE STORAGE, en dos brazos, y la limpieza del residuo.
 *
 * BRAZO ① el ajeno REBOTA · BRAZO ② el dueño SIGUE PUDIENDO — y en Storage el
 * brazo ② es literal: si la familia deja de ver el carnet de su mascota o el
 * prestador deja de subir su logo, la cura rompió el producto (R3).
 *
 * Y de paso se limpia el objeto que el repro dejó en `avatars`: la policy de
 * DELETE recién creada tiene un brazo `owner = auth.uid()` puesto justamente
 * para que lo subido antes de la cura pueda salir.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql, tokenDe, guardarSeg2, SALIDA_SEG2, objetoPublico, objetoAutenticado, subirObjeto, borrarObjeto, URL, ANON, linea } from './lib-seg2.mjs';

const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const tTitular = await tokenDe(
  env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim(),
  env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim(),
);
const { correoAjeno } = JSON.parse(readFileSync(join(SALIDA_SEG2, 'b1-repro-storage.json'), 'utf8'));
const tAjeno = await tokenDe(correoAjeno, 'Seg2-2026!');

const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(50)} ${obtenido}`);
};

linea('\n══ B1 · VERDE DE STORAGE ══\n');
linea('BRAZO ① — el ajeno REBOTA donde antes escribía\n');
{
  // el rojo exacto de hace un rato: subir a `avatars` desde una cuenta cualquiera,
  // a una carpeta que no es la suya. Mime válido, para que mida la POLICY.
  const r = await subirObjeto('avatars', `seg2-probe/${Date.now()}-post.png`, tAjeno, 'x', 'image/png');
  const porPolicy = r.status >= 400 && !/invalid_mime_type/.test(r.cuerpo);
  anotar('ajeno escribe en avatars/ carpeta ajena', `HTTP ${r.status} ${porPolicy ? 'REBOTA por POLICY' : r.status >= 400 ? '(rebote de mime, no mide)' : '⚠️ SUBIÓ'}`, porPolicy);

  // en la carpeta de OTRO usuario, con un mime VÁLIDO para que el rebote sea
  // de POLICY y no del filtro de tipo — si no, se probaría el filtro y no la cura
  const r2 = await subirObjeto('avatars', `00000000-0000-0000-0000-000000000000/hack.png`, tAjeno, 'x', 'image/png');
  const porPolicy2 = r2.status >= 400 && !/invalid_mime_type/.test(r2.cuerpo);
  anotar('ajeno escribe en la carpeta de otro uuid', `HTTP ${r2.status} ${porPolicy2 ? 'REBOTA por POLICY' : r2.status >= 400 ? '(rebote de mime, no mide)' : '⚠️ SUBIÓ'}`, porPolicy2);

  // adopción: un no-admin ya no debería poder subir
  const r3 = await subirObjeto('adopcion-fotos', `seg2/${Date.now()}.png`, tAjeno, 'x', 'image/png');
  const porPolicy3 = r3.status >= 400 && !/invalid_mime_type/.test(r3.cuerpo);
  anotar('no-admin sube a adopcion-fotos', `HTTP ${r3.status} ${porPolicy3 ? 'REBOTA por POLICY' : r3.status >= 400 ? '(rebote de mime, no mide)' : '⚠️ SUBIÓ'}`, porPolicy3);
}

linea('\nBRAZO ② — lo que DEBE seguir funcionando\n');
{
  // el dueño en SU carpeta: es exactamente lo que hace `subirLogoNegocio`
  const { user } = await fetch(`${URL}/auth/v1/user`, {
    headers: { apikey: ANON, Authorization: `Bearer ${tAjeno}` },
  }).then((r) => r.json().then((j) => ({ user: j })));
  const miUid = user?.id;
  const miPath = `${miUid}/logo-negocio-${Date.now()}.png`;
  /**
   * ⚠️ El mime va EXPLÍCITO. La primera corrida mandó `text/plain` con nombre
   * `.png` y cosechó un 400 que parecía «la cura rompió la subida de logos» —
   * era **415 invalid_mime_type**, o sea el filtro nuevo funcionando. Para
   * probar la POLICY hay que pasar el filtro de mime primero.
   */
  const sube = await subirObjeto('avatars', miPath, tAjeno, 'seg2-probe', 'image/png');
  anotar('el dueño sube a SU carpeta (patrón de la app)', `HTTP ${sube.status}`, sube.status < 300);
  if (sube.status < 300) {
    const borra = await borrarObjeto('avatars', miPath, tAjeno);
    anotar('y puede BORRAR lo suyo (D-616 pagada)', `HTTP ${borra.status}`, borra.status < 300);
  }

  // la lectura pública de los buckets de vitrina sigue viva
  const muestras = await sql(
    `SELECT DISTINCT ON (bucket_id) bucket_id, name FROM storage.objects
     WHERE bucket_id IN ('avatars','marca-publica','prestador-galeria','especies-razas')
     ORDER BY bucket_id, created_at DESC`,
    'verde-muestras',
  );
  for (const m of muestras) {
    const pub = await objetoPublico(m.bucket_id, m.name);
    anotar(`lectura pública sigue viva · ${m.bucket_id}`, `HTTP ${pub.status} (${pub.bytes} bytes)`, pub.status === 200);
  }

  // y los privados siguen cerrados al ajeno
  const priv = await sql(
    `SELECT DISTINCT ON (bucket_id) bucket_id, name FROM storage.objects
     WHERE bucket_id IN ('mascotas','prestador-documentos','cita-archivos')
     ORDER BY bucket_id, created_at DESC`,
    'verde-priv',
  );
  for (const p of priv) {
    const r = await objetoAutenticado(p.bucket_id, p.name, tAjeno);
    anotar(`privado sigue cerrado al ajeno · ${p.bucket_id}`, `HTTP ${r.status}`, r.status >= 400);
  }
}

linea('\n③ LIMPIEZA DEL RESIDUO QUE DEJÓ EL REPRO\n');
{
  const antes = await sql(`SELECT name FROM storage.objects WHERE name LIKE 'seg2-probe/%'`, 'res-antes');
  linea(`  residuo antes: ${antes.length} objeto(s)`);
  for (const o of antes) {
    const r = await borrarObjeto('avatars', o.name, tAjeno);
    linea(`     borrando ${o.name} → HTTP ${r.status}`);
  }
  const despues = await sql(`SELECT count(*)::int AS n FROM storage.objects WHERE name LIKE 'seg2-probe/%'`, 'res-despues');
  anotar('residuo de mis pruebas', `${despues[0].n} (esperado 0)`, despues[0].n === 0);
}

guardarSeg2('b1-verde-storage.json', filas);
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 ${r.id}: ${r.obtenido}`);
linea('');
