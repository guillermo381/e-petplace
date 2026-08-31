/**
 * LA HOJA DEL PLAN (S56-A, D-338 — MODELO_PASEO v1.2 §6.1): nace en el
 * QUIÉN con el paseador ELEGIDO (alcance v1: un solo paseador; el
 * reparto por día es el peldaño siguiente, declarado en el doc).
 *
 * 7 chips L·M·X·J·V·S·D (día del CUÁNDO preseleccionado, multi) +
 * frecuencia de un toque + auto-renovación DECLARADA en superficie
 * (aviso 72 h + pausa de un toque, sin countdowns). Los días que ESE
 * paseador no cubre se muestran APAGADOS con voz honesta — la
 * disponibilidad se lee de la agenda REAL (obtenerSlotsDisponibles por
 * día, cupo incluido), jamás se asume.
 *
 * La plata: el server cobra y dice el total (contratar_plan_paseo,
 * atómico). Acá solo se muestra el precio por salida y un total
 * ESTIMADO declarado como estimado — el número que manda es el del
 * server (la pantalla de éxito lo dice).
 *
 * ESCALERA (§4b): no muestra datos del expediente (configuración pura)
 * — lo dice explícito.
 */

import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Boton,
  HojaScroll,
  Interruptor,
  SelectorOpcion,
  Separador,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  contratarPlanPaseo,
  obtenerSlotsDisponibles,
  type PaseadorDisponible,
  type PlanContratado,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';

type Frecuencia = 'semanal' | 'quincenal' | 'mensual';

/** Próxima fecha (>= desde) cuyo getDay() = dow, en fecha LOCAL (patrón S55: jamás toISOString post-19:00). */
function proximaFechaDeDia(dow: number, desde: Date): string {
  const d = new Date(desde);
  d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7));
  return new Intl.DateTimeFormat('en-CA').format(d);
}

/** Espejo del cálculo server (_fechas_periodo_plan) para el ESTIMADO — el server manda. */
function estimarSalidas(dias: number[], frecuencia: Frecuencia): number {
  if (dias.length === 0) return 0;
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  let inicio: Date | null = null;
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(manana);
    d.setDate(manana.getDate() + i);
    if (dias.includes(d.getDay())) {
      inicio = d;
      break;
    }
  }
  if (inicio === null) return 0;
  const fin = new Date(inicio);
  fin.setMonth(fin.getMonth() + 1);
  let n = 0;
  const vistos = new Set<number>();
  for (let d = new Date(inicio); d < fin; d.setDate(d.getDate() + 1)) {
    if (!dias.includes(d.getDay())) continue;
    const semana = Math.floor((d.getTime() - inicio.getTime()) / (7 * 24 * 3600 * 1000));
    if (frecuencia === 'semanal') n += 1;
    else if (frecuencia === 'quincenal' && semana % 2 === 0) n += 1;
    else if (frecuencia === 'mensual' && !vistos.has(d.getDay())) {
      vistos.add(d.getDay());
      n += 1;
    }
  }
  return n;
}

