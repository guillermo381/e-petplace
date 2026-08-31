/**
 * PAGOS RECURRENTES Y SUSCRIPCIONES — S108-C · T5.
 *
 * ═══ 🔴 POR QUÉ EXISTE ESTA PANTALLA ══════════════════════════════════════
 *
 * **La cancelación de la mensualidad de guardería era motor sin puerta.** La
 * RPC estaba creada y grantada a `authenticated` desde S107, y **no había
 * wrapper ni pantalla** — mientras el diccionario ya prometía, publicado,
 * *«…hasta que lo canceles desde Cuenta»*. **En Cuenta no había nada de eso:**
 * la app mandaba a la familia a un lugar donde no estaba lo que prometía.
 *
 * ⇒ La cancelación vive **en UN SOLO LUGAR**, y es éste. *Un interruptor de
 * plata repartido por las pantallas donde cada cosa se contrató es un
 * interruptor que la familia no encuentra el día que lo necesita.*
 *
 * ═══ LA LEY DEL INTERRUPTOR, que sale del motor y no de una preferencia ═══
 *
 * `cancelar_mensualidad_guarderia` lo dice en su cuerpo: *«las estadías del
 * período pagado NO SE TOCAN (`P24`): corre hasta el fin del período pagado,
 * sin reintegro. **Lo que muere es la SERIE.**»* Y el plan de paseos hace lo
 * mismo por otra vía: apagar `auto_renovar` no cancela nada, deja de renovar.
 *
 * 🔴 **El interruptor detiene la RENOVACIÓN, jamás el servicio ya pagado** — y
 * por eso, apagado, la fila dice **hasta qué día sigue cubierto**. *Una
 * pantalla que insinúa que se detuvo hoy hace que la familia deje de llevar al
 * animal a días que ya pagó.*
 *
 * ═══ ⚠️ LOS DOS QUE SE PUEDEN Y EL TERCERO QUE NO ════════════════════════
 *
 * El censo halló **TRES sujetos recurrentes vivos** y sólo dos tienen lector:
 * las compras que se repiten de la despensa **no tienen ninguno en
 * `packages/api`** (medido: cero consumidores de `pedidos_recurrencias` fuera
 * del alta). **Se declara en la pantalla en vez de omitirse**: *una sección que
 * promete «todo lo que te cobra solo» y muestra dos de tres miente por omisión,
 * y su modo de falla es el peor — se lee como completa.*
 *
 * ═══ Y LA ASIMETRÍA QUE NO SE DISIMULA ═══════════════════════════════════
 *
 * El paseo **se puede volver a encender** (`auto_renovar` es un booleano que va
 * y viene). La guardería **NO**: medido contra `supabase/migrations`, no existe
 * ninguna función que devuelva una suscripción a `activa`. *Ofrecer el mismo
 * gesto en las dos y que una no vuelva sería enseñarle a la familia que puede
 * deshacer algo que no puede.* El modal lo dice ANTES, cada uno con su frase.
 *
 * **Construida para sostener más de un tipo:** las filas salen de `Item`, un
 * modelo normalizado — el padrinazgo aterriza acá agregando un lector y un caso
 * en `apagar`, sin tocar el render.
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Interruptor,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  cancelarMensualidadGuarderia,
  reactivarMensualidadGuarderia,
  configurarRenovacionPlan,
  obtenerMisPlanesGuarderia,
  obtenerMisPlanesPaseo,
  obtenerPerfilesPublicos,
} from '@epetplace/api';
import { fechaLargaHumana, obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { hoyLocal } from '@/lib/corte-agenda';

/**
 * El modelo NORMALIZADO. Cada sujeto recurrente se traduce a esto y el render
 * no sabe de dónde vino — que es lo que permite que el próximo entre sin tocar
 * una línea de pantalla.
 */
