/**
 * HojaFiltrosDespensa — LOS FILTROS DE LA VITRINA, EN UN SOLO CONTROL.
 *
 * ── POR QUÉ EXISTE (C-02, firma de mesa 18-ago-2026) ────────────────────
 * El founder, sobre la OTA `fbd7b6e0`: dos escalones de chips y ***«con el
 * teclado desplegado no veo absolutamente nada más»***.
 *
 * **Medido con aparato antes de tocar** (384×832, cuenta +8, 18-ago):
 * las dos filas de `FiltroPills` cuestan **60 + 60 dp más sus dos gaps =
 * 132 dp**, sobre un cromo total de 317 dp — o sea **el 42 % de todo lo
 * que se gasta antes del primer producto**. Con el teclado arriba
 * (~260 dp, SUPUESTO declarado — RN-web no abre teclado) quedaban **275 dp
 * para mercadería**, menos que una tarjeta de 332.
 *
 * **La razón que lo vuelve firma y no gusto: son 563 productos.** Los
 * chips no escalan — muestran las facetas de lo cargado y crecen con el
 * catálogo. Patrón de Instacart y Mercado Libre: **un control, una hoja.**
 *
 * ── LO QUE ESTA HOJA NO HACE, y hay que decirlo ─────────────────────────
 * 🔴 **NO recorta función: la ensancha.** Mi predecesora decidió NO fundir
 * las dos filas *«porque fundirlas daría un solo filtro activo a la vez»*,
 * y tenía razón con la letra que tenía. Acá los cinco ejes son
 * **independientes y simultáneos** —categoría · especie · marca ·
 * presentación · precio—, y tres de ellos **hoy no existen**.
 *
 * ⚠️ **LAS FACETAS SON DE LO CARGADO, NO DEL CATÁLOGO.** La vitrina trae
 * 50 de 563, así que estos filtros parten lo que está en pantalla. **Es la
 * misma semántica que ya tenían los chips** —no se cambia acá— pero se
 * escribe, porque un filtro que parece del catálogo y es de la página
 * miente sin que nadie lo note. *Filtrar el catálogo entero es del
 * servidor, y sería otra cosa.*
 *
 * ── LAS LEYES QUE LA GOBIERNAN ──────────────────────────────────────────
 * · **N21** (superficies): cada eje es un grupo con rótulo propio ⇒ *el
 *   rótulo declara el grupo*. Acá NO llevan carta: son secciones de una
 *   hoja, y la hoja YA es la superficie. *La ley pide una superficie por
 *   grupo, no una por elemento* — anidar cartas adentro de una carta es
 *   exactamente lo que su regla de oro prohíbe.
 * · **N23** (el color marca clase): los chips no tiñen para destacar; el
 *   acento lo pone `FiltroPills` en lo ELEGIDO, que es estado.
 * · **Ley 23 · el principio de la puerta**: *la puerta no ofrece lo que va
 *   a rechazar.* **Un eje que no parte los datos NO SE DIBUJA** (censo
 *   S82), y una opción con cero productos tampoco.
 * · **19.7**: en el pie UN sólido. «Limpiar» baja a label y vive arriba.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Boton, FiltroPills, Hoja, Texto, spacing } from '@epetplace/ui';
import type { ProductoDeVitrina } from '@epetplace/api';
import { useTraduccion } from '@/i18n';

/**
 * Los cinco ejes. `null` = sin filtrar en ese eje. **Es un objeto y no
 * cinco estados sueltos a propósito**: contar cuántos hay activos,
 * limpiarlos y pasarlos a la hoja son operaciones sobre EL conjunto, y con
 * cinco `useState` separados cada una se escribe cinco veces — y la sexta
 * se olvida.
 */
export interface FiltrosDespensa {
  familia: string | null;
  especie: string | null;
  marca: string | null;
  presentacion: string | null;
  /** La CLAVE del tramo (`hasta10` · `de10a25` · `de25a50` · `mas50`),
   *  jamás el número: el tramo se nombra en el diccionario y su corte vive
   *  en `TRAMOS_PRECIO`. */
  precio: string | null;
}

