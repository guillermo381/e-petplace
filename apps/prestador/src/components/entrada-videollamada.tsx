/**
 * LA ENTRADA A LA VIDEOLLAMADA — Obra 1 de la tanda 2.
 *
 * **Pregunta al servidor si se puede entrar y dibuja lo que corresponda.**
 * Vive en las dos apps con el mismo comportamiento y distinta voz.
 *
 * ── 🔴 EL BOTÓN EXISTE SÓLO CUANDO EL SERVIDOR DICE QUE SÍ ────────────────
 * Nunca se dibuja apagado con un cartel al lado. *Un botón apagado es una
 * puerta que promete y no cumple* (Ley 23). Cuando no se puede entrar se
 * pinta **el motivo**, y cuando el motivo es uno de los dos silencios **no se
 * pinta nada**: ni texto, ni espacio reservado.
 *
 * ── POR QUÉ PREGUNTA EN CADA FOCO Y NO UNA VEZ ────────────────────────────
 * El veredicto **caduca solo**: `fuera_de_ventana` deja de ser cierto cuando
 * llega la hora. Preguntar una vez al montar dejaría a alguien mirando «la
 * sala abre a las 15:30» a las 15:31. *Un veredicto con fecha de vencimiento
 * que no se revalida es una verdad vencida en pantalla.*
 *
 * ⚠️ **El token que vuelve NO se guarda acá.** Esta pieza sólo usa el
 * veredicto; quien entra vuelve a pedirlo. *Un token de vida corta que viaja
 * en el estado de una pantalla que no lo va a usar es superficie de más.*
 */

import { useCallback, useState, type ReactElement } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Boton, Texto, spacing } from '@epetplace/ui';
import { pedirTokenVideollamada, type ResultadoVideollamada } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { queDibujar } from '@/lib/telemedicina/veredicto-entrada';

export interface EntradaVideollamadaProps {
  citaId: string;
  /** Qué hacer cuando SÍ se puede. La navegación la decide la pantalla. */
  alEntrar: () => void;
  /**
   * 🔴 EL ENVOLTORIO, y nace de un defecto real de la tanda 3.
   *
   * Esta pieza **puede no pintar nada** (los dos silencios, y el rato en que
   * consulta). Si la pantalla la mete adentro de una `Tarjeta`, la tarjeta
   * **se dibuja igual, vacía** — *un contenedor no sabe que su hijo no pintó
   * nada*, y una tarjeta vacía en el detalle de una cita se lee como algo
   * roto.
   *
   * Con esto la pieza decide: **si no hay contenido, el envoltorio no se
   * llama.** Es la misma clase de defecto que el silencio del gate —
   * *un estado que no se puede expresar se convierte en el estado de al
   * lado*— resuelto una capa más arriba.
   */
  envolver?: (contenido: ReactElement) => ReactElement;
}

export function EntradaVideollamada({ citaId, alEntrar, envolver }: EntradaVideollamadaProps) {
  const { t, idioma } = useTraduccion();
  const [veredicto, setVeredicto] = useState<ResultadoVideollamada | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      /* Mientras se consulta **no se pinta nada**. No hay esqueleto: reservar
         un lugar para algo que en la mayoría de los casos no va a existir
         —una cita presencial no tiene entrada— haría parpadear un hueco en
         todas las citas del producto. */
      setVeredicto(null);
      void pedirTokenVideollamada(citaId).then((r) => {
        if (vigente) setVeredicto(r);
      });
      return () => {
        vigente = false;
      };
    }, [citaId]),
  );

  if (veredicto === null) return null;

  const q = queDibujar(veredicto, idioma);

  /* Los dos casos con contenido, y el silencio saliendo por su propia puerta
     ANTES de que el envoltorio exista. */
  let contenido: ReactElement;
  if (q.boton) {
    contenido = <Boton variante="primario" etiqueta={t('consulta.entrarBoton')} onPress={alEntrar} />;
  } else if (q.claveVoz !== null) {
    const clave = q.claveVoz;
    contenido = (
      <View style={{ gap: spacing[2] }}>
        <Texto variante="apoyo">
          {q.hora !== undefined ? t(clave as never, { hora: q.hora }) : t(clave as never)}
        </Texto>
      </View>
    );
  } else {
    // Los dos silencios: `ajeno_a_la_cita` y `no_es_teleconsulta`.
    return null;
  }

  return envolver ? envolver(contenido) : contenido;
}
