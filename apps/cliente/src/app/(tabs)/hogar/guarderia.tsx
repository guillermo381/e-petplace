/**
 * EL HUB DE GUARDERÍA — la familia busca un lugar (S107-C, tanda 6).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«Busco guardería cerca.»* Este es el paso que faltaba entre
 * `explorar` y el lugar: **elegís a quién y qué día, y ves quién puede.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 LAS DOS PREGUNTAS SON DISTINTAS, Y SE PINTAN DISTINTO ────────────
 * Acá se lista **quién PUEDE ese día** (`obtenerGuarderiasDisponibles`, que ya
 * excluye a los llenos). En el lugar, el calendario pinta **el día lleno como
 * lleno** (`obtenerCupoGuarderia`). *Un jueves que desaparece del calendario se
 * lee como «el jueves no existe»; un prestador que no puede ese día
 * simplemente no está.* La Ley 23 se aplica distinto a cada una — y el propio
 * wrapper de A lo dice en su cabecera.
 *
 * ── LAS TRES FASES DE LA ELEGIBILIDAD, HONRADAS (L-218 · R34) ───────────
 * `ofrecibles()` devuelve `[]` en TRES situaciones —cargando, error y de
 * verdad no hay— y esta pantalla **no decide con `length === 0`**. Es el
 * defecto que dejó «el paseo es para perros» con dos perros vivos.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FiltroMascotas,
  SelectorDia,
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
import { DiaSinHorarios } from '@/components/reserva-piezas';

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

export default function HubGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const idioma = obtenerIdiomaActual();

  const especies = useEspeciesElegibles('hospedaje');
  const [mascotas, setMascotas] = useState<Mascotas>({ fase: 'cargando' });
  const [mascotaId, setMascotaId] = useState<string | null>(null);
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
      if (elegibles.length === 1) setMascotaId(elegibles[0].id);
    })();
    return () => {
      vigente = false;
    };
  }, [especies.fase, intento]);

  useEffect(() => {
    if (mascotaId === null) {
      setLista({ fase: 'ocioso' });
      return;
    }
    let vigente = true;
    setLista({ fase: 'cargando' });
    void (async () => {
      const r = await obtenerGuarderiasDisponibles({ fecha, mascotaId });
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

  const alAtras = useCallback(() => router.back(), []);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('hubGuarderia.titulo')} atras onAtras={alAtras} />

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
            {mascotas.lista.length > 1 ? (
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
            <Texto variante="seccion">{t('hubGuarderia.queDia')}</Texto>
            <SelectorDia
              dias={dias}
              elegido={fecha}
              cerrados={new Set()}
              etiquetaCerrado={t('hubGuarderia.diaCerrado')}
              onElegir={setFecha}
            />

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
                lista.lugares.map((g) => (
                  <Celda
                    key={g.prestadorId}
                    interactiva
                    accessibilityRole="button"
                    titulo={g.prestadorNombre}
                    /* 🔴 `sobrevendido` NO se pinta: para la familia, un lugar
                       que puede recibirla es un lugar que puede recibirla. La
                       sobreventa es problema operativo del prestador. */
                    subtitulo={g.ciudad ?? undefined}
                    metadataMono={t('hubGuarderia.porDia', { precio: g.precio.toFixed(2) })}
                    /* 🔴 La mascota VIAJA: sin ella el lugar no puede evaluar
                       el gate sanitario, y una pantalla que no puede evaluarlo
                       no puede ofrecer reservar. */
                    onPress={() =>
                      router.push({
                        pathname: '/guarderia/[prestadorId]',
                        params: {
                          prestadorId: g.prestadorId,
                          mascotaId: mascotaId ?? '',
                          prestadorNombre: g.prestadorNombre,
                        },
                      })
                    }
                  />
                ))
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
