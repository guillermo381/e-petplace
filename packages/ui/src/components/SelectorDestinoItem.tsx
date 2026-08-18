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

import { Pressable, View } from 'react-native'

import { ChipEntidad } from './ChipEntidad'
import { TarjetaEstado } from './TarjetaEstado'
import { Icono } from './Icono'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

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
  /**
   * 🔴 **EMITE `null` — S100b-B, y esto cierra el «estado sin salida» del
   * gate (G-03, mitad 2: *«la donación, una vez marcada, NO SE PUEDE
   * DESMARCAR»*).**
   *
   * ⏪ **Era `(destino: DestinoItem) => void`, y ahí estaba el defecto,
   * en el TIPO:** la pieza **recibía** `DestinoItem | null` pero **no
   * podía emitir `null`** ⇒ podía mostrar «sin destino» y no tenía cómo
   * volver a él. Tocar la donación otra vez la RE-ELEGÍA.
   *
   * > ### 🔴 LA IRONÍA, escrita acá para que no se repita en otra pieza
   * > **La cabecera de este archivo celebra que el tipo vuelve
   * > inexpresable el estado ilegal** —«donación para Thor» no compila—.
   * > **Y el mismo tipo volvió inexpresable la SALIDA.**
   * >
   * > ***Un tipo que cierra el estado ilegal también puede cerrar el
   * > camino de vuelta.*** Cuando se cierra un estado por construcción,
   * > la pregunta que sigue no es *«¿qué más no debería poder pasar?»*
   * > sino ***«¿desde acá se puede volver?»***
   *
   * **La letra ya lo respaldaba:** §4 dice que *«sin destino es legal»*
   * — hoy lo era **de entrada y no de salida**. (Hallazgo de la pista A,
   * con el eslabón medido: su `fijarDestino` ya aceptaba `null`.)
   */
  onCambiar: (destino: DestinoItem | null) => void
  /** Voz de la casa: "¿Para quién es?" */
  rotulo?: string
  /** Voz de la casa: "Donar este producto" */
  etiquetaDonacion: string
  /**
   * El límite de §6.4 dicho en voz humana.
   *
   * ⏪ **S100b-B — YA NO SE PINTA COMO PÁRRAFO.** Medido en el aparato:
   * el bloque de donación ocupaba **343.8 × 144.7 dp = 6.9× el área de
   * una pastilla de mascota** (107.4 × 66.8), y **81.1 dp de eso eran
   * este texto**. El gate lo dijo así: *«debe ser una pastilla, del
   * mismo tamaño y familia que las de mascota — es una opción más de
   * «para quién es», no un anuncio»*.
   *
   * ⇒ **Ahora viaja detrás de la «i»**: se muestra cuando la persona la
   * pide, con `onExplicarDonacion`. *Una explicación que sigue ahí
   * después de la décima compra dejó de explicar y es ruido.*
   */
  detalleDonacion?: string
  /**
   * 🔴 ABRE LA EXPLICACIÓN DE LA DONACIÓN — **la Hoja la monta la
   * pantalla, no esta pieza.**
   *
   * *Un componente de selección que además abre modales empieza a
   * conocer la navegación de su pantalla.* Acá vive **la «i»**; lo que
   * pasa al tocarla es de quien la monta.
   *
   * **Ausente = no se dibuja la «i»** (19.9), y entonces `detalleDonacion`
   * no tiene por dónde salir: **si pasás el detalle, pasá también esto.**
   */
  onExplicarDonacion?: () => void
}

export function SelectorDestinoItem({
  mascotas,
  destino,
  onCambiar,
  rotulo,
  etiquetaDonacion,
  detalleDonacion,
  onExplicarDonacion,
}: SelectorDestinoItemProps) {
  const { theme } = useTheme()
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
            /* La misma salida que la donación, por simetría: si esta
               mascota YA es el destino, tocarla vuelve a «sin destino».
               *Una pieza donde una opción se puede soltar y la otra no
               enseña que el control es impredecible.* */
            onPress={() =>
              destino?.tipo === 'mascota' && destino.mascotaId === m.id
                ? onCambiar(null)
                : onCambiar({ tipo: 'mascota', mascotaId: m.id })
            }
          />
        ))}
      </View>

      {/* La donación, aparte: otra naturaleza, otra hilera. Habla la
          gramática ESTÁ/ESPERA de la casa (`TarjetaEstado`), que es la
          que ya usamos para "esto rige / esto no". */}
      {/* 🔴 S100b-B · DEJA DE SER UN ANUNCIO Y PASA A SER UNA OPCIÓN.
          Medido: ocupaba **6.9× el área de una pastilla de mascota**
          (343.8 × 144.7 dp contra 107.4 × 66.8) — *no competía con las
          pastillas: las presidía.*

          **`alignSelf: 'flex-start'` es lo que la achica a su contenido:**
          antes tomaba el ancho entero de la pantalla por ser hija directa
          de una columna. Misma gramática (`TarjetaEstado` rol radio, la
          de ESTÁ/ESPERA), mismo registro tipográfico, tamaño de pastilla.

          ⚠️ **Y SIGUE EN SU PROPIO RENGLÓN, fuera de la hilera de caras,
          a propósito:** §6.4 dice que **la donación NO es una mascota
          más**. Compartir hilera la volvería una cara más; compartir
          FORMA sin compartir hilera dice las dos cosas a la vez — *es una
          opción del mismo rango, y no es una mascota.* */}
      <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <TarjetaEstado
          encendido={donacionElegida}
          rol="radio"
          etiqueta={etiquetaDonacion}
          onPress={() => onCambiar(donacionElegida ? null : { tipo: 'donacion' })}
        >
          <Texto variante="cuerpo">{etiquetaDonacion}</Texto>
        </TarjetaEstado>

        {/* La «i»: el detalle se pide, no se impone. Sin callback no se
            dibuja — y sin ella el detalle no tendría salida. */}
        {detalleDonacion === undefined || onExplicarDonacion === undefined ? null : (
          <Pressable
            onPress={onExplicarDonacion}
            accessibilityRole="button"
            accessibilityLabel={detalleDonacion}
            hitSlop={12}
          >
            <Icono nombre="info" tamano={20} registro="tinta" tinta={theme.text.secondary} />
          </Pressable>
        )}
      </View>
    </View>
  )
}
