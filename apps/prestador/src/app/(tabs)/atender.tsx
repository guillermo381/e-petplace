// ─────────────────────────────────────────────────────────────────────
// ATENDER — LA PORTADA DE LA PUERTA (S98-C, Lote 2).
// `LA_CASA_DEL_PRESTADOR` §1 y §2.1bis (firmas del founder, 13-ago).
//
// TESIS: alguien llegó sin cita, y en un toque sé por dónde entra.
//
// FIRMA: **una baldosa por puerta REAL** — un oficio que atiende en su
// local, o la tienda. La portada no enumera lo que el negocio hace: dice
// por dónde puede entrar quien está parado enfrente. *La que no existe
// no se dibuja apagada: no se dibuja.*
//
// ═══ LO QUE ESTA PANTALLA NO ES ══════════════════════════════════════
// **No es un flujo nuevo.** El camino entero —buscar/dar de alta la
// mascota, registrar la atención, cobrar en el local— existe desde S69 y
// vive en `/mostrador/*`; la venta con su código de reclamo vive en
// `/ventas/mostrador` desde S96. Esta portada es **la entrada por
// OFICIO** que a ese camino le faltaba, y el paso ③ (el horario) es del
// bloque siguiente. *Medir antes de construir lo achicó: L-174 otra vez.*
//
// ═══ LAS DOS MITADES, COMPUESTAS EN VISTA ════════════════════════════
// §2.1bis: las dos fuentes NO se fusionan en una consulta —
// `MODELO_DESPENSA` §3.4, el cinturón—. `resolverCapacidadAtender` lee
// dos dominios y esta pantalla los pinta juntos. *El cinturón no prohíbe
// que dos cosas se vean juntas: prohíbe que se guarden juntas.*
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Baldosa,
  Boton,
  CeldaNavegacion,
  Encabezado,
  Separador,
  Tarjeta,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerMiPrestador, obtenerPizarra } from '@epetplace/api';

import {
  hayCapacidad,
  resolverCapacidadAtender,
  type CapacidadAtender,
} from '@/lib/capacidad-atender';
import { useTraduccion } from '@/i18n';

/** El glifo de cada puerta. `training` es el nombre del registry para
 *  adiestramiento (S67). Tabla y no interpolación, por lo mismo que las
 *  keys: el oficio nuevo tiene que OBLIGAR a contestar. */
const GLIFO_OFICIO = {
  veterinaria: 'veterinaria',
  grooming: 'grooming',
  paseo: 'paseo',
  adiestramiento: 'training',
} as const;

/** La voz de cada oficio, POR TABLA y jamás por key armada a mano: una
 *  key interpolada (`atender.oficio_${x}`) compila siempre y se rompe en
 *  runtime el día que el vocabulario crezca — que es justo lo que el riel
 *  de keys tipadas existe para impedir. Con la tabla, el typecheck obliga
 *  a llenar la fila del oficio nuevo (precedente `REGLA_OFICIO`, S86-C). */
const KEY_OFICIO = {
  veterinaria: 'atender.oficioVeterinaria',
  grooming: 'atender.oficioGrooming',
  paseo: 'atender.oficioPaseo',
  adiestramiento: 'atender.oficioAdiestramiento',
} as const;

type Pantalla =
  | { fase: 'cargando' }
  // El error DICE su causa y ofrece reintentar (Ley 13 / regla 36): un
  // fallo de lectura jamás se disfraza de «este negocio no atiende».
  | { fase: 'error'; detalle: string }
  | { fase: 'listo'; capacidad: CapacidadAtender; pizarra: number | null };

