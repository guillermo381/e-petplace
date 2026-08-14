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
  FilaDato,
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
import { obtenerMiPrestador, obtenerPizarra, obtenerPlataDelDia, type PlataDelDia } from '@epetplace/api';
import { montoCorto } from '@/lib/formato-techo';

import {
  hayCapacidad,
  resolverCapacidadAtender,
  type CapacidadAtender,
} from '@/lib/capacidad-atender';
import { hoyLocalISO } from '@/lib/ventas-formato';
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

/**
 * 🔴 LA CELDA DE LA GRILLA — y sus dos desvíos del patrón documentado,
 * los dos MEDIDOS antes de desviarme (D-804).
 *
 * ① **SIN `flexGrow`.** El patrón lo traía razonando que *«una baldosa
 *    impar ocupe la fila entera en vez de quedar a media pantalla»* — y
 *    esa regla, con la pieza ya CUADRADA, produce el defecto que A midió
 *    en dispositivo: la impar crece a todo el ancho y su `aspectRatio: 1`
 *    la vuelve **un cuadrado de pantalla completa** (~380×380; dos
 *    apiladas ≈ los 800 px del reporte). *Lo que era una regla de relleno
 *    razonable para una tarjeta libre se vuelve un gigante cuando la
 *    pieza ata alto a ancho.*
 *
 * ② **`47%` y NO el `48%` nuevo.** El patrón cambió a 48% para dejar de
 *    ser «frágil por siete píxeles», y la aritmética dice que el 48%
 *    **no entra en ninguno de los dos anchos reales** —el gap cuenta
 *    para la decisión de wrap—:
 *
 *      Android 412 (380 útiles): 2×182.4 + 16 = 380.8 > 380  ⇒ WRAP
 *      web     420 (388 útiles): 2×186.2 + 16 = 388.5 > 388  ⇒ WRAP
 *      con 47%:                  373.2 y 380.7               ⇒ ENTRA
 *
 *    Adoptarlo mandaría la portada a UNA columna en los dos aparatos.
 *    **Va como medición a B, no como parche mío a su patrón** — pero
 *    tampoco copio un número que ya medí que no entra.
 */
const ESTILO_CELDA = { flexBasis: '47%' } as const;

