/**
 * CONFIGURACIÓN DEL NEGOCIO DE VENTAS (S96-C · C-B6 · LETRA_RECORRIDO §2).
 *
 * BOCETO M1:
 *  · TESIS: «Completás tu negocio a tu ritmo; e-PetPlace lo revisa y lo
 *    hace visible.» (§2.1 — las dos mitades: escalable Y curado.)
 *  · FIRMA: esta pantalla ES el expediente del vendedor cuando el equipo
 *    lo revisa (§2.1) — no hay formulario de solicitud aparte.
 *  · CHANEL: sin sección de cobertura (no existe lector ni escritor de
 *    cobertura por vendedor en el contrato — un formulario muerto sería
 *    peor que su ausencia; declarado en el reporte) · la LIQUIDACIÓN no
 *    aparece: se difiere al motor de pagos (firma founder) y la nota lo
 *    dice en la vista de facturación.
 *  · ESTADOS: cargando · error · listo (con vacíos honestos por sección).
 *
 *  · Repartidores: alta con nombre y documento (decisión del arranque);
 *    idempotente por documento — repetir no duplica, y se dice.
 *  · Recursos: la capacidad es DEL RECURSO (§7.3) — la voz lo enseña.
 *  · Cortes horarios: parámetro, jamás número en el código (§7.1).
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  Hoja,
  HojaScroll,
  Interruptor,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  actualizarRepartidor,
  cerrarSesion,
  definirRecursoReparto,
  definirTurnoEntrega,
  listarRecursosReparto,
  listarRepartidores,
  listarTurnosEntrega,
  registrarRepartidor,
  type RecursoReparto,
  type Repartidor,
  type TurnoEntrega,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { contextoVentas, type ContextoVentas } from '@/lib/cuenta-ventas';
import { horaDeSql } from '@/lib/ventas-formato';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      contexto: ContextoVentas;
      repartidores: Repartidor[];
      recursos: RecursoReparto[];
      turnos: TurnoEntrega[];
    };

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function ConfiguracionVentas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  // hoja repartidor
  const [altaRepartidor, setAltaRepartidor] = useState(false);
  const [repNombre, setRepNombre] = useState('');
  const [repDocumento, setRepDocumento] = useState('');
  const [repTelefono, setRepTelefono] = useState('');

  // hoja recurso
  const [altaRecurso, setAltaRecurso] = useState(false);
  const [recNombre, setRecNombre] = useState('');
  const [recCapacidad, setRecCapacidad] = useState('');

  // hoja turno
  const [altaTurno, setAltaTurno] = useState(false);
  const [turCodigo, setTurCodigo] = useState('');
  const [turCorte, setTurCorte] = useState('');
  const [turDesde, setTurDesde] = useState('');
  const [turHasta, setTurHasta] = useState('');
  const [turDiaSiguiente, setTurDiaSiguiente] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const ctx = await contextoVentas();
        if (!vigente) return;
        if (!ctx.ok || ctx.data === null) {
          setPantalla({ estado: 'error' });
          return;
        }
        const id = ctx.data.cuentaComercialId;
        const [reps, recursos, turnos] = await Promise.all([
          listarRepartidores(id),
          listarRecursosReparto(id),
          listarTurnosEntrega(id),
        ]);
        if (!vigente) return;
        if (!reps.ok || !recursos.ok || !turnos.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({
          estado: 'listo',
          contexto: ctx.data,
          repartidores: reps.data,
          recursos: recursos.data,
          turnos: turnos.data,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const recargar = () => setIntento((n) => n + 1);

  async function guardarRepartidor() {
    if (guardando || pantalla.estado !== 'listo') return;
    if (repNombre.trim().length === 0 || repDocumento.trim().length === 0) return;
    setGuardando(true);
    const r = await registrarRepartidor({
      cuenta_comercial_id: pantalla.contexto.cuentaComercialId,
      nombre: repNombre.trim(),
      documento: repDocumento.trim(),
      telefono: repTelefono.trim().length > 0 ? repTelefono.trim() : undefined,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({
      texto: r.data.ya_existia
        ? t('ventas.config.repartidorYaExistia')
        : t('ventas.config.repartidorExito'),
      variante: 'exito',
    });
    setAltaRepartidor(false);
    recargar();
  }

  async function alternarRepartidor(rep: Repartidor, encendido: boolean) {
    if (guardando) return;
    setGuardando(true);
    const r = await actualizarRepartidor({ repartidor_id: rep.repartidor_id, activo: encendido });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    recargar();
  }

  async function guardarRecurso() {
    if (guardando || pantalla.estado !== 'listo') return;
    const capacidad = Number(recCapacidad);
    if (recNombre.trim().length === 0 || !Number.isInteger(capacidad) || capacidad <= 0) return;
    setGuardando(true);
    const r = await definirRecursoReparto({
      cuenta_comercial_id: pantalla.contexto.cuentaComercialId,
      nombre: recNombre.trim(),
      capacidad_por_dia: capacidad,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('ventas.config.recursoExito'), variante: 'exito' });
    setAltaRecurso(false);
    recargar();
  }

  async function guardarTurno() {
    if (guardando || pantalla.estado !== 'listo') return;
    if (
      turCodigo.trim().length === 0 ||
      !HORA_RE.test(turCorte) ||
      !HORA_RE.test(turDesde) ||
      !HORA_RE.test(turHasta)
    ) {
      return;
    }
    setGuardando(true);
    const r = await definirTurnoEntrega({
      cuenta_comercial_id: pantalla.contexto.cuentaComercialId,
      codigo: turCodigo.trim(),
      corte: turCorte,
      entrega_desde: turDesde,
      entrega_hasta: turHasta,
      dia_offset: turDiaSiguiente ? 1 : 0,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('ventas.config.turnoExito'), variante: 'exito' });
    setAltaTurno(false);
    recargar();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.config.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="90%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.comunes.errorTitulo')}
            descripcion={t('ventas.comunes.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('ventas.comunes.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  recargar();
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[10],
            gap: spacing[5],
          }}
        >
          <Texto variante="apoyo">{t('ventas.config.detalle')}</Texto>

          {/* facturación — la cuenta comercial que ya existe, sin duplicar */}
          <Tarjeta relleno="ninguno">
            <CeldaNavegacion
              registro="tinta"
              titulo={t('ventas.config.facturacionTitulo')}
              detalle={t('ventas.config.facturacionDetalle')}
              onPress={() => router.push('/cuenta-comercial')}
            />
            <Separador />
            <CeldaNavegacion
              registro="tinta"
              titulo={t('ventas.config.facturacionVistaTitulo')}
              detalle={t('ventas.config.facturacionVistaDetalle')}
              onPress={() => router.push('/ventas/facturacion')}
            />
          </Tarjeta>

          {/* repartidores */}
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('ventas.config.repartidoresTitulo')}</Texto>
            {pantalla.repartidores.length === 0 ? (
              <Texto variante="apoyo">{t('ventas.config.sinRepartidores')}</Texto>
            ) : (
              <Tarjeta relleno="ninguno">
                {pantalla.repartidores.map((rep, i) => (
                  <View key={rep.repartidor_id}>
                    {i > 0 && <Separador />}
                    <Celda
                      titulo={rep.nombre}
                      subtitulo={rep.activo ? undefined : t('ventas.config.repartidorInactivo')}
                      metadataMono={rep.documento}
                      fin={
                        <Interruptor
                          encendido={rep.activo}
                          onCambio={(v) => void alternarRepartidor(rep, v)}
                          etiqueta={t('ventas.config.repartidorActivar')}
                          registro="oficio"
                        />
                      }
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('ventas.config.repartidorNuevoCta')}
              onPress={() => {
                setRepNombre('');
                setRepDocumento('');
                setRepTelefono('');
                setAltaRepartidor(true);
              }}
            />
          </View>

          {/* capacidad por recurso */}
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('ventas.config.recursosTitulo')}</Texto>
            <Texto variante="apoyo">{t('ventas.config.recursosDetalle')}</Texto>
            {pantalla.recursos.length === 0 ? (
              <Texto variante="apoyo">{t('ventas.config.sinRecursos')}</Texto>
            ) : (
              <Tarjeta relleno="ninguno">
                {pantalla.recursos.map((rec, i) => (
                  <View key={rec.recurso_id}>
                    {i > 0 && <Separador />}
                    <Celda
                      titulo={rec.nombre}
                      subtitulo={rec.activo ? undefined : t('ventas.config.repartidorInactivo')}
                      metadataMono={t('ventas.config.capacidadPorDia', { n: rec.capacidad_por_dia })}
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('ventas.config.recursoNuevoCta')}
              onPress={() => {
                setRecNombre('');
                setRecCapacidad('');
                setAltaRecurso(true);
              }}
            />
          </View>

          {/* cortes horarios */}
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{t('ventas.config.turnosTitulo')}</Texto>
            <Texto variante="apoyo">{t('ventas.config.turnosDetalle')}</Texto>
            {pantalla.turnos.length > 0 && (
              <Tarjeta relleno="ninguno">
                {pantalla.turnos.map((tur, i) => (
                  <View key={tur.turno_id}>
                    {i > 0 && <Separador />}
                    <Celda
                      titulo={tur.codigo}
                      subtitulo={tur.dia_offset === 1 ? t('ventas.config.turnoDiaSiguiente') : undefined}
                      metadataMono={`${horaDeSql(tur.corte)} → ${horaDeSql(tur.entrega_desde)}–${horaDeSql(tur.entrega_hasta)}`}
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('ventas.config.turnoNuevoCta')}
              onPress={() => {
                setTurCodigo('');
                setTurCorte('');
                setTurDesde('');
                setTurHasta('');
                setTurDiaSiguiente(false);
                setAltaTurno(true);
              }}
            />
          </View>

          {/* S96-C: para el VENDEDOR PURO (raíz → /ventas, sin tabs) esta
              es su única superficie estable — sin esto no tiene forma de
              cerrar sesión en ningún lado. Al salir, el guard raíz
              re-evalúa y aterriza en la bienvenida; el caché del contexto
              se invalida solo (escucha de auth en cuenta-ventas). */}
          <Boton
            variante="ghost"
            bloque
            cargando={cerrando}
            etiqueta={t('sesion.cerrarSesion')}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void cerrarSesion().then(() => {
                setCerrando(false);
                router.replace('/(tabs)');
              });
            }}
          />
        </ScrollView>
      )}

      {/* ── hoja: repartidor nuevo ── */}
      <Hoja
        visible={altaRepartidor}
        onCerrar={() => {
          if (!guardando) setAltaRepartidor(false);
        }}
        titulo={t('ventas.config.repartidorNuevoCta')}
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <Campo
                label={t('ventas.config.repartidorNombre')}
                value={repNombre}
                onChangeText={setRepNombre}
                deshabilitado={guardando}
              />
              <Campo
                label={t('ventas.config.repartidorDocumento')}
                value={repDocumento}
                onChangeText={setRepDocumento}
                keyboardType="number-pad"
                deshabilitado={guardando}
              />
              <Campo
                label={t('ventas.config.repartidorTelefono')}
                value={repTelefono}
                onChangeText={setRepTelefono}
                keyboardType="phone-pad"
                deshabilitado={guardando}
              />
              <Boton
                variante="primario"
                bloque
                cargando={guardando}
                deshabilitado={repNombre.trim().length === 0 || repDocumento.trim().length === 0}
                etiqueta={t('ventas.config.repartidorGuardarCta')}
                onPress={() => void guardarRepartidor()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>

      {/* ── hoja: recurso nuevo ── */}
      <Hoja
        visible={altaRecurso}
        onCerrar={() => {
          if (!guardando) setAltaRecurso(false);
        }}
        titulo={t('ventas.config.recursoNuevoCta')}
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <Campo
                label={t('ventas.config.recursoNombre')}
                value={recNombre}
                onChangeText={setRecNombre}
                deshabilitado={guardando}
              />
              <Campo
                label={t('ventas.config.recursoCapacidad')}
                value={recCapacidad}
                onChangeText={setRecCapacidad}
                keyboardType="number-pad"
                deshabilitado={guardando}
              />
              <Boton
                variante="primario"
                bloque
                cargando={guardando}
                deshabilitado={recNombre.trim().length === 0 || !(Number(recCapacidad) > 0)}
                etiqueta={t('ventas.config.recursoGuardarCta')}
                onPress={() => void guardarRecurso()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>

      {/* ── hoja: corte nuevo ── */}
      <Hoja
        visible={altaTurno}
        onCerrar={() => {
          if (!guardando) setAltaTurno(false);
        }}
        titulo={t('ventas.config.turnoNuevoCta')}
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <Campo
                label={t('ventas.config.turnoCodigo')}
                value={turCodigo}
                onChangeText={setTurCodigo}
                deshabilitado={guardando}
              />
              <Campo
                label={t('ventas.config.turnoCorte')}
                value={turCorte}
                onChangeText={setTurCorte}
                ayuda="14:00"
                deshabilitado={guardando}
              />
              <Campo
                label={t('ventas.config.turnoDesde')}
                value={turDesde}
                onChangeText={setTurDesde}
                deshabilitado={guardando}
              />
              <Campo
                label={t('ventas.config.turnoHasta')}
                value={turHasta}
                onChangeText={setTurHasta}
                deshabilitado={guardando}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Texto variante="cuerpo">{t('ventas.config.turnoDiaSiguiente')}</Texto>
                <Interruptor
                  encendido={turDiaSiguiente}
                  onCambio={setTurDiaSiguiente}
                  etiqueta={t('ventas.config.turnoDiaSiguiente')}
                  registro="oficio"
                />
              </View>
              <Boton
                variante="primario"
                bloque
                cargando={guardando}
                deshabilitado={
                  turCodigo.trim().length === 0 ||
                  !HORA_RE.test(turCorte) ||
                  !HORA_RE.test(turDesde) ||
                  !HORA_RE.test(turHasta)
                }
                etiqueta={t('ventas.config.turnoGuardarCta')}
                onPress={() => void guardarTurno()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>
    </View>
  );
}
