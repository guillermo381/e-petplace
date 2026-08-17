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
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  FiltroPills,
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
  const insets = useSafeAreaInsets();
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
  const [familiaFiltro, setFamiliaFiltro] = useState<string | null>(null);
  const [especieFiltro, setEspecieFiltro] = useState<string | null>(null);

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

  /** Facetas DERIVADAS de lo cargado — un filtro solo existe si hay datos
   *  que parte (censo S82: si un eje no parte los datos, no se dibuja). */
  function facetas(lista: ProductoDeVitrina[]) {
    const familias = [...new Set(lista.map((p) => p.familia_codigo))];
    const especies = [...new Set(lista.flatMap((p) => p.especies_aplicables))];
    return { familias, especies };
  }

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

  function aplicarFacetas(lista: ProductoDeVitrina[]): ProductoDeVitrina[] {
    return lista.filter(
      (p) =>
        (familiaFiltro === null || p.familia_codigo === familiaFiltro) &&
        (especieFiltro === null || p.especies_aplicables.includes(especieFiltro)),
    );
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
        hayStock={p.hay_stock}
        alergia={alergiaDeTarjeta(p)}
        cantidad={enCarrito}
        onAgregar={() =>
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
          )
        }
        onCambiarCantidad={(n) => fijarCantidad(p.oferta_id, n)}
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
  function listaConFacetas(lista: ProductoDeVitrina[], vacio: React.ReactNode) {
    const { familias, especies } = facetas(lista);
    const filtradas = aplicarFacetas(lista);
    const chipsFamilia = familias
      .map((f) => ({ codigo: f, etiqueta: etiquetaFamilia(f), icono: null }))
      .filter((x): x is { codigo: string; etiqueta: string; icono: null } => x.etiqueta !== null);
    const chipsEspecie = especies
      .map((e) => ({ codigo: e, etiqueta: etiquetaEspecie(e), icono: null }))
      .filter((x): x is { codigo: string; etiqueta: string; icono: null } => x.etiqueta !== null);
    return (
      <View style={{ gap: spacing[3] }}>
        {chipsFamilia.length > 1 ? (
          <FiltroPills
            opciones={chipsFamilia}
            activo={familiaFiltro}
            onCambio={setFamiliaFiltro}
            onLimpiar={() => setFamiliaFiltro(null)}
          />
        ) : null}
        {/* La especie solo parte datos cuando NO hay mascota elegida: con
            mascota, su especie ya es el criterio del motor. */}
        {mascota === null && chipsEspecie.length > 1 ? (
          <FiltroPills
            opciones={chipsEspecie}
            activo={especieFiltro}
            onCambio={setEspecieFiltro}
            onLimpiar={() => setEspecieFiltro(null)}
          />
        ) : null}
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="portada" saludo={t('despensa.titulo')} isotipo="gradiente" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: spacing[4],
          paddingBottom: insets.bottom + (unidades > 0 ? spacing[8] + 72 : spacing[8]),
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

            {/* ⓪bis · EL BUSCADOR (S96 — §5.1) */}
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Campo
                label={t('despensa.buscarLabel')}
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder={t('despensa.buscarPlaceholder')}
                autoCapitalize="none"
              />
            </View>

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
                {elegibles.length > 0 ? (
                  <View style={{ paddingHorizontal: spacing[5] }}>
                    <Texto variante="apoyo">{t('despensa.elegiMascota')}</Texto>
                  </View>
                ) : null}
                {/* 🔴 H-004 (S100-C) — EL TECHO QUE SE DICE.
                    La vitrina carga 50 y el catálogo comprable tiene 563: la
                    familia veía el 8,9 % y **una lista completa y una truncada
                    se veían igual**. `contarProductosDespensa` existía desde
                    S99 para exactamente esto y no tenía un solo consumidor —
                    la cura estaba construida y sin consumir.
                    Se habla SOLO cuando el techo cortó de verdad
                    (`total > cargados`): en una vitrina que entra entera, el
                    número sobra y avisar de más enseña a ignorar los avisos. */}
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
                {listaConFacetas(vitrina, null)}
              </View>
            )}

            {/* ③ · LAS OTRAS PUERTAS — el pedido vivo y el código del local.
                CeldaNavegacion: acción que LLEVA (E14, chevron ›). Sin
                glifo: el registry no tiene glifos de pedido/factura y un
                glifo repetido de despensa sería decoración (Ley 12). */}
            <View>
              <Separador />
              <CeldaNavegacion
                titulo={t('despensa.tusPedidos')}
                detalle={t('despensa.tusPedidosDetalle')}
                onPress={() => router.push('/despensa/pedidos')}
              />
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

      {/* LA BARRA DEL CARRITO — existe solo cuando hay algo adentro. */}
      {unidades > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: spacing[5],
            paddingTop: spacing[3],
            paddingBottom: insets.bottom + spacing[3],
            backgroundColor: theme.bg.base,
          }}
        >
          <Boton
            etiqueta={t('despensa.verCarrito', { n: unidades })}
            bloque
            onPress={() => router.push('/despensa/carrito')}
          />
        </View>
      ) : null}
    </View>
  );
}
