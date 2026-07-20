// ─────────────────────────────────────────────────────────────────────
// FIJAR FECHA — coordinar un procedimiento con presupuesto APROBADO
// (/veterinaria/coordinar/[citaId], S70). D-439: la aprobación agenda una
// cita FIRME con precio congelado y SIN fecha; acá la clínica le pone
// cuándo, a qué hora y con quién. Se llega desde "Por coordinar" del HOY.
// Dosis baja (§15b): un solo acento de oficio en los selectores; el CTA
// primario ancla al tealDark vía el raíz cta="oficio" (Ley 21).
//
// TESIS: el procedimiento aprobado ya es firme y el precio no se toca —
// acá solo se decide cuándo, y en tres toques queda coordinado.
// FIRMA (prestador, comportamiento): los tres selectores colapsan en el
// único acto confirmable — el CTA recién despierta cuando día, hora y
// persona están elegidos; nada más pide atención (Ley 15, dosis baja).
// CHANEL: sin resumen redundante de lo elegido bajo el botón — los chips
// seleccionados YA lo dicen; el botón confirma, no repite.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  SelectorOpcion,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
  type SelectorOpcionItem,
} from '@epetplace/ui';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';
import {
  fijarFechaProcedimiento,
  obtenerEmpleadosCuenta,
  obtenerMiCuentaComercial,
  type EmpleadoCuenta,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; empleados: EmpleadoCuenta[] };

const DOS = (n: number) => String(n).padStart(2, '0');

