// ─────────────────────────────────────────────────────────────────────
// EL DETALLE DE UNA CITA DE VETERINARIA — /veterinaria/cita/[citaId]
// (S69-B, M0). El destino del tap de la jornada: la cita vet que aparece
// en el HOY (mostrador o reserva) es TAPEABLE y aterriza acá.
//
// TESIS: esta atención dice quién, qué y cuándo — y su expediente a un tap.
// FIRMA: la composición que preside (la mascota) + el salto al expediente
//   (comportamiento, patrón de la Zona 1 del HOY — no color).
// CHANEL: sin "próximamente" que grite — el Durante clínico llega en V4
//   y su ausencia no se decora; la pantalla solo dice la verdad de la cita.
//
// READ-ONLY por diseño: el motor de la atención clínica (el Durante con
// procedencia, el registro por puerta única) es la tanda V4. Acá vive lo
// mínimo para que la jornada tenga destino. Dosis baja (§15b: acento de
// oficio, sin gradiente). La RLS (cita_select_prestador) es el guard.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Insignia,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useTheme,
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  obtenerCitaVetPorId,
  obtenerContactoReservaCita,
  obtenerMiCuentaComercial,
  obtenerPresupuestosPrestador,
  resolverUrlFoto,
  type CitaAgendaPaseo,
  type ContactoReservaCita,
  type EstadoPresupuesto,
  type PresupuestoPrestador,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { vozCitaVet } from '@/lib/voz-cita-vet';
import { useTraduccion } from '@/i18n';
import { vozErrorVet } from '@/lib/voz-error-vet';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'no_existe' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; cita: CitaAgendaPaseo; fotoUrl?: string };

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

