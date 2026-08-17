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
  TarjetaProducto,
  nombreCurado,
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

/* ☠️ ACÁ VIVIÓ `filtrarPorEspecie`, Y MURIÓ CON SU RAZÓN CUMPLIDA.
   La especie **sigue siendo filtro y no carpeta** —esa ley no cambió—, pero
   **el filtro se mudó al SERVIDOR** (`FiltrosVitrina.especie`): filtrar en
   memoria funcionaba solo mientras cabía todo el catálogo, y con página
   devolvería «no hay» sobre un producto que SÍ existe. *La función no se
   dejó «por si acaso»: un filtro de cliente conviviendo con uno de servidor
   es la puerta por la que los dos criterios divergen.* */

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
            fotoUrl={it.foto ?? undefined}
            /* 🔴 `nombreCurado` — LA MITAD QUE HACE QUE ESTO SEA UN ESPEJO.
               Sin esto el vendedor lee `CANADA LITTER` y la familia
               `Canada Litter`: el mismo producto con dos nombres. */
            nombre={nombreCurado(it.nombre)}
            marca={it.marca}
            /* `linea` ya viene compuesta por la cara (presentación ·
               stock). Entra como presentación: adoptar la pieza de la
               casa incluye adoptar su registro tipográfico — es
               exactamente lo que N17 pide, y lo contrario sería conservar
               la diferencia que veníamos a borrar. */
            presentacion={it.linea}
            precio={null}
            alcance={it.alerta ?? null}
            /* EL VENDEDOR NO COMPRA SU PROPIO PRODUCTO. No es «vitrina con
               la compra apagada»: es otro brazo del tipo, y por eso el `+`
               acá es inexpresable en vez de estar escondido. */
            compra={{ modo: 'espejo' }}
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

/* ☠️ ACÁ VIVÍA LA `TarjetaProducto` LOCAL DEL ESPEJO — JUBILADA EN S100-B.

   Su razón de existir era buena: nació ANTES que la pieza de la casa, y
   su propio comentario decía *«una sola forma para las dos caras: si cada
   modo tuviera la suya, el espejo dejaría de ser espejo en su unidad más
   chica»*. **Tenía razón y le faltaba un piso.**

   🔴 EL ARGUMENTO QUE LA JUBILA (firma de mesa, S100): esta tarjeta
   declaraba *«el nombre NO se trunca»* y la que ve la familia lo trunca a
   dos líneas. ⇒ **el vendedor veía su producto MEJOR de lo que la familia
   lo ve.**

   > ***EN UN ESPEJO, «VERSE MEJOR» ES EL DEFECTO.***

   Su argumento era correcto en aislamiento y se volvió falso en cuanto
   hubo dos caras — que es justo lo que una pieza local no puede ver.

   Y lo mismo con el NOMBRE: sin `nombreCurado` el vendedor leía
   `CANADA LITTER` donde la familia lee `Canada Litter`. **42 % del
   catálogo.** Dos superficies pintando el mismo dato y desacordando sin
   síntoma.

   Hoy monta `TarjetaProducto` de `@epetplace/ui` con `modo: 'espejo'`.
   *No se borró una pieza por prolijidad: se cerró la única grieta por la
   que el espejo podía mentir.* */
