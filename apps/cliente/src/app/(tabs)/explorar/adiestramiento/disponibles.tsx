/**
 * ADIESTRAMIENTO — EL QUIÉN. **Una fila por ADIESTRADOR.**
 *
 * ═══ 🔴 S109-C · PRIMERO EL QUIÉN, DESPUÉS EL QUÉ (firma del founder) ═══════
 *
 * ⏪ **Esta pantalla pintaba UNA FILA POR PROGRAMA** y partía el oficio en dos
 * caminos según qué fila se tocaba: la sesión llevaba a la vitrina del
 * prestador (`PreviewPrestador`) y el programa iba **directo a
 * `confirmar-programa`, salteándola**. *Dos filas vecinas de la misma pantalla
 * llevaban a lugares distintos, y la familia no tenía cómo saber cuál.*
 *
 * ⭐ Ahora: **un adiestrador es UNA fila**, con todo lo que ofrece resumido bajo
 * su nombre — «Andrés · Sesión suelta $25 · 6 sesiones básicas $90 · 12
 * sesiones completas $115» — y **el tap lleva SIEMPRE a su vitrina**, como en
 * los otros cuatro oficios. Ahí se elige cuál de las tres.
 *
 * 🔴 **Y el hallazgo que abarató todo: la vitrina YA estaba cableada para
 * programas** (`prestador/[prestadorId]` monta `BarraAdiestramiento` con
 * `comprable`). *Era motor con puerta, y la puerta la tenía cerrada una rama de
 * esta lista.* No hubo que construir la vitrina: hubo que dejar de saltearla.
 *
 * ⚠️ **EFECTO DECLARADO SOBRE EL PASO ANTERIOR:** el QUÉ sigue preguntando
 * sesión-o-programa, y **esta lista ya no filtra por esa respuesta** — no
 * podría: un adiestrador con las dos cosas es un solo prestador con tres
 * ofertas. *Se declara en vez de borrar ese paso: quitarlo es decisión de
 * producto y no está firmada.*
 *
 * TESIS: "Estos adiestradores pueden de verdad — y ves quién es antes de elegir
 * qué le comprás."
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerAdiestradoresDisponibles,
  type OfertaAdiestrador,
  obtenerPerfilesPublicos,
  type PerfilPublico,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { PreviewPrestador } from '@/components/preview-prestador';
import { vozOfertaAdiestramiento } from '@/lib/adiestramiento-voz';

export default function AdiestramientoDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    fecha: string;
    hora: string;
    /** Llega del QUÉ y **ya no se lee** — ver la lápida abajo. */
    comprable?: string;
    mascotaId: string;
    mascotaNombre?: string;
  }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  /* ☠️ **`comprable` YA NO SE LEE ACÁ.** El QUÉ lo sigue mandando por la URL
     —por eso queda declarado arriba, para que se sepa que llega— pero esta
     pantalla dejó de filtrar por él: *un adiestrador con sesión suelta y dos
     programas es un solo prestador con tres ofertas, y partirlo por la
     respuesta del paso anterior es lo que producía los dos caminos.* */
  const mascotaId = typeof params.mascotaId === 'string' ? params.mascotaId : '';
  const mascotaNombre = typeof params.mascotaNombre === 'string' ? params.mascotaNombre : '';

  const [disponibles, setDisponibles] = useState<OfertaAdiestrador[] | 'cargando' | 'error'>('cargando');
  /** S91-C · el enriquecimiento del preview, de `v_prestadores_publicos`
   *  (jamás la tabla). Carga SECUNDARIA: la fila se pinta con lo que el
   *  lector de disponibilidad ya trajo y se completa cuando llega — hacer
   *  esperar la disponibilidad por una foto sería D-531 otra vez. */
  const [perfiles, setPerfiles] = useState<Record<string, PerfilPublico>>({});

  // Los perfiles de los que SE ESTÁN OFRECIENDO — ni uno más.
  useEffect(() => {
    if (!Array.isArray(disponibles)) return;
    const ids = [...new Set(disponibles.map((x) => x.prestador_id))];
    if (ids.length === 0) return;
    let vigente = true;
    void obtenerPerfilesPublicos(ids).then((r) => {
      if (!vigente || !r.ok) return;
      setPerfiles(Object.fromEntries(r.data.map((p) => [p.id, p])));
    });
    return () => {
      vigente = false;
    };
  }, [disponibles]);


  /**
   * ⭐ **EL AGRUPADOR — un adiestrador, una fila.**
   *
   * El motor entrega N filas por prestador (una por comprable) y **cuelga todas
   * de la MISMA oferta**: medido en `_adiestramiento_ofertas_cobrables`,
   * `prestador_programas.prestador_servicio_id` es FK a `prestador_servicios`,
   * así que la sesión suelta y todos los programas comparten `ps.id`. *Por eso
   * agrupar es reconstruir lo que el motor ya sabía, no inventar una jerarquía.*
   *
   * 🔴 **El orden interno no es alfabético ni el del motor: es el del
   * compromiso.** La sesión suelta primero —*es lo más chico que se puede
   * probar*— y después los programas de menos a más sesiones. *Empezar por el
   * de doce le pide a una familia que nunca lo probó el compromiso más grande.*
   */
  const porAdiestrador = useMemo(() => {
    if (!Array.isArray(disponibles)) return [];
    const mapa = new Map<string, OfertaAdiestrador[]>();
    for (const o of disponibles) {
      const yaEsta = mapa.get(o.prestador_id);
      if (yaEsta === undefined) mapa.set(o.prestador_id, [o]);
      else yaEsta.push(o);
    }
    for (const ofertas of mapa.values()) {
      ofertas.sort((a, b) => {
        if (a.comprable !== b.comprable) return a.comprable === 'sesion' ? -1 : 1;
        return (a.n_sesiones ?? 0) - (b.n_sesiones ?? 0);
      });
    }
    return [...mapa.values()];
  }, [disponibles]);

  const cargar = useCallback(() => {
    setDisponibles('cargando');
    void obtenerAdiestradoresDisponibles(fecha, hora, mascotaId).then((r) => {
      /* ☠️ **MURIÓ EL FILTRO `o.comprable === comprable`.** Era lo que partía la
         pantalla en dos listas según la respuesta del QUÉ. *Con el prestador
         presidiendo no hay dos listas: hay adiestradores, y cada uno ofrece lo
         que ofrece.* */
      setDisponibles(r.ok ? r.data : 'error');
    });
  }, [fecha, hora, mascotaId]);

  /* ☠️ **S109-C · ESTA PANTALLA DEJÓ DE RESERVAR, y con eso murió su
     `useReservaAdiestramiento`** (`reservarSesion` · `elegirPrograma` ·
     `creandoHold`, los tres sin consumidor). *D-730 sacó el flujo de las listas
     y lo puso en `lib/reserva/<oficio>` para que la ficha reservara de verdad;
     esta lista quedó como su segundo consumidor y hoy deja de serlo — la
     reserva vive donde se elige QUÉ, y eso pasó a ser la vitrina.*
     ⚠️ El hook NO se toca: la vitrina lo sigue usando, y ahí es donde tiene
     sentido. Lo que muere es su uso ACÁ. */

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  /* ☠️ **ACÁ VIVÍA `vozNivel`** — traducía `basico|medio|experto|especialidad`
     para la fila del programa. **Murió con esa fila**: la voz del nivel ahora la
     compone `vozOfertaAdiestramiento`, que es la MISMA que usa la Hoja de la
     vitrina. *Dejarla acá sería tener dos traductores del mismo vocabulario en
     dos pantallas que tienen que decir lo mismo.* */

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adiestramiento.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina */}
        <Celda
          titulo={mascotaNombre.length > 0 ? t('adiestramiento.ventanaPara', { nombre: mascotaNombre }) : t('adiestramiento.titulo')}
          metadataMono={`${fecha} · ${hora}`}
        />
        <Separador />

        {disponibles === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : disponibles === 'error' ? (
          <EstadoVacio
            titulo={t('adiestramiento.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : disponibles.length === 0 ? (
          // Peldaño 0 — nadie puede: vuelta barata al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="training" tamano={48} />}
            titulo={t('explorar.nadiePuede')}
            descripcion={t('explorar.nadiePuedeDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {porAdiestrador.map((ofertas, i) => {
              /* Todas las filas del grupo comparten prestador y oferta: la
                 primera alcanza para lo que la tarjeta necesita. */
              const cabeza = ofertas[0];
              return (
                <View key={cabeza.prestador_id}>
                  {i > 0 ? <Separador /> : null}
                  {/* ☠️ **ACÁ VIVÍA EL TERNARIO `comprable === 'sesion' ? … : …`**
                      que mandaba las sesiones a la vitrina y los programas
                      directo a `confirmar-programa`. **Murió entero**: hay un
                      solo camino y es el de los otros cuatro oficios.
                      *Un oficio con dos caminos según qué fila se toque no es
                      una variante: es una pantalla que la familia no puede
                      aprender.* */}
                  <PreviewPrestador
                    prestadorId={cabeza.prestador_id}
                    ofertaId={cabeza.prestador_servicio_id}
                    nombre={cabeza.prestador_nombre}
                    oficio={t('hogar.railAdiestramiento')}
                    contexto={cabeza.direccion !== null
                      ? [cabeza.direccion, cabeza.ciudad].filter(Boolean).join(' · ')
                      : t('adiestramiento.lugarPorConfirmar')}
                    /* ⭐ **TODO LO QUE OFRECE, BAJO SU NOMBRE.** Se compone con
                       la MISMA función que la Hoja de la vitrina
                       (`lib/adiestramiento-voz`): *dos pantallas que arman la
                       frase por su cuenta divergen en la primera enmienda que
                       sólo una recibe, y la familia elegiría allá algo que acá
                       se llamaba distinto.* */
                    precio={ofertas
                      .map((o) => `${vozOfertaAdiestramiento(o, t)} $${o.precio.toFixed(2)}`)
                      .join(' · ')}
                    perfil={perfiles[cabeza.prestador_id]}
                    /* ⚡ D-730 · la ventana viaja con el tap: sin esto la ficha
                       no puede reservar, porque no sabe CUÁNDO ni PARA QUIÉN.
                       🔴 **Y `comprable` YA NO VIAJA, a propósito**: la vitrina
                       ofrece las tres cosas y la familia elige ahí. *Mandarlo
                       sería volver a decidir por ella en la lista, que es
                       exactamente lo que esta cura vino a sacar.* */
                    contextoReserva={{ oficio: 'adiestramiento', fecha, hora, mascotaId, mascotaNombre }}
                  />
                </View>
              );
            })}
          </Tarjeta>
        )}

        {/* 🔴 **LA NOTA DEL PROGRAMA SE CONDICIONA A QUE HAYA PROGRAMAS, no a la
            respuesta del QUÉ.** *Antes se dibujaba cuando el paso anterior decía
            «programa»; con la lista agrupada esa respuesta ya no describe lo que
            se está mirando — un adiestrador puede tener programas aunque se
            haya pedido sesión.* Se mide sobre lo que está en pantalla. */}
        {Array.isArray(disponibles) && disponibles.some((o) => o.comprable === 'programa') ? (
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * 1.4),
              color: theme.text.secondary,
            }}
          >
            {t('adiestramiento.comprableProgramaVoz')}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
