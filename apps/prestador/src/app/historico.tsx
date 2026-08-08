// ─────────────────────────────────────────────────────────────────────
// EL HISTÓRICO NAVEGABLE — /historico (S91-B, firma del founder 8-ago-2026)
//
// POR QUÉ NACE, y es un hallazgo de gate del founder: la relectura de la
// receta quedó bien montada y **INALCANZABLE POR NAVEGACIÓN**. Medido:
//   · La ÚNICA entrada a `/veterinaria/cita/[citaId]` es el HOY.
//   · El HOY lee una ventana de `hoy-3 .. hoy+6` (DIAS_ATRAS=3). La cita
//     del 21-jul está 18 días atrás: fuera de la ventana.
//   · El expediente de la mascota SÍ lista el historial de atenciones,
//     pero sus filas son `Celda` SIN `onPress` — informativas puras, y su
//     lector no trae `cita_id` ni el oficio.
//   ⇒ **CERO caminos a una cita de más de 3 días atrás.**
//
// Y el techo era más ancho que mi pieza: el CERTIFICADO de S90-D vive tras
// las mismas dos puertas, así que tampoco se podía volver a una emisión
// vieja. Esta pantalla destapa los dos papeles, no uno.
//
// TESIS: el trabajo que ya hiciste sigue estando, y se llega caminando
//   hacia atrás.
// FIRMA: la CONTINUIDAD — la lista no termina, se sigue pidiendo hacia
//   atrás (comportamiento, no color: dosis baja del prestador).
// CHANEL: **no hay buscador** (letra del founder) — un archivo que exige
//   escribir supone que ya sabés qué buscás. Tampoco hay filtro por oficio
//   ni contadores: la fecha ordena y basta.
//
// ── CERO MOTOR NUEVO, y se relevó antes de escribir (orden del founder) ──
// Los cuatro lectores del HOY toman RANGO y **no clampean a hoy**:
// `.gte('fecha', input.fecha).lte('fecha', input.fecha_hasta ?? input.fecha)`
// — literal de `obtenerCitasVetDelDia`, y sus tres hermanos son el espejo.
// El HOY les pasa una ventana angosta; esta pantalla les pasa una que
// camina hacia atrás. **No se pidió una RPC nueva porque no hacía falta.**
//
// La VERDAD FIRME la siguen poniendo ellos (lista positiva de estados):
// acá no se re-implementa ningún filtro — lo que no es cita firme no
// aparece, igual que en el HOY.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaCita,
  Icono,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
  type AvatarMascotaEspecie,
  type FilaCitaOficio,
} from '@epetplace/ui';
import {
  obtenerCitasAdiestramientoDelDia,
  obtenerCitasGroomingDelDia,
  obtenerCitasPaseoDelDia,
  obtenerCitasVetDelDia,
  obtenerMiPrestador,
  resolverUrlFoto,
  type CitaAgendaPaseo,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

/** El paso del caminar hacia atrás. 30 días es un mes de trabajo: con la
 *  ventana del HOY (3 días) la cita del gate quedaba afuera, y con 30 entra
 *  en el PRIMER tramo — el founder no tiene que tocar «Ver más» para el
 *  discriminador. No es un techo: es el tamaño del paso. */
const PASO_DIAS = 30;

/** Suma días en fecha LOCAL por partes literales — jamás `new Date(iso)`,
 *  que interpreta UTC y corre el día en UTC-5 (la trampa que S55 midió). */
function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const base = new Date(a, m - 1, d);
  base.setDate(base.getDate() + dias);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${base.getFullYear()}-${p(base.getMonth() + 1)}-${p(base.getDate())}`;
}

function hoyLocal(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

type Oficio = FilaCitaOficio;
type CitaConOficio = { cita: CitaAgendaPaseo; oficio: Oficio; fotoUrl?: string };
type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; citas: CitaConOficio[]; desde: string };

function esEspecie(v: string | null | undefined): v is AvatarMascotaEspecie {
  return v !== null && v !== undefined;
}

export default function Historico() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [pidiendoMas, setPidiendoMas] = useState(false);

  const traer = useCallback(
    async (dias: number) => {
      const sesion = await verificarSesion();
      if (!sesion.ok) return null;
      const pr = await obtenerMiPrestador();
      if (!pr.ok) return null;
      const hasta = hoyLocal();
      const desde = sumarDias(hasta, -dias);
      const rango = { prestador_id: pr.data.id, fecha: desde, fecha_hasta: hasta };

      const [paseo, grooming, vet, adiestramiento] = await Promise.all([
        obtenerCitasPaseoDelDia(rango),
        obtenerCitasGroomingDelDia(rango),
        obtenerCitasVetDelDia(rango),
        obtenerCitasAdiestramientoDelDia(rango),
      ]);
      // Si TODOS fallan es un fallo de verdad; si falla uno, se dice con lo
      // que sí llegó antes que mentir con una lista corta — pero el error
      // JAMÁS se pinta como "no hay nada" (Ley 13).
      if (!paseo.ok && !grooming.ok && !vet.ok && !adiestramiento.ok) return null;

      const juntas: CitaConOficio[] = [
        ...(paseo.ok ? paseo.data.map((c) => ({ cita: c, oficio: 'paseo' as const })) : []),
        ...(grooming.ok ? grooming.data.map((c) => ({ cita: c, oficio: 'grooming' as const })) : []),
        ...(vet.ok ? vet.data.map((c) => ({ cita: c, oficio: 'veterinaria' as const })) : []),
        ...(adiestramiento.ok
          ? adiestramiento.data.map((c) => ({ cita: c, oficio: 'adiestramiento' as const }))
          : []),
      ];
      // MÁS RECIENTE PRIMERO: un archivo se lee hacia atrás. Los lectores
      // ordenan ascendente para el HOY; acá se invierte, no se les pide otra
      // cosa.
      juntas.sort((x, y) => {
        const f = (y.cita.fecha ?? '').localeCompare(x.cita.fecha ?? '');
        return f !== 0 ? f : (y.cita.hora ?? '').localeCompare(x.cita.hora ?? '');
      });
      const conFoto = await Promise.all(
        juntas.map(async (j) => ({
          ...j,
          fotoUrl: j.cita.mascota?.foto_url
            ? ((await resolverUrlFoto(j.cita.mascota.foto_url)) ?? undefined)
            : undefined,
        })),
      );
      return { citas: conFoto, desde };
    },
    [],
  );

  const cargar = useCallback(
    (dias: number) => {
      setEstado({ fase: 'cargando' });
      void traer(dias).then((r) => {
        setEstado(r === null ? { fase: 'error' } : { fase: 'listo', citas: r.citas, desde: r.desde });
      });
    },
    [traer],
  );

  useFocusEffect(
    useCallback(() => {
      cargar(PASO_DIAS);
    }, [cargar]),
  );

  const verMas = async () => {
    if (estado.fase !== 'listo' || pidiendoMas) return;
    setPidiendoMas(true);
    const diasActuales = Math.round(
      (new Date(hoyLocal()).getTime() - new Date(estado.desde).getTime()) / 86_400_000,
    );
    const r = await traer(diasActuales + PASO_DIAS);
    setPidiendoMas(false);
    if (r !== null) setEstado({ fase: 'listo', citas: r.citas, desde: r.desde });
  };

  const rutaDe = (j: CitaConOficio) =>
    j.oficio === 'grooming'
      ? ({ pathname: '/grooming/cita/[citaId]', params: { citaId: j.cita.id } } as const)
      : j.oficio === 'adiestramiento'
        ? ({ pathname: '/adiestramiento/cita/[citaId]', params: { citaId: j.cita.id } } as const)
        : j.oficio === 'veterinaria'
          ? ({ pathname: '/veterinaria/cita/[citaId]', params: { citaId: j.cita.id } } as const)
          : ({ pathname: '/cita/[citaId]', params: { citaId: j.cita.id } } as const);

  // Agrupado POR FECHA — el único eje. La cabecera de día es lo que hace
  // que esto sea una lista navegable y no un volcado (Ley 18: la estructura
  // codifica una verdad del contenido, acá el día de trabajo).
  const porFecha =
    estado.fase === 'listo'
      ? estado.citas.reduce<Array<{ fecha: string; items: CitaConOficio[] }>>((acc, j) => {
          const f = j.cita.fecha ?? '';
          const ultimo = acc[acc.length - 1];
          if (ultimo && ultimo.fecha === f) ultimo.items.push(j);
          else acc.push({ fecha: f, items: [j] });
          return acc;
        }, [])
      : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('historico.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[4],
          gap: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="bloque" alto={96} />
            </View>
          </EsqueletoGrupo>
        ) : estado.fase === 'error' ? (
          // Ley 13: el fallo dice que es fallo — jamás "no hay atenciones".
          <EstadoVacio
            registro="seccion"
            titulo={t('historico.errorTitulo')}
            descripcion={t('historico.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('historico.reintentar')}
                onPress={() => cargar(PASO_DIAS)}
              />
            }
          />
        ) : estado.citas.length === 0 ? (
          // El vacío termina en un CAMINO (Ley 17.5): seguir hacia atrás.
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="mes" tamano={48} />}
            titulo={t('historico.vacioTitulo')}
            descripcion={t('historico.vacioDetalle', {
              desde: fechaDiaSemanaHumana(estado.desde, idioma as IdiomaSoportado),
            })}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('historico.verMas', { n: PASO_DIAS })}
                cargando={pidiendoMas}
                onPress={() => void verMas()}
              />
            }
          />
        ) : (
          <>
            {porFecha.map((grupo) => (
              <View key={grupo.fecha} style={{ gap: spacing[2] }}>
                <Texto variante="seccion">
                  {fechaDiaSemanaHumana(grupo.fecha, idioma as IdiomaSoportado)}
                </Texto>
                <Tarjeta relleno="ninguno">
                  {grupo.items.map((j, i) => (
                    <View key={j.cita.id}>
                      {i > 0 ? <Separador /> : null}
                      <FilaCita
                        oficio={j.oficio}
                        titulo={j.cita.mascota?.nombre ?? t('agenda.mascotaFallback')}
                        subtitulo={j.cita.tipo?.nombre ?? undefined}
                        metadataMono={j.cita.hora ? j.cita.hora.slice(0, 5) : undefined}
                        mascota={{
                          nombre: j.cita.mascota?.nombre ?? t('agenda.mascotaFallback'),
                          fotoUrl: j.fotoUrl,
                          especie: esEspecie(j.cita.mascota?.especie)
                            ? j.cita.mascota.especie
                            : undefined,
                        }}
                        direccion="derecha"
                        fin={<Icono nombre={j.oficio === 'adiestramiento' ? 'training' : j.oficio} registro="aa" tamano={21} />}
                        onPress={() => router.push(rutaDe(j))}
                      />
                    </View>
                  ))}
                </Tarjeta>
              </View>
            ))}
            {/* El paso hacia atrás. Es la FIRMA de la pantalla: el archivo no
                se termina, se sigue pidiendo. Dice DESDE CUÁNDO se está
                mirando para que nadie confunda "no hay más" con "no pedí
                más" — que es exactamente el error que trajo acá. */}
            {/* NO es `PieRevelar`: la 19.6 lo acota a revelar el resto de una
                sección con su NÚMERO conocido, y dice explícitamente que
                **no aplica a paginación**. Acá no se sabe cuántas citas hay
                más atrás — se pide otro tramo. El patrón de la casa para eso
                es el secundario de "Cargar más" (S60, el hub del paseo). */}
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('historico.verMas', { n: PASO_DIAS })}
              cargando={pidiendoMas}
              onPress={() => void verMas()}
            />
            <Texto variante="dato" color="tertiary">
              {t('historico.desde', {
                fecha: fechaDiaSemanaHumana(estado.desde, idioma as IdiomaSoportado),
              })}
            </Texto>
          </>
        )}
      </ScrollView>
    </View>
  );
}
