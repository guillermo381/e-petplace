/**
 * S114-C · C6 · **MIS CASOS** — Cuenta > Ayuda.
 *
 * TESIS (Ley 14): *lo que abrí y en qué quedó.*
 *
 * FIRMA (Ley 15): **los abiertos arriba.** No es orden cronológico: es que lo
 * que todavía espera algo va primero, y lo terminado se lee después.
 *
 * CHANEL (Ley 16): la misma `FilaBandejaCaso` que usa el prestador — *un caso
 * no se ve distinto según quién lo mire*. Y **sin puntaje**: es una lista.
 *
 * ⚠️ **El plazo NO se muestra acá** — la misma pieza, dos asientos: el
 * prestador recibe `reloj` y la familia no.
 *
 * 🔴 **Y la LEY no se repite acá: vive en `lib/postventa/voz-de-etapa.ts`.**
 * ⏪ Este comentario declaraba §2 con todas sus letras… **y la pantalla del
 * caso mostraba el plazo igual**. *Dos superficies del mismo arco diciéndose
 * distinto, y la ley escrita dos veces en prosa es exactamente cómo pasa: dos
 * textos que hoy coinciden y mañana no.* Allá el plazo es INEXPRESABLE, no
 * «no se pasa».
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaBandejaCaso,
  Texto,
  spacing,
  useTheme,
  type CasoEnBandeja as FilaDeBandeja,
} from '@epetplace/ui';
import {
  obtenerMisCasos,
  obtenerMotivosDeObjeto,
  type CasoEnBandeja,
  type ObjetoPostventa,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { tituloDelObjeto } from '@/lib/voz-del-caso';
import {
  FiltrosDeCaso,
  type FiltroEstadoCaso,
  type FiltroFechaCaso,
} from '@/components/postventa/filtros-de-caso';
import { vozServicio } from '@/lib/voz-servicio';

type Fase<T> = T | 'cargando' | 'error';

/** Las etapas en las que el caso ya terminó. Ordenan la lista (§: abiertos arriba).
 *
 * 🔴 **SU CHIP SE LLAMABA «Cerrados», Y ÉSE ERA EL DEFECTO** que el founder
 * reportó como *«el caso cerrado se ve Resuelto»*.
 *
 * Medido caminando, sobre un caso real: la pantalla del caso **dibujaba bien**
 * —fila en «Resuelto», «Cerrado» apagado, porque su `etapa` ES `resuelto`—.
 * Lo que mentía era **el chip que lo agrupaba**: este conjunto tiene CINCO
 * etapas y el rótulo nombraba a UNA de ellas. *Un rótulo que nombra a un
 * miembro del conjunto hace que los otros cuatro se lean como un error* — y
 * eso es exactamente lo que pasó: un resuelto bajo «Cerrados» parece un caso
 * cerrado mal dibujado.
 *
 * ⇒ el chip pasa a **«Terminados»**, que es lo que el conjunto es. *La cura no
 * era el filtro ni la pantalla: era el nombre.* */
const TERMINADAS: ReadonlySet<string> = new Set([
  'resuelto', 'cerrado', 'resuelto_entre_partes', 'retirado', 'sin_lugar',
]);

