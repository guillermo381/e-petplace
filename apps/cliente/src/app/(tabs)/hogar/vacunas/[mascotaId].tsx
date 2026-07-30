/**
 * EL PLAN DE VACUNAS — contexto 1 de la lámina `patron-2-lista-colapsable`
 * (S82-A r5). Traducido a la casa, JAMÁS calcado: el `.js` de la lámina es
 * DOM y se re-pensó; sus `--e1/--e2/--e3`, sus `inset` y sus
 * `transition` no viajan (sombras por `elevacion`, movimiento por la
 * física de la casa); los hexes del CSS NO son fuente — `palette.ts`
 * gana.
 *
 * TESIS: "cómo va su protección, sin abrir nada".
 * FIRMA: el tablero de tres cifras que preside — la lista deja de ser
 * lista y se lee de un vistazo.
 * CHANEL: murió el techo de gradiente de marca de la lámina (Ley 4, ver
 * abajo) y murió la marca de agua del isotipo (es "prueba" sin firmar en
 * la propia lámina, y choca con "un isotipo por pantalla").
 *
 * ── LOS CINCO CHOQUES DECLARADOS (la fuente gana a la lámina) ──
 * ① EL PLAN BASE NO EXISTE. La lámina promete "1 sin registro" y una
 *    fila agrupada "5 vacunas del plan base, ninguna cargada". MEDIDO:
 *    `cat_vacunas` es VOCABULARIO (codigo · nombre · especies · activo ·
 *    country_codes) — sin periodicidad ni obligatoriedad: no hay con qué
 *    saber qué le FALTA a una mascota. Afirmarlo sería L-139. La tercera
 *    cifra dice lo que el dato sostiene: **sin fecha de refuerzo**. La
 *    fila de ausencia agrupada NO se construye.
 * ② MEDIDO: `fecha_proxima` está poblada en **1 de 32** filas de la DB
 *    — el tablero real va a decir casi todo "sin fecha de refuerzo", y
 *    eso es la verdad del expediente, no un bug de esta pantalla.
 * ③ EL RÓTULO NO DICE "PLAN". Por ① no hay plan: la sección se llama
 *    "Sus vacunas" (lo que hay), jamás "Plan de vacunas" (lo que
 *    debería haber).
 * ④ EL RÓTULO NO VA EN MONO MAYÚSCULAS. La lámina pide mono uppercase
 *    tracking .16em; la Ley 3 lo PROHÍBE con su ejemplo literal ("mono
 *    jamás en mayúsculas"). Va en `Texto seccion` con su cuenta en mono.
 * ⑤ EL TECHO NO LLEVA EL GRADIENTE DE MARCA. Ley 4: el gradiente firma
 *    vive en contextos cerrados (hero de onboarding, CTA principal,
 *    momento adopción, techo del Hogar) — una pantalla interna no está
 *    en esa lista y sumarlo es decisión de arte que exige firma.
 *    `Encabezado navegacion` + el bloque de identidad debajo.
 * ⑥ `PieRevelar` va SIN CAJA (anatomía 19.7, FIRMADA en dispositivo por
 *    el founder en S73). La lámina le pone caja `--sup2`: gana la casa.
 *
 * Consume, no clona (regla 37): `FiltroPills` y `CantoCurva` son de C
 * (override local del cliente; se importan — R10 solo veta propagar el
 * marcador). El canto de la vacuna es `capa.identidad`, la MISMA capa
 * con que el timeline la pinta desde S52 (protección de vida) — cero
 * hex nuevo, cero categoría inventada.
 *
 * CANDIDATAS DECLARADAS (no ejecutadas — fuera de territorio):
 *  · `packages/api`: el select de `obtenerPerfilMascota` no trae `lote`
 *    ni `veterinario_nombre_externo`, así que el cuerpo desplegado NO
 *    dice "quién la aplicó" (la lámina sí). Es UNA línea de select y
 *    esta ronda es app cliente: se declara, no se toca.
 *  · `packages/ui` (B): `TextoColor` necesita `'warning'` — hoy la
 *    cifra ámbar se pinta con `Text` + token, porque la API de `Texto`
 *    tiene danger/success y no el registro de atención.
 *  · `packages/domain`: `estadoDeVacuna` es cálculo puro y debería vivir
 *    ahí junto a los otros cómputos del expediente.
 */

