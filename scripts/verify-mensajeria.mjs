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
} from '../packages/mensajeria/src/index.ts';

const d = (s) => new Date(s);
let fallos = 0;
const check = (nombre, real, esperado) => {
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

const total = 26;
console.log(fallos === 0 ? `\nMENSAJERÍA: ${total}/${total}` : `\nFALLOS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
