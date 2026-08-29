/**
 * EL LOG DE GUARDERÍA — el hub, en el lugar que la casa le da (S107-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ESTA PANTALLA NO EXISTÍA, Y ÉSA ERA LA MITAD QUE FALTABA.** Acá vivía
 * el buscador —el FLUJO puesto donde va el historial—, y por eso guardería
 * «no se parecía a sus hermanas». El flujo se mudó a `/explorar/guarderia/`;
 * este lugar recupera su papel: **dónde la familia ve sus estadías.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **El esqueleto es el de sus cuatro hermanas, censado y firmado:**
 * `Encabezado navegacion` → `FiltroMascotas` → `FiltroPills` (próximos /
 * historial) → filas → **CTA al pie** hacia el flujo.
 *
 * ── ⚠️ MITAD INERTE DECLARADA (molde S91) ────────────────────────────────
 * 🔴 **La lista NO se puede llenar todavía: no existe el lector.** Medido —
 * `obtenerEstadiasDelDia` es **del prestador y por día**, y **filtra los holds
 * a propósito**; la familia necesita lo contrario (ver su reserva **sin
 * pagar**, que es la que tiene que ir a pagar). Pedido autocontenido a A en
 * `docs/loop/S107-C-PEDIDO-A-A-LOG-FAMILIA.md`.
 *
 * **Lo que sí está y no es relleno:** el camino al flujo con la mascota
 * elegida, y un vacío que **dice la verdad** en vez de fingir que no hay
 * estadías. *Un «todavía no tienes estadías» sobre un lector que no existe
 * sería la pantalla mintiendo con cara de dato.*
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FiltroMascotas,
  Icono,
  FiltroPills,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerMisEstadiasGuarderia,
  resolverUrlsFotos,
  type EstadiaDeMiMascota,
} from '@epetplace/api';
import { fechaCortaMono, obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

/* ☠️ ACÁ VIVÍA `LISTA_DISPONIBLE = false`, y murió el 29-ago: **A publicó
   `obtenerMisEstadiasGuarderia`** y el enchufe se conectó. *La constante existía
   para que el día del lector fuera una línea — y lo fue.* (Ley 37: el andamio
   se retira en el mismo acto que su razón.) */

type Estadias =
  | { fase: 'cargando' }
  | { fase: 'error' }
  /** 🔴 Nadie preguntó todavía — **no es lo mismo que «no hay»**. */
  | { fase: 'sinSujeto' }
  | { fase: 'listo'; lista: EstadiaDeMiMascota[] };

type Mascotas =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: Array<{ id: string; nombre: string; fotoUrl?: string }> };

