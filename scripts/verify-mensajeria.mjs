// Asserts imperativos de `@epetplace/mensajeria` (S111-D). Corre el .ts real vía tsx.
//
// 🔴 AUTO-PRUEBA PRIMERO (L-459): antes de contar un solo verde, el arnés se
// prueba contra un caso cuyo ROJO conozco. Si no puede fallar, su verde no vale
// nada y sale con código 2 — «no pude medir» NO es «no encontré nada».
import {
  puedeTransicionar, puedeEscribirEnHilo,
  estadoDeSilencio, DIAS_SILENCIO_PUBLICADOR,
  camposVisibles, puedeVer,
  avisaAlPadrino, REGLAS_FIN_PADRINAZGO,
  reducirCola, proximoAEnviar, puedeReintentar, hayFallidos, MAX_INTENTOS,
} from '../packages/mensajeria/src/index.ts';

const d = (s) => new Date(s);
let fallos = 0;
let corridos = 0;   // se MIDE, no se escribe: un total a mano miente el dia que agrego un caso
const check = (nombre, real, esperado) => {
  corridos++;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  console.log(`${ok ? '✓' : '✗ FALLO'} ${nombre}${ok ? '' : ` → ${JSON.stringify(real)} ≠ ${JSON.stringify(esperado)}`}`);
  if (!ok) fallos++;
  return ok;
};

// ── ⓪ AUTO-PRUEBA DEL ARNÉS ────────────────────────────────────────────────
{
  const antes = fallos;
  const capturado = [];
  const log = console.log; console.log = (m) => capturado.push(m);
  check('(auto-prueba: esto DEBE fallar)', puedeEscribirEnHilo('aceptada'), true);
  console.log = log;
  const detecto = fallos === antes + 1;
  fallos = antes; // se descuenta: era a propósito
  if (!detecto) {
    console.error('✗✗ EL ARNÉS NO PUEDE FALLAR — su verde no significa nada.');
    process.exit(2);
  }
  console.log('✓ auto-prueba: el arnés detecta un rojo sembrado');
}

// ── ① ESTADOS (§5) — los rechazos se exigen POR CÓDIGO, jamás «rebotó» ──────
check('recibida → en_conversacion por publicador',
  puedeTransicionar('recibida', 'en_conversacion', 'publicador'), { ok: true, estado: 'en_conversacion' });
check('ROJO: el solicitante NO mueve a en_conversacion',
  puedeTransicionar('recibida', 'en_conversacion', 'solicitante'), { ok: false, codigo: 'rol_no_puede', desde: 'recibida', hacia: 'en_conversacion' });
check('ROJO: desde terminal no se sale (aceptada → declinada)',
  puedeTransicionar('aceptada', 'declinada', 'publicador'), { ok: false, codigo: 'estado_terminal', desde: 'aceptada', hacia: 'declinada' });
check('ROJO: estado inventado se rechaza como desconocido',
  puedeTransicionar('recibida', 'en_tramite', 'publicador'), { ok: false, codigo: 'estado_desconocido', desde: 'recibida', hacia: 'en_tramite' });
check('ROJO: transición que no existe (declinada desde nada) ',
  puedeTransicionar('en_conversacion', 'recibida', 'publicador'), { ok: false, codigo: 'transicion_inexistente', desde: 'en_conversacion', hacia: 'recibida' });
check('el solicitante SÍ puede retirarse', puedeTransicionar('en_conversacion', 'declinada', 'solicitante'), { ok: true, estado: 'declinada' });
check('escribir: en_conversacion sí', puedeEscribirEnHilo('en_conversacion'), true);
check('escribir: declinada NO', puedeEscribirEnHilo('declinada'), false);

// ── ② EL RELOJ DE 5 DÍAS (§5) ───────────────────────────────────────────────
const baseSil = { estado: 'recibida', creadaEn: d('2026-09-01T10:00:00Z'), huboRespuestaHumanaDelPublicador: false, ahora: d('2026-09-06T10:00:01Z'), avisoDeSilencioYaEmitido: false };
check('5 días justos y sin respuesta → hay que avisar', estadoDeSilencio(baseSil), 'silencio_a_avisar');
check('4 días todavía no', estadoDeSilencio({ ...baseSil, ahora: d('2026-09-05T09:59:00Z') }), 'sin_silencio');
check('la respuesta HUMANA apaga el reloj', estadoDeSilencio({ ...baseSil, huboRespuestaHumanaDelPublicador: true }), 'sin_silencio');
check('ya avisado no se repite', estadoDeSilencio({ ...baseSil, avisoDeSilencioYaEmitido: true }), 'silencio_ya_avisado');
check('en_conversacion nunca está en silencio', estadoDeSilencio({ ...baseSil, estado: 'en_conversacion' }), 'sin_silencio');
check('declinada tampoco', estadoDeSilencio({ ...baseSil, estado: 'declinada' }), 'sin_silencio');
check('la firma son 5 días', DIAS_SILENCIO_PUBLICADOR, 5);

// ── ③ PRIVACIDAD (§5) — el gate es la PUBLICACIÓN, no el refugio ────────────
check('publicador de ESTE animal ve el hilo',
  camposVisibles({ rol: 'publicador', publicoEsteAnimal: true }), ['mensajes', 'datos_solicitante', 'estado']);
