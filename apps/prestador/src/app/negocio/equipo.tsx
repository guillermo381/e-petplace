// ─────────────────────────────────────────────────────────────────────
// TU NEGOCIO — LA FIRMA + EL EQUIPO (/negocio/equipo · S74-B, boceto
// fa83e5d APTO con 7 enmiendas de la vara de A, todas incorporadas).
//
// TESIS: el dueño gobierna quién actúa en su negocio y con qué permiso —
//   y quitar el acceso nunca borra lo que la persona hizo.
// FIRMA (Ley 15): el bloque de identidad del negocio presidiendo — la
//   primera vez que el prestador se VE como negocio en su propia app.
// CHANEL: sin credencial (vive en §14.2), sin acotación de actos (D-463
//   fuera de v1), sin contadores por miembro.
//
// E2 (vara): el slot del LOGO es de packages/ui (territorio A, pedido
//   emitido). HOY NO EXISTE → la firma sale SIN logo DICIENDO el hueco
//   (una línea de voz) — jamás inline, jamás placeholder decorativo.
// E3 (vara): la ruta existe para cualquier empleado (deep link) — la
//   PANTALLA gatea: la fuente del bool es-dueño es la DERIVACIÓN del
//   wrapper (empleado_roles RLS dueño-only: cero filas = no-dueño) y el
//   no-dueño ve la voz digna del solo-lectura (patrón S60), jamás blanco.
// E6 (vara): desvincular va por la policy legacy (user_id) — declarado
//   en el wrapper, NO curado acá.
// E7 (vara): ciudad NULL → el renglón SE OMITE. Jamás "no especificada".
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Insignia,
  Interruptor,
  LogoNegocio,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  asignarRolEmpleado,
  desvincularEmpleado,
  invitarEmpleado,
  obtenerEquipoNegocio,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  quitarRolEmpleado,
  type EquipoNegocio,
  type MiembroEquipo,
  type MiPrestador,
  type RolEquipo,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; prestador: MiPrestador; equipo: EquipoNegocio };

