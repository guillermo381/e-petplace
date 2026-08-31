/**
 * GUARDERÍA · **QUIÉN PUEDE** — la lista de lugares, ya filtrada (S107-C).
 *
 * ⏪ **ESTA PANTALLA ADELGAZÓ, y ése era el defecto.** Antes traía el selector
 * de mascota, el de día **y** la lista — o sea **mostraba los lugares antes de
 * que la familia hubiera elegido nada**. *Una lista que aparece antes de la
 * pregunta obliga a leerla dos veces: una para entender qué es, otra cuando ya
 * significa algo.* Ahora llega con **todo decidido** y sólo responde
 * **quién puede**.
 *
 * 🔴 **NO VUELVE A PREGUNTAR NADA.** Mascota, modalidad, día y tamaño **viajan
 * por parámetro**. *Volver a ofrecerlos acá los haría re-editables en una
 * pantalla donde ya están decididos* (Ley 23).
 *
 * ── ⭐ LA VITRINA: LA MISMA PIEZA QUE SUS CUATRO HERMANAS ────────────────
 * **`PreviewPrestador`** — censado el 29-ago: *las cuatro montan exactamente
 * ésta en este paso.* Portada · logo · nombre · **línea de confianza honesta**
 * (reseñas > citas > nada, jamás estrellas vacías) · cohorte · precio.
 * 🔴 **No se inventó una vitrina nueva: el paso es el mismo y la respuesta ya
 * estaba escrita.** *Antes acá había una `Celda` — un renglón de texto donde
 * las hermanas presentan a alguien.*
 *
 * **Y lo propio del oficio va en su `pie`**, un slot que se agregó para esto:
 * el **cupo de ese día** y **las dos ventanas** de recogida y devolución —
 * *lo que una familia mira para saber si le sirve, y que ningún otro oficio
 * tiene*. Las ventanas las pinta **`FichaFranja`**, que existe justo para
 * informar (no para elegir) y que el perfil del lugar ya monta.
 *
 * ✅ **LAS VENTANAS VIAJAN EN LA PROYECCIÓN** (A, 29-ago): el N+1 se cerró
 * antes de doler. **Los cuatro campos son independientes** —un lugar puede
 * tener la recogida y no la devolución— y cada ventana se dibuja sólo si sus
 * DOS extremos llegaron.
 *
 * 🔴 **PERO EL SERVER LAS COLAPSA CON `min`/`max` SIN MIRAR EL DÍA DE SEMANA, y
 * eso es un verosímil-falso esperando su primer lugar.** El índice es
 * `UNIQUE (prestador_id, tipo, dias_semana)`: **dos ventanas del mismo tipo no
 * son un borde, son el diseño** —*L-V de 7 a 9, sábados de 9 a 11*—. Colapsadas
 * dan **7 a 11**, un rango que ese lugar **no ofrece ningún día**.
 * *Hoy no se nota porque Aurora tiene una de cada tipo.* **Pedido a A** en
 * `S107-C-PEDIDO-A-A-VENTANA-DEL-DIA.md`.
 *
 * ── EL PRECIO, SIN UNA SOLA CUENTA ───────────────────────────────────────
 * Cada lugar muestra **el número del server para la modalidad pedida**. Si no
 * tiene precio para ella, **se muestra sin número** — *no se lo filtra (filtrar
 * es del server) ni se le inventa uno.*
 */

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaFranja,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerGuarderiasDisponibles,
  obtenerPaquetesGuarderia,
  obtenerPerfilesPublicos,
  type GuarderiaDisponible,
  type PerfilPublico,
} from '@epetplace/api';

