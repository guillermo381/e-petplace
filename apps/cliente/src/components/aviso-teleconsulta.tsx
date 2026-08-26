/**
 * EL AVISO PREVIO DE TELECONSULTA — `LETRA_TELEMEDICINA` §3 (v1.1, CP1 S106).
 *
 * **Se muestra ANTES de confirmar, siempre.** Su texto vive en i18n y es
 * VERBATIM de la letra: *«No se resume, no se acorta, no se convierte en una
 * línea de letra chica»*.
 *
 * ── POR QUÉ VIVE ACÁ Y NO EN `packages/ui` ────────────────────────────────
 * El plan de A §5 se lo asignó a B como pieza compartida (`AvisoPrevio`), y
 * **medido hoy no existe** (cero en `packages/ui`). Esto NO inventa primitivas:
 * compone `Hoja` + `Texto` + `Boton`, que ya son de la casa. **El día que B
 * publique la pieza, este archivo muere y las claves i18n se quedan** — por eso
 * el texto está en el diccionario y no acá adentro: *el swap cuesta un import.*
 *
 * ── LAS TRES ACCIONES, Y POR QUÉ ESE ORDEN ────────────────────────────────
 * El orden es el de la letra y no es estético: **las dos salidas van primero**.
 * `Ir a urgencias` · `Reservar cita presencial` · `Continuar con la
 * videoconsulta`. *Un aviso que pone «continuar» arriba está apurando a alguien
 * que quizás tiene una urgencia.*
 *
 * 🔴 **Bloqueante de verdad:** no hay forma de llegar al hold sin tocar una de
 * las tres. `Hoja` no se cierra por gesto acá (`alCerrar` = cancelar) — cerrar
 * es no continuar, jamás continuar en silencio.
 */

import { View } from 'react-native';
import { Boton, Hoja, HojaScroll, Texto, spacing } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export interface AvisoTeleconsultaProps {
  abierta: boolean;
  /** Cerrar sin elegir = NO continuar. */
  alCerrar: () => void;
  alIrAUrgencias: () => void;
  alReservarPresencial: () => void;
  alContinuar: () => void;
}

export function AvisoTeleconsulta({
  abierta,
  alCerrar,
  alIrAUrgencias,
  alReservarPresencial,
  alContinuar,
}: AvisoTeleconsultaProps) {
  const { t } = useTraduccion();

  return (
    <Hoja visible={abierta} onCerrar={alCerrar} titulo={t('veterinaria.avisoTeleTitulo')}>
      <HojaScroll>
        <View style={{ gap: spacing[4] }}>
          <Texto variante="cuerpo">{t('veterinaria.avisoTeleParaQue')}</Texto>

          {/* Los cinco signos concretos. **Este párrafo es el aviso**: lo demás
              lo acompaña. Va en `cuerpo` y no en `apoyo` a propósito — bajarlo
              de registro sería convertirlo en letra chica, que es justo lo que
              la letra prohíbe. */}
          <Texto variante="cuerpo">{t('veterinaria.avisoTeleNoReemplaza')}</Texto>

          {/* ⚠️ PROVISIONAL (enmienda ② de CP1): rige hasta la respuesta del
              abogado a §10 pregunta 4. */}
          <Texto variante="apoyo">{t('veterinaria.avisoTeleTransito')}</Texto>

          <View style={{ gap: spacing[3] }}>
            <Boton
              variante="primario"
              etiqueta={t('veterinaria.avisoTeleIrUrgencias')}
              onPress={alIrAUrgencias}
            />
            <Boton
              variante="secundario"
              etiqueta={t('veterinaria.avisoTelePresencial')}
              onPress={alReservarPresencial}
            />
            <Boton
              variante="secundario"
              etiqueta={t('veterinaria.avisoTeleContinuar')}
              onPress={alContinuar}
            />
          </View>
        </View>
      </HojaScroll>
    </Hoja>
  );
}
