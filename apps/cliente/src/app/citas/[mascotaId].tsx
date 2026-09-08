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
  LineaAlgoSalioDistinto,
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
import { esMemorial } from '@/lib/memorial';
import { destinoDeLaPuerta, veredictoDeLaPuerta } from '@/lib/postventa/puerta';
import { useCasosPorObjeto } from '@/lib/postventa/useCasosPorObjeto';
import { useEstadoVida } from '@/lib/postventa/useEstadoVida';
import { useVentanaDeCaso } from '@/lib/postventa/useVentanaDeCaso';
import { vozServicio } from '@/lib/voz-servicio';

/**
 * ¿Esta cita ocurre por video?
 *
 * ⚠️ **Derivación DECLARADA, no atajo.** `CONTRATOS-PARA-C.md` (A, 25-ago):
 * *«la modalidad ya NO se manda desde el cliente para teleconsulta: se DERIVA
 * del tipo de servicio, server-side»* ⇒ hoy los dos valores son el mismo
 * hecho, y `modalidad` **no está expuesta en `CitaActivaMascota`** (medido).
 * 🔴 Pedida a A (§E1 del recorrido de la Obra 0). Cuando llegue, esto pasa a
 * `c.modalidad === 'telemedicina'` y este comentario se borra — *el día que
 * exista una presencial marcada como teleconsulta, esta línea mentiría y nada
 * avisaría.*
 */
function esTeleconsulta(tipo: string | null): boolean {
  return tipo === 'telemedicina';
}

function iconoDe(tipo: string | null): 'paseo' | 'grooming' | 'training' | 'telemedicina' {
  if (tipo?.startsWith('grooming')) return 'grooming';
  if (tipo === 'adiestramiento') return 'training';
  /* S106-C t3 · el glifo YA existía en el registry: la fila de una
     teleconsulta se distingue por el lenguaje de la casa (Ley 12, el glifo
     dice el servicio) y no por un texto agregado. */
  if (esTeleconsulta(tipo)) return 'telemedicina';
  return 'paseo';
}

/** El ícono del OFICIO para el encabezado del detalle (remate D-430):
 *  glifos existentes del set b′ — paseo/grooming (lote 1 S53) y
 *  'training' (lote 3 S58; ESTRENO acá por pedido founder S67 — este
 *  re-gate en dispositivo es su gate por ícono, DIRECCION_ARTE §6).
 *  Un oficio futuro sin glifo va sin ícono: cero genéricos (Ley 12). */
