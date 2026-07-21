// ─────────────────────────────────────────────────────────────────────
// EL DURANTE CLÍNICO — la consulta del vet (/veterinaria/consulta/[citaId]).
// Cuatro fases sobre la constelación de la nota clínica (S70): el Antes de
// 30 segundos (perfil vigente + casos + presupuestos), el DICTADO libre (la
// voz del vet — el mic es el del teclado del SO), la CONFIRMACIÓN campo por
// campo (el vet corrige antes de sedimentar — el corazón), y el Después
// (lo que quedó + la próxima consulta SUGERIDA, jamás una cita).
//
// TESIS: la consulta se dicta hablando y se confirma campo por campo — la
// clínica escribe la historia sin teclear una planilla.
// FIRMA: el dictado libre se vuelve una nota estructurada que el vet SOLO
// revisa (comportamiento — la EsperaDeMarca y el borrador que llega con la
// voz del propio vet). Dosis baja: densa, sin ceremonia.
// CHANEL: se quitó el "cerrar sin nota" (la consulta ES la nota); los
// vitales NO medidos no se pintan (checklist de excepciones, no formulario);
// el próximo control NO es campo editable — es una sugerencia del Después.
//
// Reglas: la captura de fotos JAMÁS es obligatoria in-line (canon vet). La
// regla del teclado §15b: lo que se ELIGE (el modo del caso) usa selector;
// el texto libre (motivo, diagnóstico, dictado, medicación) usa Campo. UNA
// acción primaria por fase (Boton primario = teal por cta="oficio" del raíz).
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  EsperaDeMarca,
  EstadoVacio,
  Esqueleto,
  Icono,
  Insignia,
  SelectorOpcion,
  SelectorSegmentado,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  estructurarNotaClinica,
  obtenerCasosActivosMascota,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerPerfilMascota,
  obtenerPresupuestosPrestador,
  obtenerTitularId,
  sedimentarNotaClinica,
  type CasoActivo,
  type CasoRef,
  type EstadoPresupuesto,
  type ItemFormula,
  type NotaConfirmada,
  type NotaEstructurada,
  type PerfilMascota,
  type PresupuestoPrestador,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

// FormulaConfirmada/VitalesConfirmados no se re-exportan del index — se
// derivan del contrato exportado NotaConfirmada (una sola verdad de shape).
type FormulaConfirmada = NonNullable<NotaConfirmada['formula']>[number];
type VitalesConfirmados = NonNullable<NotaConfirmada['vitales']>;

type Fase = 'antes' | 'dictado' | 'confirmacion' | 'despues';
type ModoCaso = 'nuevo' | 'activo' | 'ninguno';

// Med editable en la fase de confirmación (la pantalla es dueña de la lista).
type MedLocal = {
  key: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracionDias: string;
  via: string;
  indicaciones: string;
  presentacion: string | null;
  cantidad: number | null;
};

let SEQ = 0;
function nuevaKey(): string {
  SEQ += 1;
  return `med-${SEQ}`;
}

function medDesdeItem(it: ItemFormula): MedLocal {
  return {
    key: nuevaKey(),
    nombre: it.nombre,
    dosis: it.dosis ?? '',
    frecuencia: it.frecuencia ?? '',
    duracionDias: it.duracionDias !== null ? String(it.duracionDias) : '',
    via: it.via ?? '',
    indicaciones: it.indicaciones ?? '',
    presentacion: it.presentacion,
    cantidad: it.cantidad,
  };
}

// Vitales SOLO medidos: el orden y el mapeo camelCase → snake del jsonb.
const VITALES_META = [
  { key: 'pesoKg', snake: 'peso_kg', labelKey: 'consulta.vitalPeso' },
  { key: 'temperaturaC', snake: 'temperatura_c', labelKey: 'consulta.vitalTemp' },
  { key: 'frecuenciaCardiaca', snake: 'frecuencia_cardiaca', labelKey: 'consulta.vitalFc' },
  { key: 'frecuenciaRespiratoria', snake: 'frecuencia_respiratoria', labelKey: 'consulta.vitalFr' },
  { key: 'condicionCorporal', snake: 'condicion_corporal', labelKey: 'consulta.vitalCc' },
] as const;

