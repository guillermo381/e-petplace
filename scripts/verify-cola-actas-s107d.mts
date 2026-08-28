// Arnés de la COLA DE ACTAS (S107-D) — banco, con almacén en memoria.
//
// El acta se levanta EN LA PUERTA y viaja después. Lo que se prueba es
// exactamente lo que hace que eso no sea una promesa:
//  1. sin fotos no se levanta (criterio §4: un acta sin foto de entrada no
//     responde la única pregunta para la que existe)
//  2. con fotos sin subir NO viaja, y lo dice — pero YA EXISTE localmente
//  3. cuando las fotos suben, viaja con los mediaIds REALES del servidor
//  4. 🔴 la hora que viaja es la de la PUERTA, no la de la subida
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

  // ── 2·3·4 · el acta espera a sus fotos, y viaja con la hora de la puerta ─
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

    // El acta EXISTE en la puerta, aunque nada haya viajado.
    ok((await pendientesDeEstadia(ESTADIA)).length === 1, '2 · el acta existe en la puerta antes de cualquier red');

    let recibido: Parameters<LevantarActa>[0] | null = null;
    const levantar: LevantarActa = async (e) => {
      recibido = e;
      return { ok: true as const, actaId: 'acta-srv-1' };
    };

    // Con la foto SIN subir: no viaja.
    const r1 = await procesarActas(levantar);
    ok(r1.levantadas === 0 && r1.esperandoMedia === 1, '2b · con la foto sin subir el acta NO viaja', JSON.stringify(r1));
    ok(recibido === null, '2c · y nadie llamó al servidor');

    // Sube la foto → ahora sí.
    await procesarCola(motorOk(), { fecha: DIA });
    const r2 = await procesarActas(levantar);
    ok(r2.levantadas === 1, '3 · con las fotos arriba, el acta viaja');
    ok(
      !!recibido && (recibido as any).mediaIds.length === 1 && (recibido as any).mediaIds[0].startsWith('media-srv-'),
      '3b · 🔴 viaja con el mediaId REAL del servidor, no con el id local',
      recibido ? (recibido as any).mediaIds[0] : '—',
    );
    ok(
      !!recibido && Math.abs(Date.parse((recibido as any).levantadaEn) - acta.levantadaEn) < 1000,
      '4 · 🔴 la hora que viaja es la de la PUERTA, no la de la subida',
    );
    ok((await leerActas())[0]?.estado === 'levantada', '3c · y queda marcada como levantada');
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