check('🔴 ROJO: publicador que NO publicó este animal no ve NADA',
  camposVisibles({ rol: 'publicador', publicoEsteAnimal: false }), []);
check('solicitante ve su propia solicitud',
  camposVisibles({ rol: 'solicitante', esSuSolicitud: true }), ['mensajes', 'datos_solicitante', 'estado']);
check('ROJO: solicitante ajeno no ve nada',
  camposVisibles({ rol: 'solicitante', esSuSolicitud: false }), []);
check('ROJO: otro no ve nada', camposVisibles({ rol: 'otro' }), []);
check('🔴 contacto_directo NO lo ve NADIE, ni el publicador legítimo',
  puedeVer({ rol: 'publicador', publicoEsteAnimal: true }, 'contacto_directo'), false);
check('🔴 contacto_directo NO lo ve ni el admin',
  puedeVer({ rol: 'admin' }, 'contacto_directo'), false);

// ── ④ PADRINAZGO (§6) — la causa estacionada nace SIN aviso ─────────────────
check('adoptado avisa', avisaAlPadrino('adoptado'), true);
check('refugio_inactivo avisa', avisaAlPadrino('refugio_inactivo'), true);
check('🅿️ fallecido NO avisa (estacionado, fail-closed)', avisaAlPadrino('fallecido'), false);
check('las TRES causas detienen el cobro, sin excepción',
  REGLAS_FIN_PADRINAZGO.every((r) => r.detieneCobro === true), true);
check('la causa sin aviso DECLARA su motivo',
  typeof REGLAS_FIN_PADRINAZGO.find((r) => r.causa === 'fallecido').motivoSinAviso === 'string', true);


// ── ⑤ LA COLA DE ENVÍO — las tres garantías, ejercidas ──────────────────────
{
  const enc = (c, k, cuerpo) => reducirCola(c, { tipo: 'encolar', claveIdempotencia: k, cuerpo });
  let c = enc([], 'k1', 'hola');
  check('encolar deja el mensaje pendiente', c.map((m) => m.estado), ['pendiente']);

  // ① EL DOBLE TOQUE NO DUPLICA
  c = enc(c, 'k1', 'hola');
  check('🔴 doble toque con la misma clave NO duplica', c.length, 1);
  c = enc(c, 'k2', 'otro');
  check('clave distinta SÍ encola', c.length, 2);

  check('el próximo a enviar es el primero pendiente', proximoAEnviar(c).claveIdempotencia, 'k1');

  c = reducirCola(c, { tipo: 'marcar_enviando', claveIdempotencia: 'k1' });
  check('enviando cuenta el intento', c[0].intentos, 1);
  check('lo que está en vuelo ya no es el próximo', proximoAEnviar(c).claveIdempotencia, 'k2');

  // ② EL FALLO SE DICE
  c = reducirCola(c, { tipo: 'fallar', claveIdempotencia: 'k1', causa: 'sin_red' });
  check('🔴 el fallo NO desaparece: queda fallido con su causa',
    [c[0].estado, c[0].causaFallo], ['fallido', 'sin_red']);
  check('hayFallidos lo ve', hayFallidos(c), true);
  check('un fallido se puede reintentar', puedeReintentar(c[0]), true);

  // ③ EL REINTENTO NO CREA UN MENSAJE NUEVO
  const antes = c.length;
  c = reducirCola(c, { tipo: 'reintentar', claveIdempotencia: 'k1' });
  check('🔴 reintentar NO agrega un mensaje', c.length, antes);
  check('reintentar vuelve a pendiente y limpia la causa',
    [c[0].estado, c[0].causaFallo], ['pendiente', undefined]);

  // el techo
  let t = enc([], 'kx', 'x');
  for (let i = 0; i < MAX_INTENTOS; i++) {
    t = reducirCola(t, { tipo: 'marcar_enviando', claveIdempotencia: 'kx' });
    t = reducirCola(t, { tipo: 'fallar', claveIdempotencia: 'kx', causa: 'sin_red' });
  }
  check('agotado el techo, NO se ofrece reintentar', puedeReintentar(t[0]), false);

  // confirmar y purgar
  c = reducirCola(c, { tipo: 'confirmar', claveIdempotencia: 'k1', idServidor: 'srv-1' });
  check('confirmar deja el id del servidor', [c[0].estado, c[0].idServidor], ['enviado', 'srv-1']);
  check('un fallo tardío NO pisa lo ya enviado',
    reducirCola(c, { tipo: 'fallar', claveIdempotencia: 'k1', causa: 'timeout' })[0].estado, 'enviado');
  check('purgar saca los enviados y deja el resto',
    reducirCola(c, { tipo: 'purgar_enviados' }).map((m) => m.claveIdempotencia), ['k2']);

  // no-op sobre clave ausente: una respuesta tardía no es un error
  check('acción sobre clave ausente es no-op, no excepción',
    reducirCola(c, { tipo: 'confirmar', claveIdempotencia: 'no_existe', idServidor: 'z' }).length, c.length);
}

console.log(
  fallos === 0
    ? `\nMENSAJERÍA: ${corridos - 1}/${corridos - 1}  (sin contar la auto-prueba)`
    : `\nFALLOS: ${fallos} de ${corridos - 1}`,
);
process.exit(fallos === 0 ? 0 : 1);