/** ISO local de hoy — jamás toISOString (corre el día en UTC-5, D-312). */
function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${DOS(d.getMonth() + 1)}-${DOS(d.getDate())}`;
}

export default function FijarFecha() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { citaId = '', mascotaNombre = '', servicioNombre = '', total = '' } =
    useLocalSearchParams<{
      citaId: string;
      mascotaNombre: string;
      servicioNombre: string;
      total: string;
    }>();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [dia, setDia] = useState<string | undefined>(undefined);
  const [hora, setHora] = useState<string | undefined>(undefined);
  const [persona, setPersona] = useState<string | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);

  // Próximos 14 días desde HOY, en hora LOCAL (etiqueta con día de semana).
  const opcionesDia = useMemo<SelectorOpcionItem[]>(() => {
    const hoy = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      const iso = isoLocal(d);
      return { codigo: iso, etiqueta: fechaDiaSemanaHumana(iso, idioma as IdiomaSoportado) };
    });
  }, [idioma]);

  // 08:00 → 18:00 a los :00 y :30 (18:00 incluido, 18:30 no).
  // S71 (hallazgo founder en gate): LA PUERTA NO OFRECE LO QUE VA A
  // RECHAZAR — con el día = HOY, las horas ya pasadas no se muestran
  // (el server las rebotaba con "debe ser futura": correcto pero tarde).
  const opcionesHora = useMemo<SelectorOpcionItem[]>(() => {
    const horas: SelectorOpcionItem[] = [];
    for (let h = 8; h <= 18; h++) {
      horas.push({ codigo: `${DOS(h)}:00`, etiqueta: `${DOS(h)}:00` });
      if (h < 18) horas.push({ codigo: `${DOS(h)}:30`, etiqueta: `${DOS(h)}:30` });
    }
    const ahora = new Date();
    if (dia === isoLocal(ahora)) {
      const cursor = `${DOS(ahora.getHours())}:${DOS(ahora.getMinutes())}`;
      return horas.filter((o) => o.codigo > cursor);
    }
    return horas;
  }, [dia]);

  // Si el cambio de día dejó la hora elegida fuera de la oferta (eligió
  // 15:00 para mañana y volvió a hoy a las 16:00), la selección se limpia
  // — jamás viaja al server una hora que la grilla ya no muestra.
  const horaVigente = hora !== undefined && opcionesHora.some((o) => o.codigo === hora);
  const horaElegida = horaVigente ? hora : undefined;

  const cargar = useCallback(async () => {
    setEstado({ fase: 'cargando' });
    const cta = await obtenerMiCuentaComercial();
    if (!cta.ok || cta.data === null) {
      setEstado({ fase: 'error' });
      return;
    }
    const emp = await obtenerEmpleadosCuenta(cta.data.id);
    if (!emp.ok) {
      setEstado({ fase: 'error' });
      return;
    }
    const activos = emp.data.filter((e) => e.activo === true);
    setEstado({ fase: 'listo', empleados: activos });
    // Una sola persona → se preselecciona (y se muestra igual).
    if (activos.length === 1) setPersona(activos[0].empleadoId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function confirmar() {
    if (dia === undefined || horaElegida === undefined || persona === undefined || enviando) return;
    setEnviando(true);
    const r = await fijarFechaProcedimiento({ citaId, fecha: dia, hora: horaElegida, empleadoId: persona });
    setEnviando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    mostrar({ variante: 'exito', texto: t('coordinar.exito', { mascota: mascotaNombre }) });
    router.back();
  }

  const puedeConfirmar =
    dia !== undefined && horaElegida !== undefined && persona !== undefined && !enviando;

  const empleados = estado.fase === 'listo' ? estado.empleados : [];
  const opcionesPersona: SelectorOpcionItem[] = empleados.map((e) => ({
    codigo: e.empleadoId,
    etiqueta: e.nombre,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('coordinar.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[10],
          gap: spacing[5],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {estado.fase === 'cargando' && (
          <EsqueletoGrupo etiqueta={t('coordinar.titulo')}>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" alto={96} />
              <Esqueleto forma="linea" ancho="40%" />
              <Esqueleto forma="bloque" alto={56} />
              <Esqueleto forma="bloque" alto={120} />
            </View>
          </EsqueletoGrupo>
        )}

        {estado.fase === 'error' && (
          <EstadoVacio
            registro="seccion"
            titulo={t('coordinar.error')}
            descripcion={t('coordinar.errorDetalle')}
          />
        )}

        {estado.fase === 'listo' && (
          <>
            {/* Contexto: la mascota preside; el precio congelado es dato de máquina. */}
            <Tarjeta elevacion="reposo">
              <View style={{ gap: spacing[2] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.light,
                    fontSize: typography.size.xl,
                    color: theme.text.primary,
                  }}
                >
                  {mascotaNombre}
                </Text>
                {servicioNombre.trim().length > 0 && (
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.base,
                      color: theme.text.secondary,
                    }}
                  >
                    {servicioNombre}
                  </Text>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    gap: spacing[2],
                    marginTop: spacing[1],
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('coordinar.contexto')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.mono.medium,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    ${total}
                  </Text>
                </View>
              </View>
            </Tarjeta>

            <SelectorOpcion
              etiqueta={t('coordinar.diaLabel')}
              opciones={opcionesDia}
              seleccionada={dia}
              onSelect={setDia}
              disposicion="tira"
              acento="oficio"
            />

            {opcionesHora.length > 0 ? (
              <SelectorOpcion
                etiqueta={t('coordinar.horaLabel')}
                opciones={opcionesHora}
                seleccionada={horaElegida}
                onSelect={setHora}
                disposicion="grilla"
                acento="oficio"
              />
            ) : (
              // Hoy después de las 18:00: cero final mudo (§6ter) — la voz
              // dice el porqué y el camino es elegir otro día arriba.
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.sm,
                  color: theme.text.secondary,
                }}
              >
                {t('coordinar.hoySinHoras')}
              </Text>
            )}

            <SelectorOpcion
              etiqueta={t('coordinar.personaLabel')}
              opciones={opcionesPersona}
              seleccionada={persona}
              onSelect={setPersona}
              disposicion={opcionesPersona.length <= 4 ? 'fila' : 'grilla'}
              acento="oficio"
            />

            <Boton
              variante="primario"
              bloque
              etiqueta={t('coordinar.confirmar')}
              cargando={enviando}
              deshabilitado={!puedeConfirmar}
              onPress={() => void confirmar()}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
