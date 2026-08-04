/**
 * PIEZAS DE **DATOS** — los bloques que NO dependen de motor nuevo
 * (S85-C12, adelanto autorizado por la mesa).
 *
 * ═══════ POR QUÉ ESTÁN ACÁ Y NO EN UNA PANTALLA ═══════
 *
 * **La tab DATOS no existe todavía, y no se monta vacía** — orden de la
 * mesa y argumento propio: su eje firmado es *"a quiénes cuido"*, así que
 * una tab que abriera mostrando **equipo y plata** —el negocio— sin las
 * vidas ni las familias **no sería incompleta: sería INVERTIDA**, y diría
 * lo contrario de su letra.
 *
 * Estos dos bloques son las únicas franjas cuyos lectores YA EXISTEN
 * (`obtenerEquipoNegocio` · `obtenerResumenPendienteLiquidar`), así que se
 * adelantan **como piezas sueltas listas para enchufar**. El día que
 * lleguen los lectores de vidas, la tab nace **por su eje correcto** y
 * estas dos se montan adentro sin tocarse.
 *
 * ⚠️ **NO SE MONTA EL SHELL DE LA TAB TAMPOCO, y lo declaro porque la
 * orden lo permitía:** un shell es una COMPOSICIÓN —qué preside, qué
 * sigue, con qué aire— y esa decisión se toma con el bloque que preside a
 * la vista. Componer el orden alrededor de las dos franjas secundarias y
 * después meterle las vidas arriba sería componer dos veces, y la segunda
 * contra una forma ya vista. *El shell nace con su eje.*
 *
 * ☠️ CONDICIÓN DE MUERTE DE ESTE ARCHIVO: cuando la tab exista y estas
 * piezas vivan adentro, este archivo se evalúa — si quedan con UN solo
 * consumidor y sin vecinos, se absorben en la pantalla (misma regla que
 * `ControlTelefono` y `FilaDocumento`: pieza local con dueño, no archivo
 * de utilidades).
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Esqueleto,
  EsqueletoGrupo,
  Separador,
  Tarjeta,
  Texto,
  spacing,
} from '@epetplace/ui';
import {
  obtenerEquipoNegocio,
  obtenerResumenPendienteLiquidar,
  type EquipoNegocio,
  type ResumenPendienteLiquidar,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { vozOficio } from '@/lib/voz-oficio';

/**
 * ④ EL EQUIPO — **solo con N>1**, que es la regla de existencia firmada.
 *
 * Un negocio unipersonal no tiene "equipo": tiene una persona, y mostrarle
 * una sección con su propio nombre adentro sería contarle algo que ya sabe
 * con la forma de un hallazgo. **Con un solo miembro el bloque NO SE
 * MONTA** — la misma regla del trío de hitos del muro (sin hitos, la banda
 * no existe) y de la portada de la vitrina.
 *
 * ⚠️ EL FALLO NO SE DISFRAZA DE VACÍO (Ley 13): si la lectura falla, el
 * bloque lo DICE y ofrece reintentar. Un negocio con equipo que ve "no
 * tienes equipo" por un error de red es peor que no ver nada.
 */
export function BloqueEquipo({ cuentaComercialId }: { cuentaComercialId: string }) {
  const { t } = useTraduccion();
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [equipo, setEquipo] = useState<EquipoNegocio | null>(null);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerEquipoNegocio(cuentaComercialId);
        if (!vigente) return;
        if (!r.ok) {
          setEstado('error');
          return;
        }
        setEquipo(r.data);
        setEstado('listo');
      })();
      return () => {
        vigente = false;
      };
    }, [cuentaComercialId, intento]),
  );

  if (estado === 'cargando') {
    return (
      <EsqueletoGrupo>
        <View style={{ gap: spacing[3] }}>
          <Esqueleto forma="linea" ancho="40%" />
          <Esqueleto forma="bloque" ancho="100%" alto={72} />
        </View>
      </EsqueletoGrupo>
    );
  }

  if (estado === 'error') {
    return (
      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">{t('datos.equipoTitulo')}</Texto>
        <Texto variante="apoyo">{t('datos.equipoNoCargo')}</Texto>
        <View style={{ alignSelf: 'flex-start' }}>
          <Boton
            variante="secundario"
            etiqueta={t('cuenta.reintentar')}
            onPress={() => {
              setEstado('cargando');
              setIntento((n) => n + 1);
            }}
          />
        </View>
      </View>
    );
  }

  const miembros = equipo?.miembros ?? [];
  // LA REGLA DE EXISTENCIA: con una sola persona, esto no es un equipo.
  if (miembros.length <= 1) return null;

  const activos = miembros.filter((m) => m.activo);

  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="seccion">{t('datos.equipoTitulo')}</Texto>
      <Tarjeta relleno="ninguno" elevacion="reposo">
        {activos.map((m, i) => (
          <View key={m.empleadoId}>
            {i > 0 ? <Separador /> : null}
            {/* El rol se dice en voz de la casa, no con el enum. Y quien no
                tiene chip NO se rotula "sin rol": recepción está definida
                por AUSENCIA (§1 de LETRA_RECEPCION), así que un vacío acá
                es un dato correcto y no un hueco. */}
            <Celda
              titulo={m.nombre}
              /* `OficioChip` es un código del motor ('paseo'|'grooming'|…),
                 y el prestador JAMÁS ve un código (Ley 3). La traducción
                 sale de `vozOficio`, que es LA función de la casa para
                 esto — no se rehace acá el `switch` que ya vive ahí. */
              subtitulo={
                vozOficio(
                  {
                    paseo: m.oficios.includes('paseo'),
                    grooming: m.oficios.includes('grooming'),
                    adiestramiento: m.oficios.includes('adiestramiento'),
                    vet: m.oficios.includes('veterinaria'),
                  },
                  t,
                ) ?? undefined
              }
            />
          </View>
        ))}
      </Tarjeta>
    </View>
  );
}

