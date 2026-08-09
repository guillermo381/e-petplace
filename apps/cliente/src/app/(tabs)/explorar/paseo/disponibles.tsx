/**
 * PASEO — EL QUIÉN (S54-B3.2): paseadores disponibles para la ventana
 * elegida en el CUÁNDO. Recicla la anatomía de la lista B3.1 (que murió
 * como entrada) y le da el TAP VIVO: elegir paseador → (selector de
 * mascota si el hogar tiene más de una) → crear el hold de 15 min →
 * checkout. slot_ocupado en el tap (carrera real) → Aviso honesto +
 * refresh de la lista.
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — nadie puede a esa hora: vacío honesto con vuelta al
 *    CUÁNDO en un toque (jamás relleno).
 *  · Peldaño 1 — disponibles REALES: nombre + servicio + precio y
 *    duración de verdad (snapshot al crear el hold).
 *  · Peldaño 2 — datos del expediente del paseador (paseos cerrados con
 *    calidad, partes): HOY NO MUESTRA ninguno (explícito) — la fila se
 *    enriquece por dato cuando existan, no por versión.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Icono,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  crearBloqueoAgenda,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerPaseadoresDisponibles,
  obtenerSaldoPaquete,
  reservarSalidaPaquete,
  resolverUrlFoto,
  type MascotaResumen,
  type PaseadorDisponible,
  mascotasElegibles,
  obtenerPerfilesPublicos,
  type PerfilPublico,
} from '@epetplace/api';
import { PlanHoja } from '@/components/plan-hoja';
import { PaseoSocialHoja } from '@/components/paseo-social-hoja';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { tomarPedido } from '@/lib/senal-reserva';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { PreviewPrestador } from '@/components/preview-prestador';

export default function PaseoDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ fecha: string; hora: string; duracion: string; plan?: string; mascotaId?: string }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const duracion = Number(params.duracion ?? 0);
  // D-338: modo PLAN — el paseador elegido acá ancla el plan (§6.1 v1.2).
  const modoPlan = params.plan === '1';
  // S61-A3 (gramática canónica): la mascota YA viene elegida del paso 0
  // del CUÁNDO. La Hoja de elección de abajo queda de CINTURÓN (deep
  // link viejo sin param — el flujo no se rompe).
  const mascotaIdParam =
    typeof params.mascotaId === 'string' && params.mascotaId.length > 0 ? params.mascotaId : null;

  const [disponibles, setDisponibles] = useState<PaseadorDisponible[] | 'cargando' | 'error'>('cargando');
  /** 🔴 P0 REABIERTO (9-ago-2026) — LAS MASCOTAS TAMBIÉN TIENEN TRES ESTADOS.
   *
   *  Esto era `useState<MascotaResumen[]>([])`, y ahí vivía la causa que la
   *  primera cura NO tocó: si la lectura fallaba, los dos `await` de abajo
   *  hacían `return` **callado** y la lista se quedaba en `[]` **para
   *  siempre**, sin reintento. Con el catálogo cargado —que es público y
   *  rápido, así que llega igual— la pantalla leía ese `[]` como *«no tenés
   *  perros»* y se lo decía al founder con dos perros vivos.
   *
   *  **Es L-218 exacta, un piso más arriba**: la cura anterior partió en tres
   *  fases el vacío del CATÁLOGO y dejó el vacío de las MASCOTAS colapsado en
   *  un array. *Se curó el vacío que el P0 mostró, no la clase.*
   *
   *  La forma se copia de `paseo/index.tsx`, que **ya lo hacía bien** — otra
   *  vez cuatro pantallas cumpliendo una ley y una no. */
  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  // §1bis (v1.4): las especies que PUEDEN pasear — de la DB, jamás un if
  // por pantalla (null = todas mientras carga o sin config).
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [eligiendoMascota, setEligiendoMascota] = useState<PaseadorDisponible | null>(null);
  const [sinElegibles, setSinElegibles] = useState(false);
  /** P0 (9-ago-2026): el catálogo de especies todavía no llegó (`cargando`) o
   *  no llegó nunca (`error`). **No es lo mismo que no tener perros**, y por
   *  eso no comparte estado con `sinElegibles`: mezclarlos es exactamente el
   *  bug que se está curando. */
  /* ═══ LA CAUSA DEL P0-C, Y LA CURA ES DEJAR DE COPIAR ════════════════════
   *
   * ☠️ ACÁ VIVÍAN DOS `useState<'cargando'|'error'|null>` QUE GUARDABAN **UNA
   * COPIA DE LA FASE** en el instante del toque. Y esa copia **nunca se
   * actualizaba**: se seteaba al tocar y solo se limpiaba a mano.
   *
   * El resultado, medido en el aparato del founder: tocaba a los ~100 ms, la
   * fase era `cargando`, se guardaba el string `'cargando'`… y **262 ms después
   * el catálogo llegaba y la fase pasaba a `listo`, pero la copia seguía
   * diciendo `'cargando'` PARA SIEMPRE**. *El modal no esperaba nada: mostraba
   * una foto del pasado.* La pantalla de atrás estaba lista; el cartel de
   * adelante no se retiraba nunca.
   *
   * **La cura es no tener la copia.** Lo único que se guarda es **qué intentó
   * hacer la persona**; si el modal corresponde o no lo dice **la fase VIVA**,
   * en cada render. Cuando el dato llega, el modal se apaga solo — sin efecto
   * que lo sincronice, sin nadie que se acuerde de limpiarlo.
   *
   * *Un estado derivado de otro estado es una copia, y toda copia diverge.* */
  const [intentoSinDatos, setIntentoSinDatos] = useState<'catalogo' | 'mascotas' | null>(null);
  /** Contador de reintentos: cambiarlo re-dispara la lectura del hogar. Sin
   *  esto, «Reintentar» solo pondría el estado en `cargando` y nadie volvería
   *  a pedir nada — un botón que no reintenta es peor que ningún botón. */
  const [reintento, setReintento] = useState(0);

  /* ═══ INSTRUMENTO (P0-C, 9-ago) — NO ES DECORACIÓN: ES LA MEDICIÓN ═══════
   *
   * Síntoma medido por el founder: toca Reservar, sale «Estamos terminando de
   * cargar tus mascotas» y **se queda ahí para siempre**. No hay un después.
   *
   * Y lo medido del otro lado descarta la lentitud: **la base responde en 11 ms
   * y la red en ~650 ms**. *Una espera infinita sobre un backend de 11 ms no es
   * lentitud: es una cadena que no resuelve, o un resultado que se descarta.*
   *
   * Las dos hipótesis vivas —`auth.getSession()` colgado en su refresh, o el
   * guard `vigente` tirando la respuesta— **se distinguen mirando dónde se
   * DETIENE la traza**, y por eso se marca cada eslabón con su tiempo. Sin esto
   * seguimos deduciendo, y deducir ya falló dos veces (L-220).
   *
   * ⚠️ **SE VE EN PANTALLA, dentro del propio modal.** Un `console.log` exige
   * cable y el aparato es del founder — la misma razón por la que L-160 se
   * enmendó para que el marcador del update se RENDERICE. El `console.log`
   * queda igual, para quien tenga consola.
   *
   * ☠️ MUERTE: con el gate del P0 cerrado. Ficha **D-726**. */
  const [traza, setTraza] = useState<string[]>([]);
  const t0Ref = useRef<number>(Date.now());
  /** Cura 2: marca que el hogar ya se leyó en esta visita. Es un `ref` y no
   *  estado A PROPÓSITO — meterlo en las dependencias del efecto sería
   *  fabricar el bucle que se está curando. */
  const hogarCargadoRef = useRef(false);
  const marcar = useCallback((etiqueta: string) => {
    const ms = Date.now() - t0Ref.current;
    const linea = `${String(ms).padStart(5)}ms · ${etiqueta}`;
    console.log(`[p0c] ${linea}`);
    // Acotada: una traza sin techo sería otro cuelgue, esta vez de memoria.
    setTraza((prev) => (prev.length > 40 ? prev : [...prev, linea]));
  }, []);

  /** La traza montada como pieza, para que viva en LOS DOS modales de espera.
   *  La primera foto del founder no mostró el recuadro **porque el instrumento
   *  estaba en el modal que no salía**: el suyo es el del CATÁLOGO
   *  («Estamos terminando de cargar los datos del paseo»), no el del hogar.
   *  *Un instrumento en la pantalla equivocada no mide nada.* */
  const bloqueTraza =
    traza.length > 0 ? (
      <View style={{ backgroundColor: theme.bg.overlay, borderRadius: 10, padding: spacing[3], gap: 2 }}>
        <Texto variante="dato">diagnóstico P0-C · dónde se detiene</Texto>
        {traza.map((linea, i) => (
          <Texto key={`${i}-${linea}`} variante="dato">
            {linea}
          </Texto>
        ))}
      </View>
    ) : null;

  const [creandoHold, setCreandoHold] = useState(false);
  const [plan, setPlan] = useState<{ paseador: PaseadorDisponible; mascotaId: string } | null>(null);
  // §6bis.3: con saldo del ancla, el dueño ELIGE — reservar contra el
  // paquete o pagar suelto. Opciones PAREJAS, cero dark patterns.
  const [conSaldo, setConSaldo] = useState<{ paseador: PaseadorDisponible; mascotaId: string; saldo: number } | null>(null);
  const [reservando, setReservando] = useState(false);
  /** S91-C · el enriquecimiento del preview, de `v_prestadores_publicos`
   *  (jamás la tabla). Carga SECUNDARIA: la fila se pinta con lo que el
   *  lector de disponibilidad ya trajo y se completa cuando llega — hacer
   *  esperar la disponibilidad por una foto sería D-531 otra vez. */
  const [perfiles, setPerfiles] = useState<Record<string, PerfilPublico>>({});

  // Los perfiles de los que SE ESTÁN OFRECIENDO — ni uno más.
  useEffect(() => {
    if (!Array.isArray(disponibles)) return;
    const ids = [...new Set(disponibles.map((x) => x.prestador_id))];
    if (ids.length === 0) return;
    let vigente = true;
    void obtenerPerfilesPublicos(ids).then((r) => {
      if (!vigente || !r.ok) return;
      setPerfiles(Object.fromEntries(r.data.map((p) => [p.id, p])));
    });
    return () => {
      vigente = false;
    };
  }, [disponibles]);

  // P19 (S59-A4): la pregunta única salta ANTES del checkout cuando la
  // mascota aún no respondió (null); el NO frena con voz honesta con
  // camino — el guard server (paseo_social_no) es el cinturón.
  const [preguntaSocial, setPreguntaSocial] = useState<{ paseador: PaseadorDisponible; mascota: MascotaResumen } | null>(null);
  const [socialNo, setSocialNo] = useState<string | null>(null);

  // S73 (letra de elegibilidad): frontera única — momento vital + especie.
  // 🔴 P0-C: `marcar` va como sonda — es el hook que el founder ve colgado.
  const faseEspecies = useEspeciesElegibles('paseo', marcar);
  const elegibles = ofrecibles(Array.isArray(mascotas) ? mascotas : [], faseEspecies);

  /* ═══ EL ESPEJO VIVO — la cura estructural del guard 2 (P0-C, 9-ago) ═════
   *
   * ☠️ LO QUE PASABA, con la traza del founder como prueba:
   *     494ms · ✔ setMascotas(lista) — 6 mascotas
   *       1ms · ⏭ el hogar YA está cargado — no se re-pide
   *       1ms · ▷ alElegir · mascotas=cargando · elegibles=0   ← ¡MENTIRA!
   *
   * **Los datos estaban; la lectura era vieja.** El efecto que ejecuta el
   * pedido tiene deps `[disponibles, marcar]` —yo saqué `alElegir` a propósito,
   * para que no corriera de más—, así que **captura el `alElegir` del render en
   * que se creó**, uno donde `mascotas` todavía era `'cargando'`. Al volver del
   * preview corre ESE closure, que ve un mundo que ya no existe.
   *
   * *Datos presentes, semáforo en rojo* — y la causa no es el semáforo: es que
   * se estaba mirando la foto de un semáforo viejo.
   *
   * ── POR QUÉ UN REF Y NO «SETEAR 'listo' EN ESE PUNTO» ────────────────────
   * Un parche ahí arreglaría ESTE camino y dejaría vivos todos los demás: hay
   * más de un lugar que puede leer estos valores desde un closure. **El ref se
   * actualiza en CADA render**, así que quien lo lea ve la verdad de ahora, sin
   * importar de qué render venga su clausura. *Mientras la lectura pueda ser
   * vieja, esto vuelve — y ya volvió tres veces.*
   *
   * **No hay segunda fuente de verdad:** el estado sigue siendo uno
   * (`mascotas`, `faseEspecies`); el ref es su ESPEJO, no una copia con vida
   * propia — se pisa entero en cada render y nadie lo escribe aparte. */
  const mascotasRef = useRef(mascotas);
  mascotasRef.current = mascotas;
  const faseEspeciesRef = useRef(faseEspecies);
  faseEspeciesRef.current = faseEspecies;

  /* LOS DOS MODALES DE ESPERA, DERIVADOS DE LA FASE VIVA (ver la nota larga
     arriba de `intentoSinDatos`). Se calculan en cada render, así que **cuando
     el dato llega el modal se apaga solo**: no hay copia que sincronizar ni
     nadie que tenga que acordarse de limpiarla. */
  const catalogoNoLlego: 'cargando' | 'error' | null =
    intentoSinDatos === 'catalogo' && faseEspecies.fase !== 'listo' ? faseEspecies.fase : null;
  const mascotasNoLlegaron: 'cargando' | 'error' | null =
    intentoSinDatos === 'mascotas' && !Array.isArray(mascotas) ? mascotas : null;

  const cargar = useCallback(() => {
    setDisponibles('cargando');
    void obtenerPaseadoresDisponibles({ fecha, hora, duracion_minutos: duracion }).then((r) => {
      setDisponibles(r.ok ? r.data : 'error');
    });
  }, [fecha, hora, duracion]);

  // S91-C · EL PEDIDO QUE VUELVE DEL DETALLE. La barra fija de
  // `/prestador/[id]` no reserva: PIDE. Acá se toma UNA vez (la lectura
  // es destructiva) y se ejecuta EL MISMO camino del botón de la fila —
  // un solo flujo de reserva en toda la app.
  /* 🔴 P0-C (2º síntoma, 9-ago) — «el primer Reservar rebota, el segundo pasa»,
     3 de 3 en el aparato del founder. Instrumentado ACÁ, que es donde el
     síntoma se manifiesta (L-221), y no donde yo suponga la causa.
     ⚠️ EL DEFECTO QUE SE VE POR LECTURA, sin depender de la traza:
     `tomarPedido()` **CONSUME la señal ANTES de verificar si puede usarla**.
     La lectura es destructiva a propósito —para que no se re-dispare—, pero se
     ejecuta antes del guard: si `disponibles` todavía no es un array, el
     pedido se borra y **no lo ejecuta nadie**. *La señal muere en silencio, y
     el segundo intento funciona porque la lista ya está.* Es el patrón que
     acabamos de curar en el modal, con otra cara. */
  useFocusEffect(
    useCallback(() => {
      const pedida = tomarPedido();
      if (pedida !== null) {
        marcar(
          `⇢ PEDIDO recibido del preview · disponibles=${Array.isArray(disponibles) ? `${disponibles.length} oferta(s)` : disponibles}`,
        );
      }
      if (pedida === null || !Array.isArray(disponibles)) {
        if (pedida !== null) {
          marcar('✖ PEDIDO DESCARTADO: la lista aún no estaba — la señal ya se consumió y se pierde');
        }
        return;
      }
      const oferta = disponibles.find((p) => p.prestador_servicio_id === pedida);
      // Si la oferta ya no está (se ocupó el slot mientras miraba), no se
      // reserva a ciegas: la lista habla sola en su próximo refresh.
      if (oferta === undefined) {
        marcar(`✖ PEDIDO SIN OFERTA: el id pedido ya no está en la lista (slot ocupado?)`);
        return;
      }
      marcar('✔ PEDIDO ejecutado → alElegir');
      alElegir(oferta);
      /* ⚠️ deps: `disponibles` + `marcar` (estable). `alElegir` no entra, y
         **ya no importa**: desde la cura del espejo vivo, aunque este efecto
         capture una versión vieja de la función, **los datos que esa función
         lee son los de AHORA**. *Antes esta omisión era la causa del bug —el
         closure veía `mascotas='cargando'` con seis mascotas cargadas—; ahora
         es inofensiva, y ésa es la diferencia entre un parche y una cura.* */
    }, [disponibles, marcar]),
  );

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      t0Ref.current = Date.now();
      marcar('▶ entra al efecto (focus)');
      // La DISPONIBILIDAD sí se re-pide en cada foco, y es correcto: los slots
      // se ocupan mientras mirás. Lo que no se re-pide es el HOGAR.
      cargar();

      /* ═══ CURA 2 — EL HOGAR NO SE VUELVE A PEDIR SI YA ESTÁ ══════════════
       * La traza del founder mostró la pantalla **cargando bien y
       * reiniciándose sola**: `✂ se limpia el efecto` a los 2 s y `▶ entra al
       * efecto` otra vez, tirando trabajo ya hecho. Abrir un `Modal` de React
       * Native provoca blur del screen, y `useFocusEffect` lo lee como salida.
       *
       * Tus mascotas no cambian entre que abrís una hoja y la cerrás. **Se
       * piden UNA vez por visita**; «Reintentar» limpia la marca y vuelve a
       * pedir de verdad.
       *
       * ⚠️ ALCANCE: **solo esta pantalla**, por orden del founder. Hay otras 7
       * con el mismo patrón (`useFocusEffect` + `Hoja`) y extenderlo se decide
       * **con la medición en la mano, no por arrastre** — la ficha del censo
       * transversal es D-728. */
      if (hogarCargadoRef.current) {
        marcar('⏭ el hogar YA está cargado — no se re-pide (cura 2)');
        return () => {
          marcar('✂ se limpia el efecto (sin pedir nada)');
          vigente = false;
        };
      }

      /* ═══ TECHO DE ESPERA — convierte un cuelgue en un error VISIBLE ══════
       * No es la cura: es la RED. La causa sigue viva y la traza la sigue
       * contando — *el techo no debe tapar lo que pasó por debajo*, que fue la
       * condición del founder. Ocho segundos es holgado contra los ~650 ms que
       * mide el camino real: si a los 8 s no llegó, no va a llegar. */
      const techo = setTimeout(() => {
        if (!vigente) return;
        marcar('⏱ TECHO 8s — la carga NO llegó; se declara error');
        setMascotas((prev) => (prev === 'cargando' ? 'error' : prev));
      }, 8000);

      void (async () => {
        /* ☠️ ACÁ VIVÍAN LOS DOS `return` MUDOS QUE REABRIERON EL P0.
           Decían `if (!vigente || !estado.ok || !estado.data.familia_id) return;`
           y `if (!vigente || !r.ok) return;` — y **el fallo se degradaba a lista
           vacía en silencio**. Ahora cada rama dice qué pasó, y `!vigente` se
           separa del fallo real: irse de la pantalla NO es un error y no debe
           pintar uno. */
        marcar('① antes de getEstadoOnboardingDueno (adentro hace auth.getSession)');
        const estado = await getEstadoOnboardingDueno();
        marcar(`① después · ok=${estado.ok} · familia=${estado.ok ? (estado.data.familia_id !== null ? 'sí' : 'NULL') : '—'}`);
        if (!vigente) {
          marcar('✂ ABORTA: vigente=false tras el eslabón ① (el efecto se limpió)');
          return;
        }
        if (!estado.ok || !estado.data.familia_id) {
          marcar('✖ sin familia → error');
          setMascotas('error');
          return;
        }
        marcar('② antes de obtenerMascotasDeFamilia');
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        marcar(`② después · ok=${r.ok}${r.ok ? ` · ${r.data.length} mascota(s)` : ''}`);
        if (!vigente) {
          marcar('✂ ABORTA: vigente=false tras el eslabón ② (la respuesta LLEGÓ y se descarta)');
          return;
        }
        clearTimeout(techo);
        // Solo se marca como cargado si de verdad llegó: un fallo tiene que
        // poder reintentarse en el próximo foco.
        if (r.ok) hogarCargadoRef.current = true;
        marcar(`✔ setMascotas(${r.ok ? 'lista' : "'error'"}) — el modal se apaga solo`);
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
        /* ⚠️ ESTA MARCA ES EL DISCRIMINADOR DE LA HIPÓTESIS 2. Si en la traza
           aparece «✂ se limpia el efecto» ANTES de que llegue el eslabón ②, la
           respuesta se va a descartar y la pantalla queda en `cargando` para
           siempre — que es exactamente el síntoma. Si NO aparece, el cuelgue
           está adentro de un `await` y la hipótesis viva es la 1. */
        marcar('✂ se limpia el efecto (blur/re-ejecución) → vigente=false');
        clearTimeout(techo);
        vigente = false;
      };
      // `reintento` está en las deps A PROPÓSITO: es lo que vuelve a disparar
      // la lectura del hogar cuando la persona toca «Reintentar».
    }, [cargar, reintento, marcar]),
  );

  // El hold nace acá: invisible al prestador hasta que el pago confirme.
  const crearHold = useCallback(
    async (p: PaseadorDisponible, mascotaId: string) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: p.prestador_id,
        prestador_servicio_id: p.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha,
        hora,
      });
      setCreandoHold(false);
      setEligiendoMascota(null);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') cargar();
        return;
      }
      router.push({
        pathname: '/explorar/paseo/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: p.prestador_nombre,
          servicioNombre: p.servicio_nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(p.duracion_minutos),
        },
      });
    },
    [creandoHold, fecha, hora, cargar, mostrar],
  );

  // Reservar CONTRA SALDO: la cita nace firme sin pago (el pago fue el
  // del paquete — invariante ampliado S57). Éxito → Go home (D-430: la
  // salida de reserva aterriza en el Hogar como el suelto, NO en el hub;
  // la regla de §3 queda sin excepciones). El toast dice el saldo.
  const reservarConSaldo = useCallback(
    async (p: PaseadorDisponible, mascotaId: string) => {
      if (reservando) return;
      setReservando(true);
      const r = await reservarSalidaPaquete({
        prestador_id: p.prestador_id,
        prestador_servicio_id: p.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha,
        hora,
      });
      setReservando(false);
      setConSaldo(null);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') cargar();
        return;
      }
      mostrar({ texto: t('paquete.reservada', { n: r.data.saldo_restante }), variante: 'exito' });
      if (router.canDismiss()) router.dismissAll();
      router.navigate('/hogar');
    },
    [reservando, fecha, hora, cargar, mostrar, t],
  );

  // La continuación real (plan / saldo / hold) — P19 ya resuelta.
  const continuarConMascota = useCallback(
    (p: PaseadorDisponible, mascotaId: string) => {
      if (modoPlan) {
        // S79 + Ley 23: la puerta no ofrece lo que el server va a
        // rechazar — sin precio mensual declarado, contratar rebota
        // plan_no_ofrecido; la Hoja no se abre y la voz da el camino.
        if (p.precio_mensual_plan === null) {
          mostrar({ texto: t('plan.noOfrecido'), variante: 'error' });
          return;
        }
        setPlan({ paseador: p, mascotaId });
        return;
      }
      // ¿hay saldo de paquete DEL HOGAR con este ancla? El dueño elige (§6bis.3).
      void (async () => {
        const saldo = await obtenerSaldoPaquete({
          prestador_id: p.prestador_id,
          prestador_servicio_id: p.prestador_servicio_id,
        });
        if (saldo.ok && saldo.data !== null && saldo.data.saldo > 0) {
          setConSaldo({ paseador: p, mascotaId, saldo: saldo.data.saldo });
        } else {
          void crearHold(p, mascotaId);
        }
      })();
    },
    [modoPlan, crearHold],
  );

  // P19 — la puerta: sin responder = pregunta única; NO = voz honesta
  // con camino y la reserva NO avanza (el guard server es el cinturón).
  const alElegirMascota = useCallback(
    (p: PaseadorDisponible, mascotaId: string) => {
      /* Del ESPEJO VIVO, por la misma razón que `alElegir` (ver su nota).
         Además esta función **usaba `elegibles` sin declararlo** en sus
         dependencias: leía un valor del render capturado mientras decía
         depender de `mascotas`. *Una dependencia que no se declara es una foto
         vieja esperando su turno.* */
      const vivas = mascotasRef.current;
      const m = ofrecibles(Array.isArray(vivas) ? vivas : [], faseEspeciesRef.current).find(
        (x) => x.id === mascotaId,
      );
      if (m !== undefined && m.paseo_social_ok === null) {
        setPreguntaSocial({ paseador: p, mascota: m });
        return;
      }
      if (m !== undefined && m.paseo_social_ok === false) {
        setSocialNo(m.nombre);
        return;
      }
      continuarConMascota(p, mascotaId);
    },
    [continuarConMascota],
  );

  const alElegir = useCallback(
    (p: PaseadorDisponible) => {
      /**
       * §1bis: solo mascotas ELEGIBLES para pasear.
       *
       * ⚠️ SE MIRA LA FASE, JAMÁS EL LARGO — y acá está el bug que el founder
       * cazó en dispositivo (P0, 9-ago-2026): `ofrecibles()` devuelve `[]` en
       * **las tres** fases —`cargando`, `error` y «de verdad no hay»— así que
       * `elegibles.length === 0` significaba tres cosas y las tres se le
       * contestaban al usuario con la misma frase: *«tu hogar todavía no tiene
       * un perro registrado»*. **Con dos perros vivos en el hogar.**
       *
       * Lo dice la propia lib que este archivo consume
       * (`lib/especies-elegibles.ts`): *«la pantalla distingue ese vacío del
       * vacío real mirando la fase, jamás el largo: "no tenés mascotas
       * elegibles" y "todavía no sé" son dos frases distintas y una de las dos
       * sería mentira»*. Las otras cuatro pantallas de servicio ya lo hacían
       * (`faseEspecies.fase === 'listo' && elegibles.length === 0`); esta era
       * la única que no.
       *
       * El motor nunca estuvo en riesgo: el guard `mascota_no_elegible` de la
       * DB devuelve `true` para estos perros. Lo que fallaba era la PUERTA.
       */
      /* 🔴 P0-C (2º síntoma) — POR QUÉ EL PASEO NO CONTINÚA Y LOS OTROS TRES SÍ.
         Medido por lectura: en grooming/adiestramiento/veterinaria el pedido
         llama **directo** a su `crearHold` / `reservarSesion` / `tocarNegocio`.
         En el paseo llama a `alElegir`, que **evalúa tres guards antes** —los
         del P0—, y cualquiera de ellos corta la continuación. *Los guards son
         correctos: no se reserva sin saber a qué mascota. Lo que falta es que
         digan por qué cortaron cuando el disparo vino de un PEDIDO.*
         El guard 2 es el que reabrió el P0: el catálogo llega ANTES que el
         hogar, así que con la fase ya en `listo` y las mascotas en vuelo,
         `elegibles` es `[]` — eso le decía «no tenés perros» al founder.
         ⚠️ Los tres guards van SEGUIDOS y sin comentarios en el medio a
         propósito: R34 mira las 12 líneas previas para reconocer el guard de
         fase, y **mi propia nota los separó lo suficiente como para que el lint
         me frenara** — dos veces. *Un comentario largo entre un guard y su
         consecuencia no es neutro: rompe la lectura, la del humano y la del
         instrumento.* */
      // ⚠️ TODO lo que decide se lee del ESPEJO VIVO, jamás del closure — ver
      // la nota larga arriba. `elegiblesVivos` se DERIVA acá de esos dos
      // valores: si se usara el `elegibles` del render capturado, la cura
      // duraría hasta el próximo camino que llegue con una clausura vieja.
      const mascotasVivas = mascotasRef.current;
      const faseViva = faseEspeciesRef.current;
      const elegiblesVivos = ofrecibles(Array.isArray(mascotasVivas) ? mascotasVivas : [], faseViva);
      marcar(
        `▷ alElegir · fase=${faseViva.fase} · mascotas=${Array.isArray(mascotasVivas) ? `${mascotasVivas.length}` : mascotasVivas} · elegibles=${elegiblesVivos.length} · param=${mascotaIdParam ?? 'no'}`,
      );
      if (faseViva.fase === 'cargando' || faseViva.fase === 'error') {
        marcar(`⊘ CORTA guard 1: el catálogo está en «${faseViva.fase}»`);
        setIntentoSinDatos('catalogo');
        return;
      }
      if (!Array.isArray(mascotasVivas)) {
        marcar(`⊘ CORTA guard 2: las mascotas están en «${String(mascotasVivas)}»`);
        setIntentoSinDatos('mascotas');
        return;
      }
      if (elegiblesVivos.length === 0) {
        marcar('⊘ CORTA guard 3: cero mascotas elegibles (con el catálogo listo)');
        setSinElegibles(true);
        return;
      }
      // S61-A3: la gramática canónica ya trae la mascota del paso 0.
      if (mascotaIdParam !== null && elegiblesVivos.some((m) => m.id === mascotaIdParam)) {
        marcar('✔ sigue con la mascota del param');
        alElegirMascota(p, mascotaIdParam);
        return;
      }
      if (elegiblesVivos.length === 1) {
        marcar('✔ sigue con la única elegible');
        alElegirMascota(p, elegiblesVivos[0].id);
      } else {
        marcar(`▣ abre el selector de mascota (${elegiblesVivos.length} elegibles)`);
        setEligiendoMascota(p);
      }
    },
    /* ⚠️ `mascotas`, `faseEspecies` y `elegibles` YA NO SON DEPENDENCIAS: se
       leen del espejo vivo, así que esta función **no envejece**. Eso es la
       cura, no una optimización — antes cambiaba de identidad con cada carga y
       cualquier efecto que la hubiera capturado antes se quedaba con la foto
       vieja. Ahora hay una sola `alElegir` y siempre mira el presente. */
    [mascotaIdParam, alElegirMascota, marcar],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('explorar.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina — con el PARA QUIÉN
            visible (S61-A3, rasgo 1).
            ⚠️ D-727 — ACÁ SE REUSABA `grooming.ventanaPara`, y el reuso estaba
            DECLARADO a propósito («la misma voz del QUIÉN del grooming, Ley
            17.3»). **La decisión era sana; el literal no**: decía «Grooming
            para {nombre}» y esta pantalla es de PASEO — el founder lo leyó en
            su aparato. *Lo compartible era la FORMA («X para {nombre}»), no el
            texto, porque el texto nombra el oficio.* Ahora cada oficio tiene su
            key y comparten la forma. */}
        {(() => {
          // S73 (letra de elegibilidad, N=1 "no se pregunta pero SE DICE"):
          // sin param y con UNA sola elegible, la auto-elegida del tap
          // (:alElegirMascota) se DICE acá — avatar y nombre visibles ANTES
          // de tocar nada. Auto-seleccionar en silencio era magia (cura b).
          const paraQuien =
            elegibles.find((m) => m.id === mascotaIdParam) ??
            (elegibles.length === 1 ? elegibles[0] : null);
          return (
            <Celda
              inicio={
                paraQuien !== null ? (
                  // xs, no sm: la columna del metadataMono es intocable y con
                  // sm el titulo colapsaba a cero en 420 (hallazgo M3 S73).
                  <AvatarMascota nombre={paraQuien.nombre} fotoUrl={caraDeMascotaPorRuta({ especie: paraQuien.especie, rutaImagen: paraQuien.raza_ruta_imagen, fotoUri: fotos[paraQuien.id] })} tamano="xs" />
                ) : undefined
              }
              titulo={
                paraQuien !== null
                  ? t('paquete.ventanaPara', { nombre: paraQuien.nombre })
                  : t('explorar.paseoTitulo')
              }
              // La ventana APILADA en la zona fin (S44-B4.1): en una sola
              // línea el mono de 26 caracteres exprimía el título a cero
              // con el avatar presente (hallazgo M3 S73).
              metadataMono={fecha}
              fin={<Texto variante="dato">{`${hora} · ${duracion} min`}</Texto>}
            />
          );
        })()}
        {/* P19: la norma DECLARADA en el flujo de reserva — serena, no
            letra chica (la misma voz vive en la pregunta única) */}
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.sm,
            lineHeight: Math.round(typography.size.sm * typography.leading.normal),
            color: theme.text.secondary,
          }}
        >
          {t('paseoSocial.declaracion')}
        </Text>
        <Separador />

        {disponibles === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : disponibles === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : disponibles.length === 0 ? (
          // Peldaño 0 — nadie puede: vuelta barata al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('explorar.nadiePuede')}
            descripcion={t('explorar.nadiePuedeDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {disponibles.map((p, i) => (
              <View key={p.prestador_servicio_id}>
                {i > 0 ? <Separador /> : null}
                <PreviewPrestador
                  prestadorId={p.prestador_id}
                  ofertaId={p.prestador_servicio_id}
                  nombre={p.prestador_nombre}
                  oficio={t('hogar.railPaseos')}
                  contexto={p.servicio_nombre}
                  precio={`$${p.precio.toFixed(2)} · ${p.duracion_minutos} min`}
                  perfil={perfiles[p.prestador_id]}
                />
              </View>
            ))}
          </Tarjeta>
        )}

        {/* 🔴 LA TRAZA, TAMBIÉN EN LA PANTALLA (P0-C 2º síntoma, D-726).
            Estaba solo dentro de los modales, y **el síntoma nuevo no abre
            ningún modal: te saca de la pantalla**. Un instrumento que solo se
            ve cuando sale un cartel no puede medir un rebote silencioso —
            L-221 en chiquito, otra vez. */}
        {bloqueTraza}
      </ScrollView>

      {/* La cita es de UNA mascota: con más de una en el hogar, se elige. */}
      <Hoja
        visible={eligiendoMascota !== null}
        titulo={t('explorar.elegirMascota')}
        onCerrar={() => setEligiendoMascota(null)}
      >
        <HojaScroll>
          {elegibles.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={m.nombre}
                inicio={<AvatarMascota nombre={m.nombre} fotoUrl={caraDeMascotaPorRuta({ especie: m.especie, rutaImagen: m.raza_ruta_imagen, fotoUri: fotos[m.id] })} tamano="sm" />}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  if (eligiendoMascota) {
                    setEligiendoMascota(null);
                    alElegirMascota(eligiendoMascota, m.id);
                  }
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* D-338: la Hoja del plan — nace con el paseador ELEGIDO */}
      <Hoja
        visible={plan !== null}
        titulo={t('plan.hojaTitulo')}
        onCerrar={() => setPlan(null)}
        conCerrar
      >
        {plan !== null ? (
          <PlanHoja
            paseador={plan.paseador}
            mascotaId={plan.mascotaId}
            fecha={fecha}
            hora={hora}
            onContratado={(contratado) => {
              setPlan(null);
              mostrar({ texto: t('plan.exito', { n: contratado.citas_generadas }), variante: 'exito' });
              // D-329: el hub vive en el stack del Hogar (otro tab) —
              // se vacía el stack de Explorar y recién ahí se navega.
              if (router.canDismiss()) router.dismissAll();
              router.navigate('/hogar/paseos');
            }}
          />
        ) : null}
      </Hoja>

      {/* P0: el catálogo de especies no llegó. Es OTRA cosa que no tener
          perros, y por eso tiene su propia voz — decirle «no tenés un perro
          registrado» a alguien que tiene dos es peor que no decir nada
          (Ley 13: el error se dice, y se dice lo que ES). */}
      <Hoja
        visible={catalogoNoLlego !== null}
        titulo={t(catalogoNoLlego === 'cargando' ? 'paquete.catalogoCargandoTitulo' : 'paquete.catalogoErrorTitulo')}
        onCerrar={() => setIntentoSinDatos(null)}
        conCerrar
      >
        <HojaScroll>
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Celda
              titulo={t(catalogoNoLlego === 'cargando' ? 'paquete.catalogoCargandoDetalle' : 'paquete.catalogoErrorDetalle')}
            />
            {/* 🔴 P0-C · ESTE ES EL MODAL QUE EL FOUNDER VE. La traza va acá, y
                la Hoja gana `HojaScroll` para que se pueda DESLIZAR: sin él, una
                traza larga quedaba fuera de pantalla y el instrumento volvía a
                no medir nada. */}
            {bloqueTraza}
            {/* Reintentar tiene que existir también acá: sin él, el modal del
                catálogo es un callejón — se cierra y vuelve a salir al tocar. */}
            <Boton
              variante="secundario"
              etiqueta={t('hogar.reintentar')}
              onPress={() => {
                setIntentoSinDatos(null);
                setReintento((n) => n + 1);
              }}
            />
          </View>
        </HojaScroll>
      </Hoja>

      {/* 🔴 LA HERMANA DE LA ANTERIOR, para las MASCOTAS (P0 reabierto 9-ago).
          Antes este caso no tenía voz: se caía en «no tenés un perro
          registrado», que es una afirmación sobre el HOGAR de alguien hecha
          sobre una lectura que falló. **La voz no culpa a las mascotas** —
          dice que el dato no llegó— y **ofrece reintentar**, porque un error
          sin salida obliga a salir de la pantalla y volver a entrar. */}
      <Hoja
        visible={mascotasNoLlegaron !== null}
        titulo={t(mascotasNoLlegaron === 'cargando' ? 'paquete.misMascotasCargandoTitulo' : 'paquete.misMascotasErrorTitulo')}
        onCerrar={() => setIntentoSinDatos(null)}
        conCerrar
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Celda
            titulo={t(
              mascotasNoLlegaron === 'cargando'
                ? 'paquete.misMascotasCargandoDetalle'
                : 'paquete.misMascotasErrorDetalle',
            )}
          />
          {mascotasNoLlegaron === 'error' ? (
            <Boton
              variante="secundario"
              etiqueta={t('hogar.reintentar')}
              onPress={() => {
                setIntentoSinDatos(null);
                // Reintentar de verdad: se limpia la marca de la cura 2.
                hogarCargadoRef.current = false;
                setMascotas('cargando');
                setReintento((n) => n + 1);
              }}
            />
          ) : null}
          {bloqueTraza}
        </View>
      </Hoja>

      {/* §1bis: hogar sin mascotas elegibles — voz honesta CON CAMINO */}
      <Hoja
        visible={sinElegibles}
        titulo={t('paquete.sinPerrosTitulo')}
        onCerrar={() => setSinElegibles(false)}
        conCerrar
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Celda titulo={t('paquete.sinPerrosDetalle')} />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('paquete.sinPerrosAccion')}
            onPress={() => {
              setSinElegibles(false);
              if (router.canDismiss()) router.dismissAll();
              router.navigate('/hogar/agregar');
            }}
          />
        </View>
      </Hoja>

      {/* P19: la pregunta única — SÍ sigue al flujo; NO frena con la voz */}
      <PaseoSocialHoja
        visible={preguntaSocial !== null}
        mascota={preguntaSocial?.mascota ?? null}
        onCerrar={() => setPreguntaSocial(null)}
        onRespondida={(ok) => {
          if (preguntaSocial === null) return;
          const { paseador, mascota } = preguntaSocial;
          // Solo se actualiza si HAY lista: si el estado es 'cargando'/'error',
          // no hay nada que parchear y fabricar un array acá inventaría datos.
          setMascotas((prev) =>
            Array.isArray(prev) ? prev.map((m) => (m.id === mascota.id ? { ...m, paseo_social_ok: ok } : m)) : prev,
          );
          setPreguntaSocial(null);
          if (ok) {
            continuarConMascota(paseador, mascota.id);
          } else {
            setSocialNo(mascota.nombre);
          }
        }}
      />

      {/* P19: el NO — voz honesta CON CAMINO, jamás final mudo. La
          respuesta queda registrada y es editable desde el perfil. */}
      <Hoja
        visible={socialNo !== null}
        titulo={t('paseoSocial.celdaTitulo')}
        onCerrar={() => setSocialNo(null)}
        conCerrar
      >
        {socialNo !== null ? (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.light,
                fontSize: typography.size.lg,
                lineHeight: Math.round(typography.size.lg * typography.leading.snug),
                color: theme.text.primary,
              }}
            >
              {t('paseoSocial.noVoz', { nombre: socialNo })}
            </Text>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: Math.round(typography.size.sm * typography.leading.normal),
                color: theme.text.secondary,
              }}
            >
              {t('paseoSocial.noVozCamino')}
            </Text>
            <Boton variante="primario" bloque etiqueta={t('paseoSocial.entendido')} onPress={() => setSocialNo(null)} />
          </View>
        ) : null}
      </Hoja>

      {/* §6bis.3: hay saldo con este paseador — el dueño ELIGE, parejo */}
      <Hoja
        visible={conSaldo !== null}
        titulo={t('paquete.eleccionTitulo')}
        onCerrar={() => setConSaldo(null)}
        conCerrar
      >
        {conSaldo !== null ? (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Celda
              titulo={t('paquete.eleccionVoz', { n: conSaldo.saldo })}
              metadataMono={`${fecha} · ${hora} · ${duracion} min`}
            />
            <Boton
              variante="primario"
              bloque
              etiqueta={t('paquete.reservarConPaquete')}
              cargando={reservando}
              onPress={() => void reservarConSaldo(conSaldo.paseador, conSaldo.mascotaId)}
            />
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('paquete.pagarSuelto')}
              deshabilitado={reservando}
              onPress={() => {
                const elegido = conSaldo;
                setConSaldo(null);
                void crearHold(elegido.paseador, elegido.mascotaId);
              }}
            />
          </View>
        ) : null}
      </Hoja>
    </SafeAreaView>
  );
}
