/**
 * LA VITRINA DEL VENDEDOR — N17 (una superficie, dos modos) + N20 (los ejes)
 * + N18 (lo incompleto pierde alcance).
 *
 * ── 🔴 LA DECISIÓN QUE ORDENA TODA LA PANTALLA ───────────────────────────
 * **Los dos modos listan conjuntos DISTINTOS, y eso no es un bug del espejo:
 * es el espejo haciendo su trabajo.**
 *
 * · **Ver como cliente** lista **lo PUBLICADO** (`listarProductosDespensa`,
 *   el MISMO lector que ve la familia — N17 en la capa de datos).
 * · **Administrar** lista **TODOS sus SKUs** (`listarSkusDelVendedor`),
 *   incluidos los que **no llegan a la vitrina** — *porque ahí es justo
 *   donde vive el trabajo: un producto sin precio o rechazado no aparece en
 *   la vitrina, y es el que más necesita que él lo vea.*
 *
 * Si las dos caras listaran lo mismo, el espejo sería un adorno: la
 * diferencia ENTRE las dos ES la información. Y por eso, en modo cliente,
 * **la pantalla DICE cuántos de los suyos no están y por qué** — el único
 * caso en que el espejo habla en modo cliente, declarado en el contrato de
 * L5b: *sin esa frase, «no está» se leería como «se perdió».*
 *
 * ── LOS EJES (N20), con sus tres leyes firmadas ──────────────────────────
 * · **LA ESPECIE ES FILTRO, JAMÁS CARPETA** — 14 no cabe en 13: al menos un
 *   producto vive en las dos, y una carpeta lo obligaría a elegir casa. Acá
 *   es un chip que ACOTA, y «Todas» siempre existe.
 * · **Un eje con cero comprables no se pinta** (Ley 23 hecha lector: los
 *   conteos corren sobre lo comprable). *La puerta no ofrece lo que va a
 *   rechazar.*
 * · **El eje «necesidad» NO se muestra hoy** — se enciende solo por umbral,
 *   y hasta entonces un filtro que no reparte es un adorno con estado.
 *
 * ⚠️ **EL SEGUNDO EJE CUENTA PERO NO FILTRA, y se declara:**
 * `ProductoDeVitrina` **no trae `momentos_aplicables`** (medido) y
 * `FiltrosVitrina` no tiene `momento` ⇒ **el momento se puede contar y no
 * se puede aplicar**. Pintarlo tocable sería ofrecer una puerta que rebota.
 * *Pedido a A: el momento en el lector de vitrina o en sus filtros.* Y
 * cuando llegue, **NULL es COMODÍN** —aparece en todos los momentos, jamás
 * bucket propio— tal como su JSDoc lo cableó.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  SelectorOpcion,
  SelectorSegmentado,
  Separador,
  Tarjeta,
  Texto,
  radius,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  conteosVitrinaPorEje,
  listarProductosDespensa,
  listarSkusDelVendedor,
  razonesDeAlcance,
  type ConteosVitrina,
  type ProductoDeVitrina,
  type SkuDelVendedor,
} from '@epetplace/api';
import { monto, type IdiomaSoportado } from '@epetplace/i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTraduccion } from '@/i18n';
import { InterruptorEspejo, type ModoEspejo } from '@/components/interruptor-espejo';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'sinCuenta' }
  | {
      estado: 'listo';
      contexto: ContextoVentas;
      /** Lo PUBLICADO — lo que ve la familia. */
      vitrina: ProductoDeVitrina[];
      /** TODOS sus SKUs — el trabajo vive acá. */
      skus: SkuDelVendedor[];
      /** `null` = los conteos fallaron; los ejes NO se dibujan (jamás un
       *  filtro con números inventados). */
      conteos: ConteosVitrina | null;
    };

const TODAS = '__todas__';

/** 🔴 EL TAMAÑO SE MIDE EN APARATO SOBRE LA FILA REAL, y este número es
 *  PROVISIONAL Y DECLARADO: con la tarjeta de hoy entra **≈1 por
 *  pantalla**, así que 40 son 40 pantallas. Se fija cuando la fila
 *  compacta de la receta de B esté montada — medir ahora sería medir la
 *  forma que se va a reemplazar. *El trato: B no lo inventa, yo no lo
 *  adivino.* */
const TAM_VENTANA = 40;

