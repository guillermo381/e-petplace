/**
 * S105-A · LAS TARJETAS QUE EL PROVEEDOR TIENE POR VÁLIDAS.
 *
 * Puerta de `pagos-tarjetas` (edge de la pista D, `jwt=true`). Consulta
 * `GET /v2/card/list?uid=…` de Nuvei. **La sesión es la autorización: el `uid`
 * jamás viaja desde el cliente.**
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 LO QUE ESTA PIEZA **NO** CURA, y hay que saberlo antes de usarla:
 * **no resuelve la duplicación de tarjetas, y no podía.**
 *
 * Medido por D contra el parque real: `uid_consultados: 9`, **8 tarjetas todas
 * `valid`** — `vi ****1111 ×4` y `di ****0808 ×4`. *Las ocho están vivas del
 * lado del proveedor.* La duplicación es síntoma de **`D-921`**: hasta esta
 * jornada el `uid` ante Nuvei era **el id del alta**, así que cada alta
 * tokenizaba de cero ⇒ **una persona, ocho uid**.
 *
 * ⇒ **La lista NO va a bajar de 8 a 2 por usar esto.** Lo que baja es el
 * parque viejo, con el uid estable que ya está en producción — y la señal de
 * que se extinguió es **`uidConsultados` llegando a 1**, sin tocar una línea
 * de esta edge.
 *
 * **Lo que sí cura:** que no se ofrezca una tarjeta que el proveedor ya no
 * tiene por válida — el caso del founder que abre el alta y no completa el OTP.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { FunctionsHttpError } from '@supabase/supabase-js';
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS = [
  'sin_sesion',
  /** 🔴 NO es `sin_sesion`: la sesión existe y **no se pudo verificar**. D los
   *  separó a propósito — *si cayeran juntos, una caída de auth se disfrazaría
   *  de un problema del usuario y lo mandaríamos a re-loguearse en vano.* */
  'sesion_no_verificable',
  'no_se_pudo_leer',
  'servidor_sin_configurar',
  'red',
] as const;
export type CodigoTarjetas = (typeof CODIGOS)[number];

export type EstadoProveedor =
  | 'valid'
  /**
   * 🔴 `null` SIGNIFICA «NO PREGUNTAMOS», JAMÁS «válida». Llega así cuando
   * `verificado === false`. *Tratarlo como `valid` convertiría el fail-open en
   * una afirmación que nadie hizo.*
   */
  | null;

/**
 * 🔴 **NO ES `TarjetaGuardada` Y EL NOMBRE LO DICE.** Ése es la FILA LOCAL
 * (`tarjetas-guardadas.ts`): lo que nosotros anotamos al dar de alta, con
 * `expiraMes/Anio` y `creadaEn`. **Ésta es la fila CONTRASTADA contra el
 * proveedor**: trae `token`, `bin` y `estadoProveedor`, y **no** trae los datos
 * de vencimiento porque `card/list` no los devuelve.
 *
 * *Reusar el mismo nombre para las dos habría hecho que una pantalla creyera
 * tener `expiraMes` en un objeto que nunca lo tuvo* — y eso no lo caza el
 * compilador si el tipo se ensancha «para que entren los dos».
 */
export type TarjetaVerificada = {
  id: string;
  token: string;
  marca: string | null;
  bin: string | null;
  ultimos4: string | null;
  alias: string | null;
  estadoProveedor: EstadoProveedor;
};

