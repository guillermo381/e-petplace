/**
 * use-captura-media.ts — EL MÓDULO DE CAPTURA DEL DURANTE (S107-D).
 *
 * Lo que C monta. **La pantalla es de C, la pieza es de B, la lógica es de
 * acá** — y el borde lo fijó la propia `ContadorClip`: *«la pieza NO detiene
 * la cámara: avisa. Quien graba es la pantalla»*. Este hook no dibuja nada y
 * no toca la cámara: **orquesta** captura → etiquetas → cola → subida, y
 * expone el estado para que la pantalla lo pinte.
 *
 * ── LOS PARÁMETROS DE COMPRESIÓN, ELEGIDOS Y DECLARADOS (brief de D) ─────
 * **Foto: calidad 0.7 · lado máximo 1600 px.** El 0.7 es el default de la casa
 * (`capturaFoto`, patrón `EvidenciaFoto`). El **1600 no es una preferencia: es
 * el número que la casa ya midió** en S94 (D-734) para la evidencia que se
 * **abre a pantalla completa** — con 800 quedaría blanda, *y una foto liviana
 * que se ve mal no es una cura sino una regresión con mejor número*. La media
 * de guardería se abre, así que va a 1600.
 *
 * **Clip: 720p en captura y techo de 30 s**, sin post-proceso. Es la vía que
 * la mesa firmó (28-ago) para que **todo este módulo viaje por OTA**: comprimir
 * después exigiría un módulo nativo nuevo, o sea un lugar en el tren. ⚠️ El
 * `videoQuality` lo aplica la pantalla al montar la cámara (es una prop de
 * `CameraView`); acá vive el número para que **no haya dos fuentes**.
 *
 * ⚠️ **El peso real no se estima: se mide.** No hay bitrate configurable en la
 * captura de video, así que lo elige el encoder de cada teléfono — por eso la
 * cola guarda el byte que subió y `pesoMedido()` lo promedia del uso real.
 *
 * ── EL ENCUADRE VIAJA COMO CÓDIGO, JAMÁS COMO TEXTO ──────────────────────
 * 🔴 `CRITERIO_LEGAL_GUARDERIA` §5 es **ley de captura**, y el contrato de A
 * §④ lo dice con todas las letras: *«ningún texto de este bloque se redacta en
 * pantalla como cláusula — la pantalla sólo guía el encuadre»*, y el §0 del
 * plan prohíbe redactar legales en las pistas, **placeholder incluido**. Por
 * eso este módulo exporta **las cuatro reglas como CÓDIGOS**: la voz la pone el
 * diccionario de C, y los strings los lee el founder en su lote.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { capturarConCamara } from '@epetplace/ui';
import {
  encolar,
  pendientesDe,
  procesarCola,
  descartar,
  reintentar,
  reetiquetar,
  pesoMedido,
  type ItemMedia,
  type PesoMedido,
} from './cola-media';
import { crearMotorMedia, type PublicarMedia, type AvisarMediaPublicada } from './motor-media';
import {
  levantarActaLocal,
  procesarActas,
  pendientesDeEstadia,
  type ActaLocal,
  type AltaActa,
  type LevantarActa,
} from './cola-actas';

export { CLIP_TECHO_S } from './cola-media';

/** Compresión, en un solo lugar. */
export const CALIDAD_FOTO = 0.7;
export const LADO_MAXIMO_FOTO = 1600;
export const CALIDAD_VIDEO = '720p' as const;

// Las reglas del encuadre viven en `encuadre.ts` — sin React ni RN, para que
// se puedan probar en banco. Acá solo se re-exportan para el consumidor.
export { REGLAS_ENCUADRE, reglasSegunLugar, type ReglaEncuadre, type LugarDeCaptura } from './encuadre';

export type ResultadoCapturaMedia =
  | { estado: 'capturada'; uri: string }
  | { estado: 'cancelada' }
  | { estado: 'permiso_denegado' };

export interface OpcionesCapturaMedia {
  /** Día de la estadía, `YYYY-MM-DD` — ancla del contrato de A. */
  fecha: string;
  prestadorId: string;
  /** El wrapper de A. `null` mientras no exista: la cola guarda y lo dice. */
  publicar: PublicarMedia | null;
  avisar?: AvisarMediaPublicada | null;
  /** El wrapper de actas de A. `null` mientras no exista: el acta se levanta
   *  igual, en la puerta, y viaja cuando haya con qué. */
  levantarActa?: LevantarActa | null;
  /** La estadía en curso — el acta cuelga de ella. */
  estadiaId?: string;
  bucketFoto: string;
  bucketClip: string;
  /** Cada cuánto reintenta lo pendiente mientras la pantalla está a la vista.
   *  El backoff real lo decide la cola; esto solo la despierta. */
  latidoMs?: number;
}

