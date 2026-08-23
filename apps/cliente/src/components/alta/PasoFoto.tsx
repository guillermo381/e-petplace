/**
 * S91-D · PASO 4/4 — «Una foto de {nombre}».
 *
 * Hereda ENTERO el acuerdo de la lámina de foto (S82,
 * `docs/laminas/2026-07-29-s82-foto-onboarding.html`): la foto se elige sin
 * recorte nativo y el ENCUADRE es de la casa (pinza + arrastre con clamp,
 * previews en vivo). Eso no se toca — está firmado y funciona.
 *
 * ── LO QUE S91 CAMBIA, y son dos cosas ──────────────────────────────────────
 * ① EL CÍRCULO YA NO ESTÁ VACÍO. Mientras no haya foto muestra la cara de su
 *   raza (o la de su especie): es el MISMO círculo que en el paso 2 acompañaba
 *   a la elección — «un elemento, dos trabajos». Antes acá había una huella
 *   genérica, que es honesta pero no le dice nada a nadie.
 * ② «AHORA NO» PASÓ DE BOTÓN A TEXTO. La ley dice foto opcional pero MUY
 *   sugerida, y ese peso visual ES esa frase: un `Boton` bloque de «Continuar»
 *   compitiendo con «Elegir foto» le decía a la persona que las dos opciones
 *   valen lo mismo. Se usa `variante="ghost"` porque es la pieza de la casa
 *   para una acción SIN CAJA (19.7: el contorno transparente murió; lo que
 *   ejecuta sin navegar va como label).
 *
 * Y lo que NO cambió porque ya estaba bien: **permiso de cámara denegado
 * JAMÁS frena el alta** — se dice y se sigue.
 */

import { useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Encabezado,
  Texto,
  spacing,
  useTheme,
  type FotoCapturada,
} from '@epetplace/ui';

import { EncuadreFoto, PreviewSuperficies } from '@/components/EncuadreFoto';
import { HojaFotoMascota } from '@/components/HojaFotoMascota';
import { ENCUADRE_DEFAULT, type Encuadre } from '@/components/foto-encuadre';
import { useTraduccion } from '@/i18n';
import { caraDeMascota } from '@/lib/cara-mascota';
import type { BorradorAlta } from './tipos';

