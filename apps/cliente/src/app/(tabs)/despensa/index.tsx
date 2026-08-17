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
  Celda,
  CeldaNavegacion,
  Encabezado,
  Entrada,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FiltroPills,
  Icono,
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
  listarAlergenos,
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
import { CriterioMascota, LienzoProducto } from '@/components/despensa-piezas';
import { FiltroMascotas } from '@/components/filtro-pills';
import { agregarAlCarrito, fijarCantidad, unidadesEnCarrito, useCarrito } from '@/lib/despensa/carrito';
import { alergenosQueCruzan, vozAlergeno } from '@/lib/despensa/composicion';
import { nombreCurado } from '@/lib/despensa/nombre-curado';
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
  /** código → nombre_es del catálogo (la advertencia por fila habla la
   *  voz de la casa, jamás un código con guiones). */
  const [vocesAlergenos, setVocesAlergenos] = useState<Map<string, string> | undefined>(undefined);

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
    // La voz del catálogo de alérgenos, para la advertencia por fila.
    void listarAlergenos().then((r) => {
      if (vigente && r.ok) {
        setVocesAlergenos(new Map(r.data.map((a) => [a.codigo, a.nombre])));
      }
    });
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

  /** Los alérgenos documentados de la mascota elegida — salen del criterio
   *  que la recomendación ya trajo (dato del expediente, no un cálculo
   *  nuevo). Sin reco cargada, la búsqueda no puede advertir POR FILA —
   *  la ficha siempre puede (carga el perfil ella misma): la advertencia
   *  dura nunca depende solo de esta lista. */
  const alergenosMascota = useMemo(
    () =>
      reco !== null && reco !== 'cargando' && !('fallo' in reco)
        ? reco.criterio.alergenos_excluidos
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

  function filaProducto(p: ProductoDeVitrina) {
    // §5.4 — la advertencia EN LA FILA cuando la búsqueda trae lo que la
    // recomendación habría excluido. Nombra el alérgeno; jamás esconde.
    const cruzan = buscando && mascota !== null ? alergenosQueCruzan(p.alergenos, alergenosMascota) : [];
    return (
      <View key={p.oferta_id}>
        <Celda
          interactiva
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/despensa/producto/[productoId]',
              params: { productoId: p.producto_id, mascotaId: mascota?.id ?? '' },
            })
          }
          inicio={<LienzoProducto lado={56} fotoUrl={p.foto_url} />}
          // ④ S100-C — el nombre CURADO, no el del catálogo. 42 % del catálogo
          // viene EN MAYÚSCULAS y `CANADA LITTER` es nombre de importador, no
          // de vitrina. Solo cambia la CAJA: no inventa una palabra.
          titulo={nombreCurado(p.nombre)}
          subtitulo={[p.marca, p.presentacion].filter((x) => x !== null && x !== '').join(' · ')}
          metadataMono={`$ ${p.precio.toFixed(2)}`}
        />
        {cruzan.length > 0 ? (
          <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
            <Texto variante="apoyo" color="warning">
              {t('despensa.filaContiene', {
                nombre: mascota?.nombre ?? '',
                lista: cruzan.map((c) => vozAlergeno(c, vocesAlergenos)).join(', '),
              })}
            </Texto>
          </View>
        ) : null}
        {/* §8.6ter — SE MUESTRA Y SE DICE. La fila sigue TOCABLE a propósito:
            la familia entra a ver el producto igual, y apagar el toque sería
            un callejón (Ley 13). Lo único que cambia es que la pantalla deja
            de callar.
            🔴 NEUTRO, NO `warning`, Y ES DECISIÓN: la alergia es riesgo para
            la mascota y el agotado es un hecho del estante. Dos naranjas
            seguidos aplanan la diferencia — y un aviso que aparece siempre
            enseña a ignorar los avisos (la doctrina de los cinco avisos).
            `apoyo` ya nace `secondary`, así que la distinción no cuesta un
            token nuevo.
            ⚠️ ORDEN REVERSIBLE Y DECLARADO: la alergia va PRIMERO porque es
            de Thor y esto es del estante. Si la mesa lo prefiere al revés,
            son dos líneas. */}
        {!p.hay_stock ? (
          <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
            <Texto variante="apoyo">{t('despensa.filaSinStock')}</Texto>
          </View>
        ) : null}
      </View>
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

  function tarjetaProducto(p: ProductoDeVitrina) {
    // La cantidad ya en el carrito: con 0 la pieza monta el `+`, con >0 el
    // stepper. La pieza no sabe de carrito — recibe el número y avisa.
    const enCarrito = carrito.find((i) => i.oferta_id === p.oferta_id)?.cantidad ?? 0;
    return (
      <TarjetaProducto
        nombre={nombreCurado(p.nombre)}
        presentacion={p.presentacion}
        precio={p.precio}
        precioPorUnidad={precioPorKilo(p)}
        fotoUrl={p.foto_url ?? undefined}
        hayStock={p.hay_stock}
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
   * `modo` decide la forma, y el corte **no es estético: es de seguridad.**
   *
   * · `'grilla'` — vitrina y recomendación. Ahí `TarjetaProducto` rige tal
   *   cual: la vitrina se ve **sin mascota** (no hay contra qué advertir) y la
   *   recomendación **excluye duro en el motor**, con verificación fail-closed
   *   que rechaza la respuesta entera si algo cruza.
   * · `'filas'` — LA BÚSQUEDA, y sigue en filas A PROPÓSITO. `MODELO_DESPENSA`
   *   §5.4 firma *«exclusión dura en la RECOMENDACIÓN, advertencia dura en la
   *   BÚSQUEDA»*: la búsqueda no excluye, **advierte**. `TarjetaProducto` no
   *   muestra alérgenos por decisión de su autora (*medio dato de alergia es
   *   peor que ninguno*), así que migrarla hoy **borraría una advertencia de
   *   salud firmada**. Tampoco se cuelga el aviso FUERA de la tarjeta: eso es
   *   exactamente H-002, el huérfano que el censo midió en 80 de 563 filas.
   *   ⏳ **Prop de advertencia pedida a B con el caso concreto.** Cuando exista,
   *   este `modo` muere y las tres puertas montan la misma pieza.
   */
  function listaConFacetas(
    lista: ProductoDeVitrina[],
    vacio: React.ReactNode,
    modo: 'grilla' | 'filas' = 'grilla',
  ) {
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
        ) : modo === 'grilla' ? (
          // La grilla trae su propio margen negativo, así que el aire lateral
          // de la pantalla se pone acá y no adentro de la celda.
          <View style={{ paddingHorizontal: spacing[5] }}>{grillaProductos(filtradas)}</View>
        ) : (
          <View>
            {filtradas.map((p, i) => (
              <View key={p.oferta_id}>
                {i > 0 ? <Separador /> : null}
                {filaProducto(p)}
              </View>
            ))}
          </View>
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
                  // 🔴 'filas' A PROPÓSITO — ver la nota de `listaConFacetas`.
                  // La búsqueda ADVIERTE de alergia (§5.4 firmada) y la tarjeta
                  // todavía no tiene dónde decirlo. Migrarla hoy borraría un
                  // dato de salud; colgarlo fuera sería H-002.
                  'filas',
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
