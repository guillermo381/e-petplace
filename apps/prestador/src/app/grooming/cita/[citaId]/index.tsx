// ─────────────────────────────────────────────────────────────────────
// EL ANTES del grooming — /grooming/cita/[citaId] (S60-B1, §8 del
// modelo). Dosis baja (§15b: acento de oficio, CTA en tinta).
//
// TESIS: en 30 segundos sabes a quién recibes y con qué talla y
// pelaje trabajas — jamás la HC completa.
// FIRMA: la corrección de talla con consecuencia visible (P19 hecho
// gesto — el perfil queda corregido para las próximas y esta cita no
// cambia de precio; comportamiento, no color).
//
// 7.5: la URL rinde la verdad — al montar se consulta el estado real
// (obtenerGroomingPorCita) y se redirige: en_curso → durante,
// terminada/cerrada → cierre. La cita se resuelve contra la lista del
// día (misma limitación F1 declarada del paseo).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Insignia,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  iniciarAtencionGrooming,
  obtenerCitaGroomingPorId,
  obtenerFichaAntesGrooming,
  obtenerGroomingPorCita,
  registrarDiscrepanciaTallaGrooming,
  resolverUrlFoto,
  type CitaGroomingDetalle,
  type FichaAntesGrooming,
} from '@epetplace/api';

import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { SeccionDireccion } from '@/components/seccion-direccion';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'no_existe' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; cita: CitaGroomingDetalle; ficha: FichaAntesGrooming | null };

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

const TALLAS = ['S', 'M', 'L'] as const;
type Talla = (typeof TALLAS)[number];

