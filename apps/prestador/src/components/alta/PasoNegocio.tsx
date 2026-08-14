/**
 * PASO ① DEL WIZARD — TU NEGOCIO (S97-C · `LA_CASA_DEL_PRESTADOR` §4.1).
 *
 * ── TESIS ──────────────────────────────────────────────────────────────
 * «El nombre con el que las familias te van a encontrar.»
 *
 * ── FIRMA ──────────────────────────────────────────────────────────────
 * **El único paso que no se saltea, y la pantalla lo dice sin regañar.**
 * Sin nombre el destape no tiene qué mostrar y la casa no tiene título.
 *
 * ── CHANEL ─────────────────────────────────────────────────────────────
 * Se quitó **el logo**, y se declara en vez de omitirse: `LogoNegocio`
 * existe y el destape lo consume, pero **no hay motor de carga de logo
 * para la cuenta comercial** — ni bucket, ni columna, ni wrapper (medido).
 * Montar un selector que no puede guardar sería un formulario muerto, que
 * es peor que su ausencia (precedente de `ventas/configuracion.tsx`: los
 * cuartos sin esquema NO se montan). El destape cae al monograma, que es
 * exactamente para lo que la pieza de B tiene ese camino.
 * También se quitaron los datos fiscales: §4.1 los nombra, y ya viven
 * enteros en `cuenta-comercial/nueva` — el wizard REORGANIZA, no duplica.
 *
 * ── EL MOTOR ───────────────────────────────────────────────────────────
 * `actualizarNombreCuentaComercial` (S97-A): puerta DEFINER gateada por
 * owner — un operador no-titular rebota `solo_el_titular_corrige_el_nombre`
 * y la pantalla lo DICE con la voz del servidor, sin traducirlo a un
 * genérico.
 */

import { useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Campo,
  Entrada,
  EvitaTeclado,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import { actualizarNombreCuentaComercial } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface PasoNegocioProps {
  cuentaComercialId: string;
  nombreInicial: string;
  /** Avisa al contenedor que el nombre cambió — el contador lo DERIVA de
   *  la base, así que lo único que hace falta es recargar. */
  alGuardar: () => void;
}

export function PasoNegocio({ cuentaComercialId, nombreInicial, alGuardar }: PasoNegocioProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [nombre, setNombre] = useState(nombreInicial);
  const [guardando, setGuardando] = useState(false);

  const limpio = nombre.trim();
  const sinCambios = limpio === nombreInicial.trim();

  async function guardar() {
    if (guardando || limpio.length === 0) return;
    setGuardando(true);
    const res = await actualizarNombreCuentaComercial(cuentaComercialId, limpio);
    setGuardando(false);
    if (!res.ok) {
      // La voz del servidor viaja tal cual: `solo_el_titular_corrige_el_nombre`
      // dice algo que un genérico no puede decir.
      mostrar({ texto: res.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('alta.paso1.guardado'), variante: 'exito' });
    alGuardar();
  }

  return (
    <EvitaTeclado>
      <View style={{ gap: spacing[8] }}>
        <Entrada orden={0}>
          <View style={{ gap: spacing[2] }}>
            <Texto variante="titulo">{t('alta.paso1.titulo')}</Texto>
            <Texto variante="apoyo">{t('alta.paso1.bajada')}</Texto>
          </View>
        </Entrada>

        <Entrada orden={1}>
          <View style={{ gap: spacing[4] }}>
            <Campo
              label={t('alta.paso1.nombre')}
              value={nombre}
              onChangeText={setNombre}
              deshabilitado={guardando}
            />
            <Boton
              variante="primario"
              bloque
              cargando={guardando}
              // LA PUERTA NO OFRECE LO QUE VA A RECHAZAR (Ley 23): sin
              // nombre o sin cambios, el guardado no tiene nada que hacer.
              deshabilitado={limpio.length === 0 || sinCambios}
              etiqueta={t('alta.paso1.guardar')}
              onPress={() => void guardar()}
            />
          </View>
        </Entrada>
      </View>
    </EvitaTeclado>
  );
}
