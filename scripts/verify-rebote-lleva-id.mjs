#!/usr/bin/env node
/**
 * verify-rebote-lleva-id.mjs — UN REBOTE QUE TRAE UN ID NO SE LO PUEDE COMER EL WRAPPER
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ EXISTE
 *
 * `L-424` dice que un guard que vive en un ÍNDICE **sólo sabe negarse**, y que
 * la cura son DOS capas: el índice, que no se puede saltear, y el guard tipado,
 * que **explica** — y que el rebote lleve **el id de lo que ya existe**, para
 * poder LLEVAR ahí en vez de decir que no.
 *
 * El motor de adopción cumple su mitad: `RAISE 'solicitud_ya_viva: %', v_sol`.
 * **El wrapper se comía el uuid**: `fallo()` mapeaba por prefijo y devolvía el
 * mensaje estático, tirando el resto del raw.
 *
 * > ### Y la forma en que se veía era la peor: **el JSDoc afirmaba que el id viajaba en `mensaje`.** Un hueco callado deja a alguien buscando; un comentario que promete de más lo manda a construir contra algo que no existe.
 *
 * ⇒ `L-424` quedaba **cumplida en el motor y deshecha en la puerta**.
 *
 * ── QUÉ MIDE, Y CONTRA QUÉ ───────────────────────────────────────────────
 * Corre el **camino real** del wrapper —no una reimplementación de `fallo()`—
 * inyectando un cliente que devuelve el error crudo que el motor produce.
 * *Reimplementar el mapeo acá probaría mi copia, no la pieza.*
 *
 * ── ⚠️ LA REGLA 35 NO SE AFLOJA ──────────────────────────────────────────
 * `detalle` es **para mostrar y para navegar, jamás para ramificar**. Este gate
 * exige que `codigo` siga siendo el discriminador: si alguien "curara" esto
 * metiendo el uuid en `mensaje`, el brazo 3 se pone en rojo.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { initApi, getClient, crearSolicitudAdopcion } from '../packages/api/src/index.ts';

const UUID = '3f1c9a52-0b7e-4d21-9c8a-6e5b4d3c2a10';
let ok = 0, fail = 0;
const check = (nombre, cond, detalle = '') => {
  if (cond) { ok++; console.log(`✓ ${nombre}`); }
  else { fail++; console.log(`✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`); }
};

initApi('http://127.0.0.1:1', 'clave-de-prueba-no-viaja-a-ningun-lado');
const cliente = getClient();
/** El motor crudo, tal como PostgREST lo entrega. */
const conRaw = (message) => { cliente.rpc = async () => ({ data: null, error: { message } }); };

// ══ ① EL BRAZO QUE CURA: el id del motor tiene que LLEGAR ═════════════════
conRaw(`solicitud_ya_viva: ${UUID}`);
const r1 = await crearSolicitudAdopcion({ publicacionId: UUID });
check('el rebote NO es ok', r1.ok === false);
check('discrimina por codigo (regla 35)', r1.ok === false && r1.codigo === 'solicitud_ya_viva',
      r1.ok === false ? `codigo=${r1.codigo}` : '');
check('🔴 el id del motor LLEGA al cliente, en `detalle`',
      r1.ok === false && typeof r1.detalle === 'string' && r1.detalle.includes(UUID),
      r1.ok === false ? `detalle=${JSON.stringify(r1.detalle)}` : '');

// ══ ② EL CONTROL POSITIVO DE LA VOZ: `mensaje` sigue siendo para leer ═════
check('`mensaje` sigue siendo la frase humana, no el crudo',
      r1.ok === false && r1.mensaje === 'Ya postulaste por este animal.',
      r1.ok === false ? `mensaje=${JSON.stringify(r1.mensaje)}` : '');

// ══ ③ REGLA 35: el uuid NO se cuela en `mensaje` ══════════════════════════
/* Si alguien "cura" esto pegando el crudo en `mensaje`, la pantalla vuelve a
   ramificar por prosa. Este brazo lo pone en rojo. */
check('🔴 el uuid NO viaja en `mensaje` (regla 35)',
      r1.ok === false && !r1.mensaje.includes(UUID));

// ══ ④ CONTROL NEGATIVO: un código SIN detalle no fabrica uno ══════════════
/* `solicitud_terminal` viaja pelado. Si `detalle` volviera con algo, estaríamos
   inventando — y un detalle inventado es peor que ninguno. */
conRaw('solicitud_terminal');
const r2 = await crearSolicitudAdopcion({ publicacionId: UUID });
check('codigo pelado se mapea igual', r2.ok === false && r2.codigo === 'solicitud_terminal');
check('🔴 sin detalle real, `detalle` NO se inventa',
      r2.ok === false && (r2.detalle === null || r2.detalle === undefined),
      r2.ok === false ? `detalle=${JSON.stringify(r2.detalle)}` : '');

// ══ ⑤ CONTROL NEGATIVO: un crudo desconocido NO se disfraza ═══════════════
conRaw('algo_que_nadie_declaro: 42');
const r3 = await crearSolicitudAdopcion({ publicacionId: UUID });
check('crudo desconocido cae en error_desconocido',
      r3.ok === false && r3.codigo === 'error_desconocido',
      r3.ok === false ? `codigo=${r3.codigo}` : '');
check('y su crudo se CONSERVA para diagnosticar',
      r3.ok === false && typeof r3.detalle === 'string' && r3.detalle.includes('algo_que_nadie_declaro'),
      r3.ok === false ? `detalle=${JSON.stringify(r3.detalle)}` : '');

// ══ ⑥ auth_required sigue teniendo su mapeo propio ════════════════════════
conRaw('auth_required');
const r4 = await crearSolicitudAdopcion({ publicacionId: UUID });
check('auth_required → sin_sesion', r4.ok === false && r4.codigo === 'sin_sesion');

console.log(`\nREBOTE-LLEVA-ID: ${ok}/${ok + fail}`);
if (fail > 0) { console.log('🔴 ROJO'); process.exit(1); }
