/**
 * PRODUCTO — LA FICHA CON SU PORQUÉ (S95-I; `MODELO_DESPENSA` §5.2 punto 2:
 * *"foto, nombre, precio, presentación, y el porqué de la recomendación
 * («para perros de talla media, 3 a 7 años»)"*).
 *
 * TESIS (Ley 14): *este producto está acá por una razón, y la razón se lee.*
 *
 * FIRMA (Ley 15): EL PORQUÉ. Una tienda cualquiera describe el producto;
 * ésta explica por qué se lo está mostrando a ESTA mascota. Es la misma
 * tesis del foso que Descubrir, un piso más adentro.
 *
 * CHANEL (Ley 16), lo quitado:
 *  · la lista de `ingredientes_activos` cruda — es vocabulario de etiqueta,
 *    no criterio de cuidado, y competía con el porqué por la atención.
 *  · el bloque de alérgenos "no contiene X" — se leía como promesa de
 *    seguridad hecha por la app. Lo que la app puede afirmar honestamente
 *    es lo que EXCLUYÓ (y eso ya lo dijo Descubrir); lo que el producto
 *    declara contener es del fabricante.
 *  · el "desde $X" de la variante más barata en el techo — el precio vive
 *    en su presentación, y repetirlo arriba era el mismo dato dos veces.
 *
 * ── 🔴 EL PORQUÉ SE **DESCRIBE**, NO SE **DECIDE** ──────────────────────
 * Este archivo NO vuelve a evaluar si el producto sirve. La exclusión ya
 * la hizo Postgres en `recomendarParaMascota`; acá se leen los atributos
 * DECLARADOS del producto (`especies_aplicables`, `tallas_aplicables`,
 * `momentos_aplicables`) y se los pone en voz de familia. Es texto
 * explicativo, no un filtro — si esta pantalla decidiera algo, sería
 * lógica clínica en la capa equivocada.
 *
 * Por eso también: **entrar acá directo SIEMPRE muestra el producto**. La
 * ficha no esconde nada por su cuenta; quien decide qué se ofrece es el
 * motor, en la pantalla anterior.
 *
 * ── LEY 3 EN SU FORMA DURA: NINGÚN CÓDIGO DE MOTOR LLEGA AL OJO ─────────
 * `tallas_aplicables` y `momentos_aplicables` son arrays de texto SIN
 * CHECK en la tabla (medido) y el catálogo está en CERO, así que su
 * vocabulario real **no se pudo medir**. Se traducen contra los
 * diccionarios que la casa YA tiene (`grooming.tallaS/M/L` ·
 * `perfil.momentoM1..M5`) y **lo que no matchea NO SE PINTA**: antes una
 * línea de menos que un `M3` crudo en la cara de la familia.
 * Queda declarado para medirlo cuando exista la semilla.
 *
 * ESCALERA (§4b): peldaño 0 = la ficha del producto tal cual · peldaño 1 =
 * con mascota en contexto, el porqué dirigido a ella · peldaño 2 = con el
 * expediente rico, el porqué nombra su talla y su momento vital.
 */

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerFichaProducto,
  obtenerPerfilMascota,
  type FichaProducto,
} from '@epetplace/api';
import { LienzoProducto } from '@/components/despensa-piezas';
import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';

