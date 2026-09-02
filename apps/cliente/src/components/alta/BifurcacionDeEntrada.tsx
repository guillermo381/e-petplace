/**
 * LA PRIMERA PREGUNTA — «¿tenés una mascota o querés adoptar?» (S112-C, §4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **VOZ DEL FOUNDER, literal:** *«Al terminar de crear la cuenta quiero ver una
 * sola pregunta: ¿tenés una mascota o querés adoptar? Dos tarjetas grandes, del
 * mismo tamaño, con ilustración de la casa. Si toco adoptar, no me pidas nada
 * más: me llevás directo a ver los animales.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **QUIÉN LLEGA ACÁ — y son TRES caminos, no uno.** Medido: los tres
 * callers del guard terminan en `/onboarding`, y hasta hoy los tres caían en el
 * formulario de alta sin salida:
 *   ① `registro.tsx` — recién creó su cuenta;
 *   ② `verificar-correo.tsx` — confirmó el código;
 *   ③ **`index.tsx`** — **y éste es el que no era obvio**: cualquiera que abra
 *      la app sin familia, incluido **quien vuelve de recuperar su contraseña**.
 *      *Esa persona no está dándose de alta: está volviendo a su casa, y le
 *      pedíamos registrar una mascota para poder entrar.*
 *
 * ── LAS DOS TARJETAS SON DEL MISMO TAMAÑO, Y NO ES ESTÉTICA ─────────────
 * `flex: 1` en las dos. *Una más grande que la otra convierte una pregunta en
 * una sugerencia* — y la que quedaría chica sería siempre adoptar, que es
 * justo la puerta que §4 quiso abrir.
 *
 * ── ⏸️ POR QUÉ HOY NO SE MONTA ──────────────────────────────────────────
 * La rama «quiero adoptar» **crea la cuenta SIN mascota registrada** (§4), y
 * ese productor **no existe**: el único constructor es
 * `crearFamiliaConPrimeraMascota`. Se pidió a A como `crear_familia_sin_mascota`
 * (`S112-C-para-A-PEDIDO-1` §①) — y **el estado ya es expresable**:
 * `getEstadoOnboardingDueno` devuelve `mascotas_count`. *Le falta productor, no
 * modelo.*
 *
 * ⇒ **Con la puerta cerrada, `/onboarding` sigue yendo derecho al alta**, que
 * es lo que hace hoy y funciona. *Una pregunta con una sola respuesta viva no
 * es una pregunta: es un trámite con un adorno.*
 */

import { View } from 'react-native';
import {
  Boton,
  Icono,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';

export function BifurcacionDeEntrada({
  titulo,
  tengoMascota,
  tengoMascotaDetalle,
  tengoMascotaAccion,
  quieroAdoptar,
  quieroAdoptarDetalle,
  quieroAdoptarAccion,
  onTengoMascota,
  onQuieroAdoptar,
}: {
  titulo: string;
  tengoMascota: string;
  tengoMascotaDetalle: string;
  tengoMascotaAccion: string;
  quieroAdoptar: string;
  quieroAdoptarDetalle: string;
  quieroAdoptarAccion: string;
  onTengoMascota: () => void;
  onQuieroAdoptar: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], gap: spacing[5] }}>
      {/* UNA SOLA PREGUNTA. Sin subtítulo explicativo: *si la pregunta necesita
          un párrafo para entenderse, la pregunta está mal escrita.* */}
      <Texto variante="titulo">{titulo}</Texto>

      <View style={{ flex: 1, gap: spacing[4] }}>
        <View style={{ flex: 1 }}>
          <Tarjeta>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[3] }}>
              <Icono nombre="carnet" tamano={48} />
              <Texto variante="titulo">{tengoMascota}</Texto>
              <Texto variante="apoyo">{tengoMascotaDetalle}</Texto>
              <Boton variante="primario" bloque etiqueta={tengoMascotaAccion} onPress={onTengoMascota} />
            </View>
          </Tarjeta>
        </View>

        <View style={{ flex: 1 }}>
          <Tarjeta>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[3] }}>
              <Icono nombre="refugio" tamano={48} />
              <Texto variante="titulo">{quieroAdoptar}</Texto>
              <Texto variante="apoyo">{quieroAdoptarDetalle}</Texto>
              {/* 🔴 **`secundario`, no `ghost`.** Las dos son respuestas legítimas
                  a la misma pregunta: si una fuera un label sin caja, la
                  jerarquía diría cuál esperamos. *La tarjeta ya da el peso; el
                  botón sólo tiene que ser tocable con la misma dignidad.* */}
              <Boton variante="secundario" bloque etiqueta={quieroAdoptarAccion} onPress={onQuieroAdoptar} />
            </View>
          </Tarjeta>
        </View>
      </View>
    </View>
  );
}
