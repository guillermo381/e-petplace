/**
 * LAS PIEZAS DE LA VITRINA — lo presentacional, extraído cuando la vitrina
 * dejó de ser una pantalla y pasó a ser **una sección de «Tu tienda»**
 * (firma del founder, 16-ago: una sola pantalla con dos secciones).
 *
 * ── POR QUÉ SE EXTRAJO Y NO SE COPIÓ ────────────────────────────────────
 * La decisión que sostiene el espejo es **el renderer único**: *cambiar de
 * modo cambia CÓMO se ve, jamás QUÉ se ve*. Si al mudar la vitrina a «Tu
 * tienda» sus dos caras hubieran quedado dibujadas por código distinto, el
 * espejo se habría roto en su unidad más chica y **nadie lo habría notado
 * hasta ver una diferencia en producción**. Extraer es lo que garantiza
 * que sigan siendo la misma pieza.
 *
 * Acá vive lo que NO tiene estado: el filtro por especie, las dos caras,
 * el renderer de filas/íconos y la tarjeta. **El estado —modo, vista,
 * búsqueda, ventana— vive en la pantalla**, que es quien tiene el scroll.
 */

import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import {
  Celda,
  EstadoVacio,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  radius,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  razonesDeAlcance,
  type ConteosVitrina,
  type ProductoDeVitrina,
  type RazonAlcance,
  type SkuDelVendedor,
} from '@epetplace/api';
import { monto, type IdiomaSoportado } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import type { ContextoVentas } from '@/lib/cuenta-ventas';

/** El código que representa «todas las especies» en el filtro. */
export const TODAS = '__todas__';

/** LISTA ⇄ ÍCONOS (receta B §A2). **El default es LISTA y es decisión:**
 *  Stock es donde el vendedor TRABAJA, y la ley de la casa ya lo dice —
 *  *tarjetas para elegir, filas para leer*. La grilla sirve para
 *  reconocer por la foto; la fila, para operar. */
export type VistaProductos = 'lista' | 'iconos';

/** LA ESPECIE ES FILTRO: acota la lista, no la reparte en carpetas. */
export function filtrarPorEspecie(productos: ProductoDeVitrina[], especie: string): ProductoDeVitrina[] {
  if (especie === TODAS) return productos;
  return productos.filter((p) => p.especies_aplicables.includes(especie));
}

export function FiltroEspecie({
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
export function CaraCliente({
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
export function CaraAdministrar({
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
          const mias = razonesDeAlcance(s).filter((r) => r.dueno === 'vendedor');
          return {
            clave: s.sku_id,
            foto: s.foto_portada,
            nombre: s.producto_nombre,
            marca: s.producto_marca,
            /* 🔴 EL STOCK SUBE A LA FILA, y es lo que hace que matar
               `/ventas/stock` NO pierda nada. Esa pantalla daba una cosa
               que la ficha no da: **cuánto tengo de TODO, de un vistazo**.
               Si el ajuste se mudaba a la ficha sin traer el número acá,
               la consolidación habría cambiado una lista de más por una
               ceguera. *Mudar un acto no autoriza a perder la vista de
               conjunto que lo hacía útil.* */
            linea: `${s.presentacion} · ${t('ventas.stock.disponibles', { n: s.stock_disponible })}`,
            /* 🔴 EL VEREDICTO SE RESUME EN LA LISTA, Y EL RESUMEN CAMBIA DE
               FORMA SEGÚN CUÁNTOS SEAN — **medido, no elegido**. Contra la
               base viva, el vendedor con volumen tiene **532 SKUs y 113 con
               rojo (21 %)**, y de esos **109 llevan UNA sola razón**; solo 4
               llevan dos y ninguno tres.
               ⇒ **con UNA razón se dice CUÁL, no cuántas.** «Le faltan 1»
               ocupa el mismo lugar que «Sin stock» y dice estrictamente
               menos: obliga a entrar para saber qué falta, en el 96 % de
               los casos con rojo. *Un contador que casi siempre dice 1 no
               es un contador: es una marca que además hace preguntar.*
               Con 2+ el número vuelve a ser lo correcto —ahí sí resume— y
               **el literal completo vive en la ficha**, que es la frontera
               VEREDICTO/HUECO tal como estaba escrita. */
            alerta:
              mias.length === 1
                ? t(etiquetaCorta(mias[0]))
                : mias.length > 1
                  ? t('ventas.vitrina.leFaltan', { n: mias.length })
                  : null,
            alPulsar: () => alAbrir(s.producto_id),
          };
        })}
      />
    </View>
  );
}

/** LA ETIQUETA CORTA DE UNA RAZÓN — para la FILA, no para la ficha.
 *
 *  Las voces de `ventas.producto.razon_*` son frases con su camino
 *  («Corregilo según el motivo y volvé a proponerlo») y **ahí está bien**:
 *  la ficha tiene lugar y es donde se actúa. **En la fila hay una línea
 *  compartida con la marca**, así que la misma razón necesita su nombre y
 *  no su instrucción. *Dos registros de la misma verdad, cada uno del
 *  tamaño de su casa — no es duplicar la voz: es que un rótulo y una
 *  indicación no son la misma cosa.*
 *
 *  Solo cubre las TRES razones del vendedor (`dueno: 'vendedor'`), que son
 *  las únicas que llegan acá; el `switch` es total sobre ellas y las de
 *  e-PetPlace caen al contador, donde no molestan. */
function etiquetaCorta(r: RazonAlcance): 'ventas.vitrina.falta_sin_stock' {
  switch (r.codigo) {
    case 'sku_rechazado':
      return 'ventas.vitrina.falta_sku_rechazado' as never;
    case 'sin_precio_propuesto':
      return 'ventas.vitrina.falta_sin_precio_propuesto' as never;
    default:
      return 'ventas.vitrina.falta_sin_stock';
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   LOS DOS MODOS DE VER — una sola entrada de datos, dos formas (receta §A2).
   *Tarjetas para elegir, filas para leer.* Que las dos caras del espejo
   pasen por acá es lo que garantiza que cambiar de modo no cambie QUÉ se
   ve, solo CÓMO — si cada cara tuviera su renderer, el espejo se rompería
   en el detalle más chico.
   ───────────────────────────────────────────────────────────────────────── */
export interface ItemProducto {
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
