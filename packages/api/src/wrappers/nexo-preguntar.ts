/**
 * ⭐ **LA PUERTA A LA EDGE `coach`** — lo único que faltaba entre la pantalla y
 * lo que D construyó.
 *
 * ⚠️ **ENMIENDA ADITIVA DE C, declarada (76(d)).** A entregó el motor SQL y sus
 * wrappers; D entregó la edge. **Nadie escribió la puerta de la edge**, y sin
 * ella la app no puede preguntar. Se abre acá con el molde de la casa. *Si A
 * prefiere otra forma, se reemplaza entero.*
 *
 * ── EL CONTRATO SALIÓ DE LA FUENTE DE D, NO DE SU PARTE ────────────────────
 * (`supabase/functions/coach/index.ts`, leído en su rama.)
 *
 *   → `{ mascotaId, texto }`
 *   ← 200 `{ respuesta, fuente, intencion, escalar_a_vet, aviso_ia, … }`
 *   ← 404 `{ codigo: 'memorial', mensaje }`
 *   ← err `{ codigo, mensaje }`
 *
 * 🔴 **`intencion: 'busqueda'` vuelve con `respuesta: null` A PROPÓSITO.** La
 * edge **no busca**: devuelve la intención y la consulta, y buscar es leer
 * datos de la familia, que pasa por la puerta única con la sesión de quien
 * pregunta. *Que la edge lo hiciera con `service_role` sería reimplementar la
 * RLS adentro de una edge de IA.* Por eso el `null` no es un fallo — es el
 * reparto de trabajo, y la pantalla tiene que saberlo.
 */
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export const CODIGOS_NEXO = [
  'memorial',
  'sin_sesion',
  'cuerpo_invalido',
  'texto_muy_largo',
  'contexto_no_disponible',
  'error_desconocido',
] as const;
export type CodigoErrorNexo = (typeof CODIGOS_NEXO)[number];

const MENSAJES: Record<CodigoErrorNexo, string> = {
  /* La voz real la manda la edge (lleva el nombre de la mascota); ésta es el
     piso por si no llegara. */
  memorial: 'Acá ya no hay nada que preguntar.',
  sin_sesion: 'Inicia sesión para hablar con Nexo.',
  cuerpo_invalido: 'No pudimos entender la pregunta.',
  texto_muy_largo: 'Escríbelo un poco más corto.',
  /* 🔴 **503 honesto de D**: sin expediente no contesta. *Contestar sobre una
     mascota sin su expediente es el modo de falla que la pieza existe para no
     tener.* */
  contexto_no_disponible: 'No pudimos leer su expediente ahora.',
  error_desconocido: 'No pudimos responder. Prueba de nuevo en un rato.',
};

export type IntencionNexo = 'busqueda' | 'dato' | 'narrativa' | 'fuera';
export type FuenteRespuestaNexo = 'plantilla' | 'modelo' | 'router' | 'router_caido';

export type RespuestaDeNexo = {
  /** `null` **sólo** cuando la intención es `busqueda`: ahí busca la app. */
  respuesta: string | null;
  fuente: FuenteRespuestaNexo;
  intencion: IntencionNexo;
  /** Lo que hay que buscar, cuando la intención es `busqueda`. */
  consulta: string | null;
  /** La respuesta misma ofreció el vet ⇒ la pantalla ofrece el acto. */
  escalarAVet: boolean;
  /** Primer turno: se muestra el aviso de que es IA. */
  avisoIa: boolean;
  /** De qué plantilla salió, cuando no tocó modelo. Sirve para medir costo. */
  plantilla: string | null;
};

const esObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function codigoDe(v: unknown): CodigoErrorNexo {
  const c = esObj(v) && typeof v.codigo === 'string' ? v.codigo : '';
  return (CODIGOS_NEXO as readonly string[]).includes(c) ? (c as CodigoErrorNexo) : 'error_desconocido';
}

export async function preguntarANexo(
  mascotaId: string,
  texto: string,
): Promise<ResultadoWrapper<RespuestaDeNexo, CodigoErrorNexo>> {
  const { data, error } = await getClient().functions.invoke('coach', {
    body: { mascotaId, texto },
  });

  if (error) {
    /* 🔴 **El cuerpo del error trae el código tipado, y hay que leerlo.** Un
       `FunctionsHttpError` sin abrir su cuerpo convierte «esta mascota está en
       memorial» —que es una respuesta correcta— en «algo falló». */
    if (error instanceof FunctionsHttpError) {
      const cuerpo: unknown = await error.context.json().catch(() => null);
      const c = codigoDe(cuerpo);
      const m = esObj(cuerpo) && typeof cuerpo.mensaje === 'string' ? cuerpo.mensaje : MENSAJES[c];
      return { ok: false, codigo: c, mensaje: m };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  if (!esObj(data) || typeof data.intencion !== 'string') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return {
    ok: true,
    data: {
      respuesta: typeof data.respuesta === 'string' ? data.respuesta : null,
      fuente: (typeof data.fuente === 'string' ? data.fuente : 'modelo') as FuenteRespuestaNexo,
      intencion: data.intencion as IntencionNexo,
      consulta: typeof data.consulta === 'string' ? data.consulta : null,
      escalarAVet: data.escalar_a_vet === true,
      avisoIa: data.aviso_ia === true,
      plantilla: typeof data.plantilla === 'string' ? data.plantilla : null,
    },
  };
}
