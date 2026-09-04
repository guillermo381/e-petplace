/**
 * UN RECUERDO — la pantalla del lote 0.1 (S113-C).
 *
 * Ruta raíz con parámetros, **calcada de `/carnet` y de `/antiparasitario`**
 * (`{ mascotaId, nombre }`): la abre el cuarto dedo de la pata desde cualquier
 * pestaña, así que no puede vivir adentro del stack del Hogar.
 *
 * ── EL ORDEN DE LOS DOS ACTOS, Y NO ES INTERCAMBIABLE ───────────────────────
 * **La foto se sube ANTES y por la puerta que ya existe** (`subirFotoMascota`,
 * bucket `mascotas`, carpeta del dueño); a la puerta del recuerdo viaja **el
 * PATH**, jamás la URL ni los bytes. Si la subida falla, **el recuerdo no se
 * intenta**: guardar un recuerdo que dice tener foto y no la tiene es peor que
 * no guardarlo. *El formulario queda intacto y la razón se lee en una línea.*
 *
 * ⚠️ **Y las cinco razones de la subida NO se reescriben acá**: se reusan las
 * de `carnet.subida*`, que ya están en voz de la casa y en los dos idiomas.
 * *Cinco frases nuevas para decir lo mismo son cinco frases que algún día
 * divergen* (`L-175`: se reusa, no se copia). Su namespace dice `carnet`
 * porque nacieron ahí, y **describen la SUBIDA, no el carnet** — el nombre
 * quedó corto, no equivocado.
 *
 * ── LO QUE LA PANTALLA NO DECIDE ────────────────────────────────────────────
 * **Procedencia (`declarado_por_familia`) y modo de captura los estampa el
 * SERVIDOR**, y por eso no son parámetros: por esa puerta no entra nadie más.
 * La fecha omitida también la resuelve el servidor — acá se manda siempre
 * porque el campo es editable y el día del teléfono es el que la familia ve.
 *
 * ── SE PUEDE GUARDAR CON SÓLO FOTO O SÓLO TEXTO ─────────────────────────────
 * Con nada, **el botón dice por qué está apagado** en vez de quedarse mudo. El
 * mismo rebote existe del lado del servidor (`recuerdo_vacio`): *el espejo en
 * pantalla existe para que la razón se lea antes del viaje, jamás para
 * reemplazar la puerta.*
 */

import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  CampoFecha,
  Encabezado,
  EvitaTeclado,
  Icono,
  Texto,
  radius,
  spacing,
  useAviso,
  useTheme,
  type CampoFechaValor,
  type FotoCapturada,
} from '@epetplace/ui';
import { obtenerSesion, registrarRecuerdoFamilia } from '@epetplace/api';

import { HojaFotoMascota } from '@/components/HojaFotoMascota';
import { cuerpoDelRecuerdo, frenoDelRecuerdo, keyDelRebote } from '@/lib/recuerdo/decidir';
import { subirFotoMascota } from '@/lib/subir-avatar';
import { useTraduccion } from '@/i18n';

/** Las cinco razones de la subida, en voz de la casa. **Se reusan, no se
 *  copian** — ver la cabecera. */
const VOZ_SUBIDA = {
  lectura_local: 'carnet.subidaLecturaLocal',
  archivo_grande: 'carnet.subidaArchivoGrande',
  mime_no_soportado: 'carnet.subidaMime',
  rechazado_por_policy: 'carnet.subidaPolicy',
  red_o_desconocido: 'carnet.subidaRed',
} as const;

