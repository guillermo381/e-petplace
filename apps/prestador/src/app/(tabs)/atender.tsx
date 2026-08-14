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
import {
  obtenerCitasAdiestramientoDelDia,
  obtenerCitasGroomingDelDia,
  obtenerCitasPaseoDelDia,
  obtenerCitasVetDelDia,
  obtenerMiPrestador,
  obtenerPizarra,
  obtenerPlataDelDia,
  obtenerSolicitudesMostrador,
  type PlataDelDia,
  type SolicitudMostrador,
} from '@epetplace/api';
import { montoCorto } from '@/lib/formato-techo';

import {
  hayCapacidad,
  resolverCapacidadAtender,
  type CapacidadAtender,
  type OficioAtender,
} from '@/lib/capacidad-atender';
import { PizarraHoja } from '@/components/atender/pizarra-hoja';
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
 * ✅ S98-C · LA GRILLA CONVERGE AL PATRÓN DEL PIE DE `Baldosa.tsx`, y esta
 * pantalla deja de tener el suyo.
 *
 * ⏪ ACÁ VIVÍAN DOS DESVÍOS MÍOS, los dos medidos y los dos correctos EN
 * SU MOMENTO: sin `flexGrow` (con la pieza cuadrada, la impar crecía a
 * ~380×380 — D-804) y con `47 %` en vez del `48 %` de entonces, que no
 * entraba en ningún teléfono. **Los dos mueren porque su causa murió:**
 * el patrón nuevo saca el `gap` de la cuenta del wrap, y sin gap
 * `50 % + 50 % = 100 %` cierra EXACTO en cualquier ancho. *Un desvío que
 * sobrevive a la razón que lo justificaba deja de ser una medición y pasa
 * a ser una copia divergente.*
 *
 * ⚠️ Y el `alignItems: 'flex-start'` de los contenedores se va con ellos:
 * existía para que la fila no le impusiera un alto a la celda y le ganara
 * al `aspectRatio` del hijo. Hoy **la raíz de la pieza declara sus dos
 * dimensiones** (B, D-804), así que ya no hay nada que proteger.
 */
const ESTILO_GRILLA = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -spacing[2],
} as const;
const ESTILO_CELDA = {
  width: '50%',
  paddingHorizontal: spacing[2],
  paddingBottom: spacing[4],
} as const;

/**
 * ⭐ S98-C · EL SUBTÍTULO DE LA BALDOSA — firma del founder sobre el gate
 * (§6bis ③): *«los rectángulos tienen mucho espacio en blanco… ¿subtítulo
 * o así?»* → propuesta de mesa → **«me gusta»**.
 *
 * **LA REGLA FIRMADA: dice lo que PASA HOY, o no dice nada.** Un subtítulo
 * descriptivo —«atendé a tus pacientes»— llena el hueco y no informa: es
 * ruido con tipografía.
 *
 * ═══ LO QUE NO SE PUDO CUMPLIR AL PIE, Y SE DECLARA ═══════════════════
 * Los ejemplos de la firma eran tres: «3 citas hoy» · **«2 en espera»** ·
 * «sin agenda hoy». **El del medio ya no es computable, y por una decisión
 * de la misma jornada:** el «Llegó» murió y `llegada_en` pasó a estamparlo
 * el motor **en la transición a `en_curso`** (trigger de A). O sea que
 * *llegó* y *se está atendiendo* pasaron a ser el mismo instante — no hay
 * ventana de «llegó y espera» que contar. *Pintar «en espera» sobre citas
 * `confirmada` diría que alguien está sentado en la sala cuando lo único
 * cierto es que tiene turno.*
 * ⇒ Se implementan los DOS literales que sí tienen dato, verbatim.
 */
const KEY_CITAS_DEL_DIA = {
  veterinaria: obtenerCitasVetDelDia,
  grooming: obtenerCitasGroomingDelDia,
  paseo: obtenerCitasPaseoDelDia,
  adiestramiento: obtenerCitasAdiestramientoDelDia,
} as const;

/** El orden es el de la tabla y no importa: se usa para recorrer, no para
 *  pintar. Sale de las CLAVES para que el oficio nuevo entre solo. */
const OFICIOS_ATENDER = Object.keys(KEY_CITAS_DEL_DIA) as OficioAtender[];

