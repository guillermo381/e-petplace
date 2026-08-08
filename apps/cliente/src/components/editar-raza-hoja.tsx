/**
 * S91-D · P3 — LA RAZA, EDITABLE DESDE EL PERFIL.
 *
 * Monta `SelectorDeRaza`, **la misma pieza del paso 2 del alta**: la lámina
 * pide para el perfil «la gramática del alta», y eso se cumple compartiendo la
 * pieza, no copiando sus reglas (§6).
 *
 * ⚠️ NO SE VALIDA LO ESCRITO, y es letra: `mascotas.raza` es TEXTO LIBRE por
 * la letra de S59 y `actualizar_raza_mascota` la respeta. «Corregir» acá lo
 * que el dueño escribió —forzándolo al catálogo— mataría el mestizo con
 * nombre propio y la raza que el catálogo no tiene, que son justamente las
 * respuestas que la regla firmada protege. El cinturón del motor rebotaría, y
 * con razón.
 */

import { useState } from 'react';
import { View } from 'react-native';
import { Boton, EvitaTeclado, Hoja, HojaScroll, Texto, spacing } from '@epetplace/ui';
import { actualizarRazaMascota } from '@epetplace/api';

import { SelectorDeRaza, type RazaElegida } from '@/components/selector-de-raza';
import { useTraduccion } from '@/i18n';

export function EditarRazaHoja({
  visible,
  mascotaId,
  nombre,
  especie,
  razaActual,
  onCerrar,
  onGuardada,
}: {
  visible: boolean;
  mascotaId: string;
  nombre: string;
  especie: string;
  razaActual: string | null;
  onCerrar: () => void;
  /** El perfil re-pinta con lo guardado — y su CARA cambia con ella. */
  onGuardada: (raza: string | null) => void;
}) {
  const { t } = useTraduccion();
  const [eleccion, setEleccion] = useState<RazaElegida>({
    raza: razaActual ?? undefined,
    slug: undefined,
    elegido: undefined,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    setError(undefined);
    // `null` es una respuesta: borrar la raza es legítimo («no sé» después de
    // haberla escrito). Por eso no se rebota el vacío.
    const r = await actualizarRazaMascota(mascotaId, eleccion.raza ?? null);
    setGuardando(false);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    onGuardada(r.data.raza);
    onCerrar();
  };

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={t('perfil.razaHojaTitulo', { nombre })} altura="completa">
      {/**
       * ⚠️ A5 (gate del founder, 2ª pasada): la Hoja se TRABABA — la lista
       * tapaba el campo de tipeo y no scrolleaba. Faltaban las dos piezas que
       * el paso 2 del alta sí monta, y `altura="completa"` las volvía
       * obligatorias: fija el alto en 0.9 de la ventana, así que 44 chips
       * desbordan un contenedor que no scrollea.
       *
       * · `HojaScroll` y no `ScrollView` porque estamos DENTRO de una Hoja: es
       *   la pieza que bloquea el pan del swipe-to-close mientras el toque
       *   nace en la lista (L-132 — en web el ScrollView plano no delata el
       *   problema; en Android el arrastre cierra la Hoja).
       * · `EvitaTeclado` porque el campo vive arriba de la lista: sin él, el
       *   teclado tapa justo lo que se está tipeando.
       *
       * **El botón queda AFUERA del scroll a propósito**: adentro obligaría a
       * recorrer las 44 razas para volver a encontrarlo después de elegir.
       */}
      <EvitaTeclado>
        <View style={{ flex: 1, gap: spacing[4] }}>
          <HojaScroll contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <SelectorDeRaza especie={especie} valor={eleccion} onCambio={setEleccion} />
          </HojaScroll>
          {error !== undefined ? (
            <Texto variante="apoyo" color="danger">
              {error}
            </Texto>
          ) : null}
          <Boton
            etiqueta={t('perfil.razaHojaGuardar')}
            bloque
            cargando={guardando}
            onPress={() => void guardar()}
          />
        </View>
      </EvitaTeclado>
    </Hoja>
  );
}
