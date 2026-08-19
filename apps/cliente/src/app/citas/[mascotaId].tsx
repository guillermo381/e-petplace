/**
 * D-430 (S67) — EL DETALLE CONTEXTUAL DE LA CITA (regla de plataforma,
 * founder S67): el CTA "Ver su cita" de la ficha de mascota aterriza
 * ACÁ — jamás en un hub. El hub sigue siendo el destino del doble-clic
 * del servicio (letra MODELO_PASEO); el contexto de mascota lleva al
 * detalle de SU cita.
 *
 * La pantalla: la PRÓXIMA cita activa de la mascota como detalle —
 * servicio en voz de familia (riel S61-A1) · día y hora · el prestador
 * que atiende · estado honesto (Confirmada / "En vivo" §7.1 conectando
 * con /paseo/[atencionId] / hold vigente D-319). N>1 activas ⇒ "Ver
 * más" despliega las demás EN LA MISMA pantalla; cada fila es
 * navegable a su propio detalle (setParams — misma ruta, Back intacto).
 * Una sola activa ⇒ "Ver más" NO se dibuja (nada apagado).
 *
 * Ley 13: el error jamás se disfraza de vacío ('error' ≠ lista vacía);
 * el vacío honesto existe solo por carrera (el CTA de la ficha ni se
 * dibuja sin cita activa). Back siempre — jamás callejón.
 *
 * DECLARADO (reporte S67): "el prestador navegable a su detalle" queda
 * SIN chevron — el perfil público del prestador no existe en cliente
 * (D-370, mock firmado S61, letra pendiente); cuando nazca, esta fila
 * gana su navegación.
 *
 * S82-C LAZO 4a (CLARIDAD, familia hogar-diario) — la migración D-318
 * que la skill tenía anotada para esta pantalla: los DOS "ver más"
 * mudos pasan a PieRevelar (19.6 con el número en la etiqueta y el
 * chevron que gira; el Boton secundario de "Ver más" y el Pressable de
 * texto de los ítems del presupuesto MUEREN). Mecánica S81: Text crudo
 * → Texto · los pares del presupuesto (ítem/precio, total) a FilaDato
 * horizontal (la disposición S81 nacida para listas densas de pares).
 * CHANEL: mueren las keys verMas/verItems/ocultarItems (Ley 37 — el
 * PieRevelar trae su etiqueta canónica del namespace ui).
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  CitaEnVivo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  Icono,
  Insignia,
  PieRevelar,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  aprobarPresupuestoFamilia,
  obtenerCitasActivasMascota,
  obtenerPresupuestosFamilia,
  rechazarPresupuesto,
  type CitaActivaMascota,
  type PresupuestoFamilia,
} from '@epetplace/api';
import { fechaCortaMono, fechaLargaHumana } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

function iconoDe(tipo: string | null): 'paseo' | 'grooming' | 'training' {
  if (tipo?.startsWith('grooming')) return 'grooming';
  if (tipo === 'adiestramiento') return 'training';
  return 'paseo';
}

/** El ícono del OFICIO para el encabezado del detalle (remate D-430):
 *  glifos existentes del set b′ — paseo/grooming (lote 1 S53) y
 *  'training' (lote 3 S58; ESTRENO acá por pedido founder S67 — este
 *  re-gate en dispositivo es su gate por ícono, DIRECCION_ARTE §6).
 *  Un oficio futuro sin glifo va sin ícono: cero genéricos (Ley 12). */
function iconoOficio(tipo: string | null): 'paseo' | 'grooming' | 'training' | null {
  if (tipo?.startsWith('grooming')) return 'grooming';
  if (tipo === 'adiestramiento') return 'training';
  if (tipo?.startsWith('paseo')) return 'paseo';
  return null;
}

