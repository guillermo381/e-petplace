// Arnés de la COLA DE ACTAS (S107-D) — banco, con almacén en memoria.
//
// El acta se levanta EN LA PUERTA y viaja después. Lo que se prueba es
// exactamente lo que hace que eso no sea una promesa:
//  1. sin fotos no se levanta (criterio §4: un acta sin foto de entrada no
//     responde la única pregunta para la que existe)
//  2. el acta EXISTE en la puerta antes de cualquier red
//  3. 🔴 INVERTIDO AL CABLEAR: el acta viaja AUNQUE sus fotos sigan en cola.
//     `levantar_acta_guarderia` no recibe `mediaIds` (medido contra la función
//     viva), así que hacerla esperar sería inventar un acoplamiento que el
//     motor no pide — y dejar el acta en el teléfono por una razón muerta.
//  4. 🔴 la hora que viaja es la de la PUERTA, no la de la subida
//  7. la clave de idempotencia es ESTABLE entre reintentos — si cambiara, la
//     idempotencia del servidor no serviría de nada
//  5. un fallo de red NO deja el acta muerta: vuelve a 'lista' y reintenta
//  6. sin el wrapper cableado no viaja y el acta sigue guardada
import { configurarAlmacen, type Almacen } from '../apps/prestador/src/lib/almacen';
import { encolar, procesarCola, type MotorDeSubida } from '../apps/prestador/src/lib/cola-media';
import {
  levantarActaLocal,
  procesarActas,
  pendientesDeEstadia,
  leerActas,
  type LevantarActa,
} from '../apps/prestador/src/lib/cola-actas';

let fallos = 0;
function ok(cond: boolean, nombre: string, detalle = '') {
  console.log(`${cond ? '  ✓' : '  ✗'} ${nombre}${detalle ? ` · ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

function almacenEnMemoria(): Almacen {
  const m = new Map<string, string>();
  return {
    async getItem(k) {
      return m.get(k) ?? null;
    },
    async setItem(k, v) {
      m.set(k, v);
    },
  };
}

const DIA = '2026-08-28';
const ESTADIA = 'est-1';

function motorOk(): MotorDeSubida {
  let n = 0;
  return {
    async subir() {
      n += 1;
      return { ok: true as const, storagePath: `p/${n}.jpg`, bytes: 1_000_000 };
    },
    async registrar() {
      return { ok: true as const, mediaId: `media-srv-${n}` };
    },
  };
}

async function main() {
  console.log('\n— COLA DE ACTAS · S107-D —\n');

  // ── 1 · sin fotos no se levanta ────────────────────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    let corto = false;
    try {
      await levantarActaLocal({
        estadiaId: ESTADIA,
        direccion: 'recogida',
        carnetVerificado: true,
        fotosLocales: [],
      });
    } catch {
      corto = true;
    }
    ok(corto, '1 · un acta sin fotos de estado no se levanta');
  }

  // ── 2·3·4 · el acta viaja SIN esperar a sus fotos ──────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    const foto = await encolar({ uri: 'file://a.jpg', tipo: 'foto', mascotaIds: ['thor'], fecha: DIA });

    const acta = await levantarActaLocal({
      estadiaId: ESTADIA,
      direccion: 'recogida',
      carnetVerificado: true,
      observaciones: 'llegó tranquilo',
      fotosLocales: [foto.id],
    });

    ok((await pendientesDeEstadia(ESTADIA)).length === 1, '2 · el acta existe en la puerta antes de cualquier red');

    let recibido: Parameters<LevantarActa>[0] | null = null;
    const levantar: LevantarActa = async (e) => {
      recibido = e;
      return { ok: true as const, actaId: 'acta-srv-1' };
    };

    // 🔴 La foto sigue SIN subir — y el acta viaja igual.
    const r1 = await procesarActas(levantar);
    ok(r1.levantadas === 1, '3 · 🔴 el acta viaja aunque sus fotos sigan en cola', JSON.stringify(r1));
    ok(!!recibido, '3b · llegó al servidor');
    ok(
      !!recibido && Math.abs(Date.parse((recibido as any).levantadaEn) - acta.levantadaEn) < 1000,
      '4 · 🔴 la hora que viaja es la de la PUERTA, no la de la subida',
    );
    ok((await leerActas())[0]?.estado === 'levantada', '3c · y queda marcada como levantada');
  }

  // ── 7 · la clave de idempotencia no cambia entre reintentos ────────────
  {
    configurarAlmacen(almacenEnMemoria());
    const foto = await encolar({ uri: 'file://d.jpg', tipo: 'foto', mascotaIds: ['thor'], fecha: DIA });
    await levantarActaLocal({
      estadiaId: ESTADIA,
      direccion: 'recogida',
      carnetVerificado: true,
      fotosLocales: [foto.id],
    });

    const claves: string[] = [];
    let falla = true;
    const inestable: LevantarActa = async (e) => {
      claves.push(e.claveIdempotencia);
      return falla
        ? { ok: false as const, codigo: 'red', mensaje: 'network' }
        : { ok: true as const, actaId: 'acta-srv-9' };
    };

    await procesarActas(inestable);
    falla = false;
    await procesarActas(inestable);

    ok(claves.length === 2, '7 · hubo dos intentos', String(claves.length));
    ok(
      claves[0] === claves[1] && !!claves[0],
      '7b · 🔴 la clave de idempotencia es LA MISMA en el reintento',
      claves[0]?.slice(0, 20),
    );
  }

  // ── 5 · un fallo no mata el acta ───────────────────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    const foto = await encolar({ uri: 'file://b.jpg', tipo: 'foto', mascotaIds: ['zeus'], fecha: DIA });
    await levantarActaLocal({
      estadiaId: ESTADIA,
      direccion: 'devolucion',
      carnetVerificado: false,
      fotosLocales: [foto.id],
    });
    await procesarCola(motorOk(), { fecha: DIA });

    let falla = true;
    const inestable: LevantarActa = async () =>
      falla ? { ok: false as const, codigo: 'red', mensaje: 'network' } : { ok: true as const, actaId: 'acta-srv-2' };

    await procesarActas(inestable);
    const tras = (await leerActas())[0];
    ok(tras?.estado === 'lista' && tras.intentos === 1, '5 · 🔴 el fallo NO mata el acta: vuelve a lista', tras?.estado);

    falla = false;
    const r = await procesarActas(inestable);
    ok(r.levantadas === 1, '5b · y el reintento la levanta');
  }

  // ── 6 · sin wrapper cableado ───────────────────────────────────────────
  {
    configurarAlmacen(almacenEnMemoria());
    const foto = await encolar({ uri: 'file://c.jpg', tipo: 'foto', mascotaIds: ['thor'], fecha: DIA });
    await levantarActaLocal({
      estadiaId: ESTADIA,
      direccion: 'recogida',
      carnetVerificado: true,
      fotosLocales: [foto.id],
    });
    await procesarCola(motorOk(), { fecha: DIA });
    const r = await procesarActas(null);
    ok(r.levantadas === 0, '6 · sin el wrapper de A el acta no viaja');
    ok((await pendientesDeEstadia(ESTADIA)).length === 1, '6b · y sigue guardada, con su hora');
  }

  console.log(`\n${fallos === 0 ? '✅ TODO VERDE' : `❌ ${fallos} FALLO(S)`}\n`);
  process.exitCode = fallos === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error('arnés reventó:', e);
  process.exitCode = 1;
});