export function PasoFoto({
  borrador,
  onAvanzar,
  onAtras,
}: {
  borrador: BorradorAlta;
  onAvanzar: (parcial: BorradorAlta) => void;
  onAtras: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const nombre = borrador.nombre ?? t('alta.tuMascota');

  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  // r3 paso 2: mientras el gesto vive, el scroll padre NO compite.
  const [gestoActivo, setGestoActivo] = useState(false);
  // El encuadre vigente NO re-renderiza la pantalla: vive en ref y las
  // previews viven en el UI thread (EncuadreFoto).
  const encuadreRef = useRef<Encuadre>(ENCUADRE_DEFAULT);

  /** G5 (gate founder) — EL ESCAPARATE TAMBIÉN SIN FOTO PROPIA.
   *  Las imágenes del bucket son 1:1 (medido: 1254×1254 en origen), así que
   *  el encuadre neutro las muestra centradas y completas. Son constantes
   *  envueltas porque la pieza lee SharedValues: las previews viven en el UI
   *  thread y no se les cambia el contrato por este caso. */
  const cxFijo = useSharedValue(ENCUADRE_DEFAULT.cx);
  const cyFijo = useSharedValue(ENCUADRE_DEFAULT.cy);
  const zFijo = useSharedValue(1);
  const caraGaleria = caraDeMascota({ especie: borrador.especie, razaSlug: borrador.razaSlug });

  const avanzar = () =>
    onAvanzar(
      foto !== null
        ? {
            fotoUri: foto.uri,
            conFoto: '1',
            cx: String(encuadreRef.current.cx),
            cy: String(encuadreRef.current.cy),
            z: String(encuadreRef.current.z),
          }
        : {},
    );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('alta.paso4Titulo', { nombre })}
        atras
        onAtras={onAtras}
      />
      <ScrollView
        scrollEnabled={!gestoActivo}
        contentContainerStyle={{
          padding: spacing[5],
          paddingTop: spacing[6],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[5],
        }}
      >
        {foto === null ? (
          /**
           * A3 (gate del founder, 2ª pasada) — LOS DOS CAMINOS TERMINAN IGUAL.
           *
           * El de la foto ya ordenaba «contenido → preview → acciones»; éste
           * tenía «Elegir foto» en el MEDIO, con el preview colgando debajo y
           * la salida al final. Dos remates distintos para el mismo paso.
           *
           * Y el preview vivía DENTRO del contenedor centrado: su encabezado
           * («Así lo vas a ver») y su hilera están compuestos a la izquierda,
           * así que el `alignItems: 'center'` de afuera los descolocaba. Por
           * eso sale del centrado y respira a lo ancho, igual que en el otro
           * camino — **el acabado no se copió: se compartió la disposición.**
           *
           * Las dos acciones cierran juntas y las dos son `bloque`: la salida
           * gana la anatomía de secundario que la lámina le pide, y queda
           * inconfundible como salida por ser `ghost` y por ir última.
           */
          <>
            <View style={{ alignItems: 'center', gap: spacing[4], paddingTop: spacing[6] }}>
              <AvatarMascota
                nombre={nombre}
                fotoUrl={caraDeMascota({ especie: borrador.especie, razaSlug: borrador.razaSlug })}
                tamano="lg"
              />
              <Texto variante="apoyo" centrado>
                {t('fotoEncuadre.elegirDetalle')}
              </Texto>
              {permisoDenegado ? (
                <Texto variante="apoyo" color="danger" centrado>
                  {t('fotoEncuadre.permisoCamara')}
                </Texto>
              ) : null}
            </View>

            {/* G5: el MISMO componente, con la cara de la galería. Antes esto
                solo existía tras subir una foto propia — y es justamente el
                escaparate de los otros servicios (letra firmada). */}
            {caraGaleria !== undefined ? (
              <PreviewSuperficies
                uri={caraGaleria}
                dim={{ iw: 1254, ih: 1254 }}
                cx={cxFijo}
                cy={cyFijo}
                z={zFijo}
              />
            ) : null}

            <Boton
              variante="secundario"
              bloque
              etiqueta={t('fotoEncuadre.elegirFoto')}
              onPress={() => setHojaAbierta(true)}
            />
            {/* La salida, siempre visible y sin competir (ver cabecera ②). */}
            <Boton variante="ghost" bloque etiqueta={t('alta.ahoraNo')} onPress={avanzar} />
          </>
        ) : (
          <>
            <EncuadreFoto
              key={foto.uri}
              uri={foto.uri}
              dim={{ iw: foto.width, ih: foto.height }}
              inicial={ENCUADRE_DEFAULT}
              nombre={nombre}
              onCambio={(e) => {
                encuadreRef.current = e;
              }}
              onInteraccion={setGestoActivo}
            />
            <Boton
              variante="ghost"
              bloque
              etiqueta={t('fotoEncuadre.cargarOtra')}
              onPress={() => setHojaAbierta(true)}
            />
            <Boton etiqueta={t('alta.continuar')} bloque onPress={avanzar} />
          </>
        )}
      </ScrollView>

      <HojaFotoMascota
        visible={hojaAbierta}
        titulo={t('fotoEncuadre.hojaTitulo')}
        onCerrar={() => setHojaAbierta(false)}
        onFoto={(f) => {
          setPermisoDenegado(false);
          encuadreRef.current = ENCUADRE_DEFAULT;
          setFoto(f);
        }}
        onPermisoDenegado={() => setPermisoDenegado(true)}
      />
    </View>
  );
}
