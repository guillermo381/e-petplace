/**
 * S79-B (T3-B2): LA SECCIÓN DE LA SEDE — "Dónde atiendes", compartida.
 *
 * DOS consumidores en esta app (condición de alcance de la mesa, T3-B3):
 * el perfil (`cuenta/perfil`) y la sala de espera (`/sala-espera`) —
 * MISMOS campos, MISMA pieza; el marco lo pone cada pantalla.
 *
 * DIRECCIÓN — espejo del patrón A4 del cliente (`direccion-hogar-form`,
 * copiar-al-vecino): predicciones inline debounced 350ms, elegir cierra
 * la sesión con Details, y LAS DOS LEYES del contrato (lugares.ts §2.2):
 *  · "No encontramos tu dirección" JAMÁS guarda coordenadas inventadas
 *    (resolverLugar es la única fuente de lat/lon).
 *  · LA COORDENADA MUERE CON EL TEXTO: editar a mano tras resolver mata
 *    el lugar — y la pantalla LO DICE ("Ubicada en el mapa" SOLO cuando
 *    es verdad; editada a mano, la ayuda dice que quedó sin punto).
 *  · sin_configuracion ⇒ degradación silenciosa a captura manual.
 *
 * RADIO — FIRMA FOUNDER (T3-B1.1): ARRANCA SIN DECLARAR. Sin radio →
 * TarjetaEstado en CONTORNO diciendo qué falta y PARA QUÉ (las familias
 * buscan por cercanía), con el 15 como SUGERENCIA RESALTADA EN SU
 * ETIQUETA ("15 km · sugerido") y NADA preseleccionado — solo un toque
 * explícito escribe. Con radio → APOYADA. NULL = "no declaró".
 */

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Campo,
  Celda,
  Icono,
  SelectorOpcion,
  Separador,
  Texto,
  spacing,
  useAviso,
  TarjetaEstado,
} from '@epetplace/ui';
import {
  buscarLugares,
  crearSesionLugares,
  resolverLugar,
  type LugarResuelto,
  type PrediccionLugar,
} from '@epetplace/api';

import { guardarSede, type SedeLeida } from '@/lib/sede';
import { useTraduccion } from '@/i18n';

const RADIOS_KM = [5, 10, 15, 20, 30] as const;

