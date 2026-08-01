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

export function SeccionSede({ sede }: { sede: SedeLeida }) {
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
  const sesionRef = useRef<string>(crearSesionLugares());
  const placesApagado = useRef(false);
  const resolviendo = useRef(false);

  useEffect(() => {
    if (placesApagado.current || resolviendo.current) return;
    const texto = direccion.trim();
    if (lugar && texto === lugar.direccion) {
      setPredicciones([]);
      return;
    }
    if (texto.length < 3) {
      setPredicciones([]);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        const r = await buscarLugares({ texto, sesion: sesionRef.current });
        if (!r.ok) {
          if (r.codigo === 'sin_configuracion') placesApagado.current = true;
          // red/google mientras se tipea: silencio — se sigue a mano.
          setPredicciones([]);
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
        <View>
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