/** LISTA ⇄ ÍCONOS (receta B §A2). **El default es LISTA y es decisión:**
 *  Stock es donde el vendedor TRABAJA, y la ley de la casa ya lo dice —
 *  *tarjetas para elegir, filas para leer*. La grilla sirve para
 *  reconocer por la foto; la fila, para operar. */
type VistaProductos = 'lista' | 'iconos';
/** **La elección SE RECUERDA**, y en el DISPOSITIVO: es de la vista, no
 *  de la cuenta. *Un modo que vuelve al default cada vez que entrás no es
 *  un modo: es una preferencia que la app ignora.* */
const LLAVE_VISTA = 'vitrina.vista';

export default function Vitrina() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [modo, setModo] = useState<ModoEspejo>('administrar');
  const [especie, setEspecie] = useState<string>(TODAS);
  /* EL BUSCADOR — el founder lo pidió con 399 en pantalla: *«que si voy
     escribiendo el nombre del producto, me vaya filtrando los que están»*.
     **Censo antes de construir (y por eso costó poco):** para la cara
     cliente el motor YA lo tenía (`buscarProductosDespensa`, ilike sobre
     nombre y marca, solo publicadas); para Administrar **no hacía falta
     motor** — sus SKUs ya viajan enteros y filtrar 37 en memoria es gratis.
     ⇒ **cero motor nuevo.** */
  const [busca, setBusca] = useState('');
  const [vista, setVista] = useState<VistaProductos>('lista');
  useEffect(() => {
    void AsyncStorage.getItem(LLAVE_VISTA).then((v) => {
      if (v === 'iconos' || v === 'lista') setVista(v);
    });
  }, []);
  /* LA VENTANA — 399 filas de una revientan N16 (dato de B, re-medido con
     el volumen). **Carga al llegar al final, JAMÁS un botón**: un «cargar
     más» le pide al pulgar que confirme lo que ya pidió con el scroll. */
  const [ventana, setVentana] = useState(TAM_VENTANA);
  const cargando = useRef(false);
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const ctx = await contextoVentas();
        if (!vigente) return;
        if (!ctx.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        if (ctx.data === null) {
          setPantalla({ estado: 'sinCuenta' });
          return;
        }
        const ctxData = ctx.data;
        /* UNA ola con los tres: el peaje por petición domina (L-223) y esta
           pantalla necesita las dos caras del espejo para poder comparar. */
        const [rVit, rSkus, rConteos] = await Promise.all([
          /* SIN filtro de país: `ContextoVentas` no lo trae (medido — su
             `ConfigMoneda` tiene código, símbolo y decimales, no país), y
             pasarle uno adivinado al lector sería peor que no filtrar. Hoy
             todas las ofertas vivas son EC. *Pedido a A: el país en el
             contexto, para que el filtro viaje SERVER-SIDE y no se resuelva
             a mano acá.* */
          listarProductosDespensa({}),
          listarSkusDelVendedor(ctxData.cuentaComercialId),
          conteosVitrinaPorEje(),
        ]);
        if (!vigente) return;
        if (!rVit.ok || !rSkus.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        /* Los conteos son del FILTRO, no del contenido: si fallan, la
           pantalla sigue sirviendo y los ejes NO se pintan. Degradar el
           filtro es honesto; degradar la lista sería esconder catálogo. */
        setPantalla({
          estado: 'listo',
          contexto: ctxData,
          vitrina: rVit.data,
          skus: rSkus.data,
          conteos: rConteos.ok ? rConteos.data : null,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  /* EL FILTRO DE TEXTO — **una sola implementación para las dos caras**:
     normaliza y compara sobre nombre y marca. Si cada cara buscara distinto,
     el vendedor encontraría un producto en un modo y no en el otro, y el
     espejo dejaría de serlo justo donde más se nota. */
  const coincide = useCallback(
    (nombre: string, marca: string | null) => {
      const q = busca.trim().toLowerCase();
      if (q.length === 0) return true;
      return (
        nombre.toLowerCase().includes(q) || (marca ?? '').toLowerCase().includes(q)
      );
    },
    [busca],
  );

  /* Los SKUs de este vendedor que NO llegaron a la vitrina — la diferencia
     entre las dos caras, que es la información del espejo. */
  const ausentes = useMemo(() => {
    if (pantalla.estado !== 'listo') return [];
    const publicadas = new Set(pantalla.vitrina.map((p) => p.variante_id));
    return pantalla.skus.filter((s) => !publicadas.has(s.variante_id));
  }, [pantalla]);

  /* Carga al llegar al final. El `ref` es el cerrojo: sin él, dos eventos
     de scroll seguidos suman DOS tandas y la ventana salta de 40 a 120 sin
     que nadie haya bajado tanto. */
  const alLlegarAlFinal = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const faltan = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (faltan > 600 || cargando.current) return;
    cargando.current = true;
    setVentana((v) => v + TAM_VENTANA);
    setTimeout(() => {
      cargando.current = false;
    }, 300);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.vitrina.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {/* EL TECHO FIJO — interruptor y ejes no scrollean: un interruptor que
          se va con el scroll deja al vendedor sin saber en qué modo está
          justo cuando más abajo llegó (receta B §2). */}
      {pantalla.estado === 'listo' && (
        <View style={{ paddingHorizontal: spacing[5], gap: spacing[3], paddingBottom: spacing[3] }}>
          <InterruptorEspejo modo={modo} onCambio={setModo} />
          {/* 🔴 S99-C · EL FILTRO SOLO EN «VER COMO CLIENTE», y salió de
              mirarlo con volumen: en Administrar **no filtraba nada** —
              `SkuDelVendedor` no trae `especies_aplicables` (medido)— y
              encima **sus números eran de la OTRA cara**: el chip decía
              «perros · 266» al lado de una lista de 37 SKUs propios.
              *Un control que no hace nada y además miente el número es
              peor que su ausencia* (Ley 23: la puerta no ofrece lo que va
              a rechazar). **Pedido a A**: `especies_aplicables` en el SKU
              del vendedor, y con eso el filtro entra también acá. */}
          {/* CÓMO SE MIRA — segundo control del techo, y responde OTRA
              pregunta que el de arriba: aquél dice QUÉ miro (mi trabajo o
              lo que ve la familia), éste CÓMO lo miro. Por eso conviven:
              no son dos formas de lo mismo. */}
          <SelectorSegmentado
            segmentos={[
              { codigo: 'lista', etiqueta: t('ventas.vitrina.vistaLista') },
              { codigo: 'iconos', etiqueta: t('ventas.vitrina.vistaIconos') },
            ]}
            activo={vista}
            onCambio={(c) => {
              const v: VistaProductos = c === 'iconos' ? 'iconos' : 'lista';
              setVista(v);
              void AsyncStorage.setItem(LLAVE_VISTA, v);
            }}
            etiqueta={t('ventas.vitrina.vistaGrupo')}
            proposito="vista"
          />

          {/* EL BUSCADOR — vive en el techo con el interruptor porque
              filtra lo que está abajo, y **al escribir se vuelve a la
              primera ventana**: sin eso, buscar con 200 filas ya cargadas
              dejaría el resultado enterrado bajo el scroll viejo. */}
          <Campo
            label={t('ventas.vitrina.buscar')}
            value={busca}
            onChangeText={(v) => {
              setBusca(v);
              setVentana(TAM_VENTANA);
            }}
            autoCapitalize="none"
          />
          {modo === 'cliente' && pantalla.conteos !== null && (
            <FiltroEspecie
              conteos={pantalla.conteos}
              activa={especie}
              onCambio={setEspecie}
            />
          )}
        </View>
      )}

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="bloque" ancho="100%" alto={140} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={140} />
          </EsqueletoGrupo>
        </View>
      )}

      {(pantalla.estado === 'error' || pantalla.estado === 'sinCuenta') && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t(
              pantalla.estado === 'sinCuenta'
                ? 'ventas.comunes.sinCuentaTitulo'
                : 'ventas.comunes.errorTitulo',
            )}
            descripcion={t(
              pantalla.estado === 'sinCuenta'
                ? 'ventas.comunes.sinCuentaDetalle'
                : 'ventas.comunes.errorDetalle',
            )}
            accion={
              pantalla.estado === 'error' ? (
                <Boton
                  variante="secundario"
                  etiqueta={t('ventas.comunes.reintentar')}
                  onPress={() => {
                    setPantalla({ estado: 'cargando' });
                    setIntento((n) => n + 1);
                  }}
                />
              ) : undefined
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (
        <ScrollView
          onScroll={alLlegarAlFinal}
          scrollEventThrottle={200}
          contentContainerStyle={{
            paddingHorizontal: spacing[5],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[4],
          }}
        >
          {modo === 'cliente' ? (
            <CaraCliente
              productos={filtrarPorEspecie(pantalla.vitrina, especie).filter((p) =>
                coincide(p.nombre, p.marca),
              )}
              ventana={ventana}
              vista={vista}
              ausentes={ausentes.length}
              moneda={pantalla.contexto}
              idioma={idioma as IdiomaSoportado}
              alAbrir={(id) => router.push(`/ventas/producto/${id}?modo=cliente`)}
            />
          ) : (
            <CaraAdministrar
              skus={pantalla.skus.filter((s2) => coincide(s2.producto_nombre, s2.producto_marca))}
              ventana={ventana}
              vista={vista}
              alAbrir={(id) => router.push(`/ventas/producto/${id}?modo=administrar`)}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

/** LA ESPECIE ES FILTRO: acota la lista, no la reparte en carpetas. */
function filtrarPorEspecie(productos: ProductoDeVitrina[], especie: string): ProductoDeVitrina[] {
  if (especie === TODAS) return productos;
  return productos.filter((p) => p.especies_aplicables.includes(especie));
}

function FiltroEspecie({
  conteos,
  activa,
  onCambio,
}: {
  conteos: ConteosVitrina;
  activa: string;
  onCambio: (v: string) => void;
}) {
  const { t } = useTraduccion();
  /* Ley 23 hecha lector: los conteos ya corren sobre LO COMPRABLE, así que
     una especie con cero no llega acá y no hay nada que filtrar de más.
     «Todas» SIEMPRE existe — sin ella el filtro sería una carpeta. */
  const opciones = [
    { codigo: TODAS, etiqueta: t('ventas.vitrina.todas') },
    ...conteos.por_especie.map((e) => ({
      codigo: e.especie,
      etiqueta: `${t(`ventas.producto.especie_${e.especie}` as 'ventas.producto.especie_perro')} · ${e.productos}`,
    })),
  ];
  if (conteos.por_especie.length === 0) return null;

  return (
    <SelectorOpcion
      opciones={opciones}
      seleccionada={activa}
      onSelect={onCambio}
      disposicion="tira"
      etiqueta={t('ventas.vitrina.filtroEspecie')}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   VER COMO CLIENTE — lo publicado, y la frase que explica lo que falta.
   ───────────────────────────────────────────────────────────────────────── */
function CaraCliente({
  productos,
  ventana,
  vista,
  ausentes,
  moneda,
  idioma,
  alAbrir,
}: {
  productos: ProductoDeVitrina[];
  ventana: number;
  vista: VistaProductos;
  ausentes: number;
  moneda: ContextoVentas;
  idioma: IdiomaSoportado;
  alAbrir: (productoId: string) => void;
}) {
  const { t } = useTraduccion();

  return (
    <View style={{ gap: spacing[4] }}>
      {/* 🔴 EL ÚNICO CASO EN QUE EL ESPEJO HABLA EN MODO CLIENTE, y por eso
          se declara: sin esta frase, «no está» se leería como «se perdió».
          Con cero ausentes NO SE DIBUJA — felicitar por lo normal es lo que
          LOYALTY §2 prohíbe. */}
      {ausentes > 0 && (
        <Texto variante="apoyo" color="tertiary">
          {t('ventas.vitrina.ausentes', { n: ausentes })}
        </Texto>
      )}

      {productos.length === 0 ? (
        <EstadoVacio
          titulo={t('ventas.vitrina.vacioClienteTitulo')}
          descripcion={t('ventas.vitrina.vacioClienteDetalle')}
        />
      ) : (
        <Filas
          vista={vista}
          items={productos.slice(0, ventana).map((p) => ({
            clave: p.oferta_id,
            foto: p.foto_url,
            nombre: p.nombre,
            marca: p.marca,
            linea: `${p.presentacion} · ${monto(p.precio, moneda.moneda, idioma)}`,
            alPulsar: () => alAbrir(p.producto_id),
          }))}
        />
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ADMINISTRAR — TODOS sus SKUs, con lo que le falta a cada uno.
   ───────────────────────────────────────────────────────────────────────── */
function CaraAdministrar({
  skus,
  ventana,
  vista,
  alAbrir,
}: {
  skus: SkuDelVendedor[];
  ventana: number;
  vista: VistaProductos;
  alAbrir: (productoId: string) => void;
}) {
  const { t } = useTraduccion();

  if (skus.length === 0) {
    return (
      <EstadoVacio
        titulo={t('ventas.vitrina.vacioAdminTitulo')}
        descripcion={t('ventas.vitrina.vacioAdminDetalle')}
      />
    );
  }

  return (
    <View style={{ gap: spacing[4] }}>
      <Filas
        vista={vista}
        items={skus.slice(0, ventana).map((s) => {
          /* El contador es SOLO lo suyo — la ley vive en el wrapper y acá
             se LEE. Cero huecos NO DIBUJA NADA. */
          const mias = razonesDeAlcance(s).filter((r) => r.dueno === 'vendedor').length;
          return {
            clave: s.sku_id,
            foto: s.foto_portada,
            nombre: s.producto_nombre,
            marca: s.producto_marca,
            linea: s.presentacion,
            alerta: mias > 0 ? t('ventas.vitrina.leFaltan', { n: mias }) : null,
            alPulsar: () => alAbrir(s.producto_id),
          };
        })}
      />
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LOS DOS MODOS DE VER — una sola entrada de datos, dos formas (receta §A2).
   *Tarjetas para elegir, filas para leer.* Que las dos caras del espejo
   pasen por acá es lo que garantiza que cambiar de modo no cambie QUÉ se
   ve, solo CÓMO — si cada cara tuviera su renderer, el espejo se rompería
   en el detalle más chico.
   ───────────────────────────────────────────────────────────────────────── */
interface ItemProducto {
  clave: string;
  foto: string | null;
  nombre: string;
  marca: string | null;
  linea: string;
  alerta?: string | null;
  alPulsar: () => void;
}

function Filas({ vista, items }: { vista: VistaProductos; items: ItemProducto[] }) {
  if (vista === 'iconos') {
    return (
      <View style={{ gap: spacing[4] }}>
        {items.map((it) => (
          <TarjetaProducto
            key={it.clave}
            foto={it.foto}
            nombre={it.nombre}
            marca={it.marca}
            linea={it.linea}
            alcance={it.alerta ?? null}
            onPress={it.alPulsar}
          />
        ))}
      </View>
    );
  }
  /* LISTA — la de OPERAR. `tituloEntero` porque **el nombre es el criterio
     de elección y no se trunca**; el precio y el estado van en la línea de
     datos, que es donde el ojo los busca cuando trabaja. */
  return (
    <Tarjeta relleno="ninguno">
      {items.map((it, i) => (
        <View key={it.clave}>
          {i > 0 && <Separador />}
          <Celda
            titulo={it.nombre}
            tituloEntero
            subtitulo={
              [it.marca, it.alerta ?? null].filter((x): x is string => x !== null).join(' · ') ||
              undefined
            }
            metadataMono={it.linea}
            interactiva
            accessibilityRole="button"
            onPress={it.alPulsar}
          />
        </View>
      ))}
    </Tarjeta>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LA TARJETA — una sola forma para las dos caras. Si cada modo tuviera la
   suya, el espejo dejaría de ser espejo en su unidad más chica.
   ───────────────────────────────────────────────────────────────────────── */
function TarjetaProducto({
  foto,
  nombre,
  marca,
  linea,
  alcance = null,
  onPress,
}: {
  foto: string | null;
  nombre: string;
  marca: string | null;
  linea: string;
  alcance?: string | null;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={nombre}
      style={({ pressed }) => ({
        opacity: pressed ? 0.97 : 1,
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: theme.bg.card,
      })}
    >
      {foto === null ? (
        /* N9 · sin foto se dibuja el marcador y el producto SIGUE
           EXISTIENDO: pierde cara, no existencia. */
        <View
          style={{
            width: '100%',
            aspectRatio: 4 / 3,
            backgroundColor: theme.bg.hundido,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Texto variante="apoyo" color="tertiary">
            {t('ventas.producto.sinFoto')}
          </Texto>
        </View>
      ) : (
        <Image
          source={{ uri: foto }}
          style={{ width: '100%', aspectRatio: 4 / 3 }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}

      <View style={{ padding: spacing[4], gap: spacing[1] }}>
        {/* El nombre NO se trunca: es el criterio de elección (N19). */}
        <Texto variante="cuerpo">{nombre}</Texto>
        {marca !== null && (
          <Texto variante="apoyo" color="secondary">
            {marca}
          </Texto>
        )}
        <Texto variante="dato" color="secondary">
          {linea}
        </Texto>
        {alcance !== null && (
          <Texto variante="apoyo" color="warning">
            {alcance}
          </Texto>
        )}
      </View>
    </Pressable>
  );
}
