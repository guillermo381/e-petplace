/**
 * DESCUBRIR — LA VITRINA QUE SABE A QUIÉN ALIMENTA (S95-I, ensanchada en
 * S96-D · D-B1/D-B2 · `LETRA_RECORRIDO_DESPENSA_S96` §5 · `MODELO_DESPENSA`
 * §4.1 aclarada).
 *
 * TESIS (Ley 14): *la despensa ya sabe qué puede comer tu mascota.*
 *
 * FIRMA (Ley 15): `CriterioMascota` — la cara real preside y la razón se
 * DICE (S95-I, intacta). Lo nuevo de S96 no cambia la firma: la sirve —
 * el buscador y los filtros son alcance, el criterio sigue siendo de la
 * mascota.
 *
 * LO QUE S96 AGREGA, con su letra:
 *  · EL BUSCADOR (§5.1 — "acá no se inventa la rueda"): entra porque el
 *    catálogo dejó de estar en cero (la razón por la que S95-I no lo
 *    montó, declarada en su header, MURIÓ con los seis productos reales).
 *  · FILTROS por familia y especie, DERIVADOS de lo cargado (facetas del
 *    dato vivo, jamás una lista hardcodeada que prometa lo que no hay).
 *  · SIN MASCOTA SE MUESTRA TODO (§5.2): seis especies. Elegir la mascota
 *    ENCIENDE el criterio, no es peaje para entrar.
 *  · 🔴 LA ADVERTENCIA EN LA BÚSQUEDA (§5.4): buscar puede traer lo que la
 *    recomendación excluyó — acá NO se esconde: la fila lo dice ("Contiene
 *    pollo") y la ficha exige el paso explícito. La exclusión dura sigue
 *    siendo SOLO de la recomendación (el motor, jamás esta pantalla).
 *  · Las puertas de "Tus pedidos" y del código del local (§8.1 · §4).
 *
 * ── LA ENTRADA TIENE DOS PUERTAS (§5.1) ─────────────────────────────────
 * El tab da ALCANCE, el expediente da CRITERIO. La entrada desde la
 * mascota llega con `mascotaId` en la URL y preselecciona su eje.
 *
 * ── DÓNDE **NO** OCURRE LA EXCLUSIÓN ────────────────────────────────────
 * Acá (S95-I, sin cambios): `recomendarParaMascota` pega los predicados a
 * la consulta y VERIFICA fail-closed. Esta pantalla jamás filtra por
 * alérgeno en memoria — ni siquiera en la búsqueda: en la búsqueda
 * ADVIERTE, que es lo contrario de filtrar.
 *
 * ESCALERA (§4b): peldaño 0 = sin mascota, todo publicado con buscador y
 * filtros · peldaño 1 = con mascota, la recomendación del motor · peldaño
 * 2 = expediente rico: el criterio se dice con sus palabras Y la búsqueda
 * advierte con nombre propio.
 *
 * TESTS (§10): voz de familia · cero códigos de motor (familias por
 * diccionario; lo que no matchea no se pinta) · vacío con camino · error
 * dice qué pasó · cero dark patterns (LOYALTY §7.5).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Campo,
  CeldaNavegacion,
  Encabezado,
  Entrada,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  GlifoConContador,
  Icono,
  nombreCurado,
  Separador,
  TarjetaProducto,
  Texto,
  CELDA_DE_GRILLA,
  GRILLA_DE_DOS,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  buscarProductosDespensa,
  listarProductosDespensa,
  contarProductosDespensa,
  mascotasElegibles,
  obtenerMascotasDeFamilia,
  recomendarParaMascota,
  resolverUrlFoto,
  type MascotaResumen,
  type ProductoDeVitrina,
  type Recomendacion,
} from '@epetplace/api';
import { CriterioMascota } from '@/components/despensa-piezas';
import {
  HojaFiltrosDespensa,
  SIN_FILTROS,
  aplicarFiltros,
  contarFiltrosActivos,
  type FiltrosDespensa,
} from '@/components/hoja-filtros-despensa';
import { FiltroMascotas } from '@/components/filtro-pills';
import { agregarAlCarrito, fijarCantidad, unidadesEnCarrito, useCarrito } from '@/lib/despensa/carrito';
import { cruzarConVigilados } from '@/lib/despensa/composicion';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

type Fase<T> = T | 'cargando' | 'error';

/**
 * 🔴 LOS FILTROS DE LA VITRINA, EN UNA SOLA CONSTANTE — y no es prolijidad.
 *
 * `contarProductosDespensa` exige por contrato contar con **los mismos
 * filtros** que la lista: *un total global contra una lista filtrada diría
 * «50 de 563» sobre un conjunto que nunca tuvo 563*. Compartir el objeto
 * vuelve **inexpresable** que se desincronicen — el día que la vitrina gane
 * un filtro, el conteo lo gana en el mismo acto. *La alternativa era repetir
 * el literal en dos llamadas y confiar en que nadie toque una sola: eso ya
 * tiene nombre en esta casa.*
 *
 * `limite` viaja acá aunque NO sea un filtro (`aplicarFiltrosVitrina` lo
 * ignora): es el techo, y vive pegado a lo que corta para que se lean juntos.
 */
const FILTROS_VITRINA = { limite: 50 } as const;

