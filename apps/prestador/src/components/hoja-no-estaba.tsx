/**
 * «NO ESTABA» — el día que cierra sin que el animal suba (S110-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«Si no había nadie, toco "No estaba" y elijo por qué. Eso
 * también queda escrito, con su hora. No es un silencio.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **LO QUE ESTA PIEZA NO ES, Y SE ESCRIBE PARA QUE NADIE LA CONFUNDA:**
 * `no_recogida` es **el arranque de la estadía** —el dueño que no estaba a la
 * mañana, firma ② de la mesa— y **NO es la mora del §6**, que es el no-retiro
 * al final. Son dos hechos distintos en dos extremos del día.
 *
 * **`LETRA_GUARDERIA` §6 está FRENADA por riesgo penal declarado por el
 * abogado**, y de este acto **no cuelga NADA**: sin conteo de días, sin aviso,
 * sin camino a refugio, sin protocolo. *El motivo dice por qué cerró la franja
 * de recogida; no es el día 1 de nada.* Confirmado por A del lado del motor:
 * ningún cron lo escribe y ninguna columna lo acumula.
 *
 * ── EL MOTIVO ES UN CÓDIGO, Y LA VOZ ES DE ACÁ ──────────────────────────
 * El catálogo llega del motor (`obtenerMaquinaEstadia().motivosNoRecogida`) y
 * viaja como **código** (`nadie_en_domicilio`), jamás como frase. *Si el motor
 * mandara la voz, el vocabulario del motor saldría a pantalla* — y la voz que
 * el founder lee en su lote dejaría de ser la que se muestra.
 *
 * ⚠️ **`otro` EXIGE detalle**, y no por prolijidad: el motor lo tiene en un
 * CHECK de la tabla, así que un «otro» sin contar qué pasó **es inexpresable**.
 * La pantalla lo pide antes para no ofrecer lo que va a rebotar (Ley 23).
 */

import { useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Campo,
  Hoja,
  HojaScroll,
  SelectorOpcion,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import {
  marcarNoRecogida,
  type EstadiaDelDia,
  type MotivoNoRecogida,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface HojaNoEstabaProps {
  /** `null` = la hoja no se monta. */
  estadia: EstadiaDelDia | null;
  /** 🔴 El catálogo, LEÍDO del motor. Vacío = la hoja no se ofrece. */
  motivos: MotivoNoRecogida[];
  onCerrar: () => void;
  /** Se llama SOLO tras un acto exitoso: quien la monta re-lee. */
  onMarcada: () => void;
}

export function HojaNoEstaba({ estadia, motivos, onCerrar, onMarcada }: HojaNoEstabaProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [motivo, setMotivo] = useState<MotivoNoRecogida | null>(null);
  const [detalle, setDetalle] = useState('');
  const [enVuelo, setEnVuelo] = useState(false);

  if (estadia === null) return null;

  const exigeDetalle = motivo === 'otro';
  const listo =
    motivo !== null && (!exigeDetalle || detalle.trim().length > 0) && !enVuelo;

  const vozMotivo = (m: MotivoNoRecogida): string =>
    t(`noEstaba.motivo_${m}` as 'noEstaba.motivo_nadie_en_domicilio');

  const confirmar = async () => {
    if (motivo === null || !listo) return;
    setEnVuelo(true);
    try {
      const r = await marcarNoRecogida({
        estadiaId: estadia.estadiaId,
        motivo,
        /* La hora del TOQUE — la de la puerta. Ver `cablearActoUnico`. */
        ocurridoEn: new Date().toISOString(),
        detalle: exigeDetalle ? detalle.trim() : undefined,
      });
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      onMarcada();
    } finally {
      setEnVuelo(false);
    }
  };

  return (
    <Hoja
      visible
      titulo={t('noEstaba.titulo', { nombre: estadia.mascotaNombre })}
      onCerrar={onCerrar}
    >
      <HojaScroll contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[4] }}>
        <Texto variante="apoyo">{t('noEstaba.apoyo')}</Texto>

        {/* `columnas` y no `fila`: los motivos son frases, no palabras, y
            'fila' está hecha para 2–4 chips CORTOS que llenan el ancho. En dos
            columnas la etiqueta larga envuelve dentro del chip en vez de
            truncarse — que es donde un motivo a medias deja de ser un motivo. */}
        <SelectorOpcion
          acento="oficio"
          disposicion="columnas"
          etiqueta={t('noEstaba.etiquetaGrupo')}
          opciones={motivos.map((m) => ({ codigo: m, etiqueta: vozMotivo(m) }))}
          seleccionada={motivo ?? undefined}
          onSelect={(c) => setMotivo(c as MotivoNoRecogida)}
        />

        {/* Sólo con «otro»: el motor lo exige en un CHECK, así que el campo
            aparece cuando hace falta y no antes. */}
        {exigeDetalle ? (
          <Campo
            label={t('noEstaba.detalleEtiqueta')}
            value={detalle}
            onChangeText={setDetalle}
            multilinea={2}
          />
        ) : null}
      </HojaScroll>

      <View style={{ gap: spacing[2], paddingTop: spacing[3] }}>
        {/* El botón apagado DICE qué falta, a la vista y no bajo el pliegue. */}
        {motivo === null ? (
          <Texto variante="apoyo" color="tertiary">
            {t('noEstaba.faltaMotivo')}
          </Texto>
        ) : exigeDetalle && detalle.trim().length === 0 ? (
          <Texto variante="apoyo" color="tertiary">
            {t('noEstaba.faltaDetalle')}
          </Texto>
        ) : null}
        <Boton
          variante="primario"
          etiqueta={t('noEstaba.confirmar')}
          onPress={() => void confirmar()}
          deshabilitado={!listo}
          cargando={enVuelo}
        />
      </View>
    </Hoja>
  );
}
