// Arnés de la COLA DE MEDIA (S107-D) — corre en node con almacén en memoria.
//
// QUÉ PRUEBA, y por qué cada caso existe:
//  1. sobrevive al cierre de la app (lo que la cola vieja NO hacía: `Map` de
//     módulo, `clips-sesion.ts`, «muere con la app»)
//  2. el fallo de red NO pierde el ítem: queda con backoff y vuelve
//  3. 🔴 DISCRIMINADOR: con la subida hecha y el registro fallado, el
//     reintento **NO vuelve a subir** — se cuenta la llamada, no se supone
//  4. agotar los reintentos deja 'error' VISIBLE y NO descarta (la foto del
//     acta es prueba: `CRITERIO_LEGAL_GUARDERIA` §4)
//  5. el backoff se respeta: antes de su hora, el ítem no se toca
//  6. sin motor cableado la cola guarda y lo DICE (`motor_no_cableado`)
//  7. publicar sin etiqueta se corta en la puerta
//  8. reintento a mano revive el ítem en 'error'
//
// Ninguna de las 8 toca red ni DB: la cola es lógica pura sobre un almacén.
//
// 🔴 EL ROJO SE PRODUJO, y el primer intento fue un VERDE FLOJO: romper la
// escritura del `storagePath` entre el paso 1 y el 2 **no puso el arnés en
// rojo**, porque el path se persiste por DOS caminos (también en `fallo()`).
// Hizo falta romper LOS DOS para que 3b y 3c cayeran (`subidas=2`). ⇒ este
// arnés discrimina la PROPIEDAD «el byte no se sube dos veces», no una línea;
// y la redundancia de los dos caminos quedó medida, no supuesta. *Un arnés que
// no se probó en rojo mide su propia buena fe* (L-192).
import {
  configurarAlmacen,
  encolar,
  leerCola,
  pendientesDe,
  procesarCola,
  reintentar,
  descartar,
  pesoMedido,
  INTENTOS_AUTOMATICOS,
  CLIP_TECHO_S,
  type Almacen,
  type ItemMedia,
  type MotorDeSubida,
} from '../apps/prestador/src/lib/cola-media';
import { reglasSegunLugar, REGLAS_ENCUADRE } from '../apps/prestador/src/lib/encuadre';

