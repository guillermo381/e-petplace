/**
 * PASEO — EL CUÁNDO tipo Teams (S55-B4, founder; reescribe el S54-B3.2).
 * Tres movimientos: DURACIÓN primero (bloques del menú canónico
 * realmente ofertados, server-side vía obtener_oferta_paseo — no se
 * oferta quien no puede cobrar, 7.13) → DÍA (tira horizontal hoy+13)
 * → GRILLA de inicios reales (obtener_inicios_paseo_disponibles: la
 * ventana entera cabe con cupo para ALGÚN paseador — motor S55-B2).
 * Slot sin cupo NO se pinta (silencio digno); día sin inicios = voz
 * honesta corta. El QUIÉN y el checkout quedan intactos (S54); el
 * camino de la plata NO se toca. Frecuencia dibujada APAGADA (el
 * paquete tiene candado: financiero v2.5 + P14, MODELO_PASEO §6).
 * CIERRA D-321: murió el rango horario hardcodeado.
 *
 * Piezas del sistema: SelectorOpcion en sus tres disposiciones
 * (enmienda S55-B4 — fila/tira/grilla), Celda para la frecuencia.
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin oferta activa: EstadoVacio honesto que educa.
 *  · Peldaño 1 — todo lo que se pinta es REAL: bloques de ofertas
 *    vivas con su precio, inicios de franjas reales menos ocupación.
 *  · Peldaño 2 — datos del expediente: HOY NINGUNO (explícito).
 *    Cuando el expediente sepa rutinas (B4+), la grilla podrá sugerir
 *    "su hora habitual" — por dato, no por versión.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Interruptor,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerDiasCerrados,
  obtenerIniciosPaseo,
  obtenerMascotasDeFamilia,
  obtenerOfertaPaseo,
  resolverUrlFoto,
  type DiaCerrado,
  type MascotaResumen,
  type OfertaPaseo,
  mascotasElegibles,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { FiltroMascotas } from '@/components/filtro-pills';
import { CabezalOficio, DiaSinHorarios, GrillaElegir, PieReserva, SelectorDia } from '@/components/reserva-piezas';

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

// '30 min' · '1 h' · '2 h' — el menú habla en tiempo humano corto.
function etiquetaBloque(min: number): string {
  return min < 60 ? `${min} min` : `${min / 60} h`;
}

interface Bloque {
  duracion: number;
  /** Precio mínimo entre prestadores que lo ofertan. */
  desde: number;
  /** true si hay más de un precio distinto (la voz dice "desde"). */
  varia: boolean;
}

