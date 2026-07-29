/**
 * HojaFotoMascota (S82-A) — la captura de la foto de mascota SIN recorte
 * nativo. El encuadre ahora es de la CASA (EncuadreFoto, lámina
 * 2026-07-29): recortar 1:1 en el picker del sistema y DESPUÉS encuadrar
 * acá sería recortar dos veces — el editor quedaría sin margen que mover.
 * Cámara/galería PARES (la anatomía de la Hoja de SelectorAvatar);
 * resize 800 canónico (S45, medido).
 *
 * CANDIDATA PARA B (anotada, cero packages/ui esta sesión): cuando
 * SelectorAvatar pierda `recorteCuadrado` y gane el encuadre de la casa,
 * esta Hoja muere absorbida.
 */

import { View } from 'react-native';
import {
  Boton,
  Hoja,
  capturarConCamara,
  capturarDeGaleria,
  spacing,
  type FotoCapturada,
} from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** El resize canónico del avatar (S45, costura B5.4 — ~800px ≈ 200KB ≈ 2s). */
const RESIZE_FOTO_MASCOTA = 800;

export interface HojaFotoMascotaProps {
  visible: boolean;
  titulo: string;
  onCerrar: () => void;
  onFoto: (f: FotoCapturada) => void;
  onPermisoDenegado: () => void;
}

export function HojaFotoMascota({ visible, titulo, onCerrar, onFoto, onPermisoDenegado }: HojaFotoMascotaProps) {
  const { t } = useTraduccion();

  async function capturar(via: 'camara' | 'galeria') {
    onCerrar();
    const fn = via === 'camara' ? capturarConCamara : capturarDeGaleria;
    const r = await fn({ redimensionarA: RESIZE_FOTO_MASCOTA });
    if (r.tipo === 'permiso_denegado') {
      onPermisoDenegado();
      return;
    }
    if (r.tipo === 'cancelada') return;
    onFoto(r.foto);
  }

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={titulo} conCerrar>
      <View style={{ gap: spacing[3], padding: spacing[4] }}>
        <Boton variante="secundario" bloque etiqueta={t('fotoEncuadre.camara')} onPress={() => void capturar('camara')} />
        <Boton variante="secundario" bloque etiqueta={t('fotoEncuadre.galeria')} onPress={() => void capturar('galeria')} />
      </View>
    </Hoja>
  );
}
