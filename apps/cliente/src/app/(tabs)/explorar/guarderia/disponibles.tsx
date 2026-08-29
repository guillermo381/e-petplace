/**
 * GUARDERÍA · **ETAPA 2 — EL DÍA Y QUIÉN PUEDE** (S107-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **`modalidad → día → ver quién puede → elegir lugar → pagar`**
 * Firma del founder · contrato `s107-contrato-filtro-por-modalidad` ⓪.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⏪ **ESTA PANTALLA ERA `index.tsx`, Y ANTES DE ESO VIVÍA EN `/hogar/guarderia`.**
 * La primera mudanza corrigió un defecto de arquitectura —*el flujo estaba
 * puesto donde va el historial*—; ésta la parte en dos porque **la modalidad
 * es un filtro y va primero**.
 *
 * ⏪ **Y REVOCA UNA DECISIÓN MÍA, que se dice en vez de dejarla contradiciéndose.**
 * El acta de traspaso §⑥① declaró que guardería **no** se partía en
 * `index` + `disponibles` *«porque acá el día ES lo que filtra a los lugares»*.
 * **Era cierto mientras el primer filtro era el día.** La firma de la modalidad
 * puso otro filtro antes, y la primera pantalla ya no repite nada: decide algo
 * que ésta necesita. *La razón vieja no era mala; se le movió el piso.*
 *
 * ── LO QUE ES DISTINTO Y NO SE EMPAREJA ──────────────────────────────────
 * 🔴 **No hay grilla de horas.** Una estadía-día **no es una cita con hora**:
 * ocupa el día entre las dos ventanas del lugar. *Poner una grilla acá
 * inventaría una hora que no existe* — firma de la mesa, y es la única
 * diferencia con sus hermanas que el oficio justifica. Donde los otros
 * responden **quién puede a esa hora**, ésta responde **quién tiene lugar ese día**.
 *
 * ── 🔴 EL PRECIO, POR MODALIDAD Y SIN UNA SOLA CUENTA ─────────────────────
 * Cada lugar muestra **el número del server para la modalidad elegida**, y
 * **esta pantalla no multiplica, no divide y no promedia**. Si un lugar no
 * tiene precio para esa modalidad, **no se lo filtra** (filtrar es del server,
 * contrato ⓪) **ni se le inventa uno**: se muestra sin número.
 * *Un lugar que desaparece de la lista por decisión de la pantalla es un lugar
 * que existe para el server y no para la familia.*
 */


import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Celda,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FiltroMascotas,
  SelectorDia,
  SelectorOpcion,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerGuarderiasDisponibles,
  obtenerMascotasDeFamilia,
  type GuarderiaDisponible,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { CabezalOficio, DiaSinHorarios } from '@/components/reserva-piezas';
import {
  TAMANOS_PAQUETE,
  esModalidad,
  type ModalidadGuarderia,
  type TamanoPaqueteGuarderia,
} from '@/lib/guarderia-modalidad';

/** Fecha LOCAL. 🔴 Jamás `toISOString()`: en Guayaquil, después de las 19:00,
 *  devuelve el día siguiente. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Mascotas =
  | { fase: 'cargando' }
  | { fase: 'error' }
  /* 🔴 La mascota viaja con su CARA: `FiltroMascotas` la pinta, y era lo que
     el chip de texto plano no podía mostrar. */
  | { fase: 'listo'; lista: Array<{ id: string; nombre: string; fotoUrl?: string }> };

type Lista =
  | { fase: 'ocioso' }
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lugares: GuarderiaDisponible[] };

