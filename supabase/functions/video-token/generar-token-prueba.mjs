#!/usr/bin/env node
/**
 * GENERADOR DE TOKENS DE PRUEBA — sólo para la PRUEBA DE CABLE (S106-D, acto 2).
 *
 * ── QUÉ ES Y QUÉ NO ES ──────────────────────────────────────────────────────
 * Esto **no es la edge function**. Es una herramienta local para que C pueda
 * probar el cable **sin esperar a `video-token`**: emite dos tokens de vida
 * corta para una sala de prueba, y nada más.
 *
 * 🔴 **No autoriza a nadie.** No mira la DB, no sabe qué es una cita, no
 * pregunta quién sos. Por eso **jamás se despliega** y por eso vive al lado de
 * la edge con este encabezado: para que nadie lo confunda con el emisor real.
 * *El emisor real es `index.ts`, y el veredicto lo da una RPC.*
 *
 * ── POR QUÉ NO USA `livekit-server-sdk` ─────────────────────────────────────
 * Un token de LiveKit es un JWT **HS256** con un claim `video`. Node 18+ firma
 * eso con Web Crypto sin una sola dependencia — y este worktree **no tiene
 * `node_modules`** (medido). *Meter un `pnpm install` para firmar un JWT sería
 * pagar un árbol de dependencias por veinte líneas de crypto.*
 * La edge **sí** usa el SDK: ahí el formato de los claims tiene que salir de
 * la fuente de verdad, no de mi memoria.
 *
 * ── USO ─────────────────────────────────────────────────────────────────────
 *   LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... LIVEKIT_URL=wss://... \
 *     node generar-token-prueba.mjs
 *
 * Imprime la URL y dos tokens: uno para cada dispositivo.
 */

const KEY = process.env.LIVEKIT_API_KEY;
const SECRET = process.env.LIVEKIT_API_SECRET;
const URL_LK = process.env.LIVEKIT_URL;

if (!KEY || !SECRET || !URL_LK) {
  console.error('Faltan variables. Uso:');
  console.error("  LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... LIVEKIT_URL=wss://... node generar-token-prueba.mjs");
  console.error("  (opcional: TTL_HORAS=3 para un gate que se corre más tarde)");
  process.exit(1);
}

/** La sala del cable. Fija a propósito: los dos dispositivos tienen que caer
 *  en LA MISMA, y un nombre aleatorio es la forma más fácil de probar dos
 *  salas vacías distintas y creer que el cable falló. */
const SALA = 'cable-quito';

/** Vida corta, pero suficiente para una prueba de campo con dos teléfonos
 *  y alguien caminando entre ellos. **Por defecto 1 h.**
 *
 *  🔴 Se puede estirar con `TTL_HORAS=3` sin editar el archivo, y existe por
 *  una razón medida en campo: **un token vencido se ve EXACTAMENTE igual que
 *  un cable roto** — los dos dan «no conecta», sin error distinguible en la
 *  pantalla. Si el gate se corre horas después de generarlos, la primera
 *  hipótesis va a ser «LiveKit no anda», y va a ser falsa.
 *  Ante la duda, se regeneran: cuestan un comando. */
const TTL_HORAS = Number(process.env.TTL_HORAS ?? 1);
const TTL_SEGUNDOS = Math.round(TTL_HORAS * 60 * 60);

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function firmar(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const cuerpo = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const clave = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const firma = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(cuerpo));
  return `${cuerpo}.${b64url(new Uint8Array(firma))}`;
}

/**
 * Los grants salen del objeto: `grants.d.ts` de `livekit-server-sdk@2.18.0`.
 * `roomJoin` + `room` es el mínimo para entrar; `canPublish`/`canSubscribe`
 * es lo que hace que se vean y se oigan **en ambos sentidos**, que es el
 * criterio de verde. `roomRecord` va explícitamente en false — ver la edge.
 */
async function tokenPara(identidad, nombre) {
  const ahora = Math.floor(Date.now() / 1000);
  return firmar({
    iss: KEY,
    sub: identidad,
    jti: identidad,
    nbf: ahora - 10,           // 10 s de gracia por relojes desfasados
    exp: ahora + TTL_SEGUNDOS,
    name: nombre,
    video: {
      room: SALA,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
      roomCreate: false,
      roomAdmin: false,
      roomRecord: false,
    },
  });
}

const a = await tokenPara('cable-a', 'Dispositivo A');
const b = await tokenPara('cable-b', 'Dispositivo B');

console.log('');
console.log('  PRUEBA DE CABLE — S106');
console.log('  ─────────────────────────────────────────────');
console.log('  URL   :', URL_LK);
console.log('  SALA  :', SALA, '(la MISMA para los dos, a propósito)');
console.log('  VENCEN:', new Date(Date.now() + TTL_SEGUNDOS * 1000).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }), `(hora de Quito · TTL ${TTL_HORAS} h)`);
console.log('');
console.log('  ── Dispositivo A ──');
console.log(a);
console.log('');
console.log('  ── Dispositivo B ──');
console.log(b);
console.log('');
console.log('  Los dos entran a la MISMA sala. Si sólo se ve uno, revisá');
console.log('  que ambos hayan usado esta URL y esta sala antes de declarar');
console.log('  rojo de cable: dos salas vacías se ven igual que un cable roto.');
console.log('');
