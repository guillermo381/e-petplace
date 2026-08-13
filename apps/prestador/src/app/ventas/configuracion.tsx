/**
 * LA CONFIGURACIÓN DE LA DESPENSA (S96-C reabierta · MODELO_DESPENSA
 * §8.6bis, firmas del founder 13-ago-2026 · antes: LETRA_RECORRIDO §2).
 *
 * BOCETO M1:
 *  · TESIS: «Completás tu negocio a tu ritmo; e-PetPlace lo revisa y lo
 *    hace visible.» (§2.1 — las dos mitades: escalable Y curado.)
 *  · FIRMA: LOS CUARTOS EN ORDEN FIRMADO — ① qué vendo · ② cómo entrego ·
 *    ③ cobertura · ④ cuándo · ⑤ quién — con el ESTADO (⑥) como chip
 *    chico arriba que abre su explicación.
 *  · CHANEL: lo que vive en otra casa NO se duplica (§8.6bis: catálogo y
 *    precio = puerta de carga · stock = panel · fiscal/bancario = Cuenta
 *    comercial — acá solo punteros) · la LIQUIDACIÓN se difiere al motor
 *    de pagos y la nota vive en la vista de facturación.
 *  · ESTADOS: cargando · error · listo (con vacíos honestos por sección).
 *
 * ⚠️ CUARTOS SIN ESQUEMA — NO SE MONTAN (precedente de esta misma
 * cabecera: un formulario muerto es peor que su ausencia; pedido a A del
 * 13-ago con los contratos exactos, `2026-08-13-s96c-pedido-a-A-…`):
 *  · ① QUÉ VENDO (familias activables — el nombre de las tres lo pone la
 *    carga del catálogo, jamás esta pantalla; guard de la letra: activar
 *    NO publica, filtra lo que el vendedor ve).
 *  · ② CÓMO ENTREGO (envío/retiro/las dos; sin envío no se ven los
 *    campos de reparto).
 *  · ③ COBERTURA por radio (default 15 · máx 50, CHECK en la fuente).
 *  · ④ la mitad "horarios de atención" (los CORTES sí están montados).
 *  · el CONTADOR (ley S91: narrativa más un paso, llega a cero, lo de
 *    e-PetPlace no entra) — sin ①②③ cableados contaría aire.
 *
 * 🔴 CHOQUE DECLARADO (⑤ QUIÉN): la letra manda repartidor como chip del
 * EQUIPO QUE YA EXISTE («un equipo, un lugar»); el alta de abajo es el
 * padrón propio de S96. Se conserva VIVO hasta que la costura
 * repartidor↔equipo de A exista (A-5 del pedido) — matar la única alta
 * funcionando antes de su reemplazo deja al vendedor sin repartidores.
 * El swap es de esta pantalla y está declarado, no diferido en silencio.
 *
 *  · Repartidores: alta con nombre y documento (decisión del arranque);
 *    idempotente por documento — repetir no duplica, y se dice.
 *  · Recursos: la capacidad es DEL RECURSO (§7.3) — la voz lo enseña.
 *  · Cortes horarios: parámetro, jamás número en el código (§7.1).
 *  · Estado (⑥): el mapeo del enum vive en `estadoDespensa()` abajo —
 *    `pendiente_validacion` = «En revisión» (§2.1: el vendedor propone,
 *    e-PetPlace publica). INTERIM del chip: `Insignia estado` todavía no
 *    tiene `onPress` (S85-B24 lo acotó a `distincion` — «una prop sin
 *    consumidor decora»; el consumidor nació acá). Pedido a B en
 *    `2026-08-13-s96c-pedido-a-B-…`; mientras llega, el «¿Qué significa?»
 *    es un Boton sinCaja al lado del chip y muere con el ensanche.
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
  Insignia,
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

/** ⑥ EL ESTADO — mapeo del enum vivo (`estado_cuenta_comercial_enum`:
 *  pendiente_validacion · activa · suspendida · cerrada, medido en
 *  `database.types.ts`) a la voz de la letra («en revisión» → «activa»,
 *  §8.6bis ⑥). Un valor que el enum gane mañana cae al caso que NO afirma
 *  visibilidad que nadie midió: en revisión. Suspendida/cerrada no se
 *  disfrazan de revisión — cada una dice su verdad (Ley 13). */
