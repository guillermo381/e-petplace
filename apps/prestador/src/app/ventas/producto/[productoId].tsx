/**
 * LA FICHA DE PRODUCTO DEL ESPEJO — N19 (el orden) + receta B §1 (la forma)
 * + N17 (una superficie, dos modos) + N18 (lo incompleto pierde alcance).
 *
 * ── POR QUÉ ESTA PANTALLA LEE EL CATÁLOGO CANÓNICO ──────────────────────
 * Monta `obtenerFichaProducto` — **el MISMO lector que ve la familia**, no
 * uno del vendedor. Eso es N17 en la capa de datos: si el espejo leyera su
 * propia fuente, mostraría *otra cosa* con la misma cara, que es peor que
 * no tener espejo. El SKU del vendedor viaja al lado **solo para la capa de
 * administración** (stock, estado, alcance) y se cruza por `variante_id`,
 * que es una llave real — jamás por nombre.
 *
 * ── LOS SEIS ESCALONES, Y LO QUE ADMINISTRAR AGREGA ──────────────────────
 * ① foto · ② nombre+presentación · ③ precio (+$/kg) · ④ composición y
 * alérgenos · ⑤ para quién sirve · ⑥ disponibilidad.
 * En `Administrar` los seis **siguen estando** y encima aparecen el estado
 * y el alcance. **Se agrega ARRIBA, jamás se reemplaza abajo** (receta §1):
 * *si administrar cambia la anatomía, el vendedor deja de ver lo que ve la
 * familia y el espejo se vuelve una tabla con otro nombre.*
 *
 * ── 🔴 LOS TRES HUECOS DECLARADOS, medidos y no supuestos ────────────────
 * ① **El carrusel a sangre 4:3 vive DENTRO de `FichaPrestador` y no está
 *    exportado** — la receta manda montar «el de la casa, no uno nuevo», y
 *    construir uno acá sería el carrusel paralelo que N17 prohíbe. Mientras
 *    tanto se pinta **la portada** en su mismo encuadre y **se DICE cuántas
 *    fotos más hay** — jamás un swipe que no swipea. *Pedido a B: extraer
 *    la pieza.*
 * ② **El `$/kg` es del modo Administrar hasta que la ficha de la familia lo
 *    tenga.** Medido: `apps/cliente` no lo pinta hoy. Mostrarlo en «Ver
 *    como cliente» le haría creer al vendedor que la familia ve algo que no
 *    ve — la falla exacta que N17 existe para evitar, en la dirección que
 *    nadie va a revisar. *Pedido a D.*
 * ③ **La advertencia de alergia REAL no se puede espejar, y se dice.** La
 *    familia ve *«Thor es alérgico al pollo»*; el vendedor no tiene un Thor
 *    y por §7.4 **no puede verlo jamás**. Así que el espejo muestra la mitad
 *    que sí es suya —el estado de la composición— y **declara en voz** que
 *    encima de eso puede haber una advertencia que él no ve. *Un espejo que
 *    calla lo que no puede mostrar miente por omisión.*
 *
 * ⚠️ **ENTRADA PENDIENTE, declarada en vez de escondida:** `SkuDelVendedor`
 * **no trae `producto_id`** (medido: cero en el wrapper), así que la lista
 * de stock todavía no puede abrir esta ficha. *Pedido a A: una línea en el
 * embed.* Se declara acá porque una pantalla sin puerta que nadie anuncia
 * es justo el defecto que esta sesión ya encontró dos veces.
 */

