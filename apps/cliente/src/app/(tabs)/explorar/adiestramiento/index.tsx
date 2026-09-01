/**
 * ADIESTRAMIENTO — EL CUÁNDO (S63-A Bloque 3, MODELO_ADIESTRAMIENTO v1.1
 * §1/§8/§12.2 sobre el esqueleto del CUÁNDO del grooming S60-A1).
 * Gramática canónica v1.8: MASCOTA → QUÉ → DÍA → HORA. La diferencia de
 * fondo con sus hermanas: en el QUÉ vive SESIÓN-O-PROGRAMA (§8) — el
 * dueño elige la FORMA antes de ver adiestradores, y si elige programa,
 * la voz honesta le dice ACÁ que las sesiones se agendan solas a
 * cadencia semanal desde la fecha que elija (jamás lo descubre después).
 * Sin talla (el precio del oficio no varía por tamaño) y sin selector
 * de modalidad (default único del chasis — el trazado es S64-B0).
 *
 * TESIS: "Elegís qué forma de aprender —una sesión o el camino
 * completo— y cuándo empieza."
 * FIRMA: la voz honesta del programa (todas-al-comprar dicho ANTES del
 * precio) — comportamiento, no color.
 *
 * ESCALERA (§4b): peldaño 0 = sin adiestradores cobrables, vacío
 * honesto · peldaño 1 = inicios REALES (franjas menos ocupación, con la
 * duración del comprable) · peldaño 2 = la especie del PERFIL filtra
 * (guard mascota_no_elegible, hoy solo perros §2).
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
  SelectorOpcion,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  TIPO_ADIESTRAMIENTO,
  obtenerDiasCerradosServicio,
  obtenerOfertaAdiestramientoPublica,
  obtenerIniciosAdiestramiento,
  obtenerMascotasDeFamilia,
  resolverUrlFoto,
  type MascotaResumen,
  type OfertaAdiestramientoPublica,
  mascotasElegibles,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { FiltroMascotas } from '@/components/filtro-pills';
import { CabezalOficio, GrillaElegir, PieReserva, SelectorDia } from '@/components/reserva-piezas';

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

export default function AdiestramientoCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  // §2: especies elegibles de la DB — la UI filtra, la DB manda.
  const [fotos, setFotos] = useState<Record<string, string>>({});
  // ⚠️ r33 · LA MASCOTA VIAJA DESDE EL LOG y NO se vuelve a preguntar
  // (Ley 23: la puerta no pregunta lo que ya sabe). Se LEE VIVA, no se
  // copia: `router.navigate` reusa la ruta montada y `useState(param)`
  // la congelaría en la del primer montaje — el defecto de r15-bis,
  // cortado antes de que ocurra. El estado local sobrevive SOLO para el
  // deep-link sin param y el log vacío.
  const { mascotaId: mascotaParam } = useLocalSearchParams<{ mascotaId?: string }>();
  const paramMascota =
    typeof mascotaParam === 'string' && mascotaParam.trim().length > 0 ? mascotaParam : null;
  const [elegidaLocal, setElegidaLocal] = useState<string | null>(null);
  const mascotaId = paramMascota ?? elegidaLocal;
  const setMascotaId = setElegidaLocal;
  /* ☠️ **`comprable` MURIÓ** con el paso del QUÉ (ver la lápida en el render).
     La elección pasó a la vitrina, que es donde la familia ya sabe con quién. */
  // ✅ r34 · LOS DÍAS CERRADOS, CABLEADOS con el lector POR SERVICIO de A
  // (el hueco que declaré en r32: los inicios llegan agregados y no
  // nombran prestadores). La intersección vive en el MOTOR: cerrado ⟺ lo
  // declararon TODOS los que ofertan; si uno abre, el día no se apaga.
  const [diasCerrados, setDiasCerrados] = useState<Set<number>>(new Set());
  // r44 · el "desde" del catálogo, por comprable (lector público de A)
  const [ofertaPublica, setOfertaPublica] = useState<OfertaAdiestramientoPublica[]>([]);

  useEffect(() => {
    let vigente = true;
    void obtenerOfertaAdiestramientoPublica().then((r) => {
      if (vigente && r.ok) setOfertaPublica(r.data);
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    void obtenerDiasCerradosServicio(TIPO_ADIESTRAMIENTO).then((r) => {
      // el fallo no se guarda como "no cierra" (Ley 13)
      if (vigente && r.ok) setDiasCerrados(new Set(r.data.dias));
    });
    return () => {
      vigente = false;
    };
  }, []);
  const [dia, setDia] = useState<string>(fechaLocalISO(new Date()));
  const [inicios, setInicios] = useState<string[] | 'cargando' | 'error'>('cargando');
  const [hora, setHora] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  // S73 (letra de elegibilidad): la frontera UNICA del motor decide —
  // momento vital primero (memorial/perdida NO reservan), especie después.
  // La pantalla jamás re-computa elegibilidad (Ley 37: el filtro artesanal murió).
  const faseEspecies = useEspeciesElegibles('adiestramiento');
  const elegibles = ofrecibles(Array.isArray(mascotas) ? mascotas : [], faseEspecies);

  const mascota = elegibles.find((m) => m.id === mascotaId) ?? null;

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
      return () => {
        vigente = false;
      };
    }, []),
  );

  // Con UNA elegible, se elige sola (cero fricción — patrón de la casa).
  useEffect(() => {
    if (mascotaId === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
  }, [elegibles, mascotaId]);

  // Próximos 14 días — la tira del paseo/grooming, tal cual. Para el
  // PROGRAMA la fecha es la de la PRIMERA sesión (§12.2) y arranca
  // desde mañana (el motor rebota hoy: slot_en_pasado).
  const dias = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', {
      weekday: 'short',
      day: 'numeric',
    });
    /* ⭐ **ARRANCA HOY, y eso es lo PERMISIVO, no lo descuidado.**
       ⏪ Con el QUÉ vivo, elegir «programa» hacía `desde = 1` porque el motor
       rebota un programa que empieza hoy (`slot_en_pasado`, §12.2). Sin el QUÉ
       no se sabe todavía qué se va a contratar — *y recortar el día de hoy para
       todos, por una restricción que sólo aplica a una de las dos cosas, le
       quitaría a la sesión suelta un día que sí puede tener.*
       🔴 **El borde del programa se cubre donde se elige, no acá:** la barra de
       la vitrina no ofrece programas cuando la fecha es hoy. */
    const desde = 0;
    const partes = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', { weekday: 'short' });
    const lista: Array<{ iso: string; etiqueta: string; corta: string; dow: number; diaCorto: string }> = [];
    for (let i = desde; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = fechaLocalISO(d);
      const corta = fmt.format(d).toLowerCase();
      const etiqueta = i === 0 ? t('explorar.cuandoHoy') : i === 1 ? t('explorar.cuandoManana') : corta;
      lista.push({
        iso,
        etiqueta,
        corta,
        // dow del Date LOCAL (re-parsear el iso corre el día en UTC-5) y
        // el día corto POR SU PARTE (en inglés el ICU ordena "30 Thu")
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

  // si el cambio de comprable dejó el día fuera de la tira (programa
  // arranca mañana), el día se corrige solo
  useEffect(() => {
    if (!dias.some((d) => d.iso === dia)) setDia(dias[0].iso);
  }, [dias, dia]);

  const diaSiguiente = useMemo(() => {
    const idx = dias.findIndex((d) => d.iso === dia);
    return idx >= 0 && idx + 1 < dias.length ? dias[idx + 1] : null;
  }, [dias, dia]);

  // La grilla recalcula VIVA con la duración del COMPRABLE (sesión =
  // oferta; programa = su sesión) — la resuelve el server, jamás viaja.
  useEffect(() => {
    if (mascota === null) return;
    let vigente = true;
    setInicios('cargando');
    /* Sin comprable = **los dos**. El motor ya lo admitía (`p_comprable DEFAULT
       NULL`); era el wrapper el que lo pedía obligatorio y volvía inexpresable
       la pregunta. */
    void obtenerIniciosAdiestramiento(dia, mascota.id).then((r) => {
      if (!vigente) return;
      setInicios(r.ok ? r.data : 'error');
      if (r.ok) setHora((h) => (h !== null && r.data.includes(h) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [dia, mascota, reintento]);

  /** El piso real de las dos formas. `null` si el catálogo todavía no llegó. */
  const precioDesde = useMemo(() => {
    const precios = ofertaPublica
      .map((o) => o.desde_precio)
      .filter((x): x is number => typeof x === 'number');
    return precios.length === 0 ? null : Math.min(...precios);
  }, [ofertaPublica]);

  const listo = mascota !== null && hora !== null;

  return (
    /* el SafeAreaView murió: el cabezal ABSORBE el inset superior
       (insetTop) y dejar los dos duplicaba el aire de arriba — el mismo
       cambio que en paseo y grooming. */
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <CabezalOficio
        oficio="training"
        capa="cuidado"
        titulo={t('adiestramiento.titulo')}
        detalle={mascota !== null ? mascota.nombre : null}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[5] }}>
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
            titulo={t('adiestramiento.errorTitulo')}
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
          // §2 con camino: hoy solo perros — el vacío invita a actuar
          <EstadoVacio
            icono={<Icono nombre="training" tamano={48} />}
            titulo={t('adiestramiento.sinElegiblesTitulo')}
            descripcion={t('adiestramiento.sinElegiblesDetalle')}
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
            {/* 0 · LA MASCOTA — presente en pantalla siempre (rasgo 1
                de la gramática canónica) */}
            {/* ⚠️ r35 · EL SALVAVIDAS DESAPARECE AL ELEGIR — la decisión del
                founder sobre cuál de los dos comportamientos es el correcto,
                resuelta por SIGNIFICADO y no por mayoría: en el LOG los chips
                FILTRAN, y un filtro se queda porque se puede cambiar; en el
                SALVAVIDAS IDENTIFICAN, y una identificación se cierra cuando
                se dio (Ley 23: la puerta no pregunta lo que ya sabe). Paseo,
                grooming y veterinaria ya lo hacían; adiestramiento era el que
                estaba mal.
                Y sus chips son los NUEVOS desde r34 — este camino conservaba
                los viejos porque nadie lo recorre: un resto no sobrevive por
                difícil, sobrevive por INVISIBLE. */}
            {mascota === null ? (
              <View style={{ marginHorizontal: -spacing[4] }}>
              <FiltroMascotas
                mascotas={elegibles.map((m) => ({
                    id: m.id,
                    nombre: m.nombre,
                    // S91-C · LA ESCALERA DE LA CARA, reusada del Hogar: foto
                    // propia → imagen de su RAZA → genérico de su especie. El
                    // chip salía pelado porque se quedaba en el primer escalón,
                    // y `raza_ruta_imagen` (A6) tenía UN solo consumidor.
                    fotoUrl: caraDeMascotaPorRuta({
                      especie: m.especie,
                      rutaImagen: m.raza_ruta_imagen,
                      fotoUri: fotos[m.id],
                    }),
                  }))}
                elegida={mascotaId}
                onElegir={setMascotaId}
              />
            </View>
            ) : null}

            {/* ☠️ **S109-C · ACÁ VIVÍA EL QUÉ — sesión-o-programa. MUERTO POR
                FIRMA DEL FOUNDER.**

                🔴 *Preguntar sesión-o-programa ANTES de ver quién puede es un
                filtro que ya no filtra nada, y contradice la regla que ordena el
                oficio: primero el quién.* Desde que la lista agrupa por
                adiestrador, **un adiestrador con las dos cosas es un prestador
                con tres ofertas** — y esta pregunta le pedía a la familia
                decidir algo que todavía no puede saber.

                ⭐ Lo que reemplaza al selector no es otro control: **es la
                vitrina**, que muestra lo que ese adiestrador ofrece y deja
                elegir ahí. *Un paso que se quita porque el siguiente lo hace
                mejor no deja hueco.*

                ☠️ Con él murieron `comprable`, su estado, su voz de programa y
                el `SelectorSegmentado` de esta pantalla. */}

            {/* 2 · DÍA — la rueda (programa: desde mañana, §12.2).
                🔴 Y ACÁ VIVE EL DEFECTO MÁS CARO POSIBLE DE ESTA PANTALLA,
                cortado en su raíz: **con programa, el día no es cuándo ES
                — es cuándo EMPIEZA**. Alguien que elige jueves 6 creyendo
                que reserva una clase y compra OCHO es exactamente el daño
                que no se puede permitir.
                La voz honesta ya lo dice arriba, en el QUÉ ("eliges la
                fecha y hora de la primera y las demás se agendan solas") —
                pero decirlo ANTES no alcanza si en el momento de elegir el
                rótulo dice "Día" como en cualquier reserva puntual. EL
                RÓTULO CAMBIA CON EL COMPRABLE: el significado se dice
                DONDE se decide, no solo donde se explica. */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="apoyo">
                  {/* La voz genérica: sin el QUÉ no se sabe si es la fecha de
                      una sesión o el arranque de un programa. *Decir «cuándo
                      empieza» sobre algo que puede ser una sesión suelta sería
                      afirmar un compromiso que la familia no tomó.* */}
                  {t('explorar.cuandoDia')}
                </Texto>
              </View>
              {/* 🔴 DÍAS CERRADOS: NO VIAJAN — mismo bloqueo que grooming,
                  medido: `obtenerDiasCerrados` es POR PRESTADOR y acá los
                  inicios llegan AGREGADOS (`obtenerIniciosAdiestramiento`
                  no nombra prestadores; cero prestador_id en la pantalla).
                  La intersección de paseo no se puede computar. Se declara
                  y no se inventa; la prop queda lista. */}
              <SelectorDia
                dias={dias.map((d) => ({ iso: d.iso, dia: d.diaCorto, numero: d.iso.slice(8, 10) }))}
                elegido={dia}
                cerrados={cerradosISO}
                etiquetaCerrado={t('explorar.cuandoDiaCerrado')}
                onElegir={setDia}
              />
            </View>

            {/* 2b · GRILLA de inicios reales del comprable */}
            {mascota === null ? null : inicios === 'cargando' ? (
              <EsqueletoGrupo>
                <Esqueleto forma="bloque" ancho="100%" alto={100} />
              </EsqueletoGrupo>
            ) : inicios === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('adiestramiento.errorTitulo')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
              />
            ) : inicios.length === 0 ? (
              // §6ter heredado: camino tocable, jamás final mudo
              <EstadoVacio
                registro="seccion"
                titulo={diaElegidoCerrado ? t('explorar.cuandoDiaCerrado') : t('adiestramiento.sinInicios')}
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
                  <Texto variante="apoyo">
                    {t('explorar.cuandoHora')}
                  </Texto>
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
      </ScrollView>

      {/* rasgo 2 de la gramática: CTA abajo, FIJO, una sola primaria */}
      {/* ✅ r44 · EL PIE CON SU PRECIO — las dos líneas que el pedido
          dejó preparadas, ahora que A construyó el lector público
          (`obtener_oferta_adiestramiento_publica`). Hasta r43 iba con
          `total={null}` porque el precio NO EXISTÍA en esta pantalla: su
          único lector de oferta era del PRESTADOR, keyed por su id, y el
          dueño no conoce prestador en este paso.
          ⚠️ EL CASO SIN PRECIO SE RESUELVE POR AUSENCIA, no por null: A
          eligió OMITIR del array el comprable sin oferta activa, y es más
          seguro que devolver null — una fila que no existe no se puede
          leer mal. Acá se traduce igual: sin fila, `total` va null y el
          pie no dibuja monto. Nunca un "$ 0,00", que sería el
          verosímil-falso de L-139: un número plausible que miente.
          VERIFICADO CONTRA LA RESPUESTA REAL del RPC y no contra el tipo
          —que es lo que dije que iba a mirar—: dos filas, CERO ceros,
          CERO nulls, `varia` false en sesión (precio exacto) y true en
          programa (dice "desde"). */}
      {Array.isArray(mascotas) && elegibles.length > 0 ? (
        <PieReserva
          /* ⭐ **EL «DESDE» ES EL MÍNIMO DE LAS DOS FORMAS**, no el de la que
             el QUÉ hubiera elegido. *Con sesión y programas juntos, el número
             que hace verdadero un «desde» es el más chico que la familia puede
             llegar a pagar* — mostrar el del programa sobre una lista que
             incluye la sesión suelta diría un piso que no es el piso.
             🔴 Y `varia` es `true` en cuanto hay MÁS DE UNA forma: con dos
             precios distintos el número deja de ser el precio y pasa a ser un
             punto de partida. */
          total={precioDesde !== null ? `$ ${precioDesde.toFixed(2)}` : null}
          totalDesde={ofertaPublica.length > 1 || ofertaPublica.some((o) => o.varia)}
          cuando={hora !== null ? `${dias.find((d) => d.iso === dia)?.corta ?? ''} · ${hora}` : null}
          etiqueta={t('explorar.verQuienPuede')}
          habilitado={listo}
          onPress={() => {
            if (!listo || mascota === null || hora === null) return;
            router.push({
              pathname: '/explorar/adiestramiento/disponibles',
              /* ☠️ `comprable` ya no viaja: la lista muestra a cada adiestrador
                 con todo lo que ofrece, y la elección vive en su vitrina. */
              params: { fecha: dia, hora, mascotaId: mascota.id, mascotaNombre: mascota.nombre },
            });
          }}
          insetBottom={insets.bottom}
        />
      ) : null}
    </View>
  );
}