interface Item {
  clave: string;
  tipo: 'guarderia' | 'paseo';
  id: string;
  titulo: string;
  /** Dónde — `null` si no se pudo resolver el nombre; no se inventa. */
  donde: string | null;
  precio: number;
  /** Fin del período pagado. `null` legal: todavía no hubo cobro. */
  cubiertoHasta: string | null;
  encendido: boolean;
  /**
   * ¿Se puede volver a encender? **Sale del motor, no de la preferencia** — y
   * en la guardería depende del PERÍODO: dentro del pagado, reactivar es
   * cancelar la cancelación; fuera, ya no es reactivación sino contratar de
   * nuevo. *El caso intermedio no se puede expresar: lo impide un trigger.*
   */
  reversible: boolean;
  /**
   * ⭐ **LA FECHA DEL PRÓXIMO COBRO, RESUELTA POR EL SERVIDOR.**
   * `null` cuando el plan todavía no se cobró o está cancelado — *inventar una
   * fecha para un plan que no va a cobrar es la misma mentira, del otro lado.*
   *
   * 🔴 **NO se deduce de `cubiertoHasta`.** Ese es el fin del período pagado y
   * el cobro cae al día siguiente: en un mes normal coinciden y por eso el
   * error no se ve. *Un día de diferencia en una fecha de cobro se lee como que
   * te cobraron antes de lo que dijiste.*
   */
  proximoCobro: string | null;
  /**
   * 🔴 **S108-C-3 · DEFECTO PROPIO, cazado por el censo de paseo.**
   * Este bucle filtraba `s.estado !== 'activa'` **y no miraba el pago**, cuando
   * `PlanPaseo.estado_pago` viaja desde el lector y nadie lo consumía. *Un plan
   * con el cobro pendiente se listaba en la pantalla de la plata como si
   * estuviera al día* — y ésta es justo la pantalla donde alguien viene a
   * enterarse de qué le cobran.
   */
  pagoPendiente: boolean;
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'noPudimos' }
  | { fase: 'listo'; items: Item[] };