export default function PaseoCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  // S61-A3 — LA GRAMÁTICA CANÓNICA (decisión founder): MASCOTA → QUÉ →
  // DÍA → HORA → QUIÉN → PAGAR. El paseo migra al patrón del grooming:
  // la mascota es el paso 0 y queda VISIBLE toda la reserva (rasgo 1);
  // el guard perro-only (§1bis) filtra ACÁ con voz honesta con camino.
  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  // ⚠️ r15-bis · LA MASCOTA EQUIVOCADA — el defecto más caro de la
  // sesión, y su mecanismo tiene TRES eslabones que solo juntos fallan:
  //  ① el log llama con `router.navigate`, que REUSA la ruta si ya está
  //    en el stack en vez de montar una nueva;
  //  ② el stack de Explorar NO se vacía al cambiar de tab — el
  //    `popToTopOnBlur` murió en S63 (D-402 enmendada, y con razón: era
  //    peor el desvío que curaba);
  //  ③ y esta pantalla COPIABA el param a estado con `useState(param)`,
  //    que corre UNA sola vez, en el montaje.
  // Resultado: entrás con Zeus, la pantalla sigue montada de la visita
  // anterior, el estado sigue diciendo Thor — y el param de Zeus se
  // ignora en silencio. Ninguno de los tres es un bug por su cuenta;
  // el bug es la copia.
  // LA CURA ES DEJAR DE COPIAR: el param se LEE VIVO en cada render y
  // MANDA SIEMPRE. El estado local queda para lo único que es suyo —
  // el deep-link o el log vacío, donde no hay param y la pantalla
  // pregunta.
  const { mascotaId: mascotaParam } = useLocalSearchParams<{ mascotaId?: string }>();
  const paramMascota =
    typeof mascotaParam === 'string' && mascotaParam.trim().length > 0 ? mascotaParam : null;
  const [elegidaLocal, setElegidaLocal] = useState<string | null>(null);
  const mascotaId = paramMascota ?? elegidaLocal;
  // S61-A4: la CARA del para-quién — URLs firmadas (patrón del QUIÉN).
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [oferta, setOferta] = useState<OfertaPaseo[] | 'cargando' | 'error'>('cargando');
  const [duracion, setDuracion] = useState<number | null>(null);
  const [dia, setDia] = useState<string>(fechaLocalISO(new Date()));
  const [inicios, setInicios] = useState<string[] | 'cargando' | 'error'>('cargando');
  const [hora, setHora] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);
  // r39-6 · el plan como AGREGADO que se prende (no un destino de lista)
  const [frecuente, setFrecuente] = useState(false);

  // S73 (letra de elegibilidad): la frontera UNICA del motor decide —
  // momento vital primero (memorial/perdida NO reservan), especie después.
  // La pantalla jamás re-computa elegibilidad (Ley 37: el filtro artesanal murió).
  const faseEspecies = useEspeciesElegibles('paseo');
  const elegibles = ofrecibles(Array.isArray(mascotas) ? mascotas : [], faseEspecies);

  const mascota = elegibles.find((m) => m.id === mascotaId) ?? null;

  // ⚠️ EL SEGUNDO CAMINO AL MISMO SÍNTOMA, y este es el que el founder
  // nombró: EL DEFAULT SILENCIOSO. La regla "con UNA elegible se elige
  // sola" es buena cuando NO hay nada pedido — pero si el log pidió a
  // Zeus y Zeus no resuelve (no está, o no puede reservar paseos), esta
  // línea elegía a Thor sin decir una palabra. Un dato de IDENTIDAD
  // rellenado por conveniencia es L-139 en su forma más cara: la
  // pantalla queda coherente, el typecheck verde, y la reserva sale
  // para la mascota equivocada.
  // Ahora la comodidad solo rige SIN param: con un pedido explícito,
  // esta pantalla no elige por el usuario jamás.
  const pidioAlguien = paramMascota !== null;
  useEffect(() => {
    if (!pidioAlguien && elegidaLocal === null && elegibles.length === 1) setElegidaLocal(elegibles[0].id);
  }, [elegibles, elegidaLocal, pidioAlguien]);

  /** El pedido llegó y NO resuelve: ni se rellena ni se sigue de largo.
   *  (Se espera a que las mascotas carguen — `especies` puede quedar
   *  null si su lectura falla, y `mascotasElegibles` trata ese null como
   *  "sin restricción": esperar por él dejaría la pantalla en limbo.) */
  const paramSinResolver = pidioAlguien && Array.isArray(mascotas) && mascota === null;
  /** El nombre de lo pedido, si existe en la familia — para poder DECIR
   *  a quién no se pudo abrir. Si no está, no se inventa. */
  const nombrePedido = Array.isArray(mascotas)
    ? (mascotas.find((m) => m.id === paramMascota)?.nombre ?? null)
    : null;

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.familia_id) {
          setMascotas('error');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        setMascotas(r.ok ? r.data : 'error');
        if (r.ok) {
          const conFoto = r.data.filter((m): m is MascotaResumen & { foto_url: string } => m.foto_url !== null);
          if (conFoto.length > 0) {
            const urls = await Promise.all(conFoto.map((m) => resolverUrlFoto(m.foto_url)));
            if (!vigente) return;
            const mapa: Record<string, string> = {};
            conFoto.forEach((m, idx) => {
              const u = urls[idx];
              if (u !== null) mapa[m.id] = u;
            });
            setFotos(mapa);
          }
        }
      })();
      void obtenerOfertaPaseo().then((r) => {
        if (!vigente) return;
        setOferta(r.ok ? r.data : 'error');
        if (r.ok && r.data.length > 0) {
          // el bloque más corto ofertado arranca elegido
          const menor = Math.min(...r.data.map((o) => o.duracion_minutos));
          setDuracion((d) => d ?? menor);
        }
      });
      return () => {
        vigente = false;
      };
    }, []),
  );

  // Bloques del menú REALMENTE ofertados, con su precio mínimo.
  const bloques = useMemo<Bloque[]>(() => {
    if (!Array.isArray(oferta)) return [];
    const porDuracion = new Map<number, number[]>();
    for (const o of oferta) {
      const lista = porDuracion.get(o.duracion_minutos) ?? [];
      lista.push(o.precio);
      porDuracion.set(o.duracion_minutos, lista);
    }
    return [...porDuracion.entries()]
      .map(([d, precios]) => ({
        duracion: d,
        desde: Math.min(...precios),
        varia: new Set(precios).size > 1,
      }))
      .sort((a, b) => a.duracion - b.duracion);
  }, [oferta]);

  // Próximos 14 días (hoy+13) — la tira. `corta` = fecha corta SIEMPRE
  // (S61-A5 cura 1: el botón del día sin lugar dice la fecha real —
  // "Probar mié 15" — jamás un "Mañana" con mayúscula colada).
  const dias = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', {
      weekday: 'short',
      day: 'numeric',
    });
    // 🔴 r16 · EL DÍA DE LA SEMANA SE PIDE POR SU PARTE, JAMÁS SE
    // RECORTA DEL STRING. Hasta hoy la rueda hacía `corta.split(' ')[0]`
    // (mío, r9) — y eso funciona en español POR CASUALIDAD DEL ORDEN:
    // es → "jue 30" (parte[0] = "jue") · en → "30 Thu" (parte[0] = "30").
    // Resultado visible en el emulador con la app en inglés: la rueda
    // decía el NÚMERO DOS VECES, arriba y abajo. `formatToParts` entrega
    // la parte por su NOMBRE y el orden deja de importar.
    const partes = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', { weekday: 'short' });
    const lista: Array<{ iso: string; etiqueta: string; corta: string; dow: number; diaCorto: string }> = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = fechaLocalISO(d);
      const corta = fmt.format(d).toLowerCase();
      const etiqueta = i === 0 ? t('explorar.cuandoHoy') : i === 1 ? t('explorar.cuandoManana') : corta;
      // r15 · el día de semana se toma de ESTE Date, que es LOCAL. Volver
      // a parsear el iso ('2026-08-02') lo leería como medianoche UTC y en
      // UTC-5 devolvería el día anterior — el sábado saldría viernes y los
      // cerrados quedarían corridos uno. La trampa de siempre, esquivada
      // no arreglada: el dato bueno ya estaba acá.
      lista.push({
        iso,
        etiqueta,
        corta,
        dow: d.getDay(),
        // la parte del día de semana, por NOMBRE (no por posición)
        diaCorto: partes
          .formatToParts(d)
          .find((p) => p.type === 'weekday')
          ?.value.toLowerCase() ?? '',
      });
    }
    return lista;
  }, [idioma, t]);

  // ── r15 · LOS DÍAS CERRADOS ────────────────────────────────────────
  // EL CONTRATO DE A ES POR PRESTADOR (`obtenerDiasCerrados(prestadorId)`
  // → días de semana) y ESTA PANTALLA ES MULTI-PRESTADOR: la grilla
  // muestra los inicios donde ALGÚN paseador tiene lugar. O sea que el
  // dato no se enchufa derecho, y la traducción es una DECISIÓN, no un
  // detalle: para el cliente un día está cerrado ⟺ lo declararon
  // cerrado TODOS los que ofertan la duración elegida. Con que uno abra,
  // el día está abierto. Cerrarlo por mayoría sería inventar.
  const [cerradosPorPrestador, setCerradosPorPrestador] = useState<Record<string, DiaCerrado[]>>({});

  // Los prestadores de la duración ELEGIDA — no los de toda la oferta:
  // el conjunto que importa es exactamente el que alimenta esa grilla.
  const prestadoresDeLaDuracion = useMemo(() => {
    if (!Array.isArray(oferta) || duracion === null) return [];
    return [...new Set(oferta.filter((o) => o.duracion_minutos === duracion).map((o) => o.prestador_id))];
  }, [oferta, duracion]);

  // N llamadas, UNA VEZ POR PRESTADOR EN TODA LA SESIÓN (cacheadas por
  // id): cambiar de duración no vuelve a pedir lo que ya se sabe. Es la
  // disciplina de D-497 — el arranque del Hogar se fue a 31 requests por
  // pedir de a poco muchas veces.
  useEffect(() => {
    const faltan = prestadoresDeLaDuracion.filter((id) => !(id in cerradosPorPrestador));
    if (faltan.length === 0) return;
    let vigente = true;
    void Promise.all(faltan.map((id) => obtenerDiasCerrados(id).then((r) => [id, r] as const))).then((res) => {
      if (!vigente) return;
      setCerradosPorPrestador((prev) => {
        const sig = { ...prev };
        for (const [id, r] of res) {
          // el fallo NO se guarda como "no cierra": sin dato, el día no
          // se marca (Ley 13 — un error jamás se disfraza de respuesta)
          if (r.ok) sig[id] = r.data;
        }
        return sig;
      });
    });
    return () => {
      vigente = false;
    };
  }, [prestadoresDeLaDuracion, cerradosPorPrestador]);

  /** Días de semana cerrados PARA EL CLIENTE + el motivo si es unánime.
   *  El motivo es voz del NEGOCIO: con varios prestadores solo se dice
   *  si todos dicen lo mismo; si difieren, la pantalla dice "cerrado" y
   *  se calla el porqué (inventar un motivo compuesto sería peor que no
   *  darlo — L-139: el verosímil-falso es peor que el null honesto). */
  const semanaCerrada = useMemo(() => {
    const mapa = new Map<number, string | null>();
    // sin respuesta de TODOS los prestadores no se concluye nada
    const respondieron = prestadoresDeLaDuracion.filter((id) => id in cerradosPorPrestador);
    if (prestadoresDeLaDuracion.length === 0 || respondieron.length !== prestadoresDeLaDuracion.length) return mapa;
    for (let dow = 0; dow < 7; dow += 1) {
      const filas = respondieron.map((id) => (cerradosPorPrestador[id] ?? []).find((d) => d.dia_semana === dow));
      if (filas.some((f) => f === undefined)) continue; // alguno abre
      const motivos = new Set(filas.map((f) => f?.motivo ?? null));
      mapa.set(dow, motivos.size === 1 ? ([...motivos][0] ?? null) : null);
    }
    return mapa;
  }, [prestadoresDeLaDuracion, cerradosPorPrestador]);

  /** Las FECHAS cerradas de la tira (el semanal proyectado a los 14). */
  const cerradosISO = useMemo(
    () => new Set(dias.filter((d) => semanaCerrada.has(d.dow)).map((d) => d.iso)),
    [dias, semanaCerrada],
  );
  const diaElegidoCerrado = cerradosISO.has(dia);
  const motivoDelDiaElegido = semanaCerrada.get(dias.find((d) => d.iso === dia)?.dow ?? -1) ?? null;

  // S61-A5 cura 1 (§6ter): el día siguiente en la tira, o null en el último.
  // r15: y el siguiente ABIERTO — ofrecer "Probar dom" cuando el domingo
  // está cerrado es la Ley 23 rota en la salida de emergencia (la puerta
  // no ofrece lo que ya sabe que va a rechazar).
  const diaSiguiente = useMemo(() => {
    const idx = dias.findIndex((d) => d.iso === dia);
    if (idx < 0) return null;
    return dias.slice(idx + 1).find((d) => !cerradosISO.has(d.iso)) ?? null;
  }, [dias, dia, cerradosISO]);

  // La grilla recalcula VIVA con cada cambio de día o duración.
  useEffect(() => {
    if (duracion === null || !Array.isArray(oferta) || oferta.length === 0) return;
    // r15: al día CERRADO no se le pregunta. La respuesta ya se sabe, y
    // preguntarla igual gastaría un viaje para volver con "no hay
    // horarios", que es justamente la voz equivocada (D-497).
    if (diaElegidoCerrado) {
      setInicios([]);
      setHora(null);
      return;
    }
    let vigente = true;
    setInicios('cargando');
    void obtenerIniciosPaseo({ fecha: dia, duracion_minutos: duracion }).then((r) => {
      if (!vigente) return;
      setInicios(r.ok ? r.data : 'error');
      if (r.ok) setHora((h) => (h !== null && r.data.includes(h) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [dia, duracion, oferta, reintento, diaElegidoCerrado]);

  const bloqueElegido = bloques.find((b) => b.duracion === duracion) ?? null;
  const listo = mascota !== null && duracion !== null && hora !== null;

  // r11 · el pie SOLO existe si hay algo que totalizar (tercera ley de
  // la lámina). Sin bloque elegido o sin horas del día, NO SE MONTA.
  const hayHoras = Array.isArray(inicios) && inicios.length > 0;
  // r15-bis · y el pie MUERE con el sujeto. Lo cazó el smoke, no la
  // lectura: la falla ruidosa reemplaza el contenido del scroll, pero el
  // pie se monta AFUERA de ese ternario y quedaba vivo — precio y CTA
  // sobre una pantalla que dice "no encontramos esa mascota". El botón
  // estaba deshabilitado, así que no rompía nada; decía otra cosa, que
  // es peor: media pantalla negando lo que la otra media ofrece.
  const pieVive = bloqueElegido !== null && hayHoras && !paramSinResolver;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* r14-6 · LA BANDA DE COLOR MURIÓ (decisión del founder mirando,
          dos rondas después de haber firmado cuál de las dos bandas
          ganaba). En su lugar, el cabezal: glifo del oficio + isotipo
          teñido + label. El desvío de Ley 4 y el retiro del precio
          duplicado están declarados en la pieza. */}
      <CabezalOficio
        oficio="paseo"
        capa="cuidado"
        titulo={t('explorar.agendaPaseos')}
        detalle={mascota !== null ? mascota.nombre : null}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />

      <ScrollView contentContainerStyle={{ paddingTop: spacing[5], paddingBottom: spacing[8], gap: spacing[5] }}>
        {oferta === 'cargando' || mascotas === 'cargando' ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <EsqueletoGrupo>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto forma="bloque" ancho="100%" alto={56} />
                <Esqueleto forma="bloque" ancho="100%" alto={56} />
                <Esqueleto forma="bloque" ancho="100%" alto={120} />
              </View>
            </EsqueletoGrupo>
          </View>
        ) : oferta === 'error' || mascotas === 'error' ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <EstadoVacio
              titulo={t('explorar.paseadoresError')}
              descripcion={t('hogar.errorHistoriaDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('hogar.reintentar')}
                  onPress={() => {
                    setOferta('cargando');
                    setMascotas('cargando');
                  }}
                />
              }
            />
          </View>
        ) : paramSinResolver ? (
          /* ⚠️ LA FALLA RUIDOSA (r15-bis). Se pidió una mascota y no se
             pudo resolver: la pantalla lo DICE y no arma nada. Antes
             seguía de largo y —con una sola elegible— reservaba para
             otra. Acá no hay grilla, no hay pie y no hay CTA: sin sujeto
             no hay reserva. La salida es explícita, no un default. */
          <View style={{ paddingHorizontal: spacing[4] }}>
            <EstadoVacio
              icono={<Icono nombre="paseo" tamano={48} />}
              titulo={
                nombrePedido !== null
                  ? t('explorar.mascotaNoReservable', { nombre: nombrePedido })
                  : t('explorar.mascotaNoEncontrada')
              }
              descripcion={t('explorar.mascotaNoReservableDetalle')}
              accion={
                <Boton
                  variante="primario"
                  etiqueta={t('explorar.elegirOtraMascota')}
                  // limpiar el param es lo que devuelve la palabra al
                  // usuario: sin pedido, la pantalla vuelve a PREGUNTAR
                  onPress={() => router.setParams({ mascotaId: '' })}
                />
              }
            />
          </View>
        ) : faseEspecies.fase === 'error' ? (
          // Ley 13 · el catálogo no llegó y se DICE. Degradar acá a
          // «todas» sería re-abrir el agujero que esta tanda cierra.
          <View style={{ paddingHorizontal: spacing[4] }}>
            <EstadoVacio
              registro="seccion"
              titulo={t('explorar.catalogoErrorTitulo')}
              descripcion={t('explorar.catalogoErrorDetalle')}
            />
          </View>
        ) : faseEspecies.fase === 'listo' && elegibles.length === 0 ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <EstadoVacio
              icono={<Icono nombre="paseo" tamano={48} />}
              titulo={t('paquete.sinPerrosTitulo')}
              descripcion={t('paquete.sinPerrosDetalle')}
              accion={
                <Boton
                  variante="primario"
                  etiqueta={t('paquete.sinPerrosAccion')}
                  onPress={() => {
                    if (router.canDismiss()) router.dismissAll();
                    router.navigate('/hogar/agregar');
                  }}
                />
              }
            />
          </View>
        ) : oferta.length === 0 ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <EstadoVacio
              icono={<Icono nombre="paseo" tamano={48} />}
              titulo={t('explorar.paseadoresVacio')}
              descripcion={t('explorar.paseadoresVacioDetalle')}
            />
          </View>
        ) : (
          <>
            {/* r12-5: EL PASO DE ELEGIR MASCOTA MURIÓ del camino normal
                — viene elegida del LOG (param) y el techo la muestra: un
                dato elegido no se vuelve a preguntar (Ley 23).
                ⚠️ HALLAZGO r12-11, declarado al verificar: sobrevive
                para DOS casos reales, no uno.
                  ① deep-link sin param.
                  ② EL VACÍO DEL LOG — un hogar sin ningún paseo muestra
                    su EstadoVacio y NO tiene hilera de mascotas; su CTA
                    "Explorar" entra acá sin param, y ahí preguntar es lo
                    correcto: la puerta pregunta lo que NO sabe (Ley 23
                    por su otra cara), y ahí sí parte los datos.
                O sea: en el gate, el paso NO debe aparecer viniendo de
                Agendar (que ya nunca se dispara sin mascota) pero SÍ
                aparece —y debe— viniendo del log vacío. */}
            {mascota === null ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                {/* ⚠️ r34 · LOS CHIPS DEL SALVAVIDAS, MIGRADOS A LOS NUEVOS.
                    Este camino —deep-link sin param, o el log VACÍO— es el que
                    NADIE recorre, y por eso conservaba los viejos: un resto no
                    sobrevive por difícil, sobrevive por INVISIBLE. Censo del
                    founder confirmado y era UNIFORME: los CUATRO oficios lo
                    tenían, no solo veterinaria. */}
                <View style={{ marginHorizontal: -spacing[4] }}>
                  <FiltroMascotas
                    mascotas={elegibles.map((m) => ({ id: m.id, nombre: m.nombre, fotoUrl: fotos[m.id] }))}
                    elegida={mascotaId}
                    onElegir={setElegidaLocal}
                  />
                </View>
              </View>
            ) : null}

            {/* 1 · DURACIÓN — r14-4: SALE de `SelectorOpcion` y pasa a
                la MISMA grilla que la hora.
                EL PORQUÉ, en dos capas y las dos medidas:
                 ① `SelectorOpcion` dibuja el elegido con BORDE en el
                   acento — contorno magenta. A6 (SIN CAJA) lo prohíbe y
                   el founder lo rechazó cuatro veces; el borde vive en
                   el componente compartido, así que la cura no es
                   tocarlo (lo consumen veinte pantallas) sino no usarlo
                   para este trabajo.
                 ② Y el relleno tampoco: son CINCO bloques ofertados
                   —hermanos comparables— y L-b veta el pleno de 4 en
                   adelante. Acá corrijo mi propia r11: declaré
                   `naturaleza="existe"` como la solución "por ley", y
                   la 19.8 dice QUÉ se rellena mientras L-b dice CUÁNTO.
                   Leí la primera y me salteé la segunda.
                Queda lo que las dos leyes dejan en pie: elevación,
                escala y color de texto — la voz de su vecina la hora. */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="apoyo">{t('explorar.cuandoDuracion')}</Texto>
              </View>
              <GrillaElegir
                voz="sans"
                opciones={bloques.map((b) => ({ codigo: String(b.duracion), etiqueta: etiquetaBloque(b.duracion) }))}
                elegida={duracion !== null ? String(duracion) : null}
                onElegir={(codigo) => setDuracion(Number(codigo))}
              />
              {bloqueElegido !== null && bloqueElegido.duracion === 30 ? (
                <View style={{ paddingHorizontal: spacing[5] }}>
                  <Texto variante="apoyo">{t('explorar.cuandoSalidaBano')}</Texto>
                </View>
              ) : null}
            </View>

            {/* 2 · EL DÍA — RIEL o RUEDA (D3) por el switch. Ni relleno
                ni contorno: ELEVACIÓN + ESCALA + COLOR DE TEXTO (son
                catorce hermanos comparables — L-b).
                🔴 DÍAS CERRADOS: el dato NO EXISTE en el motor (medido
                por las dos pistas). No se pinta: todos nacen tocables y
                el nulo honesto de abajo sostiene el caso. La prop
                `cerrados` está lista para el lector cuando A lo dé. */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="apoyo">{t('explorar.cuandoDia')}</Texto>
              </View>
              <SelectorDia
                dias={dias.map((d) => ({ iso: d.iso, dia: d.diaCorto, numero: d.iso.slice(8, 10) }))}
                elegido={dia}
                cerrados={cerradosISO}
                etiquetaCerrado={t('explorar.cuandoDiaCerrado')}
                onElegir={setDia}
              />
            </View>

            {/* 3 · LA HORA — misma gramática (elevación/escala/color) */}
            {inicios === 'cargando' ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                <EsqueletoGrupo>
                  <Esqueleto forma="bloque" ancho="100%" alto={100} />
                </EsqueletoGrupo>
              </View>
            ) : inicios === 'error' ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                <EstadoVacio
                  registro="seccion"
                  titulo={t('explorar.paseadoresError')}
                  accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
                />
              </View>
            ) : inicios.length === 0 ? (
              /* EL NULO HONESTO (tercera ley): dice que no hay, dice POR
                 QUÉ, ofrece la salida — jamás ocho celdas tachadas. Y el
                 PIE DESAPARECE (no hay total de algo que no existe).

                 ✅ r15 — Y AHORA DICE **CUÁL** DE LAS DOS VERDADES. Hasta
                 hoy "el negocio cierra los domingos" y "nadie configuró el
                 domingo" caían las dos en la misma frase —"los paseadores
                 no tienen lugar libre ese día"—, que en el primer caso es
                 falsa: no es que no haya lugar, es que no se atiende. Dos
                 estados distintos con una sola voz es el verosímil-falso
                 de L-139 en su forma más barata. El motor ya sabe
                 distinguirlos desde la r7 de A; esta pantalla, desde hoy.
                 Y el MOTIVO, si el negocio lo declaró, se dice CON SU VOZ:
                 la pantalla no lo redacta ni lo inventa cuando falta. */
              <DiaSinHorarios
                titulo={diaElegidoCerrado ? t('explorar.cuandoDiaCerrado') : t('explorar.cuandoSinInicios')}
                porque={
                  diaElegidoCerrado
                    ? (motivoDelDiaElegido ?? t('explorar.cuandoDiaCerradoPorque'))
                    : t('explorar.cuandoSinIniciosPorque')
                }
                etiquetaSalida={diaSiguiente !== null ? t('explorar.sinIniciosProbarDia', { dia: diaSiguiente.corta }) : null}
                onSalida={() => {
                  if (diaSiguiente !== null) setDia(diaSiguiente.iso);
                }}
              />
            ) : (
              <View style={{ gap: spacing[2] }}>
                <View style={{ paddingHorizontal: spacing[5] }}>
                  <Texto variante="apoyo">{t('explorar.cuandoHora')}</Texto>
                </View>
                <GrillaElegir
                  opciones={inicios.map((h) => ({ codigo: h, etiqueta: h }))}
                  elegida={hora}
                  onElegir={setHora}
                />
              </View>
            )}

            {/* 4-5 · PLAN y PAQUETE — su ubicación es LETRA FIRMADA
                (P14 · §6bis.2bis: comprar ≠ reservar). Declarado en la
                auditoría r9 y NO tocado: moverlos es decisión de
                producto, va al gate. */}
            <View style={{ paddingHorizontal: spacing[4] }}>
              <Tarjeta relleno="ninguno" elevacion="reposo">
                {/* ⚠️ r39-6 · "HACERLO FRECUENTE" PASA A INTERRUPTOR —
                    pedido del founder, y el criterio ya es ley de la casa
                    desde local/domicilio (r34): **no son dos alternativas
                    simétricas**. Reservar UNA salida es lo normal; el plan
                    es un AGREGADO que se PRENDE. Como celda navegable
                    parecía un destino más de una lista, y el lenguaje de
                    la pantalla decía "acá se va a otro lado" cuando lo
                    que hace es cambiar la naturaleza de esta reserva.
                    El interruptor dice la verdad de la estructura: hay un
                    estado normal y uno que sumás.
                    Sin los pasos previos NO SE PRENDE, y lo dice: un
                    interruptor apagado que explica qué falta es honesto;
                    uno que se deja prender y después rebota, no. */}
                <View style={{ padding: spacing[3], gap: spacing[1] }}>
                  <Interruptor
                    etiqueta={t('plan.chip')}
                    encendido={frecuente}
                    onCambio={(v) => {
                      if (!listo) return;
                      setFrecuente(v);
                      if (v) {
                        router.push({
                          pathname: '/explorar/paseo/disponibles',
                          params: { fecha: dia, hora, duracion: String(duracion), plan: '1', mascotaId: mascota?.id ?? '' },
                        });
                      }
                    }}
                  />
                  <Texto variante="apoyo">{listo ? t('plan.chipDetalle') : t('plan.chipElegiPrimero')}</Texto>
                </View>
                <Separador />
                {duracion !== null ? (
                  <CeldaNavegacion
                    icono="despensa"
                    titulo={t('paquete.chip')}
                    detalle={t('paquete.chipDetalle')}
                    onPress={() => {
                      router.push({ pathname: '/explorar/paseo/paquete', params: { duracion: String(duracion) } });
                    }}
                  />
                ) : (
                  <Celda inicio={<Icono nombre="despensa" />} titulo={t('paquete.chip')} subtitulo={t('paquete.chipElegiDuracion')} />
                )}
              </Tarjeta>
            </View>
          </>
        )}
      </ScrollView>

      {/* EL PIE — el ÚNICO relleno pleno de la pantalla es su CTA, y va
          EN EL SLOT (Boton primario resuelve accent.cta): no se pinta
          acá; el ocre entra por token cuando el founder lo firme.
          DESAPARECE cuando no hay qué totalizar (tercera ley). */}
      {Array.isArray(oferta) && oferta.length > 0 && elegibles.length > 0 && pieVive ? (
        <PieReserva
          total={bloqueElegido !== null ? `$ ${bloqueElegido.desde.toFixed(2)}` : null}
          totalDesde={bloqueElegido?.varia ?? false}
          cuando={hora !== null ? `${dias.find((d) => d.iso === dia)?.corta ?? ''} · ${hora}` : null}
          etiqueta={t('explorar.verQuienPuede')}
          habilitado={listo}
          onPress={() => {
            if (!listo) return;
            router.push({
              pathname: '/explorar/paseo/disponibles',
              params: { fecha: dia, hora, duracion: String(duracion), mascotaId: mascota.id },
            });
          }}
          insetBottom={insets.bottom}
        />
      ) : null}
    </View>
  );
}