export function SeccionSede({
  sede,
  onPedirEspacio,
}: {
  sede: SedeLeida;
  /**
   * ⑤ S84-C34 — LA LISTA PIDE SU LUGAR (🔴 Places bajo el teclado).
   *
   * EL DEFECTO, medido: las predicciones nacen **INLINE y 350 ms DESPUÉS**
   * del foco. El auto-scroll del `ScrollView` ya ocurrió con el campo, y
   * `EvitaTeclado` empuja el CONTENEDOR pero **no mueve el scroll** — así
   * que la lista aparece justo debajo del campo, o sea dentro del área que
   * el teclado tapa. El founder la encontró porque sabía que estaba;
   * cualquier otro concluye que el buscador no funciona.
   *
   * POR QUÉ ESTA FORMA Y NO LA DE LOS PRECEDENTES: la casa resuelve
   * "apareció algo y hay que verlo" con scroll medido (`veterinaria/
   * taller:348`, `carnet:279`), pero los dos miden un hijo DIRECTO de su
   * ScrollView. Esta pieza vive tres niveles adentro, así que su `onLayout`
   * daría una `y` relativa al padre inmediato — **no al scroll**. Copiar
   * la receta habría scrolleado a una coordenada equivocada.
   *
   * LA VUELTA: la lista **no necesita saber dónde está, solo cuánto
   * ocupa**. Mide su propio alto —que sí es suyo— y pide ese scroll
   * RELATIVO. El campo sube exactamente lo que la lista ocupa, y la lista
   * queda donde estaba el campo: arriba del teclado, que es donde el dedo
   * ya está.
   *
   * ⚠️ SU LÍMITE, DECLARADO: si abajo no queda contenido suficiente, RN
   * clampea y la lista entra PARCIAL — pero **la primera opción siempre
   * queda visible**, que es lo que hoy no pasa.
   *
   * Opcional a propósito: una pantalla que no lo pase se comporta como
   * hoy en vez de romperse.
   */
  onPedirEspacio?: (alto: number) => void;
}) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [direccion, setDireccion] = useState(sede.direccion ?? '');
  const [ciudad, setCiudad] = useState(sede.ciudad ?? '');
  // T4-B4 (D-559): el barrio/zona — captura manual, cero motor extra.
  const [sector, setSector] = useState(sede.sector ?? '');
  const [guardando, setGuardando] = useState(false);
  // El radio local refleja el último toque confirmado por el server.
  const [radioKm, setRadioKm] = useState<number | null>(sede.radioKm);
  const [escribiendoRadio, setEscribiendoRadio] = useState(false);

  // La dirección inicial con coordenadas cuenta como resuelta (patrón A4):
  // editarla a mano la degrada igual que a una resolución fresca.
  const [lugar, setLugar] = useState<LugarResuelto | null>(
    sede.direccion !== null && sede.lat !== null && sede.lon !== null
      ? { placeId: '', direccion: sede.direccion, ciudad: sede.ciudad, lat: sede.lat, lon: sede.lon }
      : null,
  );
  const [predicciones, setPredicciones] = useState<PrediccionLugar[]>([]);
  /** Una sola vez POR APARICIÓN: `onLayout` dispara en cada relayout, y
   *  pedir scroll en cada uno movería la pantalla bajo el dedo mientras
   *  se tipea. Se rearma cuando la lista se vacía. */
  const espacioPedido = useRef(false);
  const sesionRef = useRef<string>(crearSesionLugares());
  const placesApagado = useRef(false);
  const resolviendo = useRef(false);

  useEffect(() => {
    if (placesApagado.current || resolviendo.current) return;
    const texto = direccion.trim();
    if (lugar && texto === lugar.direccion) {
      setPredicciones([]);
      espacioPedido.current = false;
      return;
    }
    if (texto.length < 3) {
      setPredicciones([]);
      espacioPedido.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        const r = await buscarLugares({ texto, sesion: sesionRef.current });
        if (!r.ok) {
          if (r.codigo === 'sin_configuracion') placesApagado.current = true;
          // red/google mientras se tipea: silencio — se sigue a mano.
          setPredicciones([]);
          espacioPedido.current = false;
          return;
        }
        setPredicciones(r.data.slice(0, 5));
      })();
    }, 350);
    return () => clearTimeout(timer);
  }, [direccion, lugar]);

  async function elegirPrediccion(p: PrediccionLugar) {
    if (resolviendo.current) return;
    resolviendo.current = true;
    setPredicciones([]);
    espacioPedido.current = false;
    const r = await resolverLugar({ placeId: p.placeId, sesion: sesionRef.current });
    // la sesión CERRÓ con Details — la próxima búsqueda abre una nueva.
    sesionRef.current = crearSesionLugares();
    resolviendo.current = false;
    if (!r.ok) {
      // El usuario actuó: el fallo se le dice — y NADA se guarda a medias.
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setLugar(r.data);
    setDireccion(r.data.direccion);
    if (r.data.ciudad !== null) setCiudad(r.data.ciudad);
  }

  function editarDireccion(texto: string) {
    setDireccion(texto);
    // La coordenada muere con el texto que la parió (§2.2).
    if (lugar && texto.trim() !== lugar.direccion) setLugar(null);
  }

  const resuelta = lugar !== null && direccion.trim() === lugar.direccion;

  async function guardarDireccion() {
    if (guardando) return;
    setGuardando(true);
    const r = await guardarSede({
      tipo: 'direccion',
      direccion: direccion.trim(),
      ciudad: ciudad.trim() === '' ? null : ciudad.trim(),
      sector: sector.trim() === '' ? null : sector.trim(),
      lat: resuelta ? lugar.lat : null,
      lon: resuelta ? lugar.lon : null,
    });
    setGuardando(false);
    mostrar(
      r.ok
        ? { texto: t('sede.guardada'), variante: 'exito' }
        : { texto: r.mensaje, variante: 'error' },
    );
  }

  async function tocarRadio(codigo: string) {
    if (escribiendoRadio) return;
    const km = Number(codigo);
    if (!RADIOS_KM.includes(km as (typeof RADIOS_KM)[number])) return;
    setEscribiendoRadio(true);
    const r = await guardarSede({ tipo: 'radio', radioKm: km });
    setEscribiendoRadio(false);
    if (!r.ok) {
      // el toque NO escribió: el estado local no miente la elección
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setRadioKm(km);
    mostrar({ texto: t('sede.radioGuardado', { km }), variante: 'exito' });
  }

  const radioDeclarado = radioKm !== null;
  const opcionesRadio = RADIOS_KM.map((km) => ({
    codigo: String(km),
    // la SUGERENCIA vive en la etiqueta SOLO mientras nada está declarado
    etiqueta: km === 15 && !radioDeclarado ? t('sede.radioSugerido', { km }) : t('sede.radioKm', { km }),
  }));

  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Icono nombre="ubicacion" registro="aa" tamano={21} />
        <Texto variante="seccion">{t('sede.titulo')}</Texto>
      </View>

      <Campo
        label={t('sede.direccionLabel')}
        value={direccion}
        onChangeText={editarDireccion}
        placeholder={t('sede.direccionPlaceholder')}
        ayuda={
          resuelta
            ? t('sede.ubicadaEnMapa')
            : direccion.trim().length > 0
              ? t('sede.escritaAMano')
              : undefined
        }
        autoCapitalize="sentences"
      />
      {predicciones.length > 0 ? (
        <View
          onLayout={(e) => {
            const alto = e.nativeEvent.layout.height;
            if (espacioPedido.current || alto <= 0) return;
            espacioPedido.current = true;
            onPedirEspacio?.(alto);
          }}
        >
          {predicciones.map((p, i) => (
            <View key={p.placeId}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={p.textoPrincipal}
                subtitulo={p.textoSecundario ?? undefined}
                interactiva
                accessibilityRole="button"
                onPress={() => void elegirPrediccion(p)}
              />
            </View>
          ))}
        </View>
      ) : null}
      <Campo label={t('sede.ciudadLabel')} value={ciudad} onChangeText={setCiudad} autoCapitalize="words" />
      <Campo
        label={t('sede.sectorLabel')}
        value={sector}
        onChangeText={setSector}
        ayuda={t('sede.sectorAyuda')}
        autoCapitalize="words"
      />
      <Boton
        etiqueta={t('sede.guardarDireccion')}
        bloque
        cargando={guardando}
        deshabilitado={direccion.trim() === ''}
        onPress={() => void guardarDireccion()}
      />

      {/* ── EL RADIO (T3-B1.1, forma firmada) ── */}
      <TarjetaEstado encendido={radioDeclarado} etiqueta={t('sede.radioTitulo')}>
        <View style={{ flex: 1, gap: spacing[2] }}>
          <Texto variante="seccion">{t('sede.radioTitulo')}</Texto>
          <Texto variante="apoyo">
            {radioDeclarado
              ? t('sede.radioDeclarado', { km: radioKm })
              : t('sede.radioFalta')}
          </Texto>
          <SelectorOpcion
            acento="oficio"
            etiqueta={t('sede.radioTitulo')}
            etiquetaVisible={false}
            opciones={opcionesRadio}
            seleccionada={radioDeclarado ? String(radioKm) : undefined}
            onSelect={(codigo) => void tocarRadio(codigo)}
            disposicion="grilla"
          />
        </View>
      </TarjetaEstado>
    </View>
  );
}
