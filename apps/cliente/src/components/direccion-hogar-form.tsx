/**
 * Formulario de la dirección del HOGAR (S56-A, D-339; S79-A4 gana
 * Places; **S96-D gana EL PUNTO EN EL MAPA** — LETRA_RECORRIDO §7) —
 * compartido por la pantalla Cuenta·Tu dirección y la Hoja del checkout
 * (la captura es UNA, jamás dos formularios que diverjan).
 * Presentacional + guardar: el padre decide qué pasa después.
 *
 * TESIS: tu dirección comunica que el cuidado llega a TU puerta.
 * FIRMA (S96): EL PUNTO MOVIBLE — *"Places falla en Quito más de lo que
 * uno espera: urbanizaciones nuevas, casas sin numeración. Si Places no
 * encuentra la casa, el punto igual existe."* El mapa se mueve y el pin
 * ES el centro (`PinMovible` de B); la coordenada que se guarda es la
 * que el dueño VE.
 *
 * LA LEY DEL PUNTO (enmienda S96 a la ley del contrato S79 §2.2):
 * antes, la coordenada moría con el texto que la parió (editar a mano
 * mataba lat/lon). Con el pin VISIBLE eso cambia de naturaleza: el punto
 * ya no es un dato escondido que envejece en silencio — está en el mapa,
 * el dueño lo ve y lo puede mover. Editar el texto sigue matando el
 * estado "resuelta por Places" (la resolución es de ESE texto), pero el
 * PUNTO persiste: es verdad puesta a mano, no derivada. El modo de falla
 * que la ley S79 cerraba (coordenada invisible y vieja) no existe más,
 * porque la coordenada dejó de ser invisible.
 *
 * `exigirPunto` (checkout de la despensa): sin punto no se guarda, y el
 * porqué SE DICE. En Cuenta sigue opcional — exigirlo ahí cambiaría un
 * flujo ya gateado, y esa decisión es del founder, no de esta tanda.
 *
 * Si Places no está configurado o la red falla mientras se tipea, el
 * formulario degrada EN SILENCIO a captura manual (Ley 23) — con el
 * botón de poner el punto a mano como camino al mapa.
 */

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  BuscadorDeLugar,
  Campo,
  PinMovible,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import {
  buscarLugares,
  crearSesionLugares,
  guardarDireccionConAlias,
  guardarDireccionHogar,
  resolverLugar,
  type DireccionHogar,
  type LugarResuelto,
  type PrediccionLugar,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** El arranque del pin a mano cuando no hay NINGUNA coordenada: el centro
 *  de Quito (la cobertura v1 — S95). No es un dato inventado que se
 *  guarde solo: es la semilla del mapa, y guardar exige que el dueño lo
 *  haya visto (el pin es el centro de lo que está mirando). */
const SEMILLA_QUITO = { lat: -0.1807, lon: -78.4678 };

export function DireccionHogarForm({
  inicial,
  onGuardada,
  exigirPunto = false,
  conAlias = false,
  aliasInicial = '',
  direccionId = null,
}: {
  inicial: DireccionHogar | null;
  onGuardada: (direccion: DireccionHogar) => void;
  /** §7 de la letra S96: en el checkout de la despensa el punto es
   *  OBLIGATORIO. Default false: Cuenta no cambia sin su propio gate. */
  exigirPunto?: boolean;
  /**
   * 🔴 S100c · MODO LIBRETA — «Oficina», «Casa de mamá», además del hogar.
   *
   * `false` (default) = el formulario de SIEMPRE: escribe LA principal por
   * `guardar_direccion_hogar`. **Ningún consumidor existente se mueve.**
   * `true` = pide un nombre y escribe por `guardar_direccion_con_alias`, que
   * **nunca** pone `es_principal` ⇒ guardar una oficina no puede desplazar al
   * hogar ni por error de llamada.
   *
   * *Se hizo con una bandera y no con un formulario nuevo porque la captura
   * es UNA en toda la casa (S79): dos formularios de dirección divergen, y el
   * día que divergen la mitad de la gente pone el punto y la otra mitad no.*
   */
  conAlias?: boolean;
  aliasInicial?: string;
  /** Presente = EDITA esa dirección de la libreta; ausente = crea una. */
  direccionId?: string | null;
}) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [direccion, setDireccion] = useState(inicial?.direccion ?? '');
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? 'Quito');
  const [sector, setSector] = useState(inicial?.sector ?? '');
  const [referencias, setReferencias] = useState(inicial?.referencias ?? '');
  const [guardando, setGuardando] = useState(false);
  const [alias, setAlias] = useState(aliasInicial);

  // ── Places (S79-A4) ──────────────────────────────────────────────
  const [lugar, setLugar] = useState<LugarResuelto | null>(
    inicial && inicial.lat !== null && inicial.lon !== null
      ? {
          placeId: '',
          direccion: inicial.direccion,
          ciudad: inicial.ciudad,
          lat: inicial.lat,
          lon: inicial.lon,
        }
      : null,
  );
  const [predicciones, setPredicciones] = useState<PrediccionLugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  /** true SOLO cuando una búsqueda real volvió vacía — el "no encontró"
   *  jamás se muestra antes de haber buscado (aviso de B: cargando no es
   *  sin-resultados; el error contrario mandaba al mapa a alguien cuya
   *  dirección sí existía). */
  const [busquedaVacia, setBusquedaVacia] = useState(false);
  const sesionRef = useRef<string>(crearSesionLugares());
  const placesApagado = useRef(false);
  const resolviendo = useRef(false);
  /**
   * 🔴 A-03 (S100c) · EL APAGADO DEJA DE SER SILENCIOSO.
   *
   * El founder: *«hoy se escribe la dirección a mano y no aparece ningún
   * autocompletado»*. **Places SÍ está cableado** (S79-A4) — lo que no estaba
   * era la voz: con `sin_configuracion` el formulario levantaba
   * `placesApagado` y **no volvía a intentar nunca**, sin decir una palabra.
   * Desde la pantalla eso se ve exactamente igual que «no encontré nada» y que
   * «todavía estoy buscando»: **una misma pinta para tres estados**, que es
   * L-218 en la puerta de la dirección.
   *
   * La degradación a mano SE CONSERVA (Ley 23, y es correcta: la dirección se
   * puede escribir). Lo que cambia es que **se dice**.
   *
   * ⚠️ Solo habla el apagado PERMANENTE. Un fallo de red mientras se tipea
   * sigue en silencio a propósito: *avisar en cada tecla enseña a ignorar los
   * avisos*, y ese error sí se cura solo en la tecla siguiente.
   */
  const [buscadorApagado, setBuscadorApagado] = useState(false);

  // ── EL PUNTO (S96 · §7) ──────────────────────────────────────────
  const [punto, setPunto] = useState<{ lat: number; lon: number } | null>(
    inicial && inicial.lat !== null && inicial.lon !== null
      ? { lat: inicial.lat, lon: inicial.lon }
      : null,
  );

  /**
   * 🔴 S100d·bis · LO QUE PLACES RESOLVIÓ, aparte del punto final.
   *
   * Nace `null` al abrir sobre una dirección existente **a propósito**: no
   * sabemos con qué se guardó, y **inventarlo copiando `punto` haría la
   * auditoría siempre verde** — peor que no tenerla. Solo se puebla cuando
   * Places resuelve EN ESTA sesión del formulario.
   */
  const [puntoPlaces, setPuntoPlaces] = useState<{ lat: number; lon: number } | null>(null);
  const [placesId, setPlacesId] = useState<string | null>(null);

  /**
   * 🔴 S100d·bis · AL ENTRAR NO HAY CAMPO DE TEXTO — y esto ELIMINA LA CLASE.
   *
   * Founder, verbatim: *«para poder guardar dirección o agregar otra me toca
   * tocar el mapa, y literalmente me desacomoda la dirección; me toca volver a
   * subir y volver a escribirla SI ME DI CUENTA. **Si no me di cuenta, no
   * pasa**»*. ⇒ **se guardaba una dirección distinta de la elegida sin que la
   * persona se enterara**, que es lo peor que puede pasar en una pantalla de
   * entrega.
   *
   * ── LA CAUSA, y por qué mover botones NO alcanzaba ────────────────────
   * El mapa vivía EN MEDIO del formulario que scrollea. Para llegar a los
   * botones de abajo había que arrastrar **sobre el mapa** — y arrastrar el
   * mapa **mueve el punto**, porque el pin ES el centro (`PinMovible`).
   * *El gesto de navegar y el gesto de editar eran el mismo gesto.*
   *
   * ── LA CURA FIRMADA: que no haya nada que tocar sin pedirlo ───────────
   * `false` = el formulario abre **en lectura**, con la dirección mostrada y
   * dos acciones. El campo aparece **solo si se pide cambiarla**, y el mapa
   * **solo si se pide ajustar el punto**.
   *
   * 🔴 **Un mapa que no está no puede comerse el scroll.** Por eso esto elimina
   * la clase entera en vez de parchear un caso: no hay orden de botones que
   * arregle un mapa que intercepta el gesto, y sí hay un mapa ausente que no
   * intercepta nada.
   *
   * ⚠️ Al CREAR (sin `inicial`) abre en edición: no se puede crear una
   * dirección sin escribirla, y obligar a un toque extra ahí sería ceremonia.
   */
  const [editandoTexto, setEditandoTexto] = useState(
    inicial === null || inicial.direccion.trim() === '',
  );
  /**
   * 🔴 S100d·bis · EL MAPA SE VE SIEMPRE Y SE MUEVE **SOLO CUANDO SE LO PIDE**.
   *
   * Founder, literal: *«el mapa, sin que yo le dé clic a ajustar punto, debería
   * estar fijado, bloqueado»*.
   *
   * **`false` = bloqueado**, que es el estado de entrada. El mapa **está a la
   * vista** —hace falta: es lo que deja ver dónde quedó el punto— pero **no
   * recibe un solo gesto.**
   *
   * ⚠️ EL BLOQUEO ES UNA CAPA QUE ABSORBE, NO UNA PROP DEL MAPA, y es decisión:
   * una prop apaga los gestos que la pieza conoce (`scroll`, `zoom`, `rotate`…)
   * y **el día que la librería agregue uno nuevo, el mapa vuelve a moverse sin
   * que nadie lo note**. Una capa por encima **no puede dejar pasar un gesto que
   * todavía no existe**. *Es la misma disciplina que volver inexpresable un
   * estado en vez de vigilarlo.*
   *
   * ⚠️ Y NO ES COSMÉTICO: este es el defecto que el founder reportó —arrastrar
   * el mapa para llegar a los botones **movía el punto** y se guardaba una
   * dirección distinta de la elegida **sin que nadie se enterara**.
   */
  const [mapaDesbloqueado, setMapaDesbloqueado] = useState(false);

  /**
   * 🔴 GUARDAR APARECE SOLO CUANDO HAY ALGO NUEVO QUE GUARDAR.
   *
   * Founder: *«las dos opciones extra de guardar dirección y agregar otra
   * dirección NO deberían estar acá»* (al entrar), y aparecen **recién al
   * CONFIRMAR el punto**.
   *
   * *Un botón de guardar presente desde el principio invita a apretarlo sin
   * haber cambiado nada — y en esta pantalla «guardar sin cambios» fue
   * exactamente el camino por el que se colaba el punto corrido.*
   */
  const [hayQueGuardar, setHayQueGuardar] = useState(false);

  /** El alias con el que se guarda una dirección NUEVA (paso ④). */
  const [aliasNuevo, setAliasNuevo] = useState('');

  useEffect(() => {
    if (placesApagado.current || resolviendo.current) return;
    const texto = direccion.trim();
    if (lugar && texto === lugar.direccion) {
      setPredicciones([]);
      setBuscando(false);
      return;
    }
    if (texto.length < 3) {
      setPredicciones([]);
      setBuscando(false);
      setBusquedaVacia(false);
      return;
    }
    setBuscando(true);
    const timer = setTimeout(() => {
      void (async () => {
        const r = await buscarLugares({ texto, sesion: sesionRef.current });
        setBuscando(false);
        if (!r.ok) {
          if (r.codigo === 'sin_configuracion') {
            placesApagado.current = true;
            // A-03: el apagado permanente HABLA (ver la nota del estado).
            setBuscadorApagado(true);
          }
          // red/google mientras se tipea: silencio — se sigue a mano.
          setPredicciones([]);
          setBusquedaVacia(false);
          return;
        }
        setPredicciones(r.data.slice(0, 5));
        setBusquedaVacia(r.data.length === 0);
      })();
    }, 350);
    return () => {
      clearTimeout(timer);
    };
  }, [direccion, lugar]);

  async function elegirPrediccion(placeId: string) {
    if (resolviendo.current) return;
    resolviendo.current = true;
    setPredicciones([]);
    const r = await resolverLugar({ placeId, sesion: sesionRef.current });
    // la sesión CERRÓ con Details (contrato lugares.ts) — la próxima
    // búsqueda abre una nueva.
    sesionRef.current = crearSesionLugares();
    resolviendo.current = false;
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setLugar(r.data);
    setDireccion(r.data.direccion);
    if (r.data.ciudad !== null) setCiudad(r.data.ciudad);
    // La resolución SIEMBRA el punto — y el dueño lo ajusta a mano si la
    // casa real no es donde Places cree (§7).
    setPunto({ lat: r.data.lat, lon: r.data.lon });
    /* 🔴 S100d·bis · Y SE GUARDA APARTE LO QUE PLACES DIJO.
       `punto` se mueve con el mapa; esto NO. Son dos datos distintos y hasta
       hoy guardábamos solo el primero ⇒ cuando el pin se corría sin que el
       dueño se enterara, **no había contra qué comparar**. */
    setPuntoPlaces({ lat: r.data.lat, lon: r.data.lon });
    setPlacesId(placeId);
  }

  function editarDireccion(texto: string) {
    setDireccion(texto);
    // Editar mata el estado "resuelta" (la resolución era de ESE texto).
    // El PUNTO persiste: está a la vista en el mapa (ver la cabecera).
    if (lugar && texto.trim() !== lugar.direccion) setLugar(null);
  }

  async function guardar() {
    if (guardando) return;
    setGuardando(true);

    if (conAlias) {
      // El punto ya está exigido por el botón (`faltaPunto`) y por el motor
      // (`punto_requerido`): acá no puede ser null, y el `??` es para el
      // typechecker, no una degradación silenciosa.
      const ra = await guardarDireccionConAlias({
        alias,
        direccion,
        ciudad,
        sector: sector.trim() === '' ? null : sector,
        referencias: referencias.trim() === '' ? null : referencias,
        lat: punto?.lat ?? 0,
        lon: punto?.lon ?? 0,
        direccionId,
        // S100d·bis · van los tres o no va ninguno: sin resolución de Places
        // en ESTA sesión, la respuesta honesta del motor es NULL («no sabemos»).
        placesId,
        latPlaces: puntoPlaces?.lat ?? null,
        lonPlaces: puntoPlaces?.lon ?? null,
      });
      setGuardando(false);
      if (!ra.ok) {
        mostrar({ texto: ra.mensaje, variante: 'error' });
        return;
      }
      mostrar({ texto: t('direccion.guardada'), variante: 'exito' });
      onGuardada({
        id: ra.data.direccionId,
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        sector: sector.trim() === '' ? null : sector.trim(),
        referencias: referencias.trim() === '' ? null : referencias.trim(),
        telefono: inicial?.telefono ?? null,
        lat: punto?.lat ?? null,
        lon: punto?.lon ?? null,
      });
      return;
    }

    const r = await guardarDireccionHogar({
      direccion,
      ciudad,
      sector: sector.trim() === '' ? null : sector,
      referencias: referencias.trim() === '' ? null : referencias,
      lat: punto?.lat ?? null,
      lon: punto?.lon ?? null,
      placesId,
      latPlaces: puntoPlaces?.lat ?? null,
      lonPlaces: puntoPlaces?.lon ?? null,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('direccion.guardada'), variante: 'exito' });
    onGuardada({
      id: r.data.direccionId,
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      sector: sector.trim() === '' ? null : sector.trim(),
      referencias: referencias.trim() === '' ? null : referencias.trim(),
      telefono: inicial?.telefono ?? null,
      lat: punto?.lat ?? null,
      lon: punto?.lon ?? null,
    });
  }

  /**
   * 🔴 S100d·bis · GUARDAR COMO OTRA DIRECCIÓN (paso ④, propuesta).
   *
   * Escribe por `guardar_direccion_con_alias`, que **JAMÁS pone
   * `es_principal`** ⇒ *guardar una oficina no puede desplazar al hogar ni por
   * error de llamada.* Esa propiedad es del motor y por eso este camino no
   * necesita cuidado extra: no es que no la pisemos — **es que no puede.**
   *
   * ⚠️ Va SIN `direccionId`: crea una nueva. Pasarle el id de la que se estaba
   * mirando la CONVERTIRÍA en la nueva, que es exactamente lo contrario de
   * «guardar como otra» — y el error sería silencioso.
   */
  async function guardarComoOtra() {
    if (guardando) return;
    setGuardando(true);
    const r = await guardarDireccionConAlias({
      alias: aliasNuevo,
      direccion,
      ciudad,
      sector: sector.trim() === '' ? null : sector,
      referencias: referencias.trim() === '' ? null : referencias,
      lat: punto?.lat ?? 0,
      lon: punto?.lon ?? 0,
      direccionId: null,
      placesId,
      latPlaces: puntoPlaces?.lat ?? null,
      lonPlaces: puntoPlaces?.lon ?? null,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('direccion.guardada'), variante: 'exito' });
    onGuardada({
      id: r.data.direccionId,
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      sector: sector.trim() === '' ? null : sector.trim(),
      referencias: referencias.trim() === '' ? null : referencias.trim(),
      telefono: inicial?.telefono ?? null,
      lat: punto?.lat ?? null,
      lon: punto?.lon ?? null,
    });
  }

  const faltaPunto = exigirPunto && punto === null;

  return (
    <View style={{ gap: spacing[2] }}>
      {/* El nombre va PRIMERO en modo libreta: es la llave con la que la
          persona va a reconocerla después, no un detalle del final. */}
      {conAlias ? (
        <Campo
          label={t('direccion.aliasLabel')}
          value={alias}
          onChangeText={setAlias}
          ayuda={t('direccion.aliasAyuda')}
          autoCapitalize="words"
        />
      ) : null}
      {/* 🔴 S100d·bis · LA DIRECCIÓN EN LECTURA, con sus DOS puertas al lado.
          Ver la nota larga de `editandoTexto`: al entrar NO hay campo, así que
          no hay nada que se pueda desacomodar sin haberlo pedido. */}
      {!editandoTexto ? (
        <View style={{ gap: spacing[2] }}>
          <Texto variante="apoyo">{t('direccion.direccionLabel')}</Texto>
          <Texto variante="cuerpo">{direccion}</Texto>
          {[ciudad, sector, referencias].some((x) => x.trim() !== '') ? (
            <Texto variante="apoyo">
              {[ciudad, sector, referencias].filter((x) => x.trim() !== '').join(' · ')}
            </Texto>
          ) : null}

          {/* LOS DOS BOTONES, UNO AL LADO DEL OTRO (paso ① del founder).
              Van en fila y no apilados porque **son la misma clase de
              decisión** —qué parte de la dirección querés tocar— y apilarlos
              haría leer uno como principal y el otro como secundario. */}
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <View style={{ flex: 1 }}>
              <Boton
                variante="secundario"
                bloque
                etiqueta={t('direccion.cambiarDireccion')}
                onPress={() => {
                  /* 🔴 EL CAMPO ABRE EN BLANCO — founder: *«debería llegar con
                     la dirección en blanco si la quiero cambiar»*.
                     Y no es solo comodidad: **el defecto original era editar
                     encima de un texto que ya no correspondía al punto.**
                     Empezar en blanco obliga a que la dirección nueva se
                     resuelva entera, con su propio punto. */
                  setDireccion('');
                  setLugar(null);
                  setPuntoPlaces(null);
                  setPlacesId(null);
                  setEditandoTexto(true);
                  setHayQueGuardar(true);
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Boton
                variante="secundario"
                bloque
                etiqueta={
                  mapaDesbloqueado
                    ? t('direccion.confirmarPunto')
                    : t('direccion.ajustarPunto')
                }
                onPress={() => {
                  if (mapaDesbloqueado) {
                    /* ④ CONFIRMAR: el mapa se vuelve a bloquear y recién ahí
                       aparecen las opciones de guardar. */
                    setMapaDesbloqueado(false);
                    setHayQueGuardar(true);
                    return;
                  }
                  /* ③ AJUSTAR: se desbloquea, y si todavía no hay punto se
                     siembra para que haya algo que mover. */
                  if (punto === null) setPunto(SEMILLA_QUITO);
                  setMapaDesbloqueado(true);
                }}
              />
            </View>
          </View>
        </View>
      ) : null}

      {editandoTexto ? (
      <BuscadorDeLugar
        valor={direccion}
        onCambiarTexto={editarDireccion}
        predicciones={predicciones.map((p) => ({
          id: p.placeId,
          principal: p.textoPrincipal,
          secundaria: p.textoSecundario ?? undefined,
        }))}
        onElegir={(id) => void elegirPrediccion(id)}
        cargando={buscando}
        label={t('direccion.direccionLabel')}
        marcador={lugar !== null && direccion.trim() === lugar.direccion ? t('direccion.ubicada') : undefined}
        // El vacío CON su salida (Ley 17.5): la dirección que Places no
        // encuentra igual existe — el punto se pone a mano.
        sinResultados={busquedaVacia ? t('direccion.sinResultados') : undefined}
      />
      ) : null}

      {/* A-03 · el buscador apagado lo DICE, y dice qué hacer.
          ⚠️ La voz se duplica acá en vez de reusar la del wrapper
          (`lugares.ts:81`, que dice exactamente esto) por **D-539**:
          `packages/api` no tiene capa de idioma y habla español fijo — mostrar
          su `mensaje` dejaría este formulario en español dentro de una app en
          inglés. *La voz se copia al riel; no se toma prestada de un paquete
          que no sabe traducir.* */}
      {buscadorApagado && editandoTexto ? (
        <Texto variante="apoyo">{t('direccion.buscadorApagado')}</Texto>
      ) : null}
      {editandoTexto ? (
        <>
          <Campo label={t('direccion.ciudadLabel')} value={ciudad} onChangeText={setCiudad} autoCapitalize="words" />
          <Campo label={t('direccion.sectorLabel')} value={sector} onChangeText={setSector} autoCapitalize="words" />
          <Campo
            label={t('direccion.referenciasLabel')}
            value={referencias}
            onChangeText={setReferencias}
            ayuda={t('direccion.referenciasAyuda')}
            autoCapitalize="sentences"
          />
        </>
      ) : null}

      {/* 🔴 S100d·bis · LAS ACCIONES VAN **ANTES** DEL MAPA.
          ═══════════════════════════════════════════════════════════════════
          Founder: *«los botones de acción no pueden quedar detrás del mapa»*.
          Acá está el orden invertido respecto de antes: **ajustar el punto y
          Guardar quedan arriba, y el mapa —cuando existe— va último.**

          ⚠️ Y el orden solo es la mitad barata de la cura. La otra es que **el
          mapa no se monta hasta que alguien lo pide**: con el mapa ausente no
          hay gesto que interceptar, y por eso el defecto no puede volver por
          otra puerta. *Reordenar sin esto dejaría el mapa comiéndose el scroll
          apenas alguien agregue un campo debajo.* */}
      {faltaPunto ? <Texto variante="apoyo">{t('direccion.faltaPunto')}</Texto> : null}

      {/* ══ EL MAPA — SIEMPRE A LA VISTA, BLOQUEADO SALVO QUE SE LO PIDA ══
          Founder: *«el mapa, sin que yo le dé clic a ajustar punto, debería
          estar fijado, bloqueado»*. Se ve porque hace falta —es lo que deja
          leer dónde quedó el punto— y no se mueve porque nadie lo pidió. */}
      {punto !== null ? (
        <View style={{ gap: spacing[1] }}>
          <View>
            <PinMovible
              lat={punto.lat}
              lon={punto.lon}
              onMover={(lat, lon) => setPunto({ lat, lon })}
              etiqueta={t('direccion.puntoEtiqueta')}
            />
            {/* 🔴 LA CAPA QUE ABSORBE EL GESTO — ver la nota de
                `mapaDesbloqueado`. Cubre el mapa entero y **no deja pasar
                NINGÚN gesto**, ni los que la librería agregue mañana. Sin
                `pointerEvents="none"` a propósito: su trabajo ES capturar.
                ⚠️ No lleva `accessibilityLabel`: el mapa de abajo ya tiene el
                suyo, y anunciar una capa muda encima lo taparía para el lector
                de pantalla — se bloquea el dedo, no la voz. */}
            {!mapaDesbloqueado ? (
              <View
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                style={{ position: 'absolute', inset: 0 }}
              />
            ) : null}
          </View>
          <Texto variante="apoyo">
            {mapaDesbloqueado ? t('direccion.puntoAyuda') : t('direccion.mapaBloqueado')}
          </Texto>
        </View>
      ) : null}

      {/* ══ ④ LAS OPCIONES DE GUARDAR — SOLO CUANDO HAY ALGO NUEVO ══
          🔴 PROPUESTA, y se declara como tal: el founder dejó la forma exacta
          abierta (*«vamos a pensar cómo poderlo organizar»*). Lo que sí está
          firmado es CUÁNDO aparecen —al confirmar el punto— y eso es lo que
          está construido.

          La propuesta: **dos destinos, no tres botones.** «Guardar acá»
          actualiza la dirección que se estaba mirando; «Guardar como otra»
          pide un nombre y crea una nueva sin tocar la principal.
          *Se propone así porque son dos INTENCIONES distintas y no dos
          variantes de la misma: una corrige, la otra agrega. Un solo botón con
          un interruptor al lado haría que la corrección y el alta se parezcan,
          y la que se elige por error es siempre la que pisa lo que ya estaba.* */}
      {hayQueGuardar || conAlias ? (
        <View style={{ gap: spacing[2] }}>
          <Boton
            etiqueta={t('direccion.guardar')}
            bloque
            cargando={guardando}
            deshabilitado={
              direccion.trim() === '' ||
              ciudad.trim() === '' ||
              faltaPunto ||
              (conAlias && alias.trim() === '')
            }
            onPress={() => void guardar()}
          />

          {/* La alterna solo cuando NO estamos ya creando una con alias: en ese
              caso el formulario entero YA es «otra dirección» y ofrecerlo de
              nuevo sería ofrecer lo que se está haciendo. */}
          {!conAlias ? (
            <View style={{ gap: spacing[2] }}>
              <Campo
                label={t('direccion.aliasLabel')}
                value={aliasNuevo}
                onChangeText={setAliasNuevo}
                ayuda={t('direccion.guardarComoOtraAyuda')}
                autoCapitalize="words"
              />
              <Boton
                variante="secundario"
                bloque
                etiqueta={t('direccion.guardarComoOtra')}
                cargando={guardando}
                deshabilitado={
                  direccion.trim() === '' ||
                  ciudad.trim() === '' ||
                  faltaPunto ||
                  aliasNuevo.trim() === ''
                }
                onPress={() => void guardarComoOtra()}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
