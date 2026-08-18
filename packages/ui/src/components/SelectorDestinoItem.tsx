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
 * ── ⏪ LA DONACIÓN NO ES UNA MASCOTA MÁS, Y POR ESO NO ES UN CHIP MÁS ──
 * 🔴 ═══ DEROGADA EN SU MITAD DE FORMA — S100d-B (punto 15). ═══ La
 * donación **pasa a ser un chip de la MISMA hilera**, con el glifo del
 * refugio en vez de cara. **Lo que NO se deroga son los dos límites de
 * §6.4**, que siguen enteros y viven en el motor. El porqué del cambio está
 * en el cuerpo, sobre el chip. *(letra derogada, conservada:)*
 * «Se dibuja SEPARADA, con su propio rótulo. Ponerla en la hilera de caras
 * la volvería "una mascota más de la lista", y no lo es: **§6.4 le pone
 * dos límites duros** — jamás entra a ningún expediente (no hay mascota)
 * y jamás otorga beneficio comercial (`MODELO_LOYALTY` §7.2:
 * *"reconocer una donación con un descuento la convierte en compra"*).
 * Es la misma razón por la que §1 separa `Servicios` de `Venta de
 * productos`: **dos naturalezas no comparten hilera** — y esa separación
 * visual es el primer candado, igual que allá, y es gratis.»
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
  /**
   * 🔴 SE ELIGIÓ LA DONACIÓN — **el disparo del agradecimiento** (S100d-B ·
   * punto 15: *«al activar, modal de agradecimiento»*).
   *
   * **Se llama SOLO al elegirla, jamás al soltarla** (ver el cuerpo). La
   * Hoja la monta la PANTALLA: esta pieza selecciona y avisa, y no conoce
   * la navegación de quien la monta — la misma ley que ya rige para la «i».
   *
   * 🔴 **S100d·bis — LA HOJA QUE SE ABRE ES LA MISMA QUE ABRE LA «i».** Firma
   * del founder: *«al seleccionar el chip, el modal se abre solo con la
   * información de la «i» — el agradecimiento y la info son el mismo
   * momento»*. ⇒ **quien monte esto no arma dos hojas:** monta UNA, con el
   * agradecimiento arriba y el detalle de §6.4 debajo, y la abre por los dos
   * caminos. *Dos hojas para el mismo contenido divergen la primera vez que
   * alguien cura una.*
   *
   * **Ausente ⇒ el chip funciona igual y no pasa nada más.** *Un
   * agradecimiento que la pantalla no montó no es un error de la pieza.*
   *
   * ── LA VOZ, escrita por B y montada por A (vive en `apps/cliente/i18n`) ──
   * Base del founder: *«Agradecemos tu buen corazón, este producto será
   * enviado a un refugio»*, con el pedido explícito de **mejorarla**.
   *
   * > **título** — «Gracias.»
   * > **cuerpo** — «Este producto no va a llegar a tu casa: va a un
   * > refugio, a una mascota que todavía está esperando la suya.
   * > No suma puntos ni descuentos, y es a propósito: una donación que
   * > da algo a cambio deja de ser una donación.»
   * > **cierre** — «Listo»
   *
   * **Las tres decisiones de voz, con su razón:**
   * ① *«no va a llegar a tu casa»* — **es información, no cortesía**: sin
   *    eso, alguien espera un paquete que nunca sale para su dirección.
   * ② el límite de §6.4 se dice **como virtud y no como descargo**. *«No
   *    otorga beneficio comercial» es letra de contrato; «una donación que
   *    da algo a cambio deja de ser una donación» es la misma regla dicha
   *    de manera que se entienda y además se comparta.*
   * ③ **no se nombra a ninguna mascota** de la familia. La pieza no las
   *    conoce, y el punto del texto es justamente que **no es para ellas**.
   */
  onDonacionElegida?: () => void
}

