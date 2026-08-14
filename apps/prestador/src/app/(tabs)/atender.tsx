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
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerMiPrestador } from '@epetplace/api';

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
  | { fase: 'listo'; capacidad: CapacidadAtender };

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
        const c = await resolverCapacidadAtender(p.data.id);
        return c.ok
          ? { fase: 'listo' as const, capacidad: c.data }
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

  const { capacidad } = pantalla;

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
                {/* LA GRILLA ES DE LA PANTALLA, LA BALDOSA ES DE LA PIEZA
                    (contrato de B): cuántas columnas entran depende del
                    ancho de ESTA superficie, no de la pieza. `47%` con el
                    gap evita que el redondeo empuje una tercera columna, y
                    `flexGrow` hace que la impar ocupe la fila entera en
                    vez de quedar a media pantalla. */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] }}>
                  {capacidad.oficios.map((o, i) => (
                    <View key={o.oficio} style={{ flexBasis: '47%', flexGrow: 1 }}>
                      <Baldosa
                        glifo={GLIFO_OFICIO[o.oficio]}
                        titulo={t(KEY_OFICIO[o.oficio])}
                        capa={o.oficio === 'veterinaria' ? 'identidad' : 'cuidado'}
                        orden={i}
                        onPress={() =>
                          router.push({ pathname: '/mostrador', params: { oficio: o.oficio } })
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
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
                      orden={capacidad.oficios.length}
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