// Estado de presupuesto → familia de Insignia (reusa el patrón del lector).
const ESTADO_A_INSIGNIA: Record<EstadoPresupuesto, 'alDia' | 'atencion' | 'proximo' | 'info'> = {
  aprobado: 'alDia',
  enviado: 'proximo',
  borrador: 'info',
  rechazado: 'atencion',
  vencido: 'atencion',
};

function limpio(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export default function ConsultaVeterinaria() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { citaId = '', mascotaId = '', mascotaNombre = '' } = useLocalSearchParams<{
    citaId?: string;
    mascotaId?: string;
    mascotaNombre?: string;
  }>();

  const cargadoRef = useRef(false);

  // Contexto (cargado una vez en focus).
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [cuentaId, setCuentaId] = useState<string | null>(null);
  const [empleadoId, setEmpleadoId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('EC');
  const [perfil, setPerfil] = useState<PerfilMascota | null>(null);
  const [casos, setCasos] = useState<CasoActivo[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoPrestador[]>([]);

  // Máquina de fases.
  const [fase, setFase] = useState<Fase>('antes');

  // Dictado.
  const [dictado, setDictado] = useState('');
  const [estructurando, setEstructurando] = useState(false);

  // Nota estructurada (el borrador de la IA — fuente de la confirmación).
  const [nota, setNota] = useState<NotaEstructurada | null>(null);

  // Campos editables de la confirmación (arrancan del borrador, nulls VACÍOS).
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [examen, setExamen] = useState('');
  const [planTerapeutico, setPlanTerapeutico] = useState('');
  const [vitales, setVitales] = useState<Partial<Record<keyof NotaEstructurada['vitales'], string>>>({});
  const [meds, setMeds] = useState<MedLocal[]>([]);
  const [planDiagnostico, setPlanDiagnostico] = useState<string[]>([]);
  const [modoCaso, setModoCaso] = useState<ModoCaso>('ninguno');
  const [casoCondicion, setCasoCondicion] = useState('');
  const [casoSel, setCasoSel] = useState<string | undefined>(undefined);
  const [sedimentando, setSedimentando] = useState(false);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    let vigente = true;
    void (async () => {
      const cta = await obtenerMiCuentaComercial();
      if (!vigente) return;
      if (!cta.ok || cta.data === null) {
        setErrorCarga(true);
        setCargando(false);
        return;
      }
      setCuentaId(cta.data.id);
      setCountryCode(cta.data.countryCode);

      const pr = await obtenerMiPrestador();
      if (!vigente) return;
      if (!pr.ok) {
        setErrorCarga(true);
        setCargando(false);
        return;
      }
      const [empId, per, cas, pres] = await Promise.all([
        obtenerTitularId(pr.data.id),
        obtenerPerfilMascota(mascotaId),
        obtenerCasosActivosMascota(mascotaId, cta.data.id),
        obtenerPresupuestosPrestador(cta.data.id, { mascotaId }),
      ]);
      if (!vigente) return;
      // Duros: sin empleado tratante o sin perfil, no hay consulta.
      if (empId === null || !per.ok) {
        setErrorCarga(true);
        setCargando(false);
        return;
      }
      setEmpleadoId(empId);
      setPerfil(per.data);
      // Casos/presupuestos degradan a vacío (no bloquean la consulta).
      setCasos(cas.ok ? cas.data : []);
      setPresupuestos(pres.ok ? pres.data : []);
      setCargando(false);
    })();
    return () => {
      vigente = false;
    };
  }, [mascotaId]);

  const mascota = mascotaNombre || t('consulta.mascotaFallback');
  const money = (n: number) => `$${n.toFixed(2)}`;

  // ── Dictado → estructuración ───────────────────────────────────────────────
  async function estructurar() {
    if (dictado.trim().length === 0 || estructurando) return;
    // El dictado terminó: el teclado baja para que la espera no pelee con él.
    Keyboard.dismiss();
    setEstructurando(true);
    const r = await estructurarNotaClinica({
      texto: dictado,
      especie: perfil?.mascota.especie ?? undefined,
      motivo: undefined,
    });
    setEstructurando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    // Sembrar los editables desde el borrador (null → vacío, jamás relleno falso).
    const n = r.data;
    setNota(n);
    setMotivo(n.motivo ?? '');
    setDiagnostico(n.diagnostico ?? '');
    setAnamnesis(n.anamnesis ?? '');
    setExamen(n.examen ?? '');
    setPlanTerapeutico(n.planTerapeutico ?? '');
    const v: Partial<Record<keyof NotaEstructurada['vitales'], string>> = {};
    for (const meta of VITALES_META) {
      const val = n.vitales[meta.key];
      if (typeof val === 'number') v[meta.key] = String(val);
    }
    setVitales(v);
    setMeds(n.formula.map(medDesdeItem));
    setPlanDiagnostico([...n.planDiagnostico]);
    setModoCaso('ninguno');
    setCasoCondicion('');
    setCasoSel(undefined);
    setFase('confirmacion');
  }

  // ── Edición de medicaciones ────────────────────────────────────────────────
  function editarMed(key: string, campo: keyof MedLocal, valor: string) {
    setMeds((xs) => xs.map((m) => (m.key === key ? { ...m, [campo]: valor } : m)));
  }
  function quitarMed(key: string) {
    setMeds((xs) => xs.filter((m) => m.key !== key));
  }
  function agregarMed() {
    setMeds((xs) => [
      ...xs,
      { key: nuevaKey(), nombre: '', dosis: '', frecuencia: '', duracionDias: '', via: '', indicaciones: '', presentacion: null, cantidad: null },
    ]);
  }

  // ── Edición del plan diagnóstico (exámenes pedidos) ─────────────────────────
  function editarExamen(i: number, valor: string) {
    setPlanDiagnostico((xs) => xs.map((x, idx) => (idx === i ? valor : x)));
  }
  function quitarExamen(i: number) {
    setPlanDiagnostico((xs) => xs.filter((_, idx) => idx !== i));
  }
  function agregarExamen() {
    setPlanDiagnostico((xs) => [...xs, '']);
  }

  // ── Guard del confirmar (espeja los RAISE del RPC en la UI) ─────────────────
  const medIncompleta = meds.some(
    (m) => m.nombre.trim().length === 0 || m.dosis.trim().length === 0 || m.frecuencia.trim().length === 0,
  );
  const casoIncompleto =
    (modoCaso === 'nuevo' && casoCondicion.trim().length === 0) ||
    (modoCaso === 'activo' && casoSel === undefined);
  const puedeConfirmar =
    motivo.trim().length > 0 &&
    diagnostico.trim().length > 0 &&
    !medIncompleta &&
    !casoIncompleto &&
    cuentaId !== null &&
    empleadoId !== null &&
    !sedimentando;

  function construirCaso(): CasoRef {
    if (modoCaso === 'nuevo') return { modo: 'nuevo', condicion: casoCondicion.trim() };
    if (modoCaso === 'activo' && casoSel !== undefined) return { modo: 'existente', caso_id: casoSel };
    return null;
  }

  async function confirmar() {
    if (!puedeConfirmar || cuentaId === null || empleadoId === null || nota === null) return;
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      mostrar({ variante: 'error', texto: sesion.mensaje });
      return;
    }
    // Vitales confirmados: SOLO los medidos con valor parseable.
    const vitalesConf: VitalesConfirmados = {};
    for (const meta of VITALES_META) {
      const raw = vitales[meta.key];
      if (raw === undefined) continue;
      const num = Number(raw.replace(',', '.'));
      if (Number.isFinite(num)) vitalesConf[meta.snake] = num;
    }
    // Fórmula confirmada: dosis/frecuencia YA no-null (el guard lo garantiza).
    const formula: FormulaConfirmada[] = meds.map((m) => ({
      nombre: m.nombre.trim(),
      presentacion: m.presentacion,
      cantidad: m.cantidad,
      dosis: m.dosis.trim(),
      frecuencia: m.frecuencia.trim(),
      duracion_dias: m.duracionDias.trim().length > 0 ? Number(m.duracionDias.replace(',', '.')) : null,
      via: limpio(m.via),
      indicaciones: limpio(m.indicaciones),
    }));

    const notaConf: NotaConfirmada = {
      motivo: motivo.trim(),
      diagnostico: diagnostico.trim(),
      anamnesis: limpio(anamnesis),
      examen: limpio(examen),
      plan_terapeutico: limpio(planTerapeutico),
      proximo_control: nota.proximoControl,
      vitales: Object.keys(vitalesConf).length > 0 ? vitalesConf : undefined,
      formula: formula.length > 0 ? formula : undefined,
      plan_diagnostico: planDiagnostico.map((x) => x.trim()).filter((x) => x.length > 0),
    };

    setSedimentando(true);
    const r = await sedimentarNotaClinica({
      citaId,
      cuentaComercialId: cuentaId,
      empleadoId,
      mascotaId,
      nota: notaConf,
      caso: construirCaso(),
      countryCode,
    });
    setSedimentando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setFase('despues');
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  // S71-B2 (E1 de la vara): los helpers locales tituloSeccion/ayudaTexto
  // MURIERON — los absorbe Texto (58, congelado) en las cuatro fases.
  // Delta declarado (E4): `apoyo` trae lineHeight explícito (sm × leading
  // normal) que el helper no tenía, y `seccion` regala accessibilityRole
  // "header". Higiene Ley 37, no diseño.

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('consulta.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        {cargando ? (
          <View style={{ gap: spacing[3] }}>
            <Esqueleto forma="bloque" alto={120} />
            <Esqueleto forma="bloque" alto={120} />
          </View>
        ) : errorCarga || perfil === null ? (
          <EstadoVacio registro="seccion" titulo={t('consulta.errorTitulo')} descripcion={t('consulta.errorDetalle')} />
        ) : fase === 'antes' ? (
          <>
            {/* (a) Perfil clínico vigente */}
            <View style={{ gap: spacing[2] }}>
              {/* S71-B2: las tres anclas del Antes (glifo aa 21 + header).
                  El ancla vive solo con contenido que anclar (boceto §5). */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                <Icono nombre="carnet" registro="aa" tamano={21} />
                <Texto variante="seccion">{t('consulta.perfilTitulo', { mascota })}</Texto>
              </View>
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <Celda
                  titulo={t('consulta.perfilEspecie')}
                  metadataMono={[perfil.mascota.especie, perfil.mascota.raza].filter(Boolean).join(' · ') || t('consulta.sinRegistros')}
                />
                <Separador />
                <Celda
                  titulo={t('consulta.perfilPeso')}
                  metadataMono={perfil.peso_clinico_kg !== null ? `${perfil.peso_clinico_kg} kg` : t('consulta.sinRegistros')}
                />
                <Separador />
                <Celda
                  titulo={t('consulta.perfilCronica')}
                  fin={
                    <Insignia
                      estado={perfil.tiene_condicion_cronica ? 'proximo' : 'info'}
                      etiqueta={perfil.tiene_condicion_cronica ? t('consulta.cronicaSi') : t('consulta.cronicaNo')}
                    />
                  }
                />
                {perfil.tiene_emergencia_activa && (
                  <>
                    <Separador />
                    <Celda
                      titulo={t('consulta.perfilEmergencia')}
                      fin={<Insignia estado="atencion" etiqueta={t('consulta.emergenciaActiva')} />}
                    />
                  </>
                )}
              </Tarjeta>
            </View>

            {/* (b) Casos activos */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                {casos.length > 0 && <Icono nombre="caso" registro="aa" tamano={21} />}
                <Texto variante="seccion">{t('consulta.casosTitulo')}</Texto>
              </View>
              {casos.length === 0 ? (
                <Texto variante="apoyo">{t('consulta.casosVacio')}</Texto>
              ) : (
                <Tarjeta elevacion="reposo" relleno="ninguno">
                  {casos.map((c, i) => (
                    <View key={c.casoId}>
                      {i > 0 && <Separador />}
                      <Celda
                        titulo={c.condicion}
                        fin={
                          <Insignia
                            estado={c.esTratante ? 'alDia' : 'info'}
                            etiqueta={c.esTratante ? t('consulta.casoTratante') : t('consulta.casoOtra')}
                          />
                        }
                      />
                    </View>
                  ))}
                </Tarjeta>
              )}
            </View>

            {/* (c) Presupuestos de la mascota */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                {presupuestos.length > 0 && <Icono nombre="presupuesto" registro="aa" tamano={21} />}
                <Texto variante="seccion">{t('consulta.presupuestosTitulo')}</Texto>
              </View>
              {presupuestos.length === 0 ? (
                <Texto variante="apoyo">{t('consulta.presupuestosVacio')}</Texto>
              ) : (
                <Tarjeta elevacion="reposo" relleno="ninguno">
                  {presupuestos.map((p, i) => (
                    <View key={p.id}>
                      {i > 0 && <Separador />}
                      {/* S71-B2 CHANEL: el estado se pintaba DOS VECES en
                          la misma fila (el mismo t() en metadataMono y en
                          la Insignia). Gana la Insignia — dice el estado
                          CON semántica de color (19.4); el mono muere, que
                          además vestía de máquina una palabra humana
                          (Ley 3: 'aprobado' no es voz de máquina). */}
                      <Celda
                        titulo={money(p.total)}
                        fin={<Insignia estado={ESTADO_A_INSIGNIA[p.estado]} etiqueta={t(`consulta.estadoPresupuesto.${p.estado}`)} />}
                      />
                    </View>
                  ))}
                </Tarjeta>
              )}
            </View>

            <Boton variante="primario" bloque etiqueta={t('consulta.iniciar')} onPress={() => setFase('dictado')} />
          </>
        ) : fase === 'dictado' ? (
          <>
            <Texto variante="seccion">{t('consulta.dictadoTitulo', { mascota })}</Texto>
            <Texto variante="apoyo">{t('consulta.dictadoAyuda')}</Texto>
            {/* S73-B ítem 8 (a): la puerta del dictado se abre sola — autofoco
                al entrar a la fase (el teclado del SO sube con su micrófono) y
                el hint del mic VIAJA JUNTO AL CAMPO (slot ayuda de Campo — la
                ayuda de un campo vive con él, no en la cabecera). La decisión
                S70 "el mic es el del teclado" no sobrevivió a su primer
                usuario real sin esta puerta (hallazgo 6 S70 + gate S72). */}
            <Campo
              label={t('consulta.dictadoLabel')}
              placeholder={t('consulta.dictadoPlaceholder')}
              ayuda={t('consulta.dictadoCampoAyuda')}
              autoFocus
              value={dictado}
              onChangeText={setDictado}
              multilinea={8}
              autoCapitalize="sentences"
            />
            {estructurando ? (
              <View style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[6] }}>
                <EsperaDeMarca />
                <Texto variante="apoyo">{t('consulta.estructurando')}</Texto>
              </View>
            ) : (
              <Boton
                variante="primario"
                bloque
                etiqueta={t('consulta.estructurar')}
                deshabilitado={dictado.trim().length === 0}
                onPress={() => void estructurar()}
              />
            )}
          </>
        ) : fase === 'confirmacion' ? (
          <>
            <Texto variante="apoyo">{t('consulta.confirmacionAyuda')}</Texto>

            {/* Requeridos */}
            <Campo
              label={t('consulta.motivoLabel')}
              placeholder={t('consulta.motivoPlaceholder')}
              value={motivo}
              onChangeText={setMotivo}
              multilinea={2}
              error={motivo.trim().length === 0 ? t('consulta.requerido') : undefined}
            />
            <Campo
              label={t('consulta.diagnosticoLabel')}
              placeholder={t('consulta.diagnosticoPlaceholder')}
              value={diagnostico}
              onChangeText={setDiagnostico}
              multilinea={2}
              error={diagnostico.trim().length === 0 ? t('consulta.requerido') : undefined}
            />

            {/* Opcionales narrativos */}
            <Campo label={t('consulta.anamnesisLabel')} placeholder={t('consulta.anamnesisPlaceholder')} value={anamnesis} onChangeText={setAnamnesis} multilinea={3} />
            <Campo label={t('consulta.examenLabel')} placeholder={t('consulta.examenPlaceholder')} value={examen} onChangeText={setExamen} multilinea={3} />
            <Campo label={t('consulta.planLabel')} placeholder={t('consulta.planPlaceholder')} value={planTerapeutico} onChangeText={setPlanTerapeutico} multilinea={3} />

            {/* Vitales — checklist de EXCEPCIONES (solo los medidos) */}
            {VITALES_META.some((m) => vitales[m.key] !== undefined) && (
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">{t('consulta.vitalesTitulo')}</Texto>
                {VITALES_META.filter((m) => vitales[m.key] !== undefined).map((m) => (
                  <Campo
                    key={m.snake}
                    label={t(m.labelKey)}
                    placeholder="0"
                    value={vitales[m.key] ?? ''}
                    onChangeText={(v) => setVitales((prev) => ({ ...prev, [m.key]: v }))}
                    keyboardType="decimal-pad"
                  />
                ))}
              </View>
            )}

            {/* Fórmula — medicaciones editables */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('consulta.formulaTitulo')}</Texto>
              {meds.length === 0 && <Texto variante="apoyo">{t('consulta.formulaVacio')}</Texto>}
              {meds.map((m) => {
                const faltaDosis = m.dosis.trim().length === 0;
                const faltaFrec = m.frecuencia.trim().length === 0;
                return (
                  <Tarjeta key={m.key} elevacion="reposo">
                    <View style={{ gap: spacing[2] }}>
                      <Campo label={t('consulta.medNombre')} placeholder={t('consulta.medNombrePlaceholder')} value={m.nombre} onChangeText={(v) => editarMed(m.key, 'nombre', v)} />
                      <Campo
                        label={t('consulta.medDosis')}
                        placeholder={t('consulta.medDosisPlaceholder')}
                        value={m.dosis}
                        onChangeText={(v) => editarMed(m.key, 'dosis', v)}
                        error={faltaDosis ? t('consulta.requerido') : undefined}
                      />
                      <Campo
                        label={t('consulta.medFrecuencia')}
                        placeholder={t('consulta.medFrecuenciaPlaceholder')}
                        value={m.frecuencia}
                        onChangeText={(v) => editarMed(m.key, 'frecuencia', v)}
                        error={faltaFrec ? t('consulta.requerido') : undefined}
                      />
                      <Campo label={t('consulta.medDuracion')} placeholder={t('consulta.medDuracionPlaceholder')} value={m.duracionDias} onChangeText={(v) => editarMed(m.key, 'duracionDias', v)} keyboardType="number-pad" />
                      <Campo label={t('consulta.medVia')} placeholder={t('consulta.medViaPlaceholder')} value={m.via} onChangeText={(v) => editarMed(m.key, 'via', v)} />
                      <Campo label={t('consulta.medIndicaciones')} placeholder={t('consulta.medIndicacionesPlaceholder')} value={m.indicaciones} onChangeText={(v) => editarMed(m.key, 'indicaciones', v)} multilinea={2} />
                      {/* 19.7: acción DENTRO de fila repetida (una tarjeta por
                          medicamento) — EJECUTA, así que baja a label sin
                          chevron. `compacto` es contorno transparente (la caja
                          vacía del medio); `ghost` es el label. */}
                      <Boton variante="ghost" etiqueta={t('consulta.medQuitar')} onPress={() => quitarMed(m.key)} />
                    </View>
                  </Tarjeta>
                );
              })}
              <Boton variante="compacto" etiqueta={t('consulta.medAgregar')} onPress={agregarMed} />
            </View>

            {/* Plan diagnóstico — exámenes pedidos */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('consulta.examenesTitulo')}</Texto>
              {planDiagnostico.length === 0 && <Texto variante="apoyo">{t('consulta.examenesVacio')}</Texto>}
              {planDiagnostico.map((x, i) => (
                <View key={`ex-${i}`} style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Campo label={t('consulta.examenItemLabel', { n: i + 1 })} placeholder={t('consulta.examenItemPlaceholder')} value={x} onChangeText={(v) => editarExamen(i, v)} />
                  </View>
                  <View style={{ paddingTop: spacing[6] }}>
                    <Boton variante="ghost" tamaño="sm" etiqueta={t('consulta.examenQuitar')} onPress={() => quitarExamen(i)} />
                  </View>
                </View>
              ))}
              <Boton variante="compacto" etiqueta={t('consulta.examenAgregar')} onPress={agregarExamen} />
            </View>

            {/* Caso — nuevo / activo / ninguno */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="seccion">{t('consulta.casoTitulo')}</Texto>
              <SelectorSegmentado
                etiqueta={t('consulta.casoModoLabel')}
                segmentos={
                  casos.length > 0
                    ? [
                        { codigo: 'ninguno', etiqueta: t('consulta.casoNinguno') },
                        { codigo: 'activo', etiqueta: t('consulta.casoActivo') },
                        { codigo: 'nuevo', etiqueta: t('consulta.casoNuevo') },
                      ]
                    : [
                        { codigo: 'ninguno', etiqueta: t('consulta.casoNinguno') },
                        { codigo: 'nuevo', etiqueta: t('consulta.casoNuevo') },
                      ]
                }
                activo={modoCaso}
                onCambio={(c) => setModoCaso(c as ModoCaso)}
              />
              {modoCaso === 'nuevo' && (
                <Campo label={t('consulta.casoCondicionLabel')} placeholder={t('consulta.casoCondicionPlaceholder')} value={casoCondicion} onChangeText={setCasoCondicion} />
              )}
              {modoCaso === 'activo' && casos.length > 0 && (
                <SelectorOpcion
                  etiqueta={t('consulta.casoElegirLabel')}
                  disposicion="grilla"
                  opciones={casos.map((c) => ({ codigo: c.casoId, etiqueta: c.condicion }))}
                  seleccionada={casoSel}
                  onSelect={setCasoSel}
                />
              )}
            </View>

            <Boton
              variante="primario"
              bloque
              etiqueta={t('consulta.confirmar')}
              cargando={sedimentando}
              deshabilitado={!puedeConfirmar}
              onPress={() => void confirmar()}
            />
          </>
        ) : (
          // fase === 'despues'
          <>
            <View style={{ alignItems: 'center', gap: spacing[3], paddingTop: spacing[6] }}>
              <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size.xl, color: theme.text.primary, textAlign: 'center' }}>
                {t('consulta.listo', { mascota })}
              </Text>
            </View>
            {nota?.proximoControl ? (
              <Tarjeta elevacion="reposo">
                <View style={{ gap: spacing[1] }}>
                  <Texto variante="seccion">{t('consulta.proximoTitulo')}</Texto>
                  <Texto variante="apoyo">{t('consulta.proximoDetalle', { control: nota.proximoControl })}</Texto>
                </View>
              </Tarjeta>
            ) : null}
            <Boton variante="primario" bloque etiqueta={t('consulta.cerrar')} onPress={() => router.back()} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
