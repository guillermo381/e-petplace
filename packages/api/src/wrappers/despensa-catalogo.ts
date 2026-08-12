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

export interface ProductoDeVitrina {
  /** `ofertas.id` — el identificador con el que se compra. */
  oferta_id: string;
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
  moneda: string;
  country_code: string;
  /** §6: una dieta de prescripción no se ofrece sin condición documentada. */
  es_dieta_prescripcion: boolean;
  /** Los alérgenos declarados del producto — viajan para que la superficie
   *  pueda DECIR por qué algo se excluyó, jamás para filtrar acá. */
  alergenos: string[];
  especies_aplicables: string[];
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
  id, precio, moneda, country_code,
  producto_variantes!inner (
    id, codigo, presentacion, contenido_valor, contenido_unidad, peso_kg, activo,
    productos!inner (
      id, nombre, marca, familia_codigo, estado, especies_aplicables,
      alergenos, es_dieta_prescripcion, imagen_url, imagenes
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

function fotosDeProducto(p: ObjDespensa): { portada: string | null; galeria: string[] } {
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
    salida.push({
      oferta_id: fila.id,
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
      moneda: typeof fila.moneda === 'string' ? fila.moneda : 'USD',
      country_code: typeof fila.country_code === 'string' ? fila.country_code : 'EC',
      es_dieta_prescripcion: p.es_dieta_prescripcion === true,
      alergenos: textArray(p.alergenos),
      especies_aplicables: textArray(p.especies_aplicables),
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
      .select('id, nombre, marca, familia_codigo, descripcion, especies_aplicables, tallas_aplicables, momentos_aplicables, ingredientes_activos, alergenos, es_dieta_prescripcion, imagen_url, imagenes')
      .eq('id', productoId)
      .maybeSingle(),
    cliente
      .from('producto_variantes')
      .select('id, codigo, presentacion, contenido_valor, contenido_unidad, peso_kg, ofertas(id, precio, moneda, estado)')
      .eq('producto_id', productoId)
      .eq('activo', true),
  ]);

  if (prod.error) return falloDespensa(prod.error.message);
  if (vars.error) return falloDespensa(vars.error.message);
  const p = prod.data;
  if (p === null || !esObjDespensa(p) || typeof p.nombre !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }

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
      es_dieta_prescripcion: p.es_dieta_prescripcion === true,
      foto_url: fotosDeProducto(p).portada,
      fotos: fotosDeProducto(p).galeria,
      variantes,
    },
  };
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
  if (alergenos.length > 0) {
    // 🔴 EL PREDICADO DURO: `alergenos` NO se solapa con lo documentado.
    q = q.not(
      'producto_variantes.productos.alergenos',
      'ov',
      literalArrayPg(alergenos),
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
  const prohibidos = new Set(alergenos.map((a) => a.toLowerCase()));
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