export function SelectorDestinoItem({
  mascotas,
  destino,
  onCambiar,
  rotulo,
  etiquetaDonacion,
  detalleDonacion,
  onExplicarDonacion,
  onDonacionElegida,
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

        {/* 🔴 LA DONACIÓN, EN LA MISMA HILERA — S100d-B, punto 15 del gate.
            Firma del founder: *«donación sigue como botón»* ⇒ **chip/toggle**.

            ⏪ **QUÉ SE DEROGA, y su letra queda arriba tachada:** esta pieza
            declaraba *«otra naturaleza, otra hilera»* y montaba la donación
            en un `TarjetaEstado` en su propio renglón. **El argumento era el
            candado de §1** (`Servicios` separado de `Venta de productos`) y
            **estaba mal trasladado.**

            **Por qué:** allá se separan **dos líneas de negocio** que no
            deben mezclarse nunca. Acá hay **UNA pregunta —«¿para quién es
            este producto?»— y varias respuestas.** *«Para un refugio» es una
            respuesta legítima a esa pregunta, no otra pregunta.* Sacarla de
            la hilera no la volvía «no-mascota»: la volvía **otro tipo de
            control**, y eso es exactamente lo que el founder leyó — *«sigue
            como botón»*.

            ✅ **§6.4 NO SE NEGOCIA Y NO SE TOCA:** la donación sigue sin
            entrar a ningún expediente y sin otorgar beneficio comercial.
            **Esos dos límites viven en el MOTOR** (`chk_destino_excluyente`
            y `MODELO_LOYALTY` §7.2), que es donde tienen que vivir. *Un
            límite de negocio defendido por un renglón de layout no es un
            límite: es una esperanza.*

            🔴 **Y EL DISCRIMINADOR VISIBLE NO SE PIERDE, CAMBIA DE LUGAR:**
            el chip de la donación **no lleva cara ni inicial — lleva el
            glifo del REFUGIO** (`sujeto="donacion"`). *Comparte la forma,
            porque es una opción del mismo rango; no comparte el contenido,
            porque no es una mascota.* La distinción pasa de la GEOMETRÍA —
            que el founder leyó mal, y con razón — al DIBUJO, que dice a
            dónde va el producto. */}
        <ChipEntidad
          nombre={etiquetaDonacion}
          sujeto="donacion"
          tamano="general"
          elegido={donacionElegida}
          onPress={() => {
            if (donacionElegida) {
              onCambiar(null)
              return
            }
            onCambiar({ tipo: 'donacion' })
            /* 🔴 EL AGRADECIMIENTO SE AVISA, NO SE MONTA ACÁ — y respeta la
               ley que esta pieza ya tenía escrita para la «i»: *un componente
               de selección que además abre modales empieza a conocer la
               navegación de su pantalla.*

               **Solo al ELEGIR, jamás al soltar.** Agradecer dos veces —una
               al marcar y otra al desmarcar— convertiría el gesto en un
               diálogo, y **agradecer al desmarcar sería directamente
               reprochar.** */
            onDonacionElegida?.()
          }}
        />

        {/* 🔴 LA «i» SUBE AL ESCALÓN DEL CHIP — S100d·bis, punto 12 del segundo
            veredicto: *«la «i» sube al escalón del chip, justo al lado»*.

            ⏪ Vivía en su propio renglón, debajo. **Y era la mitad que quedaba
            de la mudanza anterior:** cuando la donación bajó a la hilera, su
            «i» se quedó donde estaba ⇒ **el chip y su explicación dejaron de
            verse como una cosa.** *Una «i» a un renglón de distancia no explica
            un chip: explica la sección.*

            Va DENTRO del `flexWrap`, así que si la hilera envuelve, la «i»
            envuelve con su chip y no se separa nunca de él. */}
        {detalleDonacion === undefined || onExplicarDonacion === undefined ? null : (
          <Pressable
            onPress={onExplicarDonacion}
            accessibilityRole="button"
            accessibilityLabel={detalleDonacion}
            hitSlop={12}
            style={{ alignSelf: 'center' }}
          >
            <Icono nombre="info" tamano={20} registro="tinta" tinta={theme.text.secondary} />
          </Pressable>
        )}
      </View>


    </View>
  )
}