export default function DisponiblesGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const idioma = obtenerIdiomaActual();

  /* 🔴 LA MASCOTA Y LA MODALIDAD VIAJAN POR PARÁMETRO. La mascota viene del
     hub y la modalidad de la etapa 1 — **ninguna de las dos se re-pregunta
     acá**: ya están decididas, y volver a ofrecerlas las vuelve re-editables
     en una pantalla donde no lo son (Ley 23). */
  const params = useLocalSearchParams<{
    mascotaId?: string;
    mascotaNombre?: string;
    modalidad?: string;
  }>();
  const modalidad: ModalidadGuarderia = esModalidad(params.modalidad) ? params.modalidad : 'dia';
  const mascotaDelParam = typeof params.mascotaId === 'string' && params.mascotaId.length > 0
    ? params.mascotaId
    : null;

  const especies = useEspeciesElegibles('hospedaje');
  const [mascotas, setMascotas] = useState<Mascotas>({ fase: 'cargando' });
  const [mascotaId, setMascotaId] = useState<string | null>(mascotaDelParam);
  /** Sólo para `paquete`. Nace en el más chico: **no hay default oscuro**. */
  const [tamano, setTamano] = useState<TamanoPaqueteGuarderia>(TAMANOS_PAQUETE[0]);
  const [fecha, setFecha] = useState<string>(() => iso(new Date(Date.now() + 86400000)));
  const [lista, setLista] = useState<Lista>({ fase: 'ocioso' });
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
      /* 🔴 El filtro NO se aplica hasta que el catálogo respondió: `ofrecibles`
         devuelve [] mientras carga, y decidir con eso diría «no tienes ninguna
         mascota que pueda» a alguien que sí tiene. */
      if (especies.fase === 'cargando') return;
      if (especies.fase === 'error') {
        setMascotas({ fase: 'error' });
        return;
      }
      const elegibles = ofrecibles(r.data, especies);
      setMascotas({
        fase: 'listo',
        lista: elegibles.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          fotoUrl: caraDeMascotaPorRuta({ especie: m.especie, rutaImagen: m.foto_url }),
        })),
      });
      /* 🔴 El parámetro MANDA sobre la preselección: si la mascota ya viajó,
         auto-elegir la única de la lista podría cambiar de sujeto en silencio. */
      if (mascotaDelParam === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
    })();
    return () => {
      vigente = false;
    };
  }, [especies.fase, intento, mascotaDelParam]);

  useEffect(() => {
    if (mascotaId === null) {
      setLista({ fase: 'ocioso' });
      return;
    }
    let vigente = true;
    setLista({ fase: 'cargando' });
    void (async () => {
      /* ✏️ A, S107: **la modalidad VIAJA al server** — el filtro ya la acepta.
         C escribió esta llamada cuando todavía no, así que la pantalla filtraba
         de su lado. 🔴 Mandarla no es cosmético: **es lo que hace que la lista
         sean los lugares que ofrecen ESA modalidad**, y lo que trae
         `precioModalidad` ya resuelto. *Sin este argumento, el selector elige
         una modalidad que el servidor nunca se entera.* */
      const r = await obtenerGuarderiasDisponibles({ fecha, mascotaId, modalidad });
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «no hay lugares» (Ley 13): la familia
         leería «ninguna guardería puede» cuando lo cierto es «no pudimos
         preguntar». */
      setLista(r.ok ? { fase: 'listo', lugares: r.data } : { fase: 'error' });
    })();
    return () => {
      vigente = false;
    };
  }, [mascotaId, fecha, intento]);

  /* `DiaOpcion = { iso, dia, numero }` — **día abreviado y número, separados**,
     que es lo que deja al número grande y al día chico arriba. La prosa larga
     no cabía porque era UNA sola cadena. */
  const dias = useMemo(() => {
    const corto = new Intl.DateTimeFormat(idioma, { weekday: 'short' });
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + 1 + i);
      return {
        iso: iso(d),
        dia: corto.format(d).replace('.', '').toLowerCase(),
        numero: String(d.getDate()),
      };
    });
  }, [idioma]);

  /** El día siguiente al elegido — la salida del vacío. `null` al final de la
   *  tira: **sin día al que ir, no se ofrece un botón que no lleva a nada.** */
  const siguienteDia = useMemo(() => {
    const i = dias.findIndex((d) => d.iso === fecha);
    const sig = i >= 0 ? dias[i + 1] : undefined;
    return sig === undefined ? null : { iso: sig.iso, etiqueta: `${sig.dia} ${sig.numero}` };
  }, [dias, fecha]);

  /** El nombre para el cabezal: el del parámetro, o el de la lista cuando la
   *  familia la eligió acá. **Nunca un placeholder.** */
  const nombreMascota = useMemo(() => {
    if (typeof params.mascotaNombre === 'string' && params.mascotaNombre.length > 0) {
      return params.mascotaNombre;
    }
    if (mascotas.fase !== 'listo' || mascotaId === null) return null;
    return mascotas.lista.find((m) => m.id === mascotaId)?.nombre ?? null;
  }, [params.mascotaNombre, mascotas, mascotaId]);

  /**
   * 🔴 **EL NÚMERO DE ESTA MODALIDAD, TAL CUAL LO DIO EL SERVER.** Cero
   * aritmética: ni multiplicar el día por el tamaño, ni dividir el paquete.
   * `null` = este lugar no vende esta modalidad ⇒ **se muestra sin número**,
   * jamás se lo esconde de la lista (filtrar es del server, contrato ⓪).
   *
   * ⚠️ Hoy sólo corre la rama `dia`: las otras dos viven detrás de la
   * compuerta de `guarderia-modalidad.ts`. *Se escriben leyendo el campo de SU
   * modalidad —nunca `precio`— para que, si alguien enciende la compuerta antes
   * de tiempo, el peor caso sea una ausencia y no un precio de día disfrazado.*
   */
  /* ✏️ CRUCE DECLARADO (A, S107) — **el criterio de C era el correcto y la
     fuente estaba equivocada.** Elegir el campo de SU modalidad en vez de
     `precio` evitaba el peor caso que C nombró; lo que no podía saber es que
     una de las tres fuentes ya estaba MINTIENDO.

     🔴 **Medido el 29-ago:** para paquete, `precioPaquete` sale de la COLUMNA
     `prestador_servicios.precio_paquete`, que es **`NULL`**, mientras el motor
     resuelve el precio desde la TABLA `guarderia_paquetes`, donde vive **5d/$40**.
     ⇒ esta pantalla habría mostrado **«sin precio»** para una modalidad que sí
     se vende, y lo habría hecho sin error de ningún tipo.

     ⇒ **Se usa `precioModalidad`, que el server ya resolvió** (contrato del
     filtro §①). *La cuenta se hace una vez o no sirve: dos fuentes para el
     mismo precio es cómo la vitrina y el checkout terminan diciendo distinto.*
     Los tres campos sueltos quedan como respaldo por si `precioModalidad` no
     viniera —una llamada sin `modalidad`—, y **nunca cae a `precio`** cuando la
     modalidad no es día: la ausencia es preferible al precio de otra cosa. */
  const precioDeLaModalidad = useCallback(
    (g: GuarderiaDisponible): number | null =>
      g.precioModalidad ??
      (modalidad === 'dia' ? g.precio : modalidad === 'paquete' ? null : g.precioMensual),
    [modalidad],
  );

  const alAtras = useCallback(() => router.back(), []);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* La cabecera del FLUJO, no la de un hub: el glifo del oficio preside,
          como en los otros cuatro. */}
      <CabezalOficio
        oficio="guarderia"
        capa="cuidado"
        titulo={t('hubGuarderia.titulo')}
        /* 🔴 EL SUJETO, BAJO EL TÍTULO — el patrón literal de grooming
           (`explorar/grooming/index.tsx:268-275`). *La presencia de la mascota
           es letra firmada desde S61; lo que sobraba era el CONTROL.* */
        /* Sin mascota (deep-link) el cabezal **no queda mudo**: cae a la
           línea que explica el oficio, que es lo que un desconocido necesita. */
        detalle={nombreMascota ?? t('hubGuarderia.cabezalDetalle')}
        onAtras={alAtras}
        insetTop={insets.top}
      />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[6], paddingBottom: insets.bottom + spacing[8] }}>
        {mascotas.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={56} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        ) : mascotas.fase === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('hubGuarderia.noCargoTitulo')}
            descripcion={t('hubGuarderia.noCargoDetalle')}
          />
        ) : mascotas.lista.length === 0 ? (
          /* Honesto y CON su porqué: la guardería es de perros y gatos, y eso
             es un DATO del catálogo, no un `if` de esta pantalla. */
          <EstadoVacio
            registro="seccion"
            titulo={t('hubGuarderia.sinElegiblesTitulo')}
            descripcion={t('hubGuarderia.sinElegiblesDetalle')}
          />
        ) : (
          <>
            {/* ⭐ S107-C · `FiltroMascotas`, LA PIEZA DE LA CASA. Antes acá
                había un `SelectorOpcion` genérico: texto plano, sin cara y sin
                el estado elegido que los otros cuatro oficios sí muestran.
                **No era un chip mal configurado: era otro control.** */}
            {/* 🔴 **SÓLO CUANDO LA MASCOTA NO VIAJÓ.** El guard es el mismo,
                literal, que grooming (`index.tsx:334`): el selector sobrevive
                para el camino sin parámetro —deep-link, log vacío—, donde sí
                es el eje ⓪. *Quitarlo del todo dejaría esa entrada sin sujeto;
                dibujarlo siempre re-preguntaría lo ya decidido.* */}
            {mascotaDelParam === null && mascotas.lista.length > 1 ? (
              <View style={{ marginHorizontal: -spacing[5] }}>
                <FiltroMascotas
                  mascotas={mascotas.lista}
                  elegida={mascotaId}
                  onElegir={setMascotaId}
                />
              </View>
            ) : null}

            {/* ⭐ S107-C · `SelectorDia`, la misma tira que los cuatro.
                Antes eran chips con la fecha en prosa larga —«Domingo, 30 de
                agos»— que **se cortaban**: el texto no entraba y entraban dos.
                La pieza de la casa resuelve la misma pregunta con **día
                abreviado arriba y número grande**, y entran tres.
                *La pregunta era la misma; la respuesta ya estaba escrita.* */}
            {/* 🔴 EL DÍA NO SIGNIFICA LO MISMO EN LAS TRES (contrato ①):
                día = el día a agendar · paquete = **el primero** · mensual = el
                de **inicio**. *Un rótulo único diría lo correcto en un caso y
                lo confuso en los otros dos.* */}
            <Texto variante="seccion">
              {modalidad === 'paquete'
                ? t('hubGuarderia.quePrimerDia')
                : modalidad === 'mensual'
                  ? t('hubGuarderia.queDiaInicio')
                  : t('hubGuarderia.queDia')}
            </Texto>
            <SelectorDia
              dias={dias}
              elegido={fecha}
              cerrados={new Set()}
              etiquetaCerrado={t('hubGuarderia.diaCerrado')}
              onElegir={setFecha}
            />

            {/* EL TAMAÑO — sólo en paquete. `SelectorOpcion` en tira con acento
                de control, **la misma forma que los presets del paseo**
                (`components/paquete-hoja.tsx:94-101`). */}
            {modalidad === 'paquete' ? (
              <SelectorOpcion
                acento="control"
                disposicion="tira"
                etiqueta={t('hubGuarderia.cuantasEstadias')}
                opciones={TAMANOS_PAQUETE.map((n) => ({
                  codigo: String(n),
                  etiqueta: t('hubGuarderia.tamanoEstadias', { n }),
                }))}
                seleccionada={String(tamano)}
                onSelect={(codigo) => setTamano(Number(codigo) as TamanoPaqueteGuarderia)}
              />
            ) : null}

            <View style={{ gap: spacing[3] }}>
              <Texto variante="titulo">{t('hubGuarderia.lugaresTitulo')}</Texto>

              {lista.fase === 'cargando' ? (
                <EsqueletoGrupo>
                  <Esqueleto alto={64} />
                  <Esqueleto alto={64} />
                </EsqueletoGrupo>
              ) : lista.fase === 'error' ? (
                <EstadoVacio
                  registro="seccion"
                  titulo={t('hubGuarderia.listaNoCargoTitulo')}
                  descripcion={t('hubGuarderia.listaNoCargoDetalle')}
                />
              ) : lista.fase === 'listo' && lista.lugares.length === 0 ? (
                /* 🔴 EL VACÍO NO QUEDA MUDO: dice qué pasa **y ofrece la
                    salida**, como el paseo. *Un vacío sin salida deja a la
                    familia mirando una pantalla que no le propone nada* — y
                    acá la salida es obvia: el cupo cambia todos los días. */
                <DiaSinHorarios
                  titulo={t('hubGuarderia.sinLugaresTitulo')}
                  porque={t('hubGuarderia.sinLugaresDetalle')}
                  etiquetaSalida={siguienteDia === null ? null : t('hubGuarderia.probarDia', { dia: siguienteDia.etiqueta })}
                  onSalida={() => { if (siguienteDia !== null) setFecha(siguienteDia.iso); }}
                />
              ) : lista.fase === 'listo' ? (
                lista.lugares.map((g) => {
                  const precio = precioDeLaModalidad(g);
                  return (
                  <Celda
                    key={g.prestadorId}
                    interactiva
                    accessibilityRole="button"
                    titulo={g.prestadorNombre}
                    /* 🔴 `sobrevendido` NO se pinta: para la familia, un lugar
                       que puede recibirla es un lugar que puede recibirla. La
                       sobreventa es problema operativo del prestador. */
                    subtitulo={g.ciudad ?? undefined}
                    /* 🔴 SIN NÚMERO cuando el lugar no vende esta modalidad.
                       *Un guion o un cero en el lugar de una plata que no
                       conocemos se lee como «gratis».* */
                    metadataMono={
                      precio === null
                        ? undefined
                        : modalidad === 'dia'
                          ? t('hubGuarderia.porDia', { precio: precio.toFixed(2) })
                          : modalidad === 'mensual'
                            ? t('hubGuarderia.porMes', { precio: precio.toFixed(2) })
                            : t('hubGuarderia.porPaquete', { precio: precio.toFixed(2) })
                    }
                    /* 🔴 La mascota VIAJA: sin ella el lugar no puede evaluar
                       el gate sanitario, y una pantalla que no puede evaluarlo
                       no puede ofrecer reservar. */
                    onPress={() =>
                      router.push({
                        pathname: '/explorar/guarderia/[prestadorId]',
                        params: {
                          prestadorId: g.prestadorId,
                          mascotaId: mascotaId ?? '',
                          prestadorNombre: g.prestadorNombre,
                          /* La modalidad sigue viajando: el lugar tiene que
                             saber qué se está comprando para pedirlo bien. */
                          modalidad,
                          ...(modalidad === 'paquete' ? { tamano: String(tamano) } : {}),
                        },
                      })
                    }
                  />
                  );
                })
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
