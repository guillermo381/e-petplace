/**
 * LA VENTANA HERMANA — LOS PEDIDOS DEL DÍA (S99-D · L4).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * **LA FIRMA QUE LA ORDENA** (adjudicación de mesa #1, 15-ago): citas y
 * pedidos son **ventanas hermanas con puertas espejo**. El HOY se quedó con
 * citas —su lápida vive en `(tabs)/index.tsx`— y los pedidos viven acá.
 *
 * El argumento de S97-D contra la separación era bueno y quedó **respondido,
 * no ignorado**: *«un día contado en dos listas está en DOS ÓRDENES»*. Lo
 * responde **el selector de fecha compartido: es UN día en DOS ventanas.**
 * Por eso la rueda de acá NO es una rueda parecida — es la MISMA pieza, con
 * la misma aritmética (`@/lib/dia-local`) y el mismo rango, y el día CRUZA
 * en los dos sentidos por la puerta. *Si el día no cruzara, la firma sería
 * una intención y el defecto de S97-D volvería intacto.*
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── EL LECTOR ES POR RANGO, Y ESO ES LO QUE HACE BARATO EL GESTO ───────
 * `listarPedidosDelVendedorEnRango(cuenta, hoy−3, hoy+6)` **una vez por
 * foco**; elegir día es un **filtro en memoria**. Es el espejo exacto de lo
 * que ya hace el HOY de citas. Si pidiera por día, girar la rueda costaría
 * un viaje por giro — y girar la rueda es justamente el gesto que la firma
 * quiere barato (L-223: el peaje es la petición, no los datos).
 *
 * ⚠️ **La única cadena legítima es `extrasPanelPedidos`**: no se pueden
 * pedir los extras antes de saber qué ids volvieron. No es evitable.
 *
 * ⚠️ **`cupoRepartoDelDia` SÍ es por día** ⇒ **una petición por giro**, y es
 * decisión declarada: pedir los diez cupos del rango en el arranque sería
 * pagar nueve que nadie va a mirar para abaratar un gesto secundario —
 * encarecer el arranque para abaratar el segundo toque es al revés de lo que
 * la regresión del HOY pide. Si al medir aparece caro, la forma existe
 * (`cupos_del_rango`) y se pide con número, no con sospecha.
 *
 * ── LO QUE ESTA VENTANA NO LEE, y no es olvido ─────────────────────────
 * **Cero citas · cero mascota · cero `prestador_id`.** Se monta con
 * `cuenta_comercial_id` y nada más. Lo de la mascota es de ley:
 * `MODELO_DESPENSA` §7.4 — *el rol vendedor no ve el expediente por ninguna
 * vía*. No es que no se haya puesto: **no puede existir de este lado.**
 *
 * ── 🟡 LA TENSIÓN CON `/ventas`, DECLARADA Y NO ABSORBIDA ──────────────
 * `/ventas` es **el panel**: todo el trabajo vivo ordenado por lo que falta
 * hacer, sin día. Esta ventana es **el día**. Son dos verdades distintas
 * sobre el mismo objeto y las dos son correctas (el mismo caso que
 * `/historico` vs el panel, ya resuelto así). **Comparten la PIEZA**
 * (`VentanaPedidos`), que es lo que impide que diverjan por copia. Lo que
 * queda a la mesa: **si el panel sobrevive una vez que el dual tiene su
 * día**. No lo decido yo y no lo doy por decidido.
 */

import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  PuertaHermana,
  SelectorDia,
  Texto,
  TresNumeros,
  spacing,
  useTheme,
  type ColumnaTecho,
} from '@epetplace/ui';
import {
  cupoRepartoDelDia,
  extrasPanelPedidos,
  listarPedidosDelVendedorEnRango,
  type ExtraPanelPedido,
  type PedidoDelVendedorConDia,
} from '@epetplace/api';
import { diaSemanaCorto, type IdiomaSoportado } from '@epetplace/i18n';

import { VentanaPedidos } from '@/components/ventana-pedidos';
import { TechoOficio } from '@/components/techo-oficio';
import { montoCorto } from '@/lib/formato-techo';
import { useDiaEnVista } from '@/lib/dia-en-vista';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { hoyLocal, sumarDias } from '@/lib/dia-local';
import { useTraduccion } from '@/i18n';

