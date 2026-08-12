/**
 * SelectorDestinoItem — A QUIÉN VA ESTE PRODUCTO.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §6.3: *"cada ítem lleva su destino: una
 * mascota, o donación. El pago se registra a la cuenta del dueño; **el
 * producto va a quien lo consume.** Sin esa columna, al entregar habría
 * que adivinar a qué expediente depositar."*
 *
 * ── EL ESTADO MALO ES INEXPRESABLE (L-222) ─────────────────────────────
 * El motor tiene un CHECK llamado `chk_destino_excluyente`: una mascota
 * **o** donación, jamás las dos. **Acá ese CHECK tiene su espejo en el
 * TIPO** — `destino` es una unión discriminada, no dos campos sueltos.
 * Con `mascotaId` + `donacion` como props separadas, "donación para Thor"
 * sería expresable en la pantalla y el rebote llegaría del servidor; así,
 * **no compila.** *Un guard del servidor protege el dato; el tipo protege
 * al que construye la pantalla.*
 *
 * ── LA DONACIÓN NO ES UNA MASCOTA MÁS, Y POR ESO NO ES UN CHIP MÁS ─────
 * Se dibuja SEPARADA, con su propio rótulo. Ponerla en la hilera de caras
 * la volvería "una mascota más de la lista", y no lo es: **§6.4 le pone
 * dos límites duros** — jamás entra a ningún expediente (no hay mascota)
 * y jamás otorga beneficio comercial (`MODELO_LOYALTY` §7.2:
 * *"reconocer una donación con un descuento la convierte en compra"*).
 * Es la misma razón por la que §1 separa `Servicios` de `Venta de
 * productos`: **dos naturalezas no comparten hilera** — y esa separación
 * visual es el primer candado, igual que allá, y es gratis.
 *
 * ── SIN DESTINO ES LEGAL ───────────────────────────────────────────────
 * `destino: null` no es un error: la regla general de §4 dice que *"la
 * app nunca adivina de quién es una compra; ofrece atarla, y el dueño
 * decide"*, y el motor deja atar el ítem después
 * (`atarItemAMascota`). Por eso esta pieza **no obliga** y no pinta
 * ninguna opción preseleccionada — preseleccionar una mascota sería la
 * app adivinando, que es justo lo que la letra prohíbe.
 *
 * Consume `ChipEntidad` (la pieza firmada del chip con cara y pata). No
 * lo re-dibuja: la casa tiene UNO.
 */

import { View } from 'react-native'

import { ChipEntidad } from './ChipEntidad'
import { TarjetaEstado } from './TarjetaEstado'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'

export type MascotaDestino = {
  id: string
  nombre: string
  fotoUrl?: string
}

/** Unión discriminada = el espejo de `chk_destino_excluyente`. */
export type DestinoItem = { tipo: 'mascota'; mascotaId: string } | { tipo: 'donacion' }

export type SelectorDestinoItemProps = {
  mascotas: MascotaDestino[]
  /** `null` = todavía sin destino, y es LEGAL (ver el encabezado). */
  destino: DestinoItem | null
  onCambiar: (destino: DestinoItem) => void
  /** Voz de la casa: "¿Para quién es?" */
  rotulo?: string
  /** Voz de la casa: "Donar este producto" */
  etiquetaDonacion: string
  /** El límite de §6.4 dicho en voz humana, si la pantalla quiere decirlo. */
  detalleDonacion?: string
}

export function SelectorDestinoItem({
  mascotas,
  destino,
  onCambiar,
  rotulo,
  etiquetaDonacion,
  detalleDonacion,
}: SelectorDestinoItemProps) {
  const donacionElegida = destino?.tipo === 'donacion'

  return (
    <View style={{ gap: spacing[3] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      {/* Las caras. Envuelven cuando no entran: un nombre largo no se
          trunca acá — `ChipEntidad` ya lee hasta dos líneas. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
        {mascotas.map((m) => (
          <ChipEntidad
            key={m.id}
            nombre={m.nombre}
            fotoUrl={m.fotoUrl}
            tamano="general"
            elegido={destino?.tipo === 'mascota' && destino.mascotaId === m.id}
            onPress={() => onCambiar({ tipo: 'mascota', mascotaId: m.id })}
          />
        ))}
      </View>

      {/* La donación, aparte: otra naturaleza, otra hilera. Habla la
          gramática ESTÁ/ESPERA de la casa (`TarjetaEstado`), que es la
          que ya usamos para "esto rige / esto no". */}
      <TarjetaEstado
        encendido={donacionElegida}
        rol="radio"
        etiqueta={etiquetaDonacion}
        onPress={() => onCambiar({ tipo: 'donacion' })}
      >
        <View style={{ flex: 1, gap: spacing[0.5] }}>
          <Texto variante="cuerpo">{etiquetaDonacion}</Texto>
          {detalleDonacion === undefined ? null : <Texto variante="apoyo">{detalleDonacion}</Texto>}
        </View>
      </TarjetaEstado>
    </View>
  )
}
