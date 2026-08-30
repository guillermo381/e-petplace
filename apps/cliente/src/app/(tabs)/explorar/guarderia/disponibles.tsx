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
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaFranja,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerGuarderiasDisponibles,
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
import { esModalidad, type ModalidadGuarderia } from '@/lib/guarderia-modalidad';

type Lista =
  | { fase: 'cargando' }
  /** Ley 13: se cayó algo. *No es que no haya: no pudimos preguntar.* */
  | { fase: 'noPudimos' }
  /** 🔴 El motor DIAGNOSTICÓ, y su voz ya dice el hecho (A tipó 17 códigos). */
  | { fase: 'causaDelMotor'; mensaje: string }
  | { fase: 'listo'; lugares: GuarderiaDisponible[] };

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

  const [lista, setLista] = useState<Lista>({ fase: 'cargando' });
  /* El enriquecimiento público: portada, logo, reseñas, cohorte. **La fila no
     lo espera** — llega y la tarjeta se completa (criterio de la pieza). */
  const [perfiles, setPerfiles] = useState<Record<string, PerfilPublico>>({});

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

  const precioDe = (g: GuarderiaDisponible): number | null =>
    g.precioModalidad ??
    (modalidad === 'dia' ? g.precio : modalidad === 'paquete' ? null : g.precioMensual);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <CabezalOficio
        oficio="guarderia"
        capa="cuidado"
        titulo={t('hubGuarderia.lugaresTitulo')}
        detalle={params.mascotaNombre ?? null}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[3], paddingBottom: insets.bottom + spacing[8] }}>
        {/* ⏪ ACÁ ABAJO COLGABA LA FECHA EN CRUDO —`2026-09-01`— al pie de la
            lista. Dos cosas mal: **voz de máquina** donde va la de la casa, y
            **el contexto al final**, cuando es lo que enmarca todo lo de
            arriba. Las cuatro hermanas lo resuelven igual: **una `Celda` de
            contexto POR ENCIMA de la lista** (censo del 29-ago). */}
        {fecha !== null ? (
          <Celda
            titulo={params.mascotaNombre ?? t('hubGuarderia.titulo')}
            metadataMono={fechaCortaMono(fecha, idioma)}
          />
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
        ) : lista.fase === 'noPudimos' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('hubGuarderia.listaNoCargoTitulo')}
            descripcion={t('hubGuarderia.listaNoCargoDetalle')}
          />
        ) : lista.lugares.length === 0 ? (
          /* 🔴 NO DEBERÍA VERSE NUNCA: la pantalla anterior no habilita el
             botón sin lugares (Ley 23 — la puerta no ofrece lo que va a
             rechazar). Existe porque **el cupo puede cambiar entre las dos
             pantallas**, y ahí la verdad es de acá. */
          <EstadoVacio
            registro="seccion"
            titulo={t('hubGuarderia.sinLugaresTitulo')}
            descripcion={t('hubGuarderia.sinLugaresDetalle')}
          />
        ) : (
          lista.lugares.map((g) => {
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
                /* 🔴 MISMO DEFECTO, SEGUNDA SUPERFICIE: para paquete,
                   `precioModalidad` sale de `min(gp.precio)` — **el paquete más
                   barato del lugar, no el tamaño elegido**. *Un «$40» bajo una
                   selección de 15 es un precio equivocado en la pantalla donde
                   se elige a quién pagarle.* No se pinta hasta que el server
                   reciba el tamaño. */
                precio={
                  modalidad === 'paquete' || precio === null
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
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