export default function MisCasos() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [casos, setCasos] = useState<Fase<CasoEnBandeja[]>>('cargando');
  const [vozDeMotivo, setVozDeMotivo] = useState<Record<string, string>>({});
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoCaso>('todos');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFechaCaso>('todos');

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerMisCasos();
        if (!vigente) return;
        setCasos(r.ok ? r.data : 'error');
        if (!r.ok) return;

        /* El motivo llega como CÓDIGO; su voz vive en el catálogo. Una lectura
           por tipo de objeto presente, no por fila. */
        const tipos = [...new Set(r.data.map((c) => c.objetoTipo))] as ObjetoPostventa[];
        const listas = await Promise.all(tipos.map((x) => obtenerMotivosDeObjeto(x)));
        if (!vigente) return;
        const mapa: Record<string, string> = {};
        for (const l of listas) {
          if (!l.ok) continue;
          /* ⚠️ Lo PROPIO pisa a lo HEREDADO: `v_motivos_resueltos` devuelve
             `no_ejecutado` dos veces para estadía, con dos voces (aviso de D).
             Sin esto, la fila mostraría la voz de cita sobre una estadía. */
          for (const m of l.data) {
            if (mapa[m.codigo] === undefined || m.procedencia === 'propio') mapa[m.codigo] = m.voz;
          }
        }
        setVozDeMotivo(mapa);
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  /**
   * 🔴 **EL FILTRO DE FECHA VIVE EN LA VISTA, Y ESO ESTÁ MEDIDO — no supuesto.**
   *
   * B me dejó el contrato del patrón: *«la ventana temporal es la CONSULTA, no
   * un filtro de vista — filtrar en memoria miente en cuanto la ventana no
   * trae todo»*. Es cierto, y por eso fui a ver si acá la ventana trae todo:
   *
   * `obtener_mis_casos` (`20260911650000:114-125`) **no tiene `LIMIT`**: es un
   * `SELECT … WHERE c.familia_user_id = auth.uid()` con su `ORDER BY`. Trae
   * TODOS los casos de la familia ⇒ **acá el filtro de vista no puede mentir**,
   * porque no hay nada afuera de la ventana.
   *
   * ⚠️ **Y la garantía no es este comentario: es el TIPO.** `obtenerMisCasos`
   * devuelve `CasoEnBandeja[]` **pelado, sin cursor**. El día que A pagine
   * tendrá que devolver `{ casos, cursor }` y **este archivo deja de
   * compilar** — que es exactamente lo que quiero: *una condición que se
   * rompe en silencio no es una condición.*
   *
   * *La diferencia con el histórico del prestador, que sí consulta: ahí la
   * ventana ES grande y el motor pagina. Acá una familia tiene pocos casos y
   * muchas citas — se pide por el lado chico.*
   */
  const filas: FilaDeBandeja[] = useMemo(() => {
    if (typeof casos === 'string') return [];
    /* 🔴 LOS ABIERTOS ARRIBA, y dentro de cada grupo lo más nuevo primero.
       `sort` sobre una copia: ordenar el arreglo del estado lo mutaría. */
    const desde =
      filtroFecha === 'todos'
        ? null
        : new Date(Date.now() - (filtroFecha === 'semana' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString();

    return [...casos]
      .filter((c) => {
        if (filtroEstado === 'abiertos' && TERMINADAS.has(c.etapa)) return false;
        if (filtroEstado === 'cerrados' && !TERMINADAS.has(c.etapa)) return false;
        /* 🔴 **POR CUÁNDO SE ABRIÓ EL CASO — firmado por la mesa, 8-sep**, y
           el argumento que la firma es el tercero, que es medido:

           ① la pantalla se llama «Mis casos» y lista CASOS; la fecha propia de
              un caso es cuándo se abrió · ② el título de la fila ya dice la
              fecha del servicio, así que ubicarlo se hace mirando · ③ **
              `creadoEn` SIEMPRE existe y la fecha del objeto NO** —medido:
              `objetoFecha` llega `null` para un pedido— y *un caso que
              desaparece de la lista por no tener fecha es peor que un filtro
              impreciso*. */
        if (desde !== null && c.creadoEn < desde) return false;
        return true;
      })
      .sort((a, b) => {
        const ta = TERMINADAS.has(a.etapa) ? 1 : 0;
        const tb = TERMINADAS.has(b.etapa) ? 1 : 0;
        if (ta !== tb) return ta - tb;
        return b.creadoEn.localeCompare(a.creadoEn);
      })
      .map((c) => ({
        clave: c.casoId,
        objeto: tituloDelObjeto(
          c,
          idioma,
          t(`postventa.objeto_${c.objetoTipo}` as 'postventa.objeto_cita'),
          vozServicio(t, c.servicio),
        ),
        contraparte: t('postventa.asientoPrestador'),
        motivo: vozDeMotivo[c.motivo] ?? c.motivo,
        ...(c.mascotaNombre !== null ? { nombreMascota: c.mascotaNombre } : null),
        /* Sin `reloj`: el plazo es del prestador — ver la cabecera. */
      }));
  }, [casos, idioma, t, vozDeMotivo, filtroEstado, filtroFecha]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('postventa.misCasosTitulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[6],
          gap: spacing[3],
        }}
      >
        {casos === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={72} />
          </EsqueletoGrupo>
        ) : casos === 'error' ? (
          /* Ley 13: el error jamás se disfraza de vacío. */
          <EstadoVacio titulo={t('postventa.misCasosNoSePudo')} />
        ) : casos.length === 0 ? (
          /* Vacío SERENO — no haber tenido que reclamar nada es la buena
             noticia, no un hueco que llenar. */
          <EstadoVacio titulo={t('postventa.misCasosVacio')} />
        ) : (
          <>
            <Texto variante="apoyo">{t('postventa.misCasosIntro')}</Texto>
            {/* Los filtros van ARRIBA de la lista y sólo cuando hay algo que
                filtrar: dos hileras de pastillas sobre una lista vacía son
                controles que no controlan nada (Ley 23 — la puerta no ofrece
                lo que no tiene). */}
            <FiltrosDeCaso
              estado={filtroEstado}
              onEstado={setFiltroEstado}
              fecha={filtroFecha}
              onFecha={setFiltroFecha}
            />
            {/* 🔴 **DOS VACÍOS DISTINTOS, y por eso son dos ramas.** Uno dice
                «no tuviste que reclamar nada» —la buena noticia— y el otro
                «lo que buscás no está con estos filtros», que se resuelve
                tocando una pastilla. *Un solo texto para los dos le diría a
                una familia que no tiene casos cuando tiene seis.* */}
            {/* ⚠️ **ESTA RAMA NO ESTÁ EJERCIDA EN APARATO, y no es un olvido.**
                Firmado por la mesa el 8-sep: se declara y **no se fuerza**.

                Por qué no se puede hoy: el filtro de período mira
                `creadoEn` DEL CASO (firmado con su razón — ver abajo), y **los
                ocho casos de esta familia se abrieron esta semana**, así que
                ninguna combinación de los dos ejes da cero. Medido contra la
                base: la única fecha vieja del sujeto que se sembró
                (`b630e1ce`) es `pedidos.created_at` = 16-ago, **y no la lee
                nadie** — el caso se creó hoy y su objeto se tocó hoy.

                🔴 **QUÉ HARÍA FALTA PARA EJERCERLA**, para que el día que
                alguien vuelva acá no tenga que re-deducirlo:
                  · **un caso ABIERTO hace más de 7 días** — o sea
                    `casos_postventa.creado_en` viejo de verdad;
                  · **no se siembra tocando el objeto**: retroceder esa fecha
                    exige un `UPDATE` sobre la tabla, que ninguna RPC hace y
                    que la mesa decidió NO ejecutar;
                  · ⇒ **el sujeto natural llega en octubre**, cuando existan
                    casos con semanas encima. Ahí se camina y se captura.

                *Fabricar el dato para ver esta rama en verde sería el verde
                por conveniencia que esta casa castiga.* */}
            {filas.length === 0 ? <EstadoVacio titulo={t('postventa.filtroSinNada')} /> : null}
            {filas.map((f) => (
              <FilaBandejaCaso
                key={f.clave}
                caso={f}
                onPress={() => router.push(`/postventa/caso/${f.clave}`)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
