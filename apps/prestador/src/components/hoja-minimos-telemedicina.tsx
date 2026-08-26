/**
 * LOS MÍNIMOS DE §6 — la Hoja que se acepta al prender telemedicina.
 * `LETRA_TELEMEDICINA` §6/§8 (v1.1, CP1 S106).
 *
 * ── LA REGLA QUE LE DA FORMA ──────────────────────────────────────────────
 * **Los cuatro se ven ENTEROS antes de aceptar.** §6 es una DECLARACIÓN del
 * profesional, y *una declaración que se acepta sin leerse no declara nada*.
 * Por eso no hay resumen, no hay «ver más» y el CTA vive **abajo del texto**:
 * para llegar al botón hay que haber pasado por los cuatro.
 *
 * ── LO QUE LA LETRA MANDA DECIR, Y NO PROMETER ────────────────────────────
 * *«El sistema no los mide, y la letra lo dice en vez de prometerlo.»* Esa
 * línea cierra la Hoja. **No es letra chica: es la mitad honesta del trato.**
 *
 * ⚠️ La versión del texto aceptado **la pone el servidor**, no esta pantalla.
 */

import { View } from 'react-native';
import { Boton, Hoja, HojaScroll, Texto, spacing } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export interface HojaMinimosTelemedicinaProps {
  visible: boolean;
  onCerrar: () => void;
  onAceptar: () => void;
  guardando: boolean;
  /** Ya aceptados: la Hoja se vuelve LECTURA. El profesional puede releer lo
   *  que declaró sin que se le vuelva a pedir — releer no es re-aceptar. */
  soloLectura?: boolean;
}

export function HojaMinimosTelemedicina({
  visible,
  onCerrar,
  onAceptar,
  guardando,
  soloLectura = false,
}: HojaMinimosTelemedicinaProps) {
  const { t } = useTraduccion();

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={t('tallerVeterinaria.minimosTitulo')}>
      <HojaScroll>
        <View style={{ gap: spacing[4] }}>
          <Texto variante="cuerpo">{t('tallerVeterinaria.minimosIntro')}</Texto>

          <View style={{ gap: spacing[3] }}>
            <Texto variante="cuerpo">{t('tallerVeterinaria.minimosConexion')}</Texto>
            <Texto variante="cuerpo">{t('tallerVeterinaria.minimosCamara')}</Texto>
            <Texto variante="cuerpo">{t('tallerVeterinaria.minimosLuz')}</Texto>
            <Texto variante="cuerpo">{t('tallerVeterinaria.minimosAudio')}</Texto>
          </View>

          {/* La mitad honesta del trato — va SIEMPRE, aceptado o no. */}
          <Texto variante="apoyo">{t('tallerVeterinaria.minimosNoSeMiden')}</Texto>

          {!soloLectura && (
            <Boton
              variante="primario"
              etiqueta={t('tallerVeterinaria.minimosAceptar')}
              onPress={onAceptar}
              cargando={guardando}
            />
          )}
        </View>
      </HojaScroll>
    </Hoja>
  );
}
