/**
 * Formulario de la dirección del HOGAR (S56-A, D-339; S79-A4 gana
 * Places) — compartido por la pantalla Cuenta·Tu dirección y la Hoja
 * del checkout (la captura es UNA, jamás dos formularios que diverjan).
 * Presentacional + guardar: el padre decide qué pasa después.
 * Escalera: no muestra datos del expediente (formulario puro).
 *
 * TESIS: tu dirección comunica que el cuidado llega a TU puerta.
 * FIRMA: la resolución — escribís y tu dirección aparece completa, con
 * su ciudad puesta (contrato lugares.ts de packages/api; cero mapa,
 * cero formulario de seis pasos).
 * CHANEL: al resolver, la ciudad se llena sola — el campo deja de
 * pedir trabajo que la resolución ya hizo.
 *
 * LA LEY DEL CONTRATO (LETRA_PERFIL_S79 §2.2): las coordenadas SOLO
 * salen de resolverLugar; editar el texto a mano DESPUÉS de resolver
 * las mata (lugar=null) y el guardado las pisa con NULL server-side —
 * la coordenada muere con el texto que la parió. Si Places no está
 * configurado (sin_configuracion) o la red falla mientras se tipea, el
 * formulario degrada EN SILENCIO a lo de siempre: captura manual sin
 * coordenadas — la puerta no promete lo que no puede cumplir (Ley 23).
 */

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Boton, Campo, Celda, Separador, spacing, useAviso } from '@epetplace/ui';
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

export function DireccionHogarForm({
  inicial,
  onGuardada,
}: {
  inicial: DireccionHogar | null;
  onGuardada: (direccion: DireccionHogar) => void;
}) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [direccion, setDireccion] = useState(inicial?.direccion ?? '');
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? 'Quito');
  const [sector, setSector] = useState(inicial?.sector ?? '');
  const [referencias, setReferencias] = useState(inicial?.referencias ?? '');
  const [guardando, setGuardando] = useState(false);

  // ── Places (S79-A4) ──────────────────────────────────────────────
  // La dirección inicial con coordenadas cuenta como resuelta: editarla
  // a mano la degrada igual que a una resolución fresca.
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
  const sesionRef = useRef<string>(crearSesionLugares());
  // sin_configuracion una vez ⇒ Places no está en este entorno: se apaga
  // la búsqueda y el formulario es el manual de siempre (degradación
  // honesta y silenciosa — nada prometió buscar).
  const placesApagado = useRef(false);
  const resolviendo = useRef(false);

  useEffect(() => {
    if (placesApagado.current || resolviendo.current) return;
    const texto = direccion.trim();
    // texto igual al resuelto = no hay nada que buscar
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
    // la sesión CERRÓ con Details (contrato lugares.ts) — la próxima
    // búsqueda abre una nueva.
    sesionRef.current = crearSesionLugares();
    resolviendo.current = false;
    if (!r.ok) {
      // El usuario actuó: el fallo se le dice — y NADA se guarda a
      // medias (lugar queda null; el texto tipeado se conserva).
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

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    const resuelta = lugar !== null && direccion.trim() === lugar.direccion;
    const r = await guardarDireccionHogar({
      direccion,
      ciudad,
      sector: sector.trim() === '' ? null : sector,
      referencias: referencias.trim() === '' ? null : referencias,
      lat: resuelta ? lugar.lat : null,
      lon: resuelta ? lugar.lon : null,
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
      lat: resuelta ? lugar.lat : null,
      lon: resuelta ? lugar.lon : null,
    });
  }

  return (
    <View style={{ gap: spacing[2] }}>
      <Campo
        label={t('direccion.direccionLabel')}
        value={direccion}
        onChangeText={editarDireccion}
        placeholder={t('direccion.direccionPlaceholder')}
        ayuda={lugar !== null && direccion.trim() === lugar.direccion ? t('direccion.ubicada') : undefined}
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
      <Campo label={t('direccion.ciudadLabel')} value={ciudad} onChangeText={setCiudad} autoCapitalize="words" />
      <Campo label={t('direccion.sectorLabel')} value={sector} onChangeText={setSector} autoCapitalize="words" />
      <Campo
        label={t('direccion.referenciasLabel')}
        value={referencias}
        onChangeText={setReferencias}
        ayuda={t('direccion.referenciasAyuda')}
        autoCapitalize="sentences"
      />
      <Boton
        etiqueta={t('direccion.guardar')}
        bloque
        cargando={guardando}
        deshabilitado={direccion.trim() === '' || ciudad.trim() === ''}
        onPress={() => void guardar()}
      />
    </View>
  );
}
