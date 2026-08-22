/**
 * S103-C · **LA SERIE RECURRENTE** — «Que llegue solo», del lado de quien ya la
 * tiene andando. `LETRA_COBRO_RECURRENTE` §2, §6 y §7.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ LA LETRA §2, LITERAL, ES EL ÍNDICE DE ESTA PANTALLA:                 │
 * │ *«La pantalla dice la verdad completa: **qué** se va a cobrar,       │
 * │ **cuándo** es el próximo cobro, **a qué medio**, y **cómo se         │
 * │ corta**.»*                                                           │
 * │                                                                      │
 * │ Y su condición, que es la que ordena el botón: *«Se corta desde la   │
 * │ app, **sin pedir permiso a nadie**… Cortar es un acto del cliente,   │
 * │ jamás un trámite de soporte.»*                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── POR QUÉ **UN SOLO** BOTÓN, y no tres ─────────────────────────────────
 *
 * El aviso del motor promete *«saltar, mover o cancelar»*. **Medido por A
 * (S103-A ①.7 #2): de las cuatro funciones de recurrencia, ninguna saltea y
 * ninguna mueve — solo `alternar_recurrencia`.** *Dos tercios de esa promesa no
 * tienen camino.* ⇒ **se dibuja lo que existe.** Un botón que promete saltar
 * una entrega y no puede es peor que su ausencia.
 *
 * ── LOS DOS DATOS QUE ESTA PANTALLA **NO PUEDE** DECIR, y los dice ───────
 *
 * `LETRA_COBRO_RECURRENTE` §2 pide **monto esperado** y **medio de pago**.
 * **La tabla no tiene ninguna de las dos columnas** (censo de A, #3 y #4).
 * ⇒ cada uno tiene **voz de ausencia propia**, jamás un valor de relleno.
 * *Un `$0` o un guion mudo en el lugar de una plata que no conocemos se lee
 * como «gratis», que es exactamente la mentira que más caro sale en una
 * pantalla de cobros automáticos.*
 *
 * ── FORMA ────────────────────────────────────────────────────────────────
 *
 * N21: cada grupo rotulado va **en su carta** — qué llega · el próximo cobro ·
 * a dónde · cortar. El botón de cortar es `destructivo` (tonal danger) y
 * **jamás ocre**: N26 reserva el ocre para lo que ACCIONA una compra, y
 * cancelar no compra.
 *
 * **Confirmación simple, NO doble.** La doble de P1 protege lo destructivo
 * irreversible (borrar una tarjeta); *una serie se vuelve a activar cuando la
 * familia quiera, y §2 firma que cortar no es un trámite.* Poner dos puertas
 * sería el muro de retención que la referencia usa y nuestra letra prohíbe.
 */

import { useState } from 'react';
import { View } from 'react-native';
import { Boton, Celda, Hoja, Separador, Tarjeta, Texto, spacing } from '@epetplace/ui';

import type { SerieRecurrente } from '@/lib/serie/contrato';
import { useTraduccion } from '@/i18n';

export type SerieRecurrenteVistaProps = {
  serie: SerieRecurrente;
  /** Corta la serie. Lo resuelve la pantalla dueña (hoy: `alternarRecurrencia`). */
  onCancelar: () => void;
  cancelando: boolean;
};