export default function CitasDeMascota() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const { mascotaId, nombre, citaId } = useLocalSearchParams<{
    mascotaId: string;
    nombre?: string;
    citaId?: string;
  }>();

  const [estado, setEstado] = useState<CitaActivaMascota[] | 'cargando' | 'error'>('cargando');
  const [desplegado, setDesplegado] = useState(false);
  const [intento, setIntento] = useState(0);

  // Presupuestos pendientes de ESTA mascota (vigentes; el vencido perezoso se
  // resuelve en el lector y no se muestra — expira sereno).
  const [presupuestos, setPresupuestos] = useState<PresupuestoFamilia[]>([]);
  const [itemsAbiertos, setItemsAbiertos] = useState<Record<string, boolean>>({});
  const [procesando, setProcesando] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void (async () => {
        if (typeof mascotaId !== 'string' || mascotaId.length === 0) return;
        const [rc, rp] = await Promise.all([obtenerCitasActivasMascota(mascotaId), obtenerPresupuestosFamilia()]);
        if (!vivo) return;
        setEstado(rc.ok ? rc.data : 'error');
        setPresupuestos(
          rp.ok ? rp.data.filter((p) => p.mascotaId === mascotaId && p.estadoEfectivo === 'enviado') : [],
        );
      })();
      return () => {
        vivo = false;
      };
    }, [mascotaId, intento]),
  );

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  const onAprobar = useCallback(
    async (id: string) => {
      setProcesando(id);
      const r = await aprobarPresupuestoFamilia(id);
      setProcesando(null);
      if (r.ok) {
        mostrar({ texto: t('presupuesto.aprobadoOk'), variante: 'exito' });
        recargar();
      } else {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'presupuesto_vencido' || r.codigo === 'presupuesto_no_enviado') recargar();
      }
    },
    [mostrar, t, recargar],
  );

  const onRechazar = useCallback(
    async (id: string) => {
      setProcesando(id);
      const r = await rechazarPresupuesto(id);
      setProcesando(null);
      if (r.ok) {
        mostrar({ texto: t('presupuesto.rechazadoOk'), variante: 'neutro' });
        recargar();
      } else {
        mostrar({ texto: r.mensaje, variante: 'error' });
      }
    },
    [mostrar, t, recargar],
  );

  const titulo =
    typeof nombre === 'string' && nombre.length > 0
      ? t('citasMascota.titulo', { nombre })
      : t('citasMascota.tituloSinNombre');

  const citas = Array.isArray(estado) ? estado : [];
  // El detalle es la cita elegida (fila del acordeón) o LA PRÓXIMA.
  const hero = citas.find((c) => c.cita_id === citaId) ?? citas[0];
  const otras = citas.filter((c) => c !== hero);

  const vozEstado = (c: CitaActivaMascota): string =>
    c.estado === 'hold'
      ? t('hogar.reservandoHorario')
      : c.estado === 'por_coordinar'
        ? t('citasMascota.estadoPorCoordinar')
        : t('citasMascota.estadoConfirmada');

  // D-474 (S72-A): el nombre visible de la cita. La voz del comprable
  // manda; si el código no está en el mapa (p. ej. 'procedimiento', el
  // vocabulario del motor — Ley 3), cae a la DESCRIPCIÓN del presupuesto
  // (Pieza 3, lado dueño): 1 ítem → su descripción · N → primera + «+N».
  // Sin ninguna de las dos, null → la pantalla OMITE el nombre (jamás pinta
  // "Procedimiento"; el fallback del dueño difiere del vet a propósito).
  const nombreVisibleCita = (c: CitaActivaMascota): string | null => {
    const voz = vozServicio(t, c.tipo_servicio);
    if (voz !== null) return voz;
    const d = c.descripcion_presupuesto;
    if (d === null || d.primera === null) return null;
    return d.extras > 0
      ? t('citasMascota.procedimientoConExtras', { primera: d.primera, n: d.extras })
      : d.primera;
  };

  const detalleHero = (c: CitaActivaMascota) => {
    const servicio = nombreVisibleCita(c);
    const icono = iconoOficio(c.tipo_servicio);
    // S71-A (costura de D-439): la cita aprobada todavía no tiene fecha —
    // se dice con todas las letras, jamás un hueco ni un guión. La línea de
    // agencia contesta la pregunta que sigue: "¿y ahora quién mueve esto?".
    const cuando =
      c.fecha === null
        ? t('citasMascota.faltaCoordinar')
        : `${fechaLargaHumana(c.fecha, idioma)}${c.hora !== null ? ` · ${c.hora}` : ''}`;
    const tarjeta = (
      <Tarjeta elevacion="reposo">
        <View style={{ gap: spacing[3] }}>
          {servicio !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              {icono !== null ? <Icono nombre={icono} tamano={28} /> : null}
              <Texto variante="titulo">{servicio}</Texto>
            </View>
          ) : null}
          <Texto variante="datoMd">{cuando}</Texto>
          {c.estado === 'en_vivo' ? (
            // §7.1 — la voz única "En vivo" la pone el pill de CitaEnVivo;
            // acá solo la invitación a la pantalla de dos caras.
            <Texto variante="apoyo">{t('hogar.verEnVivo')}</Texto>
          ) : (
            <Insignia
              estado={c.estado === 'hold' || c.estado === 'por_coordinar' ? 'proximo' : 'alDia'}
              etiqueta={vozEstado(c)}
              tamaño="sm"
            />
          )}
          {/* S71-A — la línea de AGENCIA: quién mueve esto ahora. Sin ella
              el dueño queda con un estado y sin saber qué esperar.
              DOS FORMAS, porque el nombre puede no estar: la cita nacida de
              presupuesto sin empleado emisor tiene prestador_id NULL
              (D-439 retiró la heurística), y el NEGOCIO de la cuenta
              comercial NO es legible por el dueño (RLS solo-owner,
              verificado en DB). Con nombre lo decimos; sin nombre decimos
              la verdad igual, sin inventar quién. */}
          {c.estado === 'por_coordinar' ? (
            <Texto variante="apoyo">
              {/* D-455 cerrada (S71-A motor): el nombre del negocio llega por
                  la RPC angosta — la forma pobre queda de fallback real. */}
              {(c.prestador_nombre ?? c.negocio_nombre) !== null
                ? t('citasMascota.coordinaraNegocio', { negocio: c.prestador_nombre ?? c.negocio_nombre ?? '' })
                : t('citasMascota.coordinaranSinNombre')}
            </Texto>
          ) : null}
          {c.prestador_nombre !== null ? (
            <>
              <Separador />
              <Celda titulo={c.prestador_nombre} subtitulo={t('citasMascota.quienAtiende')} />
            </>
          ) : null}
        </View>
      </Tarjeta>
    );
    if (c.estado === 'en_vivo' && c.atencion_id !== null) {
      const atencionId = c.atencion_id;
      return (
        <CitaEnVivo capa="cuidado">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/paseo/[atencionId]', params: { atencionId } })}
          >
            {tarjeta}
          </Pressable>
        </CitaEnVivo>
      );
    }
    return tarjeta;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={[]}>
      <Encabezado variante="navegacion" titulo={titulo} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}>
        {/* Presupuestos pendientes — ARRIBA del detalle de la cita. Aparecen
            aunque no haya cita activa (el presupuesto vive por su cuenta). */}
        {presupuestos.map((p) => {
          const abierto = itemsAbiertos[p.id] === true;
          const ocupado = procesando === p.id;
          return (
            <Tarjeta key={p.id} elevacion="reposo">
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('presupuesto.tituloPendiente')}</Texto>
                <Texto variante="apoyo">
                  {t('presupuesto.recibido', { fecha: fechaLargaHumana(p.recibidoEn.slice(0, 10), idioma) })}
                  {'  ·  '}
                  {t('presupuesto.vence', { fecha: fechaLargaHumana(p.venceEn.slice(0, 10), idioma) })}
                </Texto>

                <Separador />
                <FilaDato
                  disposicion="horizontal"
                  etiqueta={t('presupuesto.total')}
                  valor={<Texto variante="datoMd">{`$ ${p.total}`}</Texto>}
                />

                {p.items.length > 0 ? (
                  <>
                    {abierto ? (
                      <View style={{ gap: spacing[2] }}>
                        {p.items.map((it) => (
                          <FilaDato
                            key={it.id}
                            disposicion="horizontal"
                            etiqueta={it.cantidad > 1 ? `${it.nombre} ×${it.cantidad}` : it.nombre}
                            valor={`$ ${it.precio * it.cantidad}`}
                            mono
                          />
                        ))}
                      </View>
                    ) : null}
                    {/* 19.6 — el desglose plegado se revela con el número;
                        murió el Pressable de texto mudo (D-318). */}
                    <PieRevelar
                      n={p.items.length}
                      revelado={abierto}
                      onPress={() => setItemsAbiertos((s) => ({ ...s, [p.id]: !abierto }))}
                    />
                  </>
                ) : null}

                <Texto variante="apoyo">{t('presupuesto.queSigue')}</Texto>

                <View style={{ gap: spacing[2] }}>
                  <Boton
                    variante="primario"
                    bloque
                    etiqueta={t('presupuesto.aprobar')}
                    cargando={ocupado}
                    onPress={() => void onAprobar(p.id)}
                  />
                  {/* S71-A — "Rechazar" no tenía guard: se podía disparar dos
                      veces, o encima de un "Aprobar" en vuelo. La segunda
                      llamada rebota con un error que al dueño le suena a
                      absurdo ("todavía no fue enviado") sobre algo que acaba
                      de decidir. Ningún CTA de decisión se dispara dos veces
                      ni encima del otro: mismo `ocupado` que Aprobar. */}
                  <Boton
                    variante="ghost"
                    bloque
                    etiqueta={t('presupuesto.rechazar')}
                    deshabilitado={ocupado}
                    onPress={() => void onRechazar(p.id)}
                  />
                </View>
              </View>
            </Tarjeta>
          );
        })}

        {estado === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto forma="bloque" ancho="100%" alto={140} />
            <Esqueleto forma="linea" ancho="60%" />
          </EsqueletoGrupo>
        ) : estado === 'error' ? (
          // Ley 13: el fallo dice que es fallo — jamás "sin citas".
          <EstadoVacio
            titulo={t('citasMascota.error')}
            descripcion={t('citasMascota.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('citasMascota.reintentar')}
                onPress={() => {
                  setEstado('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        ) : hero === undefined ? (
          // Vacío honesto (carrera: la cita expiró/cerró entre la ficha
          // y el tap). Back del Encabezado — jamás callejón.
          <EstadoVacio titulo={t('citasMascota.vacio')} descripcion={t('citasMascota.vacioDetalle')} />
        ) : (
          <>
            {detalleHero(hero)}

            {/* N>1 activas: el resto se revela EN LA MISMA pantalla con el
                número (19.6, PieRevelar — murió el Boton secundario mudo,
                D-318); con una sola, NO se dibuja (nada apagado). */}
            {otras.length > 0 && desplegado ? (
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('citasMascota.otrasActivas')}</Texto>
                <Tarjeta relleno="ninguno" elevacion="reposo">
                  {otras.map((c, i) => (
                    <View key={c.cita_id}>
                      {i > 0 ? <Separador /> : null}
                      <CeldaNavegacion
                        icono={iconoDe(c.tipo_servicio)}
                        titulo={nombreVisibleCita(c) ?? vozEstado(c)}
                        detalle={
                          c.fecha === null
                            ? t('citasMascota.faltaCoordinar')
                            : `${fechaCortaMono(c.fecha, idioma)}${c.hora !== null ? ` · ${c.hora}` : ''}`
                        }
                        onPress={() => router.setParams({ citaId: c.cita_id })}
                      />
                    </View>
                  ))}
                </Tarjeta>
              </View>
            ) : null}
            {otras.length > 0 ? (
              <PieRevelar n={otras.length} revelado={desplegado} onPress={() => setDesplegado((d) => !d)} />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
