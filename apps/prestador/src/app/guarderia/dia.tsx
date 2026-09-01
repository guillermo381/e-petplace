/**
 * LA GUARDERÍA · TU DÍA (S107-C, tanda 8).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«A la mañana veo la lista de hoy: seis animales, con su
 * franja y quién falta.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 ES UNA VISTA, NO UNA «JORNADA» ───────────────────────────────────
 * Un día con seis animales son **seis estadías**. Esta pantalla **compone
 * leyendo**; no hay un objeto «jornada» que pedir ni que mutar — lo dice el
 * contrato de A y lo dice el wrapper en su cabecera.
 *
 * ── 🔴 SOLO VERDAD FIRME, Y ES LO QUE MÁS IMPORTA ACÁ ───────────────────
 * `obtenerEstadiasDelDia` **no trae holds sin pagar**, y esta pantalla no los
 * pide por otro lado. *Una lista que incluyera reservas que pueden evaporarse
 * en quince minutos haría salir al cuidador a buscar un animal que nadie
 * compró.* Es la misma ley que la agenda del prestador desde S51.
 *
 * ── LA DIRECCIÓN ES LA DEL PASEO, LA MISMA PIEZA ────────────────────────
 * Viene del **snapshot congelado al reservar** (D-339) y se pinta con
 * `SeccionDireccion`, la que ya usa la cita de paseo. *No se construye una
 * segunda forma de mostrar dónde hay que ir.*
 * ⚠️ El wrapper la entrega como `unknown` a propósito (es un jsonb), así que
 * **acá se estrecha con un guard de forma** — jamás con un `as`.
 *
 * ── LO QUE ESTA PANTALLA NO HACE, Y NO ES RECORTE ───────────────────────
 * 🔴 **No marca nada** —ni «a bordo», ni «entregado»—: medido, **los cuatro
 * wrappers de acción no existen** y las transiciones son **eventos server**
 * que llegan con el acta (⑤). *Un botón que no mueve el estado sería la
 * pantalla mintiendo sobre lo que puede hacer.*
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  caraDeMascota,
  obtenerEstadiasDelDia,
  obtenerMiPrestador,
  resolverUrlsFotos,
  type EstadiaDelDia,
  type EstadoEstadia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useGateGestor } from '@/lib/gate-gestor';
import { GateAjeno } from '@/components/gate-ajeno';
import { GateRoto } from '@/components/gate-roto';
import { SeccionDireccion } from '@/components/seccion-direccion';

/** Fecha LOCAL. 🔴 `toISOString()` da UTC y en Guayaquil, pasadas las 19:00,
 *  devuelve el día siguiente — la jornada saldría vacía a la tarde. */
function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * El snapshot llega como `unknown`. Se estrecha **mirando la forma**, no
 * afirmándola: si no tiene una dirección legible, es `null` honesto y la pieza
 * lo declara (L-124). *Un `as` acá produciría un objeto vacío con forma de
 * dirección, y el cuidador saldría a buscar a una casa en blanco.*
 */
function comoDireccion(d: unknown): {
  direccion: string; ciudad: string | null; sector: string | null;
  referencias: string | null; lat: number | null; lon: number | null;
} | null {
  if (typeof d !== 'object' || d === null) return null;
  const r = d as Record<string, unknown>;
  if (typeof r.direccion !== 'string' || r.direccion.length === 0) return null;
  const s = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : null);
  const n = (k: string) => (typeof r[k] === 'number' ? (r[k] as number) : null);
  return {
    direccion: r.direccion,
    ciudad: s('ciudad'),
    sector: s('sector'),
    referencias: s('referencias'),
    lat: n('lat'),
    lon: n('lon'),
  };
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'roto' }
  | { fase: 'listo'; estadias: EstadiaDelDia[]; caras: Map<string, string> };

