/**
 * LA VENTANA DE PEDIDOS — S99-C · L1 · costura 1 con D (`PLAN_S99` §5).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * POR QUÉ ES PIEZA Y NO PANTALLA. Con la barra puesta (D-820) el vendedor
 * puro entra por las tabs, y la lista de pedidos pasa a tener DOS casas: su
 * ruta `/ventas` —que **sobrevive con lápida**, ver abajo— y el HOY del
 * dual, donde la misma ventana vive con su día. *Dos listas que empiezan
 * iguales divergen la primera vez que alguien cura una sola.*
 *
 * **SIN FETCH ADENTRO** (acuerdo con D): quien la monta trae los datos. Así
 * el HOY la monta dentro de su propia ola y no paga un viaje nuevo — medido
 * en S99-C §C4: el arranque en frío ya son ~1,9 s de espera de red, y
 * `contextoVentas()` deduplica **solo en vuelo**, o sea que montarla en una
 * ola posterior cuesta el viaje entero otra vez.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 EL CONTRATO VUELVE INEXPRESABLE LA INVISIBILIDAD ────────────────
 * Hallazgo de D, medido por B y por mí contra la base: el lector por rango
 * devuelve `{ delRango, sinFecha }`, y los `sinFecha` son **pedidos VIVOS
 * sin fecha de entrega comprometida**. Hoy nadie los pierde porque las
 * cuatro superficies del presente usan el lector SIN rango — **el hueco se
 * abre el día que una migre al rango y no los monte.** Y no sería un bug
 * visible: *la pantalla se vería bien.* Es la forma exacta de S72 (la cita
 * `por_coordinar` que no pasaba el `.gte('fecha', hoy)`) ⇒ ***la
 * invisibilidad no tiene stack trace.***
 *
 * **El número que lo saca de lo teórico: 2 de los 10 pedidos vivos de la
 * base no tienen `entrega_fecha_objetivo`.** Uno de cada cinco.
 *
 * Por eso el contrato es una UNIÓN DISCRIMINADA y no una prop opcional:
 * **quien monta con `dia` tiene que pasar `sinFecha` — si no, no compila.**
 * *Una convención se olvida; un tipo no.* (Doctrina de la casa: volver el
 * estado malo inexpresable, como la FK de D-731.)
 *
 * ── DÓNDE VAN LOS `sinFecha`: PRESIDEN ─────────────────────────────────
 * No se mezclan en el día. Es la firma de esta ventana aplicada un escalón
 * más adentro —*el orden es por lo que falta hacer, no por hora*— y el
 * precedente de la casa es literal: en «Ponte al día» y en «Por coordinar»,
 * **lo que no tiene tiempo preside y no colapsa**, porque colapsar acciones
 * esconde trabajo pendiente.
 *
 * ── LA VOZ VIVE ADENTRO, y esto SE APARTA de `tarjeta-ventas` ──────────
 * Aquella pieza recibe su voz por props **porque tiene tres casas con voces
 * distintas**. Ésta tiene N casas con LA MISMA voz, y son ~15 cadenas:
 * pasarlas por props sería mudar el diccionario al consumidor y darle a
 * cada uno la chance de decir otra cosa. *La regla de aquella pieza no es
 * «la voz siempre por props»: es «la voz la pone quien la varía».*
 */

import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import {
  FilaDato,
  EstadoVacio,
  TarjetaPedido,
  Texto,
  opacity,
  spacing,
  type DesvioEscalera,
  type PasoEscalera,
} from '@epetplace/ui';
import {
  fechaCortaMono,
  monto,
  type ConfigMoneda,
  type IdiomaSoportado,
} from '@epetplace/i18n';
import type { ExtraPanelPedido, PedidoDelVendedor } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { derivarEscalera, type ClaveEscalon } from '@/lib/escalera-pedido';
import { fechaLocalISO, horaCorta, hoyLocalISO } from '@/lib/ventas-formato';