import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Entrada,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  PieRevelar,
  Texto,
  radius,
  spacing,
  typography,
  usePresionado,
  useTheme,
} from '@epetplace/ui';
import { fechaCortaMono, type IdiomaSoportado } from '@epetplace/i18n';
import { obtenerPerfilMascota, type PerfilMascota, type VacunaDeMascota } from '@epetplace/api';

import { CantoCurva } from '@/components/canto-curva';
import { FiltroPills, type OpcionFiltro } from '@/components/filtro-pills';
import { useTraduccion } from '@/i18n';

/** Cuántas filas se ven antes del pie que revela (la lámina: 3). */
const TOPE_VISIBLE = 3;

type EstadoVacuna = 'alDia' | 'atencion' | 'sinFecha';
type EjeEstado = 'todo' | EstadoVacuna;

/** El estado de UNA vacuna, del dato y nada más (candidata a domain):
 *  sin `fecha_proxima` no se inventa vigencia — se dice que no la hay. */
function estadoDeVacuna(v: VacunaDeMascota, hoyIso: string): EstadoVacuna {
  if (v.fecha_proxima === null) return 'sinFecha';
  return v.fecha_proxima >= hoyIso ? 'alDia' : 'atencion';
}

function hoyIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Chevron({ abierto, color }: { abierto: boolean; color: string }) {
  // el chevron canónico de CeldaNavegacion, girado: ⌄ revela · ⌃ pliega
  // (19.7, firmado). Reemplazo directo — sin transición (Ley 6).
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" style={{ transform: [{ rotate: abierto ? '180deg' : '0deg' }] }}>
      <Path d="m7 10 5 5 5-5" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function PlanDeVacunas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  const [eje, setEje] = useState<EjeEstado>('todo');
  const [abierta, setAbierta] = useState<number | null>(null);
  const [reveladas, setReveladas] = useState(false);

  const cargar = useCallback(async () => {
    if (typeof mascotaId !== 'string') return;
    const r = await obtenerPerfilMascota(mascotaId);
    setPerfil(r.ok ? r.data : 'error');
  }, [mascotaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const hoy = hoyIsoLocal();
  const vacunas = perfil !== 'cargando' && perfil !== 'error' ? perfil.vacunas : [];

  // El tablero: las tres cifras que presiden (la FIRMA de la pantalla).
  const conteo = useMemo(() => {
    const c = { alDia: 0, atencion: 0, sinFecha: 0 };
    for (const v of vacunas) c[estadoDeVacuna(v, hoy)] += 1;
    return c;
  }, [vacunas, hoy]);

  // El eje espeja el tablero (la lámina: si un eje no parte los datos,
  // no existe — acá el de SERVICIO no se dibuja: una vacuna no tiene
  // oficio, devolvería el mismo conjunto siempre).
  const opcionesEje: OpcionFiltro<EjeEstado>[] = [
    { codigo: 'todo', etiqueta: t('planVacunas.ejeTodo'), icono: null },
    { codigo: 'alDia', etiqueta: t('planVacunas.ejeAlDia'), icono: null },
    { codigo: 'atencion', etiqueta: t('planVacunas.ejeAtencion'), icono: null },
    { codigo: 'sinFecha', etiqueta: t('planVacunas.ejeSinFecha'), icono: null },
  ];

  const filtradas = eje === 'todo' ? vacunas : vacunas.filter((v) => estadoDeVacuna(v, hoy) === eje);
  const visibles = reveladas ? filtradas : filtradas.slice(0, TOPE_VISIBLE);
  const ocultas = filtradas.length - visibles.length;

  const nombre = perfil !== 'cargando' && perfil !== 'error' ? perfil.mascota.nombre : '';

  // ── carga: el esqueleto ES la pantalla (mismas cajas, mismo orden) ──
  if (perfil === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5], gap: spacing[5] }}>
          <EsqueletoGrupo etiqueta={t('planVacunas.cargando')}>
            <View style={{ flexDirection: 'row', gap: spacing[4] }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: spacing[2] }}>
                  <Esqueleto forma="linea" ancho="50%" alto={20} />
                  <Esqueleto forma="linea" ancho="80%" alto={10} />
                </View>
              ))}
            </View>
            <View style={{ height: spacing[5] }} />
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {[0, 1, 2].map((i) => (
                <Esqueleto key={i} forma="bloque" ancho={90} alto={44} />
              ))}
            </View>
            <View style={{ height: spacing[5] }} />
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ marginBottom: spacing[2.5] }}>
                <Esqueleto forma="bloque" ancho="100%" alto={64} />
              </View>
            ))}
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  // ── error: aparece CON la pantalla, dice qué pasó y ofrece salida ──
  if (perfil === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('planVacunas.errorTitulo')}
            descripcion={t('planVacunas.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('planVacunas.reintentar')}
                onPress={() => {
                  setPerfil('cargando');
                  void cargar();
                }}
              />
            }
          />
        </View>
      </View>
    );
  }

  // la línea de identidad: SOLO lo cargado (raza · peso). La edad exigía
  // clonar la voz del perfil (de C) — se omite antes que duplicarla.
  const identidad = [
    perfil.mascota.raza,
    perfil.peso_clinico_kg !== null ? t('planVacunas.pesoKg', { kg: perfil.peso_clinico_kg }) : null,
  ].filter((x): x is string => typeof x === 'string' && x.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* La identidad de la pantalla — quién, y de qué se habla */}
        <Entrada>
          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[2], gap: spacing[1] }}>
            <Texto variante="titulo">{t('planVacunas.titulo', { nombre })}</Texto>
            {identidad.length > 0 ? <Texto variante="dato">{identidad.join(' · ')}</Texto> : null}
          </View>
        </Entrada>

        {vacunas.length === 0 ? (
          // el carnet vacío: una sola voz honesta con su camino — jamás
          // filas grises fabricadas (choque ① : no hay plan base que
          // listar). SIN Entrada: el vacío aparece CON la pantalla, jamás
          // escalonado (Ley 13; el guard R8 de C cazó esto en su primera
          // corrida sobre este archivo — el lint no es decorativo).
          <View style={{ padding: spacing[5] }}>
            <EstadoVacio
              registro="seccion"
              titulo={t('planVacunas.vacioTitulo')}
              descripcion={t('planVacunas.vacioDetalle')}
              accion={
                <Boton
                  etiqueta={t('planVacunas.cargarCarnet')}
                  onPress={() => router.push({ pathname: '/carnet', params: { mascotaId: perfil.mascota.id, nombre } })}
                />
              }
            />
          </View>
        ) : (
          <>
            {/* ── LA FIRMA: el tablero que preside ── */}
            <Entrada orden={1}>
              <View
                style={{
                  marginHorizontal: spacing[5],
                  marginTop: spacing[4],
                  paddingVertical: spacing[4],
                  flexDirection: 'row',
                  backgroundColor: theme.bg.card,
                  borderRadius: radius.lg,
                  boxShadow: theme.elevacion.reposo,
                }}
              >
                {(
                  [
                    ['alDia', conteo.alDia, theme.status.successText, t('planVacunas.resumenAlDia')],
                    ['atencion', conteo.atencion, theme.status.warningText, t('planVacunas.resumenAtencion')],
                    ['sinFecha', conteo.sinFecha, theme.text.tertiary, t('planVacunas.resumenSinFecha')],
                  ] as const
                ).map(([clave, valor, color, rotulo], i) => (
                  <View
                    key={clave}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      gap: spacing[1],
                      paddingHorizontal: spacing[2],
                      ...(i > 0 ? { borderLeftWidth: 1, borderLeftColor: theme.border.subtle } : null),
                    }}
                  >
                    {/* la cifra en voz de máquina; el registro de ATENCIÓN
                        no existe en la API de Texto (candidata para B) */}
                    <Text
                      style={{
                        fontFamily: typography.family.mono.regular,
                        fontSize: typography.size.lg,
                        color,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {valor}
                    </Text>
                    <Texto variante="apoyo" centrado>
                      {rotulo}
                    </Texto>
                  </View>
                ))}
              </View>
            </Entrada>

            {/* ── el eje ÚNICO (el de servicio no se dibuja: no parte nada) ── */}
            <Entrada orden={2}>
              <View style={{ marginTop: spacing[4] }}>
                <FiltroPills
                  opciones={opcionesEje}
                  activo={eje}
                  onCambio={(c) => {
                    setEje(c);
                    setAbierta(null);
                    setReveladas(false);
                  }}
                />
              </View>
            </Entrada>

            {/* ── el rótulo con su cuenta (choque ④: sans, no mono-mayúsculas) ── */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                paddingHorizontal: spacing[5],
                marginTop: spacing[6],
                marginBottom: spacing[3],
              }}
            >
              <Texto variante="seccion">{t('planVacunas.rotulo')}</Texto>
              <Texto variante="dato">{filtradas.length}</Texto>
            </View>

            {filtradas.length === 0 ? (
              <View style={{ paddingHorizontal: spacing[5] }}>
                <EstadoVacio
                  registro="seccion"
                  titulo={t('planVacunas.filtroVacio')}
                  descripcion={t('planVacunas.filtroVacioDetalle')}
                  accion={<Boton variante="secundario" etiqueta={t('planVacunas.verTodo')} onPress={() => setEje('todo')} />}
                />
              </View>
            ) : (
              <View style={{ paddingHorizontal: spacing[4], gap: spacing[2.5] }}>
                {visibles.map((v, i) => (
                  <FilaVacuna
                    key={`${v.evento_id ?? v.nombre_vacuna}-${i}`}
                    vacuna={v}
                    estado={estadoDeVacuna(v, hoy)}
                    abierta={abierta === i}
                    onToggle={() => setAbierta(abierta === i ? null : i)}
                    idioma={idioma}
                  />
                ))}
              </View>
            )}

            {/* una sola abierta a la vez: dos abiertas y el tablero deja de presidir */}
            <PieRevelar n={ocultas} revelado={reveladas} onPress={() => setReveladas(!reveladas)} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── la fila: colapsada dice nombre y vigencia; desplegada suma el detalle ──

function FilaVacuna({
  vacuna,
  estado,
  abierta,
  onToggle,
  idioma,
}: {
  vacuna: VacunaDeMascota;
  estado: EstadoVacuna;
  abierta: boolean;
  onToggle: () => void;
  /** r6: el tipo DEL RIEL, jamás `string` — `useTraduccion` ya devuelve
   *  `IdiomaSoportado` y el prop era el único lugar donde se perdía. La
   *  firma de `fechaCortaMono` NO se ensancha (patrón de C, r2: las
   *  funciones locales declaran `'es' | 'en'`). */
  idioma: IdiomaSoportado;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { handlers, estiloPresionado } = usePresionado(0.99);

  const colorEstado =
    estado === 'alDia' ? theme.status.successText : estado === 'atencion' ? theme.status.warningText : theme.text.tertiary;

  const vigencia =
    vacuna.fecha_proxima === null
      ? t('planVacunas.sinFecha')
      : estado === 'atencion'
        ? t('planVacunas.vencio', { fecha: fechaCortaMono(vacuna.fecha_proxima, idioma) })
        : t('planVacunas.hasta', { fecha: fechaCortaMono(vacuna.fecha_proxima, idioma) });

  // el detalle es lo que el contrato TRAE (lote y autoría: candidata
  // declarada en la cabecera — el select no las expone todavía)
  const detalle: { etiqueta: string; valor: string }[] = [];
  if (vacuna.fecha_aplicada !== null) {
    detalle.push({ etiqueta: t('planVacunas.aplicada'), valor: fechaCortaMono(vacuna.fecha_aplicada, idioma) });
  }
  if (vacuna.tipo_vacuna !== null && vacuna.tipo_vacuna.length > 0) {
    detalle.push({ etiqueta: t('planVacunas.tipo'), valor: vacuna.tipo_vacuna });
  }
  if (vacuna.fecha_proxima !== null) {
    detalle.push({ etiqueta: t('planVacunas.proximo'), valor: fechaCortaMono(vacuna.fecha_proxima, idioma) });
  }
  const desplegable = detalle.length > 0;

  // La cabecera vive en una variable: la usan las dos ramas (tocable y
  // no tocable) — cero duplicación de composición.
  const cabecera = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[3],
        minHeight: 58,
      }}
    >
      <View style={{ flex: 1, gap: spacing[0.5] }}>
        <Texto variante="cuerpo" numberOfLines={1}>
          {vacuna.nombre_vacuna}
        </Texto>
        {/* la vigencia es voz de máquina y su COLOR dice el estado — el
            canto queda para la categoría (la excepción declarada de la
            lámina, que acá se cumple sola) */}
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.sm,
            letterSpacing: typography.tracking.mono,
            color: colorEstado,
          }}
        >
          {vigencia}
        </Text>
      </View>
      {desplegable ? (
        <Chevron abierto={abierta} color={theme.text.tertiary} />
      ) : (
        // sin detalle no hay promesa de despliegue (principio de la puerta)
        <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
          —
        </Text>
      )}
    </View>
  );

  return (
    // el canto de la vacuna es capa.identidad — la MISMA con que el
    // timeline la pinta (protección de vida, S52). CantoCurva es de C.
    <CantoCurva color={theme.capa.identidad}>
      {/* r6 · EL PRESIONADO VA POR REANIMATED, JAMÁS POR CAST: el estilo
          de `usePresionado` lleva transitionProperty/Duration/Timing —
          campos que el `<View>` de RN no tipa y que un `as` habría
          silenciado (en dispositivo se leería como "no anima": la MISMA
          clase de falla muda que el gesto mudo de r3, mismo día).
          El patrón de la casa: `Pressable` porta los handlers,
          `Animated.View` porta el estilo (precedente: el Coach del Hogar
          y el avatar del perfil). El CUERPO desplegado queda AFUERA del
          tocable — tocarlo no pliega, y el escalado no arrastra al
          detalle abierto. */}
      {desplegable ? (
        <Pressable
          {...handlers}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: abierta }}
          accessibilityLabel={`${vacuna.nombre_vacuna} · ${vigencia}`}
        >
          <Animated.View style={estiloPresionado}>{cabecera}</Animated.View>
        </Pressable>
      ) : (
        <View accessibilityLabel={`${vacuna.nombre_vacuna} · ${vigencia}`}>{cabecera}</View>
      )}

      {abierta && desplegable ? (
        <Entrada>
          <View
            style={{
              paddingHorizontal: spacing[3],
              paddingBottom: spacing[3],
              gap: spacing[2],
              borderTopWidth: 1,
              borderTopColor: theme.border.subtle,
              paddingTop: spacing[3],
            }}
          >
            {detalle.map((d) => (
              <FilaDato key={d.etiqueta} etiqueta={d.etiqueta} valor={d.valor} mono disposicion="horizontal" />
            ))}
          </View>
        </Entrada>
      ) : null}
    </CantoCurva>
  );
}
