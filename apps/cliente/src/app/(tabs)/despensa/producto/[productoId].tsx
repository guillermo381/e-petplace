/**
 * PRODUCTO — LA FICHA QUE ADVIERTE Y VENDE (S96-D · D-B1/D-B2 ·
 * `LETRA_RECORRIDO_DESPENSA_S96` §5.1/§5.4/§5.5 · `MODELO_DESPENSA` §4.1
 * aclarada y §6 enmendada — sube sobre la ficha S95-I).
 *
 * TESIS (Ley 14): *la app conoce a tu mascota, y te lo demuestra acá.*
 *
 * FIRMA (Ley 15): LA ADVERTENCIA QUE CONOCE A THOR. Una tienda cualquiera
 * describe el producto; ésta —cuando hay alérgeno documentado— lo dice con
 * nombre propio y deja decidir. Es §5.4 hecho pantalla: *esconder es
 * invisible, y lo invisible no demuestra nada.*
 *
 * CHANEL (Ley 16), decisiones de esta pasada:
 *  · La lista de ingredientes VUELVE (S95-I la había quitado): la letra
 *    S96 pide "composición" en el detalle y el candado ① de §5.4 la
 *    vuelve carga de honestidad — sin composición dicha, el silencio se
 *    lee como "no tiene pollo". Se muestra como texto de fabricante
 *    (voz declarada, jamás promesa de la app).
 *  · Lo que NO volvió: el bloque "no contiene X" — afirmar ausencia
 *    sigue siendo promesa que la app no puede hacer.
 *  · CERO raciones (firma founder 12-ago): ni heredadas ni calculadas.
 *
 * ── §5.4 · LOS DOS CANDADOS, DONDE VIVEN ────────────────────────────────
 *  ① Solo se advierte con composición declarada; sin ella se DICE "no
 *    tenemos los ingredientes" — jamás silencio. `composicion_estado` es
 *    del MOTOR (cuatro literales; solo `verificada` y `no_aplica` callan)
 *    y el cruce lo hace `lib/despensa/composicion.ts` sobre la lista
 *    EXPANDIDA por relaciones (`expandirAlergenosAVigilar`).
 *  ② La advertencia jamás se apaga por promoción — acá no hay motor de
 *    beneficios montado, y si algún día lo hay, el veredicto no lo mira.
 *  El paso explícito de entendimiento GATEA el agregar al carrito en las
 *  DOS coincidencias (exacta e imprecisa), el CTA apagado DICE POR QUÉ
 *  (S73-B), y **el paso ES el registro**: sin
 *  `registrar_entendimiento_alergia` verde no hay entendido (§5.4
 *  "queda registrado", cumplido de verdad desde el cableo del 12-ago).
 *
 * ── §5.5 · LA RECOMENDACIÓN DEL VET: LA APP CALLA ───────────────────────
 * No hay lector de recomendación registrada (medido: cero tabla, cero
 * wrapper). El candado dice: si no está registrada como dato, la app
 * JAMÁS la menciona ni la fabrica. Por eso esta pantalla no tiene esa
 * sección — nacerá con su dato, no antes.
 *
 * ESCALERA (§4b): peldaño 0 = la ficha sin mascota (composición y precio,
 * cero promesa de criterio) · peldaño 1 = con mascota, el porqué dirigido
 * y la advertencia si corresponde · peldaño 2 = expediente rico: el
 * veredicto nombra SUS alérgenos documentados.
 *
 * TESTS (§10): voz de familia · cero códigos de motor · error dice qué
 * pasó · vacío con camino · cero dark patterns (sin urgencia, sin "quedan
 * 2") · el precio que se muestra ES el precio (nulo honesto donde no hay).
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AvisoAlergia,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  nombreCurado,
  PantallaConPie,
  PrecioText,
  SelectorOpcion,
  Separador,
  StepperCantidad,
  Texto,
  VisorFoto,
  radius,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { precioPorKg, MONEDA_FALLBACK, type IdiomaSoportado } from '@epetplace/i18n';
import {
  expandirAlergenosAVigilar,
  listarAlergenos,
  obtenerFichaProducto,
  obtenerPerfilMascota,
  maximoComprableDeOfertas,
  registrarEntendimientoAlergia,
  type AlergenoVigilado,
  type FichaProducto,
  type VarianteDeProducto,
} from '@epetplace/api';
import { LienzoProducto } from '@/components/despensa-piezas';
import { agregarAlCarrito, unidadesEnCarrito, useCarrito } from '@/lib/despensa/carrito';
import {
  alergenosDeMascota,
  cruzarConVigilados,
  vozAlergeno,
} from '@/lib/despensa/composicion';
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

export default function DespensaProducto() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const carrito = useCarrito();
  const { productoId, mascotaId } = useLocalSearchParams<{
    productoId: string;
    mascotaId?: string;
  }>();

  const [ficha, setFicha] = useState<Fase<FichaProducto>>('cargando');
  const [nombreMascota, setNombreMascota] = useState<string | null>(null);
  const [alergenosMascota, setAlergenosMascota] = useState<string[]>([]);
  /** La lista EXPANDIDA por el motor (relaciones: ave ⊃ pollo). */
  const [vigilados, setVigilados] = useState<AlergenoVigilado[]>([]);
  /** La voz del catálogo de alérgenos (código → nombre_es) — para la
   *  lista de composición; las voces del AVISO ya viajan en los
   *  vigilados. */
  const [vocesAlergenos, setVocesAlergenos] = useState<Map<string, string> | undefined>(undefined);
  const [varianteId, setVarianteId] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [entendido, setEntendido] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [visor, setVisor] = useState<number | null>(null);
  const [reintento, setReintento] = useState(0);
  /** A-01(b): la consulta del máximo está en vuelo. Bloquea el doble toque —
   *  sin esto, dos toques rápidos agregan dos veces mientras se pregunta. */
  const [consultandoMaximo, setConsultandoMaximo] = useState(false);

  const idMascota =
    typeof mascotaId === 'string' && mascotaId.trim().length > 0 ? mascotaId : null;

  useEffect(() => {
    let vigente = true;
    setFicha('cargando');
    void obtenerFichaProducto(productoId).then((r) => {
      if (vigente) setFicha(r.ok ? r.data : 'error');
    });
    // La voz del catálogo, en la misma ola. Si falla, `vozAlergeno`
    // degrada visible (guiones → espacios) — jamás bloquea la ficha.
    void listarAlergenos().then((r) => {
      if (vigente && r.ok) {
        setVocesAlergenos(new Map(r.data.map((a) => [a.codigo, a.nombre])));
      }
    });
    return () => {
      vigente = false;
    };
  }, [productoId, reintento]);

  // La mascota en contexto: su nombre para el porqué, y sus alergias
  // DOCUMENTADAS para el veredicto de §5.4. Si el perfil no llega, el
  // porqué se dice en general y la advertencia no se puede componer — la
  // ficha no se bloquea por un dato de cortesía, pero tampoco finge saber.
  useEffect(() => {
    if (idMascota === null) return;
    let vigente = true;
    void (async () => {
      const r = await obtenerPerfilMascota(idMascota);
      if (!vigente || !r.ok) return;
      setNombreMascota(r.data.mascota.nombre);
      const documentados =
        r.data.alergias_estado === 'con_alergias'
          ? alergenosDeMascota(r.data.alergias_detalle)
          : [];
      setAlergenosMascota(documentados);
      if (documentados.length === 0) return;
      // La EXPANSIÓN la hace el motor (relaciones como dato: ave ⊃ pollo).
      // Si el viaje falla, la degradación es el cruce LITERAL (exacta) —
      // advertir de menos por una relación no vista es preferible a no
      // advertir por una red caída, y jamás se fabrica una imprecisa.
      const exp = await expandirAlergenosAVigilar(documentados);
      if (!vigente) return;
      setVigilados(
        exp.ok
          ? exp.data
          : // La degradación conserva el TEXTO de la mascota como voz — el
            // mismo criterio del motor: al texto libre no se le inventa voz.
            documentados.map((a) => ({
              declarado: a,
              origen: a,
              exacta: true,
              declarado_nombre: a,
              origen_nombre: a,
            })),
      );
    })();
    return () => {
      vigente = false;
    };
  }, [idMascota]);

  /** Las presentaciones COMPRABLES (con oferta publicada). Las sin oferta
   *  se listan aparte: existen y no se pueden comprar — decir eso es
   *  mejor que esconderlas o que un "$ 0,00". */
  const comprables = useMemo(
    () =>
      ficha !== 'cargando' && ficha !== 'error'
        ? ficha.variantes.filter(
            (
              v,
            ): v is VarianteDeProducto & {
              oferta_id: string;
              precio: number;
              cuenta_comercial_id: string;
              country_code: string;
            } =>
              v.oferta_id !== null &&
              v.precio !== null &&
              v.cuenta_comercial_id !== null &&
              v.country_code !== null,
          )
        : [],
    [ficha],
  );

  /** Las presentaciones que EXISTEN y no se pueden comprar hoy. Viajan para
   *  DECIRSE en ⑥ —una línea, no filas tocables—: **no son una opción, son
   *  una ausencia**, y ofrecerlas como elegibles sería una puerta que rebota
   *  (Ley 23). El nulo honesto de S95 se conserva; lo que muere es la tabla
   *  que las mostraba como si se pudieran elegir. */
  const sinOferta = useMemo(
    () =>
      ficha !== 'cargando' && ficha !== 'error'
        ? ficha.variantes.filter((v) => v.oferta_id === null || v.precio === null)
        : [],
    [ficha],
  );

  // Con UNA sola comprable se elige sola (Ley 23: la puerta no pregunta lo
  // que ya sabe) — el precio queda visible en su fila igual.
  useEffect(() => {
    if (varianteId === null && comprables.length === 1) setVarianteId(comprables[0].variante_id);
  }, [comprables, varianteId]);

  const variante = comprables.find((v) => v.variante_id === varianteId) ?? null;

  /** La presentación COMPRABLE más barata — la que sostiene el «desde»
   *  mientras no haya una elegida.
   *
   *  🔴 **El criterio es explícito y por eso se puede discutir: el precio
   *  MÁS BAJO.** No es «la primera de la lista» — *el primer elemento de
   *  una colección sin criterio es una decisión de negocio por accidente*
   *  (L-289). Y el mínimo es el único criterio que hace verdadera la
   *  palabra «desde»: con cualquier otro, el número mostrado sería un
   *  precio que la familia podría encontrar más barato dos toques después,
   *  que es exactamente la clase de sorpresa que esta casa no hace. */
  const masBarata = useMemo(
    () =>
      comprables.length === 0
        ? null
        : comprables.reduce((a, b) => (b.precio < a.precio ? b : a)),
    [comprables],
  );

  /** §5.4 — los HECHOS para AvisoAlergia v3: `composicion_estado` viene
   *  del MOTOR (columna con cuatro literales; solo verificada y no_aplica
   *  callan, y son dos silencios distintos) y la coincidencia sale del
   *  cruce EXPANDIDO (exacta «contiene» · imprecisa «podría ser»). */
  const cruce = useMemo(
    () =>
      ficha !== 'cargando' && ficha !== 'error'
        ? cruzarConVigilados(ficha.alergenos, vigilados)
        : { coincidencia: 'ninguna' as const, exactos: [], imprecisos: [] },
    [ficha, vigilados],
  );
  const exigeEntendimiento = cruce.coincidencia !== 'ninguna';

  /** El paso explícito QUEDA REGISTRADO (§5.4 — tabla append-only del
   *  motor). Sin registro no hay entendido: el paso ES el registro. */
  async function confirmarEntendimiento() {
    if (registrando) return;
    if (idMascota === null || ficha === 'cargando' || ficha === 'error') return;
    setRegistrando(true);
    // Se registran CÓDIGOS del vocabulario (dato), jamás voces.
    const advertidos = [
      ...cruce.exactos.map((e) => e.codigo),
      ...cruce.imprecisos.map((i) => i.codigo),
    ];
    const r = await registrarEntendimientoAlergia(ficha.producto_id, idMascota, advertidos);
    setRegistrando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setEntendido(true);
  }

  /** El porqué — frases construidas SOLO con atributos declarados (S95-I,
   *  sin cambios de criterio). */
  const porque = useMemo(() => {
    if (ficha === 'cargando' || ficha === 'error') return [];
    const frases: string[] = [];
    const especies = ficha.especies_aplicables
      .map((e) =>
        e === 'perro' ? t('despensa.especiePerro')
        : e === 'gato' ? t('despensa.especieGato')
        : e === 'conejo' ? t('despensa.especieConejo')
        : e === 'ave' ? t('despensa.especieAve')
        : e === 'roedor' ? t('despensa.especieRoedor')
        : e === 'pez' ? t('despensa.especiePez')
        : '',
      )
      .filter((v) => v !== '');
    if (especies.length > 0) {
      frases.push(t('despensa.porqueEspecie', { lista: especies.join(', ') }));
    }
    const tallas = ficha.tallas_aplicables
      .map((x) =>
        x === 'S' ? t('grooming.tallaS') : x === 'M' ? t('grooming.tallaM') : x === 'L' ? t('grooming.tallaL') : '',
      )
      .filter((v) => v !== '');
    if (tallas.length > 0) {
      frases.push(t('despensa.porqueTalla', { lista: tallas.join(', ').toLowerCase() }));
    }
    const momentos = ficha.momentos_aplicables
      .map((m) =>
        m === 'M1' ? t('perfil.momentoM1')
        : m === 'M2' ? t('perfil.momentoM2')
        : m === 'M3' ? t('perfil.momentoM3')
        : m === 'M4' ? t('perfil.momentoM4')
        : m === 'M5' ? t('perfil.momentoM5')
        : '',
      )
      .filter((v) => v !== '');
    if (momentos.length > 0) {
      frases.push(t('despensa.porqueMomento', { lista: momentos.join(', ').toLowerCase() }));
    }
    return frases;
  }, [ficha, t]);

  /** Por qué el CTA está apagado — el Confirmar apagado DICE QUÉ FALTA
   *  (S73-B), jamás un botón muerto sin explicación. */
  const faltaParaAgregar: string | null = useMemo(() => {
    if (ficha === 'cargando' || ficha === 'error') return null;
    if (comprables.length === 0) return null; // sin oferta no hay CTA
    if (variante === null) return t('despensa.faltaPresentacion');
    // 🔴 A-01 (S100c) · LA MALA NOTICIA SE DA EN LA PUERTA, Y ESTA ES LA PUERTA.
    // Literal del founder: *«si lo acabo de agregar, no debería llegar hasta ese
    // mensaje, sino que ya el producto no me lo debería haber dejado entrar al
    // carrito»*. Tenía razón, y por más de lo que dijo: **la vitrina YA gateaba**
    // (`TarjetaProducto` apaga el `+` sin `hayStock`) y **esta ficha no**. Las
    // dos puertas al mismo carrito se comportaban distinto.
    //
    // Y lo peor no era que dejara pasar: es que **lo decía y lo dejaba pasar
    // igual** — `despensa.fichaSinStock` se pintaba 400 dp más abajo con el CTA
    // encendido al lado. *Una pantalla que informa el impedimento y no lo aplica
    // es peor que una que calla: enseña que el aviso no significa nada.*
    //
    // ⚠️ EL LÍMITE DE ESTA LÍNEA, DECLARADO PARA QUE NADIE LEA SU VERDE DE MÁS:
    // `hay_stock` es `stock_disponible > 0` (trigger `_trg_oferta_deriva_hay_stock`)
    // — **booleano por FIRMA de S99**, jamás un número: *la familia necesita
    // «¿puedo comprar esto?», no el inventario ajeno*. ⇒ esto caza «se agotó» y
    // **NO caza «no alcanza para 5»**: quien pide 5 de un producto con 1 se sigue
    // enterando en la caja. Cerrar ese caso exige que el motor conteste
    // «¿alcanza para N?» con un booleano — pedido Q4, no parche acá.
    if (!variante.hay_stock) return t('despensa.fichaSinStock');
    if (exigeEntendimiento && !entendido) return t('despensa.faltaEntendimiento');
    return null;
  }, [ficha, comprables, variante, exigeEntendimiento, entendido, t]);

  /**
   * 🔴 A-01(b) · «PEDÍ 3 Y HAY 1» — la otra mitad, cerrada en la puerta.
   *
   * `hay_stock` (booleano, firma S99) ya frena lo AGOTADO. Lo que no podía
   * frenar es la cantidad, y **medido: 31 de 483 ofertas publicadas tienen 2
   * unidades o menos, y 70 tienen 5 o menos** — todas con `hay_stock = true`,
   * o sea que entran al carrito y revientan recién al pagar. *Es el caso
   * exacto del founder.*
   *
   * El motor contesta `LEAST(pedido, disponible)`: **nunca dice cuánto hay,
   * dice cuánto podés llevar.** Pidiendo 3 sobre 500 contesta 3 y no se
   * aprende nada del inventario ajeno.
   *
   * ⚠️ Y SI LA CONSULTA FALLA **NO SE BLOQUEA** (Ley 13): se agrega lo que
   * la persona pidió y el motor sigue siendo la última palabra. *Un fallo de
   * red no se disfraza de «no hay stock»* — eso sería inventar una mala
   * noticia, que es peor que darla tarde.
   */
  async function agregar() {
    if (ficha === 'cargando' || ficha === 'error' || variante === null) return;
    if (consultandoMaximo) return;

    let aAgregar = cantidad;
    setConsultandoMaximo(true);
    const r = await maximoComprableDeOfertas([
      { oferta_id: variante.oferta_id, cantidad },
    ]);
    setConsultandoMaximo(false);

    if (r.ok && r.data.length > 0) {
      const max = r.data[0].maximo;
      if (max <= 0) {
        // Se agotó entre que se pintó la ficha y este toque.
        mostrar({ texto: t('despensa.fichaSinStock'), variante: 'error' });
        return;
      }
      if (max < cantidad) {
        aAgregar = max;
        mostrar({ texto: t('despensa.maximoEntregable', { n: max }), variante: 'neutro' });
      }
    }

    agregarAlCarrito(
      {
        oferta_id: variante.oferta_id,
        producto_id: ficha.producto_id,
        variante_id: variante.variante_id,
        nombre: ficha.nombre,
        marca: ficha.marca,
        presentacion: variante.presentacion,
        precio: variante.precio,
        moneda: variante.moneda ?? 'USD',
        foto_url: ficha.foto_url,
        especies_aplicables: ficha.especies_aplicables,
        alergenos: ficha.alergenos,
        // El vendedor de la oferta — del motor, vía el trigger de A
        // (cableo del merge 12-ago; el hueco murió).
        cuentaComercialId: variante.cuenta_comercial_id,
        country_code: variante.country_code,
      },
      aAgregar,
      idMascota !== null ? { tipo: 'mascota', mascotaId: idMascota } : null,
      exigeEntendimiento && entendido,
    );
    setCantidad(1);
    mostrar({
      texto:
        nombreMascota !== null
          ? t('despensa.agregadoPara', { nombre: nombreMascota })
          : t('despensa.agregado'),
      variante: 'exito',
    });
  }

  const fotos = useMemo(() => {
    if (ficha === 'cargando' || ficha === 'error') return [];
    // Portada + galería sin repetir la portada.
    const todas = ficha.foto_url !== null ? [ficha.foto_url, ...ficha.fotos] : [...ficha.fotos];
    return [...new Set(todas)];
  }, [ficha]);

  const unidades = unidadesEnCarrito(carrito);
  const conCta = ficha !== 'cargando' && ficha !== 'error' && comprables.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* 🔴 EL TÍTULO DEL ENCABEZADO SE APAGA (H-205, S100b-C) — el nombre
          del producto se pintaba DOS VECES en 350 dp: acá en mono
          mayúsculas (`ACTIVE MIND 7+`, que lee como código de máquina y es
          la misma clase que el C4 de S74) y 300 dp más abajo en voz humana.
          **Cuál de los dos cede lo decide N19 y no el gusto:** su orden es
          ① foto ② nombre + presentación ⇒ **el del cuerpo es obligatorio y
          el del header sobra.** La referencia tampoco pone el nombre en su
          encabezado.
          ⚠️ **El costo, declarado y no escondido:** `Encabezado` NO colapsa
          al scrollear —ese patrón no existe en la casa—, así que apagar el
          título fijo **cuesta el contexto cuando bajaste mucho**. Se acepta
          porque el nombre vive arriba de todo el contenido y la flecha de
          volver no depende de él. El nombre sigue anunciándose al lector de
          pantalla: se apaga el píxel, jamás el nombre. */}
      <Encabezado
        variante="navegacion"
        titulo={ficha !== 'cargando' && ficha !== 'error' ? ficha.nombre : t('despensa.tituloProducto')}
        tituloVisible={false}
        atras
        onAtras={() => router.back()}
      />

      {/* 🔴 G-02 · EL CONTENIDO TAPADO — CURADO EN LA RAÍZ (S100b-C, L1).
          Acá vivía un `ScrollView` que estimaba el alto del pie con un
          `96` TECLEADO. Medido: el pie de esta pantalla mide **128 dp**
          cuando el carrito tiene algo (`spacing[3]` + botón 48 + gap 8 +
          botón 48 + `spacing[3]`), y **más todavía** cuando el CTA apagado
          dice qué falta. La reserva y el pie salían de dos cuentas
          distintas y tenían que coincidir — *la forma exacta del defecto
          que esta casa ya tiene nombrada*.

          🔴 Y LA CONDICIÓN DE REPRODUCCIÓN EXPLICA POR QUÉ SOBREVIVIÓ A
          TODOS LOS GATES, medida en el aparato de C: **con el carrito
          VACÍO el pie tiene UN botón y los 96 dp alcanzan justo**. El
          defecto solo aparece llegando a la ficha con algo ya adentro del
          carrito — *un camino que no es el primero que camina nadie*.

          ⇒ `PantallaConPie` (B, S100b): el pie se mide a sí mismo y esa
          MISMA medida reserva el scroll. No hay dos cuentas: hay una. El
          `insets.bottom` también es de la pieza, así que sale de acá. */}
      <PantallaConPie
        /* ⚠️ EL PIE VA COMO FRAGMENTO, NO ENVUELTO EN UN `View` — y no es
           estilo: `PantallaConPie` lleva `pointerEvents="box-none"` para
           que el gesto de scroll ATRAVIESE la banda del pie, y `box-none`
           cubre UNA SOLA CAPA. Un `View` propio acá volvería a capturar
           todo su rectángulo y **reabriría la zona muerta de gesto en el
           tercio inferior** — justo donde el pulgar sostiene el teléfono.
           (Aviso de B con el caso; si alguna vez hace falta agrupar de
           verdad, ese `View` lleva su propio `pointerEvents="box-none"`.) */
        pie={
          conCta ? (
            <>
              {faltaParaAgregar !== null ? (
                <Texto variante="apoyo">{faltaParaAgregar}</Texto>
              ) : null}
              <Boton
                etiqueta={
                  variante !== null
                    ? t('despensa.agregarConPrecio', {
                        precio: `$ ${(variante.precio * cantidad).toFixed(2)}`,
                      })
                    : t('despensa.agregar')
                }
                bloque
                deshabilitado={faltaParaAgregar !== null}
                onPress={() => void agregar()}
              />
              {/* ⚖️ «Ver carrito» BAJA DE BOTÓN A LABEL, y la razón está
                  medida en la referencia, no argumentada: **la ficha de
                  Laika tiene UN solo botón en el pie** y el carrito vive
                  como ícono con contador en el encabezado. Dos botones
                  bloque apilados son **128 dp de control permanente sobre
                  un visor de 665** — el 19 % de la pantalla, que es
                  exactamente «el control pesa más que el producto».
                  Y la casa ya tiene la ley: lo que NAVEGA no viste de
                  botón. **No se elimina** —sería un callejón hasta que
                  aterrice el ícono de carrito de G-14—: se despriorizA. */}
              {unidades > 0 ? (
                <Boton
                  variante="ghost"
                  bloque
                  etiqueta={t('despensa.verCarrito', { n: unidades })}
                  onPress={() => router.push('/despensa/carrito')}
                />
              ) : null}
            </>
          ) : undefined
        }
        contentContainerStyle={{
          paddingTop: spacing[4],
          // Solo el aire del final de MI contenido: la reserva del pie la
          // suma la pieza. Acá vivía `+ 96`.
          paddingBottom: spacing[8],
          gap: spacing[5],
        }}
      >
        {ficha === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3], paddingHorizontal: spacing[5] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={240} />
              <Esqueleto forma="bloque" ancho="60%" alto={24} />
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
            </View>
          </EsqueletoGrupo>
        ) : ficha === 'error' ? (
          <EstadoVacio
            titulo={t('despensa.errorFichaTitulo')}
            descripcion={t('despensa.errorFichaDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hogar.reintentar')}
                onPress={() => setReintento((n) => n + 1)}
              />
            }
          />
        ) : (
          <>
            {/* 1 · LAS FOTOS — portada grande tocable + tira de miniaturas.
                Sin foto: el fallback digno del lienzo (jamás una imagen
                que finja ser el producto). */}
            <View style={{ paddingHorizontal: spacing[5], alignItems: 'center', gap: spacing[3] }}>
              {fotos.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('despensa.verFotos')}
                  onPress={() => setVisor(0)}
                >
                  <LienzoProducto lado={240} fotoUrl={fotos[0]} />
                </Pressable>
              ) : (
                <LienzoProducto lado={240} />
              )}
              {fotos.length > 1 ? (
                <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                  {fotos.slice(1, 5).map((f, i) => (
                    <Pressable
                      key={f}
                      accessibilityRole="button"
                      accessibilityLabel={t('despensa.verFotos')}
                      onPress={() => setVisor(i + 1)}
                      style={{ borderRadius: radius.suave, overflow: 'hidden' }}
                    >
                      <LienzoProducto lado={56} fotoUrl={f} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            {/* ② · QUÉ ES — nombre CURADO + su línea de identidad.
                🔴 `descripcion` DEJA DE PINTARSE COMO PROSA, y es por medición:
                no es una descripción. Medido sobre los 470 activos —
                **promedio 10 caracteres, máximo 29, CERO sobre 200** — y sus
                literales son sub-líneas del importador: «Linea Dorada»,
                «Veterinary Diet», «Gatos», «Premium». *Pintar «Linea Dorada»
                como párrafo de cuerpo le promete al lector una descripción que
                no existe.* Va donde pertenece: junto a la marca, con el
                separador de la casa. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
              <Texto variante="titulo">{nombreCurado(ficha.nombre)}</Texto>
              {ficha.marca !== null || ficha.descripcion !== null ? (
                <Texto variante="apoyo">
                  {[ficha.marca, ficha.descripcion].filter((x) => x !== null).join(' · ')}
                </Texto>
              ) : null}
            </View>

            {/* ② bis · LAS PRESENTACIONES COMO CHIPS (N19 ②) — elegir acá y ver
                el precio abajo, en vez de leer una tabla de filas.
                Medido: **392 de 470 productos (83 %) tienen UNA sola** ⇒ con una
                el grupo colapsa y no se dibuja (no se le pide una decisión a
                quien no tiene alternativa).
                🔴 Los chips son SOLO de lo comprable, y las presentaciones sin
                oferta se DICEN abajo en vez de fingirse chips apagados:
                `SelectorOpcion` no tiene deshabilitado por opción, y **una
                puerta que se ofrece para rebotar es Ley 23**. El nulo honesto
                se conserva — la variante existe y no se puede comprar. */}
            {comprables.length > 1 ? (
              <View style={{ paddingHorizontal: spacing[5] }}>
                <SelectorOpcion
                  etiqueta={t('despensa.presentaciones')}
                  disposicion="tira"
                  opciones={comprables.map((v) => ({
                    codigo: v.variante_id,
                    etiqueta: v.presentacion,
                  }))}
                  seleccionada={varianteId ?? undefined}
                  onSelect={setVarianteId}
                />
              </View>
            ) : null}

            {/* ③ · EL PRECIO, y debajo EL PRECIO POR KILO (N19 ③).
                🔴 El $/kg es el dato que decide una compra de alimento y que casi
                ningún catálogo pone — **y solo aparece cuando hay peso**: medido,
                248 de 563 filas (44 %) lo declaran. Sin peso no hay cuenta, y
                una cuenta sobre un peso ausente destruiría lo único que le da
                valor: que sea cierta.
                El registro es el mensaje (Ley 3): el precio en su voz, el $/kg
                en mono porque **lo derivó una máquina**. */}
            {/* 🔴 S100b-C — LA FICHA SIN PRECIO. Este bloque se pintaba SOLO
                con una presentación elegida, y con más de una **no se elige
                sola** (la auto-selección es solo para el caso de una). ⇒ en
                un producto de 3 presentaciones, **la ficha no mostraba
                NINGÚN precio hasta que la familia tocaba un chip**.
                *Una ficha sin precio no vende: obliga a adivinar cuánto
                sale antes de saber si te interesa.*
                Apareció MIRANDO la captura, no midiéndola — ningún número
                de los que este archivo produce decía «acá no hay precio».

                La cura NO es preseleccionar: **el primer elemento de una
                colección sin criterio es una decisión de negocio por
                accidente** (L-289), y elegirle la presentación a la familia
                es decidir cuánto va a gastar. Se muestra **«desde» el precio
                de la más barata**, que es la escalera del precio honesto ya
                firmada en S82: *lo que varía dice «desde»*. Al elegir un
                chip, el precio pasa a ser el exacto de esa presentación.

                ⚠️ La palabra va en su propia línea y no pegada al número
                porque `PrecioText` no tiene forma de prefijo; **se le pidió
                a B la prop con este caso** — la tipografía del precio es de
                la pieza, no de esta pantalla. */}
            {variante !== null && variante.precio !== null ? (
              <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
                <PrecioText
                  valor={variante.precio}
                  // `ficha` — el registro que la pieza reserva para «el
                  // protagonista de la ficha, el que decide la compra».
                  registro="ficha"
                  porUnidad={
                    precioPorKg(
                      variante.precio,
                      variante.peso_kg,
                      MONEDA_FALLBACK,
                      idioma as IdiomaSoportado,
                    ) ?? undefined
                  }
                />
              </View>
            ) : masBarata !== null ? (
              <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
                <Texto variante="apoyo">{t('despensa.precioDesde')}</Texto>
                <PrecioText
                  valor={masBarata.precio}
                  registro="ficha"
                  porUnidad={
                    precioPorKg(
                      masBarata.precio,
                      masBarata.peso_kg,
                      MONEDA_FALLBACK,
                      idioma as IdiomaSoportado,
                    ) ?? undefined
                  }
                />
              </View>
            ) : null}

            {/* 3 · 🔴 LA ADVERTENCIA (§5.4) — la firma. Se monta SIEMPRE que
                haya alérgeno documentado relevante: la pieza recibe los
                HECHOS (composición del motor + coincidencia del cruce
                expandido) y decide ella — los dos silencios legales
                (verificada · no_aplica, sin cruce) los resuelve la pieza.
                El paso explícito gatea el CTA en las DOS coincidencias:
                si puede ser pollo, se decide sabiendo. */}
            {alergenosMascota.length > 0 ? (
              <View style={{ paddingHorizontal: spacing[5] }}>
                <AvisoAlergia
                  composicion={ficha.composicion_estado}
                  coincidencia={cruce.coincidencia}
                  mensaje={
                    cruce.coincidencia === 'exacta'
                      ? t('despensa.alergiaContiene', {
                          nombre: nombreMascota ?? t('despensa.tuMascota'),
                          // Las voces del AVISO viajan en los vigilados
                          // (cat_alergenos.nombre_es, del motor).
                          lista: cruce.exactos.map((e) => e.nombre).join(', '),
                        })
                      : cruce.coincidencia === 'imprecisa'
                        ? t('despensa.alergiaImprecisa', {
                            nombre: nombreMascota ?? t('despensa.tuMascota'),
                            lista: cruce.imprecisos
                              .map((i) =>
                                t('despensa.imprecisoPar', {
                                  declarado: i.nombre,
                                  origen: i.origenNombre,
                                }),
                              )
                              .join('; '),
                          })
                        : ficha.composicion_estado === 'ausente'
                          ? t('despensa.alergiaSinComposicion', {
                              nombre: nombreMascota ?? t('despensa.tuMascota'),
                            })
                          : t('despensa.alergiaSinVerificar', {
                              nombre: nombreMascota ?? t('despensa.tuMascota'),
                            })
                  }
                  detalle={exigeEntendimiento ? t('despensa.alergiaContieneDetalle') : undefined}
                  entendido={exigeEntendimiento ? entendido : undefined}
                  onEntendido={
                    exigeEntendimiento ? () => void confirmarEntendimiento() : undefined
                  }
                  etiquetaEntendido={t('despensa.alergiaEntiendo')}
                  etiquetaYaEntendido={t('despensa.alergiaEntendida')}
                />
              </View>
            ) : null}

            {/* 5 · LA COMPOSICIÓN (§0.5 de la letra: el detalle al nivel del
                mejor e-commerce; candado ① de §5.4: sin composición se DICE).
                Todo en voz de "declarado por el fabricante" — la app
                transporta, jamás avala. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Texto variante="seccion">{t('despensa.composicion')}</Texto>
              {/* El ESTADO manda (letra de A, 12-ago): solo `verificada` y
                  `no_aplica` callan su condición; `declarada_sin_verificar`
                  y `ausente` la DICEN. Y `no_aplica` jamás pide
                  ingredientes: no es un dato que falte. */}
              {ficha.composicion_estado === 'no_aplica' ? (
                <Texto variante="apoyo">{t('despensa.composicionNoAplica')}</Texto>
              ) : ficha.composicion_estado === 'ausente' ||
                (ficha.ingredientes_activos.length === 0 && ficha.alergenos.length === 0) ? (
                <Texto variante="apoyo">{t('despensa.composicionAusente')}</Texto>
              ) : (
                <>
                  {ficha.ingredientes_activos.length > 0 ? (
                    <Texto variante="cuerpo">{ficha.ingredientes_activos.join(', ')}</Texto>
                  ) : null}
                  {ficha.alergenos.length > 0 ? (
                    <Texto variante="apoyo">
                      {t('despensa.composicionAlergenos', {
                        lista: ficha.alergenos
                          .map((c) => vozAlergeno(c, vocesAlergenos))
                          .join(', '),
                      })}
                    </Texto>
                  ) : null}
                  <Texto variante="apoyo">
                    {ficha.composicion_estado === 'verificada'
                      ? t('despensa.composicionVerificada')
                      : t('despensa.composicionFuente')}
                  </Texto>
                </>
              )}
            </View>

            {/* ⑤ · PARA QUIÉN SIRVE (N19 ⑤ — era la 4 y baja UN puesto: la
                composición sube a ④ para quedar PEGADA a su advertencia).
                Nuestro diferencial: no lo tiene ninguno de los referentes. */}
            {porque.length > 0 ? (
              <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
                <Texto variante="seccion">
                  {nombreMascota !== null
                    ? t('despensa.porqueTituloMascota', { nombre: nombreMascota })
                    : t('despensa.porqueTitulo')}
                </Texto>
                {porque.map((f) => (
                  <Texto key={f} variante="cuerpo">
                    {f}
                  </Texto>
                ))}
                {ficha.es_dieta_prescripcion ? (
                  <Texto variante="apoyo">{t('despensa.porquePrescripcion')}</Texto>
                ) : null}
              </View>
            ) : null}

            {/* ⑥ · DISPONIBILIDAD REAL — y las presentaciones que NO se pueden
                comprar, DICHAS (N19 ⑥).
                ☠️ Acá vivía la tabla de presentaciones en `Celda`. La reemplazan
                los chips de ②: **elegir y ver el precio arriba** en vez de leer
                una tabla de filas con el precio repetido en cada una.
                🔴 Lo que la tabla SÍ hacía y no se pierde: decir las variantes
                sin oferta. Se conserva como UNA línea —no como filas tocables—
                porque **no son una opción: son una ausencia**. El nulo honesto
                se mantiene; lo que muere es fingir que se pueden elegir. */}
            {/* ☠️ ACÁ VIVÍA `despensa.fichaSinStock` PARA LA PRESENTACIÓN
                ELEGIDA, y se MUDÓ al pie — no se borró: `faltaParaAgregar` lo
                dice ahora pegado al CTA que apaga.
                🔴 ES UNA CURA DE DOS MITADES Y SE DECLARA: si alguien repone
                esta línea «porque informa», el mismo texto queda DOS VECES en
                una pantalla —acá y en el pie, a 400 dp— que es exactamente el
                defecto que C curó en H-205 con el nombre del producto.
                Lo que decide dónde va no es el gusto: **el impedimento vive
                donde se ejerce**. La ley de la casa es que el Confirmar apagado
                DICE QUÉ FALTA (S73-B), y el que apaga es el pie.
                ⚠️ Lo que esta mudanza NO resuelve, y queda como límite: el chip
                de una presentación agotada **se sigue pudiendo elegir**. Elegirla
                es legal —así se ve su precio y se entiende por qué no se puede—;
                lo que ya no es legal es AGREGARLA. */}
            {sinOferta.length > 0 ? (
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="apoyo">
                  {t('despensa.tambienVieneEn', {
                    lista: sinOferta.map((v) => v.presentacion).join(', '),
                  })}
                </Texto>
              </View>
            ) : null}


            {/* 7 · LA CANTIDAD */}
            {comprables.length > 0 ? (
              <View
                style={{
                  paddingHorizontal: spacing[5],
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Texto variante="cuerpo">{t('despensa.cantidad')}</Texto>
                <StepperCantidad
                  valor={cantidad}
                  min={1}
                  max={99}
                  onCambio={setCantidad}
                  etiqueta={t('despensa.cantidad')}
                />
              </View>
            ) : null}
          </>
        )}
      </PantallaConPie>

      <VisorFoto
        visible={visor !== null}
        onCerrar={() => setVisor(null)}
        fotos={fotos}
        indiceInicial={visor ?? 0}
        etiqueta={t('despensa.fotosDelProducto')}
      />
    </View>
  );
}