export default function DespensaDescubrir() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const carrito = useCarrito();
  // La puerta desde la mascota (§5.1): su perfil llega con el eje puesto.
  const { mascotaId: mascotaParam } = useLocalSearchParams<{ mascotaId?: string }>();

  const [mascotas, setMascotas] = useState<Fase<MascotaResumen[]>>('cargando');
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [mascotaId, setMascotaId] = useState<string | null>(
    typeof mascotaParam === 'string' && mascotaParam.trim().length > 0 ? mascotaParam : null,
  );
  const [vitrina, setVitrina] = useState<Fase<ProductoDeVitrina[]>>('cargando');
  /** 🔴 CUÁNTOS HAY DE VERDAD (H-004, S100-C). `null` = no lo sabemos, y por
   *  eso NO se dice nada: afirmar un total que no llegó sería peor que callar.
   *  Solo se habla cuando el techo efectivamente cortó. */
  const [totalVitrina, setTotalVitrina] = useState<number | null>(null);
  /** Ver S95-I: el fallo de la recomendación viaja CON su código —
   *  `exclusion_no_verificable` tiene voz propia (L-222: el estado malo
   *  inexpresable, no el error genérico que nadie atrapa). */
  const [reco, setReco] = useState<Recomendacion | 'cargando' | { fallo: string } | null>(null);
  const [reintento, setReintento] = useState(0);

  // ── S96 · el buscador y los filtros ──────────────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Fase<ProductoDeVitrina[]> | null>(null);
  /** 🔴 S100c-C · C-02 — los cinco ejes viven en UN objeto y no en cinco
   *  `useState`: contarlos, limpiarlos y pasarlos a la hoja son
   *  operaciones sobre EL conjunto, y con estados sueltos cada una se
   *  escribe cinco veces —y la sexta se olvida—. La forma vive en
   *  `hoja-filtros-despensa.tsx`, junto a la hoja que los ofrece, para
   *  que el filtro y su puerta no puedan divergir. */
  const [filtros, setFiltros] = useState<FiltrosDespensa>(SIN_FILTROS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const elegibles = useMemo(
    () => mascotasElegibles(Array.isArray(mascotas) ? mascotas : [], null),
    [mascotas],
  );
  const mascota = elegibles.find((m) => m.id === mascotaId) ?? null;

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.familia_id) {
          setMascotas('error');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        setMascotas(r.ok ? r.data : 'error');
        if (!r.ok) return;
        const conFoto = r.data.filter(
          (m): m is MascotaResumen & { foto_url: string } => m.foto_url !== null,
        );
        if (conFoto.length === 0) return;
        const urls = await Promise.all(conFoto.map((m) => resolverUrlFoto(m.foto_url)));
        if (!vigente) return;
        const mapa: Record<string, string> = {};
        conFoto.forEach((m, i) => {
          const u = urls[i];
          if (u !== null) mapa[m.id] = u;
        });
        setFotos(mapa);
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  // Peldaño 0 — la vitrina publicada (S95-I, sin cambios).
  useEffect(() => {
    let vigente = true;
    setVitrina('cargando');
    void listarProductosDespensa(FILTROS_VITRINA).then((r) => {
      if (vigente) setVitrina(r.ok ? r.data : 'error');
    });
    // H-004 — el compañero obligado del techo. Va en su propio viaje (es un
    // `head` de PostgREST: cuenta en el servidor y no baja una sola fila) y
    // su fallo NO ensucia la lista: sin número, la pantalla simplemente no
    // dice cuántos hay. Degradar a «0 de 0» sobre una vitrina llena sería
    // el mismo defecto con el número al revés.
    void contarProductosDespensa(FILTROS_VITRINA).then((r) => {
      if (vigente) setTotalVitrina(r.ok ? r.data : null);
    });
    // ☠️ Ley 37 · S100-C — AQUÍ VIVÍA `listarAlergenos()`, y su muerte es un
    // VIAJE DE RED MENOS al abrir (N16). Traía la voz del catálogo para
    // `vozAlergeno` en la fila; con la señal de la tarjeta, **las voces vienen
    // ya resueltas por el motor** (`declarado_nombre`/`origen_nombre` de los
    // vigilados, que es `cat_alergenos.nombre_es`). *No se borró un fetch por
    // prolijidad: se quedó sin consumidor cuando la voz pasó a viajar con el
    // dato — y un lector sin lector es un viaje que nadie lee.*
    return () => {
      vigente = false;
    };
  }, [reintento]);

  // Con UNA sola elegible se elige sola — y se DICE (S95-I).
  useEffect(() => {
    if (mascotaId === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
  }, [elegibles, mascotaId]);

  // Peldaño 1 — la recomendación (el motor excluye, no esta pantalla).
  useEffect(() => {
    if (mascota === null) {
      setReco(null);
      return;
    }
    let vigente = true;
    setReco('cargando');
    void recomendarParaMascota(mascota.id).then((r) => {
      if (!vigente) return;
      setReco(r.ok ? r.data : { fallo: r.codigo });
    });
    return () => {
      vigente = false;
    };
  }, [mascota, reintento]);

  // ── S96 · LA BÚSQUEDA. El `ilike` lo resuelve Postgres; término corto
  //    no viaja. Los resultados NO excluyen por alergia: ADVIERTEN (§5.4).
  useEffect(() => {
    const termino = busqueda.trim();
    if (termino.length < 2) {
      setResultados(null);
      return;
    }
    let vigente = true;
    setResultados('cargando');
    const timer = setTimeout(() => {
      void buscarProductosDespensa(termino).then((r) => {
        if (vigente) setResultados(r.ok ? r.data : 'error');
      });
    }, 350);
    return () => {
      vigente = false;
      clearTimeout(timer);
    };
  }, [busqueda]);

  /** ☠️ Ley 37 · S100-C — acá vivía `alergenosMascota` (los `alergenos_excluidos`
   *  crudos). Lo reemplaza `vigilados`, que es **el mismo dato expandido**:
   *  incluye lo que el motor vigila POR RELACIÓN (`ave_no_especificada` para un
   *  alérgico al pollo) y trae su voz resuelta. *La lista cruda no podía
   *  distinguir «contiene pollo» de «podría ser pollo», y esa distinción es
   *  exactamente lo que la señal de la tarjeta tiene que decir.*
   *
   *  ⚠️ La dependencia declarada sigue igual y sigue siendo cierta: **sin reco
   *  cargada no hay vigilados**, así que la tarjeta no puede advertir por
   *  coincidencia. **La ficha siempre puede** (carga el perfil ella misma): la
   *  advertencia dura nunca depende solo de esta pantalla. */

  /** Los vigilados EXPANDIDOS del motor (exactos + `puede_ser`), que es lo que
   *  `cruzarConVigilados` necesita para distinguir «contiene pollo» de «podría
   *  ser pollo». Viven en el criterio de la reco: son dato del expediente ya
   *  resuelto por el servidor, jamás un cómputo de esta pantalla. */
  const vigilados = useMemo(
    () =>
      reco !== null && reco !== 'cargando' && !('fallo' in reco)
        ? reco.criterio.alergenos_vigilados
        : [],
    [reco],
  );

  const razon = useMemo(() => {
    if (reco === null || reco === 'cargando' || 'fallo' in reco) return null;
    const c = reco.criterio;
    const partes: string[] = [];
    if (c.alergenos_excluidos.length > 0) {
      partes.push(t('despensa.criterioSinAlergenos', { lista: c.alergenos_excluidos.join(', ') }));
    } else if (c.sin_alergias_declarado) {
      partes.push(t('despensa.criterioSinAlergias'));
    }
    if (c.tiene_condicion_cronica) partes.push(t('despensa.criterioCondicion'));
    return partes.length > 0 ? partes.join(' ') : null;
  }, [reco, t]);

  const recomendados =
    reco !== null && reco !== 'cargando' && !('fallo' in reco) ? reco.productos : null;

  /** La lista que el ojo ve AHORA: resultados de búsqueda > recomendación
   *  > vitrina. Los filtros de faceta se aplican sobre ella. */
  const buscando = resultados !== null;
  const listaBase: Fase<ProductoDeVitrina[]> | null = buscando
    ? resultados
    : mascota !== null
      ? null // con mascota y sin búsqueda, la lista es la recomendación (abajo)
      : vitrina;

  /* ☠️ S100c-C · Ley 37 — acá vivían `facetas()` y `aplicarFacetas()`.
     Los dos se mudaron enteros a `hoja-filtros-despensa.tsx`, que ahora
     deriva CINCO ejes en vez de dos. **Se borran en vez de dejarse**: un
     derivador de facetas que ya nadie llama es la próxima fuente de un
     filtro que se aplica en un lado y no en el otro. */

  /** Ley 3: el código de familia sale por diccionario; lo que no matchea
   *  no se pinta como chip (antes un chip de menos que un código crudo). */
  function etiquetaFamilia(codigo: string): string | null {
    switch (codigo) {
      case 'alimento':
        return t('despensa.familiaAlimento');
      case 'antiparasitario':
        return t('despensa.familiaAntiparasitario');
      case 'suplemento':
        return t('despensa.familiaSuplemento');
      case 'dieta_prescripcion':
        return t('despensa.familiaDieta');
      default:
        return null;
    }
  }

  function etiquetaEspecie(codigo: string): string | null {
    switch (codigo) {
      case 'perro':
        return t('despensa.especiePerro');
      case 'gato':
        return t('despensa.especieGato');
      case 'conejo':
        return t('despensa.especieConejo');
      case 'ave':
        return t('despensa.especieAve');
      case 'roedor':
        return t('despensa.especieRoedor');
      case 'pez':
        return t('despensa.especiePez');
      default:
        return null;
    }
  }

  /**
   * 🔴 EL PRECIO POR KILO — el dato que decide una compra de alimento y que casi
   * nadie pone (N19 ③). Sale de `peso_kg` de la variante, así que **solo se
   * dice cuando existe**: null honesto, jamás un cálculo sobre un peso ausente.
   * Se piden 2 decimales porque a $4,7267/kg el dato deja de ayudar y empieza a
   * ser ruido.
   */
  function precioPorKilo(p: ProductoDeVitrina): string | undefined {
    if (p.peso_kg === null || p.peso_kg <= 0) return undefined;
    return t('despensa.porKilo', { monto: (p.precio / p.peso_kg).toFixed(2) });
  }

  /**
   * 🔴 LA SEÑAL DE ALERGIA DE LA TARJETA (S100-C · L1, prop de B).
   *
   * **La pieza recibe HECHOS TIPADOS y decide el silencio con
   * `alergiaPuedeCallar`, la MISMA función que usa `AvisoAlergia`** — así las
   * dos superficies no pueden discrepar sobre cuándo callar. Acá solo se
   * compone la VOZ, que es corta a propósito: *«Contiene pollo»*, no el mensaje
   * largo de la ficha. **La tarjeta SEÑALA que hay conflicto; no LISTA
   * composición** — el detalle y el paso de entendimiento viven en la ficha.
   *
   * ⚖️ **SOLO CON MASCOTA EN CONTEXTO, y es decisión declarada con su medición.**
   * `alergiaPuedeCallar` habla en todo lo que no sea `verificada`/`no_aplica`, y
   * medido sobre la vitrina viva: **288 `ausente` + 274 `declarada_sin_verificar`
   * = 562 de 563 (99,8 %)**, con **cero `verificada`**. Pasar la prop sin mascota
   * pondría una banda en **prácticamente TODAS** las tarjetas del catálogo — *y
   * un aviso que aparece siempre enseña a ignorar los avisos* (la doctrina de
   * los cinco).
   *
   * **Y no es una excusa para ablandar la regla: es dónde la regla APLICA.** La
   * letra de S96 dice que el silencio se lee como *«no tiene pollo»* — **esa
   * lectura solo existe cuando hay un pollo del que preocuparse**, o sea cuando
   * hay una mascota en contexto y estamos haciendo una afirmación de seguridad
   * sobre ELLA. Sin mascota no se afirma nada, así que no hay silencio que
   * malinterpretar.
   *
   * ⚠️ **LO QUE ESTO SÍ DEJA, servido a la mesa (H-008):** con mascota, **~51 %
   * de lo recomendado va a mostrar la banda de «sin composición declarada»** —
   * y **ahí es correcto y es lo más importante**: *la familia lee «recomendado
   * para Thor» como «seguro para Thor», y sin ingredientes no podemos sostener
   * esa lectura.* **El número alto es el dato malo hablando, no la regla
   * fallando** — se cura cargando composiciones, jamás callando.
   */
  function alergiaDeTarjeta(p: ProductoDeVitrina) {
    if (mascota === null) return undefined;
    const cruce = cruzarConVigilados(p.alergenos, vigilados);
    const lista = (
      cruce.coincidencia === 'exacta'
        ? cruce.exactos.map((e) => e.nombre)
        : cruce.imprecisos.map((i) => i.nombre)
    ).join(', ');
    const senal =
      cruce.coincidencia === 'exacta'
        ? t('despensa.senalContiene', { lista })
        : cruce.coincidencia === 'imprecisa'
          ? t('despensa.senalPodriaContener', { lista })
          : p.composicion_estado === 'ausente'
            ? t('despensa.senalSinComposicion')
            : t('despensa.senalSinVerificar');
    return { composicion: p.composicion_estado, coincidencia: cruce.coincidencia, senal };
  }

  function tarjetaProducto(p: ProductoDeVitrina) {
    // La cantidad ya en el carrito: con 0 la pieza monta el `+`, con >0 el
    // stepper. La pieza no sabe de carrito — recibe el número y avisa.
    const enCarrito = carrito.find((i) => i.oferta_id === p.oferta_id)?.cantidad ?? 0;
    return (
      <TarjetaProducto
        nombre={nombreCurado(p.nombre)}
        // La marca en su propia línea (S100-B): la brecha la midió B contra la
        // tarjeta local del espejo, que ya la mostraba. Va aparte del nombre por
        // lo mismo que la presentación — **de tres datos en un renglón, el que
        // se pierde es siempre el último**. `null` no se dibuja (19.9).
        marca={p.marca}
        presentacion={p.presentacion}
        precio={p.precio}
        precioPorUnidad={precioPorKilo(p)}
        fotoUrl={p.foto_url ?? undefined}
        alergia={alergiaDeTarjeta(p)}
        /* 🔴 `compra` es UNIÓN, no props sueltas (S100-B), y me rompió un
           montaje que ya funcionaba — con razón, y con mi propio argumento
           en mi contra. El espejo del vendedor NO TIENE CARRITO: con props
           obligatorias había que pasarle `cantidad={0}` y un `onAgregar`
           vacío **solo para que el `+` no se dibujara**, que es *mentir una
           prop para lograr una combinación legítima* — lo que la cabecera de
           la propia pieza daba como razón para no reusar `Baldosa`.
           Y UNIÓN en vez de props opcionales **a propósito**: con opcionales,
           olvidar el carrito acá **compilaría** y el `+` desaparecería en
           silencio — el mismo agujero que B me rechazó en mi
           `advertencia?: string`. *La forma tiene que hacer imposible el
           olvido, no confiar en que nadie olvide.* */
        compra={{
          modo: 'vitrina',
          hayStock: p.hay_stock,
          cantidad: enCarrito,
          onAgregar: () =>
            agregarAlCarrito(
              {
                oferta_id: p.oferta_id,
                producto_id: p.producto_id,
                variante_id: p.variante_id,
                nombre: p.nombre,
                marca: p.marca,
                presentacion: p.presentacion,
                precio: p.precio,
                moneda: p.moneda,
                foto_url: p.foto_url,
                especies_aplicables: p.especies_aplicables,
                alergenos: p.alergenos,
                cuentaComercialId: p.cuenta_comercial_id,
                country_code: p.country_code,
              },
              1,
            ),
          onCambiarCantidad: (n) => fijarCantidad(p.oferta_id, n),
        }}
        onPress={() =>
          router.push({
            pathname: '/despensa/producto/[productoId]',
            params: { productoId: p.producto_id, mascotaId: mascota?.id ?? '' },
          })
        }
      />
    );
  }

  /**
   * 🔴 LA VITRINA A DOS COLUMNAS (L1, S100-C). La grilla **no se inventa ni se
   * copia**: `GRILLA_DE_DOS`/`CELDA_DE_GRILLA` vienen de B con su medición
   * adentro (el gap no se ve en el porcentaje — por eso el patrón saca el gap
   * de la cuenta en vez de buscar un tercer porcentaje con más margen).
   *
   * **La persiana la pone `Entrada`, NO un `FadeInDown` a mano** — y lo corrigió
   * R7 sobre mi primera versión: *«la entrada tiene UN portador»*. **La regla no
   * era prolijidad: mi versión artesanal ignoraba `useReducedMotion` y
   * `memorial`** ⇒ quien pidió menos movimiento en su teléfono habría visto el
   * desplazamiento igual, y una familia en memorial habría recibido una vitrina
   * animada. `Entrada` resuelve las tres cosas adentro con una línea.
   *
   * `orden` es **semántico** (posición en la lectura), y va **topeado en 8**: sin
   * tope, el producto 40 esperaría su turno detrás de 39 escalones — *un stagger
   * sin techo deja de ser ritmo y pasa a ser latencia*. Del 9 en adelante entran
   * juntos, que es lo que hace el ojo al bajar rápido.
   */
  function grillaProductos(lista: ProductoDeVitrina[]) {
    return (
      <View style={GRILLA_DE_DOS}>
        {lista.map((p, i) => (
          <View key={p.oferta_id} style={CELDA_DE_GRILLA}>
            <Entrada orden={Math.min(i, 8)}>{tarjetaProducto(p)}</Entrada>
          </View>
        ))}
      </View>
    );
  }

  /**
   * ☠️ **EL `modo` MURIÓ (Ley 37) — LAS TRES PUERTAS MONTAN LA MISMA PIEZA.**
   *
   * Existió exactamente una tanda, y su razón era de SEGURIDAD, no de forma: la
   * búsqueda **advierte** de alergia por letra firmada (`MODELO_DESPENSA` §5.4)
   * y la tarjeta no tenía dónde decirlo. **Se pidió la prop con el caso concreto
   * en vez de migrar y borrar la advertencia** — y B la construyó con mejor
   * forma que la propuesta: hechos tipados en vez de un texto opcional, porque
   * *un texto opcional deja `undefined` como silencio legal incluso donde la
   * letra obliga a hablar*.
   *
   * Con la prop viva el andamio dejó de tener razón de existir, así que se
   * retira entero: **el `modo`, `filaProducto` y su `Separador`.**
   */
  /**
   * 🔴 S100c-C · C-02 · LAS DOS TIRAS DE CHIPS MUEREN; QUEDA UN CONTROL.
   *
   * El gate: *«con el teclado desplegado no veo absolutamente nada más»*.
   * **Medido antes de tocar: las dos tiras costaban 132 dp de 317 de
   * cromo — el 42 %** — y son las facetas de lo cargado, así que **crecen
   * con el catálogo**: con 563 productos los chips no llegan nunca.
   *
   * ⚠️ **DOS COSAS QUE LA MEDICIÓN CORRIGIÓ, y hay que dejarlas escritas
   * porque la firma de mesa decía otra cosa:**
   *
   * ① *«la fila de ESPECIES muere cuando hay mascota elegida — hoy se
   * contradice»*: **no se contradice.** El guard vive en esta función
   * desde S96-D (`mascota === null &&`), **está en el ancla publicada
   * `f107eac9`** (verificado con `git show`) y **medido en aparato NO se
   * dibuja** con Jack elegido. *La cura que la mesa nombró no habría
   * curado nada, porque ya estaba hecha.*
   *
   * ② Lo que el founder VIO sí es real, y estaba en otra superficie:
   * **la BÚSQUEDA ignora la mascota.** Con Jack (gato) elegido, buscar
   * «alimento» devuelve 50 tarjetas y las tres primeras declaran, en su
   * propia ficha, *«Está pensado para perros.»* ⇒ **H-301**, abajo.
   * *Una observación correcta con una causa mal atribuida se cura en el
   * lugar equivocado y el defecto sigue vivo con mejor cara.*
   *
   * El eje ESPECIE **no se pierde**: se muda adentro de la hoja, donde
   * convive con los otros cuatro en vez de gastar una fila.
   */
  function listaConFacetas(lista: ProductoDeVitrina[], vacio: React.ReactNode) {
    const filtradas = aplicarFiltros(lista, filtros);
    const activos = contarFiltrosActivos(filtros);
    return (
      <View style={{ gap: spacing[3] }}>
        <View style={{ paddingHorizontal: spacing[5] }}>
          <Boton
            variante="secundario"
            tamaño="sm"
            etiqueta={
              activos === 0
                ? t('despensa.filtrar')
                : t('despensa.filtrarCon', { n: activos })
            }
            onPress={() => setFiltrosAbiertos(true)}
          />
        </View>
        {filtradas.length === 0 ? (
          vacio
        ) : (
          // La grilla trae su propio margen negativo, así que el aire lateral
          // de la pantalla se pone acá y no adentro de la celda.
          <View style={{ paddingHorizontal: spacing[5] }}>{grillaProductos(filtradas)}</View>
        )}
      </View>
    );
  }

  const cargandoLista = (
    <EsqueletoGrupo>
      <View style={{ gap: spacing[3], paddingHorizontal: spacing[5] }}>
        <Esqueleto forma="bloque" ancho="100%" alto={72} />
        <Esqueleto forma="bloque" ancho="100%" alto={72} />
        <Esqueleto forma="bloque" ancho="100%" alto={72} />
      </View>
    </EsqueletoGrupo>
  );

  const botonReintentar = (
    <Boton
      variante="secundario"
      etiqueta={t('hogar.reintentar')}
      onPress={() => setReintento((n) => n + 1)}
    />
  );

  const unidades = unidadesEnCarrito(carrito);

  /** La lista que la hoja de filtros usa para derivar sus facetas: la
   *  MISMA que se está mostrando, sin filtrar. Se calcula acá y no adentro
   *  de la hoja porque **cuál es la lista vigente es decisión de esta
   *  pantalla** (búsqueda > recomendación > vitrina), y duplicar esa
   *  precedencia en dos lugares es cómo se fabrica una hoja que ofrece
   *  filtros de una lista que el ojo no está viendo. */
  const listaParaFiltrar: ProductoDeVitrina[] = buscando
    ? Array.isArray(resultados)
      ? resultados
      : []
    : mascota !== null
      ? (recomendados ?? [])
      : Array.isArray(vitrina)
        ? vitrina
        : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* 🔴 S100b-D · G-14 · EL CARRITO DEJA DE SER UN BOTÓN DE TEXTO.
          El gate: *«el carrito no tiene ícono en la barra: es un botón de
          texto donde la industria usa una canasta con su contador»*.

          **Va en `accionDer`, que es el slot que la pieza ya tiene para
          esto** — no es un override. Y va ACÁ y no en la barra de tabs por
          un dato, no por gusto: **la barra ya tiene sus cuatro slots**
          (hogar · explorar · despensa · cuenta) y el cuarto es del ciclo
          del trono; meter el carrito ahí rompería la gramática de la única
          barra que el dueño ve todos los días.

          **PERMANENTE, con o sin unidades.** Antes el único acceso existía
          solo con `unidades > 0` ⇒ *un carrito vacío no tenía puerta, así
          que no había forma de ver qué había adentro ni de volver.* El
          contador aparece solo cuando hay algo: un «0» sobre la canasta es
          ruido con forma de dato. */}
      <Encabezado
        variante="portada"
        saludo={t('despensa.titulo')}
        isotipo="gradiente"
        /* 🔴 S100b-D · EL BUSCADOR SUBE A LA FILA DEL ENCABEZADO — y es el
           slot que B entregó justo antes de cerrar, con la medición de C
           adentro: **apilado debajo costaba 76 dp para una caja de texto de
           26**, y en la referencia (Laika) **el buscador y el carrito viven
           en la MISMA fila que el logo**.
           Con `busqueda` el encabezado deja de apilar: `[isotipo]
           [buscador] [carrito]`. **El título no se apaga: deja de gastar
           píxeles** —sigue anunciándose al lector en un nodo sin alto—,
           que es el patrón ya firmado en `Campo.etiquetaVisible`.
           ⚠️ **El alto que esto libera es de la VITRINA, o sea de C (G-04):
           una pantalla que no mostraba un solo producto.** Se monta desde
           acá porque el encabezado es «Despensa de arriba» y es mío, con C
           parada por orden de mesa — *una pieza entregada y sin consumidor
           muere sin que nadie se entere.* Si C repiensa la composición,
           esto se mueve; lo que no vuelve es el apilado. */
        /* 🔴 S100c-C · C-03 · LO QUE **NO** SE HIZO ACÁ, Y POR QUÉ — H-302.
           El gate: *«se pierde mucho espacio»* entre el buscador y la barra
           de mascotas. **Medido (18-ago, 384×832): 74 dp** entre el borde
           inferior de la CAJA DE TEXTO (y 58) y la barra (y 132).
           La causa está en la pieza y se leyó, no se supuso: `Campo` reserva
           SIEMPRE el slot de ayuda/error (`PieDeCampo`, `minHeight:
           ALTO_PIE_CAMPO`) *para que el mensaje no empuje el layout al
           aparecer* — regla correcta que acá protege de nada: **un buscador
           no valida.** Son **26 dp** de los 74.

           Se probó `sinPie` (la prop existe) y **`verify:diseno` lo frenó
           con razón: R29** — con `sinPie` el `Campo` sigue pintando su borde
           de error pero deja de renderizar el texto ⇒ *borde rojo sin una
           palabra que lo explique*, y el modo de falla es el silencio
           (L-192). La regla asume que quien apaga el pie es un CONTROL
           COMPUESTO que lo monta por sus hijos; **un campo que no puede
           tener mensaje es un tercer caso que la regla no contempla.**

           ⇒ **NO se apaga el lint y NO se monta un `PieDeCampo` decorativo
           para callarlo** — gamear el instrumento es peor que el defecto.
           El arreglo es de la PIEZA y es de B (H-302): que `Campo` pueda
           declarar «este campo no tiene mensaje» de forma que `ayuda`/`error`
           sean **inexpresables** ahí. Con eso R29 sigue mordiendo donde debe
           y estos 26 dp vuelven. *Los otros 48 sí se curaron, abajo.* */
        busqueda={
          <Campo
            label={t('despensa.buscarLabel')}
            etiquetaVisible={false}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder={t('despensa.buscarPlaceholder')}
            autoCapitalize="none"
          />
        }
        accionDer={
          <Pressable
            onPress={() => router.push('/despensa/carrito')}
            accessibilityRole="button"
            accessibilityLabel={
              unidades === 0
                ? t('despensa.irAlCarrito')
                : t('despensa.irAlCarritoCon', { n: unidades })
            }
            hitSlop={spacing[3]}
          >
            {/* ✅ EL DISCO LLEGÓ. Antes esto era «canasta + número al lado»
                porque `Texto` no tiene color inverso y el par
                texto-sobre-acento vivía encerrado en `Boton` — *pintar el
                número con un color crudo habría sido inventar contraste sin
                medirlo, en la pieza más pública de la tienda.* Se pidió la
                pieza en vez de inventarla y B la construyó reusando el par
                del timbre `+` de `TarjetaProducto`, que **ya está en el
                gate**: WCAG 368/0, cero pares nuevos.
                Con `0` no dibuja disco (19.9) y a partir de 100 dice «99+»:
                la salida es decir «muchos», jamás encoger la letra. */}
            {/* ⏪ **ACÁ VIVÍA UNA REDUNDANCIA DECLARADA, Y LA PIEZA LA
                CURÓ.** La primera versión fijaba `accessible` +
                `role="image"` adentro, así que anidada en un tocable quedaban
                **dos nodos accesibles**. Yo dejé la voz en el `Pressable`
                —*el que tiene que estar nombrado es el que se toca: un botón
                sin nombre no se activa a ciegas*— y **declaré la duplicación
                en vez de esconderla**.
                B la cerró con una **unión discriminada**, no con un flag
                suelto: con un boolean opcional seguían siendo expresables
                **los dos** estados malos —*suelta y sin nombre* (muda para el
                lector) y *anidada con nombre* (la voz duplicada)—. **Con la
                unión ninguno de los dos compila.**
                ⇒ acá va `dentroDeTocable` y **sin `etiqueta`**: la pieza se
                borra del árbol y el único nodo nombrado es el `Pressable`. */}
            <GlifoConContador nombre="carrito" cuenta={unidades} dentroDeTocable />
          </Pressable>
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          /* 🔴 S100c-C · C-03 · 16 → 8. **El aire estaba pagado dos veces.**
             El `Encabezado` en variante portada ya trae `paddingBottom:
             spacing[5]` (20 dp) —*«la portada respira, no comprime»*, y esa
             decisión es de la pieza y no se toca—, así que estos 16 se
             sumaban a un colchón que ya existía: 36 dp entre el buscador y
             la primera cosa que se toca.
             Se baja a 8 y quedan 28, que siguen siendo aire. **No se baja a
             0 a propósito**: pegar la barra de mascotas al filo del
             encabezado la haría leer como parte de él. */
          paddingTop: spacing[2],
          // Sin barra fija abajo, la reserva es solo el aire del final
          // del contenido: el `+ 72` estimaba el alto de un pie que ya no
          // existe (la clase que `PantallaConPie` vino a volver inexpresable).
          // 🔴 SIN `insets.bottom`, y es CONCESIÓN MEDIDA, no gusto.
          // B midió que **el navegador ya acota**: el `ScrollView` de una
          // pantalla de tab termina en `y = 699.0 dp`, el filo exacto de la
          // barra —que a su vez ya pintó el inset del sistema—. Sumarlo acá
          // lo cuenta DOS VECES. `spacing[8]` es el aire de cola; el inset
          // era la cara «sobra» del malentendido de los 53 dp.
          // *Yo lo había defendido como «aire de cola» y C tenía razón: era
          // una línea vieja, no una posición.* Se unifica en las tres
          // pantallas — dos reglas para lo mismo divergen.
          paddingBottom: spacing[8],
          gap: spacing[5],
        }}
      >
        {mascotas === 'cargando' ? (
          cargandoLista
        ) : mascotas === 'error' ? (
          <EstadoVacio
            titulo={t('despensa.errorMascotasTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={botonReintentar}
          />
        ) : (
          <>
            {/* ⓪ · LA PUERTA — el expediente (S95-I, sin cambios) */}
            {elegibles.length > 1 ? (
              <FiltroMascotas
                mascotas={elegibles.map((m) => ({
                  id: m.id,
                  nombre: m.nombre,
                  fotoUrl: caraDeMascotaPorRuta({
                    especie: m.especie,
                    rutaImagen: m.raza_ruta_imagen,
                    fotoUri: fotos[m.id],
                  }),
                }))}
                elegida={mascotaId}
                onElegir={setMascotaId}
              />
            ) : null}

            {/* 🔴 S100b-D · G-15 · «TUS PEDIDOS» SUBE ACÁ, Y LA CURA NO ERA
                LA QUE EL GATE SUPUSO. El gate dice *«falta acceso a mis
                pedidos desde la primera pantalla de Despensa»* y B, con
                aparato, lo midió más ancho: *«no tiene entrada»*, y llegó por
                deep link.

                **Medido: la entrada EXISTÍA** — esta misma celda, al FONDO
                del scroll, **detrás de la vitrina entera** (hasta 50 productos
                en grilla de dos ≈ 25 filas). *No estaba ausente: estaba
                enterrada, que en la práctica es lo mismo y en la cura no lo
                es.* ⇒ **no se construye, se sube.**

                Va DESPUÉS del filtro de mascota y ANTES del buscador: es la
                primera cosa que se ve sin deslizar, y una sola fila.
                ⚠️ **Cuesta una fila de alto, y eso toca a G-04** (la primera
                pantalla que no muestra un solo producto, dueño C). Se declara
                para que quien la repiense sepa que esta fila está acá por
                firma y no por inercia: si su composición la quiere en otro
                lugar, se mueve — lo que no puede es volver al fondo.

                ⏪ Y la tabla de Cuenta de B **sí era exacta**: ahí no hay
                entrada, y eso queda vivo (dueño por asignar). */}
            {/* 🔴 ENMIENDA DE C A ESTA FILA (S100b-C) — **se queda arriba, y
                pierde su renglón de explicación.**

                D la subió y declaró que tocaba G-04 dejando la puerta
                abierta (*«si su composición la quiere en otro lugar, se
                mueve — lo que no puede es volver al fondo»*). Medí el costo
                con el aparato: **la fila entera cuesta 79 dp** (58 + su
                separación) y con ella **la primera tarjeta dejó de entrar
                entera por 20 dp**. Sin ella el cromo baja de 319 a 240.

                ⇒ El choque es real y es entre dos hallazgos firmados:
                **G-15 pide que «mis pedidos» sea encontrable · G-04 pide que
                la vitrina muestre mercadería.** No hay respuesta gratis, y
                la ordena el propio gate: *«G-04 es el que ordena a los
                demás»*, y *«una vitrina que no muestra mercadería no es una
                vitrina»*.

                **Pero enterrarla otra vez reproduce la queja del founder.**
                Se le quitó el `detalle` —«Seguí lo que pediste, del más
                reciente»— porque es una EXPLICACIÓN y la regla del arranque
                la manda detrás de un toque: lo que se necesita para DECIDIR
                queda visible, lo que se necesita para ENTENDER no. El título
                ya dice qué hay del otro lado. **Eso se sostiene por sí solo
                y se queda.**

                🔴 **PERO NO ALCANZA, Y SE DICE CON EL NÚMERO: ahorró 2 dp de
                los 18 que faltaban** (319 → 317). `CeldaNavegacion` tiene
                alto mínimo, así que la fila cuesta ~77 dp lleve o no su
                explicación. ⇒ **la forma NO admite el efecto**, y acá se
                para de mover números en vez de buscar el tercero.

                **La decisión queda BINARIA y va al gate con su número: la
                fila arriba, o la primera tarjeta entera. No hay medio.**
                Se elige dejarla arriba —el founder pidió encontrarla y la
                tarjeta se completa deslizando un dedo— y se declara como
                **reversible en una línea**: moverla debajo de la grilla
                devuelve el cromo a 240 dp y la tarjeta entra con 59 de
                sobra. *Lo que no se hace es esconder el costo.* */}
            <View>
              <CeldaNavegacion
                titulo={t('despensa.tusPedidos')}
                onPress={() => router.push('/despensa/pedidos')}
              />
              <Separador />
            </View>

            {/* ⏪ ⓪bis · EL BUSCADOR SE FUE A LA FILA DEL ENCABEZADO
                (ver su comentario arriba). Acá costaba 76 dp apilado. */}

            {/* ① · EL CRITERIO — la firma (S95-I, sin cambios) */}
            {mascota !== null && !buscando ? (
              <CriterioMascota
                nombre={mascota.nombre}
                fotoUrl={caraDeMascotaPorRuta({
                  especie: mascota.especie,
                  rutaImagen: mascota.raza_ruta_imagen,
                  fotoUri: fotos[mascota.id],
                })}
                linea={t('despensa.criterioPara', { nombre: mascota.nombre })}
                razon={razon}
              />
            ) : null}

            {/* ② · LO QUE SE VE — búsqueda > recomendación > vitrina */}
            {buscando ? (
              resultados === 'cargando' ? (
                cargandoLista
              ) : resultados === 'error' ? (
                <EstadoVacio
                  registro="seccion"
                  titulo={t('despensa.errorVitrinaTitulo')}
                  descripcion={t('despensa.errorVitrinaDetalle')}
                  accion={botonReintentar}
                />
              ) : (
                listaConFacetas(
                  resultados ?? [],
                  /* La señal más valiosa del ecommerce es la búsqueda sin
                     resultado — acá al menos se dice honesto y con camino. */
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('despensa.busquedaVaciaTitulo', { termino: busqueda.trim() })}
                    descripcion={t('despensa.busquedaVaciaDetalle')}
                    accion={
                      <Boton
                        variante="secundario"
                        etiqueta={t('despensa.limpiarBusqueda')}
                        onPress={() => setBusqueda('')}
                      />
                    }
                  />,
                )
              )
            ) : mascota !== null ? (
              reco === 'cargando' || reco === null ? (
                cargandoLista
              ) : 'fallo' in reco ? (
                <EstadoVacio
                  registro="seccion"
                  titulo={
                    reco.fallo === 'exclusion_no_verificable'
                      ? t('despensa.exclusionRotaTitulo')
                      : t('despensa.errorRecoTitulo')
                  }
                  descripcion={
                    reco.fallo === 'exclusion_no_verificable'
                      ? t('despensa.exclusionRotaDetalle', { nombre: mascota.nombre })
                      : t('despensa.errorRecoDetalle')
                  }
                  accion={botonReintentar}
                />
              ) : recomendados !== null && recomendados.length === 0 ? (
                <EstadoVacio
                  registro="seccion"
                  icono={<Icono nombre="despensa" tamano={48} />}
                  titulo={t('despensa.sinParaMascotaTitulo', { nombre: mascota.nombre })}
                  descripcion={t('despensa.sinParaMascotaDetalle')}
                  accion={
                    <Boton
                      variante="secundario"
                      etiqueta={t('despensa.verTodo')}
                      onPress={() => setMascotaId(null)}
                    />
                  }
                />
              ) : (
                listaConFacetas(recomendados ?? [], null)
              )
            ) : vitrina === 'cargando' ? (
              cargandoLista
            ) : vitrina === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('despensa.errorVitrinaTitulo')}
                descripcion={t('despensa.errorVitrinaDetalle')}
                accion={botonReintentar}
              />
            ) : vitrina.length === 0 ? (
              <EstadoVacio
                icono={<Icono nombre="despensa" tamano={48} />}
                titulo={t('despensa.vacioTitulo')}
                descripcion={t('despensa.vacioDetalle')}
              />
            ) : (
              <View style={{ gap: spacing[3] }}>
                {/* ☠️ ACÁ VIVÍA LA VOZ «elegí una mascota» (G-04, S100b-C).
                    Muere por DOS razones, y la segunda es la que la condena:
                    ① Es una EXPLICACIÓN, y la tira de caras que está justo
                      encima ya es la invitación — *pedir por texto lo que un
                      control visible ya ofrece es cobrarle al alto de la
                      pantalla dos veces por lo mismo.*
                    ② 🔴 **Mentía en un caso real.** Se pintaba con
                      `elegibles.length > 0` y el selector de mascotas se
                      pinta con `> 1`: con UNA sola mascota elegible, la app
                      pedía elegir **y no había control para hacerlo**. Un
                      control que no existe es peor que uno feo.
                    El criterio no se pierde: al elegir una mascota,
                    `CriterioMascota` lo DICE con su cara y su razón. */}
                {listaConFacetas(vitrina, null)}
                {/* 🔴 H-004 (S100-C) — EL TECHO QUE SE DICE, AHORA AL PIE.
                    La vitrina carga 50 y el catálogo comprable tiene 563: la
                    familia veía el 8,9 % y **una lista completa y una truncada
                    se veían igual**. `contarProductosDespensa` existía desde
                    S99 para exactamente esto y no tenía un solo consumidor —
                    la cura estaba construida y sin consumir.
                    Se habla SOLO cuando el techo cortó de verdad
                    (`total > cargados`): en una vitrina que entra entera, el
                    número sobra y avisar de más enseña a ignorar los avisos.

                    🔴 S100b-C — **BAJA DE LA CABECERA AL PIE DE LA GRILLA**, y
                    no es solo por los 40 dp que le devuelve a la mercadería:
                    **arriba el número no tiene nada que calificar todavía**.
                    «Mostramos 50 de 563» se lee ANTES de haber visto uno solo.
                    Al pie llega cuando la lista efectivamente se terminó, que
                    es el momento en que la pregunta «¿esto es todo?» aparece
                    sola. *El dato no cambió: cambió el instante en que sirve.* */}
                {totalVitrina !== null && totalVitrina > vitrina.length ? (
                  <View style={{ paddingHorizontal: spacing[5] }}>
                    <Texto variante="apoyo">
                      {t('despensa.techoVitrina', {
                        mostrados: vitrina.length,
                        total: totalVitrina,
                      })}
                    </Texto>
                  </View>
                ) : null}
              </View>
            )}

            {/* ③ · LA OTRA PUERTA — el código del local.
                CeldaNavegacion: acción que LLEVA (E14, chevron ›). Sin
                glifo: el registry no tiene glifos de pedido/factura y un
                glifo repetido de despensa sería decoración (Ley 12).

                ⏪ **«TUS PEDIDOS» SE FUE DE ACÁ ARRIBA** — ver su comentario
                junto al buscador. */}
            <View>
              <Separador />
              <CeldaNavegacion
                titulo={t('despensa.reclamoEntrada')}
                detalle={t('despensa.reclamoEntradaDetalle')}
                onPress={() => router.push('/despensa/reclamo')}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* ☠️ **S100b-D · MURIÓ LA BARRA FIJA «VER CARRITO (N)»** — es
          exactamente el *«botón de texto»* que G-14 nombra, y con la canasta
          permanente en el encabezado pasó a ser **una segunda puerta al mismo
          cuarto** (Chanel: la casa dice una cosa una vez).

          **Y su muerte paga tres cosas de una:** el pie fijo desaparece, con
          él el aire muerto que dejaba contra la barra de tabs, y la vitrina
          recupera ese alto — que es justo lo que G-04 necesita.

          ⚠️ **Lo que se pierde y se declara:** la barra era también el ACUSE
          de haber agregado algo («ya hay 3 acá abajo»). Ese trabajo pasa al
          contador de la canasta, que **está siempre a la vista porque el
          encabezado no colapsa al scrollear** (medido por B: 156.4 dp, no
          colapsa). *Si en el gate el acuse no se siente, el arreglo es dar
          señal al contador —no resucitar la barra.* */}

      {/* 🔴 S100c-C · C-02 · LA HOJA DE FILTROS.
          Vive FUERA del `ScrollView` porque es una superficie sobre la
          pantalla, no contenido de ella.
          **Se le pasa la lista SIN filtrar** (`listaParaFiltrar`): las
          facetas salen de lo que hay, no de lo que quedó — si salieran de
          lo filtrado, elegir «Alimento» borraría las demás categorías de
          la hoja y no habría forma de volver sin limpiar todo. */}
      <HojaFiltrosDespensa
        visible={filtrosAbiertos}
        onCerrar={() => setFiltrosAbiertos(false)}
        lista={listaParaFiltrar}
        filtros={filtros}
        onCambio={setFiltros}
        ocultarEspecie={mascota !== null}
        vozFamilia={etiquetaFamilia}
        vozEspecie={etiquetaEspecie}
      />
    </View>
  );
}