export default function DetalleCitaVet() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const { t, idioma } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  // Cura de gate: los presupuestos de esta mascota — la relectura de B3.
  const [presupuestos, setPresupuestos] = useState<PresupuestoPrestador[]>([]);
  // S74-B recepción v1 (decisión de mesa): el CONTACTO es propiedad de
  // la VISITA — nombre + teléfono de QUIEN RESERVÓ (lector angosto de A,
  // gate empleado_tiene_rol con recepción incluida). E4 generalizada: su
  // error se DICE — jamás se pinta como visita-sin-contacto.
  const [contacto, setContacto] = useState<ContactoReservaCita | 'cargando' | 'error'>('cargando');

  // Estado de la cita → Insignia (misma voz que el HOY — Ley 17.3).
  const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
    en_curso: { estado: 'info', etiqueta: t('agenda.enCurso') },
    confirmada: { estado: 'info', etiqueta: t('agenda.estadoConfirmada') },
    completada: { estado: 'alDia', etiqueta: t('agenda.estadoCompletada') },
    no_show: { estado: 'atencion', etiqueta: t('agenda.estadoNoShow') },
  };

  // Estado del presupuesto → Insignia (vencido perezoso ya resuelto en el shape).
  const INSIGNIA_PRESUPUESTO: Record<EstadoPresupuesto, { estado: InsigniaEstado; etiqueta: string }> = {
    borrador: { estado: 'info', etiqueta: t('presupuesto.estadoBorrador') },
    enviado: { estado: 'proximo', etiqueta: t('presupuesto.estadoEnviado') },
    aprobado: { estado: 'alDia', etiqueta: t('presupuesto.estadoAprobado') },
    rechazado: { estado: 'atencion', etiqueta: t('presupuesto.estadoRechazado') },
    vencido: { estado: 'atencion', etiqueta: t('presupuesto.estadoVencido') },
  };

  const cargar = useCallback(async () => {
    setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const r = await obtenerCitaVetPorId(citaId);
    if (!r.ok) {
      setPantalla(r.codigo === 'cita_no_encontrada' ? { estado: 'no_existe' } : { estado: 'error', mensaje: vozErrorVet(t, 'citaVet', r) });
      return;
    }
    const fotoUrl = r.data.mascota?.foto_url ? await resolverUrlFoto(r.data.mascota.foto_url) : undefined;
    setPantalla({ estado: 'listo', cita: r.data, fotoUrl: fotoUrl ?? undefined });
    // el contacto de la visita — su fallo NO tumba el detalle (Ley 13),
    // pero se dice en su bloque (E4: error ≠ ausencia).
    setContacto('cargando');
    void obtenerContactoReservaCita(citaId).then((c) => {
      setContacto(c.ok ? c.data : 'error');
    });
    // Los presupuestos de esta mascota (relectura de B3). Azúcar de vista:
    // su error NO tumba el detalle (Ley 13 — el detalle tiene su camino).
    const mascota = r.data.mascota;
    if (mascota) {
      const cta = await obtenerMiCuentaComercial();
      if (cta.ok && cta.data) {
        const ps = await obtenerPresupuestosPrestador(cta.data.id, { mascotaId: mascota.id });
        if (ps.ok) setPresupuestos(ps.data);
      }
    }
  }, [citaId]);

  // Refetch en focus (patrón del HOY): al volver, la verdad se re-lee.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const cita = pantalla.estado === 'listo' ? pantalla.cita : null;
  const nombre = cita?.mascota?.nombre ?? t('agenda.mascotaFallback');
  const hora = cita?.hora ? cita.hora.slice(0, 5) : '—';
  const dur = cita?.duracion_minutos;
  const ef = cita ? (cita.atencion?.estado ?? cita.estado) : null;
  const insignia = ef ? INSIGNIA_POR_ESTADO[ef] : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('citaVet.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}>
        {pantalla.estado === 'cargando' && (
          <Tarjeta elevacion="plana">
            <EsqueletoGrupo>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Esqueleto forma="circulo" alto={56} />
                <View style={{ flex: 1, gap: spacing[2] }}>
                  <Esqueleto forma="linea" ancho="60%" />
                  <Esqueleto forma="linea" ancho="40%" />
                </View>
              </View>
            </EsqueletoGrupo>
          </Tarjeta>
        )}

        {pantalla.estado === 'no_existe' && (
          <EstadoVacio registro="pantalla" titulo={t('citaVet.noExiste')} />
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.status.dangerText,
                }}
              >
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {pantalla.estado === 'listo' && cita && (
          <>
            {/* La mascota preside: cara + nombre + estado. */}
            <Tarjeta elevacion="reposo">
              <View style={{ gap: spacing[4] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                  <AvatarMascota
                    nombre={nombre}
                    fotoUrl={pantalla.fotoUrl}
                    especie={cita.mascota && esEspecie(cita.mascota.especie) ? cita.mascota.especie : undefined}
                    tamano="lg"
                  />
                  <View style={{ flex: 1, gap: spacing[1] }}>
                    <Texto variante="titulo">
                      {nombre}
                    </Texto>
                    {insignia && (
                      <View style={{ alignSelf: 'flex-start' }}>
                        <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" />
                      </View>
                    )}
                  </View>
                  <Icono nombre="veterinaria" registro="aa" tamano={24} />
                </View>

                <Separador />

                {/* Servicio + cuándo — voz de máquina para la metadata. */}
                <View style={{ gap: spacing[3] }}>
                  {/* S72-B pieza 3: la MISMA voz que la celda de agenda —
                      un procedimiento coordinado dice su descripción, no el
                      genérico. Una superficie que contradice a la otra en el
                      mismo dato es peor que el genérico. */}
                  <Dato etiqueta={t('citaVet.servicio')} valor={vozCitaVet(cita.descripcionPresupuesto, cita.tipo.nombre, t)} />
                  <Dato
                    etiqueta={t('citaVet.cuando')}
                    valor={`${fechaDiaSemanaHumana(cita.fecha ?? '', idioma as IdiomaSoportado)} · ${hora}${dur ? ` · ${dur} min` : ''}`}
                    mono
                  />
                </View>
              </View>
            </Tarjeta>

            {/* ── S74-B · LA VISITA (recepción v1, decisión de mesa): quién
                reservó + su teléfono — propiedad de la CITA, no del animal
                (cero dependencia de D-485). Walk-in del mostrador: nulls
                honestos → el hueco SE DICE (la persona está enfrente). ── */}
            <Tarjeta elevacion="reposo">
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('citaVet.visitaTitulo')}</Texto>
                {contacto === 'cargando' ? (
                  <EsqueletoGrupo>
                    <Esqueleto forma="linea" ancho="50%" />
                  </EsqueletoGrupo>
                ) : contacto === 'error' ? (
                  // E4 GENERALIZADA: el error del lector JAMÁS se pinta
                  // como visita-sin-contacto.
                  <Texto variante="apoyo">{t('citaVet.visitaError')}</Texto>
                ) : contacto.nombre === null && contacto.telefono === null ? (
                  // walk-in sin cita de reserva: fila de nulls del motor —
                  // la persona está enfrente, el dato no existe. Ni error,
                  // ni blanco (pase de mesa S74, caso 3).
                  <Texto variante="apoyo">{t('citaVet.visitaSinContacto')}</Texto>
                ) : (
                  <View style={{ gap: spacing[3] }}>
                    {contacto.nombre !== null ? (
                      <Dato etiqueta={t('citaVet.visitaReservo')} valor={contacto.nombre} />
                    ) : null}
                    {contacto.telefono !== null ? (
                      <Dato
                        etiqueta={t('citaVet.visitaTelefono')}
                        valor={`${contacto.telefonoCodigoPais !== null ? `+${contacto.telefonoCodigoPais} ` : ''}${contacto.telefono}`}
                      />
                    ) : (
                      // null honesto CON VOZ (pase de mesa S74, caso 2 — hay
                      // caso real en la data viva): SE DICE que falta, jamás
                      // "sin teléfono registrado" vestido de dato.
                      <Texto variante="apoyo">{t('citaVet.visitaSinTelefono')}</Texto>
                    )}
                  </View>
                )}
              </View>
            </Tarjeta>

            {/* S70-B2-v2: LA CONSULTA (el Durante clínico) — la acción central
                de la cita vet: dictado → nota estructurada → sedimento. */}
            {cita.mascota && (
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <CeldaNavegacion
                  icono="veterinaria"
                  registro="aa"
                  titulo={t('consulta.iniciarCta')}
                  detalle={t('consulta.iniciarDetalle')}
                  onPress={() =>
                    router.push({
                      pathname: '/veterinaria/consulta/[citaId]',
                      params: { citaId: cita.id, mascotaId: cita.mascota!.id, mascotaNombre: cita.mascota!.nombre },
                    })
                  }
                />
              </Tarjeta>
            )}

            {/* El expediente a un tap (patrón Zona 1 del HOY, Ley 19.1). */}
            {cita.mascota && (
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <CeldaNavegacion
                  icono="carnet"
                  registro="aa"
                  titulo={t('agenda.conocerMascota', { nombre })}
                  onPress={() =>
                    router.push({ pathname: '/mascota/[mascotaId]', params: { mascotaId: cita.mascota!.id } })
                  }
                />
              </Tarjeta>
            )}

            {/* B3 (S69-B) → S70-B1: armar un presupuesto es una acción de
                PRIMERA CLASE de esta pantalla (§15b, Ley 19.1) — celda de
                navegación con glifo y jerarquía, hermana de "conocer a la
                mascota", no un botón suelto. La cita viaja como origen (FK).
                Glifo `pagos` provisional: el set b′ aún no tiene un ícono
                propio de presupuesto (follow-up: gate founder por ícono). */}
            {cita.mascota && (
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <CeldaNavegacion
                  icono="pagos"
                  registro="aa"
                  titulo={t('presupuesto.crear')}
                  detalle={t('presupuesto.crearDetalle')}
                  onPress={() =>
                    router.push({
                      pathname: '/veterinaria/presupuesto/nuevo',
                      params: { mascotaId: cita.mascota!.id, citaId: cita.id },
                    })
                  }
                />
              </Tarjeta>
            )}

            {/* Cura de gate: la RELECTURA de los presupuestos armados —
                "¿qué pasó con lo que armé?". Estado por fila + total; sin
                destino v1 (el detalle rico es refinamiento). */}
            {presupuestos.length > 0 && (
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">
                  {t('presupuesto.listaTitulo', { nombre })}
                </Texto>
                <Tarjeta elevacion="reposo" relleno="ninguno">
                  {presupuestos.map((p, i) => {
                    const ins = INSIGNIA_PRESUPUESTO[p.estado];
                    return (
                      <View key={p.id}>
                        {i > 0 && <Separador />}
                        <Celda
                          titulo={`$${p.total.toFixed(2)}`}
                          subtitulo={p.items.map((it) => it.nombre).filter(Boolean).join(' · ') || undefined}
                          fin={<Insignia estado={ins.estado} etiqueta={ins.etiqueta} tamaño="sm" />}
                        />
                      </View>
                    );
                  })}
                </Tarjeta>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Una fila etiqueta/valor — composición local con la casa (no hay
// componente de "campo de solo lectura"; Celda es para listas tapeables).
function Dato({ etiqueta, valor, mono = false }: { etiqueta: string; valor: string; mono?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing[0.5] }}>
      <Texto variante="apoyo">
        {etiqueta}
      </Texto>
      <Text
        style={{
          fontFamily: mono ? typography.family.mono.regular : typography.family.sans.regular,
          fontSize: typography.size.base,
          color: theme.text.primary,
        }}
      >
        {valor}
      </Text>
    </View>
  );
}