import { useCallback, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvisoAlergia,
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  listarSkusDelVendedor,
  obtenerFichaProducto,
  razonesDeAlcance,
  type FichaProducto,
  type RazonAlcance,
  type SkuDelVendedor,
  type VarianteDeProducto,
} from '@epetplace/api';
import { monto, type IdiomaSoportado } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { InterruptorEspejo, modoDesdeParam, type ModoEspejo } from '@/components/interruptor-espejo';
import { HojaAjusteStock } from '@/components/hoja-ajuste-stock';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { precioPorKg } from '@/lib/precio-por-kg';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'sinCuenta' }
  | {
      estado: 'listo';
      contexto: ContextoVentas;
      ficha: FichaProducto;
      /** El SKU de ESTE vendedor para este producto. `null` = el producto
       *  existe en el catálogo y él no lo ofrece — caso legítimo, no error. */
      sku: SkuDelVendedor | null;
    };

export default function FichaProductoEspejo() {
  const params = useLocalSearchParams<{ productoId: string; modo?: string }>();
  const productoId = typeof params.productoId === 'string' ? params.productoId : '';
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [modo, setModo] = useState<ModoEspejo>(modoDesdeParam(params.modo));
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  /** El SKU que se está ajustando. `null` = la Hoja no está montada. */
  const [ajustando, setAjustando] = useState<SkuDelVendedor | null>(null);

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
        /* `data: null` NO es un error: es «esta persona no tiene cuenta
           comercial», y el contrato del lector lo dice cacheándolo. */
        if (ctx.data === null) {
          setPantalla({ estado: 'sinCuenta' });
          return;
        }
        const ctxData = ctx.data;
        /* UNA ola: la ficha canónica y los SKUs del vendedor viajan juntos.
           Encadenarlos pagaría dos peajes por una sola pantalla (L-223). */
        const [rFicha, rSkus] = await Promise.all([
          obtenerFichaProducto(productoId),
          listarSkusDelVendedor(ctxData.cuentaComercialId),
        ]);
        if (!vigente) return;
        if (!rFicha.ok) {
          /* El vocabulario de errores de la despensa NO tiene un código de
             «no existe» (medido) — así que un producto retirado llega como
             `datos_inconsistentes`, igual que un fallo real. **No se
             adivina cuál es cuál**: se muestra el error honesto, que
             reintenta. Distinguirlos exige un código tipado en la fuente y
             eso es de A. */
          setPantalla({ estado: 'error' });
          return;
        }
        /* El SKU se cruza por `variante_id` — llave real. Si el lector de
           SKUs falla, la capa de administración NO se inventa: el modo
           cliente sigue siendo verdad y administrar lo dice. */
        const variantes = new Set(rFicha.data.variantes.map((v) => v.variante_id));
        const sku = rSkus.ok
          ? (rSkus.data.find((s) => variantes.has(s.variante_id)) ?? null)
          : null;
        setPantalla({ estado: 'listo', contexto: ctxData, ficha: rFicha.data, sku });
      })();
      return () => {
        vigente = false;
      };
    }, [productoId, intento]),
  );

  /* La moneda sale del contexto y el contexto solo existe en `listo` — por
     eso el formateador se arma AHÍ y no acá arriba con un default. Un
     fallback de moneda es la clase D-448: formatear a mano lo que el riel
     tiene que decidir. */
  const plataDe = (ctx: ContextoVentas) => (v: number) =>
    monto(v, ctx.moneda, idioma as IdiomaSoportado);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.producto.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {/* EL INTERRUPTOR — en el techo y FIJO (receta §2): un interruptor que
          se va con el scroll deja al vendedor sin saber en qué modo está
          justo cuando más abajo llegó. */}
      {pantalla.estado === 'listo' && (
        <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3] }}>
          <InterruptorEspejo modo={modo} onCambio={setModo} />
        </View>
      )}

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="bloque" ancho="100%" alto={200} />
            <View style={{ height: spacing[4] }} />
            <Esqueleto forma="bloque" ancho="70%" alto={24} />
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
        /* 🔴 EL FUNDIDO DEL CAMBIO DE MODO NO SE MONTA, Y NO ES UN OLVIDO.
           La receta §2 lo pide —«un fundido corto, jamás un deslizamiento
           direccional»— y la casa **no tiene su portador**: `Entrada` es la
           entrada escalonada CON desplazamiento (300 ms + translateY), o
           sea justo lo que esa línea prohíbe. Y un `FadeIn` a mano rompe el
           trinquete de §5, que existe para que las animaciones no se
           improvisen pantalla por pantalla.
           **Se sirve el cambio instantáneo** —que es exactamente lo que
           reduce-motion daría— **y se le pide a B el portador del fundido
           de modo.** *Un trinquete no se afloja por un pulido, y usar la
           pieza equivocada habría sido peor que no animar.* */
        <View key={modo} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingBottom: insets.bottom + spacing[8],
              gap: spacing[6],
            }}
          >
            {/* ═══ LO QUE ADMINISTRAR AGREGA — ARRIBA, sin tocar lo de abajo ═══ */}
            {modo === 'administrar' && (
              <CapaAdministrar sku={pantalla.sku} />
            )}

            {/* ① LA FOTO — a sangre, 4:3 (el encuadre de la casa) */}
            <FotoPortada ficha={pantalla.ficha} />

            <View style={{ paddingHorizontal: spacing[5], gap: spacing[6] }}>
              {/* ② + ③ nombre, presentación, precio, $/kg */}
              <Presentaciones
                ficha={pantalla.ficha}
                modo={modo}
                plata={plataDe(pantalla.contexto)}
              />

              {/* ④ COMPOSICIÓN Y ALÉRGENOS */}
              <Composicion ficha={pantalla.ficha} />

              {/* ⑤ PARA QUIÉN SIRVE — EL DIFERENCIAL */}
              <ParaQuienSirve ficha={pantalla.ficha} />

              {/* ⑥ DISPONIBILIDAD — y en Administrar, el AJUSTE.
                  ② de la cola: `/ventas/stock` murió y su acto vive acá,
                  donde vive el producto. */}
              <Disponibilidad
                sku={pantalla.sku}
                modo={modo}
                alAjustar={() => setAjustando(pantalla.sku)}
              />
            </View>
          </ScrollView>
        </View>
      )}

      {/* LA HOJA DEL AJUSTE — vive fuera del `key={modo}` a propósito: si
          viviera adentro, cambiar de modo con la Hoja abierta la
          desmontaría y se perdería lo tipeado. *El modo cambia CÓMO se
          mira; no puede cancelar un acto en curso.* Al guardar se re-lee,
          porque el stock que muestra la ficha lo trae el mismo lector. */}
      <HojaAjusteStock
        sku={ajustando}
        onCerrar={() => setAjustando(null)}
        onGuardado={() => {
          setAjustando(null);
          setIntento((n) => n + 1);
        }}
      />
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ① LA FOTO — portada en el encuadre del carrusel, con su hueco declarado.
   ───────────────────────────────────────────────────────────────────────── */