function estadoDespensa(estadoCuenta: string): {
  insignia: 'info' | 'alDia' | 'atencion';
  clave: 'enRevision' | 'activa' | 'suspendida' | 'cerrada';
} {
  switch (estadoCuenta) {
    case 'activa':
      return { insignia: 'alDia', clave: 'activa' };
    case 'suspendida':
      return { insignia: 'atencion', clave: 'suspendida' };
    case 'cerrada':
      return { insignia: 'atencion', clave: 'cerrada' };
    default:
      return { insignia: 'info', clave: 'enRevision' };
  }
}

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

  // ⑥ la explicación del estado (el modal que el chip abre)
  const [modalEstado, setModalEstado] = useState(false);

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

  /* ⑥ — las claves van LITERALES, jamás armadas por concatenación: el
     diccionario tipado rompe con una key inexistente y un template lo
     apagaría con un cast (misma regla que el techo del HOY). */
  const estadoCfg =
    pantalla.estado === 'listo' ? estadoDespensa(pantalla.contexto.estadoCuenta) : null;
  const etiquetaEstado =
    estadoCfg === null
      ? ''
      : estadoCfg.clave === 'activa'
        ? t('ventas.config.estado.activa')
        : estadoCfg.clave === 'suspendida'
          ? t('ventas.config.estado.suspendida')
          : estadoCfg.clave === 'cerrada'
            ? t('ventas.config.estado.cerrada')
            : t('ventas.config.estado.enRevision');
  const modalEstadoVoz =
    estadoCfg === null
      ? ''
      : estadoCfg.clave === 'activa'
        ? t('ventas.config.estado.modalActiva')
        : estadoCfg.clave === 'suspendida'
          ? t('ventas.config.estado.modalSuspendida')
          : estadoCfg.clave === 'cerrada'
            ? t('ventas.config.estado.modalCerrada')
            : t('ventas.config.estado.modalEnRevision');

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
          {/* ── ⑥ EL ESTADO — el chip chico arriba, abre su explicación ── */}
          {estadoCfg !== null && (
            <View style={{ gap: spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                <Insignia estado={estadoCfg.insignia} etiqueta={etiquetaEstado} tamaño="sm" />
                {/* INTERIM (pedido B-1): cuando `Insignia estado` gane
                    `onPress`, este label muere y el tap vive en el chip. */}
                <Boton
                  variante="sinCaja"
                  etiqueta={t('ventas.config.estado.queSignifica')}
                  onPress={() => setModalEstado(true)}
                />
              </View>
              <Texto variante="apoyo">{t('ventas.config.detalle')}</Texto>
            </View>
          )}

          {/* ── ① QUÉ VENDO · ② CÓMO ENTREGO · ③ COBERTURA — NO SE MONTAN:
              sin lector ni escritor, un formulario muerto es peor que su
              ausencia (cabecera). Los contratos exactos viven en el pedido
              a A del 13-ago; al llegar el esquema entran ACÁ, en este
              orden, antes del ④. */}

          {/* ── ④ CUÁNDO — los cortes horarios (la mitad «horarios de
              atención» espera esquema: pedido A-4) ── */}
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

          {/* ── ⑤ QUIÉN — repartidores (🔴 choque declarado en la cabecera:
              padrón propio hasta la costura repartidor↔equipo de A) ── */}
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

          {/* ── lo que vive en OTRA casa — punteros, jamás duplicación
              (§8.6bis: lo fiscal y bancario ya vive en Cuenta comercial) ── */}
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

      {/* ── ⑥ el modal del estado — qué significa (§8.6bis) ── */}
      <Hoja
        visible={modalEstado}
        onCerrar={() => setModalEstado(false)}
        titulo={t('ventas.config.estado.modalTitulo')}
        altura="media"
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{modalEstadoVoz}</Texto>
        </View>
      </Hoja>

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