export default function DespensaProducto() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { productoId, mascotaId } = useLocalSearchParams<{
    productoId: string;
    mascotaId?: string;
  }>();

  const [ficha, setFicha] = useState<Fase<FichaProducto>>('cargando');
  const [nombreMascota, setNombreMascota] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  const idMascota =
    typeof mascotaId === 'string' && mascotaId.trim().length > 0 ? mascotaId : null;

  useEffect(() => {
    let vigente = true;
    setFicha('cargando');
    void obtenerFichaProducto(productoId).then((r) => {
      if (vigente) setFicha(r.ok ? r.data : 'error');
    });
    return () => {
      vigente = false;
    };
  }, [productoId, reintento]);

  // El nombre de la mascota, solo para que el porqué hable de ELLA. Si no
  // llega, el porqué se dice igual en su forma general — jamás se bloquea
  // la ficha por un dato de cortesía.
  useEffect(() => {
    if (idMascota === null) return;
    let vigente = true;
    void obtenerPerfilMascota(idMascota).then((r) => {
      // el nombre vive bajo `mascota` (IdentidadMascota), no en la raíz
      // del perfil — medido contra el tipo, no supuesto.
      if (vigente && r.ok) setNombreMascota(r.data.mascota.nombre);
    });
    return () => {
      vigente = false;
    };
  }, [idMascota]);

  /** EL PORQUÉ — frases construidas SOLO con atributos declarados del
   *  producto. Cada una es verdadera por sí sola; las que no se pueden
   *  afirmar no se escriben. */
  const porque = useMemo(() => {
    if (ficha === 'cargando' || ficha === 'error') return [];
    const frases: string[] = [];

    /* Las SEIS especies activas, medidas contra `cat_especies` (no
     * inventadas): perro · gato · conejo · ave · roedor · pez. La key se
     * arma con un `switch` y NO por interpolación (`t(\`…${e}\`)`) — una
     * key dinámica se escapa del tipado exigible del riel, que es
     * justamente lo que impide que una traducción faltante llegue viva a
     * la pantalla. Lo que no matchea no se pinta. */
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

    // Ley 3: `S|M|L` es vocabulario de motor — sale por el diccionario que
    // el grooming ya tiene, y lo que no matchea no se pinta.
    const tallas = ficha.tallas_aplicables
      .map((x) =>
        x === 'S' ? t('grooming.tallaS') : x === 'M' ? t('grooming.tallaM') : x === 'L' ? t('grooming.tallaL') : '',
      )
      .filter((v) => v !== '');
    if (tallas.length > 0) {
      frases.push(t('despensa.porqueTalla', { lista: tallas.join(', ').toLowerCase() }));
    }

    // Idem con M1..M5 — el vocabulario interno JAMÁS es visible.
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
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[5],
        }}
      >
        {ficha === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3], paddingHorizontal: spacing[5] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={200} />
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
            {/* 1 · LA FOTO (hoy el fallback digno — ver LienzoProducto) */}
            <View style={{ paddingHorizontal: spacing[5], alignItems: 'center' }}>
              <LienzoProducto lado={220} />
            </View>

            {/* 2 · QUÉ ES. A6 SIN CAJA: jerarquía y aire, cero marco. */}
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
              <Texto variante="titulo">{ficha.nombre}</Texto>
              {ficha.marca !== null ? <Texto variante="apoyo">{ficha.marca}</Texto> : null}
              {ficha.descripcion !== null ? (
                <View style={{ paddingTop: spacing[2] }}>
                  <Texto variante="cuerpo">{ficha.descripcion}</Texto>
                </View>
              ) : null}
            </View>

            {/* 3 · 🔴 EL PORQUÉ — la firma de la pantalla */}
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
                  /* §6: la dieta de prescripción se DECLARA como lo que es.
                     La indicación fina es del veterinario, jamás de la
                     vitrina — y la pantalla lo dice en voz alta en lugar de
                     dejar que parezca un alimento más. */
                  <Texto variante="apoyo">{t('despensa.porquePrescripcion')}</Texto>
                ) : null}
              </View>
            ) : null}

            {/* 4 · LAS PRESENTACIONES CON SU PRECIO.
                🔴 NULO HONESTO: una variante sin oferta publicada EXISTE y no
                se puede comprar. Se muestra diciendo eso — poner "$ 0,00"
                sería mentira con formato de dato (E15/19.9), y esconderla
                haría creer que la presentación no existe. */}
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
                  {ficha.variantes.map((v, i) => (
                    <View key={v.variante_id}>
                      {i > 0 ? <Separador /> : null}
                      <Celda
                        titulo={v.presentacion}
                        subtitulo={
                          v.oferta_id === null ? t('despensa.varianteSinOferta') : undefined
                        }
                        metadataMono={
                          v.precio !== null ? `$ ${v.precio.toFixed(2)}` : undefined
                        }
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 5 · EL LÍMITE DE LA TANDA, DICHO. No hay CTA de compra porque
                el carrito no existe todavía (fuera de alcance, §5.2 puntos
                3-6). Un botón "Agregar" que no agrega sería peor que su
                ausencia — y un final mudo también, así que se dice. */}
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Texto variante="apoyo">{t('despensa.compraLlega')}</Texto>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