export default function Atender() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [pantalla, setPantalla] = useState<Pantalla>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const p = await obtenerMiPrestador();
        if (!p.ok) return { fase: 'error' as const, detalle: p.mensaje };
        /* LA PIZARRA VIAJA EN LA MISMA OLA que la capacidad: son dos
           lecturas y una sola espera. Su fallo NO tumba la portada —las
           puertas del mostrador no dependen de ella— y `null` NO se pinta
           como cero: la regla de S86 se muda entera con la superficie. */
        const [c, pz] = await Promise.all([resolverCapacidadAtender(p.data.id), obtenerPizarra(p.data.id)]);
        return c.ok
          ? { fase: 'listo' as const, capacidad: c.data, pizarra: pz.ok ? pz.data.length : null }
          : { fase: 'error' as const, detalle: c.mensaje };
      })()
        .catch((e: unknown) => ({
          fase: 'error' as const,
          detalle: e instanceof Error ? e.message : String(e),
        }))
        .then((r) => {
          if (vigente) setPantalla(r);
        });
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  if (pantalla.fase === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <MarcaDeAgua />
        <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
          <Encabezado variante="portada" saludo={t('atender.titulo')} />
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={88} />
              <Esqueleto forma="bloque" ancho="100%" alto={88} />
            </View>
          </EsqueletoGrupo>
        </ScrollView>
      </View>
    );
  }

  if (pantalla.fase === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <MarcaDeAgua />
        <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
          <Encabezado variante="portada" saludo={t('atender.titulo')} />
          <EstadoVacio
            registro="pantalla"
            titulo={t('atender.falloTitulo')}
            descripcion={pantalla.detalle}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('atender.reintentar')}
                onPress={() => {
                  setPantalla({ fase: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </ScrollView>
      </View>
    );
  }

  const { capacidad, pizarra } = pantalla;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: insets.bottom + spacing[10],
          gap: spacing[4],
        }}
      >
        <Encabezado variante="portada" saludo={t('atender.titulo')} />

        {/* N9 — EL VACÍO HABLA. Se llega acá con la capacidad leída y en
            cero: la tab no se monta sin capacidad, así que este estado es
            el borde honesto (una oferta que se apagó entre el montaje de
            la barra y este foco), jamás el caso normal. */}
        {!hayCapacidad(capacidad) ? (
          <EstadoVacio
            registro="pantalla"
            titulo={t('atender.vacioTitulo')}
            descripcion={t('atender.vacioDetalle')}
          />
        ) : (
          <>
            {capacidad.oficios.length > 0 && (
              <View style={{ gap: spacing[3] }}>
                {/* Los dos rótulos son los NOMBRES FIRMADOS de las dos
                    naturalezas (§1.2) — `Tus servicios` y `Tu tienda`. No
                    son vocabulario: son el primer candado del cinturón. */}
                <Texto variante="seccion">{t('atender.tusServicios')}</Texto>
                {/* 🔴 S98-C · `orden` NO SE PASA, Y ES UNA DESVIACIÓN
                    DECLARADA DE N6 (entrada escalonada en toda pantalla
                    nueva) — no un olvido.

                    MEDIDO en el navegador (`getBoundingClientRect` +
                    `getComputedStyle`, no deducido): con `orden`, la
                    baldosa se envuelve en `Entrada`, cuyo `Animated.View`
                    de Reanimated queda **`position: absolute`** en RN-web.
                    Un hijo absoluto no aporta alto a su padre ⇒ **la celda
                    de la grilla mide 0 y las baldosas se dibujan encima de
                    la pizarra.** Medido en esta pantalla: celda `w=186
                    h=0`, con el botón adentro en `186×186`.

                    ⚠️ **EL LÍMITE: está medido en RN-WEB.** En nativo
                    Reanimated no posiciona así y es probable que el
                    teléfono lo resuelva bien — **no lo afirmo, no lo medí.**
                    Se saca igual porque es la única forma de que la
                    composición sea VERIFICABLE hoy: *shippear una pantalla
                    cuya composición no puedo ver, confiando en que la
                    plataforma que no medí la salve, es exactamente el
                    verde sin medir que la casa prohíbe.*

                    ☠️ CONDICIÓN DE MUERTE de esta desviación: cuando B
                    resuelva la interacción `Entrada`×grilla, vuelve
                    `orden={i}` — es UNA línea, y su ausencia está acá para
                    que nadie la lea como decisión de diseño.

                    ⏪ Y una corrección propia: antes de medir esto probé
                    `alignItems: 'flex-start'` culpando al `stretch` de la
                    fila. **Falsado por la medición** — no cambió nada,
                    porque el problema nunca fue la altura circular sino un
                    hijo absoluto. Se revirtió: *un parche que no se
                    entiende no es inofensivo aunque no rompa — es una
                    explicación falsa esperando que alguien la crea.* */}
                {/* LA GRILLA ES DE LA PANTALLA, LA BALDOSA ES DE LA PIEZA
                    (contrato de B): cuántas columnas entran depende del
                    ancho de ESTA superficie, no de la pieza. `47%` con el
                    gap evita que el redondeo empuje una tercera columna, y
                    `flexGrow` hace que la impar ocupe la fila entera en
                    vez de quedar a media pantalla. */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] }}>
                  {capacidad.oficios.map((o) => (
                    <View key={o.oficio} style={{ flexBasis: '47%', flexGrow: 1 }}>
                      <Baldosa
                        glifo={GLIFO_OFICIO[o.oficio]}
                        titulo={t(KEY_OFICIO[o.oficio])}
                        capa={o.oficio === 'veterinaria' ? 'identidad' : 'cuidado'}
                        onPress={() =>
                          router.push({ pathname: '/mostrador', params: { oficio: o.oficio } })
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ⭐ S98-C · §3.1 — LA PIZARRA, MUDADA DEL HOY. La letra:
                *«la pizarra, y todo lo de atender o ASIGNAR, vive en
                ATENDER»*. Una cita sin tratante es trabajo que alguien
                tiene que TOMAR — el verbo de esta tab.

                ⚠️ VA APARTE de las puertas, y la razón de S86 se muda con
                ella: las baldosas son por dónde entra quien LLEGÓ; la
                pizarra es una oportunidad del EQUIPO que todavía no es
                tuya. Y es FILA, no baldosa: se lee (lleva un número), no
                se elige entre pares (Acto II).

                Sus dos gates de S86 se conservan literales: se monta
                AUNQUE ESTÉ VACÍA —gatearla en `> 0` la volvía inalcanzable
                y el founder no podía ni ver que existe (L-201: el cero es
                un dato)— y con `null` NO se monta, porque eso no es cero:
                es «no se pudo leer» o «no sos del equipo». */}
            {pizarra !== null && (
              <Tarjeta relleno="ninguno">
                <CeldaNavegacion
                  icono="caso"
                  registro="aa"
                  titulo={t('pizarra.entrada')}
                  detalle={
                    pizarra === 0
                      ? t('pizarra.entradaVacia')
                      : pizarra === 1
                        ? t('pizarra.entradaUna')
                        : t('pizarra.entradaN', { n: pizarra })
                  }
                  onPress={() => router.push('/pizarra')}
                />
              </Tarjeta>
            )}

            {capacidad.tienda && (
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('atender.tuTienda')}</Texto>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] }}>
                  <View style={{ flexBasis: '47%', flexGrow: 1 }}>
                    <Baldosa
                      glifo="despensa"
                      titulo={t('atender.ventaTitulo')}
                      capa="consumo"
                      onPress={() => router.push('/ventas/mostrador')}
                    />
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
