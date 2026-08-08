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
import { Boton, Hoja, Texto, spacing } from '@epetplace/ui';
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
      <View style={{ gap: spacing[4] }}>
        <SelectorDeRaza especie={especie} valor={eleccion} onCambio={setEleccion} />
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
    </Hoja>
  );
}