let fallos = 0;
function ok(cond: boolean, nombre: string, detalle = '') {
  console.log(`${cond ? '  ✓' : '  ✗'} ${nombre}${detalle ? ` · ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

/** Almacén en memoria — el "disco" del teléfono. */
function almacenEnMemoria(): Almacen & { crudo: Map<string, string> } {
  const crudo = new Map<string, string>();
  return {
    crudo,
    async getItem(k) {
      return crudo.get(k) ?? null;
    },
    async setItem(k, v) {
      crudo.set(k, v);
    },
  };
}

const DIA = '2026-08-28';
const BASE = { tipo: 'foto' as const, mascotaIds: ['thor', 'zeus'], fecha: DIA };

/** Motor de mentira con contadores — el discriminador vive acá. */
function motorFalso(plan: {
  subir?: () => { ok: true; storagePath: string; bytes: number } | { ok: false; causa: any; mensaje: string };
  registrar?: () => { ok: true } | { ok: false; causa: any; mensaje: string };
}) {
  const cuenta = { subidas: 0, registros: 0 };
  const motor: MotorDeSubida = {
    async subir() {
      cuenta.subidas += 1;
      return plan.subir ? plan.subir() : { ok: true as const, storagePath: `p/${cuenta.subidas}.jpg`, bytes: 2_500_000 };
    },
    async registrar() {
      cuenta.registros += 1;
      return plan.registrar ? plan.registrar() : { ok: true as const };
    },
  };
  return { motor, cuenta };
}

async function main() {
  console.log('\n— COLA DE MEDIA · S107-D —\n');

  // ── 1 · sobrevive al cierre ────────────────────────────────────────────
  {
    const disco = almacenEnMemoria();
    configurarAlmacen(disco);
    await encolar({ ...BASE, uri: 'file://a.jpg' });
    // "cerrar la app": el módulo se olvida de todo salvo el disco.
    configurarAlmacen({ getItem: disco.getItem, setItem: disco.setItem });
    const tras = await pendientesDe(DIA);
    ok(tras.length === 1, '1 · sobrevive al cierre de la app', `${tras.length} ítem`);
    ok(tras[0]?.mascotaIds.length === 2, '1b · conserva sus DOS etiquetas');
  }

  // ── 2 · red caída no pierde nada ───────────────────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    await encolar({ ...BASE, uri: 'file://b.jpg' });
    const { motor } = motorFalso({ subir: () => ({ ok: false, causa: 'red', mensaje: 'network request failed' }) });
    const r = await procesarCola(motor, { fecha: DIA });
    const [it] = await pendientesDe(DIA);
    ok(r.publicados === 0 && r.pendientes === 1, '2 · red caída: queda pendiente, no se pierde');
    ok(it?.estado === 'en_cola' && it.intentos === 1, '2b · vuelve a la cola con su intento contado', it?.estado);
    ok((it?.proximoIntentoEn ?? 0) > Date.now(), '2c · backoff con hora futura');
  }

  // ── 3 · 🔴 EL DISCRIMINADOR: no re-sube el byte ────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    await encolar({ ...BASE, uri: 'file://c.jpg' });
    let registroFalla = true;
    const { motor, cuenta } = motorFalso({
      registrar: () => (registroFalla ? { ok: false, causa: 'registro', mensaje: 'motor no existe' } : { ok: true }),
    });

    await procesarCola(motor, { fecha: DIA });
    const [tras1] = await pendientesDe(DIA);
    ok(tras1?.estado === 'subida_sin_registrar', '3 · subida hecha + registro fallado ⇒ estado que lo dice', tras1?.estado);
    ok(!!tras1?.storagePath, '3b · el path queda persistido');

    // El reintento: se fuerza la hora para saltar el backoff.
    registroFalla = false;
    const luego = Date.now() + 60 * 60 * 1000;
    await procesarCola(motor, { fecha: DIA, ahora: luego });

    ok(cuenta.subidas === 1, '3c · 🔴 EL REINTENTO NO RE-SUBIÓ EL BYTE', `subidas=${cuenta.subidas} registros=${cuenta.registros}`);
    // Mide el conteo, y nada más: la afirmación fuerte («no re-subió») es 3c.
    // Este assert da verde AUNQUE la cola re-suba — se comprobó produciendo el
    // rojo, y por eso su nombre dice lo que mide y no lo que uno querría.
    ok(cuenta.registros === 2, '3d · el registro se reintentó exactamente una vez más');
    const pend = await pendientesDe(DIA);
    ok(pend.length === 0, '3e · publicada: ya no está pendiente');
  }

  // ── 4 · agotar reintentos: error visible, jamás descarte ───────────────
  {
    configurarAlmacen(almacenEnMemoria());
    await encolar({ ...BASE, uri: 'file://d.jpg' });
    const { motor } = motorFalso({ subir: () => ({ ok: false, causa: 'servidor', mensaje: 'boom' }) });
    let ahora = Date.now();
    for (let i = 0; i < INTENTOS_AUTOMATICOS + 2; i += 1) {
      ahora += 60 * 60 * 1000;
      await procesarCola(motor, { fecha: DIA, ahora });
    }
    const [it] = await pendientesDe(DIA);
    ok(!!it, '4 · 🔴 tras agotar los reintentos el ítem SIGUE EN LA COLA');
    ok(it?.estado === 'error', '4b · y su estado lo dice', it?.estado);
    ok(it?.intentos === INTENTOS_AUTOMATICOS, '4c · contó exactamente los automáticos', String(it?.intentos));

    // ── 8 · reintento a mano ────────────────────────────────────────────
    await reintentar(it!.id);
    const [revivido] = await pendientesDe(DIA);
    ok(revivido?.estado === 'en_cola' && revivido.intentos === 0, '8 · el reintento a mano lo revive');

    await descartar(revivido!.id);
    ok((await pendientesDe(DIA)).length === 0, '8b · descartar es explícito y funciona');
  }

  // ── 5 · el backoff se respeta ──────────────────────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    await encolar({ ...BASE, uri: 'file://e.jpg' });
    const { motor, cuenta } = motorFalso({ subir: () => ({ ok: false, causa: 'red', mensaje: 'network' }) });
    await procesarCola(motor, { fecha: DIA });
    await procesarCola(motor, { fecha: DIA }); // sin avanzar el reloj
    ok(cuenta.subidas === 1, '5 · antes de su hora el ítem no se toca', `subidas=${cuenta.subidas}`);
  }

  // ── 6 · sin motor: guarda y lo dice ────────────────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    await encolar({ ...BASE, uri: 'file://f.jpg' });
    const r = await procesarCola(null, { fecha: DIA });
    const [it] = await pendientesDe(DIA);
    ok(r.pendientes === 1 && it?.causa === 'motor_no_cableado', '6 · sin motor: INERTE y declarado', it?.causa);
    ok(!!it, '6b · y el ítem sigue guardado');
  }

  // ── 7 · sin etiqueta no se encola ──────────────────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    let corto = false;
    try {
      await encolar({ ...BASE, mascotaIds: [], uri: 'file://g.jpg' });
    } catch {
      corto = true;
    }
    ok(corto, '7 · publicar sin etiqueta se corta en la puerta');
  }

  // ── 9 · el peso sale del uso real, y su ausencia NO es cero ────────────
  {
    configurarAlmacen(almacenEnMemoria());
    ok((await pesoMedido('foto')) === null, '9 · sin capturas el peso es AUSENCIA, no 0 MB');

    await encolar({ ...BASE, uri: 'file://h.jpg' });
    const { motor } = motorFalso({
      subir: () => ({ ok: true, storagePath: 'p/h.jpg', bytes: 3_145_728 }), // 3 MB
    });
    await procesarCola(motor, { fecha: DIA });
    const peso = await pesoMedido('foto');
    ok(peso?.n === 1 && peso.promedioMB === 3, '9b · mide el byte que REALMENTE se subió', `${peso?.promedioMB} MB`);
    ok((await pesoMedido('clip')) === null, '9c · no inventa peso para un tipo que nadie capturó');
  }

  // ── 10 · el techo del clip corta EN LA PUERTA ──────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    let corto = false;
    try {
      await encolar({ ...BASE, tipo: 'clip', uri: 'file://largo.mp4', duracionS: 34 });
    } catch {
      corto = true;
    }
    ok(corto, '10 · un clip de 34s no entra a la cola');

    // 30.9 = 30 + la tolerancia de contenedor del CHECK de A: un archivo
    // honesto de 30s que el contenedor reporta un poco largo NO puede rebotar.
    await encolar({ ...BASE, tipo: 'clip', uri: 'file://justo.mp4', duracionS: CLIP_TECHO_S + 0.9 });
    ok((await pendientesDe(DIA)).length === 1, '10b · 🔴 y uno de 30.9s SÍ entra: la tolerancia no se come el caso honesto');
  }

  // ── 11 · el encuadre se modula por lugar, pero no las dos duras ─────────
  {
    const inst = reglasSegunLugar('instalaciones');
    const dom = reglasSegunLugar('domicilio');
    ok(!inst.includes('domicilio_primer_plano'), '11 · en instalaciones no se guía sobre fachadas');
    ok(dom.length === REGLAS_ENCUADRE.length, '11b · en el domicilio rigen las cuatro');
    ok(
      inst.includes('menores_descarte') && inst.includes('personas_no'),
      '11c · 🔴 menores y personas NO se modulan por lugar: rigen siempre',
    );
  }

  console.log(`\n${fallos === 0 ? '✅ TODO VERDE' : `❌ ${fallos} FALLO(S)`}\n`);
  process.exitCode = fallos === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error('arnés reventó:', e);
  process.exitCode = 1;
});
