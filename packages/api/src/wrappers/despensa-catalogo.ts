// EL CATÁLOGO DE LA DESPENSA y LA RECOMENDACIÓN DESDE EL EXPEDIENTE
// (S95-E · Bloque 2 · MODELO_DESPENSA v2.0 §4 y §6).
//
// 🔴 LA RAZÓN DE EXISTIR DE ESTE FRENTE ES LA EXCLUSIÓN DURA. Una tienda
// cualquiera te muestra siete alimentos; ésta te muestra los que tu perro
// **puede comer**. Por eso la exclusión no es un filtro más: es la feature.
//
// DÓNDE OCURRE LA EXCLUSIÓN, y la respuesta importa: **en Postgres**. Los
// predicados viajan como filtros de la consulta y los resuelven los índices
// GIN que la M2 creó para eso (`idx_productos_alergenos`,
// `idx_productos_especies`). Este archivo **no recorre una lista descartando
// productos**. Lo que sí hace, y es distinto, es **verificar el resultado**:
// ver §exclusión.
//
// LO QUE ESTE ARCHIVO NO HACE (y si alguna vez lo hace, está mal): calcular
// un precio, un impuesto o un flete. El motor calcula; el wrapper transporta.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import {
  falloDespensa,
  falloDespensaCodigo,
  esObjDespensa,
  type CodigoErrorDespensa,
  type ObjDespensa,
} from './_despensa-comun';

// ── Tipos de salida ─────────────────────────────────────────────────────────

/**
 * 🔴 FIRMA FOUNDER S96 (12-ago): la composición tiene CUATRO estados.
 * `verificada` y `no_aplica` pueden callar — pero son DOS silencios distintos:
 * «cotejamos y está bien» contra «acá no hay dato faltante» (la bolsa de
 * arena a la que la app le pedía ingredientes). `declarada_sin_verificar` y
 * `ausente` DICEN su condición en la superficie, siempre. Vocabulario
 * VERBATIM del CHECK de `productos.composicion_estado` y de
 * `EstadoComposicion` de `@epetplace/ui` (AvisoAlergia): cero mapeo.
 */
export type ComposicionEstado =
  | 'verificada'
  | 'declarada_sin_verificar'
  | 'ausente'
  | 'no_aplica';

/** EXPORTADA desde S99-L5b (N18): el lado vendedor estrecha con EL MISMO
 *  guard que el cliente — un valor desconocido no se inventa en ninguna
 *  de las dos caras. */
export function composicionEstado(v: unknown): ComposicionEstado | null {
  return v === 'verificada' || v === 'declarada_sin_verificar' ||
         v === 'ausente' || v === 'no_aplica' ? v : null;
}

/**
 * 🔴 S96 (4ª tanda): la advertencia dejó de ser coincidencia exacta — el
 * vocabulario tiene RELACIONES como dato (`cat_alergeno_relaciones`). Un
 * producto que declara `ave_no_especificada` ADVIERTE al alérgico a pollo,
 * y la voz lo dice imprecisa: «podría ser pollo», jamás «contiene pollo».
 * `exacta: false` ⟺ advertencia por relación `puede_ser`.
 */
export interface AlergenoVigilado {
  /** El código que un PRODUCTO declararía y que tiene que advertir. */
  declarado: string;
  /** El alérgeno documentado de la mascota que lo origina. */
  origen: string;
  /** true = coincidencia o `es_un` (bisonte ES res) → «contiene».
   *  false = `puede_ser` (ave podría ser pollo) → «podría ser». */
  exacta: boolean;
  /** La VOZ del catálogo (`cat_alergenos.nombre_es`) — «Proteína de ave sin
   *  especificar», no «ave_no_especificada». El helper del cliente deja de
   *  degradar guiones (pedido D, 12-ago). */
  declarado_nombre: string;
  /** La voz del origen. Si el alérgeno del EXPEDIENTE no está en el
   *  vocabulario (texto libre del vet), conserva SU texto — no se le
   *  inventa voz. */
  origen_nombre: string;
}

export interface ProductoDeVitrina {
  /** `ofertas.id` — el identificador con el que se compra. */
  oferta_id: string;
  /** 🔴 A QUIÉN LE COMPRÁS — el vendedor de la oferta publicada, derivado por
   *  trigger del sku (S96, desbloqueante del checkout: sin esto la app no
   *  podía crear el pedido). Es el `p_cuenta_comercial_id` que exigen
   *  `crearPedidoDespensa` y `calcularPromesaDespensa`. */
  cuenta_comercial_id: string;
  producto_id: string;
  variante_id: string;
  nombre: string;
  marca: string | null;
  familia_codigo: string;
  /** '15 kg', '3 kg' — la presentación es de la VARIANTE, no del producto. */
  presentacion: string;
  contenido_valor: number | null;
  contenido_unidad: string | null;
  peso_kg: number | null;
  /** Precio de la oferta publicada. El wrapper lo TRANSPORTA. */
  precio: number;
  /** 🔴 ¿SE PUEDE COMPRAR AHORA? — booleano y jamás número, por firma del
   *  founder (S99): la familia necesita *«¿puedo comprar esto?»*, no el
   *  inventario ajeno; *«quedan 3»* es táctica de escasez **y** fuga de dato
   *  de negocio (§7.4 al revés). Derivado en `ofertas` por trigger desde
   *  `vendedor_skus.stock_disponible > 0`, que **ya es neto de reservas** —
   *  la familia no puede leer `vendedor_skus` y está bien: el inventario es
   *  del negocio.
   *  ⚠️ La vitrina dice QUÉ HAY AHORA; el carrito dice QUÉ PASÓ CON LO QUE
   *  ELEGISTE. Leen la misma señal y ninguna reemplaza a la otra — ni a la
   *  voz del último minuto (D-827). */
  hay_stock: boolean;
  moneda: string;
  country_code: string;
  /** §6: una dieta de prescripción no se ofrece sin condición documentada. */
  es_dieta_prescripcion: boolean;
  /** Los alérgenos declarados del producto — viajan para que la superficie
   *  pueda DECIR por qué algo se excluyó, jamás para filtrar acá. */
  alergenos: string[];
  /** Ver `ComposicionEstado`: solo `verificada` puede callar. */
  composicion_estado: ComposicionEstado;
  especies_aplicables: string[];
  /** S99 (freno de C, mesa 18-ago): el eje etario COMPLETO — sin él el
   *  segundo eje de N20 contaba y no podía FILTRAR (pintarlo tocable era
   *  una puerta que rebota, Ley 23). Vacío = «todas las edades» (el
   *  comodín adjudicado: aparece en TODOS los filtros de momento). */
  momentos_aplicables: string[];
  /** 🔴 LA PORTADA. `null` HONESTO cuando el producto no tiene foto: la
   *  superficie dibuja su marcador, jamás una imagen rota ni un placeholder
   *  que finja ser el producto. Un catálogo de alimento sin fotos no es una
   *  vitrina — pero una foto inventada es peor. */
  foto_url: string | null;
}