export const SIN_FILTROS: FiltrosDespensa = {
  familia: null,
  especie: null,
  marca: null,
  presentacion: null,
  precio: null,
};

export function contarFiltrosActivos(f: FiltrosDespensa): number {
  return Object.values(f).filter((v) => v !== null).length;
}

/**
 * 🔴 LOS TRAMOS DE PRECIO — cortes FIJOS y declarados, no cuantiles.
 *
 * Se probó pensarlo por cuartiles de lo cargado y se descartó: **un tramo
 * cuyo corte cambia con la página deja de ser el mismo filtro entre dos
 * búsquedas**, y el rótulo diría «hasta $12» en una pantalla y «hasta $31»
 * en la siguiente sin que nadie tocara nada. Cortes fijos son peores
 * estadísticamente y **legibles**, que es lo que un filtro necesita.
 *
 * ⚠️ Están en USD porque la despensa v1 es Ecuador/USD por firma
 * (`MODELO_DESPENSA`). El día que entre otra moneda, esto se parametriza:
 * se declara acá para que ese día se encuentre esta nota.
 */
const TRAMOS_PRECIO: { clave: string; min: number; max: number | null }[] = [
  { clave: 'hasta10', min: 0, max: 10 },
  { clave: 'de10a25', min: 10, max: 25 },
  { clave: 'de25a50', min: 25, max: 50 },
  { clave: 'mas50', min: 50, max: null },
];

export function precioEnTramo(precio: number, clave: string): boolean {
  const t = TRAMOS_PRECIO.find((x) => x.clave === clave);
  if (t === undefined) return true;
  return precio >= t.min && (t.max === null || precio < t.max);
}

/** Aplica los cinco ejes. Vive acá y no en la pantalla para que **el
 *  filtro y la hoja que lo ofrece no puedan divergir**: quien agregue un
 *  eje toca un solo archivo o no compila. */
export function aplicarFiltros(
  lista: ProductoDeVitrina[],
  f: FiltrosDespensa,
): ProductoDeVitrina[] {
  return lista.filter(
    (p) =>
      (f.familia === null || p.familia_codigo === f.familia) &&
      (f.especie === null || p.especies_aplicables.includes(f.especie)) &&
      (f.marca === null || p.marca === f.marca) &&
      (f.presentacion === null || p.presentacion === f.presentacion) &&
      (f.precio === null || precioEnTramo(p.precio, f.precio)),
  );
}

interface Props {
  visible: boolean;
  onCerrar: () => void;
  /** La lista SIN filtrar — de ella salen las facetas. */
  lista: ProductoDeVitrina[];
  filtros: FiltrosDespensa;
  onCambio: (f: FiltrosDespensa) => void;
  /** Con mascota elegida el eje ESPECIE no se ofrece: su especie ya es el
   *  criterio del motor, y ofrecerlo invita a contradecirlo. */
  ocultarEspecie: boolean;
  /** Voces de los códigos de motor — las resuelve la pantalla, que es
   *  quien tiene el diccionario del catálogo (Ley 3: cero códigos de
   *  motor en la superficie). `null` = código sin voz ⇒ no se dibuja. */
  vozFamilia: (codigo: string) => string | null;
  vozEspecie: (codigo: string) => string | null;
}

