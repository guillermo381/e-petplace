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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  PuertaHermana,
  SelectorDia,
  spacing,
  useTheme,
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
  const params = useLocalSearchParams<{ dia?: string }>();

  const hoy = hoyLocal();
  /* 🔴 EL DÍA LLEGA POR LA PUERTA. Si la hermana no mandó ninguno, hoy.
     Se toma como valor INICIAL y después manda la rueda de acá — el día
     vuelve a la otra ventana por la puerta de regreso, no por este param. */
  const [dia, setDia] = useState<string>(() => {
    const p = params.dia;
    return typeof p === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : hoy;
  });

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

  /* 🔴 LA PUERTA DE VUELTA LLEVA EL DÍA. `navigate` y no `back`: `back`
     devolvería a la hermana con el día que ella tenía, y ahí «un día en dos
     ventanas» se rompería justo en el gesto que la firma quiere proteger.
     `navigate` a una ruta que ya está en la pila no la duplica: la retoma
     con sus params nuevos. */
  const volverACitas = useCallback(() => {
    router.navigate({ pathname: '/(tabs)', params: { dia } });
  }, [router, dia]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('pedidosDia.titulo')}
        atras
        onAtras={volverACitas}
      />

      {/* La rueda va FUERA del scroll: es el control de la pantalla, no
          contenido — el mismo lugar que ocupa en el HOY, para que el ojo la
          encuentre donde ya sabe. */}
      <View style={{ paddingHorizontal: spacing[4] }}>
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

        {/* LA PUERTA DE VUELTA — abajo, que es donde termina la lectura.
            `direccion` deriva el chevron y el orden: la pieza no se puede
            montar torcida (contrato de B). */}
        <PuertaHermana
          etiqueta={t('pedidosDia.puertaCitas')}
          direccion="izquierda"
          /* sinVer=0 TRANSICIONAL — misma cura y mismo porqué que la puerta
             de ida (simetría obligatoria de la ley del contador). */
          sinVer={0}
          onPress={volverACitas}
        />
      </ScrollView>
    </View>
  );
}