export interface VarianteDeProducto {
  variante_id: string;
  codigo: string;
  presentacion: string;
  contenido_valor: number | null;
  contenido_unidad: string | null;
  peso_kg: number | null;
  /** null = esta presentación no tiene oferta publicada hoy. NULO HONESTO:
   *  la variante existe y no se puede comprar; decir 0 sería mentir. */
  oferta_id: string | null;
  precio: number | null;
  moneda: string | null;
  /** El vendedor de la oferta publicada (null ⟺ sin oferta). */
  cuenta_comercial_id: string | null;
  /** El país de la oferta — lo que el riel de moneda (`monto()`) exige para
   *  no formatear a mano (pedido D 12-ago; la clase D-448). null ⟺ sin oferta. */
  country_code: string | null;
}

export interface FichaProducto {
  producto_id: string;
  nombre: string;
  marca: string | null;
  familia_codigo: string;
  descripcion: string | null;
  especies_aplicables: string[];
  tallas_aplicables: string[];
  momentos_aplicables: string[];
  ingredientes_activos: string[];
  alergenos: string[];
  /** Ver `ComposicionEstado`: solo `verificada` puede callar. */
  composicion_estado: ComposicionEstado;
  /** DE QUÉ MERCADO es la ficha de composición (firma S96 3ª tanda): 'EC',
   *  'global' (ficha del fabricante — jamás sostiene una verificación) o
   *  `null` = fuente no declarada. El fabricante formula por mercado. */
  composicion_mercado: string | null;
  es_dieta_prescripcion: boolean;
  /** La portada de la ficha. Mismo criterio que la vitrina. */
  foto_url: string | null;
  /** El resto de la galería, ya normalizada a URLs. Vacía es vacía: no se
   *  rellena con la portada repetida. */
  fotos: string[];
  variantes: VarianteDeProducto[];
}

export interface Recomendacion {
  /** Lo que la mascota SÍ puede comprar. */
  productos: ProductoDeVitrina[];
  /** El perfil contra el que se filtró — la superficie lo muestra para que
   *  la familia entienda POR QUÉ ve lo que ve (§6: el criterio se explica). */
  criterio: {
    especie: string | null;
    talla: string | null;
    /** Los alérgenos documentados que se usaron para excluir. */
    alergenos_excluidos: string[];
    /** S96: la expansión POR RELACIÓN con la que se excluyó de verdad —
     *  incluye lo exacto (pollo, bisonte para el alérgico a res) y lo
     *  imprecisa (`ave_no_especificada` para el alérgico a pollo). La
     *  superficie explica el porqué con esto, con su voz por `exacta`. */
    alergenos_vigilados: AlergenoVigilado[];
    /** true = la familia declaró "sin alergias conocidas" (S82). Distinto de
     *  "no sabemos": uno es un dato, el otro es un hueco. */
    sin_alergias_declarado: boolean;
    tiene_condicion_cronica: boolean;
    /** La etapa de vida contra la que se filtró: `cachorro` · `joven` ·
     *  `adulto` · `senior`. */
    etapa: string | null;
    /** 🔴 true = la mascota NO tiene fecha de nacimiento, así que **no se
     *  filtró por etapa** y la vitrina incluye alimento de cualquier edad.
     *  La superficie puede invitar a completar la fecha: es la diferencia
     *  entre recomendar y adivinar. */
    etapa_desconocida: boolean;
  };
}

// ── Helpers de lectura de shape (guards L-124) ──────────────────────────────

function textArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/**
 * La etapa de vida, ESPEJO de `calcular_etapa_vida()` de la base — mismos
 * cortes, misma partición por especie, medidos ejecutando la función en S95-J2.
 *
 * 🔴 DEVUELVE `null` DONDE LA BASE DEVUELVE `'desconocida'`, y es a propósito:
 * acá `null` significa «no filtres por etapa». La palabra `desconocida` no es
 * un valor válido de `momentos_aplicables` (su CHECK no la admite), así que
 * usarla como filtro no devolvería nada.
 */
