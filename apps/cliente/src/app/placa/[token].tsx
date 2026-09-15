/**
 * ⭐ **«ESTA PLACA ESPERA A SU MASCOTA»** (S113-C · fase 3 · C4).
 *
 * El destino del deep link de una placa **sin activar**. Alguien la escaneó —
 * puede ser quien la compró, puede ser quien encontró un perro en la calle— y
 * lo que ve depende de si tiene sesión.
 *
 * ── 🔴 UN CÓDIGO SIN ACTIVAR NO DICE NADA DE NADIE ────────────────────────
 * Ley de la fase. La pantalla **no nombra una mascota, ni una familia, ni una
 * ciudad**: sólo dice que la placa está libre. *Si dijera «esta placa era de
 * Thor», el código impreso en una chapita se convertiría en una consulta
 * abierta sobre quién vive dónde.*
 *
 * ── CON SESIÓN Y SIN SESIÓN ───────────────────────────────────────────────
 * · **Con sesión** — elegir a cuál de sus mascotas se la pone. Es el caso de
 *   quien la compró y la está estrenando.
 * · **Sin sesión** — a la tienda. *No se le pide crear cuenta a alguien que
 *   quizá sólo encontró una placa en el piso: se le ofrece la suya.*
 *
 * ── LO QUE ESPERA LA BUILD, dicho por nombre ──────────────────────────────
 * 🔴 **El escaneo con la cámara.** `expo-camera` **no está instalado** —medido
 * en el package.json del cliente— y una dependencia nativa nueva no viaja por
 * OTA (`L-134`). *Instalarla hoy rompería la app que ya está en la calle.*
 * Esta pantalla **no la necesita**: se llega por el link del QR, que es como
 * llega quien encuentra al animal. El escaneo desde el pasaporte entra con la
 * build, junto al PDF y al micrófono (`S113-NFC-BUILD.md`).
 */
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HojaContenido,
  Boton,
  Cabecera,
  EstadoVacio,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import {
  activarPlaca,
  estadoDePlaca,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerSesion,
  type MascotaResumen,
} from '@epetplace/api';

import { CeldaNavegacion } from '@epetplace/ui';
import { useTraduccion } from '@/i18n';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

type Fase =
  | { f: 'mirando' }
  | { f: 'libre'; conSesion: boolean }
  | { f: 'yaEstaba' }
  | { f: 'ajena' };