/**
 * ☠️ S99-D · `prioridad()` MURIÓ COMO ORDEN — y su razón queda tachada, no
 * borrada, porque no era mala: ordenaba por **estado**, o sea por «qué me
 * falta hacer con éste». La firma del founder en el Gate 1 pide otra cosa —
 * **FIFO por hora de confirmación del pago** — y las dos son legítimas:
 * *«¿qué toco ahora?»* no es *«¿de quién es el turno?»*. Gana la segunda
 * porque es la que el cliente puede reclamar.
 *
 * ── LAS CUATRO BANDAS (ratificación de mesa a C, 17-ago) ───────────────
 *  ① **sin compromiso PRESIDE** — no entra a este comparador: la ventana lo
 *    resuelve un escalón afuera, en su propia sección (`huerfanos`).
 *  ② **«se rompió» SEGUNDA**, con su razón: *lo urgente está por fallar,
 *    esto YA falló, y hay alguien que perdió su tarde esperando.*
 *  ③ **urgente** — 🔴 **HOY NO TIENE PRODUCTOR Y SE DECLARA:** el exprés no
 *    existe en el esquema (censo L5b ⑥, fuera del camino crítico por firma).
 *    La banda **no se inventa con un proxy**: queda escrita, vacía, y el día
 *    que el dato exista entra por un solo lugar. *Una banda que nadie puede
 *    llenar no se dibuja — y «banda vacía no se monta» ya es la regla.*
 *  ④ **los días** — el FIFO.
 *
 * 🔴 **LA SEÑAL DE «SE ROMPIÓ» ES LA MISMA QUE PINTA EL DESVÍO**
 * (`derivarEscalera(...).desvio === 'noLlego'`), y eso es deliberado: si la
 * banda mirara un campo y la insignia otro, **podrían discrepar** y la
 * ventana diría con la posición algo distinto de lo que dice con la
 * etiqueta. *Una sola lectura para el lugar y para el nombre.*
 *
 * ⚠️ **LA PROMESA ES TECHO, JAMÁS CLAVE DE ORDEN.** Si ordenara, esta
 * ventana estaría dibujando **la RUTA** — y la ruta es la otra cola: *FIFO
 * ordena el trabajo del LOCAL, la ruta ordena la SALIDA; el corte es el
 * despacho.* Por eso `promesa_desde` desapareció del comparador.
 */
type Banda = 0 | 1 | 2;

function banda(desvio: 'noLlego' | 'cancelado' | null | undefined): Banda {
  if (desvio === 'noLlego') return 0;
  /* ③ urgente iría acá (return 1) el día que el exprés exista. */
  return 2;
}

/**
 * El comparador del trabajo del local.
 *
 * ⚠️ **`?? null` en las dos marcas por L-247:** el lector ya las tipa, pero
 * *toda garantía que solo vive en el productor es una convención* — y con un
 * bundle viejo un `undefined` acá no rompería: **ordenaría mal en silencio**,
 * que es peor.
 *
 * 🔴 **SIN `pago_confirmado_en` NO SE ORDENA POR PROXY.** El que no tiene
 * pago confirmado **no está en la cola** (firma del founder) ⇒ va al final de
 * su banda. *Caer a `created_at` habría dado un orden creíble y falso: el
 * vendedor lo lee como justicia y prepara en el orden equivocado.*
 */
function ordenDeTrabajo(
  a: PedidoDelVendedor,
  b: PedidoDelVendedor,
  extras: Record<string, ExtraPanelPedido>,
): number {
  const esc = (p: PedidoDelVendedor) => {
    const e = extras[p.pedido_id];
    return e ? derivarEscalera(e.estado, e.metodo_entrega) : null;
  };
  const ba = banda(esc(a)?.desvio);
  const bb = banda(esc(b)?.desvio);
  if (ba !== bb) return ba - bb;

  /* EL REORDEN DEL VENDEDOR MANDA DENTRO DE SU BANDA — y no cruza bandas:
     ordena, jamás re-promete. Entre varios movidos, el más reciente arriba
     (marca DESC), que es lo que la migración de A definió. */
  const ma = a.movido_al_frente_en ?? null;
  const mb = b.movido_al_frente_en ?? null;
  if (ma !== null && mb !== null) return ma < mb ? 1 : -1;
  if (ma !== null) return -1;
  if (mb !== null) return 1;

  /* EL FIFO. Sin pago confirmado, al final: no está en la cola. */
  const pa = a.pago_confirmado_en ?? null;
  const pb = b.pago_confirmado_en ?? null;
  if (pa === null && pb === null) return 0;
  if (pa === null) return 1;
  if (pb === null) return -1;
  return pa < pb ? -1 : 1;
}

