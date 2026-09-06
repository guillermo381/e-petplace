/**
 * TARJETA DE PASAPORTE — la identidad de la mascota, apaisada (S113-B · 1.3).
 *
 * Foto redonda a la izquierda, el nombre grande, y a la derecha el QR. Entre
 * medio lo que identifica: especie y raza, sexo y edad, el chip si lo hay.
 *
 * ── 🔴 EN MEMORIAL NO EXISTE ───────────────────────────────────────────
 * No se atenúa ni se deshabilita: **devuelve `null`**. *Un pasaporte sirve
 * para encontrar a alguien que se perdió; ofrecérselo a una familia que ya
 * despidió a su mascota es no haber leído la pantalla.* La regla vive en
 * `sePintaPasaporte`, no en un `if` de esta pieza — para que la página pública
 * y la placa lean la misma.
 *
 * ── 🔴 EL QR LLEGA DIBUJADO ────────────────────────────────────────────
 * La casa no genera códigos: **generarlo exige una librería que este grafo no
 * tiene**, y una dependencia nueva no viaja por OTA. Llega como URL o como SVG
 * en texto, y el tipo hace imposible pasar las dos.
 *
 * ── LA FRANJA DE PERDIDA VA ARRIBA Y DICE DESDE CUÁNDO ─────────────────
 * *«Perdida» sin fecha no le sirve a quien la encuentra: entre ayer y hace
 * tres meses cambia lo que esa persona hace con el animal.* Por eso el estado
 * y la fecha viajan juntos, y por eso la franja preside la tarjeta en vez de
 * ser un chip al costado.
 */

import { Image, View } from 'react-native'
import { SvgXml } from 'react-native-svg'

import { AvatarMascota } from './AvatarMascota'
import { Texto } from './Texto'
import { Isotipo } from '../brand/Isotipo'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { sePintaPasaporte, type EstadoPasaporte, type QrPasaporte } from './pasaporte-qr'

const LADO_QR = 84

export interface TarjetaPasaporteProps {
  nombre: string
  fotoUrl?: string
  /** *«Perro · Labrador»* — ya compuesta por la pantalla (Ley 3). */
  especieYRaza: string
  /** *«Macho · 4 años»* — idem. */
  sexoYEdad: string
  /** El número, en voz de máquina. **Ausente ⇒ no se dibuja la línea**: la
   *  familia puede apagarlo, y apagado no viaja (19.9). */
  chip?: string
  /** El rótulo del chip, en la voz de la pantalla. */
  etiquetaChip?: string
  qr: QrPasaporte
  /** Para el lector de pantalla: *«Código del pasaporte de Thor»*. */
  vozQr: string
  estado: EstadoPasaporte
  /** *«Perdida desde el 5 de septiembre»* — la pantalla compone la fecha. */
  vozPerdida?: string
  /** 🔴 **En memoria la tarjeta no existe.** Ver la cabecera. */
  enMemoria?: boolean
}

export function TarjetaPasaporte({
  nombre,
  fotoUrl,
  especieYRaza,
  sexoYEdad,
  chip,
  etiquetaChip,
  qr,
  vozQr,
  estado,
  vozPerdida,
  enMemoria = false,
}: TarjetaPasaporteProps) {
  const { theme } = useTheme()
  if (!sePintaPasaporte({ enMemoria })) return null

  const perdida = estado.estado === 'perdida'

  return (
    <View
      style={{
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: theme.bg.card,
        borderWidth: 1,
        borderColor: theme.bg.border,
      }}
    >
      {/* 🔴 LA FRANJA PRESIDE. Un chip al costado se lee como una etiqueta más;
          esto tiene que ser lo primero que alguien vea al abrir la tarjeta. */}
        {/* 🔴 **TINTE, NO FILL — y lo cazó `R20`, no yo.**
            ⏪ Esta franja iba en ocre pleno. La regla de la casa dice que *la
            familia alerta vive como TINTE con su texto AA*, porque **rellenarla
            colapsa con el CTA de oro: están a 4,2° y el matiz no los separa.**
            Y tiene razón contra mi instinto: un aviso de emergencia quiere
            gritar, pero *gritar con la misma cara que un botón de acción no es
            gritar más fuerte — es decir otra cosa.*
            ⚠️ **En la PÁGINA PÚBLICA el ocre sí va pleno**, y la diferencia es
            del contexto: ahí no hay CTA de oro con el que colapsar, no hay
            tema, y su lector está en la calle con el animal en brazos. */}
      {perdida && vozPerdida !== undefined ? (
        <View
          style={{
            backgroundColor: theme.status.warningBg,
            borderBottomWidth: 1,
            borderBottomColor: theme.status.warningBorder,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
          }}
        >
          <Texto variante="enfasis" color="warning">
            {vozPerdida}
          </Texto>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4], padding: spacing[4] }}>
        <AvatarMascota nombre={nombre} fotoUrl={fotoUrl} tamano="md" />

        <View style={{ flex: 1, gap: spacing[0.5] }}>
          {/* La marca chica arriba: dice de quién es el papel, y nada más. */}
          <View style={{ opacity: 0.6 }}>
            <Isotipo size={12} />
          </View>
          <Texto variante="titulo" numberOfLines={1}>
            {nombre}
          </Texto>
          <Texto variante="apoyo">{especieYRaza}</Texto>
          <Texto variante="apoyo">{sexoYEdad}</Texto>
          {/* El chip en voz de máquina, y sólo si sobrevivió a la visibilidad. */}
          {chip !== undefined && etiquetaChip !== undefined ? (
            <Texto variante="dato">{`${etiquetaChip} ${chip}`}</Texto>
          ) : null}
        </View>

        <View accessibilityLabel={vozQr} style={{ width: LADO_QR, height: LADO_QR }}>
          {qr.tipo === 'svg' ? (
            <SvgXml xml={qr.svg} width={LADO_QR} height={LADO_QR} />
          ) : (
            <Image source={{ uri: qr.url }} style={{ width: LADO_QR, height: LADO_QR }} />
          )}
        </View>
      </View>
    </View>
  )
}