export default function Recurrentes() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const idioma = obtenerIdiomaActual();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [confirmando, setConfirmando] = useState<Item | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    let vigente = true;
    setEstado({ fase: 'cargando' });
    void (async () => {
      /* Misma ola: el peaje es de la PETICIÓN, no del volumen (L-223). */
      const [g, p] = await Promise.all([obtenerMisPlanesGuarderia(), obtenerMisPlanesPaseo()]);
      if (!vigente) return;
      /* 🔴 Un fallo JAMÁS se disfraza de «no tenés nada» (Ley 13). En una
         pantalla de plata esa confusión es peor que en cualquier otra: se lee
         como «ya no te cobran». */
      if (!g.ok || !p.ok) { setEstado({ fase: 'noPudimos' }); return; }

      const hoy = hoyLocal();
      const items: Item[] = [];

      for (const s of g.data) {
        /* La cancelada SIGUE VIVA mientras su período corra: es justo cuando la
           familia necesita leer hasta cuándo está cubierta. */
        const vigenteAun =
          s.estado === 'activa' ||
          (s.estado === 'cancelada' && s.periodoHasta !== null && s.periodoHasta >= hoy);
        if (!vigenteAun) continue;
        items.push({
          clave: `g:${s.suscripcionId}`,
          tipo: 'guarderia',
          id: s.suscripcionId,
          titulo: t('recurrentes.guarderiaPlan'),
          donde: s.prestadorNombre.length > 0 ? s.prestadorNombre : null,
          precio: s.precioMensual,
          cubiertoHasta: s.periodoHasta,
          proximoCobro: s.proximoCobro,
          /* La guardería no expone `estado_pago` en su lector de planes: su
             veredicto de pago vive en el ciclo (`estado`). No se inventa. */
          pagoPendiente: false,
          encendido: s.estado === 'activa',
          /* Dentro del período pagado se puede volver; fuera no es volver, es
             contratar de nuevo — y eso lo dice el motor con su propio código. */
          reversible: s.periodoHasta !== null && s.periodoHasta >= hoy,
        });
      }

      for (const s of p.data) {
        if (s.estado !== 'activa') continue;
        items.push({
          clave: `p:${s.id}`,
          tipo: 'paseo',
          id: s.id,
          titulo: t('recurrentes.paseoPlan'),
          donde: null,
          precio: s.precio_mensual,
          cubiertoHasta: s.periodo_fin,
          /* 🔴 El plan de paseos **no publica su próximo cobro**, y no se
             deduce del fin del período: sería el mismo defecto en el otro
             oficio. Dice hasta cuándo está cubierto, que es lo que su motor sí
             sabe. */
          proximoCobro: null,
          /* ⭐ El dato SIEMPRE estuvo: `planes.ts:250` lo mapea y hasta hoy no
             lo consumía nadie. *Un campo que llega y nadie lee es un dato que
             la pantalla decidió no saber.* */
          pagoPendiente: s.estado_pago !== 'pagado',
          encendido: s.auto_renovar,
          reversible: true,
        });
      }

      /* El nombre del lugar del paseo hay que ir a buscarlo — su lector no lo
         trae. **La pantalla no lo espera**: se pinta y el nombre completa. */
      setEstado({ fase: 'listo', items });
      const ids = [...new Set(p.data.filter((x) => x.estado === 'activa').map((x) => x.prestador_id))];
      if (ids.length === 0) return;
      const perfiles = await obtenerPerfilesPublicos(ids);
      if (!vigente || !perfiles.ok) return;
      const nombre = new Map(perfiles.data.map((x) => [x.id, x.nombre_comercial ?? null]));
      setEstado((e) =>
        e.fase !== 'listo'
          ? e
          : {
              fase: 'listo',
              items: e.items.map((it) =>
                it.tipo === 'paseo' && it.donde === null
                  ? { ...it, donde: nombre.get(p.data.find((x) => x.id === it.id)?.prestador_id ?? '') ?? null }
                  : it,
              ),
            },
      );
    })();
    return () => { vigente = false; };
  }, [intento, t]);

  /** Apagar: cada tipo por su puerta, el resultado se lee igual. */
  const apagar = useCallback(async (it: Item) => {
    if (trabajando) return;
    setTrabajando(true);
    const r =
      it.tipo === 'guarderia'
        ? await cancelarMensualidadGuarderia(it.id)
        : await configurarRenovacionPlan({ suscripcion_id: it.id, auto_renovar: false });
    setTrabajando(false);
    setConfirmando(null);
    if (!r.ok) { mostrar({ texto: t('recurrentes.noPudimosApagar'), variante: 'error' }); return; }
    /* Se relee del servidor en vez de pintar el resultado de memoria: la fecha
       hasta la que queda cubierto la sabe el motor, no esta pantalla. */
    setIntento((n) => n + 1);
  }, [trabajando, mostrar, t]);

  /**
   * ⭐ **VOLVER A ENCENDER — cada sujeto por su puerta, y los rebotes LLEVAN.**
   *
   * 🔴 `periodo_vencido_contratar_de_nuevo` **no es un error: es otro camino.**
   * *Decirle «no se pudo» a alguien que quiere volver a tener su plan, cuando
   * volver a tenerlo SÍ se puede —se llama contratar—, es un rebote que esconde
   * la salida.* Lleva a contratar.
   *
   * 🔴 Y `ya_tienes_plan_activo` tampoco: **ya lo tiene.** Se recarga, y el plan
   * vivo aparece en esta misma lista. *El id viaja en el mensaje del motor, pero
   * no se parsea (regla 35): esta pantalla no lo necesita porque ya lista los
   * planes — la relectura es el «llevar ahí».*
   */
  const encender = useCallback(async (it: Item) => {
    if (trabajando || !it.reversible) return;
    setTrabajando(true);
    const r =
      it.tipo === 'guarderia'
        ? await reactivarMensualidadGuarderia(it.id)
        : await configurarRenovacionPlan({ suscripcion_id: it.id, auto_renovar: true });
    setTrabajando(false);
    if (r.ok) { setIntento((n) => n + 1); return; }

    if (r.codigo === 'periodo_vencido_contratar_de_nuevo') {
      mostrar({ texto: r.mensaje, variante: 'neutro' });
      router.push('/explorar/guarderia');
      return;
    }
    if (r.codigo === 'ya_tienes_plan_activo') {
      /* `neutro`, no `error`: **no se equivocó en nada** — ya lo tiene. */
      mostrar({ texto: r.mensaje, variante: 'neutro' });
      setIntento((n) => n + 1);
      return;
    }
    mostrar({ texto: t('recurrentes.noPudimosEncender'), variante: 'error' });
  }, [trabajando, mostrar, router, t]);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        atras
        titulo={t('recurrentes.titulo')}
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}
      >
        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={72} />
          </EsqueletoGrupo>
        ) : estado.fase === 'noPudimos' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('recurrentes.noCargoTitulo')}
            descripcion={t('recurrentes.noCargoDetalle')}
          />
        ) : estado.items.length === 0 ? (
          /* El vacío con calma — no queda mudo. */
          <EstadoVacio
            registro="seccion"
            titulo={t('recurrentes.vacioTitulo')}
            descripcion={t('recurrentes.vacioDetalle')}
          />
        ) : (
          <>
            <Texto variante="apoyo">{t('recurrentes.intro')}</Texto>
            <Tarjeta relleno="ninguno">
              {estado.items.map((it, i) => (
                <View key={it.clave}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={it.titulo}
                    subtitulo={it.donde ?? undefined}
                    metadataMono={t('recurrentes.alMes', { precio: it.precio.toFixed(2) })}
                    fin={
                      <Interruptor
                        encendido={it.encendido}
                        etiqueta={it.titulo}
                        onCambio={(v) => {
                          /* Apagar SIEMPRE confirma. Encender no: no hay nada
                             que perder y el gesto ya es deliberado. */
                          if (v) void encender(it);
                          else setConfirmando(it);
                        }}
                      />
                    }
                  />
                  <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[3], gap: 2 }}>
                    {/* 🔴 Antes que nada: si el cobro no entró, **eso** es lo
                        que hay que leer. *Decir «se renueva solo» sobre algo que
                        no se pudo cobrar es prometer un servicio que puede
                        cortarse.* */}
                    {it.pagoPendiente ? (
                      <Texto variante="apoyo">{t('recurrentes.pagoPendiente')}</Texto>
                    ) : it.encendido ? (
                      <Texto variante="apoyo">
                        {/* ⭐ La fecha del cobro cuando el motor la da; si no,
                            hasta cuándo está cubierto. **Nunca una deducida.** */}
                        {it.proximoCobro !== null
                          ? t('recurrentes.proximoCobro', { fecha: fechaLargaHumana(it.proximoCobro, idioma) })
                          : it.cubiertoHasta === null
                            ? t('recurrentes.proximoCobroSinFecha')
                            : t('recurrentes.cubiertoHasta', { fecha: fechaLargaHumana(it.cubiertoHasta, idioma) })}
                      </Texto>
                    ) : (
                      /* 🔴 APAGADO: hasta qué día sigue cubierto. Esta línea es
                         la que impide que la familia crea que se cortó hoy. */
                      <Texto variante="apoyo">
                        {it.cubiertoHasta === null
                          ? t('recurrentes.apagadoSinFecha')
                          : t('recurrentes.apagadoHasta', {
                              fecha: fechaLargaHumana(it.cubiertoHasta, idioma),
                            })}
                      </Texto>
                    )}
                  </View>
                </View>
              ))}
            </Tarjeta>
          </>
        )}

        {/* ⚠️ LA AUSENCIA DECLARADA — el tercer sujeto recurrente que esta
            pantalla todavía no puede listar. Se dice SIEMPRE, también con la
            lista vacía: *si no, «no tienes nada que se cobre solo» sería falso
            para quien tenga una compra recurrente andando.* */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('recurrentes.despensaTitulo')}</Texto>
          <Texto variante="apoyo">{t('recurrentes.despensaDetalle')}</Texto>
        </View>
      </ScrollView>

      {/* EL MODAL — está para que no se apague sin querer, **no para convencer
          de quedarse**: sin culpa, sin oferta de retención, sin letra chica. */}
      <Hoja
        visible={confirmando !== null}
        onCerrar={() => setConfirmando(null)}
        titulo={confirmando === null ? '' : t('recurrentes.confirmarTitulo', { que: confirmando.titulo })}
      >
        {confirmando === null ? null : (
          <View style={{ gap: spacing[4] }}>
            <Texto variante="cuerpo">{t('recurrentes.confirmarCuerpo')}</Texto>
            <Texto variante="apoyo">
              {confirmando.reversible
                ? t('recurrentes.confirmarReversible')
                : t('recurrentes.confirmarSinVuelta')}
            </Texto>
            <Boton
              variante="primario"
              bloque
              etiqueta={t('recurrentes.confirmar')}
              cargando={trabajando}
              onPress={() => void apagar(confirmando)}
            />
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('recurrentes.volver')}
              onPress={() => setConfirmando(null)}
            />
          </View>
        )}
      </Hoja>
    </SafeAreaView>
  );
}
