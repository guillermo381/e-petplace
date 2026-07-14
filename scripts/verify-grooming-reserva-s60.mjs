// Asserts imperativos S60-A1 — wrappers de la RESERVA DE GROOMING del
// dueño contra DB viva con la sesión demo (regla 47 / L-114: build
// verde ≠ contrato). SEGURO PARA ESTADO COMPARTIDO: escribe UN hold en
// el primer inicio del próximo viernes y NO paga; imprime el cita_id
// para la limpieza quirúrgica por id (receta D-322 — server-side).
// PRECONDICIÓN del runner: la mascota demo con talla/pelaje NULL (el
// runner la resetea antes y después — el flujo completo §3 se ejercita).
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  obtenerOfertaGrooming,
  obtenerIniciosGrooming,
  obtenerGroomersDisponibles,
  declararTallaPelaje,
  obtenerPerfilMascota,
  crearBloqueoAgenda,
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
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const PREST = 'de300000-0000-4000-8000-0000000000e5';
const MASC  = 'de300000-0000-4000-8000-000000000a5c';

// próximo viernes (franjas grooming del demo: DOW 5 y 6) — fecha LOCAL
const hoy = new Date();
const viernes = new Date(hoy);
viernes.setDate(hoy.getDate() + ((5 - hoy.getDay() + 7) % 7 || 7));
const FECHA = new Intl.DateTimeFormat('en-CA').format(viernes);

// T1 — talla NULL rebota TIPADO en la oferta (el server jamás adivina)
const sinTalla = await obtenerOfertaGrooming(MASC);
check(!sinTalla.ok && sinTalla.codigo === 'talla_no_declarada', 'T1 oferta sin talla rebota talla_no_declarada', sinTalla.ok ? 'respondió ok' : sinTalla.codigo);

// T2 — declarar (patrón P19): persiste y el perfil lo LEE (aditivo S60)
const decl = await declararTallaPelaje(MASC, 'M', 'normal');
check(decl.ok && decl.data.talla === 'M' && decl.data.pelaje === 'normal', 'T2 declararTallaPelaje persiste M/normal');
const perfil = await obtenerPerfilMascota(MASC);
check(perfil.ok && perfil.data.mascota.talla === 'M' && perfil.data.mascota.pelaje === 'normal', 'T2b obtenerPerfilMascota lee talla/pelaje', perfil.ok ? `${perfil.data.mascota.talla}/${perfil.data.mascota.pelaje}` : perfil.codigo);

// T3 — la oferta comprable con el "desde" YA resuelto por SU talla
const oferta = await obtenerOfertaGrooming(MASC);
check(oferta.ok, 'T3 obtenerOfertaGrooming responde');
check(oferta.ok && oferta.data.length === 2, 'T3b los DOS comprables del menú (§1)', oferta.ok ? String(oferta.data.length) : '');
const bano = oferta.ok ? oferta.data.find((o) => o.tipo_servicio === 'grooming') : null;
check(!!bano && bano.desde_precio > 0, 'T3c Baño con desde real', String(bano?.desde_precio));

// T4 — inicios del viernes: la duración NO viaja (consecuencia por groomer)
const inicios = await obtenerIniciosGrooming({ fecha: FECHA, tipo_servicio: 'grooming', mascota_id: MASC });
check(inicios.ok && inicios.data.length > 0, 'T4 inicios reales del viernes', inicios.ok ? `${inicios.data.length} inicios` : inicios.codigo);
const HORA = inicios.ok ? inicios.data[0] : '08:00';

// T5 — el QUIÉN con precio/duración RESUELTOS + el DÓNDE null-honesto
const groomers = await obtenerGroomersDisponibles({ fecha: FECHA, hora: HORA, tipo_servicio: 'grooming', mascota_id: MASC });
check(groomers.ok, 'T5 obtenerGroomersDisponibles responde');
const g = groomers.ok ? groomers.data.find((x) => x.prestador_id === PREST) : null;
check(!!g && g.precio > 0 && g.duracion_minutos >= 30, 'T5b groomer demo con precio y duración resueltos', g ? `$${g.precio} · ${g.duracion_minutos} min` : '');
check(!!g && 'direccion' in g, 'T5c el DÓNDE viaja (null honesto si el seed no lo tiene)', String(g?.direccion));

// T6 — el hold del chasis compartido congela EXACTO lo pintado (§2)
const hold = await crearBloqueoAgenda({
  prestador_id: PREST,
  prestador_servicio_id: g?.prestador_servicio_id ?? '',
  mascota_id: MASC,
  fecha: FECHA,
  hora: HORA,
});
check(hold.ok, 'T6 crearBloqueoAgenda del grooming');
check(hold.ok && g !== null && hold.data.precio === g.precio, 'T6b precio congelado == precio pintado', hold.ok ? `${hold.data.precio} vs ${g?.precio}` : '');
check(hold.ok && g !== null && hold.data.duracion_minutos === g.duracion_minutos, 'T6c duración congelada == pintada', hold.ok ? `${hold.data.duracion_minutos} vs ${g?.duracion_minutos}` : '');
if (hold.ok) console.log(`   cita_id para limpieza quirúrgica: ${hold.data.cita_id}`);

// T7 — "editables siempre" (§3): re-declarar pisa (upsert semántico)
const redecl = await declararTallaPelaje(MASC, 'L', 'largo');
check(redecl.ok && redecl.data.talla === 'L' && redecl.data.pelaje === 'largo', 'T7 re-declarar pisa L/largo (editables siempre)');
const oferta2 = await obtenerOfertaGrooming(MASC);
check(oferta2.ok && oferta2.data.length === 2, 'T7b la oferta re-resuelve con el perfil nuevo');

console.log(fallos === 0 ? '\nTODO VERDE' : `\n${fallos} FALLOS`);
process.exit(fallos === 0 ? 0 : 1);