type Pantalla =
  | { fase: 'cargando' }
  // El error DICE su causa y ofrece reintentar (Ley 13 / regla 36): un
  // fallo de lectura jamás se disfraza de «este negocio no atiende».
  | { fase: 'error'; detalle: string }
  | {
      fase: 'listo';
      capacidad: CapacidadAtender;
      pizarra: number | null;
      /** `null` = no se pudo leer. **NO se degrada a cero**: un cero con
       *  cara de dato diría «hoy no hay nada», y lo que pasó fue que no
       *  pudimos preguntar (L-197, y el propio contrato del lector). */
      plata: PlataDelDia | null;
    };

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
        const [c, pz, pl] = await Promise.all([
          resolverCapacidadAtender(p.data.id),
          obtenerPizarra(p.data.id),
          // §4ter: el gate vive en el SERVIDOR. Acá no se recompone ningún
          // permiso — se pinta lo que la RPC contesta.
          obtenerPlataDelDia(p.data.id, hoyLocalISO()),
        ]);
        return c.ok
          ? {
              fase: 'listo' as const,
              capacidad: c.data,
              pizarra: pz.ok ? pz.data.length : null,
              plata: pl.ok ? pl.data : null,
            }
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

  const { capacidad, pizarra, plata } = pantalla;

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

        {/* ⭐ S98-C · LA BANDA DEL DÍA (orden de la mesa, gate del founder).
            Compacta, arriba de las baldosas, y **legal por §4ter**: la
            plata del día y NADA MÁS — su gate vive en el SERVIDOR
            (`obtener_plata_del_dia`), acá no se recompone ningún permiso.

            🔴 **LO QUE ESTA BANDA NO DICE, Y POR QUÉ — se declara para que
            nadie lea otra cosa en estos números.** La orden pedía
            *«servicios prestados hoy · cobrado hoy»* y **hoy no existe
            lector honesto de ninguno de los dos** (medido, S98-C):

             · **«cobrado hoy»** — `cobro_presencial_registrado` tiene
               ESCRITOR y **cero lectores** en `packages/api` (2 filas
               vivas). No hay de dónde leerlo.
             · **«prestados hoy»** — lo que existe cuenta citas VIVAS del
               día, que es lo agendado, no lo prestado.

            Y el lector que sí existe **dice explícitamente que no es eso**:
            *«PLATA = el valor AGENDADO del día. NO lo devengado, NO lo
            cobrado. Contesta ¿cuánto vale mi jornada?, no ¿cuánto llevo
            cobrado?»*. **Rotular «cobrado» este número sería un
            verosímil-falso de PLATA** — la clase de defecto más cara de la
            casa, porque nadie audita un número que parece razonable.

            ⇒ **La banda muestra lo que hay, con el nombre de lo que es.**
            Los dos números pedidos entran cuando A entregue sus lectores
            (pedido cursado con contrato y su gate §4ter). */}
        {plata !== null && plata.visible && (
          <Tarjeta relleno="normal">
            <View style={{ flexDirection: 'row', gap: spacing[6] }}>
              <FilaDato etiqueta={t('atender.bandaCitas')} valor={String(plata.citas ?? 0)} mono />
              <FilaDato etiqueta={t('atender.bandaAgendado')} valor={montoCorto(plata.total ?? 0)} mono />
            </View>
            {/* El total DECLARA lo que le falta: con citas sin precio es
                PARCIAL, y callarlo sería mentir por omisión con un número
                redondo (contrato del lector, L-197). */}
            {(plata.sinPrecio ?? 0) > 0 && (
              <Texto variante="apoyo">{t('atender.bandaParcial', { n: plata.sinPrecio ?? 0 })}</Texto>
            )}
          </Tarjeta>
        )}
        {/* El fallo de lectura DICE que es fallo — jamás un cero, que se
            leería como «hoy no hubo nada» (Ley 13). */}
        {plata === null && <Texto variante="apoyo">{t('atender.bandaNoSePudo')}</Texto>}

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
                {/* ✅ S98-C · `orden` DEVUELTO — con las DOS condiciones
                    cumplidas y verificadas, no con una: la pieza declara su
                    alto (`aspectRatio` subió a su raíz, B) **y** esta
                    captura se re-corrió con el testigo debajo (la pizarra),
                    que es lo único que hace visible una altura cero. */}
                {/* 🔴 `alignItems: 'flex-start'` — LA MITAD DE D-804 QUE ES MÍA.
                    Con el default `stretch`, cada celda de la fila recibe un
                    ALTO DEFINIDO (el de la fila), y un alto definido GANA
                    sobre el `aspectRatio` de la pieza ⇒ la baldosa deja de
                    ser cuadrada y se estira. Medido por A en dispositivo:
                    **~800 px de alto, dos scrolls para dos celdas.**
                    Con `flex-start` la celda no recibe alto y la proporción
                    de la pieza vuelve a gobernar.

                    **Esto NO repite ningún número de `Baldosa`:** no digo
                    cuánto mide, digo que no se lo impongo.

                    ⏪ Y UNA AUTOCORRECCIÓN: esta línea ya la había escrito
                    hace unas horas y **la revertí diciendo que la hipótesis
                    estaba "falsada"**. Era una sobre-generalización mía: en
                    RN-web fue un NO-OP porque allá el colapso lo causaba
                    otra cosa (`Entrada` en absoluto), y **de "no cambió nada
                    en web" concluí "el mecanismo es falso"**. El mecanismo
                    —el estirón del eje cruzado— nunca se midió en nativo, que
                    es donde muerde. *Un no-op en la plataforma equivocada no
                    falsa nada: solo dice que ahí no era.* */}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: spacing[4],
                  }}
                >
                  {capacidad.oficios.map((o, i) => (
                    <View key={o.oficio} style={ESTILO_CELDA}>
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
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: spacing[4],
                  }}
                >
                  <View style={ESTILO_CELDA}>
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
