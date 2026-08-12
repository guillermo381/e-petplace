/**
 * DESCUBRIR — LA VITRINA QUE SABE A QUIÉN ALIMENTA (S95-I; `MODELO_DESPENSA`
 * §4 y §5.2 punto 1, `DISEÑO_EXPERIENCIA` §7).
 *
 * TESIS (Ley 14): *la despensa ya sabe qué puede comer tu mascota.*
 *
 * FIRMA (Ley 15): `CriterioMascota` — la cara real de la mascota preside la
 * recomendación y la razón se DICE. No suma acento (Ley 5): es composición
 * y voz, no color.
 *
 * CHANEL (Ley 16), lo que se quitó de la primera pasada:
 *  · el CONTADOR de excluidos ("dejamos 3 afuera") — el wrapper devuelve lo
 *    que PASÓ, no lo que quedó afuera: contarlos era inventar un número.
 *  · el buscador — `buscarProductosDespensa` existe y esta tanda no lo
 *    monta: con el catálogo en CERO un buscador es una caja que no puede
 *    encontrar nada. Entra cuando haya catálogo que buscar.
 *  · la línea "perro · talla mediana" bajo "Para Thor" — el porqué fino es
 *    de la FICHA (§5.2 punto 2). Acá repetía sin decidir nada.
 *
 * ── LA PUERTA PRINCIPAL ES EL EXPEDIENTE (§5.1) ─────────────────────────
 * *"El alimento de Thor", no "Categoría: Alimentos".* Por eso la mascota
 * es el eje ⓪ y no un filtro al costado: el tab da ALCANCE, el expediente
 * da CRITERIO. Sin mascota elegida se ve la vitrina publicada (peldaño 0,
 * el mismo escalón que el "desde" del grooming) — visible, y sin fingir
 * que está personalizada.
 *
 * ── 🔴 DÓNDE **NO** OCURRE LA EXCLUSIÓN ─────────────────────────────────
 * Acá. Esta pantalla no mira un alérgeno para decidir si pinta una fila:
 * `recomendarParaMascota` pega los predicados a la consulta y Postgres los
 * resuelve con sus índices GIN, y además VERIFICA el resultado y falla
 * CERRADO (`exclusion_no_verificable`). Si esta pantalla filtrara en
 * memoria estaría poniendo lógica clínica en la capa equivocada — y de
 * paso taparía para siempre el defecto que esa verificación existe para
 * gritar. **Ese error se muestra como error, jamás como lista vacía.**
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin mascota elegida (o sin catálogo): la vitrina
 *    publicada tal cual, sin criterio prometido.
 *  · Peldaño 1 — con mascota: la recomendación real del motor.
 *  · Peldaño 2 — con expediente rico (alergias documentadas, condición
 *    crónica): el criterio se DICE con sus palabras y la vitrina cambia.
 *
 * TESTS (§10): sirve a la mascota real · voz de familia · sin códigos de
 * motor · vacío con camino · error que dice qué pasó · cero dark patterns
 * (`MODELO_LOYALTY` §7.5: sin urgencia, sin FOMO, sin "quedan 2").
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Separador,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  listarProductosDespensa,
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
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

type Fase<T> = T | 'cargando' | 'error';

export default function DespensaDescubrir() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [mascotas, setMascotas] = useState<Fase<MascotaResumen[]>>('cargando');
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [vitrina, setVitrina] = useState<Fase<ProductoDeVitrina[]>>('cargando');
  /** El fallo se guarda CON su código: `exclusion_no_verificable` tiene voz
   *  propia y no puede caer en el error genérico (es la única feature que
   *  justifica este frente fallando cerrada — merece decirlo).
   *
   *  ⚠️ NO USA `Fase<>` A PROPÓSITO. El `'error'` genérico de ese alias es
   *  aquí un ESTADO IMPOSIBLE —todo fallo entra como `{fallo}` con su
   *  código— y dejarlo expresable tenía consecuencia real: ninguna rama lo
   *  atrapaba y el render caía al `.map()` de una lista vacía, o sea
   *  **pintaba "no hay nada" ante un error**. Es la trampa de siempre (la
   *  invisibilidad no tiene stack trace): no se cura leyendo con más
   *  cuidado, se cura volviendo el estado malo INEXPRESABLE (L-222). */
  const [reco, setReco] = useState<Recomendacion | 'cargando' | { fallo: string } | null>(null);
  const [reintento, setReintento] = useState(0);

  /* §7.1 de LOYALTY hecho frontera, no `if` de pantalla: memorial y perdida
   * NO son elegibles. Recomendarle alimento a una mascota que murió es
   * exactamente lo que el apagado estructural existe para impedir.
   * `null` en el 2º argumento = la despensa no restringe especie — eso lo
   * decide `especies_aplicables` de cada producto, en Postgres. */
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

  // Peldaño 0 — la vitrina publicada. Se pide siempre: es lo que se ve sin
  // mascota, y el fondo contra el que se entiende que la recomendación es
  // un subconjunto elegido, no todo lo que hay.
  useEffect(() => {
    let vigente = true;
    setVitrina('cargando');
    void listarProductosDespensa({ limite: 50 }).then((r) => {
      if (vigente) setVitrina(r.ok ? r.data : 'error');
    });
    return () => {
      vigente = false;
    };
  }, [reintento]);

  // Con UNA sola elegible se elige sola (Ley 23, corolario S73: la puerta no
  // pregunta lo que ya sabe) — pero se DICE: el bloque de criterio queda
  // visible con su cara, jamás magia muda.
  useEffect(() => {
    if (mascotaId === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
  }, [elegibles, mascotaId]);

  // Peldaño 1 — la recomendación. La exclusión la hace el MOTOR.
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

  /** El PORQUÉ, armado SOLO con lo que el expediente afirma.
   *  Tres estados y son distintos entre sí:
   *   · hay alérgenos documentados → se nombran (no se cuentan productos).
   *   · la familia declaró "sin alergias conocidas" → es un DATO y se dice.
   *   · no sabemos → `null`. **Un hueco no se rellena con una frase
   *     amable**: decir "sin alergias" sin que nadie lo haya declarado
   *     sería fabricar tranquilidad. */
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

  function filaProducto(p: ProductoDeVitrina) {
    return (
      <Celda
        key={p.oferta_id}
        interactiva
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: '/despensa/producto/[productoId]',
            // La mascota viaja para que la ficha pueda decir el PORQUÉ. Es
            // contexto de explicación, jamás de permiso (patrón D-455: los
            // ids son filtro, nunca llave).
            params: { productoId: p.producto_id, mascotaId: mascota?.id ?? '' },
          })
        }
        inicio={<LienzoProducto lado={56} />}
        titulo={p.nombre}
        subtitulo={[p.marca, p.presentacion].filter((x) => x !== null && x !== '').join(' · ')}
        metadataMono={`$ ${p.precio.toFixed(2)}`}
      />
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="portada" saludo={t('despensa.titulo')} isotipo="gradiente" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: spacing[4],
          // La ley chica de la cola de scroll (S70-B5): el inset, jamás un
          // número mágico. Sin CTA fijo en esta pantalla, así que no suma
          // altura de barra.
          paddingBottom: insets.bottom + spacing[8],
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
            {/* ⓪ · LA PUERTA — el expediente. Con 2+ elegibles el eje se
                muestra; con una sola ya quedó elegida y el criterio de
                abajo la nombra con su cara. */}
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

            {/* ① · EL CRITERIO — la firma */}
            {mascota !== null ? (
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

            {/* ② · LO QUE SE PUEDE COMPRAR */}
            {mascota !== null ? (
              reco === 'cargando' || reco === null ? (
                cargandoLista
              ) : 'fallo' in reco ? (
                /* 🔴 LA VERIFICACIÓN FALLÓ CERRADA. No es "no hay productos":
                   es "no pudimos garantizar que sean seguros". Mostrarlo como
                   vacío escondería para siempre el defecto que el wrapper
                   grita a propósito — y peor, sugeriría que no hay nada
                   cuando lo que hay es una duda sin resolver. */
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
                /* Vacío CON CAMINO (Ley 17.5 / §6ter: cero finales mudos).
                   Y honesto sobre la causa: puede no haber catálogo todavía,
                   o puede que nada de lo publicado le sirva a ESTA mascota.
                   La pantalla no sabe cuál de las dos es — así que dice lo
                   que sí sabe y ofrece ver la vitrina entera. */
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
                <View>
                  {(recomendados ?? []).map((p, i) => (
                    <View key={p.oferta_id}>
                      {i > 0 ? <Separador /> : null}
                      {filaProducto(p)}
                    </View>
                  ))}
                </View>
              )
            ) : /* Peldaño 0 — la vitrina publicada, sin criterio prometido */
            vitrina === 'cargando' ? (
              cargandoLista
            ) : vitrina === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('despensa.errorVitrinaTitulo')}
                descripcion={t('despensa.errorVitrinaDetalle')}
                accion={botonReintentar}
              />
            ) : vitrina.length === 0 ? (
              /* 🔴 EL VACÍO REAL DE HOY, y se dice tal cual: el catálogo
                 está en CERO (medido: 0 productos, 0 variantes, 0 ofertas
                 publicadas). Ni un producto de mentira para que la pantalla
                 se vea llena — un catálogo fingido es peor que uno vacío. */
              <EstadoVacio
                icono={<Icono nombre="despensa" tamano={48} />}
                titulo={t('despensa.vacioTitulo')}
                descripcion={t('despensa.vacioDetalle')}
              />
            ) : (
              <View>
                {elegibles.length > 0 ? (
                  <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3] }}>
                    <Texto variante="apoyo">{t('despensa.elegiMascota')}</Texto>
                  </View>
                ) : null}
                {vitrina.map((p, i) => (
                  <View key={p.oferta_id}>
                    {i > 0 ? <Separador /> : null}
                    {filaProducto(p)}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