function iconoOficio(
  tipo: string | null,
): 'paseo' | 'grooming' | 'training' | 'telemedicina' | 'guarderia' | 'veterinaria' | null {
  if (tipo?.startsWith('grooming')) return 'grooming';
  if (tipo === 'adiestramiento') return 'training';
  if (tipo?.startsWith('paseo')) return 'paseo';
  /* ⭐ S109-D · el quinto oficio. El glifo YA EXISTÍA en el registry y ya se
     monta en el HOY del prestador y en NEGOCIO: lo único que faltaba era que
     esta función lo nombrara. *Sin él la estadía se pintaba sin glifo — el
     mismo mapa cerrado que le quitaba el nombre, un renglón más abajo.* */
  if (tipo?.startsWith('guarderia')) return 'guarderia';
  if (esTeleconsulta(tipo)) return 'telemedicina';
  /* S109-D · LO PRESENCIAL DEL VET, que faltaba entero. La teleconsulta tenía
     su glifo y la consulta en el local no — así que una cita de vacunación o de
     consulta se pintaba sin marca mientras la videollamada sí la tenía.
     🔴 Lo encontró el gate, no el ojo: **el glifo tenía más deuda que la voz**,
     y por eso el baseline nació en 3 y no en 1. Va DESPUÉS de `esTeleconsulta`
     a propósito: la telemedicina es vet y tiene glifo propio — el orden es el
     que decide, y si esta línea subiera se lo comería. */
  if (tipo === 'consulta_general' || tipo === 'consulta_especializada' || tipo === 'vacunacion') {
    return 'veterinaria';
  }
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

  /* ═══ S114-C · LA PUERTA EN LA FILA (firma del founder, 8-sep) ═══════════
     🔴 **EL HALLAZGO QUE LA ORDENA, MEDIDO Y NO SUPUESTO.** El founder no
     encontró «¿Algo salió distinto?» en ningún lado, y el censo dijo por qué:
     la puerta vivía SÓLO dentro de `/paseo/[atencionId]` —la pantalla de la
     ATENCIÓN— y a esa pantalla **una cita pasada casi nunca llega**.

     Los números de su propia familia, medidos contra la base:
       · 265 citas ya pasadas · **142 «confirmada» que nadie atendió**
       · esas 142 **están listadas acá** (el lector filtra por ESTADO, jamás
         por fecha) **y no eran tapeables**: sólo `en_vivo` abría.
       · 36 con atención · 37 de 534 ítems del historial llevaban a algún lado.

     *Una cita que el prestador nunca abrió NO TIENE atención, así que por el
     camino de la atención esas 142 no iban a tener puerta jamás — y son
     justamente «el paseador no vino», el reclamo más frecuente que existe.*

     ⇒ La puerta se monta **en la fila**, que es donde una familia la busca.
     Nadie entra a ver el recorrido de un paseo para avisar que no ocurrió. */
  const diasDeVentana = useVentanaDeCaso();
  const estadoVida = useEstadoVida(typeof mascotaId === 'string' ? mascotaId : null);
  /* UNA lectura para toda la lista, jamás una por fila (N16 · L-223). */
  const casosPorCita = useCasosPorObjeto('cita');

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

  /**
   * La puerta de UNA fila. Devuelve `null` cuando no corresponde, y los
   * silencios son los del veredicto: memorial, sin cerrar, o sin la ventana
   * del motor — ése último ahora **se declara en consola** en vez de apagarse
   * mudo (la cura de `sin_ventana`).
   */
  const puertaDeLaFila = (c: CitaActivaMascota) => {
    /* Estrictamente pasada: ver la nota de la fila. `fecha` es `YYYY-MM-DD`,
       así que la comparación de cadenas es correcta y no fabrica husos. */
    const hoy = new Date().toISOString().slice(0, 10);
    const yaPaso = c.fecha !== null && c.fecha < hoy;
    if (!yaPaso) return null;

    const caso = casosPorCita?.get(c.cita_id);
    const v = veredictoDeLaPuerta({
      cerradaEn: c.fecha,
      estadoVida,
      diasDeVentana,
      ...(caso !== undefined ? { casoAbierto: caso } : null),
      voces: {
        disponible: t('postventa.puerta'),
        fueraDeVentana: t('postventa.puertaFueraDeVentana'),
        casoAbierto: t('postventa.puertaCasoAbierto'),
      },
    });
    if (!v.hay) return null;

    return (
      /* Sin `Separador`: N3 — entre secciones separa el ESPACIO, no la línea.
         El `gap` de la tarjeta ya lo da, igual que en las otras dos puertas. */
      <View style={{ marginTop: spacing[1] }}>
        <LineaAlgoSalioDistinto
          estado={v.estado}
          sujeto="mascota"
          /* 🔴 La SEÑAL, jamás un `false` de comodidad — B lo dejó escrito:
             pasar `false` reintroduce el guard apagado que la prop vino a
             curar. El veredicto ya devolvió `hay:false` en memorial, así que
             acá nunca llega encendida; se pasa igual porque un piso que
             depende de que el llamador se acuerde no es un piso. */
          enMemorial={esMemorial(estadoVida)}
          onPress={() => {
            /* `casoAbierto` no tiene destino en `destinoDeLaPuerta` —nació
               cuando los casos no existían— así que el caso se navega acá,
               que es donde SÍ tenemos su id. Lo demás va por la función. */
            if (v.estado.tipo === 'casoAbierto' && v.casoId !== null) {
              router.push({ pathname: '/postventa/caso/[casoId]', params: { casoId: v.casoId } });
              return;
            }
            const destino = destinoDeLaPuerta(v, 'cita', c.cita_id);
            if (destino !== null) router.push(destino);
          }}
        />
      </View>
    );
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
          {/* S106-C t3 · estado y MODALIDAD conviven: una dice en qué punto
              está la cita, la otra POR DÓNDE ocurre. La etiqueta de la
              modalidad la arma la pieza (B) — no se le escribe texto. */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
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
            {esTeleconsulta(c.tipo_servicio) ? <Insignia modalidad="teleconsulta" tamaño="sm" /> : null}
          </View>
          {/* 🔴 LA TARJETA TAPEABLE TIENE QUE DECIR QUE LO ES. Sin esta línea
              la teleconsulta sería una tarjeta que navega **en silencio**, que
              es el defecto que el gate de S72 marcó con el «Ver más» mudo. El
              brazo `en_vivo` ya trae su señal (el pill de CitaEnVivo); éste
              no tenía ninguna. Estándar de S71: «Ver … ›», jamás un CTA en
              caja adentro de una tarjeta de información. */}
          {esTeleconsulta(c.tipo_servicio) ? (
            <Texto variante="apoyo">{t('citasMascota.verVideoconsulta')}</Texto>
          ) : null}
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
          {/* ── LA PUERTA, ÚLTIMA (§1: «la última fila del detalle») ────────
              Sólo sobre una cita que YA PASÓ. `cerradaEn` sale de `c.fecha`,
              que es día sin hora, así que se exige **estrictamente anterior a
              hoy**: sin la hora de fin no se puede distinguir «no vino» de
              «todavía no es la hora», y ofrecer un reclamo sobre algo que aún
              puede ocurrir es peor que ofrecerlo un día después.

              ⚠️ **La consecuencia se declara: una cita de HOY gana su puerta
              mañana.** Es la salida conservadora, y la cura de raíz es la hora
              de fin en el lector — está pedido a A. */}
          {puertaDeLaFila(c)}
        </View>
      </Tarjeta>
    );
    /* ── S106-C t3 · LA PUERTA A LA VIDEOCONSULTA (D-938) ──────────────────
       🔴 **Va ANTES que el brazo de `en_vivo`, y es a propósito.** Una
       teleconsulta no tiene "en vivo" con mapa: su destino es SIEMPRE su
       antesala, esté como esté. Si este brazo fuera segundo, una teleconsulta
       en curso mandaría al dueño a `/paseo/[atencionId]` — la pantalla de dos
       caras del PASEO.

       Aterriza en `videoconsulta`, no en `videollamada`: la antesala es la que
       sabe si se puede entrar y **lo dice con el motivo**; entrar directo
       significaría descubrir que no se puede recién adentro. */
    if (esTeleconsulta(c.tipo_servicio)) {
      return (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/videoconsulta/[citaId]', params: { citaId: c.cita_id } })
          }
        >
          {tarjeta}
        </Pressable>
      );
    }
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
    /* ── ① S114-C · UNA CITA QUE YA OCURRIÓ SE ABRE (firma del founder) ────
       ⏪ **Acá terminaba en `return tarjeta` sin `Pressable`, y ése era el
       defecto de fondo**: una cita pasada quedaba LISTADA Y MUERTA AL TACTO.
       El único brazo tapeable era `en_vivo`, así que el recorrido de un paseo
       que ocurrió ayer no se podía abrir desde su propia lista.

       *No es de postventa: es de producto.* Una familia entra a ver el parte,
       las fotos y el acta de un servicio que pasó — reclamar es sólo uno de
       los motivos, y el menos frecuente.

       Se abre **si hay a dónde ir**: con atención, al recorrido. Sin atención
       —las 142 que nadie atendió— no hay pantalla que abrir, y por eso la
       puerta va EN LA FILA y no detrás de un toque. */
    if (c.atencion_id !== null) {
      const atencionId = c.atencion_id;
      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/paseo/[atencionId]', params: { atencionId } })}
        >
          {tarjeta}
        </Pressable>
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
