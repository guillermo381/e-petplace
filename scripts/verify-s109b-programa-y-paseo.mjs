/* S109-B · LOS DOS SUJETOS QUE NUNCA COBRARON, ejercidos contra las edges
 * DESPLEGADAS. No es un arnés contra la función: es una petición HTTP con la
 * sesión de una familia real, que es lo único que prueba que la puerta abrió.
 * Secretos leídos al momento y jamás impresos.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SEC = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();
const env = Object.fromEntries(
  readFileSync(`${SEC}/apps/cliente/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = readFileSync(`${SEC}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
if (!CLAVE || !URL || !ANON || !SERVICE) { console.error('🔴 falta un secreto'); process.exit(1); }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const cli = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: ses, error: eL } = await cli.auth.signInWithPassword(
  { email: 'guillo381+8@gmail.com', password: CLAVE });
if (eL || !ses?.session) { console.error('🔴 sin sesión:', eL?.message); process.exit(1); }
const uid = ses.session.user.id, tok = ses.session.access_token;

const { data: tar } = await admin.from('tarjetas_guardadas')
  .select('id, marca, ultimos4').eq('user_id', uid).eq('estado', 'guardada').limit(1).maybeSingle();
const { data: fm } = await admin.from('familia_miembro')
  .select('familia_id').eq('user_id', uid).is('hasta', null).limit(1).maybeSingle();
console.log(`sesión guillo381+8 · tarjeta ${tar.marca} ****${tar.ultimos4}\n`);

const cobrar = async (body) => {
  const r = await fetch(`${URL}/functions/v1/pagos-cobro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${tok}` },
    body: JSON.stringify({ ...body, tarjeta_id: tar.id }),
  });
  return { status: r.status, cuerpo: await r.text() };
};
const esperar = (ms) => new Promise((s) => setTimeout(s, ms));

/* ── ESPERAR AL WEBHOOK SONDEANDO, JAMÁS DURMIENDO UN NÚMERO ────────────────
   Medido dos veces en esta sesión: con una espera fija de 6 s y de 9 s el arnés
   leyó la cadena EN VUELO —intento `pendiente`, sujeto sin mover, comprobante
   ausente— y estuvo a un paso de reportar como defecto lo que era su propia
   impaciencia. Re-medir mostró las tres cadenas cerradas.
   *Una espera fija no puede acertar: o lee antes de tiempo, o gasta tiempo de
   más.* Se sondea el ESTADO —que es el hecho— con un techo que sí puede fallar
   por lentitud real. `L-166` en su segunda forma: el dato no sólo se lee del
   objeto, se lee cuando el objeto TERMINÓ de escribirlo. */
async function esperarWebhook(tx, techoMs = 60_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < techoMs) {
    const { data } = await admin.from('webhook_events')
      .select('resultado, detalle').eq('transaction_id', tx).maybeSingle();
    if (data?.resultado && data.resultado !== 'pendiente') return data;
    await esperar(2000);
  }
  return null;
}

/* 🔴 EL ARNÉS TIENE QUE PODER FALLAR. La primera versión imprimía los rojos y
 * salía 0 — lo cazó la pista A corriéndolo sobre `main`. *Un arnés que imprime
 * el rojo y sale 0 no vigila nada: su silencio no dice nada, y su ruido tampoco,
 * porque nadie lo lee cuando el exit dice que está bien.*
 * Es `L-437` en su forma más cara: «rebotó» no es una medición.
 */
const fallas = [];
const exigir = (cond, queFalta) => { if (!cond) { fallas.push(queFalta); console.log(`   🔴 ${queFalta}`); } };

const rastro = async (col, id, etiqueta) => {
  await esperar(2500);
  const { data: i0 } = await admin.from('pagos_intentos')
    .select('proveedor_transaction_id').eq(col, id)
    .order('creado_en', { ascending: false }).limit(1).maybeSingle();
  const w = i0?.proveedor_transaction_id
    ? await esperarWebhook(i0.proveedor_transaction_id) : null;
  exigir(!!w, `${etiqueta}: el webhook no llegó en 60 s`);
  if (w) console.log(`   webhook: ${w.resultado} · ${String(w.detalle ?? '').slice(-46)}`);
  exigir(w?.resultado === 'aplicado',
    `${etiqueta}: el acto 2 no aplicó — quedó «${w?.resultado}»`);
  const { data: i } = await admin.from('pagos_intentos')
    .select('id, estado, monto, proveedor_transaction_id, authorization_code, motivo_rechazo')
    .eq(col, id).order('creado_en', { ascending: false }).limit(1).maybeSingle();
  console.log(`   intento ${i?.estado} · $${i?.monto} · tx=${i?.proveedor_transaction_id} · auth=${i?.authorization_code}`);
  if (i?.motivo_rechazo) console.log(`   motivo: ${i.motivo_rechazo.slice(0, 160)}`);
  const { data: c } = await admin.from('notificacion_intencion')
    .select('datos').eq('clave_dedup', `comprobante:${id}`).maybeSingle();
  console.log(`   COMPROBANTE: ${c ? `«${c.datos.concepto}» · $${c.datos.monto} ${c.datos.moneda} · tx=${c.datos.transaction_id}` : 'ninguno'}`);
  /* El objetivo pide el ID, no la posibilidad: se exige transacción, código de
     autorización y un comprobante que diga QUÉ se compró. */
  exigir(i?.estado === 'aprobado' || i?.estado === 'pendiente', `${etiqueta}: el intento quedó «${i?.estado}»`);
  exigir(!!i?.proveedor_transaction_id, `${etiqueta}: sin id de transacción`);
  exigir(!!i?.authorization_code, `${etiqueta}: sin código de autorización`);
  exigir(!!c, `${etiqueta}: sin comprobante`);
  exigir(!!c && c.datos.concepto !== 'Pago en e-PetPlace',
         `${etiqueta}: el comprobante no dice qué se compró («${c?.datos?.concepto}»)`);
  return { intento: i, comprobante: c };
};