interface Comun {
  extras: Record<string, ExtraPanelPedido>;
  /** `null` = el motor no pudo decir el cupo. Capacidad 0 SE DICE (§7.3). */
  cupo: { capacidad: number; consumido: number } | null;
  /** La config del país, no un código: `monto()` la exige entera (D-448). */
  moneda: ConfigMoneda;
  onAbrir: (pedidoId: string) => void;
}

/** 🔴 La unión que vuelve la invisibilidad inexpresable (ver cabecera). */
export type VentanaPedidosProps = Comun &
  (
    | {
        /** Sin día: `pedidos` YA trae todo (lector sin rango). */
        dia?: undefined;
        pedidos: PedidoDelVendedor[];
        sinFecha?: never;
      }
    | {
        /** Con día: el lector es por rango ⇒ `sinFecha` es OBLIGATORIO. */
        dia: string;
        pedidos: PedidoDelVendedor[];
        sinFecha: PedidoDelVendedor[];
      }
  );

export function VentanaPedidos({
  pedidos,
  extras,
  cupo,
  moneda,
  onAbrir,
  dia,
  sinFecha,
}: VentanaPedidosProps) {
  const { t, idioma } = useTraduccion();

  const vozEscalon: Record<ClaveEscalon, string> = useMemo(
    () => ({
      preparado: t('ventas.escalones.preparado'),
      empacado: t('ventas.escalones.empacado'),
      facturado: t('ventas.escalones.facturado'),
      despachado: t('ventas.escalones.despachado'),
      entregado: t('ventas.escalones.entregado'),
      retirado: t('ventas.escalones.retirado'),
    }),
    [t],
  );

  const vozVentana = useCallback(
    (p: PedidoDelVendedor, extra: ExtraPanelPedido | undefined): string => {
      if (extra?.metodo_entrega === 'retiro') return t('ventas.hoy.retiro');
      if (p.promesa_desde === null || p.promesa_hasta === null) {
        return t('ventas.ventana.sinVentana');
      }
      const desde = horaCorta(p.promesa_desde);
      const hasta = horaCorta(p.promesa_hasta);
      if (fechaLocalISO(p.promesa_desde) === hoyLocalISO()) {
        return t('ventas.ventana.hoyDesdeHasta', { desde, hasta });
      }
      return t('ventas.ventana.fechaDesdeHasta', {
        fecha: fechaCortaMono(fechaLocalISO(p.promesa_desde), idioma as IdiomaSoportado),
        desde,
        hasta,
      });
    },
    [t, idioma],
  );

  const fila = useCallback(
    (p: PedidoDelVendedor, dimmed: boolean) => {
      const extra: ExtraPanelPedido | undefined = extras[p.pedido_id];
      const escalera = extra ? derivarEscalera(extra.estado, extra.metodo_entrega) : null;

      const itemsVoz =
        extra === undefined
          ? undefined
          : extra.items_cantidad === 1
            ? t('ventas.hoy.unProducto')
            : t('ventas.hoy.productos', { n: extra.items_cantidad });

      const detalle = dimmed
        ? p.narrativa_nombre
        : [vozVentana(p, extra), itemsVoz].filter((s) => s !== undefined).join(' · ');

      const pasos: PasoEscalera[] =
        dimmed || escalera === null
          ? []
          : escalera.pasos.map((paso) => ({
              clave: paso.clave,
              etiqueta: vozEscalon[paso.clave],
              estado: paso.estado,
            }));

      const desvio: DesvioEscalera | undefined =
        escalera?.desvio === 'noLlego'
          ? {
              etiqueta: t('ventas.desvios.noLlego'),
              detalle: t('ventas.desvios.noLlegoDetalle'),
              tono: 'alerta',
            }
          : escalera?.desvio === 'cancelado'
            ? { etiqueta: t('ventas.desvios.cancelado'), tono: 'neutro' }
            : undefined;

      const tarjeta = (
        <TarjetaPedido
          titulo={
            extras[p.pedido_id]?.nombre_receptor ??
            t('ventas.hoy.pedidoSinNombre', { numero: p.numero_orden })
          }
          detalle={detalle}
          monto={monto(p.total, moneda, idioma as IdiomaSoportado)}
          pasos={pasos}
          desvio={desvio}
          acento="oficio"
          etiqueta={t('ventas.hoy.verPedido', { numero: p.numero_orden })}
          onPress={() => onAbrir(p.pedido_id)}
        />
      );
      // Lo entregado se APAGA y baja (§2.1) — atenuación por token, no color nuevo.
      return (
        <View key={p.pedido_id} style={dimmed ? { opacity: opacity.disabled } : undefined}>
          {tarjeta}
        </View>
      );
    },
    [extras, idioma, moneda, onAbrir, t, vozEscalon, vozVentana],
  );

  const { activos, terminados } = useMemo(() => {
    const activos = pedidos.filter((p) => !p.es_terminal);
    const terminados = pedidos.filter((p) => p.es_terminal);
    activos.sort((a, b) => ordenDeTrabajo(a, b, extras));
    return { activos, terminados };
  }, [extras, pedidos]);

  /* Los sin fecha se ordenan por lo mismo que el resto: trabajo primero.
     Se filtran a vivos por si el lector alguna vez trae terminales — un
     pedido cerrado sin fecha no es trabajo que espera. */
  const huerfanos = useMemo(() => {
    const xs = (sinFecha ?? []).filter((p) => !p.es_terminal);
    /* Los sin compromiso PRESIDEN como bloque, y adentro se ordenan con la
       MISMA ley que el resto: si usaran otra, dos listas de la misma pantalla
       estarían contando el turno de dos maneras. */
    xs.sort((a, b) => ordenDeTrabajo(a, b, extras));
    return xs;
  }, [extras, sinFecha]);

  const vacia = activos.length === 0 && terminados.length === 0 && huerfanos.length === 0;

  return (
    <View style={{ gap: spacing[4] }}>
      {/* la cifra honesta del techo (§7.3) — capacidad 0 se DICE */}
      {cupo !== null &&
        (cupo.capacidad > 0 ? (
          <FilaDato
            etiqueta={t('ventas.hoy.titulo')}
            valor={t('ventas.hoy.cupo', { consumido: cupo.consumido, capacidad: cupo.capacidad })}
            mono
          />
        ) : (
          <Texto variante="apoyo">{t('ventas.hoy.cupoCero')}</Texto>
        ))}

      {vacia ? (
        <EstadoVacio
          registro="seccion"
          titulo={t('ventas.hoy.vacioTitulo')}
          descripcion={dia === undefined ? t('ventas.hoy.vacioDetalle') : t('ventas.hoy.vacioDia')}
        />
      ) : (
        <View style={{ gap: spacing[3] }}>
          {/* 🔴 SIN FECHA COMPROMETIDA — PRESIDE (ver cabecera) */}
          {huerfanos.length > 0 && (
            <View style={{ gap: spacing[3] }}>
              <View style={{ gap: spacing[1] }}>
                <Texto variante="seccion">{t('ventas.hoy.sinFechaTitulo')}</Texto>
                <Texto variante="apoyo">{t('ventas.hoy.sinFechaDetalle')}</Texto>
              </View>
              {huerfanos.map((p) => fila(p, false))}
            </View>
          )}

          {activos.map((p) => fila(p, false))}

          {terminados.length > 0 && (
            <View style={{ gap: spacing[3], marginTop: spacing[3] }}>
              <Texto variante="seccion">{t('ventas.hoy.terminadosTitulo')}</Texto>
              {terminados.map((p) => fila(p, true))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
