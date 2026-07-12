// Asserts imperativos S55-A B3 — wrappers de Cuenta v1 contra DB viva
// con la sesión demo (regla 47 / L-114). SEGURO PARA ESTADO COMPARTIDO:
// todo lo que escribe se restaura (perfil/familia) o se limpia por id
// (la cita pagada del assert de Pagos — imprime el id).
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  obtenerMiPerfil,
  actualizarMiPerfil,
  obtenerMiFamilia,
  renombrarFamilia,
  obtenerPreferencias,
  guardarIdiomaPreferido,
  guardarPreferenciaNotificacion,
  obtenerMisPagos,
  obtenerSlotsDisponibles,
  crearBloqueoAgenda,
  confirmarCitaPagada,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ sin sesión demo:', login.mensaje);
  process.exit(1);
}

// ── Tu perfil ──
const p1 = await obtenerMiPerfil();
check(p1.ok && typeof p1.data.email === 'string', 'T1 obtenerMiPerfil con email', p1.ok ? p1.data.email : p1.codigo);
const telOriginal = p1.ok ? p1.data.telefono : null;

const tel = await actualizarMiPerfil({ telefono: '593999999999' });
check(tel.ok, 'T2 actualizarMiPerfil teléfono E.164');
const p2 = await obtenerMiPerfil();
check(p2.ok && p2.data.telefono === '593999999999', 'T2b el teléfono persistió');
await actualizarMiPerfil({ telefono: telOriginal ?? '' });

const telMalo = await actualizarMiPerfil({ telefono: 'abc123' });
check(!telMalo.ok && telMalo.codigo === 'telefono_invalido', 'T2c teléfono inválido → tipado', telMalo.ok ? 'PUDO' : telMalo.codigo);

// ── Tu familia ──
const f1 = await obtenerMiFamilia();
check(f1.ok && f1.data.mi_rol === 'adulto_titular', 'T3 obtenerMiFamilia (titular)', f1.ok ? f1.data.nombre : f1.codigo);
check(f1.ok && f1.data.miembros.some((m) => m.es_yo && m.nombre !== null), 'T3b el propio miembro con nombre');
if (f1.ok && f1.data.nombre !== null) {
  // roundtrip solo si hay nombre que restaurar (la familia demo nace
  // sin nombre — NULL honesto; el wrapper no puede escribir NULL)
  const original = f1.data.nombre;
  const ren = await renombrarFamilia(f1.data.familia_id, `${original} [test]`);
  check(ren.ok, 'T4 renombrarFamilia (titular pasa)');
  const f2 = await obtenerMiFamilia();
  check(f2.ok && f2.data.nombre === `${original} [test]`, 'T4b el rename persistió');
  const rest = await renombrarFamilia(f1.data.familia_id, original);
  check(rest.ok, 'T4c nombre original RESTAURADO');
} else {
  console.log('· T4 SKIP honesto: la familia demo no tiene nombre (NULL) — el roundtrip corre en familias con nombre');
  const renVacio = await renombrarFamilia(f1.ok ? f1.data.familia_id : '', '   ');
  check(!renVacio.ok && renVacio.codigo === 'nombre_requerido', 'T4 nombre vacío → tipado', renVacio.ok ? 'PUDO' : renVacio.codigo);
}

// ── Preferencias (D-316) ──
const pr1 = await obtenerPreferencias();
check(pr1.ok, 'T5 obtenerPreferencias responde');
const gi = await guardarIdiomaPreferido('en');
check(gi.ok, 'T6 guardarIdiomaPreferido(en)');
const pr2 = await obtenerPreferencias();
check(pr2.ok && pr2.data.idioma === 'en', 'T6b idioma persistido en DB');
await guardarIdiomaPreferido('es');

const gn = await guardarPreferenciaNotificacion(['promocion', 'cita_recordatorio'], false);
check(gn.ok, 'T7 apagar grupo de notificaciones');
const pr3 = await obtenerPreferencias();
check(
  pr3.ok && pr3.data.notificaciones.promocion === false && pr3.data.notificaciones.cita_recordatorio === false,
  'T7b los tipos apagados persistieron',
);
await guardarPreferenciaNotificacion(['promocion', 'cita_recordatorio'], true);
const pr4 = await obtenerPreferencias();
check(pr4.ok && pr4.data.notificaciones.promocion === true, 'T7c re-encendido persistió (contrato B4)');

// ── Pagos: caso positivo REAL (hold + pago simulado) ──
const PREST = 'de300000-0000-4000-8000-0000000000e5';
const SRV = 'de300000-0000-4000-8000-00000000a5e0';
const MASC = 'de300000-0000-4000-8000-000000000a5c';
const hoy = new Date();
const sabado = new Date(hoy);
sabado.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7));
const FECHA = new Intl.DateTimeFormat('en-CA').format(sabado);
const slots = await obtenerSlotsDisponibles({ prestador_id: PREST, prestador_servicio_id: SRV, desde: FECHA, hasta: FECHA });
let citaId = 'NINGUNA';
if (slots.ok && slots.data.length > 0) {
  const hold = await crearBloqueoAgenda({ prestador_id: PREST, prestador_servicio_id: SRV, mascota_id: MASC, fecha: FECHA, hora: slots.data[0].hora.slice(0, 5) });
  if (hold.ok) {
    citaId = hold.data.cita_id;
    await confirmarCitaPagada({ cita_id: citaId });
  }
}
const pagos = await obtenerMisPagos();
check(pagos.ok, 'T8 obtenerMisPagos responde');
const fila = pagos.ok ? pagos.data.find((x) => x.cita_id === citaId) : undefined;
check(!!fila && fila.monto === 10 && fila.pago_simulado === true && fila.pagado_en !== null,
  'T8b el pago recién hecho aparece con monto y "simulado" declarado',
  fila ? `${fila.monto} · simulado=${fila.pago_simulado}` : 'no está');

console.log(`\nCITA_TEST_ID=${citaId} (pagada — limpieza quirúrgica server-side por id)`);
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