export type ListadoTarjetas = {
  /**
   * 🔴 **EL CAMPO QUE DECIDE LA VOZ.** `false` = **FAIL-OPEN**: la lista viene
   * completa y **sin verificar** contra el proveedor, con `estadoProveedor`
   * en `null`.
   *
   * **Es decisión firmada, no descuido:** *dejar a alguien sin poder pagar
   * porque un tercero está lento es peor que el estado de hoy — y el estado de
   * hoy es exactamente mostrar sin verificar.* La pantalla **muestra igual**,
   * con una voz que lo diga.
   */
  verificado: boolean;
  tarjetas: TarjetaVerificada[];
  /**
   * Cuántas identidades ante el proveedor hubo que consultar. **Es el
   * termómetro de `D-921`**: cuando llegue a 1, el parque viejo se extinguió.
   */
  uidConsultados: number;
  /**
   * 🔴 **SI ES > 0 SE DICE.** *Un listado que encoge sin explicación se lee
   * como que perdimos una tarjeta.* Lo que no está `valid` **no se lista y no
   * se reactiva: se agrega de nuevo.**
   */
  ocultasPorEstado: number;
  /** > 0 sólo si el tope de 12 uid recortó la consulta. */
  uidNoConsultados: number;
  uidSinRespuesta: number;
};

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

async function codigoDeError(error: unknown): Promise<CodigoTarjetas> {
  if (error instanceof FunctionsHttpError) {
    try {
      const cuerpo: unknown = await error.context.json();
      const codigo = esObj(cuerpo) ? cuerpo.codigo : null;
      if (typeof codigo === 'string' && (CODIGOS as readonly string[]).includes(codigo)) {
        return codigo as CodigoTarjetas;
      }
    } catch {
      /* body no-JSON: cae abajo. */
    }
    return 'no_se_pudo_leer';
  }
  return 'red';
}

/**
 * Lista los medios de pago guardados, contrastados contra el proveedor.
 *
 * ⚠️ **NO CACHEAR.** El `estadoProveedor` viaja EN VUELO y no es columna de
 * ninguna tabla nuestra — decisión de D: *un estado del proveedor guardado en
 * nuestra tabla es un estado que envejece sin avisar.* Se consulta al abrir el
 * listado, cada vez.
 */
export async function listarTarjetasVerificadas(): Promise<
  ResultadoWrapper<ListadoTarjetas, CodigoTarjetas>
> {
  const { data, error } = await getClient().functions.invoke('pagos-tarjetas', { body: {} });
  if (error) {
    const codigo = await codigoDeError(error);
    return { ok: false, codigo, mensaje: codigo };
  }
  if (!esObj(data) || data.ok !== true || !Array.isArray(data.tarjetas)) {
    return { ok: false, codigo: 'no_se_pudo_leer', mensaje: 'no_se_pudo_leer' };
  }

  const tarjetas: TarjetaVerificada[] = [];
  for (const t of data.tarjetas as unknown[]) {
    if (!esObj(t) || typeof t.id !== 'string' || typeof t.token !== 'string') continue;
    /* 🔴 El estado se valida contra el vocabulario: cualquier cosa que no sea
       `valid` cae en `null`, que es «no sabemos». *Castearlo dejaría entrar un
       estado nuevo del proveedor como si fuera bueno.* */
    const est = t.estado_proveedor;
    tarjetas.push({
      id: t.id,
      token: t.token,
      marca: typeof t.marca === 'string' ? t.marca : null,
      bin: typeof t.bin === 'string' ? t.bin : null,
      ultimos4: typeof t.ultimos4 === 'string' ? t.ultimos4 : null,
      alias: typeof t.alias === 'string' ? t.alias : null,
      estadoProveedor: est === 'valid' ? 'valid' : null,
    });
  }

  const n = (v: unknown) => (typeof v === 'number' ? v : 0);
  return {
    ok: true,
    data: {
      /* 🔴 `verificado` SE EXIGE BOOLEANO EXPLÍCITO. Si faltara, asumir `true`
         diría que contrastamos contra el proveedor cuando no lo sabemos —
         **el fail-open se volvería una afirmación falsa**. Ausente ⇒ `false`. */
      verificado: data.verificado === true,
      tarjetas,
      uidConsultados: n(data.uid_consultados),
      ocultasPorEstado: n(data.ocultas_por_estado),
      uidNoConsultados: n(data.uid_no_consultados),
      uidSinRespuesta: n(data.uid_sin_respuesta),
    },
  };
}