export interface CapturaMedia {
  pendientes: ItemMedia[];
  /** Abre la cámara para una foto, ya comprimida. NO publica: la selección de
   *  animales viene después, y sin etiquetas no hay publicación. */
  capturarFoto: () => Promise<ResultadoCapturaMedia>;
  /** Publica lo capturado con sus etiquetas. `mascotaIds` mínimo 1. */
  publicarCaptura: (input: {
    uri: string;
    tipo: 'foto' | 'clip';
    mascotaIds: string[];
    duracionS?: number;
  }) => Promise<void>;
  /** Corrección del mismo día, antes de que salga (firma del founder). */
  corregirEtiquetas: (id: string, mascotaIds: string[]) => Promise<void>;
  descartarPendiente: (id: string) => Promise<void>;
  reintentarPendiente: (id: string) => Promise<void>;
  /** Despierta la cola ahora (pull-to-refresh, o al volver el foco). */
  empujar: () => Promise<void>;
  /** El dato que se declara al cierre — del uso real, `null` si no hay. */
  peso: (tipo: 'foto' | 'clip') => Promise<PesoMedido | null>;
  /** Actas de esta estadía que todavía no llegaron al servidor. */
  actasPendientes: ActaLocal[];
  /**
   * Levanta el acta EN LA PUERTA. Devuelve al instante: **no espera red, no
   * espera que suban las fotos, no espera al dueño** — la recogida no se frena
   * (contrato de actas §④). El viaje ocurre solo, cuando sus fotos estén arriba.
   */
  levantarActaEnLaPuerta: (alta: Omit<AltaActa, 'estadiaId'>) => Promise<void>;
}

export function useCapturaMedia(opciones: OpcionesCapturaMedia): CapturaMedia {
  const [pendientes, setPendientes] = useState<ItemMedia[]>([]);
  const [actasPendientes, setActasPendientes] = useState<ActaLocal[]>([]);
  const vivo = useRef(true);
  // El motor se rehace cuando cambian sus deps, pero la cola es de disco: no
  // hay estado que perder al recrearlo.
  const motor = crearMotorMedia({
    prestadorId: opciones.prestadorId,
    bucketFoto: opciones.bucketFoto,
    bucketClip: opciones.bucketClip,
    publicar: opciones.publicar,
    avisar: opciones.avisar,
  });

  const refrescar = useCallback(async () => {
    const items = await pendientesDe(opciones.fecha);
    if (vivo.current) setPendientes(items);
    if (opciones.estadiaId) {
      const actas = await pendientesDeEstadia(opciones.estadiaId);
      if (vivo.current) setActasPendientes(actas);
    }
  }, [opciones.fecha, opciones.estadiaId]);

  const empujar = useCallback(async () => {
    // 🔴 EL ORDEN NO ES CASUAL: primero la media, después las actas. Un acta
    // viaja con los `mediaIds` REALES de sus fotos, así que si las actas
    // corrieran primero no encontrarían ninguno y esperarían un ciclo entero
    // de más — con el cuidador todavía en la puerta.
    await procesarCola(motor, { fecha: opciones.fecha });
    await procesarActas(opciones.levantarActa ?? null);
    await refrescar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opciones.fecha, refrescar, opciones.publicar, opciones.levantarActa]);

  useEffect(() => {
    vivo.current = true;
    void empujar();
    const ms = opciones.latidoMs ?? 20_000;
    const t = setInterval(() => {
      void empujar();
    }, ms);
    return () => {
      vivo.current = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opciones.fecha, opciones.latidoMs]);

  const capturarFoto = useCallback(async (): Promise<ResultadoCapturaMedia> => {
    const r = await capturarConCamara({ calidad: CALIDAD_FOTO, redimensionarA: LADO_MAXIMO_FOTO });
    if (r.tipo === 'foto') return { estado: 'capturada', uri: r.foto.uri };
    if (r.tipo === 'permiso_denegado') return { estado: 'permiso_denegado' };
    return { estado: 'cancelada' };
  }, []);

  const publicarCaptura = useCallback(
    async (input: { uri: string; tipo: 'foto' | 'clip'; mascotaIds: string[]; duracionS?: number }) => {
      // El techo lo corta la PUERTA de la cola (`encolar`), no este consumidor:
      // así lo respetan todos los caminos, no solo el que lo conoce.
      await encolar({
        uri: input.uri,
        tipo: input.tipo,
        mascotaIds: input.mascotaIds,
        fecha: opciones.fecha,
        duracionS: input.duracionS,
      });
      await empujar();
    },
    [opciones.fecha, empujar],
  );

  const corregirEtiquetas = useCallback(
    async (id: string, mascotaIds: string[]) => {
      await reetiquetar(id, mascotaIds);
      await refrescar();
    },
    [refrescar],
  );

  const descartarPendiente = useCallback(
    async (id: string) => {
      await descartar(id);
      await refrescar();
    },
    [refrescar],
  );

  const reintentarPendiente = useCallback(
    async (id: string) => {
      await reintentar(id);
      await empujar();
    },
    [empujar],
  );

  const levantarActaEnLaPuerta = useCallback(
    async (alta: Omit<AltaActa, 'estadiaId'>) => {
      if (!opciones.estadiaId) throw new Error('use-captura-media: falta estadiaId para levantar un acta');
      await levantarActaLocal({ ...alta, estadiaId: opciones.estadiaId });
      await empujar();
    },
    [opciones.estadiaId, empujar],
  );

  return {
    pendientes,
    actasPendientes,
    levantarActaEnLaPuerta,
    capturarFoto,
    publicarCaptura,
    corregirEtiquetas,
    descartarPendiente,
    reintentarPendiente,
    empujar,
    peso: pesoMedido,
  };
}