export default function LogGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const especies = useEspeciesElegibles('hospedaje');

  const [mascotas, setMascotas] = useState<Mascotas>({ fase: 'cargando' });
  const [elegida, setElegida] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const e = await getEstadoOnboardingDueno();
      if (!vigente) return;
      if (!e.ok || e.data.familia_id === null) {
        setMascotas({ fase: 'error' });
        return;
      }
      const r = await obtenerMascotasDeFamilia(e.data.familia_id);
      if (!vigente) return;
      if (!r.ok) {
        setMascotas({ fase: 'error' });
        return;
      }
      /* Las TRES fases de la elegibilidad, honradas (L-218 · R34): `ofrecibles`
         devuelve [] cargando, con error y de verdad vacío. */
      if (especies.fase === 'cargando') return;
      if (especies.fase === 'error') {
        setMascotas({ fase: 'error' });
        return;
      }
      const elegibles = ofrecibles(r.data, especies);
      /* 🔴 LAS FOTOS SE FIRMAN ANTES DE PINTARLAS. El bucket `mascotas` es
         PRIVADO desde S92-BIS: `foto_url` es un PATH, no una URL, y sin firmar
         no carga. `resolverUrlsFotos` las firma POR LOTE (una sola llamada). */
      const paths = elegibles
        .map((m) => m.foto_url)
        .filter((x): x is string => typeof x === 'string' && x.length > 0);
      const urls = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
      if (!vigente) return;
      setMascotas({
        fase: 'listo',
        lista: elegibles.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          fotoUrl: caraDeMascotaPorRuta({
            especie: m.especie,
            /* ⏪ ACÁ ESTABA LA MITAD MÁS SILENCIOSA DEL DEFECTO: este parámetro
               recibía `m.foto_url`. `rutaImagen` es la ILUSTRACIÓN del catálogo
               (`cat_razas.ruta_imagen`, bucket PÚBLICO `especies`) — pasarle el
               path de la foto privada lo mandaba a resolver contra un bucket
               donde ese objeto no existe. *No fallaba: devolvía una URL que
               no carga, que es un 404 con forma de dato.* */
            rutaImagen: m.raza_ruta_imagen,
            /* ⏪ Y ÉSTA ERA LA MITAD VISIBLE: el escalón 0 —la foto real de la
               familia— **no se pasaba**, así que la escalera nunca podía
               llegar a ella. Las cuatro hermanas sí lo pasan. */
            fotoUri: m.foto_url ? urls.get(m.foto_url) : undefined,
          }),
        })),
      });
      if (elegibles.length === 1) setElegida(elegibles[0].id);
    })();
    return () => {
      vigente = false;
    };
  }, [especies.fase, intento]);

  const [pestana, setPestana] = useState<'proximas' | 'historial'>('proximas');
  const [estadias, setEstadias] = useState<Estadias>({ fase: 'cargando' });
  const idioma = obtenerIdiomaActual();

  /* 🔴 SE PIDE POR MASCOTA. El lector acepta `mascotaId?` y filtra del lado del
     server — *filtrar acá una lista que el server sabe filtrar es traerse de
     más para tirar la mitad.* */
  useEffect(() => {
    /* ⏪ ACÁ DECÍA `{ fase: 'listo', lista: [] }`, y era **la misma clase de
       defecto que esta pista anotó ayer**: con ninguna mascota elegida la
       pantalla pintaba *«Sin estadías agendadas»* — **una afirmación sobre algo
       que nadie preguntó**. Cazado con sesión real y tres mascotas: el vacío
       de la firma salía antes de que hubiera sujeto.
       *Cada mitad era correcta —el vacío dice bien lo suyo, el filtro también—
       y el defecto nacía de mostrarlas juntas.* */
    if (elegida === null) { setEstadias({ fase: 'sinSujeto' }); return; }
    let vigente = true;
    setEstadias({ fase: 'cargando' });
    void (async () => {
      const r = await obtenerMisEstadiasGuarderia({ mascotaId: elegida });
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «no tienes estadías» (Ley 13). */
      setEstadias(r.ok ? { fase: 'listo', lista: r.data } : { fase: 'error' });
    })();
    return () => { vigente = false; };
  }, [elegida, intento]);

  const alAtras = useCallback(() => router.back(), []);
  const mascota =
    mascotas.fase === 'listo' ? (mascotas.lista.find((m) => m.id === elegida) ?? null) : null;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('logGuarderia.titulo')} atras onAtras={alAtras} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {mascotas.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={56} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        ) : mascotas.fase === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('logGuarderia.noCargoTitulo')}
            descripcion={t('logGuarderia.noCargoDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hogar.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        ) : (
          <>
            {mascotas.lista.length > 1 ? (
              <View style={{ marginHorizontal: -spacing[5] }}>
                <FiltroMascotas mascotas={mascotas.lista} elegida={elegida} onElegir={setElegida} />
              </View>
            ) : null}

            {/* ═══ 🔴 DOS BLOQUES CONSTRUIDOS E INERTES — su causa la manda
                    el SERVER, y por eso no se deducen acá ═══════════════════

                ① **ESPECIE SIN OFERTA** (hoy: gato). Firma del founder:
                *«Todavía no tenemos guarderías para gatos. Estamos trabajando
                en eso»* — **y es distinto de «no tienes estadías»: una es una
                carencia NUESTRA, la otra un estado suyo.**
                🔴 **No se deduce de una lista vacía.** Hoy no hay forma de
                distinguirlas: el catálogo dice que el gato es elegible y quien
                sabe que nadie lo recibe es el filtro de ofertas. *Deducirlo
                sería inventar un diagnóstico a partir de un silencio.*
                ⇒ llega con `especie_sin_oferta` del resumen de A.

                ② **PAQUETE CON SALDO** — botón «Reservar estadía de tu
                paquete» + «7 de 10 disponibles», directo al selector de fecha
                de ESA guardería (sin elegir lugar ni pagar: las dos ya están
                hechas). **No existe lector de saldo de paquetes de guardería**
                — y tampoco existe la compra que lo crearía.
                ═════════════════════════════════════════════════════════════ */}

            {/* LOS CHIPS DE LA LISTA — la estructura de las cuatro hermanas.
                Se montan ya: **son navegación, no dato**, y el día que la
                lista llegue no hay que reacomodar la pantalla. */}
            {/* Las etiquetas son las MISMAS keys que sus hermanas (`plan.seg*`)
                — *dos cadenas nuevas que dijeran lo mismo son dos lugares donde
                la voz puede divergir.* */}
            <FiltroPills
              activo={pestana}
              onCambio={(c) => setPestana(c)}
              opciones={[
                { codigo: 'proximas' as const, etiqueta: t('plan.segProximos'), icono: 'hoy', capa: null },
                { codigo: 'historial' as const, etiqueta: t('plan.segHistorial'), icono: 'guarderia', capa: null },
              ]}
            />

            {/* 🔴 DOS VACÍOS DISTINTOS, Y LA DIFERENCIA NO ES DE ESTILO.

                · **«Sin estadías agendadas»** (firma del founder) es la verdad
                  cuando el lector respondió y no había ninguna.
                · **«Todavía no podemos mostrarte»** es la verdad HOY: el lector
                  **no existe**, así que no sabemos si hay o no.

                *Decir el primero sobre un lector que no existe sería mentir con
                cara de dato — y el día que el lector llegue, nadie sabría que la
                pantalla estuvo mintiendo.* **El de la firma está construido y se
                enciende solo** cuando `cargarEstadias` devuelva una lista. */}
            {/* LA LISTA — el vacío de la firma del founder ya es el que se
                pinta: **el lector existe, así que decir «sin estadías» ES la
                verdad.** *El vacío honesto de «todavía no podemos mostrarte»
                murió con su razón.* */}
            {estadias.fase === 'cargando' ? (
              <EsqueletoGrupo>
                <Esqueleto alto={64} />
                <Esqueleto alto={64} />
              </EsqueletoGrupo>
            ) : estadias.fase === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('logGuarderia.estadiasNoCargoTitulo')}
                descripcion={t('logGuarderia.estadiasNoCargoDetalle')}
                accion={
                  <Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setIntento((n) => n + 1)} />
                }
              />
            ) : estadias.fase === 'sinSujeto' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('logGuarderia.elegiMascotaTitulo')}
                descripcion={t('logGuarderia.elegiMascotaDetalle')}
              />
            ) : (() => {
              /* 🔴 `esProxima` LO DECIDE EL SERVER — la pantalla no compara
                 fechas. *Si se compararan en dos superficies podrían discrepar
                 sobre qué es «hoy», y una familia vería su estadía del lado
                 equivocado.* */
              const visibles = estadias.lista.filter((e) =>
                pestana === 'proximas' ? e.esProxima : !e.esProxima,
              );
              if (visibles.length === 0) {
                return (
                  <EstadoVacio
                    registro="seccion"
                    icono={<Icono nombre="guarderia" tamano={48} />}
                    titulo={t('logGuarderia.vacioTitulo')}
                    descripcion={t('logGuarderia.vacioDetalle')}
                  />
                );
              }
              return visibles.map((e) => (
                /* ⚠️ **ESTA FILA NO ES `FilaCita`, Y SE DECLARA.** Medido:
                   `FilaCitaOficio` es `'paseo' | 'grooming' | 'veterinaria' |
                   'adiestramiento'` — **la pieza no conoce guardería**, y es de
                   B. *Montarla con otro oficio pintaría el canto de un servicio
                   ajeno; forzar el tipo sería mentirle al compilador para que
                   la pantalla mienta en el color.*
                   ⇒ **`Celda` mientras tanto**, con el pedido a B escrito
                   (`S107-C-PEDIDO-A-B-FILACITA-GUARDERIA.md`). **Hasta que
                   entre, esta fila NO se ve igual que la de sus hermanas** —
                   se dice acá para que no se lea como un desvío de acabado. */
                /* 🔴 DOS VARIANTES Y NO UNA CON PROPS OPCIONALES: `Celda`
                   discrimina por `interactiva`, y **una fila sin destino no
                   debe parecer tocable**. *Una estadía sin `estadiaId` es una
                   cita comprada que el prestador todavía no ejecutó: no hay
                   durante que mirar, y ofrecer el toque prometería una pantalla
                   vacía.* */
                e.estadiaId === null ? (
                  <Celda
                    key={e.citaId}
                    titulo={e.prestadorNombre}
                    subtitulo={e.mascotaNombre}
                    metadataMono={fechaCortaMono(e.fecha, idioma)}
                  />
                ) : (
                  <Celda
                    key={e.citaId}
                    interactiva
                    accessibilityRole="button"
                    titulo={e.prestadorNombre}
                    subtitulo={e.mascotaNombre}
                    /* ⚠️ SIN HORA: **una estadía no tiene hora** — tiene día y
                       franja. *Un `00:00` se leería como medianoche.* */
                    metadataMono={fechaCortaMono(e.fecha, idioma)}
                    onPress={() =>
                      router.push({
                        pathname: '/guarderia/[estadiaId]',
                        params: {
                          estadiaId: e.estadiaId ?? '',
                          mascotaId: e.mascotaId,
                          mascotaNombre: e.mascotaNombre,
                          fecha: e.fecha,
                        },
                      })
                    }
                  />
                )
              ));
            })()}
          </>
        )}
      </ScrollView>

      {/* EL CTA AL PIE — el de sus cuatro hermanas: lleva al flujo con la
          mascota elegida, y dice POR QUÉ está apagado cuando lo está. */}
      {mascotas.fase === 'listo' && mascotas.lista.length > 0 ? (
        <View style={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[4] }}>
          <Boton
            variante="primario"
            bloque
            etiqueta={
              mascota !== null
                ? t('logGuarderia.reservarDe', { nombre: mascota.nombre })
                : t('plan.agendarFaltaMascota')
            }
            deshabilitado={mascota === null}
            razonDeshabilitado={t('plan.elegiMascota')}
            onPress={() => {
              if (mascota === null) return;
              /* 🔴 EL NOMBRE VIAJA CON EL ID. Sin él, el flujo tendría que
                 volver a pedir la lista de mascotas sólo para escribir una
                 palabra en el cabezal — un viaje entero para un dato que la
                 pantalla que navega ya tiene en la mano. */
              router.navigate({
                pathname: '/explorar/guarderia',
                params: { mascotaId: mascota.id, mascotaNombre: mascota.nombre },
              });
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