function etapaDeVida(nacimiento: unknown, especie: string | null): string | null {
  if (typeof nacimiento !== 'string' || nacimiento.length === 0) return null;
  const anios = (Date.now() - new Date(nacimiento).getTime()) / (365.25 * 24 * 3600 * 1000);
  if (Number.isNaN(anios)) return null;
  const cortes: Record<string, [number, number, number]> =
    { perro: [1, 3, 8], gato: [1, 3, 8], conejo: [0.5, 2, 6], ave: [1, 3, 10] };
  const [c1, c2, c3] = cortes[especie ?? ''] ?? [0.5, 2, 5];
  if (anios < c1) return 'cachorro';
  if (anios < c2) return 'joven';
  if (anios < c3) return 'adulto';
  return 'senior';
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' ? v : null;
}

/** Literal de array de Postgres para los filtros `ov`/`cs` de PostgREST.
 *  Cada elemento va entre comillas dobles con escape — un alérgeno con coma
 *  ("pollo, pavo") partiría el literal y **la exclusión fallaría ABIERTA**,
 *  que es el peor modo de falla posible de este archivo. */
function literalArrayPg(valores: string[]): string {
  return `{${valores.map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
}

const SELECT_VITRINA = `
  id, precio, moneda, country_code, cuenta_comercial_id, hay_stock,
  producto_variantes!inner (
    id, codigo, presentacion, contenido_valor, contenido_unidad, peso_kg, activo,
    productos!inner (
      id, nombre, marca, familia_codigo, estado, especies_aplicables,
      momentos_aplicables,
      alergenos, composicion_estado, es_dieta_prescripcion, imagen_url, imagenes
    )
  )
`;

/**
 * 🔴 LA FOTO — y la forma de `imagenes` NO SE ADIVINÓ, se midió… hasta donde
 * se podía. Lo medido: `imagen_url` es `text` nullable, e `imagenes` es
 * `jsonb` con DEFAULT `'[]'` — o sea, un ARRAY. **Lo que no se pudo medir es
 * la forma de sus ELEMENTOS**: hay cero filas en `productos` y la columna no
 * tiene comentario que la declare.
 *
 * Ante eso, la opción honesta no es elegir una forma y rezar: es **aceptar las
 * dos que el mundo usa** —`["https://…"]` y `[{"url":"https://…"}]`— y
 * descartar en silencio lo que no sea ninguna. *Un catálogo que no muestra una
 * foto porque el vendedor la cargó como objeto en vez de string es un defecto
 * que se descubre mirando la vitrina vacía, no leyendo un error.*
 *
 * `imagen_url` MANDA cuando existe: es la portada declarada. `imagenes` es el
 * resto de la galería, y su primer elemento sirve de portada solo si no hay
 * `imagen_url`.
 */
function urlDeImagen(v: unknown): string | null {
  if (typeof v === 'string' && v.trim().length > 0) return v;
  if (esObjDespensa(v)) {
    for (const clave of ['url', 'src', 'imagen_url']) {
      const u = v[clave];
      if (typeof u === 'string' && u.trim().length > 0) return u;
    }
  }
  return null;
}

/** EXPORTADA desde S99-L5b (N18): la completitud del VENDEDOR deriva su
 *  razón `sin_foto` de ESTA misma función — una fuente, jamás un cómputo
 *  paralelo. Si la regla de portada cambia acá, cambia para los dos lados. */
export function fotosDeProducto(p: ObjDespensa): { portada: string | null; galeria: string[] } {
  const galeria = (Array.isArray(p.imagenes) ? p.imagenes : [])
    .map(urlDeImagen)
    .filter((u): u is string => u !== null);
  const declarada = typeof p.imagen_url === 'string' && p.imagen_url.trim().length > 0
    ? p.imagen_url
    : null;
  return { portada: declarada ?? galeria[0] ?? null, galeria };
}

function mapearVitrina(filas: unknown[]): ProductoDeVitrina[] | null {
  const salida: ProductoDeVitrina[] = [];
  for (const fila of filas) {
    if (!esObjDespensa(fila) || typeof fila.id !== 'string' || typeof fila.precio !== 'number') {
      return null;
    }
    const v = fila.producto_variantes;
    if (!esObjDespensa(v) || typeof v.id !== 'string' || typeof v.presentacion !== 'string') {
      return null;
    }
    const p = v.productos;
    if (!esObjDespensa(p) || typeof p.id !== 'string' || typeof p.nombre !== 'string' ||
        typeof p.familia_codigo !== 'string') {
      return null;
    }
    // Los dos son NOT NULL en la base (S96): si faltan, la forma está rota y
    // se rechaza entero — un producto sin vendedor no se puede comprar, y un
    // producto sin estado de composición no puede decir su condición.
    const estadoCompo = composicionEstado(p.composicion_estado);
    if (typeof fila.cuenta_comercial_id !== 'string' || estadoCompo === null) {
      return null;
    }
    salida.push({
      oferta_id: fila.id,
      cuenta_comercial_id: fila.cuenta_comercial_id,
      producto_id: p.id,
      variante_id: v.id,
      nombre: p.nombre,
      marca: typeof p.marca === 'string' ? p.marca : null,
      familia_codigo: p.familia_codigo,
      presentacion: v.presentacion,
      contenido_valor: numOrNull(v.contenido_valor),
      contenido_unidad: typeof v.contenido_unidad === 'string' ? v.contenido_unidad : null,
      peso_kg: numOrNull(v.peso_kg),
      precio: fila.precio,
      // FAIL-CLOSED DE SIGNIFICADO (L-247): lo que no llegue como `true`
      // explícito se lee como NO comprable. Prometer una compra que va a
      // rebotar al pagar es peor que no ofrecerla.
      hay_stock: fila.hay_stock === true,
      moneda: typeof fila.moneda === 'string' ? fila.moneda : 'USD',
      country_code: typeof fila.country_code === 'string' ? fila.country_code : 'EC',
      es_dieta_prescripcion: p.es_dieta_prescripcion === true,
      alergenos: textArray(p.alergenos),
      composicion_estado: estadoCompo,
      especies_aplicables: textArray(p.especies_aplicables),
      momentos_aplicables: textArray(p.momentos_aplicables),
      foto_url: fotosDeProducto(p).portada,
    });
  }
  return salida;
}

// ── A · La vitrina — lo publicado, sin mascota ──────────────────────────────

export interface FiltrosVitrina {
  familia_codigo?: string;
  country_code?: string;
  /** Tope de filas. Sin tope una vitrina crece sin techo (D-497). */
  limite?: number;
}

/**
 * Los productos PUBLICADOS. Peldaño 0: se ven sin elegir mascota — igual que
 * el "desde" del grooming (S61-A5). Sin exclusión, porque sin mascota no hay
 * contra qué excluir; la recomendación es otra función y lo dice en su nombre.
 */
export async function listarProductosDespensa(
  filtros: FiltrosVitrina = {},
): Promise<ResultadoWrapper<ProductoDeVitrina[], CodigoErrorDespensa>> {
  let q = getClient()
    .from('ofertas')
    .select(SELECT_VITRINA)
    .eq('estado', 'publicada')
    .eq('producto_variantes.activo', true)
    .eq('producto_variantes.productos.estado', 'activo');

  if (filtros.familia_codigo !== undefined) {
    q = q.eq('producto_variantes.productos.familia_codigo', filtros.familia_codigo);
  }
  if (filtros.country_code !== undefined) q = q.eq('country_code', filtros.country_code);

  const { data, error } = await q.limit(filtros.limite ?? 100);
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const productos = mapearVitrina(data);
  if (productos === null) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: productos };
}

// ── B · La ficha de un producto con TODAS sus presentaciones ────────────────

export async function obtenerFichaProducto(
  productoId: string,
): Promise<ResultadoWrapper<FichaProducto, CodigoErrorDespensa>> {
  const cliente = getClient();
  const [prod, vars] = await Promise.all([
    cliente
      .from('productos')
      .select('id, nombre, marca, familia_codigo, descripcion, especies_aplicables, tallas_aplicables, momentos_aplicables, ingredientes_activos, alergenos, composicion_estado, composicion_mercado, es_dieta_prescripcion, imagen_url, imagenes')
      .eq('id', productoId)
      .maybeSingle(),
    cliente
      .from('producto_variantes')
      .select('id, codigo, presentacion, contenido_valor, contenido_unidad, peso_kg, ofertas(id, precio, moneda, estado, cuenta_comercial_id, country_code)')
      .eq('producto_id', productoId)
      .eq('activo', true),
  ]);

  if (prod.error) return falloDespensa(prod.error.message);
  if (vars.error) return falloDespensa(vars.error.message);
  const p = prod.data;
  if (p === null || !esObjDespensa(p) || typeof p.nombre !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  const estadoCompoFicha = composicionEstado(p.composicion_estado);
  if (estadoCompoFicha === null) return falloDespensa('datos_inconsistentes');

  const variantes: VarianteDeProducto[] = [];
  for (const v of vars.data ?? []) {
    if (!esObjDespensa(v) || typeof v.id !== 'string' || typeof v.presentacion !== 'string') {
      return falloDespensa('datos_inconsistentes');
    }
    // El UNIQUE parcial `uq_oferta_publicada_por_variante` garantiza que hay
    // **una sola** publicada por variante — no hay que elegir entre varias.
    const publicadas = (Array.isArray(v.ofertas) ? v.ofertas : []).filter(
      (o) => esObjDespensa(o) && o.estado === 'publicada',
    );
    const of: unknown = publicadas[0];
    variantes.push({
      variante_id: v.id,
      codigo: typeof v.codigo === 'string' ? v.codigo : '',
      presentacion: v.presentacion,
      contenido_valor: numOrNull(v.contenido_valor),
      contenido_unidad: typeof v.contenido_unidad === 'string' ? v.contenido_unidad : null,
      peso_kg: numOrNull(v.peso_kg),
      oferta_id: esObjDespensa(of) && typeof of.id === 'string' ? of.id : null,
      precio: esObjDespensa(of) ? numOrNull(of.precio) : null,
      moneda: esObjDespensa(of) && typeof of.moneda === 'string' ? of.moneda : null,
      cuenta_comercial_id:
        esObjDespensa(of) && typeof of.cuenta_comercial_id === 'string'
          ? of.cuenta_comercial_id
          : null,
      country_code:
        esObjDespensa(of) && typeof of.country_code === 'string' ? of.country_code : null,
    });
  }

  return {
    ok: true,
    data: {
      producto_id: productoId,
      nombre: p.nombre,
      marca: typeof p.marca === 'string' ? p.marca : null,
      familia_codigo: typeof p.familia_codigo === 'string' ? p.familia_codigo : '',
      descripcion: typeof p.descripcion === 'string' ? p.descripcion : null,
      especies_aplicables: textArray(p.especies_aplicables),
      tallas_aplicables: textArray(p.tallas_aplicables),
      momentos_aplicables: textArray(p.momentos_aplicables),
      ingredientes_activos: textArray(p.ingredientes_activos),
      alergenos: textArray(p.alergenos),
      composicion_estado: estadoCompoFicha,
      composicion_mercado: typeof p.composicion_mercado === 'string' ? p.composicion_mercado : null,
      es_dieta_prescripcion: p.es_dieta_prescripcion === true,
      foto_url: fotosDeProducto(p).portada,
      fotos: fotosDeProducto(p).galeria,
      variantes,
    },
  };
}

// ── B2 · S99-L5b (N20) — los conteos por eje, SOBRE LO COMPRABLE ────────────

export interface ConteosVitrina {
  /** ⚖️ N20 ENMENDADA (mesa 17-ago): la especie es un FILTRO, jamás una
   *  carpeta — un producto multi-especie cuenta en CADA una (por eso la
   *  suma puede superar el total: 11+3=14 sobre 13 fue la prueba). Nada
   *  de tabs excluyentes sobre estos números. */
  por_especie: { especie: string; productos: number }[];
  /** momento null = comprables SIN momento declarado. ⚖️ ADJUDICADO (mesa
   *  17-ago, con L-248): el NULL significa TODAS LAS EDADES — el producto
   *  aparece en TODOS los filtros de momento, jamás en un bucket propio.
   *  Quien encienda el eje por umbral suma los NULL a cada momento; si
   *  los deja afuera, el día que el umbral dispare solos van a
   *  desaparecer en silencio (el caso exacto que L-248 existe para
   *  impedir). Y el criterio del umbral: un filtro que no REPARTE no es
   *  un filtro — volumen no basta. */
  por_especie_momento: { especie: string; momento: string | null; productos: number }[];
}

/** Ley 23 hecha lector: el segundo toque de N20 no ofrece lo que va a
 *  rechazar — un eje con cero comprables no se pinta. Corre sobre LO
 *  COMPRABLE por adjudicación (a) de mesa (17-ago, `PLAN_S99`): oferta
 *  publicada × variante activa × producto activo — jamás el canónico.
 *  UN viaje, dos granularidades (el total por especie NO es la suma de
 *  los pares: multi-momento cuenta una vez por par y una en el total). */
export async function conteosVitrinaPorEje(): Promise<
  ResultadoWrapper<ConteosVitrina, CodigoErrorDespensa>
> {
  const { data, error } = await getClient().rpc('conteos_vitrina_por_eje');
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  const leerFila = (v: unknown): { especie: string; momento: string | null; productos: number } | null => {
    if (!esObjDespensa(v) || typeof v.especie !== 'string' || typeof v.productos !== 'number') return null;
    return {
      especie: v.especie,
      momento: typeof v.momento === 'string' ? v.momento : null,
      productos: v.productos,
    };
  };
  // L-247: degradación propia — un motor viejo sin las claves devuelve [].
  const porEspecie = (Array.isArray(data.por_especie) ? data.por_especie : [])
    .map(leerFila)
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .map(({ especie, productos }) => ({ especie, productos }));
  const porPar = (Array.isArray(data.por_especie_momento) ? data.por_especie_momento : [])
    .map(leerFila)
    .filter((f): f is NonNullable<typeof f> => f !== null);
  return { ok: true, data: { por_especie: porEspecie, por_especie_momento: porPar } };
}

// ── B3 · S99 — LA PROMESA ANTES DE COMPRAR (firma founder 18-ago) ───────────

export interface PromesaDeVendedor {
  cuenta_comercial_id: string;
  /** ok:true → hay promesa. `fecha`+`desde`/`hasta` son la ventana real.
   *  ⚠️ **`saltos_por_cupo` > 0 significa que la ventana SE CORRIÓ — pero
   *  NO dice por qué** (rojo de C, 18-ago: prometía con `saltos: 1` y el
   *  cupo VACÍO, porque era domingo y nadie reparte los domingos). **La
   *  voz se construye sobre `motivoCorrimiento`, jamás sobre este
   *  número.** */
  ok: boolean;
  fecha: string | null;
  desde: string | null;
  hasta: string | null;
  saltos_por_cupo: number;
  /** ok:false → la razón TIPADA del motor (`sin_turnos_de_entrega` ·
   *  `sin_capacidad_de_reparto` · `sin_cupo_ese_dia`). **La superficie la
   *  DICE — jamás la traduce a un vacío** (L-218: un vacío tendría dos
   *  significados, «no puede» y «no sabemos»). */
  error: string | null;
  detalle: string | null;
  /** 🔴 LA CAUSA DEL CORRIMIENTO — el campo que la voz necesita:
   *  · `'sin_operacion'` → ese día el vendedor NO REPARTE (domingo, feriado
   *    propio). **NO es escasez: decir «no hay disponibilidad» acá sería
   *    hacerle perder una venta por una escasez que no existe.**
   *  · `'cupo_lleno'` → sí es escasez: la frase del founder, con su pregunta.
   *  · `'mixto'` → las dos causas en el tramo salteado.
   *  · `null` → no hubo corrimiento (o la promesa falló). */
  motivoCorrimiento: 'sin_operacion' | 'cupo_lleno' | 'mixto' | null;
}

/** El guard del motivo — estrecha de `unknown` al vocabulario cerrado.
 *  **Fail-closed de SIGNIFICADO:** lo desconocido (o un motor viejo sin el
 *  campo) cae en `null` = «no sé por qué se corrió», JAMÁS en `cupo_lleno`,
 *  que afirmaría una escasez que puede no existir (el rojo de C). */
function motivoDeCorrimiento(v: unknown): 'sin_operacion' | 'cupo_lleno' | 'mixto' | null {
  return v === 'sin_operacion' || v === 'cupo_lleno' || v === 'mixto' ? v : null;
}

/**
 * La promesa de entrega **POR VENDEDOR**, para decirla ANTES DE COMPRAR.
 *
 * 🔴 EL MOMENTO ES LA MITAD DE LA FIRMA (founder, 18-ago): *decirlo DESPUÉS
 * de comprar es una disculpa; decirlo ANTES es información, y la persona
 * todavía puede elegir.* Hoy la promesa se puebla al checkout; esto la trae
 * a la vitrina/ficha.
 *
 * 🔴 POR VENDEDOR, JAMÁS POR PRODUCTO — la promesa depende de la CUENTA y el
 * día, no del SKU: con ~400 productos y 5 vendedores son 5 evaluaciones, no
 * 400 (medido: ~5 ms las cinco). **Quien llame pasa los vendedores DISTINTOS
 * de lo que va a pintar.**
 *
 * Y la voz que esto habilita, de la firma: dice QUÉ NO SE PUEDE **y QUÉ SÍ**
 * —jamás solo el rechazo— y **termina en PREGUNTA, no en aviso**: la familia
 * decide.
 */
export async function promesaPorVendedor(
  cuentas: string[],
  fechaProgramada?: string,
): Promise<ResultadoWrapper<PromesaDeVendedor[], CodigoErrorDespensa>> {
  if (cuentas.length === 0) return { ok: true, data: [] };
  const { data, error } = await getClient().rpc('promesa_por_vendedor', {
    p_cuentas: cuentas,
    p_fecha_programada: fechaProgramada ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  // L-247: degradación propia — motor viejo sin la clave devuelve [].
  const filas = (Array.isArray(data.promesas) ? data.promesas : []).flatMap((v) => {
    if (!esObjDespensa(v) || typeof v.cuenta_comercial_id !== 'string') return [];
    const p = esObjDespensa(v.promesa) ? v.promesa : {};
    return [{
      cuenta_comercial_id: v.cuenta_comercial_id,
      ok: p.ok === true,
      fecha: typeof p.fecha === 'string' ? p.fecha : null,
      desde: typeof p.desde === 'string' ? p.desde : null,
      hasta: typeof p.hasta === 'string' ? p.hasta : null,
      saltos_por_cupo: typeof p.saltos_por_cupo === 'number' ? p.saltos_por_cupo : 0,
      error: typeof p.error === 'string' ? p.error : null,
      detalle: typeof p.detalle === 'string' ? p.detalle : null,
      // L-247 + fail-closed de SIGNIFICADO: un valor desconocido (o un
      // motor viejo sin el campo) cae en `null` = «no sé por qué se
      // corrió» — jamás en `cupo_lleno`, que afirmaría escasez.
      motivoCorrimiento: motivoDeCorrimiento(v.motivo_corrimiento),
    }];
  });
  return { ok: true, data: filas };
}

// ── C · Búsqueda propia ─────────────────────────────────────────────────────

/** Busca por nombre o marca dentro de lo PUBLICADO. El `ilike` lo resuelve
 *  Postgres; el wrapper no recorre nada. Un término vacío devuelve `[]` —
 *  vacío honesto, no la vitrina entera disfrazada de resultado. */
export async function buscarProductosDespensa(
  termino: string,
  limite = 50,
): Promise<ResultadoWrapper<ProductoDeVitrina[], CodigoErrorDespensa>> {
  const t = termino.trim();
  if (t.length === 0) return { ok: true, data: [] };
  const patron = `%${t.replace(/[%_]/g, (c) => `\\${c}`)}%`;

  const { data, error } = await getClient()
    .from('ofertas')
    .select(SELECT_VITRINA)
    .eq('estado', 'publicada')
    .eq('producto_variantes.activo', true)
    .eq('producto_variantes.productos.estado', 'activo')
    .or(`nombre.ilike.${patron},marca.ilike.${patron}`, {
      referencedTable: 'producto_variantes.productos',
    })
    .limit(limite);

  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const productos = mapearVitrina(data);
  if (productos === null) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: productos };
}

// ── D · 🔴 LA RECOMENDACIÓN — §exclusión ────────────────────────────────────
//
// DOS CONSULTAS Y NINGÚN FILTRO EN MEMORIA:
//
//  ① Se lee el perfil de la mascota (especie, talla, alergias documentadas,
//     condiciones crónicas). Es lectura del EXPEDIENTE, gobernada por su RLS
//     de siempre — el rol vendedor jamás llega acá (§7.4).
//  ② Se pide la vitrina **con los predicados de exclusión pegados a la
//     consulta**. Postgres los resuelve con los índices GIN de la M2. Este
//     archivo nunca recibe un producto contraindicado y lo descarta: nunca
//     lo recibe.
//
// 🔴 Y DESPUÉS SE VERIFICA, QUE NO ES LO MISMO QUE FILTRAR. Un literal de
// array mal armado (un alérgeno con coma, una comilla) haría que el filtro
// **falle ABIERTO** y devuelva justo lo que tenía que esconder — el peor modo
// de falla imaginable en la única feature que justifica este frente. Por eso,
// después de traer el resultado, se comprueba que ninguna fila cruce la lista
// de alérgenos; y si alguna la cruza **no se la saca en silencio: se rechaza
// la respuesta entera** con `exclusion_no_verificable`. Sacarla en silencio
// SÍ sería filtrar en memoria, y además taparía el defecto para siempre.
// *Mostrar de menos es un mal día; mostrar el alimento que manda al perro a
// urgencias es otra cosa.*
export async function recomendarParaMascota(
  mascotaId: string,
  limite = 20,
): Promise<ResultadoWrapper<Recomendacion, CodigoErrorDespensa>> {
  const cliente = getClient();

  // ① El expediente
  const [masc, perfil] = await Promise.all([
    cliente.from('mascotas').select('id, especie, talla, fecha_nacimiento').eq('id', mascotaId).maybeSingle(),
    cliente
      .from('mascota_perfil_vigente')
      .select('alergias, condiciones_cronicas, alergias_ninguna_declarada_en')
      .eq('mascota_id', mascotaId)
      .maybeSingle(),
  ]);
  if (masc.error) return falloDespensa(masc.error.message);
  if (perfil.error) return falloDespensa(perfil.error.message);
  if (masc.data === null) return falloDespensaCodigo('sin_acceso_a_mascota');

  const especie = typeof masc.data.especie === 'string' ? masc.data.especie : null;
  const talla = typeof masc.data.talla === 'string' ? masc.data.talla : null;

  // 🔴 LA ETAPA DE VIDA — y la regla que impide que este filtro vacíe la app.
  //
  // S95-K midió que la recomendación NO filtraba por etapa: un perro adulto
  // veía alimento de cachorro. *Recomendarle comida de cachorro a un bulldog
  // adulto es incumplir la promesa en chico, y en chico es como empieza.*
  //
  // PERO también midió lo otro, y sin eso la cura habría sido peor que el
  // defecto: **Zeus no tiene fecha de nacimiento, y 64 de las 72 mascotas de
  // esta base tampoco.** Filtrar a ciegas les habría dejado la vitrina VACÍA,
  // porque `desconocida` no matchea ni `cachorro` ni `adulto`.
  //
  // ⇒ **Sin fecha, no se filtra por etapa** — y la respuesta lo DICE, para que
  //   la pantalla pueda invitar a completarla. Mostrar de más con el criterio
  //   declarado es honesto; mostrar nada sin decir por qué, no.
  const etapa = etapaDeVida(masc.data.fecha_nacimiento, especie);

  // La forma del jsonb NO se adivinó: sale del cuerpo de
  // `_trg_alergia_propagar_perfil` — `[{alergeno, severidad, categoria,
  // estado, fecha_diagnostico, evento_id}]`.
  const crudas = Array.isArray(perfil.data?.alergias) ? perfil.data.alergias : [];
  const alergenos: string[] = [];
  for (const a of crudas) {
    if (!esObjDespensa(a)) continue;
    // Una alergia DESCARTADA por el vet dejó de excluir. Una `confirmada` o
    // `sospechada` excluye: ante la duda no se ofrece.
    if (a.estado === 'descartada') continue;
    if (typeof a.alergeno === 'string' && a.alergeno.trim().length > 0) {
      alergenos.push(a.alergeno.trim());
    }
  }
  const cronicas = Array.isArray(perfil.data?.condiciones_cronicas)
    ? perfil.data.condiciones_cronicas
    : [];
  const tieneCronica = cronicas.length > 0;

  // 🔴 S96: LA EXPANSIÓN POR RELACIÓN — la exclusión deja de ser coincidencia
  // exacta. `ave_no_especificada` excluye para el alérgico a pollo (imprecisa,
  // «podría ser»), `bisonte` excluye para el alérgico a res (exacta, es_un).
  // La expansión la resuelve la base leyendo `cat_alergeno_relaciones`: si la
  // relación viviera acá, mañana nadie sabría por qué advierte.
  let vigilados: AlergenoVigilado[] = [];
  if (alergenos.length > 0) {
    const exp = await cliente.rpc('expandir_alergenos_a_vigilar', {
      p_alergenos: alergenos,
    });
    if (exp.error) return falloDespensa(exp.error.message);
    if (!Array.isArray(exp.data)) return falloDespensa('datos_inconsistentes');
    for (const v of exp.data) {
      if (!esObjDespensa(v) || typeof v.declarado !== 'string' ||
          typeof v.origen !== 'string' || typeof v.exacta !== 'boolean') {
        return falloDespensa('datos_inconsistentes');
      }
      vigilados.push({
        declarado: v.declarado,
        origen: v.origen,
        exacta: v.exacta,
        declarado_nombre: typeof v.declarado_nombre === 'string' ? v.declarado_nombre : v.declarado,
        origen_nombre: typeof v.origen_nombre === 'string' ? v.origen_nombre : v.origen,
      });
    }
    // ANTE LA DUDA NO SE OFRECE: si la expansión volvió vacía teniendo
    // alérgenos documentados, algo está roto — y roto acá significa
    // recomendar lo que manda al perro a urgencias. Se rechaza entero.
    if (vigilados.length === 0) return falloDespensaCodigo('exclusion_no_verificable');
  }
  const codigosVigilados = [...new Set(vigilados.map((v) => v.declarado))];

  // ② La vitrina, con la exclusión PEGADA A LA CONSULTA
  let q = cliente
    .from('ofertas')
    .select(SELECT_VITRINA)
    .eq('estado', 'publicada')
    .eq('producto_variantes.activo', true)
    .eq('producto_variantes.productos.estado', 'activo');

  if (especie !== null) {
    // `especies_aplicables` ⊇ {especie}. Un producto que no declara especie
    // NO entra: la recomendación es conservadora a propósito. En la vitrina
    // general (`listarProductosDespensa`) sí aparece.
    q = q.contains('producto_variantes.productos.especies_aplicables', [especie]);
  }
  if (codigosVigilados.length > 0) {
    // 🔴 EL PREDICADO DURO: `alergenos` NO se solapa con lo VIGILADO — que
    // desde S96 es lo documentado MÁS su expansión por relación.
    q = q.not(
      'producto_variantes.productos.alergenos',
      'ov',
      literalArrayPg(codigosVigilados),
    );
  }
  if (etapa !== null) {
    // El producto declara para qué etapas sirve; el array VACÍO significa
    // «cualquiera» (S95-J2) y por eso `overlaps` no alcanza: hay que dejar
    // pasar también a los que no declaran nada.
    q = q.or(
      `momentos_aplicables.cs.{${etapa}},momentos_aplicables.eq.{}`,
      { referencedTable: 'producto_variantes.productos' },
    );
  }
  if (!tieneCronica) {
    // §6: una dieta de prescripción no se ofrece a una mascota sana. Con
    // condición documentada sí entra — la indicación fina es del veterinario,
    // no de la vitrina.
    q = q.eq('producto_variantes.productos.es_dieta_prescripcion', false);
  }

  const { data, error } = await q.limit(limite);
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const productos = mapearVitrina(data);
  if (productos === null) return falloDespensa('datos_inconsistentes');

  // 🔴 LA VERIFICACIÓN FAIL-CLOSED (no es un filtro: no saca nada, rechaza todo)
  //    — contra el conjunto VIGILADO entero, relaciones incluidas.
  const prohibidos = new Set(codigosVigilados.map((a) => a.toLowerCase()));
  const cruza = productos.some((p) =>
    p.alergenos.some((a) => prohibidos.has(a.toLowerCase())),
  );
  if (cruza) return falloDespensaCodigo('exclusion_no_verificable');

  return {
    ok: true,
    data: {
      productos,
      criterio: {
        especie,
        talla,
        alergenos_excluidos: alergenos,
        alergenos_vigilados: vigilados,
        sin_alergias_declarado:
          perfil.data?.alergias_ninguna_declarada_en !== null &&
          perfil.data?.alergias_ninguna_declarada_en !== undefined,
        tiene_condicion_cronica: tieneCronica,
        etapa,
        etapa_desconocida: etapa === null,
      },
    },
  };
}

// ── E · El paso de entendimiento QUEDA REGISTRADO (§5.4, S96) ───────────────
//
// La advertencia de alergia deja decidir al dueño — y su decisión informada
// se REGISTRA, append-only, en `alergia_entendimientos`. La pantalla decide
// cuándo re-preguntar (puede leer los propios por RLS); acá solo se garantiza
// que lo entendido quede escrito. El registro jamás se edita ni se borra.

/**
 * S96 (4ª tanda): la expansión por relación, expuesta para la ADVERTENCIA de
 * búsqueda y ficha (la exclusión de la recomendación ya la usa por dentro).
 * La pantalla cruza `declarado` contra `producto.alergenos` y arma la voz con
 * `exacta`: true → «contiene {origen}» · false → «declara {declarado} y
 * podría ser {origen}». La imprecisión SE DICE, jamás se disfraza de certeza.
 */
export async function expandirAlergenosAVigilar(
  alergenos: string[],
): Promise<ResultadoWrapper<AlergenoVigilado[], CodigoErrorDespensa>> {
  if (alergenos.length === 0) return { ok: true, data: [] };
  const { data, error } = await getClient().rpc('expandir_alergenos_a_vigilar', {
    p_alergenos: alergenos,
  });
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: AlergenoVigilado[] = [];
  for (const v of data) {
    if (!esObjDespensa(v) || typeof v.declarado !== 'string' ||
        typeof v.origen !== 'string' || typeof v.exacta !== 'boolean') {
      return falloDespensa('datos_inconsistentes');
    }
    salida.push({
      declarado: v.declarado,
      origen: v.origen,
      exacta: v.exacta,
      declarado_nombre: typeof v.declarado_nombre === 'string' ? v.declarado_nombre : v.declarado,
      origen_nombre: typeof v.origen_nombre === 'string' ? v.origen_nombre : v.origen,
    });
  }
  return { ok: true, data: salida };
}

/**
 * EL VOCABULARIO DE ALÉRGENOS CON SU VOZ — `cat_alergenos` vivo (código +
 * `nombre_es`). Un fetch cacheable por la pantalla; sirve a la vitrina, la
 * ficha y la advertencia por igual (pedido D, 12-ago: su `vozAlergeno` pasa
 * de degradación a lector con esto).
 */
export async function listarAlergenos(): Promise<
  ResultadoWrapper<{ codigo: string; nombre: string }[], CodigoErrorDespensa>
> {
  const { data, error } = await getClient()
    .from('cat_alergenos')
    .select('codigo, nombre_es')
    .eq('activo', true)
    .order('codigo');
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: { codigo: string; nombre: string }[] = [];
  for (const a of data) {
    if (!esObjDespensa(a) || typeof a.codigo !== 'string') {
      return falloDespensa('datos_inconsistentes');
    }
    salida.push({
      codigo: a.codigo,
      nombre: typeof a.nombre_es === 'string' ? a.nombre_es : a.codigo,
    });
  }
  return { ok: true, data: salida };
}

export async function registrarEntendimientoAlergia(
  productoId: string,
  mascotaId: string,
  /** Los alérgenos que la advertencia mostró — los que el dueño entendió. */
  alergenos: string[],
): Promise<ResultadoWrapper<{ entendimiento_id: string }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('registrar_entendimiento_alergia', {
    p_producto_id: productoId,
    p_mascota_id: mascotaId,
    p_alergenos: alergenos,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || typeof data.entendimiento_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return { ok: true, data: { entendimiento_id: data.entendimiento_id } };
}