export default function AntesGrooming() {
  const { theme } = useTheme();
  const router = useRouter();
  const { mostrar } = useAviso();
  const { t, idioma } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();

  const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
    confirmada: { estado: 'info', etiqueta: t('agenda.estadoConfirmada') },
    completada: { estado: 'alDia', etiqueta: t('agenda.estadoCompletada') },
    no_show: { estado: 'atencion', etiqueta: t('agenda.estadoNoShow') },
  };

  const VOZ_TALLA: Record<Talla, string> = {
    S: t('tallerGrooming.tallaS'),
    M: t('tallerGrooming.tallaM'),
    L: t('tallerGrooming.tallaL'),
  };

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  const [iniciando, setIniciando] = useState(false);
  const iniciandoRef = useRef(false);
  // Hoja de discrepancia de talla (§2)
  const [hojaTalla, setHojaTalla] = useState(false);
  const [tallaObservada, setTallaObservada] = useState<Talla | null>(null);
  const [corrigiendo, setCorrigiendo] = useState(false);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setPantalla({ estado: 'cargando' });
      const sesion = await verificarSesion();
      if (!sesion.ok) {
        setPantalla({ estado: 'error', mensaje: sesion.mensaje });
        return;
      }

      // 1. La verdad del estado (7.5): redirect si la atención ya avanzó.
      const g = await obtenerGroomingPorCita(citaId);
      if (!g.ok) {
        if (g.codigo === 'cita_no_encontrada') setPantalla({ estado: 'no_existe' });
        else setPantalla({ estado: 'error', mensaje: g.mensaje });
        return;
      }
      if (g.data.grooming_id !== null) {
        if (g.data.estado === 'en_curso') {
          router.replace({ pathname: '/grooming/cita/[citaId]/durante', params: { citaId } });
          return;
        }
        if (g.data.estado === 'terminada' || g.data.estado === 'cerrada_con_calidad') {
          router.replace({ pathname: '/grooming/cita/[citaId]/cierre', params: { citaId } });
          return;
        }
      }

      // 2. sin_iniciar: la cita POR SU ID (cura S60-C2.1 — la lista del
      // día dejaba fuera toda cita de otro día, y la SEMANA del HOY las
      // hace tapeables; la RLS es el guard, verdad firme intacta).
      const rCita = await obtenerCitaGroomingPorId(citaId);
      if (!rCita.ok) {
        if (rCita.codigo === 'cita_no_encontrada') setPantalla({ estado: 'no_existe' });
        else setPantalla({ estado: 'error', mensaje: rCita.mensaje });
        return;
      }
      const cita = rCita.data;
      // La ficha de 30 segundos — si la lectura del perfil falla, la cita
      // igual se muestra (la ficha degrada, jamás bloquea el trabajo).
      let ficha: FichaAntesGrooming | null = null;
      if (cita.mascota) {
        const f = await obtenerFichaAntesGrooming(cita.mascota.id);
        if (f.ok) ficha = f.data;
      }
      if (cita.mascota?.foto_url) {
        const url = await resolverUrlFoto(cita.mascota.foto_url);
        setFotoFirmada(url ?? undefined);
      } else {
        setFotoFirmada(undefined);
      }
      setPantalla({ estado: 'listo', cita, ficha });
    },
    [citaId, router],
  );

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  async function iniciar() {
    if (iniciandoRef.current) return;
    iniciandoRef.current = true;
    setIniciando(true);
    const r = await iniciarAtencionGrooming(citaId);
    if (!r.ok) {
      if (r.codigo === 'atencion_grooming_ya_existe_para_cita') {
        // Otra vía la inició: 7.5 — la URL rinde la verdad.
        router.replace({ pathname: '/grooming/cita/[citaId]/durante', params: { citaId } });
        return;
      }
      mostrar({ variante: 'error', texto: r.mensaje });
      setIniciando(false);
      iniciandoRef.current = false;
      return;
    }
    router.replace({ pathname: '/grooming/cita/[citaId]/durante', params: { citaId } });
  }

  async function corregirTalla() {
    if (tallaObservada === null || corrigiendo) return;
    setCorrigiendo(true);
    const r = await registrarDiscrepanciaTallaGrooming({
      cita_id: citaId,
      talla_observada: tallaObservada,
    });
    setCorrigiendo(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setHojaTalla(false);
    setTallaObservada(null);
    mostrar({ variante: 'exito', texto: t('citaGrooming.tallaCorregida') });
    void cargar(true);
  }

  const cita = pantalla.estado === 'listo' ? pantalla.cita : null;
  const ficha = pantalla.estado === 'listo' ? pantalla.ficha : null;
  const nombre = cita?.mascota?.nombre ?? t('agenda.mascotaFallback');
  const insignia = cita?.estado ? INSIGNIA_POR_ESTADO[cita.estado] : undefined;
  const hora = cita?.hora ? cita.hora.slice(0, 5) : '—';
  const dur = cita?.duracion_minutos;
  // La cita de otro día se PREPARA (la ficha es el "Antes" de la
  // semana, §13 Zona 2) pero no se EMPIEZA: el CTA vive solo el día de
  // la cita — sin este guard, iniciar hoy la sesión de mañana abriría
  // el devengo anticipado al cerrarla (el gate temporal del motor es
  // pedido a la A, declarado S60-C2.1).
  const esDeHoy = cita?.fecha === hoyLocal();
  const conCta = cita?.estado === 'confirmada' && esDeHoy;

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;
  const vozPrimaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.base,
    lineHeight: typography.size.base * 1.4,
    color: theme.text.primary,
  } as const;

  // Las señales REALES del expediente — misma voz y mismo trato que el
  // detalle de mascota (Ley 17.3); sin ninguna, la voz honesta única.
  const senales: string[] = [];
  if (ficha?.tiene_emergencia_activa) senales.push(t('detalleMascota.emergenciaActiva'));
  if (ficha?.tiene_condicion_cronica) senales.push(t('detalleMascota.condicionCronica'));
  if (ficha?.tiene_alergias) senales.push(t('detalleMascota.alergias'));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}>
        <Encabezado
          variante="navegacion"
          titulo={cita ? t('citaGrooming.tituloDe', { nombre }) : t('citaGrooming.titulo')}
          atras
          onAtras={() => router.back()}
        />

        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] }}>
                <Esqueleto forma="circulo" alto={96} />
                <Esqueleto forma="linea" ancho="40%" />
              </View>
              <Esqueleto forma="bloque" alto={120} />
              <Esqueleto forma="bloque" alto={48} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'no_existe' && (
          <EstadoVacio
            titulo={t('citaGrooming.noDisponible')}
            descripcion={t('citaGrooming.noDisponibleDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('citaGrooming.volverHoy')} onPress={() => router.back()} />}
          />
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text style={{ ...vozPrimaria, color: theme.status.dangerText }}>{pantalla.mensaje}</Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {cita && (
          <>
            {/* La mascota preside — quién llega y a qué hora */}
            <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] }}>
              <AvatarMascota
                nombre={nombre}
                fotoUrl={fotoFirmada}
                especie={cita.mascota && esEspecie(cita.mascota.especie) ? cita.mascota.especie : undefined}
                tamano="lg"
              />
              <View style={{ alignItems: 'center', gap: spacing[1] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.light,
                    fontSize: typography.size.xl,
                    color: theme.text.primary,
                  }}
                >
                  {nombre}
                </Text>
                <Text
                  style={{
                    fontFamily: typography.family.mono.regular,
                    fontSize: typography.size.sm,
                    letterSpacing: typography.tracking.mono,
                    color: theme.text.secondary,
                  }}
                >
                  {`${
                    esDeHoy || cita.fecha === null
                      ? ''
                      : `${fechaDiaSemanaHumana(cita.fecha, idioma as IdiomaSoportado)} · `
                  }${hora}${dur ? ` · ${dur} min` : ''} · ${cita.tipo.nombre.toLowerCase()}`}
                </Text>
                {insignia && <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" />}
              </View>
            </View>

            {/* La ficha de 30 segundos — talla, pelaje y señales del oficio */}
            <Tarjeta relleno="amplio">
              <View style={{ gap: spacing[3] }}>
                <View style={{ flexDirection: 'row', gap: spacing[6] }}>
                  <View style={{ gap: spacing[1] }}>
                    <Text style={vozSecundaria}>{t('citaGrooming.talla')}</Text>
                    <Text style={vozPrimaria}>
                      {ficha?.talla ? VOZ_TALLA[ficha.talla] : t('citaGrooming.tallaSinDeclarar')}
                    </Text>
                  </View>
                  <View style={{ gap: spacing[1] }}>
                    <Text style={vozSecundaria}>{t('citaGrooming.pelaje')}</Text>
                    <Text style={vozPrimaria}>
                      {ficha?.pelaje
                        ? ficha.pelaje === 'largo'
                          ? t('citaGrooming.pelajeLargo')
                          : t('citaGrooming.pelajeNormal')
                        : t('citaGrooming.tallaSinDeclarar')}
                    </Text>
                  </View>
                </View>
                {senales.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] }}>
                    {senales.map((s) => (
                      <Insignia key={s} estado="atencion" etiqueta={s} tamaño="sm" />
                    ))}
                  </View>
                ) : (
                  <Text style={vozSecundaria}>{t('detalleMascota.sinSenales')}</Text>
                )}
                {conCta && ficha?.talla != null && (
                  <View style={{ alignSelf: 'flex-start' }}>
                    <Boton
                      variante="ghost"
                      tamaño="sm"
                      etiqueta={t('citaGrooming.tallaCorregir')}
                      onPress={() => setHojaTalla(true)}
                    />
                  </View>
                )}
              </View>
            </Tarjeta>

            {/* A DÓNDE IR (S61-B6, D-392): SOLO con modalidad 'domicilio'
                — el snapshot congelado por el motor, espejo exacto del
                paseo (sección compartida, mapa del sistema incluido).
                'local' y el legacy 'presencial' no pintan nada. */}
            {cita.modalidad === 'domicilio' && <SeccionDireccion direccion={cita.direccion} />}

            {/* El "Antes" a un tap — la vista prestador del expediente */}
            {cita.mascota != null && (
              <Tarjeta relleno="ninguno">
                <CeldaNavegacion
                  icono="carnet"
                  registro="aa"
                  titulo={t('agenda.conocerMascota', { nombre })}
                  onPress={() => {
                    const mascota = cita.mascota;
                    if (mascota) {
                      router.push({ pathname: '/mascota/[mascotaId]', params: { mascotaId: mascota.id } });
                    }
                  }}
                />
              </Tarjeta>
            )}

            {conCta && (
              <Boton
                variante="primario"
                etiqueta={t('citaGrooming.empezar')}
                cargando={iniciando}
                onPress={() => void iniciar()}
              />
            )}
            {cita.estado === 'confirmada' && !esDeHoy && (
              <Text style={{ ...vozSecundaria, textAlign: 'center' }}>
                {t('citaGrooming.empiezaElDia')}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Discrepancia de talla (§2): registrar + perfil corregido — esta
          cita NO se recotiza (el snapshot manda). */}
      <Hoja
        visible={hojaTalla}
        onCerrar={() => {
          setHojaTalla(false);
          setTallaObservada(null);
        }}
        titulo={t('citaGrooming.tallaCorregirTitulo')}
      >
        <View style={{ gap: spacing[4] }}>
          <Text style={vozPrimaria}>{t('citaGrooming.tallaCorregirExplicacion')}</Text>
          <SelectorOpcion
            etiqueta={t('citaGrooming.talla')}
            opciones={TALLAS.filter((v) => v !== ficha?.talla).map((v) => ({
              codigo: v,
              etiqueta: VOZ_TALLA[v],
            }))}
            seleccionada={tallaObservada ?? undefined}
            onSelect={(codigo) => {
              if (codigo === 'S' || codigo === 'M' || codigo === 'L') setTallaObservada(codigo);
            }}
          />
          <Boton
            variante="primario"
            etiqueta={t('citaGrooming.tallaCorregirCta')}
            deshabilitado={tallaObservada === null}
            cargando={corrigiendo}
            onPress={() => void corregirTalla()}
          />
        </View>
      </Hoja>
    </View>
  );
}