export function SerieRecurrenteVista({
  serie, onCancelar, cancelando,
}: SerieRecurrenteVistaProps) {
  const { t } = useTraduccion();
  const [confirmando, setConfirmando] = useState(false);

  const cadencia = serie.frecuenciaDias !== null
    ? t('serie.cada', { dias: serie.frecuenciaDias })
    : null;

  return (
    <View style={{ gap: spacing[4] }}>
      {/* ── EL ESTADO, cuando NO es el normal. Preside porque cambia lo que la
             familia tiene que hacer. §6: pausada se reanuda actualizando el
             medio; §7: saltada por stock **sigue viva**, y decirlo es la mitad
             del mensaje — *el problema fue nuestro, no de ella*. */}
      {serie.estado === 'pausada' ? (
        <Tarjeta>
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('serie.pausada')}</Texto>
            <Texto variante="apoyo">{t('serie.comoReanudar')}</Texto>
          </View>
        </Tarjeta>
      ) : null}

      {serie.saltadaProducto !== null ? (
        <Tarjeta>
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">
              {t('serie.saltada', { producto: serie.saltadaProducto })}
            </Texto>
            {/* 🔴 §7 prohíbe la sustitución por iniciativa de la casa — por
                razón CLÍNICA, no logística. Esta pantalla no ofrece
                «reemplazar por un equivalente» y no puede empezar a hacerlo:
                *el inventario jamás decide sobre la salud de una mascota.* */}
            <Texto variante="apoyo">{t('serie.saltadaSigue')}</Texto>
          </View>
        </Tarjeta>
      ) : null}

      {/* ── ① QUÉ TE LLEGA ── */}
      <Tarjeta>
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('serie.queLlega')}</Texto>
          {serie.items.map((it, i) => (
            <Celda
              key={`${it.nombre}-${i}`}
              titulo={it.nombre}
              metadataMono={`×${it.cantidad}`}
            />
          ))}
          {cadencia !== null ? (
            <>
              <Separador />
              <Texto variante="apoyo">{cadencia}</Texto>
            </>
          ) : null}
        </View>
      </Tarjeta>

      {/* ── ② EL PRÓXIMO COBRO: cuándo · cuánto · con qué ── */}
      <Tarjeta>
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('serie.proximoCobro')}</Texto>
          <Celda
            titulo={serie.proximoPedidoFecha}
            /* 🔴 La plata que no conocemos NO se dibuja como número. */
            metadataMono={
              serie.montoEsperado !== null
                ? `$${serie.montoEsperado.toFixed(2)}`
                : undefined
            }
          />
          {serie.montoEsperado === null ? (
            <Texto variante="apoyo">{t('serie.montoDesconocido')}</Texto>
          ) : null}

          <Separador />

          <Texto variante="seccion">{t('serie.medio')}</Texto>
          {serie.medio !== null ? (
            <Texto variante="dato">
              {[serie.medio.marca, serie.medio.ultimos4 && `···· ${serie.medio.ultimos4}`]
                .filter(Boolean)
                .join(' ')}
            </Texto>
          ) : (
            <Texto variante="apoyo">{t('serie.medioDesconocido')}</Texto>
          )}

          <Separador />
          {/* §3: el aviso informa y no pide permiso; la ventana es también la
              gracia para cancelar sin costo. */}
          <Texto variante="apoyo">{t('serie.avisoPrevio')}</Texto>
        </View>
      </Tarjeta>

      {/* ── ③ A DÓNDE LLEGA ── */}
      {serie.entregaEtiqueta !== null ? (
        <Tarjeta>
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('serie.aDondeLlega')}</Texto>
            <Texto variante="dato">{serie.entregaEtiqueta}</Texto>
          </View>
        </Tarjeta>
      ) : null}

      {/* ── ④ CÓMO SE CORTA — un botón, sin soporte de por medio ── */}
      {serie.estado !== 'cancelada' ? (
        <Boton
          variante="destructivo"
          etiqueta={t('serie.cancelar')}
          bloque
          onPress={() => setConfirmando(true)}
        />
      ) : null}

      <Hoja
        visible={confirmando}
        onCerrar={() => setConfirmando(false)}
        titulo={t('serie.cancelarConfirma')}
      >
        <View style={{ gap: spacing[3] }}>
          {/* Dice qué pasa DESPUÉS de cortar — que es lo que quita el miedo a
              tocar el botón, y es verdad: §6 firma que reanudar es del
              cliente y que no se acumula deuda hacia atrás. */}
          <Texto variante="cuerpo">{t('serie.cancelarDetalle')}</Texto>
          <Boton
            variante="destructivo"
            etiqueta={t('serie.cancelarSi')}
            bloque
            cargando={cancelando}
            onPress={onCancelar}
          />
        </View>
      </Hoja>
    </View>
  );
}
