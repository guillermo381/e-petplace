/**
 * S92-BIS · B0 — LOS SEIS FLUJOS DE MAYOR RIESGO, POR CAMINO REAL.
 *
 * S92 reescribió 17 policies, revocó decenas de funciones, borró 64 cuentas y
 * purgó una columna. **El modo de falla de todo eso es el silencio, y aparece
 * lejos.** Las 27 verificaciones prueban objetos; esto prueba **flujos** — los
 * mismos seis que el founder camina en dispositivo.
 *
 * ── DOS DECISIONES DE MÉTODO, DECLARADAS ─────────────────────────────────────
 * ① **Thor y Zeus son PRODUCCIÓN** (arranque, R3). Sobre ellos solo se LEE;
 *    nada de esta sesión les escribe. Para lo que exige escribir se crea un
 *    fixture propio (`seg2-*`), que se limpia dentro de la sesión.
 * ② **El INSERT de nota clínica NO se ejecuta con datos válidos.** Se manda con
 *    ids imposibles y se lee el DISCRIMINADOR de S90: un rebote de NEGOCIO
 *    (FK, NOT NULL) prueba que **el permiso pasó** — que es la pregunta—;
 *    un 42501 probaría que la policy quedó rota. *Escribir un caso clínico
 *    falso en la base de un vet real para probar un permiso sería curar una
 *    cosa rompiendo otra.*
 */
