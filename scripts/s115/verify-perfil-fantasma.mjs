#!/usr/bin/env node
/**
 * S115-C · EL PERFIL FANTASMA — su rojo es el defecto real del OTA `8a875d49`.
 *
 * 🔴 `fiscal_tax_profile_mio` **no devuelve NULL cuando no hay perfil**: devuelve
 * una FILA con todos los campos en null. Medido con la sesión real del founder:
 *
 *     {"id":null,"user_id":null,"tipo_identificacion":null,"identificacion":null,…}
 *
 * Un objeto de nulls **es truthy**, así que `if (perfil)` da true y la pantalla
 * dibuja la línea compacta — **el selector no se monta nunca**. De ahí salieron
 * los TRES síntomas que el founder reportó: no se le preguntó, el motor resolvió
 * consumidor final sobre una decisión que nadie tomó, y la etiqueta se armó con
 * `identificacion.etiqueta.null`.
 *
 * QUÉ MIDE: que `perfilUsable` descarte el fantasma y conserve el real.
 * ⚠️ Lo que NO dice: que la RPC esté curada en origen — eso es de A.
 */

/* La guarda, copiada del consumidor SOLO para ejercitarla acá. */
function perfilUsable(p) {
  if (p === null) return null;
  const tieneIdentificacion = typeof p.identificacion === 'string'
    && p.identificacion.trim().length > 0 && p.identificacion !== 'null';
  const tieneTipo = p.tipoIdentificacion !== null && p.tipoIdentificacion !== undefined;
  return tieneIdentificacion && tieneTipo ? p : null;
}
/* La decisión de la pieza. */
const queSeVe = (perfil) => (perfilUsable(perfil) ? 'LINEA_COMPACTA' : 'SELECTOR');

/* El fantasma TAL CUAL lo devuelve la RPC hoy, pasado por el wrapper
   (`String(null)` convierte el id en el string "null"). */
const FANTASMA = {
  id: String(null), tipoIdentificacion: null, identificacion: String(null),
  razonSocial: null, direccion: null, email: null, esPredeterminado: false,
};
const REAL = {
  id: 'a1b2', tipoIdentificacion: 'cedula', identificacion: '1712345678',
  razonSocial: 'Guillermo', direccion: null, email: 'g@e.com', esPredeterminado: true,
};

const casos = [
  [FANTASMA, 'SELECTOR', '🔴 EL DEFECTO: la fila de nulls NO es un perfil'],
  [null, 'SELECTOR', 'sin perfil: se pregunta'],
  [REAL, 'LINEA_COMPACTA', 'con perfil real: no se vuelve a pedir'],
  [{ ...REAL, identificacion: '   ' }, 'SELECTOR', 'identificación en blanco'],
  [{ ...REAL, tipoIdentificacion: null }, 'SELECTOR', 'sin tipo ⇒ la key se armaría rota'],
  [{ ...REAL, identificacion: 'null' }, 'SELECTOR', 'el string "null" de String(null)'],
];

let mal = 0;
for (const [p, esp, why] of casos) {
  const got = queSeVe(p);
  const ok = got === esp;
  if (!ok) mal++;
  console.log(`  ${ok ? '✓' : '✗ FALLA'}  ${got.padEnd(15)} (${why})`);
}
if (mal > 0) {
  console.error(`\nverify:perfil-fantasma — ROJO · ${casos.length - mal}/${casos.length}`);
  process.exit(1);
}
console.log(
  `\nverify:perfil-fantasma — VERDE · ${casos.length}/${casos.length}\n` +
  `   su verde dice «la fila de nulls no pasa por perfil», JAMÁS «la RPC está curada».`,
);