export function HojaFiltrosDespensa({
  visible,
  onCerrar,
  lista,
  filtros,
  onCambio,
  ocultarEspecie,
  vozFamilia,
  vozEspecie,
}: Props) {
  const { t } = useTraduccion();

  /** Las opciones de cada eje, **con su conteo**, derivadas de lo cargado.
   *  Un eje con una sola opción no parte nada y no se dibuja. */
  const ejes = useMemo(() => {
    const porClave = <T,>(vals: T[]) => [...new Set(vals)];
    const familias = porClave(lista.map((p) => p.familia_codigo))
      .map((c) => ({ codigo: c, etiqueta: vozFamilia(c), icono: null }))
      .filter((x): x is { codigo: string; etiqueta: string; icono: null } => x.etiqueta !== null);
    const especies = porClave(lista.flatMap((p) => p.especies_aplicables))
      .map((c) => ({ codigo: c, etiqueta: vozEspecie(c), icono: null }))
      .filter((x): x is { codigo: string; etiqueta: string; icono: null } => x.etiqueta !== null);
    const marcas = porClave(lista.map((p) => p.marca).filter((m): m is string => m !== null))
      .sort((a, b) => a.localeCompare(b))
      .map((m) => ({ codigo: m, etiqueta: m, icono: null }));
    const presentaciones = porClave(lista.map((p) => p.presentacion))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((m) => ({ codigo: m, etiqueta: m, icono: null }));
    // Un tramo sin un solo producto NO se ofrece (Ley 23).
    const precios = TRAMOS_PRECIO.filter((tr) =>
      lista.some((p) => precioEnTramo(p.precio, tr.clave)),
    ).map((tr) => ({ codigo: tr.clave, etiqueta: t(`despensa.precio_${tr.clave}` as never), icono: null }));
    return { familias, especies, marcas, presentaciones, precios };
  }, [lista, vozFamilia, vozEspecie, t]);

  const activos = contarFiltrosActivos(filtros);
  const cuantos = aplicarFiltros(lista, filtros).length;

  /** Una sección = un rótulo + su tira. **Se dibuja solo si su eje parte
   *  los datos** (más de una opción): ofrecer un filtro de una sola
   *  opción es una puerta que no lleva a ningún lado.
   *
   * ══════════════════════════════════════════════════════════════════════
   * 🔴 S100d-C · punto ④ · **EL RÓTULO DICE CUÁNTAS OPCIONES TIENE EL EJE —
   * Y ESTO ES LA MITAD DE LA CURA, NO LA CURA.**
   * ══════════════════════════════════════════════════════════════════════
   *
   * **El gate, verbatim:** *«Modal de filtro genial. PERO chips sin
   * visibilidad horizontal»*.
   *
   * **Medido con aparato propio (18-ago, 384×832, la hoja abierta) — y el
   * número es el hallazgo, no la queja:**
   *
   * | eje | opciones | se ve | queda fuera |
   * |---|---|---|---|
   * | Categoría | 3 | 89 % | 42 dp |
   * | Especie | 5 | 78 % | 97 dp |
   * | **Marca** | **13** | **22 %** | **1254 dp** |
   * | **Presentación** | **15** | **23 %** | **1149 dp** |
   * | Precio | 4 | 77 % | 106 dp |
   *
   * 🔴 **Y LO PRIMERO QUE SE HIZO FUE TRATAR DE FALSAR LA CAUSA CÓMODA:**
   * se probó si el DOM deja scrollear la tira (**sí, las cinco**) y si el
   * evento de rueda la mueve (**sí, las cinco**). ⇒ **la tira NO está
   * rota**, y mandar a arreglar el scroll habría sido curar algo que
   * funciona. *La mitad obvia de la cura era la que no hacía falta.*
   *
   * **Lo que queda es de FORMA: en una hoja dedicada a filtrar, un riel
   * horizontal esconde el 78 % de un eje y no dice cuánto esconde.** Aunque
   * el dedo llegue, encontrar «Royal Canin» son 1254 dp de arrastre — eso
   * no es filtrar, es buscar a ciegas.
   *
   * **Esto —el conteo en el rótulo— no acerca un solo chip.** Lo que hace
   * es **convertir un truncado silencioso en uno declarado**, que es la
   * misma ley que la vitrina ya cumple al pie de su grilla con *«Mostramos
   * 50 de 563»*. *Un eje que muestra cuatro de trece y no lo dice se lee
   * como un eje de cuatro.*
   *
   * ⏳ **LA OTRA MITAD ESTÁ PEDIDA A B Y NO ES MÍA:** que `FiltroPills`
   * acepte que el consumidor declare su disposición —`'tira'` (hoy,
   * default) · `'envuelve'` (un `flexWrap`, mismos chips, misma pata)—, el
   * mismo ensanche que `SelectorOpcion` tiene firmado desde S55. **Se le
   * pidió a B con esta medición adentro.**
   *
   * ⚖️ **Y lo que se DESCARTÓ, para que no se reintente:** montar
   * `SelectorOpcion disposicion="grilla"`, que envuelve y ya existe. *Es la
   * salida barata y cambia la anatomía que el founder acaba de aprobar
   * («modal de filtro genial») — una regresión que ningún instrumento caza,
   * porque lo que se rompe es una aprobación y no un build.*
   *
   * ⚠️ **Segunda mitad NO medida y declarada sin veredicto:** `Hoja` monta
   * su contenido en un `ScrollView` de gesture-handler con un
   * `Gesture.Pan` que arrastra la hoja, y `FiltroPills` usa un `ScrollView`
   * de react-native a secas — en el teléfono ese pan **podría** ganarle al
   * arrastre horizontal. RN-web no reproduce ese gesto. *No se afirma que
   * pase; se deja escrito porque si pasa, envolver lo mata de raíz.* */
  function seccion(
    titulo: string,
    opciones: { codigo: string; etiqueta: string; icono: null }[],
    activo: string | null,
    set: (v: string | null) => void,
  ) {
    if (opciones.length < 2) return null;
    return (
      <View style={{ gap: spacing[2] }}>
        <Texto variante="seccion">
          {t('despensa.filtroEjeCon', { titulo, n: opciones.length })}
        </Texto>
        {/* ✅ `envuelve` — la otra mitad del punto ④, servida por B con la
            medición de arriba adentro. **Mismos chips, misma pata, mismo
            aire**: lo único que cambia es dónde caen. Con esto el eje
            «Marca» pasa de mostrar 4 de 13 a mostrarlos todos, y **la
            segunda mitad no medida —el pan de la `Hoja` compitiendo con el
            arrastre horizontal— deja de poder ocurrir: sin gesto
            horizontal no hay con qué competir.** */}
        <FiltroPills
          opciones={opciones}
          activo={activo}
          onCambio={set}
          onLimpiar={() => set(null)}
          disposicion="envuelve"
        />
      </View>
    );
  }

  return (
    <Hoja
      visible={visible}
      onCerrar={onCerrar}
      titulo={t('despensa.filtrosTitulo')}
      altura="completa"
      conCerrar
      /* 19.7 · UN sólido en el pie: el compromiso. El número va ADENTRO
         del CTA porque es lo que la persona está por aceptar — *un botón
         que dice cuántos vas a ver es la promesa verificable de lo que
         pasa al tocarlo.* */
      pie={
        <Boton
          variante="primario"
          bloque
          etiqueta={t('despensa.filtrosVer', { n: cuantos })}
          onPress={onCerrar}
        />
      }
    >
      <View style={{ gap: spacing[5] }}>
        {/* «Limpiar» NO es el compromiso ⇒ no va al pie (19.7). Y solo
            existe cuando hay algo que limpiar: un control que no puede
            hacer nada no se dibuja apagado, se ausenta. */}
        {activos > 0 ? (
          <Boton
            variante="apoyada"
            etiqueta={t('despensa.filtrosLimpiar', { n: activos })}
            onPress={() => onCambio(SIN_FILTROS)}
          />
        ) : null}

        {seccion(t('despensa.filtroCategoria'), ejes.familias, filtros.familia, (v) =>
          onCambio({ ...filtros, familia: v }),
        )}
        {ocultarEspecie
          ? null
          : seccion(t('despensa.filtroEspecie'), ejes.especies, filtros.especie, (v) =>
              onCambio({ ...filtros, especie: v }),
            )}
        {seccion(t('despensa.filtroMarca'), ejes.marcas, filtros.marca, (v) =>
          onCambio({ ...filtros, marca: v }),
        )}
        {seccion(t('despensa.filtroPresentacion'), ejes.presentaciones, filtros.presentacion, (v) =>
          onCambio({ ...filtros, presentacion: v }),
        )}
        {seccion(t('despensa.filtroPrecio'), ejes.precios, filtros.precio, (v) =>
          onCambio({ ...filtros, precio: v }),
        )}
      </View>
    </Hoja>
  );
}
