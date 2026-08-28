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

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
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

/** Fecha LOCAL. 🔴 Jamás `toISOString()`: en Guayaquil, después de las 19:00,
 *  devuelve el día siguiente. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Mascotas =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: Array<{ id: string; nombre: string }> };

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
      setMascotas({ fase: 'listo', lista: elegibles.map((m) => ({ id: m.id, nombre: m.nombre })) });
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

  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + 1 + i);
    return { codigo: iso(d), etiqueta: fechaDiaSemanaHumana(iso(d), idioma) };
  });

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
            {mascotas.lista.length > 1 ? (
              <SelectorOpcion
                etiqueta={t('hubGuarderia.paraQuien')}
                acento="control"
                disposicion="tira"
                opciones={mascotas.lista.map((m) => ({ codigo: m.id, etiqueta: m.nombre }))}
                seleccionada={mascotaId ?? undefined}
                onSelect={setMascotaId}
              />
            ) : null}

            <SelectorOpcion
              etiqueta={t('hubGuarderia.queDia')}
              acento="control"
              disposicion="tira"
              opciones={dias}
              seleccionada={fecha}
              onSelect={setFecha}
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
                <EstadoVacio
                  registro="seccion"
                  titulo={t('hubGuarderia.sinLugaresTitulo')}
                  descripcion={t('hubGuarderia.sinLugaresDetalle')}
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
                    onPress={() => router.push(`/guarderia/${g.prestadorId}`)}
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