// ══ ① EL PROGRAMA DE ADIESTRAMIENTO ══════════════════════════════════════
console.log('① PROGRAMA DE ADIESTRAMIENTO');
/* 🔴 EL PROGRAMA SE ELIGE MIDIENDO SU VIGENCIA, no con un `limit(1)`.
   Tercera vez en este arnés que «el primero que haya» elige el caso: pasó con
   el perro (`programa_duplicado`), con la oferta de paseo
   (`paquete_no_disponible`) y acá con la vigencia. **Un programa cuya última
   sesión cae fuera de `vigencia_dias` es contratable y NO cobrable** — la
   compuerta lo rebota, y con razón. */
const { data: programas } = await admin.from('prestador_programas')
  .select('id, nombre, n_sesiones, vigencia_dias, prestador_servicio_id').eq('activo', true);
const pg = (programas ?? []).find((x) => (x.n_sesiones - 1) * 7 + 1 <= x.vigencia_dias);
if (!pg) { console.error('🔴 ningún programa activo cabe en su propia vigencia'); process.exit(2); }
const { data: sv } = await admin.from('prestador_servicios')
  .select('id, prestador_id').eq('id', pg.prestador_servicio_id).maybeSingle();
/* 🔴 UN PERRO SIN PROGRAMA VIVO. La primera versión tomaba el primero que
   apareciera y rebotó `programa_duplicado` — el mismo perro ya tenía uno de una
   corrida anterior. *Un arnés que toma «el primero» mide el estado que dejó la
   corrida de al lado, no el camino que vino a probar.* */
const { data: conPrograma } = await admin.from('programas_contratados')
  .select('mascota_id').in('estado', ['activo', 'pendiente']);
const ocupados = new Set((conPrograma ?? []).map((x) => x.mascota_id));
const { data: perros } = await admin.from('mascotas')
  .select('id, nombre').eq('familia_id', fm.familia_id).eq('especie', 'perro')
  .eq('estado_vida', 'activa');
const perro = (perros ?? []).find((m) => !ocupados.has(m.id));
if (!perro) { console.error('🔴 sin perro libre con que ejercer el programa'); process.exit(2); }
console.log(`   «${pg.nombre}» ${pg.n_sesiones} sesiones · mascota ${perro.nombre}`);
/* 🔴 LA FECHA SE MIDE, NO SE ELIGE. La primera versión arrancaba en `hoy+7` y
   el programa de 6 sesiones semanales terminaba PASADA su `vigencia_dias` (35)
   ⇒ la puerta lo aceptaba, el cobro salía, **y el acto 2 se caía con la plata
   ya movida** (`DF-2108181`, $90). Medido: arrancando HOY la última sesión cae
   justo en el borde y entra.
   *Un arnés que elige una fecha cómoda en vez de una medida prueba el camino
   que le tocó, no el que vino a probar.*
   Arranca MAÑANA: con `hoy` la hora 10:00 ya pasó y la puerta rebota
   `slot_en_pasado` — correctamente, porque *la puerta no ofrece lo que va a
   rechazar* (Ley 23). El programa se elige arriba midiendo que quepa. */
/* 🔴 LA FECHA SE BUSCA HASTA QUE LA COMPUERTA LA ACEPTE, no se elige.
   Medido: con `mañana` la compuerta rebota `fecha_sin_cupo: 2026-09-01` — el
   prestador no tiene cupo ese día. *Eso NO es un defecto: es la compuerta
   diciendo la verdad antes de mover plata, que es exactamente para lo que se
   cableó.* Un arnés que se rinde ahí reporta como falla el acierto del guard.
   Se prueban días sucesivos y **cada intento fallido se cancela**, para no dejar
   al perro ocupado ni residuo. */
