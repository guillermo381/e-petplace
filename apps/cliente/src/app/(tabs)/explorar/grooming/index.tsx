/**
 * GROOMING — EL CUÁNDO momento-primero ADAPTADO (S60-A1, MODELO_GROOMING
 * §2/§3/§6/§7 sobre el esqueleto del CUÁNDO del paseo S55-B4). La
 * diferencia de fondo: el dueño elige SERVICIO (Baño / Baño y corte) y
 * CUÁNDO — la DURACIÓN es CONSECUENCIA (servicio × talla del perfil,
 * declarada por cada groomer) y JAMÁS menú del dueño. El motor de
 * ventana no se toca: la grilla de inicios ya viene resuelta por
 * groomer server-side (obtener_inicios_grooming_disponibles).
 *
 * LA MASCOTA VA PRIMERO (desvío declarado de la letra del visto, por
 * realidad del motor L-141: la grilla necesita la talla — sin mascota
 * no hay duración ni precio). Talla o pelaje NULL → TallaPelajeHoja
 * ANTES de pintar precios personalizados; declarar SIEMPRE continúa
 * (el rebote server talla_no_declarada queda de red, no de flujo).
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin groomers cobrables con oferta: vacío honesto.
 *  · Peldaño 1 — todo lo pintado es REAL: los dos comprables con su
 *    "desde" YA resuelto por la talla de ESTA mascota, inicios de
 *    franjas reales menos ocupación.
 *  · Peldaño 2 — datos del expediente: la talla y el pelaje del PERFIL
 *    gobiernan el precio (declarados una vez, editables siempre).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Interruptor,
  SelectorOpcion,
  SelectorSegmentado,
  Texto,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerDiasCerradosServicio,
  obtenerIniciosGrooming,
  obtenerMascotasDeFamilia,
  obtenerOfertaGrooming,
  obtenerOfertaGroomingPublica,
  resolverUrlFoto,
  type MascotaResumen,
  type ModalidadGrooming,
  type OfertaGrooming,
  type OfertaGroomingPublica,
  mascotasElegibles,
} from '@epetplace/api';
import { TallaPelajeHoja } from '@/components/talla-pelaje-hoja';
import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { FiltroMascotas } from '@/components/filtro-pills';
import { CabezalOficio, GrillaElegir, PieReserva, SelectorDia } from '@/components/reserva-piezas';
import { vozServicio } from '@/lib/voz-servicio';

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

export default function GroomingCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  // §5: especies elegibles de la DB — la UI filtra, la DB manda.
  // S61-A4: la CARA del para-quién — URLs firmadas (patrón del QUIÉN).
  const [fotos, setFotos] = useState<Record<string, string>>({});
  // S61-A5 cura 3 (letra founder): la oferta PÚBLICA del peldaño 0 —
  // los comprables con su "desde" real, visibles SIN mascota.
  const [ofertaPublica, setOfertaPublica] = useState<OfertaGroomingPublica[] | 'cargando' | 'error'>('cargando');
  // S61-A6 (D-392): la modalidad se elige en el QUÉ — default local.
  const [modalidad, setModalidad] = useState<ModalidadGrooming>('local');
  // ⚠️ r31 · LA MASCOTA VIAJA DESDE EL LOG — y se lee VIVA, no se copia.
  // Es la cura de r15-bis aplicada ANTES de que el defecto ocurra acá:
  // `router.navigate` reusa la ruta montada, el stack de Explorar no se
  // vacía al cambiar de tab, y copiar el param a estado con useState lo
  // congela en el del primer montaje. El param MANDA en cada render; el
  // estado local queda solo para el log vacío y el deep-link sin param.
  const { mascotaId: mascotaParam } = useLocalSearchParams<{ mascotaId?: string }>();
  const paramMascota =
    typeof mascotaParam === 'string' && mascotaParam.trim().length > 0 ? mascotaParam : null;
  const [elegidaLocal, setElegidaLocal] = useState<string | null>(null);
  const mascotaId = paramMascota ?? elegidaLocal;
  const setMascotaId = setElegidaLocal;
  const [tallaHoja, setTallaHoja] = useState(false);
  const [oferta, setOferta] = useState<OfertaGrooming[] | 'cargando' | 'error' | null>(null);
  const [tipoServicio, setTipoServicio] = useState<string | null>(null);
  // ✅ r34 · LOS DÍAS CERRADOS, CABLEADOS. En r31 declaré el hueco (la
  // oferta llega agregada y no nombra prestadores, así que no había a
  // quién preguntarle) y A construyó el lector POR SERVICIO — con la
  // intersección en el MOTOR, que es mejor que mi propuesta: una vez, no
  // en cada pantalla. Semántica: cerrado ⟺ lo declararon TODOS los que
  // ofertan; si uno abre, el día no se apaga.
  const [diasCerrados, setDiasCerrados] = useState<Set<number>>(new Set());
  const [dia, setDia] = useState<string>(fechaLocalISO(new Date()));
  const [inicios, setInicios] = useState<string[] | 'cargando' | 'error'>('cargando');
  const [hora, setHora] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  // S73 (letra de elegibilidad): la frontera UNICA del motor decide —
  // momento vital primero (memorial/perdida NO reservan), especie después.
  // La pantalla jamás re-computa elegibilidad (Ley 37: el filtro artesanal murió).
  const faseEspecies = useEspeciesElegibles('grooming');
  const elegibles = ofrecibles(Array.isArray(mascotas) ? mascotas : [], faseEspecies);

  const mascota = elegibles.find((m) => m.id === mascotaId) ?? null;
  // la pregunta única de §3: sin talla o pelaje no hay precio personal
  const perfilCompleto = mascota !== null && mascota.talla !== null && mascota.pelaje !== null;

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerOfertaGroomingPublica().then((r) => {
        if (vigente) setOfertaPublica(r.ok ? r.data : 'error');
      });
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
      return () => {
        vigente = false;
      };
    }, []),
  );

  // Con UNA elegible, se elige sola (cero fricción); la pregunta de
  // talla salta al quedar elegida (abajo), jamás antes de tiempo.
  useEffect(() => {
    // el default por comodidad rige SOLO sin pedido: con un param
    // explícito la pantalla no elige por el usuario jamás (L-139 — un
    // dato de IDENTIDAD rellenado por conveniencia es el error caro).
    if (paramMascota === null && mascotaId === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
  }, [elegibles, mascotaId]);

  // La puerta de §3: mascota elegida sin talla/pelaje → la Hoja. Se
  // declara UNA vez, queda en el PERFIL, editable siempre.
  useEffect(() => {
    if (mascota !== null && !perfilCompleto) setTallaHoja(true);
  }, [mascota, perfilCompleto]);

  // La oferta personalizada llega RESUELTA del server (jamás cálculo
  // en cliente): recién cuando el perfil está completo.
  useEffect(() => {
    if (mascota === null || !perfilCompleto) {
      setOferta(null);
      return;
    }
    let vigente = true;
    setOferta('cargando');
    void obtenerOfertaGrooming(mascota.id, modalidad).then((r) => {
      if (!vigente) return;
      setOferta(r.ok ? r.data : 'error');
      if (r.ok && r.data.length > 0) {
        setTipoServicio((s) => (s !== null && r.data.some((o) => o.tipo_servicio === s) ? s : r.data[0].tipo_servicio));
      }
    });
    return () => {
      vigente = false;
    };
  }, [mascota, perfilCompleto, modalidad, reintento]);

  // S61-A6: honestidad de modalidad — si la oferta agregada dejó de
  // atender domicilio (dato vivo), la elección vuelve a local.
  useEffect(() => {
    if (modalidad === 'domicilio' && Array.isArray(oferta) && !oferta.some((o) => o.atiende_domicilio)) {
      setModalidad('local');
    }
  }, [oferta, modalidad]);

  // Próximos 14 días (hoy+13) — la tira del paseo, tal cual. `corta` =
  // fecha corta SIEMPRE (S61-A5 cura 1: el botón del día sin lugar).
  const dias = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', {
      weekday: 'short',
      day: 'numeric',
    });
    // el día de semana se pide POR SU PARTE, jamás se recorta del string
    // (en inglés el ICU ordena "30 Thu" y el recorte devuelve el número)
    const partes = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', { weekday: 'short' });
    const lista: Array<{ iso: string; etiqueta: string; corta: string; dow: number; diaCorto: string }> = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = fechaLocalISO(d);
      const corta = fmt.format(d).toLowerCase();
      const etiqueta = i === 0 ? t('explorar.cuandoHoy') : i === 1 ? t('explorar.cuandoManana') : corta;
      lista.push({
        iso,
        etiqueta,
        corta,
        // el dow sale de ESTE Date, que es LOCAL: re-parsear el iso lo
        // leería como medianoche UTC y en UTC-5 correría los cerrados un día
        dow: d.getDay(),
        diaCorto: partes.formatToParts(d).find((x) => x.type === 'weekday')?.value.toLowerCase() ?? '',
      });
    }
    return lista;
  }, [idioma, t]);

  const cerradosISO = useMemo(
    () => new Set(dias.filter((d) => diasCerrados.has(d.dow)).map((d) => d.iso)),
    [dias, diasCerrados],
  );
  const diaElegidoCerrado = cerradosISO.has(dia);

  // S61-A5 cura 1 (§6ter): el día siguiente en la tira, o null en el último.
  const diaSiguiente = useMemo(() => {
    const idx = dias.findIndex((d) => d.iso === dia);
    return idx >= 0 && idx + 1 < dias.length ? dias[idx + 1] : null;
  }, [dias, dia]);

  // La grilla recalcula VIVA — la duración NO viaja: la resuelve el
  // server por groomer (servicio × talla del perfil).
  useEffect(() => {
    if (mascota === null || !perfilCompleto || tipoServicio === null || !Array.isArray(oferta) || oferta.length === 0) return;
    let vigente = true;
    setInicios('cargando');
    void obtenerIniciosGrooming({ fecha: dia, tipo_servicio: tipoServicio, mascota_id: mascota.id, modalidad }).then((r) => {
      if (!vigente) return;
      setInicios(r.ok ? r.data : 'error');
      if (r.ok) setHora((h) => (h !== null && r.data.includes(h) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [dia, tipoServicio, mascota, perfilCompleto, oferta, modalidad, reintento]);

  const servicioElegido = Array.isArray(oferta) ? oferta.find((o) => o.tipo_servicio === tipoServicio) ?? null : null;
  const listo = mascota !== null && tipoServicio !== null && hora !== null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* r31 · EL CABEZAL DEL OFICIO — la banda de color murió en paseo y
          acá nace ya sin ella. `capa` es OBLIGATORIA: grooming es CUIDADO
          (Ley 10) y el tsc obliga a declararlo, que es lo que impide que
          la taxonomía se herede por copiar-pegar. */}
      <CabezalOficio
        oficio="grooming"
        capa="cuidado"
        titulo={t('grooming.titulo')}
        detalle={mascota !== null ? mascota.nombre : null}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />
      <ScrollView contentContainerStyle={{ paddingTop: spacing[5], paddingBottom: spacing[8], gap: spacing[5] }}>
        {mascotas === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        ) : mascotas === 'error' ? (
          <EstadoVacio
            titulo={t('grooming.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setMascotas('cargando')} />}
          />
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
          // §5 con camino: el hogar no tiene mascotas elegibles (perro/gato)
          <EstadoVacio
            icono={<Icono nombre="grooming" tamano={48} />}
            titulo={t('grooming.sinElegiblesTitulo')}
            descripcion={t('grooming.sinElegiblesDetalle')}
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
        ) : (
          <>
            {/* 0 · LA MASCOTA — el precio es SUYO (con una sola, elegida).
                S61-A3 (rasgo 1 de la gramática canónica): el selector se
                pinta SIEMPRE — la mascota elegida queda presente en
                pantalla, no es un paso que se olvida. */}
            {/* ⚠️ r39 · LA HILERA SE OCULTA CUANDO LA MASCOTA YA VIAJÓ.
                NO era doble render (lo medí): grooming la pintaba SIEMPRE,
                por la letra de S61-A3 —"el para-quién VISIBLE, la mascota
                elegida presente en pantalla"—. Esa letra sigue siendo
                buena y HOY LA CUMPLE OTRO: el CABEZAL muestra el nombre
                de la mascota como su detalle. La presencia está; lo que
                sobraba era el CONTROL, que además la volvía re-editable
                en una pantalla donde ya está decidida (Ley 23).
                Sobrevive para el deep-link sin param y el log vacío —
                ahí sí es el eje ⓪ y la precondición de talla lo exige. */}
            {mascota === null ? (
              <View style={{ marginHorizontal: -spacing[4] }}>
                <FiltroMascotas
                  mascotas={elegibles.map((m) => ({ id: m.id, nombre: m.nombre, fotoUrl: fotos[m.id] }))}
                  elegida={mascotaId}
                  onElegir={setMascotaId}
                />
              </View>
            ) : null}

            {mascota === null ? (
              // S61-A5 cura 3 (letra founder): SIN mascota, la oferta se
              // VE igual — comprables con su "desde" real (peldaño 0 de
              // la misma verdad: la tesis "el precio de SU talla" no se
              // contradice, se escalona) + la tira de días; los horarios
              // dicen su porqué CON CAMINO (tap → el paso 0, arriba).
              <>
                {ofertaPublica === 'cargando' ? (
                  <EsqueletoGrupo>
                    <Esqueleto forma="bloque" ancho="100%" alto={56} />
                  </EsqueletoGrupo>
                ) : Array.isArray(ofertaPublica) && ofertaPublica.length > 0 ? (
                  <View style={{ gap: spacing[2], paddingHorizontal: spacing[5] }}>
                    <SelectorSegmentado
                      // r38-bis · `proposito="eleccion"`: B terminó la
                      // pieza (r37) y acá se consume en su modo correcto.
                      // Sin esto el control queda en 'vista', que es el
                      // default para los consumidores viejos — y este eje
                      // NO cambia de vista: ELIGE PRODUCTO. El modo trae
                      // la pata y el magenta; el rol deja de mentir.
                      proposito="eleccion"
                      etiqueta={t('grooming.servicioEtiqueta')}
                      segmentos={ofertaPublica.map((o) => ({
                        codigo: o.tipo_servicio,
                        etiqueta: vozServicio(t, o.tipo_servicio) ?? o.tipo_servicio,
                      }))}
                      activo={tipoServicio ?? ''}
                      onCambio={setTipoServicio}
                    />
                    {(() => {
                      const elegida = ofertaPublica.find((o) => o.tipo_servicio === tipoServicio) ?? null;
                      return elegida !== null ? (
                        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                          {t('grooming.precioDesdePublico', { precio: elegida.desde_precio.toFixed(2) })}
                        </Text>
                      ) : null;
                    })()}
                  </View>
                ) : null}

                <View style={{ gap: spacing[2] }}>
                  <View style={{ paddingHorizontal: spacing[5] }}>
                    <Texto variante="apoyo">{t('explorar.cuandoDia')}</Texto>
                  </View>
                  {/* 🔴 DÍAS CERRADOS: NO VIAJAN A GROOMING, y no es olvido.
                      `obtenerDiasCerrados` es POR PRESTADOR y la oferta de
                      grooming llega AGREGADA (desde_precio/varia) — no
                      nombra a los prestadores, así que la intersección que
                      paseo hace no se puede computar acá. Se declara y no
                      se inventa: la prop queda lista para cuando exista el
                      lector. Pedido a A, secuenciado. */}
                  <SelectorDia
                    dias={dias.map((d) => ({ iso: d.iso, dia: d.diaCorto, numero: d.iso.slice(8, 10) }))}
                    elegido={dia}
                    cerrados={cerradosISO}
                    etiquetaCerrado={t('explorar.cuandoDiaCerrado')}
                    onElegir={setDia}
                  />
                </View>

                {/* S73 hallazgo founder: el botón-scroll MURIÓ (control
                    muerto — el selector queda en pantalla en los
                    viewports reales, ~3 bloques arriba; la voz del
                    detalle ya apunta a él: "Elígela arriba…"). */}
                <EstadoVacio
                  registro="seccion"
                  titulo={t('grooming.horariosSinMascotaTitulo')}
                  descripcion={t('grooming.horariosSinMascotaDetalle')}
                />
              </>
            ) : !perfilCompleto ? (
              // la Hoja está abierta; si la cerró sin declarar, la
              // invitación honesta queda con su camino (jamás precio
              // adivinado, jamás final mudo)
              <EstadoVacio
                registro="seccion"
                titulo={t('grooming.tallaFaltaTitulo')}
                descripcion={t('grooming.tallaFaltaDetalle', { nombre: mascota.nombre })}
                accion={<Boton variante="primario" etiqueta={t('grooming.tallaDeclarar')} onPress={() => setTallaHoja(true)} />}
              />
            ) : oferta === 'cargando' || oferta === null ? (
              <EsqueletoGrupo>
                <View style={{ gap: spacing[3] }}>
                  <Esqueleto forma="bloque" ancho="100%" alto={56} />
                  <Esqueleto forma="bloque" ancho="100%" alto={100} />
                </View>
              </EsqueletoGrupo>
            ) : oferta === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('grooming.errorTitulo')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
              />
            ) : oferta.length === 0 ? (
              // Peldaño 0 — sin groomers cobrables con oferta activa.
              <EstadoVacio
                icono={<Icono nombre="grooming" tamano={48} />}
                titulo={t('grooming.vacioTitulo')}
                descripcion={t('grooming.vacioDetalle')}
              />
            ) : (
              <>
                {/* 1 · EL SERVICIO — los dos comprables del menú (§1),
                    con el "desde" YA resuelto por la talla del perfil */}
                <View style={{ gap: spacing[2], paddingHorizontal: spacing[5] }}>
                  <SelectorSegmentado
                      // r38-bis · `proposito="eleccion"`: B terminó la
                      // pieza (r37) y acá se consume en su modo correcto.
                      // Sin esto el control queda en 'vista', que es el
                      // default para los consumidores viejos — y este eje
                      // NO cambia de vista: ELIGE PRODUCTO. El modo trae
                      // la pata y el magenta; el rol deja de mentir.
                      proposito="eleccion"
                    etiqueta={t('grooming.servicioEtiqueta')}
                    segmentos={oferta.map((o) => ({
                      codigo: o.tipo_servicio,
                      etiqueta: vozServicio(t, o.tipo_servicio) ?? o.tipo_servicio,
                    }))}
                    activo={tipoServicio ?? ''}
                    onCambio={setTipoServicio}
                  />
                  {servicioElegido !== null ? (
                    <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                      {servicioElegido.varia
                        ? t('grooming.precioDesde', { nombre: mascota.nombre, precio: servicioElegido.desde_precio.toFixed(2) })
                        : t('grooming.precioExacto', { nombre: mascota.nombre, precio: servicioElegido.desde_precio.toFixed(2) })}
                    </Text>
                  ) : null}
                </View>

                {/* 1b · EL DÓNDE (S61-A6, D-392): la modalidad se elige
                    junto al servicio — SOLO si la oferta agregada tiene
                    AMBAS (groomer con una sola = no se pregunta y la
                    cita la porta igual). El recargo se DECLARA en el
                    chip (el mínimo real entre groomers con domicilio). */}
                {oferta.some((o) => o.atiende_domicilio) && oferta.some((o) => o.atiende_local) ? (
                  /* ⚠️ r34 · INTERRUPTOR REAL, no dos opciones. El par
                     local/domicilio NO son dos alternativas simétricas:
                     LOCAL es el default del oficio y domicilio es un
                     AGREGADO que se PRENDE y que cuesta más. Dos chips
                     mienten sobre eso — presentan como equivalentes lo
                     que no lo es, y obligan a elegir algo que ya está
                     elegido. El interruptor dice la verdad de la
                     estructura: hay un estado normal y uno que sumás.
                     El recargo se DECLARA en el detalle, con su "desde"
                     cuando varía (S61-A13: cero número exacto sobre un
                     agregado que miente). */
                  <View style={{ paddingHorizontal: spacing[5], gap: spacing[1] }}>
                    <Interruptor
                      etiqueta={t('grooming.modalidadDomicilio')}
                      encendido={modalidad === 'domicilio'}
                      onCambio={(v) => setModalidad(v ? 'domicilio' : 'local')}
                    />
                    {/* el recargo va AL LADO y no adentro: `Interruptor` no
                        tiene slot de detalle (medido, no supuesto) y no se
                        le inventa uno desde una pantalla. */}
                    {(() => {
                      const o = servicioElegido ?? oferta[0];
                      const recargo = o?.recargo_domicilio_desde ?? null;
                      if (recargo === null || recargo <= 0) return null;
                      return (
                        <Texto variante="apoyo">
                          {o?.recargo_domicilio_varia
                            ? t('grooming.modalidadDomicilioRecargoDesde', { recargo: recargo.toFixed(2) })
                            : t('grooming.modalidadDomicilioRecargo', { recargo: recargo.toFixed(2) })}
                        </Texto>
                      );
                    })()}
                  </View>
                ) : null}

                {/* 2 · DÍA — la tira horizontal (hoy+13) */}
                <View style={{ gap: spacing[2] }}>
                  <View style={{ paddingHorizontal: spacing[5] }}>
                    <Texto variante="apoyo">{t('explorar.cuandoDia')}</Texto>
                  </View>
                  {/* 🔴 DÍAS CERRADOS: NO VIAJAN A GROOMING, y no es olvido.
                      `obtenerDiasCerrados` es POR PRESTADOR y la oferta de
                      grooming llega AGREGADA (desde_precio/varia) — no
                      nombra a los prestadores, así que la intersección que
                      paseo hace no se puede computar acá. Se declara y no
                      se inventa: la prop queda lista para cuando exista el
                      lector. Pedido a A, secuenciado. */}
                  <SelectorDia
                    dias={dias.map((d) => ({ iso: d.iso, dia: d.diaCorto, numero: d.iso.slice(8, 10) }))}
                    elegido={dia}
                    cerrados={cerradosISO}
                    etiquetaCerrado={t('explorar.cuandoDiaCerrado')}
                    onElegir={setDia}
                  />
                </View>

                {/* 2b · GRILLA de inicios reales — la duración la puso
                    cada groomer (servicio × talla), jamás el dueño */}
                {inicios === 'cargando' ? (
                  <EsqueletoGrupo>
                    <Esqueleto forma="bloque" ancho="100%" alto={100} />
                  </EsqueletoGrupo>
                ) : inicios === 'error' ? (
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('grooming.errorTitulo')}
                    accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
                  />
                ) : inicios.length === 0 ? (
                  // §6ter (S61-A5 cura 1): camino tocable — espejo del paseo.
                  <EstadoVacio
                    registro="seccion"
                    titulo={diaElegidoCerrado ? t('explorar.cuandoDiaCerrado') : t('grooming.sinInicios')}
                    descripcion={diaElegidoCerrado ? t('explorar.cuandoDiaCerradoPorque') : undefined}
                    accion={
                      diaSiguiente !== null ? (
                        <Boton
                          variante="compacto"
                          etiqueta={t('explorar.sinIniciosProbarDia', { dia: diaSiguiente.corta })}
                          onPress={() => setDia(diaSiguiente.iso)}
                        />
                      ) : undefined
                    }
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

              </>
            )}
          </>
        )}
      </ScrollView>

      {/* r34 · EL PIE, COMO PASEO: precio a la izquierda con su "desde",
          CTA a la derecha, fijo. La escalera del precio (S61-A13) manda:
          el exacto no existe hasta elegir groomer. */}
      {Array.isArray(mascotas) && elegibles.length > 0 && servicioElegido !== null ? (
        <PieReserva
          total={`$ ${servicioElegido.desde_precio.toFixed(2)}`}
          totalDesde={servicioElegido.varia}
          cuando={hora !== null ? `${dias.find((d) => d.iso === dia)?.corta ?? ''} · ${hora}` : null}
          etiqueta={t('explorar.verQuienPuede')}
          habilitado={listo}
          onPress={() => {
            if (!listo || mascota === null) return;
            router.push({
              pathname: '/explorar/grooming/disponibles',
              params: { fecha: dia, hora, tipoServicio, mascotaId: mascota.id, modalidad },
            });
          }}
          insetBottom={insets.bottom}
        />
      ) : null}

      {/* §3 — la pregunta única: se declara UNA vez, queda en el PERFIL,
          editable siempre; declarar SIEMPRE continúa */}
      <TallaPelajeHoja
        visible={tallaHoja}
        mascota={mascota}
        onCerrar={() => setTallaHoja(false)}
        onDeclarada={(talla, pelaje) => {
          setMascotas((prev) =>
            Array.isArray(prev) ? prev.map((m) => (m.id === mascota?.id ? { ...m, talla, pelaje } : m)) : prev,
          );
          setTallaHoja(false);
        }}
      />
    </View>
  );
}