export default function DiaGuarderia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { gate, reintentarGate } = useGateGestor();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (gate !== 'permitido') return;
    let vigente = true;
    setEstado({ fase: 'cargando' });
    void (async () => {
      const p = await obtenerMiPrestador();
      if (!vigente) return;
      if (!p.ok || p.data === null) {
        setEstado({ fase: 'roto' });
        return;
      }
      const r = await obtenerEstadiasDelDia(p.data.id, hoyLocal());
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «hoy no tenés animales» (Ley 13): el
         cuidador se quedaría en su casa creyendo que no hay jornada. */
      if (!r.ok) {
        setEstado({ fase: 'roto' });
        return;
      }
      const paths = r.data.map((e) => e.mascotaFotoUrl).filter((x): x is string => typeof x === 'string' && x.length > 0);
      const caras = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
      if (!vigente) return;
      setEstado({ fase: 'listo', estadias: r.data, caras });
    })();
    return () => {
      vigente = false;
    };
  }, [gate, intento]);

  const vozEstado = (e: EstadoEstadia): string =>
    t(`diaGuarderia.estado_${e}` as 'diaGuarderia.estado_reservada');

  /**
   * El estado de la estadía → la familia de `Insignia`. **No es decoración:**
   * `atencion` está reservado a lo que el cuidador tiene que MIRAR —el día que
   * no se pudo recoger y el cancelado—, y todo lo demás es curso normal. *Si
   * todo gritara, nada gritaría.*
   */
  const familiaDe = (e: EstadoEstadia): 'alDia' | 'atencion' | 'proximo' | 'info' => {
    if (e === 'entregada') return 'alDia';
    if (e === 'no_recogida' || e === 'cancelada') return 'atencion';
    if (e === 'reservada') return 'proximo';
    return 'info';
  };

  /* La especie llega como `string` del motor y el avatar la quiere de su
     vocabulario. Se estrecha mirando el valor: si no es una de las dos, el
     avatar cae a su fallback en vez de recibir algo que no entiende. */
  const especieDe = (x: string): 'perro' | 'gato' | undefined =>
    x === 'perro' || x === 'gato' ? x : undefined;

  const alAtras = useCallback(() => router.back(), [router]);

  if (gate === 'verificando' || estado.fase === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('diaGuarderia.titulo')} atras onAtras={alAtras} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={88} />
            <Esqueleto alto={88} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }
  if (gate === 'denegado') return <GateAjeno />;
  if (gate === 'roto') return <GateRoto onReintentar={reintentarGate} />;
  if (estado.fase === 'roto') return <GateRoto onReintentar={() => setIntento((n) => n + 1)} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('diaGuarderia.titulo')} atras onAtras={alAtras} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {estado.estadias.length === 0 ? (
          /* Vacío DIGNO: un día sin animales no es un negocio muerto. */
          <EstadoVacio
            registro="seccion"
            titulo={t('diaGuarderia.vacioTitulo')}
            descripcion={t('diaGuarderia.vacioDetalle')}
          />
        ) : (
          <>
            <Texto variante="titulo">
              {t('diaGuarderia.cuantos', { n: estado.estadias.length })}
            </Texto>

            {estado.estadias.map((e) => {
              const dir = comoDireccion(e.direccion);
              const foto = e.mascotaFotoUrl === null ? null : (estado.caras.get(e.mascotaFotoUrl) ?? null);
              /* ⭐ S109-D · LA CARA SALE DE LA ESCALERA DE LA CASA, no de la
                 pieza. Acá se pasaba `fotoUrl` crudo y sin foto salía LA
                 HUELLA — con 111 caras sembradas a dos carpetas de distancia.

                 🔴 Y leyendo el JSX parecía correcto: la llamada pasaba
                 `especie`, así que se veía cableado. **`AvatarMascota` declara
                 en su contrato que `especie` «hoy no cambia el render»** (está
                 reservada al set ilustrado de `D-288`). *Una prop que se acepta
                 y se ignora se lee como cableado, y el único que sabe que no
                 hace nada es el archivo del componente.*

                 ⚠️ `razaSlug: null` A PROPÓSITO: `EstadiaDelDia` no proyecta la
                 raza, y `resolverUrlRaza` exige el slug de `cat_razas` — jamás
                 uno derivado del texto tipeado, porque *una URL que acierta a
                 veces muestra una cara equivocada, que es peor que ninguna*.
                 Con esto se llega al peldaño ② (el genérico de su especie). El
                 ① llega cuando el lector traiga `raza_ruta_imagen`. */
              const cara = caraDeMascota({
                especie: e.mascotaEspecie,
                razaSlug: null,
                fotoUri: foto,
              });
              return (
                <Tarjeta key={e.estadiaId} relleno="normal" elevacion="reposo">
                  <View style={{ gap: spacing[3] }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                      <AvatarMascota
                        nombre={e.mascotaNombre}
                        especie={especieDe(e.mascotaEspecie)}
                        fotoUrl={cara ?? undefined}
                        tamano="md"
                      />
                      <View style={{ flex: 1, gap: spacing[1] }}>
                        <Texto variante="cuerpo">{e.mascotaNombre}</Texto>
                        {/* El espacio sólo si el motor lo asignó: `null` no se
                            pinta como «sin sala», se calla. */}
                        {e.espacioNombre !== null ? (
                          <Texto variante="apoyo">{e.espacioNombre}</Texto>
                        ) : null}
                      </View>
                      <Insignia estado={familiaDe(e.estado)} etiqueta={vozEstado(e.estado)} />
                    </View>

                    {/* Dónde hay que ir a buscarlo — la MISMA pieza del paseo.
                        Con snapshot ausente o ilegible, `null` y la pieza lo
                        declara: nadie sale a buscar a una casa en blanco. */}
                    <SeccionDireccion direccion={dir} />
                  </View>
                </Tarjeta>
              );
            })}

            {/* 🔴 LO QUE FALTA SE DICE ACÁ, no se descubre buscando el botón.

                ⚠️ S109-D · SU CONDICIÓN DE MUERTE, y va escrita porque un texto
                honesto sin fecha de vencimiento es cómo nace una lápida vencida
                (`L-395`): esta tarjeta MUERE cuando exista **un escritor de
                `guarderia_estadias.estado` con puerta** y esta pantalla lo
                llame. Hoy no existe, y no es una impresión: medido contra la
                base desplegada (31-ago-2026) —
                  · las 95 estadías vivas están **todas en `reservada`**, con
                    `a_bordo_en`, `llegada_en` y `entregada_en` en CERO;
                  · el CHECK declara **siete** estados y **seis son
                    inalcanzables**: ninguna función escribe la transición. Los
                    únicos escritores de la tabla son `abrir_tramo_guarderia`
                    —que sólo ata `tramo_recogida_id`/`tramo_devolucion_id`— y
                    `mover_sujeto_por_reverso`, que cancela por plata devuelta.
                  · `levantar_acta_guarderia` y `confirmar_acta_guarderia`
                    existen y **sólo LEEN** la estadía.
                *Un vocabulario de estados completo en un CHECK se lee como una
                máquina que funciona; acá son seis palabras que nadie escribe.*

                ⚠️ EL APOYO YA NO EXPLICA LA MECÁNICA, Y ES FIRMA DEL FOUNDER:
                decía «eso llega con el acta» — *una frase sobre nuestro plan de
                obra, no sobre su trabajo* — **y encima envejecía antes que el
                título**: el acta YA llegó al motor (las dos RPC vivas, con
                wrapper y con superficie del lado de la FAMILIA); lo único que
                falta es su puerta del lado del prestador. ⇒ *dos frases con dos
                fechas de vencimiento distintas, y el apoyo era el que se pudría
                primero.* Ahora dice **qué SÍ se puede** —«saber a quién pasar a
                buscar y dónde»—, que es lo que la pantalla de arriba realmente
                hace: *un mensaje que sólo dice qué no se puede se lee como un
                final, con una lista útil justo encima.* */}
            <Tarjeta relleno="normal" elevacion="reposo">
              <View style={{ gap: spacing[2] }}>
                <Texto variante="cuerpo">{t('diaGuarderia.marcarPendiente')}</Texto>
                <Texto variante="apoyo">{t('diaGuarderia.marcarPendienteApoyo')}</Texto>
              </View>
            </Tarjeta>
          </>
        )}
      </ScrollView>
    </View>
  );
}