function FotoPortada({ ficha }: { ficha: FichaProducto }) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const otras = ficha.fotos.length;

  if (ficha.foto_url === null) {
    /* N9 · el vacío HABLA: sin foto la vitrina dibuja marcador y el
       producto SIGUE EXISTIENDO — pierde cara, no existencia. */
    return (
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
    );
  }

  return (
    <View>
      <Image
        source={{ uri: ficha.foto_url }}
        style={{ width: '100%', aspectRatio: 4 / 3 }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {otras > 0 && (
        /* Se DICE cuántas fotos más hay en vez de fingir un carrusel que
           todavía no es pieza. Un swipe que no swipea enseña que la
           pantalla está rota. */
        <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[2] }}>
          <Texto variante="dato" color="tertiary">
            {t('ventas.producto.masFotos', { n: otras })}
          </Texto>
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ② + ③ NOMBRE · PRESENTACIÓN · PRECIO · $/kg
   ───────────────────────────────────────────────────────────────────────── */
function Presentaciones({
  ficha,
  modo,
  plata,
}: {
  ficha: FichaProducto;
  modo: ModoEspejo;
  plata: (v: number) => string;
}) {
  const { t } = useTraduccion();
  return (
    <View style={{ gap: spacing[4] }}>
      {/* El nombre NO se trunca: es el criterio de elección (N19/receta ②) */}
      <View style={{ gap: spacing[1] }}>
        <Texto variante="titulo">{ficha.nombre}</Texto>
        {ficha.marca !== null && (
          <Texto variante="apoyo" color="secondary">
            {ficha.marca}
          </Texto>
        )}
      </View>

      {ficha.variantes.map((v) => (
        <FilaPresentacion key={v.variante_id} v={v} modo={modo} plata={plata} />
      ))}

      {ficha.variantes.length === 0 && (
        <Texto variante="apoyo" color="tertiary">
          {t('ventas.producto.sinPresentaciones')}
        </Texto>
      )}
    </View>
  );
}

function FilaPresentacion({
  v,
  modo,
  plata,
}: {
  v: VarianteDeProducto;
  modo: ModoEspejo;
  plata: (n: number) => string;
}) {
  const { t } = useTraduccion();
  const porKg = precioPorKg(v.precio, v.peso_kg);

  return (
    <View style={{ gap: spacing[1] }}>
      <Texto variante="cuerpo">{v.presentacion}</Texto>
      {v.precio === null ? (
        /* NULO HONESTO: la variante existe y hoy no se puede comprar.
           Decir $0 sería mentir; esconderla, esconder catálogo. */
        <Texto variante="apoyo" color="tertiary">
          {t('ventas.producto.sinPrecio')}
        </Texto>
      ) : (
        <Texto variante="titulo">{plata(v.precio)}</Texto>
      )}
      {/* EL PRECIO POR KILO — mono porque es un CÁLCULO (Ley 3), y esa
          diferencia tipográfica es justo su valor: nadie lo pone, nosotros
          sí. Modo administrar hasta que la ficha de la familia lo tenga
          (hueco ② de la cabecera). */}
      {modo === 'administrar' && porKg !== null && (
        <Texto variante="dato" color="secondary">
          {t('ventas.producto.porKg', { monto: plata(porKg) })}
        </Texto>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ④ COMPOSICIÓN Y ALÉRGENOS
   ───────────────────────────────────────────────────────────────────────── */
function Composicion({ ficha }: { ficha: FichaProducto }) {
  const { t } = useTraduccion();
  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="seccion">{t('ventas.producto.composicionTitulo')}</Texto>

      {/* La pieza de la casa con sus cuatro estados. NO se le pasa una prop
          para apagarla: la letra manda *sin composición declarada se DICE*,
          y `verificada`/`no_aplica` son los dos únicos silencios. */}
      <AvisoAlergia
        composicion={ficha.composicion_estado}
        coincidencia="ninguna"
        mensaje={t('ventas.producto.composicionSinDeclarar')}
      />

      {ficha.alergenos.length > 0 && (
        <Texto variante="cuerpo" color="secondary">
          {t('ventas.producto.alergenos', { lista: ficha.alergenos.join(' · ') })}
        </Texto>
      )}

      {/* EL LÍMITE DEL ESPEJO, DICHO (hueco ③): la advertencia por mascota
          no se puede mostrar acá y callarlo sería mentir por omisión. */}
      <Texto variante="apoyo" color="tertiary">
        {t('ventas.producto.limiteEspejoAlergia')}
      </Texto>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ⑤ PARA QUIÉN SIRVE — EL DIFERENCIAL, y por eso NO es una tabla.
   «Especie: perro · Etapa: adulto» sería FilaDato, y ahí el diferencial
   deja de leerse como que la app conoce a la mascota (receta ⑤).
   ───────────────────────────────────────────────────────────────────────── */
function ParaQuienSirve({ ficha }: { ficha: FichaProducto }) {
  const { t } = useTraduccion();

  const especies = ficha.especies_aplicables
    .map((e) => t(`ventas.producto.especie_${e}` as 'ventas.producto.especie_perro'))
    .filter((v) => v.length > 0);
  const momentos = ficha.momentos_aplicables
    .map((m) => t(`ventas.producto.momento_${m}` as 'ventas.producto.momento_adulto'))
    .filter((v) => v.length > 0);

  /* Vacío NO es «para todos»: es que el catálogo canónico todavía no lo
     declaró — la misma lectura que hace `razonesDeAlcance` con
     `sin_momento_etario`. Inventar «todas las edades» sería fabricar un
     dato que nadie escribió. */
  const frase =
    especies.length === 0
      ? t('ventas.producto.paraQuienSinEspecie')
      : momentos.length === 0
        ? t('ventas.producto.paraQuienSinMomento', { especies: unir(especies, t('ventas.comunes.y')) })
        : t('ventas.producto.paraQuien', {
            especies: unir(especies, t('ventas.comunes.y')),
            momentos: unir(momentos, t('ventas.comunes.y')),
          });

  return (
    <View style={{ gap: spacing[2] }}>
      <Texto variante="seccion">{t('ventas.producto.paraQuienTitulo')}</Texto>
      <Texto variante="voz">{frase}</Texto>
    </View>
  );
}

/** 'a, b y c' — el conector viaja por el riel (Intl.ListFormat no está
 *  garantizado en Hermes; misma decisión que `espejo-oferta`). */
function unir(items: string[], y: string): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ${y} ${items[items.length - 1]}`;
}

/* ─────────────────────────────────────────────────────────────────────────
   ⑥ DISPONIBILIDAD — el vacío HABLA y el producto JAMÁS desaparece (N9).
   ───────────────────────────────────────────────────────────────────────── */
function Disponibilidad({
  sku,
  modo,
  alAjustar,
}: {
  sku: SkuDelVendedor | null;
  modo: ModoEspejo;
  alAjustar: () => void;
}) {
  const { t } = useTraduccion();

  if (sku === null) {
    return (
      <View style={{ gap: spacing[2] }}>
        <Texto variante="seccion">{t('ventas.producto.disponibilidadTitulo')}</Texto>
        <Texto variante="cuerpo" color="secondary">
          {t('ventas.producto.noLoOfreces')}
        </Texto>
      </View>
    );
  }

  const hay = sku.stock_disponible > 0;
  return (
    <View style={{ gap: spacing[2] }}>
      <Texto variante="seccion">{t('ventas.producto.disponibilidadTitulo')}</Texto>
      <Texto variante="cuerpo" color={hay ? 'secondary' : 'warning'}>
        {hay
          ? t('ventas.producto.hayStock', { n: sku.stock_disponible })
          : t('ventas.producto.sinStock')}
      </Texto>
      {/* La vitrina NO esconde lo sin stock (medido en `razonesDeAlcance`):
          la compra rebota en la reserva. El vendedor tiene que saber que se
          sigue viendo. */}
      {!hay && modo === 'administrar' && (
        <Texto variante="apoyo" color="tertiary">
          {t('ventas.producto.sinStockSeSigueViendo')}
        </Texto>
      )}
      {/* LO RESERVADO — la otra mitad que la lista muerta mostraba y que
          había que traer: **explica por qué «disponible» es menos de lo
          que hay en el depósito**. Sin esto, un vendedor que cuenta 10
          bolsas y lee «7 disponibles» concluye que el número está roto.
          Con cero reservas no se dibuja: un cero acá no informa nada. */}
      {modo === 'administrar' && sku.stock_reservado > 0 && (
        <Texto variante="apoyo" color="tertiary">
          {t('ventas.stock.reservadas', { n: sku.stock_reservado })}
        </Texto>
      )}
      {/* EL AJUSTE — solo en Administrar, y **debajo del número**: se toca
          después de leer cuánto hay, que es el orden en que se cuenta. En
          «Ver como cliente» no se dibuja, y no por permisos: **la familia
          no ajusta stock, así que el espejo no puede mostrarlo** (N17). */}
      {modo === 'administrar' && (
        <View style={{ alignSelf: 'flex-start', paddingTop: spacing[1] }}>
          <Boton
            variante="secundario"
            tamaño="sm"
            etiqueta={t('ventas.stock.ajustarCta')}
            onPress={alAjustar}
          />
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LA CAPA DE ADMINISTRAR — estado con su porqué + alcance (N18)
   ───────────────────────────────────────────────────────────────────────── */
function CapaAdministrar({ sku }: { sku: SkuDelVendedor | null }) {
  const { t } = useTraduccion();

  if (sku === null) return null;

  const razones = razonesDeAlcance(sku);
  /* EL CONTADOR ES SOLO LO SUYO — la ley de N18 vive en el wrapper y acá se
     LEE, no se re-implementa: `dueno === 'vendedor'`. Lo de e-PetPlace
     viaja como información CON SU DUEÑO DICHO, jamás sumando a un número
     que él no puede bajar. *Un contador que incluye lo ajeno no se puede
     llevar a cero, y un contador que no llega a cero deja de mirarse.* */
  const mias = razones.filter((r) => r.dueno === 'vendedor');
  const suyas = razones.filter((r) => r.dueno === 'epetplace');

  return (
    <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
      {/* EL BORDE propuesto/publicada — con su porqué cuando lo hay */}
      <Tarjeta relleno="normal" elevacion="reposo">
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t(vozEstado(sku))}</Texto>
          {sku.motivo_rechazo !== null && (
            <Texto variante="cuerpo" color="danger">
              {sku.motivo_rechazo}
            </Texto>
          )}
        </View>
      </Tarjeta>

      {(mias.length > 0 || suyas.length > 0) && (
        <Tarjeta relleno="normal" elevacion="reposo">
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">
              {mias.length === 0
                ? t('ventas.producto.alcanceCompleto')
                : t('ventas.producto.alcanceFaltan', { n: mias.length })}
            </Texto>

            {mias.map((r) => (
              <Texto key={r.codigo} variante="cuerpo">
                {t(vozRazon(r))}
              </Texto>
            ))}

            {suyas.length > 0 && (
              <View style={{ gap: spacing[1] }}>
                {/* CON SU DUEÑO DICHO: el vendedor no puede arreglarlo y
                    tiene derecho a saber que no es su deuda. */}
                <Texto variante="apoyo" color="tertiary">
                  {t('ventas.producto.alcanceNuestro')}
                </Texto>
                {suyas.map((r) => (
                  <Texto key={r.codigo} variante="apoyo" color="tertiary">
                    {t(vozRazon(r))}
                  </Texto>
                ))}
              </View>
            )}
          </View>
        </Tarjeta>
      )}
    </View>
  );
}

/** La voz del estado del SKU. El diccionario decide; la pantalla no arma
 *  frases sobre el modelo. */
function vozEstado(sku: SkuDelVendedor): 'ventas.producto.estadoPublicada' {
  if (sku.estado === 'rechazado') return 'ventas.producto.estadoRechazado' as never;
  if (sku.estado === 'propuesto' || sku.estado === 'en_revision')
    return 'ventas.producto.estadoEnRevision' as never;
  if (sku.oferta_estado === 'publicada') return 'ventas.producto.estadoPublicada';
  if (sku.oferta_estado === null) return 'ventas.producto.estadoSinOferta' as never;
  return 'ventas.producto.estadoNoPublicada' as never;
}

/** Una voz por código — los ocho de `RazonAlcance`, sin fallback genérico:
 *  si mañana nace un código nuevo, el typecheck lo pide (N12.4 · R44). */
function vozRazon(r: RazonAlcance): 'ventas.producto.razon_sku_rechazado' {
  return `ventas.producto.razon_${r.codigo}` as 'ventas.producto.razon_sku_rechazado';
}