export default function EquipoNegocioPantalla() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [miembro, setMiembro] = useState<MiembroEquipo | null>(null);
  const [confirmaDesvincular, setConfirmaDesvincular] = useState(false);
  const [hojaInvitar, setHojaInvitar] = useState(false);
  const [invNombre, setInvNombre] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [vozError, setVozError] = useState<string | null>(null);

  const [prestadorId, setPrestadorId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const [prestador, cuenta] = await Promise.all([obtenerMiPrestador(), obtenerMiCuentaComercial()]);
    if (!prestador.ok) {
      setPantalla({ estado: 'error', mensaje: t('equipo.errorCarga') });
      return;
    }
    setPrestadorId(prestador.data.id);
    if (!cuenta.ok || cuenta.data === null) {
      // Sin cuenta comercial no hay lector de equipo (el RPC keyea por
      // cuenta). El error dirige (Ley 17.4), jamás se disfraza de
      // equipo-de-1 (Ley 13 — la cláusula E4 generalizada).
      setPantalla({ estado: 'error', mensaje: t('equipo.errorCarga') });
      return;
    }
    const equipo = await obtenerEquipoNegocio(cuenta.data.id);
    if (!equipo.ok) {
      setPantalla({ estado: 'error', mensaje: t('equipo.errorCarga') });
      return;
    }
    setPantalla({ estado: 'listo', prestador: prestador.data, equipo: equipo.data });
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const vozRol = (rol: RolEquipo): string =>
    rol === 'dueño' ? t('equipo.rolDueno') : rol === 'profesional' ? t('equipo.rolProfesional') : t('equipo.rolRecepcion');

  async function toggleRol(m: MiembroEquipo, rol: Exclude<RolEquipo, 'dueño'>, encender: boolean) {
    if (ocupado) return;
    setOcupado(true);
    setVozError(null);
    const r = encender ? await asignarRolEmpleado(m.empleadoId, rol) : await quitarRolEmpleado(m.empleadoId, rol);
    setOcupado(false);
    if (!r.ok) {
      setVozError(t('equipo.errorEscritura'));
      return;
    }
    await cargar();
    // la Hoja sigue abierta sobre el dato fresco
    setMiembro((prev) =>
      prev
        ? {
            ...prev,
            roles: encender ? [...prev.roles, rol] : prev.roles.filter((x) => x !== rol),
          }
        : prev,
    );
  }

  async function desvincular(m: MiembroEquipo) {
    if (ocupado) return;
    setOcupado(true);
    setVozError(null);
    const r = await desvincularEmpleado(m.empleadoId);
    setOcupado(false);
    if (!r.ok) {
      setVozError(t('equipo.errorEscritura'));
      return;
    }
    setConfirmaDesvincular(false);
    setMiembro(null);
    await cargar();
  }

  async function invitar() {
    if (ocupado || prestadorId === null) return;
    setOcupado(true);
    setVozError(null);
    const r = await invitarEmpleado(prestadorId, invEmail.trim(), invNombre.trim());
    setOcupado(false);
    if (!r.ok) {
      setVozError(t('equipo.errorInvitar'));
      return;
    }
    setHojaInvitar(false);
    setInvNombre('');
    setInvEmail('');
    await cargar();
  }

  // E1 (mesa): el aceptado SIN rol PRESIDE — primero en la lista, con su
  // acción dicha al lado (el paso NORMAL del flujo de dos pasos v1).
  const miembros =
    pantalla.estado === 'listo'
      ? [...pantalla.equipo.miembros]
          .filter((m) => m.activo)
          .sort((a, b) => Number(a.roles.length > 0) - Number(b.roles.length > 0))
      : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('equipo.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={88} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
          <EstadoVacio
            registro="pantalla"
            titulo={t('equipo.errorCarga')}
            accion={<Boton variante="secundario" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />}
          />
        )}

        {pantalla.estado === 'listo' && (
          <>
            {/* ── LA FIRMA (MODELO_PRESENCIA §2 pieza 1) — nace COMPUESTA:
                nada se pregunta, todo sale de lo vivo. E7: ciudad null se
                OMITE. E2: LogoNegocio (packages/ui, S74-A) — contenido con
                aire y fondo, jamás recorte; sin foto_url productor todavía,
                el monograma honesto ES la cara (no hueco que gritar). ── */}
            <Tarjeta elevacion="reposo">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <LogoNegocio nombre={pantalla.prestador.nombre_comercial} />
                <View style={{ flex: 1, gap: spacing[1] }}>
                  <Texto variante="titulo">{pantalla.prestador.nombre_comercial}</Texto>
                  {pantalla.prestador.ciudad !== null && pantalla.prestador.ciudad.length > 0 ? (
                    <Texto variante="apoyo">{pantalla.prestador.ciudad}</Texto>
                  ) : null}
                </View>
              </View>
            </Tarjeta>

            {pantalla.equipo.esDueno ? (
              <>
                {/* ── EL EQUIPO ── */}
                <View style={{ gap: spacing[3] }}>
                  <Texto variante="seccion">{t('equipo.seccion')}</Texto>
                  <Tarjeta relleno="ninguno">
                    {miembros.map((m, i) => (
                      <View key={m.empleadoId}>
                        {i > 0 ? <Separador /> : null}
                        <Celda
                          interactiva
                          accessibilityRole="button"
                          onPress={() => {
                            setVozError(null);
                            setConfirmaDesvincular(false);
                            setMiembro(m);
                          }}
                          titulo={m.nombre}
                          subtitulo={
                            m.roles.length === 0
                              ? t('equipo.sinRolAccion')
                              : m.roles.map(vozRol).join(' · ')
                          }
                        />
                      </View>
                    ))}
                  </Tarjeta>
                  {/* equipo de 1: el vacío no existe (el dueño siempre está);
                      la invitación serena vive bajo el CTA (boceto §3) */}
                  {miembros.length <= 1 ? (
                    <Texto variante="apoyo">{t('equipo.equipoDeUno')}</Texto>
                  ) : null}
                </View>

                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('equipo.invitarCta')}
                  onPress={() => {
                    setVozError(null);
                    setHojaInvitar(true);
                  }}
                />
              </>
            ) : (
              // E3: el no-dueño que aterriza por deep link — voz digna del
              // solo-lectura (S60): dice su porqué UNA vez, sin candados.
              <Texto variante="apoyo">{t('equipo.soloDueno')}</Texto>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Hoja: el detalle del miembro — roles por Interruptor (Ley 22:
          tener-o-no un rol es binario) + desvincular (22c). El rol dueño
          JAMÁS es control en v1 (transferir no está en alcance). ── */}
      <Hoja visible={miembro !== null} onCerrar={() => setMiembro(null)} titulo={miembro?.nombre ?? ''}>
        {miembro ? (
          <View style={{ padding: spacing[4], gap: spacing[4] }}>
            {miembro.roles.includes('dueño') ? (
              <View style={{ alignSelf: 'flex-start' }}>
                <Insignia estado="info" etiqueta={t('equipo.rolDueno')} />
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Texto variante="cuerpo">{t('equipo.rolProfesional')}</Texto>
                  <Interruptor
                    encendido={miembro.roles.includes('profesional')}
                    onCambio={(v) => void toggleRol(miembro, 'profesional', v)}
                    registro="oficio"
                    etiqueta={t('equipo.rolProfesional')}
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Texto variante="cuerpo">{t('equipo.rolRecepcion')}</Texto>
                  <Interruptor
                    encendido={miembro.roles.includes('recepcion')}
                    onCambio={(v) => void toggleRol(miembro, 'recepcion', v)}
                    registro="oficio"
                    etiqueta={t('equipo.rolRecepcion')}
                  />
                </View>
                <Texto variante="apoyo">{t('equipo.rolesAyuda')}</Texto>
                <Separador />
                {confirmaDesvincular ? (
                  <View style={{ gap: spacing[3] }}>
                    <Texto variante="cuerpo">{t('equipo.desvincularConfirma', { nombre: miembro.nombre })}</Texto>
                    <Boton
                      variante="destructivo"
                      bloque
                      cargando={ocupado}
                      etiqueta={t('equipo.desvincularCta')}
                      onPress={() => void desvincular(miembro)}
                    />
                  </View>
                ) : (
                  <Boton
                    variante="destructivo"
                    bloque
                    etiqueta={t('equipo.desvincularCta')}
                    onPress={() => setConfirmaDesvincular(true)}
                  />
                )}
              </>
            )}
            {vozError !== null ? <Texto variante="apoyo">{vozError}</Texto> : null}
          </View>
        ) : null}
      </Hoja>

      {/* ── Hoja: invitar (camino v1 SIN rol — E4 de la vara: el CHECK de
          la invitación solo admite 'empleado'; el rol se asigna cuando la
          persona aparece, y E1 la hace presidir). La Hoja cubre el teclado
          (casa (a) del patrón D-498); L-162: gate con teclado arriba. ── */}
      <Hoja visible={hojaInvitar} onCerrar={() => setHojaInvitar(false)} titulo={t('equipo.invitarTitulo')}>
        <View style={{ padding: spacing[4], gap: spacing[4] }}>
          <Campo label={t('equipo.invitarNombre')} value={invNombre} onChangeText={setInvNombre} />
          <Campo
            label={t('equipo.invitarEmail')}
            value={invEmail}
            onChangeText={setInvEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Texto variante="apoyo">{t('equipo.invitarAyuda')}</Texto>
          {vozError !== null ? <Texto variante="apoyo">{vozError}</Texto> : null}
          <Boton
            variante="primario"
            bloque
            cargando={ocupado}
            deshabilitado={invNombre.trim().length === 0 || invEmail.trim().length === 0}
            etiqueta={t('equipo.invitarEnviar')}
            onPress={() => void invitar()}
          />
        </View>
      </Hoja>
    </View>
  );
}