let inicio = null, ct = null, eC = null;
for (let d = 1; d <= 8 && inicio === null; d++) {
  const cand = new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
  const r = await cli.rpc('contratar_programa', {
    p_prestador_id: sv.prestador_id, p_servicio_id: sv.id, p_programa_id: pg.id,
    p_mascota_id: perro.id, p_fecha_inicio: cand, p_hora: '10:00:00' });
  if (r.error) { console.log(`   ${cand} → la puerta rebotó: ${r.error.message.slice(0,60)}`); eC = r.error; continue; }
  const pid = r.data?.programa_contratado_id ?? r.data?.id;
  const { data: g } = await admin.rpc('verificar_compuerta_programa', { p_programa_contratado_id: pid });
  if (g?.ok === true) { inicio = cand; ct = r.data; break; }
  /* 🔴 Sólo `estado`. `motivo_vencimiento` tiene VOCABULARIO CERRADO y un texto
     libre lo rebota con `23514` — y como este `update` no leía su error, la
     cancelación fallaba en silencio, el perro quedaba ocupado y el siguiente
     candidato moría con `programa_duplicado`. *Un `update` cuyo error nadie lee
     es un guard que no aprieta.* */
  const { error: eCan } = await admin.from('programas_contratados')
    .update({ estado: 'cancelado' }).eq('id', pid);
  if (eCan) { console.error(`   🔴 no se pudo liberar ${pid.slice(0,8)}: ${eCan.message}`); process.exit(2); }
  console.log(`   ${cand} → ${g?.codigo ?? '?'} (${g?.causa ?? ''}) · descartada`);
}
if (inicio === null) { console.error('🔴 ninguna fecha de los próximos 8 días pasa la compuerta'); process.exit(2); }
console.log(`   fecha que entra: ${inicio}`);
if (eC) { exigir(false, `programa: la puerta rebotó — ${eC.message}`); }
else {
  const pid = ct.programa_contratado_id ?? ct.id;
  console.log(`   contratado ${String(pid).slice(0,8)} · ${JSON.stringify(ct).slice(0,150)}`);
  const r = await cobrar({ programa_contratado_id: pid });
  console.log(`   pagos-cobro → HTTP ${r.status} · ${r.cuerpo.slice(0, 180)}`);
  exigir(r.status === 200, `programa: pagos-cobro devolvió HTTP ${r.status}`);
  await rastro('programa_contratado_id', pid, 'programa');
  const { data: fin } = await admin.from('programas_contratados')
    .select('estado, estado_pago').eq('id', pid).maybeSingle();
  console.log(`   el programa quedó: estado=${fin?.estado} estado_pago=${fin?.estado_pago}`);
  console.log(`   ID: ${pid}`);
}

// ══ ② EL PAQUETE DE PASEO ════════════════════════════════════════════════
console.log('\n② PAQUETE DE PASEO');
/* 🔴 UNO QUE DE VERDAD OFREZCA PAQUETE. La primera versión tomaba el primer
   servicio de paseo activo y rebotó `paquete_no_disponible` — ese servicio tiene
   `precio_paquete` en NULL. **No era un hueco de datos: era el arnés eligiendo
   mal**, la misma clase que el perro de arriba.
   *«El primero que aparezca» no es una selección: es lo que la base tenga
   ordenado hoy.* */
const { data: sp } = await admin.from('prestador_servicios')
  .select('id, prestador_id, precio_paquete').eq('tipo_servicio', 'paseo')
  .eq('activo', true).not('precio_paquete', 'is', null).limit(1).maybeSingle();
if (!sp) { console.error('🔴 ningún servicio de paseo ofrece paquete'); process.exit(2); }
console.log(`   servicio ${sp.id.slice(0,8)} · $${sp.precio_paquete} por salida`);
const { data: cp, error: eP } = await cli.rpc('comprar_paquete_salidas', {
  p_prestador_id: sp.prestador_id, p_servicio_id: sp.id, p_unidades: 5,
});
if (eP) { exigir(false, `paquete de paseo: la puerta rebotó — ${eP.message}`); }
else {
  const bid = cp.bono_id ?? cp.id;
  console.log(`   bono ${String(bid).slice(0,8)} · ${JSON.stringify(cp).slice(0,150)}`);
  const r = await cobrar({ bono_id: bid });
  console.log(`   pagos-cobro → HTTP ${r.status} · ${r.cuerpo.slice(0, 180)}`);
  exigir(r.status === 200, `paquete de paseo: pagos-cobro devolvió HTTP ${r.status}`);
  await rastro('bono_id', bid, 'paquete de paseo');
  const { data: fin } = await admin.from('bonos')
    .select('estado, estado_pago').eq('id', bid).maybeSingle();
  console.log(`   el bono quedó: estado=${fin?.estado} estado_pago=${fin?.estado_pago}`);
  console.log(`   ID: ${bid}`);
}

// ══ EL VEREDICTO ═════════════════════════════════════════════════════════
if (fallas.length) {
  console.error(`\n🔴 ${fallas.length} falla(s):`);
  for (const f of fallas) console.error(`   · ${f}`);
  process.exit(1);
}
console.log('\n✓ los dos sujetos cobraron, con id de transacción y comprobante que dice qué se compró');
