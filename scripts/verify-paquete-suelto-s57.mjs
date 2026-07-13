// Asserts runtime E2E S57 — wrappers del PAQUETE (D-343) y del SUELTO
// (P18) contra DB viva con la sesión demo (regla 47 / L-114: build verde
// ≠ contrato). ESCRIBE DE VERDAD y se limpia quirúrgicamente por id al
// final (precedente S46-T3), con verificación literal de 0 residuos.
// Correr con: npx tsx scripts/verify-paquete-suelto-s57.mjs
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  initApi, iniciarSesion, obtenerMiPrestador,
  comprarPaqueteSalidas, reservarSalidaPaquete, cancelarReservaPaquete,
  obtenerMisPaquetesSalidas, obtenerSaldoPaquete,
  crearBloqueoAgenda, confirmarCitaPagada,
  reagendarCitaSuelta, cancelarCitaSuelta,
} from '../packages/api/src/index.ts';
import { dbQuery, hoyLocal } from './lib-db.mjs';

// dbExec: SOLO para el setup/limpieza quirúrgica de ESTE verify (los
// asserts de negocio van por wrappers; lib-db.mjs queda solo-SELECT).
function dbExec(sql) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`dbExec falló: ${(r.stderr || r.stdout).slice(0, 300)}`);
}

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
const check = (cond, nombre, extra = '') => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${extra ? ' — ' + extra : ''}`);
  if (!cond) fallos++;
};

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) { console.log('✗ sin sesión demo:', login.mensaje); process.exit(1); }
const prest = await obtenerMiPrestador();
const prestadorId = prest.data.id;
const [ids] = dbQuery(`
  SELECT (SELECT ps.id FROM prestador_servicios ps WHERE ps.prestador_id='${prestadorId}' AND ps.tipo_servicio='paseo' AND ps.duracion_minutos=30 AND ps.activo)::text AS servicio,
         (SELECT m.id FROM mascotas m JOIN familia_miembro fm ON fm.familia_id=m.familia_id JOIN auth.users u ON u.id=fm.user_id WHERE m.nombre='Zeus' AND u.email='${env.EXPO_PUBLIC_DEMO_EMAIL}' LIMIT 1)::text AS mascota`);
const { servicio, mascota } = ids;

// próximo sábado (siempre futuro) — fecha LOCAL (hallazgo S55)
const [y, m, d] = hoyLocal().split('-').map(Number);
const hoy = new Date(y, m - 1, d);
const sab = new Date(hoy); sab.setDate(hoy.getDate() + (((6 - hoy.getDay() + 7) % 7) || 7));
const sabado = new Intl.DateTimeFormat('en-CA').format(sab);

const residuos = { citas: [], bonos: [] };
try {
  // setup quirúrgico: el prestador demo enciende el paquete en el 30'
  dbExec(`UPDATE prestador_servicios SET precio_paquete = 4.75 WHERE id = '${servicio}'`);

  // T1 sin paquete comprado, el saldo es null honesto
  let r = await obtenerSaldoPaquete({ prestador_id: prestadorId, prestador_servicio_id: servicio, mascota_id: mascota });
  check(r.ok && r.data === null, 'T1 saldo null honesto sin paquete');

  // T2 preset fuera de letra rebota tipado
  r = await comprarPaqueteSalidas({ prestador_id: prestadorId, prestador_servicio_id: servicio, mascota_id: mascota, unidades: 7 });
  check(!r.ok && r.codigo === 'preset_invalido', 'T2 preset 7 rebota tipado', r.ok ? 'compró!' : r.codigo);

  // T3 comprar 5 → pago simulado declarado, vigencia mensual dicha
  r = await comprarPaqueteSalidas({ prestador_id: prestadorId, prestador_servicio_id: servicio, mascota_id: mascota, unidades: 5 });
  check(r.ok && r.data.total === 23.75 && r.data.saldo_total === 5 && typeof r.data.vence_el === 'string',
    'T3 compra 5×$4.75=$23.75 con vigencia declarada', r.ok ? r.data.vence_el : r.mensaje);
  const bonoId = r.ok ? r.data.bono_id : null;
  if (bonoId) residuos.bonos.push(bonoId);

  // T4 el saldo aparece donde el dueño lo busca
  r = await obtenerSaldoPaquete({ prestador_id: prestadorId, prestador_servicio_id: servicio, mascota_id: mascota });
  check(r.ok && r.data?.saldo === 5, 'T4 saldo vigente 5');
  r = await obtenerMisPaquetesSalidas();
  check(r.ok && r.data.some((p) => p.id === bonoId && p.saldo === 5), 'T4b el paquete vive en Mis paseos');

  // T5 reservar contra saldo — cita firme SIN pago
  r = await reservarSalidaPaquete({ prestador_id: prestadorId, prestador_servicio_id: servicio, mascota_id: mascota, fecha: sabado, hora: '15:00' });
  check(r.ok && r.data.saldo_restante === 4, 'T5 reserva contra saldo (4 quedan)', r.ok ? '' : r.mensaje);
  const citaPaquete = r.ok ? r.data.cita_id : null;
  if (citaPaquete) residuos.citas.push(citaPaquete);

  // T6 cancelar en ventana — vuelve al saldo
  r = await cancelarReservaPaquete(citaPaquete);
  check(r.ok && r.data.saldo === 5, 'T6 cancelación ≥2h devuelve la salida (5)');

  // T7 el suelto: hold + pago simulado (flujo S54 intacto)
  r = await crearBloqueoAgenda({ prestador_id: prestadorId, prestador_servicio_id: servicio, mascota_id: mascota, fecha: sabado, hora: '15:30' });
  check(r.ok, 'T7 hold del suelto', r.ok ? '' : r.mensaje);
  const citaSuelta = r.ok ? r.data.cita_id : null;
  if (citaSuelta) residuos.citas.push(citaSuelta);
  r = await confirmarCitaPagada({ cita_id: citaSuelta });
  check(r.ok, 'T7b pago simulado del suelto');

  // T8 reagendar ≥24h a otra franja real del MISMO paseador
  r = await reagendarCitaSuelta({ cita_id: citaSuelta, nueva_fecha: sabado, nueva_hora: '16:00' });
  check(r.ok && r.data.hora === '16:00:00', 'T8 reagenda 15:30→16:00', r.ok ? '' : r.mensaje);

  // T9 cancelar ≥24h — reembolso simulado DECLARADO
  r = await cancelarCitaSuelta(citaSuelta);
  check(r.ok && r.data.reembolso_simulado === true && r.data.reembolso_monto === 6,
    'T9 cancelación declarada sobre el pago ($6 simulado)', r.ok ? '' : r.mensaje);

  // T10 los guards de familia hablan claro
  r = await cancelarCitaSuelta(citaPaquete);
  check(!r.ok && r.codigo === 'cita_es_de_paquete', 'T10 cita de paquete rebota tipado en el wrapper del suelto');

  // T11 el ledger jamás se tocó en todo el camino
  const [{ n }] = dbQuery('SELECT count(*)::int AS n FROM eventos_economicos');
  check(n === 0, 'T11 ledger en 0 (nada de este camino devenga)', `n=${n}`);
} finally {
  // ── limpieza quirúrgica por id — receta canónica de D-322
  //    (supabase/dev/cleanup_citas_test.sql): el log append-only bloquea
  //    el SET NULL del evento padre; triggers fuera DENTRO de la
  //    transacción + recómputo del puntero vigente (S48-B8).
  const citasArr = residuos.citas.map((c) => `'${c}'::uuid`).join(',');
  const bonosArr = residuos.bonos.map((b) => `'${b}'::uuid`).join(',');
  dbExec(`begin;