import { fechaCortaMono, obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { CabezalOficio } from '@/components/reserva-piezas';
import { PreviewPrestador } from '@/components/preview-prestador';

/** 'HH:MM:SS' → 'HH:MM'. El motor manda la verdad; la pantalla la recorta. */
const aHoraCorta = (h: string) => h.slice(0, 5);
import {
  esModalidad,
  TAMANOS_PAQUETE,
  type ModalidadGuarderia,
  type TamanoPaqueteGuarderia,
} from '@/lib/guarderia-modalidad';

type Lista =
  | { fase: 'cargando' }
  /** Ley 13: se cayó algo. *No es que no haya: no pudimos preguntar.* */
  | { fase: 'noPudimos' }
  /** 🔴 El motor DIAGNOSTICÓ, y su voz ya dice el hecho (A tipó 17 códigos). */
  | { fase: 'causaDelMotor'; mensaje: string }
  | { fase: 'listo'; lugares: GuarderiaDisponible[] };

/**
 * 🔴 **EL PRECIO DEL PAQUETE ELEGIDO, POR LUGAR (S108-C · T1).**
 *
 * ── QUÉ ESTABA MAL, medido en el SQL ────────────────────────────────────
 * `precioModalidad` para paquete es `(SELECT min(gp.precio) …)` — **el paquete
 * más barato del lugar, sobre TODOS los tamaños**
 * (`20260830060000_s107a_franjas_en_el_filtro.sql`). El tamaño **ya está
 * elegido** cuando se llega acá —el hub no habilita el botón sin él— así que
 * ese mínimo es *el precio de un producto que la familia no eligió*.
 *
 * ⚠️ **Y era la tercera puerta del mismo defecto**, cuyo literal ya vive en el
 * hub: *«La familia veía $40 y pagaba $75. En la superficie donde se decide
 * pagar.»* Se había curado en los chips y **acá se resolvió no pintando nada**,
 * que tapó el síntoma y dejó la lista sin precio.
 *
 * ── LA CURA: se pregunta por lugar, con el tamaño en la mano ─────────────
 * `obtenerPaquetesGuarderia` ya existe y **el hub ya lo llama así** — es el N+1
 * que esa pantalla declara barato con los lugares de hoy. Con la respuesta hay
 * **el precio exacto**, y además se sabe **quién NO vende ese tamaño**.
 *
 * 🔴 Un fallo de lectura NO se degrada a «sin precio» (Ley 13): sin precio, el
 * lugar se cae de la lista por Ley 23, y **un bache de red escondería una
 * guardería que sí vende.** Por eso el fallo es su propia fase.
 */
type PreciosPaquete =
  | { fase: 'noAplica' }
  | { fase: 'cargando' }
  | { fase: 'noPudimos' }
  /** Sólo los lugares que venden ESE tamaño. Ausente = no lo vende. */
  | { fase: 'listo'; porLugar: Record<string, number> };

export default function QuienPuedeGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const idioma = obtenerIdiomaActual();
  const params = useLocalSearchParams<{
    mascotaId?: string;
    mascotaNombre?: string;
    modalidad?: string;
    fecha?: string;
    tamano?: string;
  }>();

  const modalidad: ModalidadGuarderia = esModalidad(params.modalidad) ? params.modalidad : 'dia';
  const mascotaId = typeof params.mascotaId === 'string' && params.mascotaId.length > 0 ? params.mascotaId : null;
  const fecha = typeof params.fecha === 'string' && params.fecha.length > 0 ? params.fecha : null;
  /**
   * ⭐ **EL TAMAÑO ELEGIDO, Y ACÁ EMPIEZA LA CURA (S108-C · T1).**
   *
   * Se valida contra `TAMANOS_PAQUETE` en vez de confiar en el `Number()`:
   * *un `tamano=7` que entrara por un deep link no existe como paquete, y
   * dejarlo pasar produciría una lista sin ningún precio y un rebote recién en
   * la compra.*
   */
  const tamano: TamanoPaqueteGuarderia | null = (() => {
    if (modalidad !== 'paquete') return null;
    const n = Number(params.tamano);
    return TAMANOS_PAQUETE.find((x) => x === n) ?? null;
  })();

  const [lista, setLista] = useState<Lista>({ fase: 'cargando' });
  /* El enriquecimiento público: portada, logo, reseñas, cohorte. **La fila no
     lo espera** — llega y la tarjeta se completa (criterio de la pieza). */
  const [perfiles, setPerfiles] = useState<Record<string, PerfilPublico>>({});
  const [precios, setPrecios] = useState<PreciosPaquete>({ fase: 'noAplica' });

  useEffect(() => {
    if (mascotaId === null || fecha === null) { setLista({ fase: 'noPudimos' }); return; }
    let vigente = true;
    setLista({ fase: 'cargando' });
    void (async () => {
      /* ✏️ CORRECCIÓN DE A (S107, `d483cf8c`) — **la modalidad VIAJA al
         server**. Escribí esta llamada cuando el filtro todavía no la aceptaba;
         mandarla no es cosmético: *es lo que hace que la lista sean los lugares
         que ofrecen ESA modalidad*, y lo que trae `precioModalidad` resuelto. */
      const r = await obtenerGuarderiasDisponibles({ fecha, mascotaId, modalidad });
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «no hay lugares» (Ley 13). */
      if (r.ok) { setLista({ fase: 'listo', lugares: r.data }); return; }
      /* Un fallo JAMÁS se disfraza de «no hay lugares» (Ley 13) — **y un
         diagnóstico del motor jamás se disfraza de fallo.** */
      setLista(
        r.codigo === 'mascota_no_elegible' || r.codigo === 'no_access_to_mascota'
          ? { fase: 'causaDelMotor', mensaje: r.mensaje }
          : { fase: 'noPudimos' },
      );
    })();
    return () => { vigente = false; };
  }, [mascotaId, fecha]);

  /* ✏️ CRUCE DE A, y su hallazgo corrige el mío: **mi criterio era correcto y
     la fuente estaba equivocada.** Leer el campo de SU modalidad evitaba el peor
     caso —mostrar el precio del día bajo el rótulo de paquete—, pero medido el
     29-ago, `precioPaquete` sale de `prestador_servicios.precio_paquete`, que
     está **NULL**, mientras el motor resuelve desde la tabla `guarderia_paquetes`
     (5d/$40). ⇒ **habría dicho «sin precio» sobre algo que sí se vende, y sin
     un solo error.** Manda `precioModalidad`, que el server ya resolvió.
     🔴 Y el respaldo **nunca cae a `precio`** cuando la modalidad no es día:
     *la ausencia es preferible al precio de otra cosa.* */
  useEffect(() => {
    if (lista.fase !== 'listo' || lista.lugares.length === 0) return;
    const ids = [...new Set(lista.lugares.map((g) => g.prestadorId))];
    let vigente = true;
    void obtenerPerfilesPublicos(ids).then((r) => {
      if (!vigente || !r.ok) return;
      setPerfiles(Object.fromEntries(r.data.map((x) => [x.id, x])));
    });
    /* ☠️ ACÁ VIVÍA UNA LLAMADA POR LUGAR a `obtenerFranjasGuarderia`. **A
       cerró el N+1 el 29-ago**: las dos ventanas viajan en la proyección de la
       lista. *El pedido se hizo antes de que doliera, y por eso se pudo pagar
       sin apuro.* */
    return () => { vigente = false; };
  }, [lista]);

  /* ⭐ EL PRECIO DEL TAMAÑO ELEGIDO — una llamada por lugar, en paralelo.
     Mismo patrón y mismo N+1 declarado que el hub. */
  useEffect(() => {
    if (modalidad !== 'paquete' || tamano === null) { setPrecios({ fase: 'noAplica' }); return; }
    if (lista.fase !== 'listo') { setPrecios({ fase: 'cargando' }); return; }
    const ids = [...new Set(lista.lugares.map((g) => g.prestadorId))];
    if (ids.length === 0) { setPrecios({ fase: 'listo', porLugar: {} }); return; }
    let vigente = true;
    setPrecios({ fase: 'cargando' });
    void (async () => {
      const rs = await Promise.all(ids.map(async (id) => [id, await obtenerPaquetesGuarderia(id)] as const));
      if (!vigente) return;
      /* 🔴 UN SOLO FALLO TIÑE LA PASADA. *Con un lugar sin leer no se puede
         distinguir «no vende ese tamaño» de «no pude preguntar», y la
         diferencia decide si la guardería aparece o desaparece.* */
      if (rs.some(([, r]) => !r.ok)) { setPrecios({ fase: 'noPudimos' }); return; }
      const porLugar: Record<string, number> = {};
      for (const [id, r] of rs) {
        if (!r.ok) continue;
        const pq = r.data.find((p) => p.tamano === tamano && p.activo);
        if (pq !== undefined) porLugar[id] = pq.precio;
      }
      setPrecios({ fase: 'listo', porLugar });
    })();
    return () => { vigente = false; };
  }, [modalidad, tamano, lista]);

  /**
   * 🔴 **PARA PAQUETE YA NO SALE DEL RESUMEN.** `precioModalidad` es el mínimo
   * sobre todos los tamaños; acá manda el precio del tamaño elegido, leído del
   * lugar. Las otras dos modalidades no se tocan: `precioModalidad` es exacto
   * para día (`ps.precio`) y para mensual (`ps.precio_mensual_plan`).
   */
  const precioDe = (g: GuarderiaDisponible): number | null =>
    modalidad === 'paquete'
      ? (precios.fase === 'listo' ? precios.porLugar[g.prestadorId] ?? null : null)
      : g.precioModalidad ?? (modalidad === 'dia' ? g.precio : g.precioMensual);

  /**
   * ⭐ **LEY 23 — LA PUERTA NO OFRECE LO QUE VA A RECHAZAR.**
   * `obtener_guarderias_disponibles` filtra por *«el lugar vende ALGÚN
   * paquete»*: **nunca recibe el tamaño**. Y `comprar_paquete_guarderia`
   * rebota `paquete_no_disponible` si ese lugar no vende ESE tamaño. *Entre las
   * dos, la lista podía ofrecer una guardería que iba a rechazar la compra —
   * seis pasos después, con la tarjeta ya elegida.*
   *
   * ⚠️ Se filtra **sólo con los precios resueltos**: mientras cargan no se
   * esconde a nadie, porque una lista vacía se leería como «no hay» y es
   * «todavía no sé» — la misma trampa que el hub declara en sus chips.
   */
  const lugaresVisibles =
    lista.fase !== 'listo'
      ? []
      : modalidad !== 'paquete' || precios.fase !== 'listo'
        ? lista.lugares
        : lista.lugares.filter((g) => precios.porLugar[g.prestadorId] !== undefined);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* ⏪ **ERA `CabezalOficio` Y REPETÍA LA MASCOTA.** El nombre salía bajo
          el título **y otra vez** en la línea de contexto — *un dato dicho dos
          veces en la misma pantalla le enseña a la familia a no leer.*
          Censado contra «Groomers disponibles», su hermana: `Encabezado` de
          navegación + **una sola línea de contexto**. */}
      <Encabezado
        variante="navegacion"
        titulo={t('hubGuarderia.lugaresTitulo')}
        atras
        onAtras={() => router.back()}
      />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[3], paddingBottom: insets.bottom + spacing[8] }}>
        {/* ⏪ ACÁ ABAJO COLGABA LA FECHA EN CRUDO —`2026-09-01`— al pie de la
            lista. Dos cosas mal: **voz de máquina** donde va la de la casa, y
            **el contexto al final**, cuando es lo que enmarca todo lo de
            arriba. Las cuatro hermanas lo resuelven igual: **una `Celda` de
            contexto POR ENCIMA de la lista** (censo del 29-ago). */}
        {/* ⏪ La fecha colgaba SUELTA A LA DERECHA de la mascota. La hermana
            las junta en UNA línea —«Grooming para Thor · 2026-08-30 · 18:00»—
            porque **es un solo contexto, no dos datos**. */}
        {fecha !== null ? (
          <>
            <Celda
              titulo={
                params.mascotaNombre === undefined
                  ? t('hubGuarderia.titulo')
                  : t('hubGuarderia.contextoPara', { nombre: params.mascotaNombre })
              }
              metadataMono={fechaCortaMono(fecha, idioma)}
            />
            <Separador />
          </>
        ) : null}

        {lista.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={64} />
            <Esqueleto alto={64} />
          </EsqueletoGrupo>
        ) : lista.fase === 'causaDelMotor' ? (
          /* Sin título de fallo: **no falló nada.** El motor contestó y su
             respuesta es el contenido de la pantalla. */
          <EstadoVacio registro="seccion" titulo={lista.mensaje} />
        ) : lista.fase === 'noPudimos' || precios.fase === 'noPudimos' ? (
          /* 🔴 El fallo de los precios entra POR ACÁ y no por «no hay lugares»:
             *no es que ninguna guardería venda ese paquete — es que no pudimos
             preguntar.* (Ley 13.) */
          <EstadoVacio
            registro="seccion"
            titulo={t('hubGuarderia.listaNoCargoTitulo')}
            descripcion={t('hubGuarderia.listaNoCargoDetalle')}
          />
        ) : precios.fase === 'cargando' ? (
          /* La lista llegó y los precios del tamaño todavía no. **No se pinta
             la lista sin ellos**: aparecería y se acortaría sola cuando el
             filtro de Ley 23 corriera. */
          <EsqueletoGrupo>
            <Esqueleto alto={64} />
            <Esqueleto alto={64} />
          </EsqueletoGrupo>
        ) : lugaresVisibles.length === 0 ? (
          /* 🔴 NO DEBERÍA VERSE NUNCA por cupo: la pantalla anterior no habilita
             el botón sin lugares (Ley 23). Existe porque **el cupo puede cambiar
             entre las dos pantallas**, y ahí la verdad es de acá.
             ⭐ **Y desde S108-C tiene una segunda causa, que se dice aparte:**
             hay lugares con cupo, pero **ninguno vende ese tamaño de paquete**.
             *Decir «ninguna tiene cupo» mandaría a la familia a probar otro día
             para siempre, y el día no es el problema.* */
          modalidad === 'paquete' && tamano !== null && lista.lugares.length > 0 ? (
            <EstadoVacio
              registro="seccion"
              titulo={t('hubGuarderia.sinLugaresTamanoTitulo', { n: tamano })}
              descripcion={t('hubGuarderia.sinLugaresTamanoDetalle')}
            />
          ) : (
            <EstadoVacio
              registro="seccion"
              titulo={t('hubGuarderia.sinLugaresTitulo')}
              descripcion={t('hubGuarderia.sinLugaresDetalle')}
            />
          )
        ) : (
          /* ⏪ **LOS PREVIEWS FLOTABAN SOBRE EL FONDO.** La hermana de
             grooming los mete en UNA sola tarjeta contenedora, y por eso su
             lista se lee como una lista y no como fichas sueltas — *y por eso
             el cupo y las ventanas de guardería quedaban «colgando abajo»:
             no había caja de la que colgar.* Censado el 30-ago. */
          <Tarjeta relleno="ninguno">
          {          lugaresVisibles.map((g) => {
            const precio = precioDe(g);
            /* 🔴 LOS CUATRO CAMPOS SON INDEPENDIENTES — firma de A, y el caso
               es real: **un lugar puede tener la recogida declarada y la
               devolución no.** *Asumir «vienen los cuatro o ninguno» pintaría
               un rango con la mitad inventada.* Cada ventana existe sólo si sus
               DOS extremos llegaron. */
            const rec = g.recogeDesde !== null && g.recogeHasta !== null
              ? { desde: g.recogeDesde, hasta: g.recogeHasta }
              : null;
            const dev = g.devuelveDesde !== null && g.devuelveHasta !== null
              ? { desde: g.devuelveDesde, hasta: g.devuelveHasta }
              : null;
            return (
              <PreviewPrestador
                key={g.prestadorId}
                prestadorId={g.prestadorId}
                /* 🔴 **EL TAP VA AL DETALLE DE GUARDERÍA, NO AL PERFIL GENÉRICO.**
                   *El perfil monta barra de reserva de los CUATRO oficios y
                   ninguna de guardería* ⇒ la familia llegaba a una pantalla sin
                   con qué pagar. **Éste es el defecto que el founder reportó
                   cinco tandas seguidas como «no se puede comprar».**

                   ⚠️ **Y se escribió DOS VECES: la primera se perdió en un
                   merge.** La prop sobrevivió en la pieza y su consumidor no,
                   así que el typecheck siguió verde sobre un camino roto —
                   *una prop opcional que nadie pasa no rompe nada, y por eso
                   nadie se entera.* **Lo cazó recorrer el dedo, no leer.** */
                onAbrir={() =>
                  router.push({
                    pathname: '/explorar/guarderia/[prestadorId]',
                    params: {
                      ...params,
                      prestadorId: g.prestadorId,
                      prestadorNombre: g.prestadorNombre,
                      ...(precio === null ? {} : { precio: `$ ${precio.toFixed(2)}` }),
                    },
                  })
                }
                ofertaId={g.prestadorServicioId}
                nombre={g.prestadorNombre}
                oficio={t('hogar.railGuarderia')}
                contexto={
                  g.direccion !== null
                    ? [g.direccion, g.ciudad].filter(Boolean).join(' · ')
                    : null
                }
                /* 🔴 SIN NÚMERO cuando el lugar no vende esta modalidad — la
                   pieza acepta la cadena vacía y no pinta el separador
                   huérfano. *Un guion o un cero se leerían como «gratis».* */
                /* ⭐ **EL PAQUETE VUELVE A TENER PRECIO, y ahora es el suyo.**
                   ⏪ Acá decía `modalidad === 'paquete' ? ''` — la cura vieja
                   del mínimo, que tapó el número equivocado dejando la lista
                   **sin ningún número** en la pantalla donde se elige a quién
                   pagarle. *Curar un dato equivocado borrándolo deja a la
                   familia eligiendo a ciegas: es el mismo defecto con menos
                   información.* Hoy `precioDe` devuelve el precio del tamaño
                   elegido en ESE lugar, así que el número se puede pintar y
                   **es el que va a pagar.** */
                precio={
                  precio === null
                    ? ''
                    : modalidad === 'dia'
                      ? t('hubGuarderia.porDia', { precio: precio.toFixed(2) })
                      : modalidad === 'mensual'
                        ? t('hubGuarderia.porMes', { precio: precio.toFixed(2) })
                        : t('hubGuarderia.porPaquete', { precio: precio.toFixed(2) })
                }
                perfil={perfiles[g.prestadorId]}
                /* La ventana viaja con el tap para que el lugar pueda reservar,
                   como en los cuatro oficios (D-730). */
                contextoReserva={{
                  mascotaId: mascotaId ?? '',
                  ...(typeof params.mascotaNombre === 'string' ? { mascotaNombre: params.mascotaNombre } : {}),
                  modalidad,
                  fecha: fecha ?? '',
                  ...(typeof params.tamano === 'string' ? { tamano: params.tamano } : {}),
                  prestadorNombre: g.prestadorNombre,
                }}
                pie={
                  <View style={{ gap: spacing[2] }}>
                    {/* EL CUPO DE ESE DÍA. 🔴 `sobrevendido` NO se pinta: para
                        la familia, un lugar que puede recibirla puede
                        recibirla. La sobreventa es operativa del prestador. */}
                    <Texto variante="apoyo">
                      {g.disponible === 1
                        ? t('hubGuarderia.cupoUno')
                        : t('hubGuarderia.cupo', { n: g.disponible })}
                    </Texto>
                    {/* LAS DOS VENTANAS. `FichaFranja` informa —no elige— y su
                        `devolucion` es opcional porque **un lugar puede tener
                        sólo la recogida declarada**: ahí no se dibuja un rango
                        vacío que se lea como dato. */}
                    {rec !== null ? (
                      <FichaFranja
                        recogida={{
                          rotulo: t('lugarGuarderia.recogida'),
                          desde: aHoraCorta(rec.desde),
                          hasta: aHoraCorta(rec.hasta),
                        }}
                        devolucion={
                          dev === null
                            ? undefined
                            : {
                                rotulo: t('lugarGuarderia.devolucion'),
                                desde: aHoraCorta(dev.desde),
                                hasta: aHoraCorta(dev.hasta),
                              }
                        }
                      />
                    ) : null}
                  </View>
                }
              />
            );
          })}
          </Tarjeta>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