/**
 * ③ LA PLATA — **absorbe Ingresos**, y la liquidación queda a UN toque.
 *
 * ⚠️ **LO QUE ESTE BLOQUE TODAVÍA NO DICE, declarado:** el `$ del día`
 * (lo AGENDADO, decisión de mesa) **no llega todavía** — es el mismo dato
 * que esperan el techo de la portada y "Cómo va". Hasta que llegue, este
 * bloque muestra **lo que SÍ es verdad hoy**: lo cobrado que espera
 * liquidación, con su camino.
 * *No se rellena el hueco con el número que hay a mano: "pendiente de
 * liquidar" y "lo que entra hoy" son dos preguntas distintas, y contestar
 * una con la otra es el defecto que §2.4bis nombra para VIDAS.*
 *
 * ⚠️ **CERO JAMÁS SE PINTA COMO MÉTRICA** (§15b, regla de la casa desde
 * S51): sin eventos, el bloque dice su hito y no un `$0,00` — que sería
 * mentira con formato de dato.
 */
export function BloquePlata() {
  const router = useRouter();
  const { t } = useTraduccion();
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [resumen, setResumen] = useState<ResumenPendienteLiquidar | null>(null);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerResumenPendienteLiquidar();
        if (!vigente) return;
        if (!r.ok) {
          setEstado('error');
          return;
        }
        setResumen(r.data);
        setEstado('listo');
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  if (estado === 'cargando') {
    return (
      <EsqueletoGrupo>
        <View style={{ gap: spacing[3] }}>
          <Esqueleto forma="linea" ancho="35%" />
          <Esqueleto forma="bloque" ancho="100%" alto={64} />
        </View>
      </EsqueletoGrupo>
    );
  }

  if (estado === 'error') {
    return (
      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">{t('datos.plataTitulo')}</Texto>
        <Texto variante="apoyo">{t('datos.plataNoCargo')}</Texto>
        <View style={{ alignSelf: 'flex-start' }}>
          <Boton
            variante="secundario"
            etiqueta={t('cuenta.reintentar')}
            onPress={() => {
              setEstado('cargando');
              setIntento((n) => n + 1);
            }}
          />
        </View>
      </View>
    );
  }

  const cantidad = resumen?.cantidad ?? 0;

  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="seccion">{t('datos.plataTitulo')}</Texto>
      {/* Cero eventos = el HITO, jamás el cero. La voz mira adelante en vez
          de informar una ausencia (§15b: vacío ≠ negocio muerto). */}
      <Texto variante="apoyo">
        {cantidad === 0
          ? t('datos.plataHito')
          : cantidad === 1
            ? t('datos.plataUno')
            : t('datos.plataVarios', { n: cantidad })}
      </Texto>
      {/* LA LIQUIDACIÓN A UN TOQUE — la firma pide que se alcance desde
          acá, y la pantalla ya existe: se NAVEGA, no se re-dibuja. */}
      <Tarjeta relleno="ninguno" elevacion="reposo">
        <CeldaNavegacion
          icono="pagos"
          titulo={t('datos.verLiquidaciones')}
          registro="aa"
          onPress={() => router.push('/liquidaciones')}
        />
      </Tarjeta>
    </View>
  );
}