do $x$
declare
  v_citas uuid[] := array[${citasArr || 'null::uuid'}]::uuid[];
  v_bonos uuid[] := array[${bonosArr || 'null::uuid'}]::uuid[];
  v_eventos uuid[]; v_mascotas uuid[];
begin
  select array_agg(distinct evento_id), array_agg(distinct mascota_id)
    into v_eventos, v_mascotas
    from evento_cita_servicio where id = any(v_citas) and evento_id is not null;
  delete from evento_cita_servicio where id = any(v_citas);
  if v_eventos is not null then
    alter table prestador_atencion_log disable trigger trg_atencion_log_no_update;
    alter table prestador_atencion_log disable trigger trg_atencion_log_no_delete;
    delete from prestador_atencion_log where evento_origen_id = any(v_eventos);
    delete from eventos_mascota where id = any(v_eventos);
    alter table prestador_atencion_log enable trigger trg_atencion_log_no_update;
    alter table prestador_atencion_log enable trigger trg_atencion_log_no_delete;
    update mascota_perfil_vigente mpv
       set ultimo_evento_id = ult.id, ultimo_evento_fecha = ult.fecha_evento
      from (select distinct on (mascota_id) mascota_id, id, fecha_evento
              from eventos_mascota
             where mascota_id = any(v_mascotas) and soft_delete = false
             order by mascota_id, fecha_evento desc) ult
     where mpv.mascota_id = ult.mascota_id;
  end if;
  delete from bonos where id = any(v_bonos);
  update prestador_servicios set precio_paquete = null where id = '${servicio}';
end $x$;
commit;`);
  const [post] = dbQuery(`SELECT (SELECT count(*) FROM bonos)::int AS bonos,
    (SELECT count(*) FROM evento_cita_servicio WHERE fecha='${sabado}' AND hora IN ('15:00','15:30','16:00'))::int AS citas,
    (SELECT count(*) FROM eventos_economicos)::int AS ledger,
    (SELECT precio_paquete FROM prestador_servicios WHERE id='${servicio}') AS pp`);
  check(post.bonos === 0 && post.citas === 0 && post.ledger === 0 && post.pp === null,
    'LIMPIEZA: 0 residuos verificados', JSON.stringify(post));
}

console.log(fallos === 0 ? '\nTODO VERDE (12/12 + limpieza)' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
