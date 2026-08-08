// ─────────────────────────────────────────────────────────────────────
// LA RELECTURA DE LA RECETA (S91-B) — el vet vuelve a imprimir lo que recetó.
//
// EL HUECO, MEDIDO: la EMISIÓN funciona —la medicación nace de
// `sedimentar_nota_clinica` en la consulta— pero **«receta» no aparecía ni
// una vez en `apps/prestador`**. El único `urlDocumento` de toda la app es
// el del certificado. El vet receta, el papel existe, y no tenía forma de
// volver a verlo. (La pantalla de EMISIÓN nunca hizo falta: la cabecera del
// certificado ya lo decía — «los otros cuatro papeles se arman con datos que
// YA ESTÁN; éste no». La receta es de los cuatro.)
//
// TESIS: lo que este profesional recetó en esta consulta sigue estando a un
//   toque, meses después.
// FIRMA: la DESAPARICIÓN — una consulta sin medicación no monta nada. No hay
//   «esta consulta no tiene receta»: eso sería ruido en el 90% de las citas.
// CHANEL: no se lista la medicación acá. La pantalla que la muestra ya
//   existe; repetirla sería dos veces el mismo dato, y el papel es el papel.
//
// ── LO QUE NO DECIDE ESTA PIEZA, y por qué está escrito ───────────────
// ⚠️ SU UBICACIÓN ESPERA FIRMA DEL FOUNDER (orden de mesa, 7-ago-2026). Por
// eso es un COMPONENTE y no una pantalla: se monta donde el founder diga con
// una línea, y mientras tanto no inventa una entrada. **Consecuencia honesta
// que se declara en vez de disimularse: hasta que se monte, esta pieza es
// INALCANZABLE y por lo tanto NO GATEABLE (L-161).** El veredicto de su
// orden es PARCIAL por regla 77, con esto nombrado como lo que falta.
//
// ── POR QUÉ SE ANCLA A LA CITA Y NO A LA MASCOTA ─────────────────────
// El lector `obtener_consultas_con_receta` devuelve TODAS las consultas con
// medicación de la mascota, de CUALQUIER negocio — y su gate
// (`user_tiene_acceso_a_mascota`) deja pasar al prestador con acceso activo,
// así que un vet de Aurora vería la receta que prescribió Paseos Andres.
// **Medido, con las dos filas vivas: Thor tiene exactamente ese par.**
//
// Re-imprimir el papel de OTRO negocio no es lo mismo que re-imprimir el
// propio: la receta lleva banda de emisor y matrícula del profesional. Esta
// pieza se ancla a UNA cita —«lo que recetó», literal— y con eso la pregunta
// no se plantea. **Si la mesa quiere la lista por mascota, es decisión suya y
// no un olvido: angostar es reversible, ensanchar después no.**
//
// CERO PEDIDO DE MOTOR: el lector y `urlDocumento` ya existen y los dos
// gatean por el mismo helper, que ya cubre al prestador. Verificado leyendo
// los dos bodies, no supuesto.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CeldaNavegacion, Texto, spacing, useAviso } from '@epetplace/ui';
import { obtenerConsultasConReceta, urlDocumento } from '@epetplace/api';
import { useTraduccion } from '@/i18n';

interface Props {
  mascotaId: string;
  citaId: string;
}

/** Los tres estados son EXCLUYENTES y ninguno se disfraza del otro (Ley 13):
 *  `null` = todavía no sé · `false` = sé que NO hay · number = hay N. */
type Estado = null | 'error' | false | number;

export function RecetaDeLaConsulta({ mascotaId, citaId }: Props) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [estado, setEstado] = useState<Estado>(null);

  const cargar = useCallback(() => {
    setEstado(null);
    void obtenerConsultasConReceta(mascotaId).then((r) => {
      if (!r.ok) {
        // Un fallo de red NO es "no hay receta". Si se degradara a `false`
        // el vet concluiría que nunca recetó — la falla más cara posible acá.
        setEstado('error');
        return;
      }
      const fila = r.data.find((c) => c.citaId === citaId);
      setEstado(fila ? fila.medicamentos : false);
    });
  }, [mascotaId, citaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const abrir = async () => {
    const r = await urlDocumento(mascotaId, 'receta', citaId);
    if (r.ok) await Linking.openURL(r.data);
    else mostrar({ texto: r.mensaje, variante: 'error' });
  };

  // Cargando y "no hay" comparten salida —nada— a propósito: es un affordance
  // secundario dentro de una pantalla que ya tiene contenido, y parpadearle
  // un esqueleto encima molestaría más de lo que informa.
  if (estado === null || estado === false) return null;

  if (estado === 'error') {
    return (
      <View style={{ gap: spacing[2] }}>
        <Texto variante="apoyo">{t('receta.fallo')}</Texto>
        <CeldaNavegacion
          icono="receta"
          titulo={t('receta.reintentar')}
          onPress={cargar}
        />
      </View>
    );
  }

  return (
    <CeldaNavegacion
      icono="receta"
      titulo={t('receta.ver')}
      detalle={
        estado === 1
          ? t('receta.unMedicamento')
          : t('receta.variosMedicamentos', { n: estado })
      }
      onPress={() => void abrir()}
    />
  );
}