/** ⭐ EL APELLIDO DEL DATO VIVO, por oficio (segunda firma del founder).
 *  POR TABLA y jamás por key armada a mano, por lo mismo que las otras dos
 *  de este archivo: una key interpolada compila siempre y se rompe en
 *  runtime cuando el vocabulario crece. **El oficio nuevo no puede entrar
 *  sin contestar sus tres casos.** El porqué de cada forma —y de las dos
 *  que NO usan la frase literal de la firma— vive en el diccionario, con
 *  sus píxeles medidos al lado. */
const KEY_DATO = {
  veterinaria: {
    cero: 'atender.datoVeterinariaCero',
    uno: 'atender.datoVeterinariaUno',
    n: 'atender.datoVeterinariaN',
  },
  grooming: {
    cero: 'atender.datoGroomingCero',
    uno: 'atender.datoGroomingUno',
    n: 'atender.datoGroomingN',
  },
  paseo: {
    cero: 'atender.datoPaseoCero',
    uno: 'atender.datoPaseoUno',
    n: 'atender.datoPaseoN',
  },
  adiestramiento: {
    cero: 'atender.datoAdiestramientoCero',
    uno: 'atender.datoAdiestramientoUno',
    n: 'atender.datoAdiestramientoN',
  },
} as const;

type Pantalla =
  | { fase: 'cargando' }
  // El error DICE su causa y ofrece reintentar (Ley 13 / regla 36): un
  // fallo de lectura jamás se disfraza de «este negocio no atiende».
  | { fase: 'error'; detalle: string }
  | {
      fase: 'listo';
      capacidad: CapacidadAtender;
      /** Citas del día POR OFICIO. La clave falta cuando ese lector no
       *  respondió — y entonces la baldosa CALLA en vez de decir «sin
       *  agenda hoy», que sería afirmar un cero que nadie contó. */
      citasPorOficio: Partial<Record<OficioAtender, number>>;
      pizarra: number | null;
      /** ⭐ S98-C · EL ECO DE LA PUERTA (§3.1bis, firma del founder).
       *  Las solicitudes de mostrador que todavía esperan respuesta.
       *  `null` = **no se pudo leer**, y se dice: un handshake sin
       *  respuesta que desaparece en silencio es peor que uno que avisa
       *  que no pudo consultarse (D-541 / Ley 13). */
      puerta: SolicitudMostrador[] | null;
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
  /** ⭐ S98-C · la pizarra se CONSULTA sobre esta portada, no se navega. */
  const [pizarraAbierta, setPizarraAbierta] = useState(false);

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
        const hoy = hoyLocalISO();
        /* 🔴 LOS CUATRO LECTORES DEL DÍA VIAJAN EN **ESTA** OLA, no en una
           siguiente — y el costo está elegido, no heredado.

           Para saber CUÁLES hacen falta habría que esperar la capacidad
           primero, y eso es una ESPERA ENCADENADA: ~150 ms más para todos
           (D-738 · L-223 — el peaje es la petición, y lo que se paga en
           reloj es la CADENA, no la cantidad). Pedirlos a los cuatro en
           paralelo cuesta el mismo reloj que pedir uno.
           ⚠️ El precio declarado: un negocio de un solo oficio gasta tres
           lecturas que no va a usar. **Es carga de servidor, no espera de
           la persona** — y en una portada que se abre con alguien parado
           enfrente, el reloj gana. */
        /* Los cuatro van ANIDADOS y no aplanados con spread: sigue siendo
           UNA sola ola —las cinco promesas se disparan juntas— y así el
           arreglo conserva su tipo. Aplanado, TS pierde la tupla y `dias[i]`
           degrada a `{}`: el typecheck lo cazó de una. */
        const [c, pz, sol, pl, dias] = await Promise.all([
          resolverCapacidadAtender(p.data.id),
          obtenerPizarra(p.data.id),
          /* ⭐ S98-C · EL ECO DE LA PUERTA. Su lector vivía en el HOY y se
             mudó con él: cada pantalla lee lo suyo y dice su propio fallo,
             en vez de que un lector alimente a dos y una sola sepa hablar
             cuando falla. `cuenta_comercial_id` puede ser null (negocio sin
             cuenta): eso NO es un fallo — es que no hay puerta que oír. */
          p.data.cuenta_comercial_id !== null
            ? obtenerSolicitudesMostrador(p.data.cuenta_comercial_id)
            : Promise.resolve({ ok: true as const, data: [] as SolicitudMostrador[] }),
          // §4ter: el gate vive en el SERVIDOR. Acá no se recompone ningún
          // permiso — se pinta lo que la RPC contesta.
          obtenerPlataDelDia(p.data.id, hoy),
          Promise.all(
            OFICIOS_ATENDER.map((o) =>
              KEY_CITAS_DEL_DIA[o]({ prestador_id: p.data.id, fecha: hoy }),
            ),
          ),
        ]);
        const citasPorOficio: Partial<Record<OficioAtender, number>> = {};
        OFICIOS_ATENDER.forEach((o, i) => {
          const r = dias[i];
          // Solo se anota lo que se LEYÓ. Un lector caído deja la clave
          // ausente, y la baldosa calla (Ley 13 / L-197).
          if (r !== undefined && r.ok) citasPorOficio[o] = r.data.length;
        });
        return c.ok
          ? {
              fase: 'listo' as const,
              capacidad: c.data,
              citasPorOficio,
              pizarra: pz.ok ? pz.data.length : null,
              /* Solo lo que TODAVÍA espera: pendiente, o expirada que
                 nadie respondió. Una solicitud ya respondida no necesita
                 atención y contarla infla el eco (la misma regla que el
                 HOY tenía escrita, y se muda con ella). */
              puerta: sol.ok
                ? sol.data.filter(
                    (x) =>
                      x.estado === 'pendiente' ||
                      (x.estado === 'expirada' && x.respondidaEn === null),
                  )
                : null,
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

  const { capacidad, citasPorOficio, pizarra, plata, puerta } = pantalla;

  /** El dato vivo de la baldosa **con su apellido**, o `undefined` para
   *  que CALLE. La voz de cada oficio sale de su fila de `KEY_DATO` — el
   *  porqué de que dos no usen la forma literal de la firma vive en el
   *  diccionario, con los píxeles medidos. */
  const datoDelDia = (o: OficioAtender): string | undefined => {
    const n = citasPorOficio[o];
    if (n === undefined) return undefined;
    const k = KEY_DATO[o];
    return n === 0 ? t(k.cero) : n === 1 ? t(k.uno) : t(k.n, { n });
  };

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

            ✅ **S98-C · LOS DOS NÚMEROS PEDIDOS YA ENTRARON.** Esta banda
            nació con DOS y no con cuatro, y el porqué queda escrito porque
            es la parte que enseña: *no había lector honesto de ninguno de
            los dos*. `cobro_presencial_registrado` tenía escritor y **cero
            lectores**, y lo que sí existía contaba citas VIVAS —lo
            AGENDADO— mientras el rótulo pedido decía «prestados». Rotular
            «cobrado» aquel número habría sido un **verosímil-falso de
            plata**: la clase de defecto más cara de la casa, porque nadie
            audita un número que le parece razonable.

            **A los construyó (D-808) y acá se consumen tal cual**, con su
            eje declarado: `prestadas` son las citas COMPLETADAS del día
            (el hecho) y `cobrado` es el cobro presencial de las citas de
            hoy — **el mismo eje que `total`, a propósito**, para que los
            dos números de plata cierren entre sí. *Un tablero que no
            cierra consigo mismo no se audita: se desconfía entero.*

            **Y la cláusula del founder es LEY, no adorno:** *«si está en 0
            se muestra en 0»*. El cero de un rol que SÍ ve es un dato y se
            dice; lo que jamás se pinta como cero es el `null`, que
            significa «este rol no ve» o «no se pudo leer». */}
        {plata !== null && plata.visible && (
          <Tarjeta relleno="normal">
            {/* 2×2: arriba lo que PASÓ, abajo lo que VALE. Cada celda a
                media caja para que las cuatro etiquetas quepan enteras —
                en una sola fila, cuatro columnas truncan los rótulos. */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing[3] }}>
              <View style={{ width: '50%' }}>
                <FilaDato etiqueta={t('atender.bandaCitas')} valor={String(plata.citas ?? 0)} mono />
              </View>
              <View style={{ width: '50%' }}>
                <FilaDato
                  etiqueta={t('atender.bandaPrestados')}
                  valor={String(plata.prestadas ?? 0)}
                  mono
                />
              </View>
              <View style={{ width: '50%' }}>
                <FilaDato etiqueta={t('atender.bandaAgendado')} valor={montoCorto(plata.total ?? 0)} mono />
              </View>
              <View style={{ width: '50%' }}>
                <FilaDato
                  etiqueta={t('atender.bandaCobrado')}
                  valor={montoCorto(plata.cobrado ?? 0)}
                  mono
                />
              </View>
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
                <View style={ESTILO_GRILLA}>
                  {capacidad.oficios.map((o, i) => (
                    <View key={o.oficio} style={ESTILO_CELDA}>
                      <Baldosa
                        glifo={GLIFO_OFICIO[o.oficio]}
                        titulo={t(KEY_OFICIO[o.oficio])}
                        detalle={datoDelDia(o.oficio)}
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
                  onPress={() => setPizarraAbierta(true)}
                />
              </Tarjeta>
            )}

            {/* ── ⭐ S98-C · EL ECO DE LA PUERTA (§3.1bis) ─────────────────
                Firma del founder, literal: *«los mensajes de la puerta —que
                la familia de XXXX no respondió— no deberían estar en HOY:
                deberían estar en ATENDER»*.

                **VA ACÁ, debajo de la pizarra, y la composición tiene su
                razón:** las dos son trabajo pendiente del EQUIPO —una cita
                que nadie tomó, una familia que no contestó— mientras que
                las baldosas de arriba son el acto primario, por dónde entra
                quien está parado enfrente. *Poner el eco antes habría
                empujado hacia abajo lo único que alguien necesita tocar con
                una persona esperando.*

                **NO va adentro de la pizarra-Hoja**, aunque comparta forma:
                la pizarra es *trabajo que alguien TOMA* y esto es
                *correspondencia que espera respuesta ajena* — meterlas
                juntas obligaría a un solo verbo para dos cosas que se hacen
                distinto. Y no es fila-con-Hoja porque su contenido ya es
                corto: una Hoja para dos líneas es una puerta de más.

                Se monta SOLO si hay algo — el caso normal es que no haya, y
                una sección vacía en la portada del mostrador es ruido. */}
            {puerta !== null && puerta.length > 0 && (
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">{t('recepcion.puerta')}</Texto>
                {puerta.map((s) => (
                  <Tarjeta key={s.solicitudId} tinte="warning" relleno="amplio">
                    <View style={{ gap: spacing[1] }}>
                      <Texto variante="seccion">
                        {s.estado === 'expirada'
                          ? t('recepcion.solicitudExpirada', {
                              mascota: s.mascotaNombre ?? t('agenda.mascotaFallback'),
                            })
                          : t('recepcion.solicitudPendiente', {
                              mascota: s.mascotaNombre ?? t('agenda.mascotaFallback'),
                            })}
                      </Texto>
                      {s.estado === 'pendiente' ? (
                        // el reloj lo dijo el SERVER (§7bis); acá solo se viste
                        <Texto variante="dato">
                          {t('recepcion.solicitudReloj', {
                            min: Math.max(1, Math.ceil(s.segundosRestantes / 60)),
                          })}
                        </Texto>
                      ) : (
                        <Texto variante="cuerpo">{t('recepcion.solicitudExpiradaCuerpo')}</Texto>
                      )}
                    </View>
                  </Tarjeta>
                ))}
              </View>
            )}
            {/* El fallo DICE que es fallo: un handshake sin respuesta que
                desaparece en silencio es peor que uno que avisa que no se
                pudo consultar (D-541). */}
            {puerta === null && (
              <Texto variante="apoyo" color="danger">{t('recepcion.puertaError')}</Texto>
            )}

            {capacidad.tienda && (
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('atender.tuTienda')}</Texto>
                <View style={ESTILO_GRILLA}>
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

      {/* ⭐ S98-C · LA PIZARRA SUBE SOBRE LA PORTADA (firma (a)). Se monta
          FUERA del ScrollView: una Hoja no es contenido de la pantalla —
          se levanta sobre ella y la deja debajo, a la vista. */}
      <PizarraHoja
        visible={pizarraAbierta}
        onCerrar={() => {
          setPizarraAbierta(false);
          // Al cerrar se recarga la portada: la pizarra pudo cambiar el
          // conteo (alguien tomó o asignó una cita ahí adentro).
          setIntento((n) => n + 1);
        }}
      />
    </View>
  );
}