export default function PlacaSinActivar() {
  const cabecera = useAltoDeCabecera('empujada');
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTraduccion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const aviso = useAviso();

  const [fase, setFase] = useState<Fase>({ f: 'mirando' });
  /** 🔴 **TRES FASES, NO UN ARRAY VACÍO** (`R34`, y el gate lo cazó acá).
   *  Un `[]` que también significa «falló la lectura» hace que la pantalla
   *  diga «no tienes mascotas» cuando lo que pasó es que no pudo preguntar.
   *  *Le pasó al founder DOS VECES con el paseo, la segunda con la primera
   *  cura ya publicada.* */
  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const sesion = await obtenerSesion();
      const conSesion = sesion.ok && sesion.data !== null;
      /* 🔴 **SIN SESIÓN NO SE PREGUNTA, y esto lo destapó medirlo.**
         `estado_de_placa` **exige sesión** —rebota `auth_required`, medido
         contra la base—, así que a quien encuentra una placa en la calle le
         íbamos a decir *«esta no es una placa de e-PetPlace»* sobre una placa
         que sí lo es. *Un rebote de permisos leído como un veredicto sobre el
         objeto es la peor clase de mentira: suena a dato.*
         Sin sesión la pantalla va directo a su oferta, que es lo único honesto
         que puede decir. */
      if (!conSesion) {
        setFase({ f: 'libre', conSesion: false });
        return;
      }
      const r = await estadoDePlaca(token);
      if (!vivo) return;
      if (!r.ok) {
        /* Con sesión, un rebote sí es del token: el motor pudo mirar. */
        setFase({ f: 'ajena' });
        return;
      }
      if (r.data === 'activada') {
        setFase({ f: 'yaEstaba' });
        return;
      }
      setFase({ f: 'libre', conSesion });
      if (conSesion) {
        /* La familia sale del estado de onboarding, como en el Hogar: *el
           lector de mascotas pide su id, y componerlo acá sería una segunda
           forma de resolver de quién es esta cuenta.* */
        const est = await getEstadoOnboardingDueno();
        if (!vivo) return;
        if (!est.ok || est.data.familia_id === null) {
          setMascotas('error');
          return;
        }
        const m = await obtenerMascotasDeFamilia(est.data.familia_id);
        if (!vivo) return;
        setMascotas(m.ok ? m.data : 'error');
      }
    })();
    return () => {
      vivo = false;
    };
  }, [token]);

  const activar = (mascotaId: string, nombre: string) => {
    if (activando) return;
    setActivando(true);
    void activarPlaca(token, mascotaId).then((r) => {
      setActivando(false);
      if (!r.ok) {
        aviso.mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      aviso.mostrar({ variante: 'exito', texto: t('placa.activada', { nombre }) });
      router.replace({ pathname: '/hogar/mascota/pasaporte', params: { mascotaId } });
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ⭐ **LA ESTRUCTURA FIRMADA — S116-C lote 3b (precisión del founder).**
          *Migrar no es cambiar `Encabezado` por `Cabecera`.* El ciruela es el
          FONDO —`presentacion="fondo"`: sin radio inferior, sin sombra— y el
          contenido vive en una hoja de lienzo que lo tapa al scrollear. **La
          curva es de la HOJA y mira hacia ARRIBA**; la cabecera-tarjeta con las
          esquinas de abajo redondeadas muere en el cliente.
          ⚠️ El `paddingBottom` con `insets.bottom` que había acá SE RETIRA: lo
          paga la hoja en su propio render, y sumarlo sería pagarlo dos veces
          (`R53`). */}
      <HojaContenido
        arranque={cabecera.arranque}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="empujada"
              titulo={t('placa.titulo')}
              onVolver={() => router.back()}
              etiquetaVolver={t('comun.volver')}
              presentacion="fondo"
            />
          </View>
        }

      >
        {/* 🔴 **EL RELLENO VA ADENTRO DE LA HOJA, NO EN EL SCROLL.** Traduje
          `contentContainerStyle` del `ScrollView` viejo a su HOMÓNIMO en la
          hoja, y no son lo mismo: **en la hoja ese estilo envuelve A LA HOJA**,
          no a su contenido. ⇒ el padding lateral dejaba una franja de ciruela
          a cada lado, el de arriba pegaba el contenido al borde redondeado
          —«Tu paseo» salía cortado— y el de abajo separaba la hoja del piso.
          *Medido en el aparato: hoja de 996 px en pantalla de 1080 = 42 px de
          ciruela por lado, que es `spacing[4]` exacto.* */}
        <View style={{ paddingHorizontal: spacing[5], gap: spacing[5] }}>
          {fase.f === 'mirando' ? (
            <Texto variante="apoyo">{t('placa.mirando')}</Texto>
          ) : fase.f === 'ajena' ? (
            /* Ni error rojo ni disculpa: **es un hecho**. */
            <EstadoVacio registro="seccion" titulo={t('placa.ajena')} />
          ) : fase.f === 'yaEstaba' ? (
            /* 🔴 **Y acá tampoco se dice de quién.** Que la placa esté activada
               es lo único que se puede saber sin sesión. */
            <EstadoVacio registro="seccion" titulo={t('placa.yaEstaba')} />
          ) : fase.conSesion ? (
            <>
              <Texto variante="cuerpo">{t('placa.esperaAMascota')}</Texto>
              {mascotas === 'cargando' ? (
                <Texto variante="apoyo">{t('placa.mirando')}</Texto>
              ) : mascotas === 'error' ? (
                /* Ley 13: el fallo DICE que es fallo — **jamás se disfraza de
                   «no tienes mascotas»**. */
                <Texto variante="dato" color="danger">{t('placa.noPudimosLeer')}</Texto>
              ) : mascotas.length === 0 ? (
                <EstadoVacio registro="seccion" titulo={t('placa.sinMascotas')} />
              ) : (
                <Tarjeta relleno="ninguno" elevacion="reposo">
                  {mascotas.map((m, i) => (
                    <View key={m.id}>
                      {i > 0 ? <Separador /> : null}
                      <CeldaNavegacion
                        titulo={m.nombre}
                        registro="tinta"
                        onPress={() => activar(m.id, m.nombre)}
                      />
                    </View>
                  ))}
                </Tarjeta>
              )}
            </>
          ) : (
            <>
              <Texto variante="cuerpo">{t('placa.esperaAMascota')}</Texto>
              {/* Sin sesión: la suya, no la de otro. */}
              <Boton
                etiqueta={t('placa.quieroUna')}
                bloque
                onPress={() => router.push('/despensa')}
              />
            </>
          )}
        </View>
      </HojaContenido>
    </View>
  );
}