import { rest, rpc, tokenDe, guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';
import { readFileSync } from 'node:fs';

const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const filas = [];
const anotar = (flujo, id, obtenido, ok) => {
  filas.push({ flujo, id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(44)} ${obtenido}`);
};

const t = await tokenDe(DEMO_MAIL, DEMO_PW);

linea('\n══ B0 · LOS SEIS FLUJOS DE MAYOR RIESGO ══\n');

// ── ① «TU NEGOCIO» — el síntoma exacto del 42501 de S91 ────────────────────
linea('① «Tu negocio» (el 42501 de S91 nació acá)\n');
{
  const p = await rpc('obtener_mi_prestador', {}, { token: t });
  anotar(1, 'obtener_mi_prestador', `HTTP ${p.status}`, p.status === 200);
  // columnas MEDIDAS del catálogo, no escritas de memoria: la v1 de este script
  // pidió `nombre_legal`, `hora_inicio` y `url` —ninguna existe— y cosechó tres
  // 400 que parecían regresiones de S92. Eran 42703. (S92 §⑦, quinta vez.)
  const c = await rest('/rest/v1/cuentas_comerciales?select=id,estado,razon_social,nombre_comercial&limit=2', { token: t });
  anotar(1, 'cuenta comercial con sus columnas', `HTTP ${c.status}`, c.status === 200);
  const e = await rest('/rest/v1/prestador_empleados?select=id,rol,activo&limit=3', { token: t });
  anotar(1, 'equipo del negocio', `HTTP ${e.status}`, e.status === 200);
}

// ── ② INSERT DE NOTA CLÍNICA — sin escribir nada ───────────────────────────
linea('\n② INSERT de caso clínico (la policy que S91 rompió)\n');
{
  const CEROS = '00000000-0000-0000-0000-000000000000';
  const r = await rest('/rest/v1/caso_clinico', {
    token: t,
    metodo: 'POST',
    cuerpo: { mascota_id: CEROS, cuenta_comercial_tratante_id: CEROS, titulo: 'seg2-probe' },
    prefer: 'return=minimal',
  });
  const esPermiso = r.status === 401 || r.status === 403 || /42501|permission denied|row-level security/i.test(r.cuerpo);
  anotar(
    2,
    'INSERT caso_clinico (ids imposibles)',
    `HTTP ${r.status} · ${esPermiso ? '🔴 rebote de PERMISO' : 'rebote de NEGOCIO ⇒ el permiso PASÓ'} · ${r.cuerpo.slice(0, 70)}`,
    !esPermiso,
  );
  const lect = await rest('/rest/v1/caso_clinico?select=id,estado,mascota_id&limit=2', { token: t });
  anotar(2, 'lectura de casos clínicos', `HTTP ${lect.status}`, lect.status === 200);
}

// ── ③ AGENDA Y HUB DE GROOMING ─────────────────────────────────────────────
linea('\n③ Agenda del prestador y hub de grooming (D-700 tocó sus policies)\n');
{
  const ag = await rest('/rest/v1/evento_cita_servicio?select=id,fecha,hora,estado,tipo_servicio,prestador_id&limit=5', { token: t });
  anotar(3, 'agenda · citas con sus columnas', `HTTP ${ag.status}`, ag.status === 200);
  const h = await rest('/rest/v1/prestador_horarios?select=id,prestador_id,dia_semana,activo&limit=5', { token: t });
  anotar(3, 'franjas de horario', `HTTP ${h.status}`, h.status === 200);
  const s = await rest('/rest/v1/prestador_servicios?select=id,prestador_id,activo,precio&limit=5', { token: t });
  anotar(3, 'oferta de servicios', `HTTP ${s.status}`, s.status === 200);
  const sedes = await rpc('obtener_sedes_de_mis_citas', { p_prestador_ids: [] }, { token: t });
  anotar(3, 'lector angosto de sedes (grooming)', `HTTP ${sedes.status}`, sedes.status === 200);
}

// ── ④ CARNET / PDF CLÍNICO POR LA FAMILIA ──────────────────────────────────
linea('\n④ Documentos de mascota (el bucket es de B1; acá va el MOTOR)\n');
{
  // ⚠️ `bucket` y `storage_path` son EL MAPA de la base a Storage — insumo
  // directo del censo de impacto de B1 (R2: «columnas que guardan paths»).
  const docs = await rest('/rest/v1/evento_archivo_adjunto?select=id,mascota_id,bucket,storage_path,categoria&limit=3', { token: t });
  anotar(4, 'adjuntos de evento (bucket + path)', `HTTP ${docs.status}`, docs.status === 200);
  const vac = await rest('/rest/v1/evento_vacuna_aplicada?select=id,mascota_id,nombre_vacuna&limit=3', { token: t });
  anotar(4, 'vacunas (el carnet)', `HTTP ${vac.status}`, vac.status === 200);
  const acc = await rest('/rest/v1/mascota_acceso_prestador?select=id,mascota_id&limit=3', { token: t });
  anotar(4, 'acceso a mascota por cita', `HTTP ${acc.status}`, acc.status === 200);
}

// ── ⑤ VITRINA PÚBLICA ──────────────────────────────────────────────────────
linea('\n⑤ Vitrina pública de prestador (las 5 policies migradas viven acá)\n');
{
  const v = await rest('/rest/v1/v_prestadores_publicos?select=id,nombre_comercial,portadas&limit=3', { token: t });
  anotar(5, 'vista pública con portadas', `HTTP ${v.status}`, v.status === 200);
  for (const [tabla, cols] of [
    ['prestador_fotos', 'id,prestador_id'],
    ['prestador_especialidades', 'id,prestador_id'],
    ['prestador_zonas', 'id,prestador_id'],
  ]) {
    const r = await rest(`/rest/v1/${tabla}?select=${cols}&limit=3`, { token: t });
    const conFilas = r.status === 200 && r.cuerpo.trim() !== '[]';
    anotar(5, `vitrina · ${tabla}`, `HTTP ${r.status}${conFilas ? ' con filas' : ' VACÍO ⚠️'}`, conFilas);
  }
}

// ── ⑥ ALTA DE CUENTA NUEVA — el flujo entero, con fixture propio ───────────
linea('\n⑥ Alta de cuenta nueva (fixture seg2-*, se limpia al cierre)\n');
{
  const correo = `seg2-alta-${Date.now()}@epetplace.dev`;
  const pw = 'Seg2-2026!';
  const r = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: pw, data: { nombre: 'Sonda Perímetro' } }),
  });
  const d = await r.json().catch(() => ({}));
  anotar(6, 'signup de cuenta nueva', `HTTP ${r.status} · ${d.access_token ? 'con sesión' : d.user ? 'creada sin sesión' : '⚠️ falló'}`, r.status < 400 && (d.access_token || d.user));

  if (d.access_token) {
    const est = await rpc('get_estado_onboarding_dueno', {}, { token: d.access_token });
    anotar(6, 'estado de onboarding del recién llegado', `HTTP ${est.status}`, est.status === 200);
    const cat = await rest('/rest/v1/cat_especies?select=codigo,nombre&limit=3', { token: d.access_token });
    anotar(6, 'catálogo de especies (lo lee el alta)', `HTTP ${cat.status}`, cat.status === 200);
  }
  guardarSeg2('b0-fixture-alta.json', { correo, creada: r.status < 400 });
}

guardarSeg2('b0-seis-flujos.json', filas);
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 [flujo ${r.flujo}] ${r.id}: ${r.obtenido}`);
linea('');
