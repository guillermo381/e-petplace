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
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AvisoAlergia,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  StepperCantidad,
  Texto,
  VisorFoto,
  radius,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  expandirAlergenosAVigilar,
  listarAlergenos,
  obtenerFichaProducto,
  obtenerPerfilMascota,
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
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
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

  // Con UNA sola comprable se elige sola (Ley 23: la puerta no pregunta lo
  // que ya sabe) — el precio queda visible en su fila igual.
  useEffect(() => {
    if (varianteId === null && comprables.length === 1) setVarianteId(comprables[0].variante_id);
  }, [comprables, varianteId]);

  const variante = comprables.find((v) => v.variante_id === varianteId) ?? null;

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
    if (exigeEntendimiento && !entendido) return t('despensa.faltaEntendimiento');
    return null;
  }, [ficha, comprables, variante, exigeEntendimiento, entendido, t]);

  function agregar() {
    if (ficha === 'cargando' || ficha === 'error' || variante === null) return;
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
      cantidad,
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
      <Encabezado
        variante="navegacion"
        titulo={ficha !== 'cargando' && ficha !== 'error' ? ficha.nombre : t('despensa.tituloProducto')}
        atras
        onAtras={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: spacing[4],
          // Deja aire para la barra fija del CTA cuando existe.
          paddingBottom: insets.bottom + (conCta ? spacing[8] + 96 : spacing[8]),
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

            {/* 2 · QUÉ ES — sin caja (A6): jerarquía y aire. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
              <Texto variante="titulo">{ficha.nombre}</Texto>
              {ficha.marca !== null ? <Texto variante="apoyo">{ficha.marca}</Texto> : null}
              {ficha.descripcion !== null ? (
                <View style={{ paddingTop: spacing[2] }}>
                  <Texto variante="cuerpo">{ficha.descripcion}</Texto>
                </View>
              ) : null}
            </View>

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

            {/* 4 · EL PORQUÉ (S95-I, sin cambios de criterio) */}
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

            {/* 6 · LAS PRESENTACIONES — elegir es comprar la correcta.
                Las sin oferta se dicen (nulo honesto), jamás "$ 0,00". */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="seccion">{t('despensa.presentaciones')}</Texto>
              </View>
              {ficha.variantes.length === 0 ? (
                <View style={{ paddingHorizontal: spacing[5] }}>
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('despensa.sinPresentaciones')}
                    descripcion={t('despensa.sinPresentacionesDetalle')}
                  />
                </View>
              ) : (
                <View>
                  {ficha.variantes.map((v, i) => {
                    const comprable = v.oferta_id !== null && v.precio !== null;
                    const elegida = v.variante_id === varianteId;
                    return (
                      <View key={v.variante_id}>
                        {i > 0 ? <Separador /> : null}
                        {comprable ? (
                          <Celda
                            interactiva
                            accessibilityRole="radio"
                            onPress={() => {
                              setVarianteId(v.variante_id);
                            }}
                            titulo={v.presentacion}
                            subtitulo={elegida ? t('despensa.presentacionElegida') : undefined}
                            metadataMono={v.precio !== null ? `$ ${v.precio.toFixed(2)}` : undefined}
                          />
                        ) : (
                          <Celda
                            titulo={v.presentacion}
                            subtitulo={t('despensa.varianteSinOferta')}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

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
      </ScrollView>

      {/* LA BARRA FIJA DEL CTA — el plano que separa (E13: sobrevive la
          superficie que separa planos). El apagado DICE qué falta. */}
      {conCta ? (
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
            gap: spacing[2],
          }}
        >
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
            onPress={agregar}
          />
          {unidades > 0 ? (
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('despensa.verCarrito', { n: unidades })}
              onPress={() => router.push('/despensa/carrito')}
            />
          ) : null}
        </View>
      ) : null}

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