export function PlanHoja({
  paseador,
  mascotaId,
  fecha,
  hora,
  onIrAPagar,
}: {
  paseador: PaseadorDisponible;
  mascotaId: string;
  /** El día elegido en el CUÁNDO — su día de semana llega preseleccionado. */
  fecha: string;
  hora: string;
  /** ⭐ S109-C · La Hoja CONFIGURA; el checkout cobra. */
  onIrAPagar: (config: { dias: number[]; frecuencia: Frecuencia; renueva: boolean }) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  // §6.1 v1.5 (S59, regla DURA): EL PLAN ES DE LUNES A VIERNES — S/D
  // quedan apagados con voz honesta con camino; el guard de DB manda
  // (plan_dia_no_laborable). Si el CUÁNDO era finde, no se preselecciona.
  const esFinde = (dow: number) => dow === 0 || dow === 6;
  const dowInicial = new Date(`${fecha}T12:00:00`).getDay();
  const [dias, setDias] = useState<number[]>(esFinde(dowInicial) ? [] : [dowInicial]);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('semanal');
  const [renueva, setRenueva] = useState(true);
  const [cubiertos, setCubiertos] = useState<number[] | 'cargando'>('cargando');


  // La cobertura REAL por día: para cada día de la semana, ¿la agenda
  // del paseador oferta esta hora (franja + cupo) en su próxima fecha?
  useEffect(() => {
    let vigente = true;
    void (async () => {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const resultados = await Promise.all(
        [0, 1, 2, 3, 4, 5, 6].map(async (dow) => {
          const f = proximaFechaDeDia(dow, manana);
          const r = await obtenerSlotsDisponibles({
            prestador_id: paseador.prestador_id,
            prestador_servicio_id: paseador.prestador_servicio_id,
            desde: f,
            hasta: f,
          });
          return r.ok && r.data.some((s) => s.hora.slice(0, 5) === hora.slice(0, 5)) ? dow : null;
        }),
      );
      if (!vigente) return;
      setCubiertos(resultados.filter((d): d is number => d !== null));
    })();
    return () => {
      vigente = false;
    };
  }, [paseador.prestador_id, paseador.prestador_servicio_id, hora]);

  const opcionesDias = useMemo(() => {
    // L·M·X·J·V·S·D — semana que arranca lunes (voz humana), regla 32 adentro.
    const orden = [1, 2, 3, 4, 5, 6, 0];
    return orden.map((dow) => ({
      codigo: String(dow),
      etiqueta: t(`plan.dia${dow}` as 'plan.dia0'),
      // el finde apaga SIEMPRE (§6.1 regla dura), la cobertura apaga el resto
      deshabilitada: esFinde(dow) || (cubiertos !== 'cargando' && !cubiertos.includes(dow)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cubiertos, t]);

  // S79 (reforma): EL MES ES EL MES — el precio es del PERÍODO, espejo
  // exacto del server (precio_mensual_plan; sin él, contratar rebota
  // plan_no_ofrecido y esta Hoja ni se abre — gate Ley 23 en
  // disponibles). Murió el per-salida × N (D-375 queda honrada: cero
  // estimaciones que el server no cobre).
  const precioMensual = paseador.precio_mensual_plan;
  const estimado = estimarSalidas(dias, frecuencia);

  /**
   * ⭐ **S109-C · ACÁ YA NO SE CONTRATA: SE NAVEGA.**
   * ☠️ Vivía `contratar()`, que llamaba a `contratarPlanPaseo` y cerraba la
   * Hoja con el plan hecho. **Murió en el mismo acto** (Ley 37) en que nació
   * `/explorar/paseo/checkout-plan`.
   *
   * 🔴 La razón es del founder y es de forma: **una Hoja se arrastra hacia
   * abajo.** Mientras la plata se mueve, la familia puede cerrarla con el dedo y
   * no hay a dónde volver — *y contratar un plan es una espera que cambia
   * sola.* La Hoja **configura**; la pantalla **cobra**. Mismo corte que
   * guardería.
   */
  function irAPagar() {
    if (dias.length === 0) return;
    onIrAPagar({ dias, frecuencia, renueva });
  }

  return (
    <HojaScroll>
      <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
          {t('plan.hojaVoz')}
        </Text>

        <View style={{ gap: spacing[2] }}>
          <SelectorOpcion
            acento="control"
            multiple
            disposicion="tira"
            etiqueta={t('plan.diasEtiqueta')}
            opciones={opcionesDias}
            seleccionadas={dias.map(String)}
            onSelect={(codigo) => {
              const dow = Number(codigo);
              setDias((prev) => (prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort()));
            }}
          />
          {/* §6.1 — la voz honesta CON CAMINO del finde apagado, siempre visible */}
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
            {t('plan.findeVoz')}
          </Text>
          {cubiertos === 'cargando' ? (
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
              {t('plan.cargandoDias')}
            </Text>
          ) : cubiertos.filter((d) => !esFinde(d)).length < 5 ? (
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
              {t('plan.diasNoCubre', { nombre: paseador.prestador_nombre })}
            </Text>
          ) : null}
        </View>

        {/* S58 (captura founder): 'Una vez al mes' quedaba amputada en
            fila — la frecuencia pasa a TIRA (scroll nativo; el chip
            cortado ES la señal de continuación) */}
        <SelectorOpcion
          acento="control"
          disposicion="tira"
          etiqueta={t('plan.frecuenciaEtiqueta')}
          opciones={[
            { codigo: 'semanal', etiqueta: t('plan.frecuenciaSemanal') },
            { codigo: 'quincenal', etiqueta: t('plan.frecuenciaQuincenal') },
            { codigo: 'mensual', etiqueta: t('plan.frecuenciaMensual') },
          ]}
          seleccionada={frecuencia}
          onSelect={(codigo) => setFrecuencia(codigo as Frecuencia)}
        />

        {/* Auto-renovación DECLARADA en superficie (Decisión S / P14d).
            Ley 22 (S58): era un BINARIO disfrazado de chips — Interruptor
            sólido; apagado es estado sereno, jamás error. */}
        <View style={{ gap: spacing[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
            <Text style={{ flex: 1, fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
              {t('plan.renovacionEtiqueta')}
            </Text>
            <Interruptor encendido={renueva} onCambio={setRenueva} etiqueta={t('plan.renovacionEtiqueta')} />
          </View>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, lineHeight: typography.size.xs * 1.4, color: theme.text.tertiary }}>
            {t('plan.renovacionVoz')}
          </Text>
        </View>

        <Separador />

        {/* S79: la plata, honesta — el MES fijo preside; las salidas son
            informativas (Ley 3: el dato en mono; la regla dicha en voz) */}
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.primary }}>
              {t('plan.precioMes')}
            </Text>
            <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: theme.text.primary, fontVariant: ['tabular-nums'] }}>
              {precioMensual !== null ? `$${precioMensual.toFixed(2)}` : '—'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {t('plan.salidasEstimadas')}
            </Text>
            <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: theme.text.primary, fontVariant: ['tabular-nums'] }}>
              {estimado} · {paseador.duracion_minutos} min
            </Text>
          </View>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
            {t('plan.mesNota')}
          </Text>
        </View>

        {/* la superficie DICE que el pago es simulado (patrón checkout) */}
        {/* ☠️ La banda de simulación se fue CON el acto: **la dice el checkout,
            que es donde ahora se paga.** *Dejarla acá la habría dejado avisando
            de un cobro que esta Hoja ya no hace.* */}
        <Boton
          etiqueta={t('plan.continuar')}
          bloque
          deshabilitado={dias.length === 0 || cubiertos === 'cargando' || estimado === 0 || precioMensual === null}
          onPress={irAPagar}
        />
      </View>
    </HojaScroll>
  );
}
