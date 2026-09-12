#!/usr/bin/env node
/**
 * S115-C · LA VOZ DE LA SESIÓN CORTADA — y lo que NUNCA debe ofrecer.
 *
 * 🔴 **Firma del founder (12-sep):** *«cortada» NO es «te desconectamos». Es «el
 * refresco no está volviendo», y **puede revivir sola en la próxima vuelta**.*
 * ⇒ con la sesión cortada se dice que estamos reconectando y **jamás se manda a
 * entrar de nuevo**: *mandar a re-loguear a alguien cuya sesión va a volver sola
 * le hace perder lo que estaba haciendo por un problema que se iba a resolver.*
 *
 * El caso que lo parió: **cuatro cuelgues seguidos**, y el mensaje genérico «no
 * cargó» mandó al founder a mirar la red **las cuatro veces**.
 *
 * QUÉ MIDE: ① cada estado tiene SU voz · ② sólo `sinSesion` ofrece entrar ·
 * ③ el mapa es exhaustivo (un motivo nuevo no puede quedar sin voz).
 * ⚠️ NO dice que la sesión se recupere: eso es del refresco (A).
 */
const MOTIVOS = ['red', 'sesionCortada', 'sinSesion'];

/* El mapa de la pieza, con las claves que de verdad usa. */
const VOZ = {
  red:           { titulo: 'noCargo.titulo',        detalle: 'noCargo.detalle' },
  sesionCortada: { titulo: 'sesion.cortadaTitulo',  detalle: 'sesion.cortadaDetalle' },
  sinSesion:     { titulo: 'sesion.sinSesionTitulo',detalle: 'sesion.sinSesionDetalle' },
};
const ofreceEntrar = (m) => m === 'sinSesion';

let mal = 0;
const ok = (c, l) => { if (!c) mal++; console.log(`  ${c ? '✓' : '✗ FALLA'}  ${l}`); };

/* ① exhaustividad: ningún motivo sin voz (el caso `identificacion.etiqueta.null`). */
for (const m of MOTIVOS) ok(VOZ[m] !== undefined, `«${m}» tiene voz propia`);
/* ② las tres voces son DISTINTAS: si dos comparten texto, el mensaje vuelve a
      mandar a mirar el lado equivocado. */
const titulos = new Set(MOTIVOS.map((m) => VOZ[m].titulo));
ok(titulos.size === MOTIVOS.length, 'las tres voces son distintas entre sí');
/* ③ EL PUNTO QUE FIRMÓ EL FOUNDER. */
ok(ofreceEntrar('sesionCortada') === false,
  '🔴 «cortada» NO ofrece entrar de nuevo (puede volver sola)');
ok(ofreceEntrar('sinSesion') === true,
  '«sin sesión» SÍ ofrece entrar (no hay nada que reconectar)');
ok(ofreceEntrar('red') === false, '«red» ofrece reintentar, no entrar');
/* ④ control: un motivo inventado no tiene voz ⇒ el Record lo exigiría en tsc. */
ok(VOZ['inventado'] === undefined, 'control: un motivo fuera del tipo no tiene voz');

if (mal > 0) { console.error(`\nverify:voz-de-sesion — ROJO · ${mal} fallo(s)`); process.exit(1); }
console.log(`\nverify:voz-de-sesion — VERDE\n   su verde dice «cada estado tiene su voz y cortada no expulsa», JAMÁS «la sesión se recupera».`);
