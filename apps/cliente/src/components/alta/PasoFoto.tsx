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

import { EncuadreFoto } from '@/components/EncuadreFoto';
import { HojaFotoMascota } from '@/components/HojaFotoMascota';
import { ENCUADRE_DEFAULT, type Encuadre } from '@/components/foto-encuadre';
import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';
import { caraDelAlta } from './imagen-raza';
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

  const avanzar = () =>
    onAvanzar(
      foto !== null
        ? {
            fotoUri: foto.uri,
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
          <View style={{ alignItems: 'center', gap: spacing[4], paddingTop: spacing[6] }}>
            <AvatarMascota
              nombre={nombre}
              especie={esEspecieUi(borrador.especie) ? borrador.especie : undefined}
              fotoUrl={caraDelAlta({ especie: borrador.especie, razaSlug: borrador.razaSlug })}
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
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('fotoEncuadre.elegirFoto')}
              onPress={() => setHojaAbierta(true)}
            />
            {/* La salida, siempre visible y sin competir (ver cabecera ②). */}
            <Boton variante="ghost" etiqueta={t('alta.ahoraNo')} onPress={avanzar} />
          </View>
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
