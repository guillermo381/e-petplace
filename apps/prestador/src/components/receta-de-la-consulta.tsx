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
// ── SU UBICACIÓN, FIRMADA (founder, 7-ago-2026) ──────────────────────
// «dentro de la consulta sedimentada, junto al certificado que ya alcanza —
// un solo lugar donde viven los papeles de esa consulta». Así se montó: NO
// nace una tarjeta nueva, esta fila entra a la MISMA que ya tenía el
// certificado. Los papeles de una consulta viven juntos o no viven.
//
// ⚠️ Y SE MONTÓ EN LOS DOS SITIOS DONDE ESA TARJETA EXISTE, con su medición
// —porque montarla solo en la consulta habría cumplido la letra y fallado el
// propósito—: `veterinaria/consulta/[citaId]` llega a `fase='despues'` SOLO
// por `setFase` después de dictar; al re-entrar arranca en `'antes'` (la
// pantalla no lee la HC existente al montar). O sea que ahí el papel es
// alcanzable durante los minutos posteriores al dictado y nunca más — y el
// caso de uso entero es volver a imprimir MESES después.
// `veterinaria/cita/[citaId]` es la que sí alcanza siempre, y es donde el
// certificado «ya alcanza» de verdad.
// **El segundo montaje se declara RATIFICABLE: si el founder quiso
// estrictamente uno, borrarlo es una línea.** Lo que no era defendible era
// entregar una pieza que se ve una vez y parece hecha.
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
import { CeldaNavegacion, Separador, Texto, spacing, useAviso } from '@epetplace/ui';
import { obtenerConsultasConReceta, urlDocumento } from '@epetplace/api';
import { useTraduccion } from '@/i18n';

interface Props {
  mascotaId: string;
  citaId: string;
  /** Comparte tarjeta con el certificado, que va DEBAJO. El separador lo
   *  dibuja esta pieza porque es la única que sabe si se montó: dejárselo al
   *  padre pondría una línea suelta arriba del certificado en toda consulta
   *  sin medicación, que son la mayoría (el patrón `{i > 0 && <Separador/>}`
   *  de las listas no sirve acá — el padre no puede saber el índice). */
  conSeparadorAbajo?: boolean;
}

/** Los tres estados son EXCLUYENTES y ninguno se disfraza del otro (Ley 13):
 *  `null` = todavía no sé · `false` = sé que NO hay · number = hay N. */
type Estado = null | 'error' | false | number;

export function RecetaDeLaConsulta({ mascotaId, citaId, conSeparadorAbajo = false }: Props) {
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
    <>
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
      {conSeparadorAbajo ? <Separador /> : null}
    </>
  );
}
