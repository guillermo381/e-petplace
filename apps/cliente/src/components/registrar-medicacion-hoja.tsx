/**
 * ⭐ **LA PUERTA DE LA MEDICACIÓN** (S113-C · 2.0 · ①).
 *
 * La celda de HOY mostraba la medicación y **no dejaba tocarla** — el mismo
 * hueco que el peso tuvo hasta S91, y con la misma causa: *el motor estaba
 * completo y le faltaba la puerta*.
 *
 * ── 🔴 ADMINISTRAR NO ES PRESCRIBIR, y por eso esta Hoja no toca el snapshot ─
 * `registrarMedicacionAdministrada` **anota una dosis** y, en palabras de A,
 * **no cambia `medicacion_actual`**. Es la diferencia entre *«el vet le recetó
 * esto»* y *«hoy se la di»*. Confundirlas dejaría a la familia recetando desde
 * su casa, que es exactamente lo que la casa no hace.
 *
 * Por eso la voz dice **«Anota una dosis»** y no «agregar medicación»: lo que
 * se guarda es un hecho del día, no un tratamiento.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Boton, Campo, Hoja, Texto, spacing, useAviso } from '@epetplace/ui';
import { registrarMedicacionAdministrada } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function RegistrarMedicacionHoja({
  visible,
  nombre,
  mascotaId,
  onCerrar,
  onRegistrado,
}: {
  visible: boolean;
  nombre: string;
  mascotaId: string;
  onCerrar: () => void;
  onRegistrado: () => void;
}) {
  const { t } = useTraduccion();
  const aviso = useAviso();
  const [medicamento, setMedicamento] = useState('');
  const [dosis, setDosis] = useState('');
  const [guardando, setGuardando] = useState(false);

  /* Los dos campos son obligatorios porque **el motor los exige** (no llevan
     DEFAULT), y el botón lo dice en vez de rebotar: la puerta no ofrece lo que
     va a rechazar (Ley 23). */
  const falta = medicamento.trim() === '' ? 'medicamento' : dosis.trim() === '' ? 'dosis' : null;

  const guardar = () => {
    if (falta !== null || guardando) return;
    setGuardando(true);
    void registrarMedicacionAdministrada(mascotaId, {
      medicamento: medicamento.trim(),
      dosis: dosis.trim(),
    })
      .then((r) => {
        setGuardando(false);
        if (!r.ok) {
          aviso.mostrar({ variante: 'error', texto: r.mensaje });
          return;
        }
        setMedicamento('');
        setDosis('');
        onRegistrado();
        onCerrar();
      })
      .catch(() => {
        /* Sin esto, un rechazo deja la Hoja abierta y muda — la misma clase que
           cacé en la despedida. */
        setGuardando(false);
        aviso.mostrar({ variante: 'error', texto: t('medicacion.noSePudo') });
      });
  };

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={t('medicacion.titulo', { nombre })} conCerrar>
      <View style={{ gap: spacing[4], padding: spacing[4] }}>
        <Texto variante="apoyo">{t('medicacion.detalle')}</Texto>
        <Campo
          label={t('medicacion.cual')}
          value={medicamento}
          onChangeText={setMedicamento}
          placeholder={t('medicacion.cualPlaceholder')}
        />
        <Campo
          label={t('medicacion.dosis')}
          value={dosis}
          onChangeText={setDosis}
          placeholder={t('medicacion.dosisPlaceholder')}
        />
        <Boton
          variante="primario"
          bloque
          etiqueta={t('medicacion.guardar')}
          deshabilitado={falta !== null}
          /* 🔴 **El apagado dice POR QUÉ.** Un botón gris sin razón manda a
             adivinar cuál de los dos campos falta. */
          razonDeshabilitado={
            falta === 'medicamento'
              ? t('medicacion.faltaCual')
              : falta === 'dosis'
                ? t('medicacion.faltaDosis')
                : undefined
          }
          cargando={guardando}
          onPress={guardar}
        />
      </View>
    </Hoja>
  );
}