/** El MISMO rango que el HOY de citas — el espejo empieza acá. */
const DIAS_ATRAS = 3;
const DIAS_ADELANTE = 6;

type Estado =
  | { fase: 'cargando' }
  | { fase: 'sinTienda' }
  | { fase: 'error'; mensaje: string }
  | {
      fase: 'listo';
      contexto: ContextoVentas;
      delRango: PedidoDelVendedorConDia[];
      sinFecha: PedidoDelVendedorConDia[];
      extras: Record<string, ExtraPanelPedido>;
    };

export default function PedidosDelDia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const hoy = hoyLocal();
  /* 🔴 EL DÍA NO LLEGA NI SE GUARDA: SE COMPARTE. ⏪ Acá vivía un
     `useState` sembrado desde un param de ruta, y esa forma es la que
     obligaba a que la vuelta fuera un `navigate` — ver la lápida de
     `volverACitas`. Con el contexto, las dos ventanas leen LA MISMA pieza
     de estado: la firma «UN día en DOS ventanas» deja de ser una
     afirmación sobre el comportamiento y pasa a ser del tipo. */
  const { dia: diaElegido, elegir: setDia } = useDiaEnVista();
  const dia = diaElegido ?? hoy;

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  /* El cupo es del DÍA: se guarda con SU día adentro para que la cifra
     nunca se pinte contra otro (el mismo patrón que la plata del HOY —
     un número correcto sobre el día equivocado es peor que ninguno). */
  const [cupo, setCupo] = useState<{ dia: string; capacidad: number; consumido: number } | null>(
    null,
  );

  const cargar = useCallback(async (esRefresh = false) => {
    if (!esRefresh) setEstado({ fase: 'cargando' });
    const ctx = await contextoVentas();
    if (!ctx.ok) {
      setEstado({ fase: 'error', mensaje: ctx.mensaje });
      return;
    }
    if (ctx.data === null || !ctx.data.esVendedora) {
      /* No es un fallo: es un ESTADO (L-178). Alguien llegó acá sin tienda
         —un enlace viejo, una vuelta atrás— y se le dice qué pasa. */
      setEstado({ fase: 'sinTienda' });
      return;
    }
    const cuentaId = ctx.data.cuentaComercialId;
    const r = await listarPedidosDelVendedorEnRango(
      cuentaId,
      sumarDias(hoy, -DIAS_ATRAS),
      sumarDias(hoy, DIAS_ADELANTE),
    );
    if (!r.ok) {
      setEstado({ fase: 'error', mensaje: r.mensaje });
      return;
    }
    const ids = [...r.data.delRango, ...r.data.sinFecha].map((p) => p.pedido_id);
    const ex = ids.length > 0 ? await extrasPanelPedidos(ids) : { ok: true as const, data: {} };
    setEstado({
      fase: 'listo',
      contexto: ctx.data,
      delRango: r.data.delRango,
      sinFecha: r.data.sinFecha,
      extras: ex.ok ? ex.data : {},
    });
  }, [hoy]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  /* El cupo viaja aparte porque su eje es OTRO: cambia con la rueda, no con
     el foco. Su fallo NO tumba la ventana — la cifra del techo se omite y
     los pedidos siguen. `VentanaPedidos` ya trata `null` como «el motor no
     pudo decirlo», que es distinto de «capacidad cero» (que SE DICE). */
  useFocusEffect(
    useCallback(() => {
      if (estado.fase !== 'listo') return;
      const cuentaId = estado.contexto.cuentaComercialId;
      let vigente = true;
      void cupoRepartoDelDia(cuentaId, dia).then((r) => {
        if (!vigente) return;
        setCupo(r.ok ? { dia, capacidad: r.data.capacidad, consumido: r.data.consumido } : null);
      });
      return () => {
        vigente = false;
      };
    }, [estado, dia]),
  );

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await cargar(true);
    setRefrescando(false);
  }, [cargar]);

  const dias = useMemo(
    () =>
      Array.from({ length: DIAS_ATRAS + DIAS_ADELANTE + 1 }, (_, i) => {
        const iso = sumarDias(sumarDias(hoy, -DIAS_ATRAS), i);
        return { iso, dia: diaSemanaCorto(iso, idioma as IdiomaSoportado), numero: iso.slice(8, 10) };
      }),
    [hoy, idioma],
  );

  /** Los del día en vista — filtro EN MEMORIA sobre el rango ya traído. */
  const delDia = useMemo(
    () => (estado.fase === 'listo' ? estado.delRango.filter((p) => p.dia === dia) : []),
    [estado, dia],
  );

  /* ⭐ S99-D · ④ EL HEADER DE CITAS SE CONSERVA, CAMBIANDO LO QUE CUENTA
     (dictado del founder, 16-ago). **La lectura de mesa que lo ordena: el
     vendedor no es un prestador con otra lista — es OTRO OFICIO en la misma
     casa**, así que su techo es el MISMO techo con SUS magnitudes. Es §2.0
     aplicado arriba: una casa, un techo, el contenido modulado por oficio.

     LAS TRES COLUMNAS, espejo de `[carga · plata · vidas]` del HOY:
       ① carga  → cuántos PEDIDOS tiene el día (allá: citas)
       ② plata  → el valor del día — **se mantiene**, es el mismo concepto
       ③ vidas  → **entregados**, que reemplaza el cuadro de MASCOTAS porque
                  de este lado no hay mascotas y no puede haberlas
                  (`MODELO_DESPENSA` §7.4). *No es que el slot quede vacío:
                  es que el oficio tiene otra magnitud para ese lugar.*

     🔴 **CERO VIAJE NUEVO Y CERO MOTOR PEDIDO** — los tres salen EN MEMORIA
     de `delRango`, que ya está traído (medición de A, confirmada acá al
     escribirlo: count del día · suma de totales · count de entregados). Si
     alguna vez se quiere el valor con OTRA semántica —server-side, con
     impuestos o descuentos del motor— eso sí es letra y se pide con número.

     ⚠️ Se omite entero mientras NO HAY VERDAD (cargando/error), igual que el
     del HOY: ahí no se sabe si es cero o si no se pudo leer, y **un cero
     dibujado sobre una lectura que falló es peor que una ausencia.** */
  const techo = useMemo((): [ColumnaTecho, ColumnaTecho, ColumnaTecho] | null => {
    if (estado.fase !== 'listo') return null;
    const n = delDia.length;
    const total = delDia.reduce((suma, p) => suma + (p.total ?? 0), 0);
    /* «Entregado» se lee del ESTADO NARRATIVO del pedido, que es el
       vocabulario que esta casa expone al vendedor — no de un estado interno
       del motor (29 internos → 7 narrativos, S95). Un contador que mira el
       estado interno se rompe la próxima vez que el motor gane un escalón. */
    const entregados = delDia.filter((p) => p.narrativa === 'entregado').length;
    return [
      { valor: String(n), rotulo: n === 1 ? t('pedidosDia.techoPedido1') : t('pedidosDia.techoPedidos') },
      {
        valor: montoCorto(total),
        /* El mismo criterio del HOY: «del día» a secas se lee como HOY pare
           donde pare la rueda — cuando no es hoy, el rótulo dice CUÁL. */
        rotulo:
          dia === hoy
            ? t('pedidosDia.techoValor')
            : t('pedidosDia.techoValorOtro', {
                dia: `${diaSemanaCorto(dia, idioma as IdiomaSoportado)} ${dia.slice(8, 10)}`,
              }),
      },
      {
        valor: String(entregados),
        rotulo: entregados === 1 ? t('pedidosDia.techoEntregado1') : t('pedidosDia.techoEntregados'),
      },
    ];
  }, [estado, delDia, dia, hoy, idioma, t]);

  /* 🔴 LA VUELTA ES UN `back()` — UN POP DE VERDAD, y ésa es la corrección.
     ⏪ Acá decía: *«`navigate` y no `back`: `back` devolvería a la hermana
     con el día que ella tenía»*. **Era cierto y por eso estaba mal.** El
     founder lo cazó caminando: *«el efecto de transición de pantalla, desde
     pedidos hacia citas, debe ser del lado contrario — se debe sentir que
     está regresando»*. Un `navigate` con params distintos NO es un pop, así
     que la pila animaba el regreso con el mismo `slide_from_right` de la
     ida: **el día cruzaba y el cuerpo decía que seguía avanzando.**
     La cura no fue elegir otra animación: fue sacarle a la navegación el
     trabajo de transportar el día (ahora lo comparte el contexto) para que
     el gesto pueda ser el que corresponde. *La dirección se deriva del
     gesto; una que se configura se puede configurar mal.* */
  const volverACitas = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      {/* EL MISMO TECHO DEL HOY — no un encabezado de navegación. La flecha
          de atrás no hace falta: la puerta espejada de abajo ES el camino de
          vuelta, y tener dos gestos para lo mismo a dos centímetros es la
          duplicación que §15b.0ter cura en el resto de la casa. */}
      <TechoOficio
        titulo={t('pedidosDia.titulo')}
        /* El nombre del negocio recién existe con la lectura hecha; hasta
           entonces la cadena vacía, que el techo trata como ausencia — jamás
           un placeholder que después cambia de texto a la vista. */
        dato={estado.fase === 'listo' ? estado.contexto.nombreComercial : ''}
        pie={techo === null ? undefined : <TresNumeros columnas={techo} />}
        cohorte={null}
        cohorteAnio={null}
      />

      {/* La rueda va FUERA del scroll: es el control de la pantalla, no
          contenido — el mismo lugar que ocupa en el HOY, para que el ojo la
          encuentre donde ya sabe. */}
      <View style={{ paddingHorizontal: spacing[4], gap: spacing[3] }}>
        {/* ⭐ S99-D · LA FILA ESPEJADA (dictado del founder, 16-ago). En el
            HOY: label a la izquierda, puerta a la derecha. Acá al revés —
            *«el label de Tu día podés ponerlo al costado contrario de la
            pantalla»*— para que la puerta de vuelta, que por su dirección
            ancla a la izquierda, no le robe el lugar.
            **Y el espejo es geométrico, no dos armados que se parecen:** la
            misma fila, el mismo `space-between`, los dos hijos intercambiados.
            La puerta ni siquiera sabe de qué lado está: su `direccion` deriva
            chevron y orden adentro de la pieza (contrato de B). */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing[3],
          }}
        >
          <PuertaHermana
            etiqueta={t('pedidosDia.puertaCitas')}
            direccion="izquierda"
            /* sinVer=0 TRANSICIONAL — misma cura y mismo porqué que la puerta
               de ida (simetría obligatoria de la ley del contador). */
            sinVer={0}
            onPress={volverACitas}
          />
          <Texto variante="seccion">{t('agenda.tuDia')}</Texto>
        </View>
        <SelectorDia
          dias={dias}
          elegido={dia}
          cerrados={new Set()}
          etiquetaCerrado=""
          onElegir={setDia}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[4],
        }}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />
        }
      >
        {estado.fase === 'cargando' && (
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={72} />
            <Esqueleto alto={72} />
          </EsqueletoGrupo>
        )}

        {estado.fase === 'sinTienda' && (
          <EstadoVacio
            registro="pantalla"
            titulo={t('pedidosDia.sinTiendaTitulo')}
            descripcion={t('pedidosDia.sinTiendaDetalle')}
          />
        )}

        {/* Ley 13: el fallo DICE que es fallo — jamás se disfraza de «no hay
            pedidos», que es lo que un vacío mudo le haría creer al vendedor
            justo el día que sí los hay. */}
        {estado.fase === 'error' && (
          <EstadoVacio
            registro="pantalla"
            titulo={t('pedidosDia.errorTitulo')}
            descripcion={estado.mensaje}
          />
        )}

        {estado.fase === 'listo' && (
          <VentanaPedidos
            dia={dia}
            pedidos={delDia}
            sinFecha={estado.sinFecha}
            extras={estado.extras}
            cupo={cupo !== null && cupo.dia === dia ? cupo : null}
            moneda={estado.contexto.moneda}
            onAbrir={(id) =>
              router.push({ pathname: '/ventas/pedido/[pedidoId]', params: { pedidoId: id } })
            }
          />
        )}

        {/* ☠️ S99-D · acá vivía la puerta de vuelta, al PIE. Subió a la fila
            del label por el mismo dictado que movió a su espejo en el HOY:
            dos escalones para lo que es un solo escalón dejan un hueco. */}
      </ScrollView>
    </View>
  );
}
