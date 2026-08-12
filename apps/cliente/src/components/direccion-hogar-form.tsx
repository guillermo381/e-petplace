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
}: {
  inicial: DireccionHogar | null;
  onGuardada: (direccion: DireccionHogar) => void;
  /** §7 de la letra S96: en el checkout de la despensa el punto es
   *  OBLIGATORIO. Default false: Cuenta no cambia sin su propio gate. */
  exigirPunto?: boolean;
}) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [direccion, setDireccion] = useState(inicial?.direccion ?? '');
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? 'Quito');
  const [sector, setSector] = useState(inicial?.sector ?? '');
  const [referencias, setReferencias] = useState(inicial?.referencias ?? '');
  const [guardando, setGuardando] = useState(false);

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

  // ── EL PUNTO (S96 · §7) ──────────────────────────────────────────
  const [punto, setPunto] = useState<{ lat: number; lon: number } | null>(
    inicial && inicial.lat !== null && inicial.lon !== null
      ? { lat: inicial.lat, lon: inicial.lon }
      : null,
  );

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
          if (r.codigo === 'sin_configuracion') placesApagado.current = true;
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
    const r = await guardarDireccionHogar({
      direccion,
      ciudad,
      sector: sector.trim() === '' ? null : sector,
      referencias: referencias.trim() === '' ? null : referencias,
      lat: punto?.lat ?? null,
      lon: punto?.lon ?? null,
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
      <Campo label={t('direccion.ciudadLabel')} value={ciudad} onChangeText={setCiudad} autoCapitalize="words" />
      <Campo label={t('direccion.sectorLabel')} value={sector} onChangeText={setSector} autoCapitalize="words" />
      <Campo
        label={t('direccion.referenciasLabel')}
        value={referencias}
        onChangeText={setReferencias}
        ayuda={t('direccion.referenciasAyuda')}
        autoCapitalize="sentences"
      />

      {/* EL PUNTO (§7) — el pin es el centro; se mueve el mapa. Sin
          ninguna coordenada todavía, el camino es ponerlo a mano. */}
      {punto !== null ? (
        <View style={{ gap: spacing[1] }}>
          <PinMovible
            lat={punto.lat}
            lon={punto.lon}
            onMover={(lat, lon) => setPunto({ lat, lon })}
            etiqueta={t('direccion.puntoEtiqueta')}
          />
          <Texto variante="apoyo">{t('direccion.puntoAyuda')}</Texto>
        </View>
      ) : (
        <Boton
          variante="secundario"
          etiqueta={t('direccion.ponerPunto')}
          onPress={() => setPunto(SEMILLA_QUITO)}
        />
      )}

      {faltaPunto ? <Texto variante="apoyo">{t('direccion.faltaPunto')}</Texto> : null}
      <Boton
        etiqueta={t('direccion.guardar')}
        bloque
        cargando={guardando}
        deshabilitado={direccion.trim() === '' || ciudad.trim() === '' || faltaPunto}
        onPress={() => void guardar()}
      />
    </View>
  );
}