/** Hoy en fecha LOCAL por partes literales — **jamás `toISOString()`**, que
 *  corre el día en UTC−5 (D-312, hallazgo S55). */
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export default function Recuerdo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const params = useLocalSearchParams<{ mascotaId?: string; nombre?: string }>();
  const mascotaId = params.mascotaId ?? '';
  const nombre = params.nombre ?? t('alta.tuMascota');

  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [texto, setTexto] = useState('');
  const [fecha, setFecha] = useState<CampoFechaValor>({ fecha: hoyLocal(), precision: 'exacta' });
  const [hojaFoto, setHojaFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  /* 🔴 LA DECISIÓN NO VIVE EN LA PANTALLA: vive en `lib/recuerdo/decidir`, y
     es lo que vuelve MEDIBLE el «cero llamadas» del encargo. *Que el botón no
     dispare nada sin foto ni texto se puede leer en el código —el `return`
     está antes del primer `await`— pero leer no es medir.* */
  const hoy = hoyLocal();
  const freno = frenoDelRecuerdo({ hayFoto: foto !== null, texto, fecha: fecha.fecha, hoy });
  const fechaFutura = freno === 'fechaFutura';
  const valido = freno === null && !guardando;

  /** Por qué está apagado Guardar. `undefined` = no lo está. */
  const razonDelFreno: string | undefined =
    guardando || freno === null
      ? undefined
      : freno === 'faltaAlgo'
        ? t('recuerdo.faltaAlgo')
        : t('recuerdo.fechaFutura');

  const guardar = async () => {
    if (!valido) return;
    setGuardando(true);
    setError(undefined);

    /* ① LA FOTO PRIMERO, y si falla el recuerdo no se intenta. */
    let fotoPath: string | undefined;
    if (foto !== null) {
      const sesion = await obtenerSesion();
      if (!sesion.ok || sesion.data === null) {
        setGuardando(false);
        setError(t('recuerdo.errSesion'));
        return;
      }
      const subida = await subirFotoMascota({ uri: foto.uri, userId: sesion.data.user_id, prefijo: 'recuerdo' });
      if (!subida.ok) {
        setGuardando(false);
        const key = subida.codigo in VOZ_SUBIDA ? VOZ_SUBIDA[subida.codigo] : VOZ_SUBIDA.red_o_desconocido;
        setError(t(key));
        return;
      }
      fotoPath = subida.path;
    }

    /* ② EL RECUERDO. El cuerpo lo arma la frontera —un texto vacío NO viaja—
       y el mapa de rebotes también vive ahí: los dos se miden sin React. */
    const r = await registrarRecuerdoFamilia(
      cuerpoDelRecuerdo({ mascotaId, texto, fotoPath, fecha: fecha.fecha }),
    );
    setGuardando(false);
    if (!r.ok) {
      // El formulario queda INTACTO: sólo aparece la razón, en una línea.
      setError(t(keyDelRebote(r.codigo)));
      return;
    }
    mostrar({ variante: 'exito', texto: t('recuerdo.guardado', { mascota: nombre }) });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('recuerdo.titulo', { mascota: nombre })}
        atras
        onAtras={() => router.back()}
      />
      <EvitaTeclado>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        >
          {/* LA FOTO, GRANDE Y ARRIBA. Sin foto **no hay ícono de error**: hay
              un lugar que invita — la misma diferencia que hay entre «falta un
              dato» y «acá va algo tuyo». */}
          <Pressable
            onPress={() => setHojaFoto(true)}
            accessibilityRole="button"
            accessibilityLabel={foto === null ? t('recuerdo.agregarFoto') : t('recuerdo.cambiarFoto')}
            style={{
              width: '100%',
              aspectRatio: 4 / 3,
              borderRadius: radius.lg,
              overflow: 'hidden',
              backgroundColor: theme.bg.overlay,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
            }}
          >
            {foto !== null ? (
              <Image source={{ uri: foto.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <>
                <Icono nombre="foto" tamano={28} registro="tinta" tinta={theme.text.secondary} />
                <Texto variante="apoyo">{t('recuerdo.agregarFoto')}</Texto>
              </>
            )}
          </Pressable>

          <Campo
            label={t('recuerdo.textoLabel')}
            value={texto}
            onChangeText={setTexto}
            placeholder={t('recuerdo.textoPlaceholder')}
            /* «unas líneas», literal del encargo: cuatro es el alto que la casa
               ya usa para un texto libre corto. La pieza pide un NÚMERO, no un
               booleano — el alto es fijo y por eso no salta al escribir. */
            multilinea={4}
          />

          <CampoFecha
            label={t('recuerdo.fechaLabel')}
            valor={fecha}
            onChange={setFecha}
            placeholder={t('recuerdo.fechaPlaceholder')}
            tituloHoja={t('recuerdo.fechaLabel')}
            error={fechaFutura ? t('recuerdo.fechaFutura') : undefined}
          />

          {error !== undefined ? (
            <Texto variante="apoyo" color="danger">
              {error}
            </Texto>
          ) : null}

          {/* 🔴 UN BOTÓN APAGADO SIN RAZÓN A LA VISTA ES EL DEFECTO: acá sólo
              dos cosas pueden trabarlo y la razón nombra cuál. */}
          <Boton
            variante="primario"
            bloque
            etiqueta={t('recuerdo.guardar')}
            cargando={guardando}
            deshabilitado={!valido}
            razonDeshabilitado={razonDelFreno}
            onPress={() => void guardar()}
          />
        </ScrollView>
      </EvitaTeclado>

      <HojaFotoMascota
        visible={hojaFoto}
        titulo={t('recuerdo.agregarFoto')}
        onCerrar={() => setHojaFoto(false)}
        onFoto={(f) => setFoto(f)}
        onPermisoDenegado={() => mostrar({ variante: 'error', texto: t('recuerdo.permisoDenegado') })}
      />
    </View>
  );
}
