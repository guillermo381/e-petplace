/**
 * VitrinaRefugio — LA MISMA VITRINA, OTRO OFICIO (S112-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NO ES UNA VITRINA NUEVA: ES `FichaPrestador` CON LOS DATOS DE UN
 *    REFUGIO.** Cero pieza nueva de portada, de logo, de historia o de lista.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * N17 lo manda con todas las letras —*«una fuente, N consumidores; jamás se
 * duplican»*, y *«un espejo con piezas propias es una imitación, no un
 * espejo»*—. Un refugio que se presenta con una vitrina distinta a la de un
 * veterinario le dice a la familia que es otra clase de cosa, y no lo es: es
 * alguien que cuida animales y quiere que lo conozcan.
 *
 * ── ✅ Y ESTO CIERRA UN FRENO QUE ESTA MISMA PISTA HABÍA DECLARADO ────────
 * `FichaAdoptable` dejó su galería como SLOT con su razón escrita: el
 * carrusel de la casa vive dentro de `FichaPrestador` (~150 líneas, con
 * paginado, ciclo, ancho medido y puntos) y **extraerlo reabría una
 * propiedad que cerró el ojo del founder en aparato** —*«no tironea en
 * Android»*, group `d139b9c0`—. *Una propiedad que se cerró mirando no se
 * puede volver a cerrar leyendo.*
 *
 * **Acá el problema no se resuelve extrayendo: se resuelve MONTANDO.** La
 * vitrina del refugio no necesita un pedazo del carrusel — necesita la
 * vitrina, y la vitrina ya existe entera y gateada. *La respuesta a «esta
 * pieza no se puede reusar en partes» a veces es reusarla completa.*
 *
 * ── 🔴 LO QUE ESTA PIEZA NO EXPONE, Y ES UNA DECISIÓN DE SEGURIDAD ───────
 * **No hay props de zona.** `FichaPrestador` sabe dibujar un mapa con centro
 * desplazado, y acá **no se le pasa** — ni ahora ni por olvido:
 *
 * · §5.2 acota lo que la vidriera anónima puede mostrar de un publicador a
 *   **nombre, foto y ciudad/zona**. Una coordenada, aunque esté desplazada,
 *   no está en esa lista.
 * · N5 dice *«jamás dirección, jamás coordenadas exactas»*, y un refugio
 *   carga más riesgo que un negocio: **a la puerta de un refugio la gente
 *   deja animales.**
 *
 * *No se puede exponer lo que no tiene por dónde entrar.* Si algún día se
 * decide mostrarlo, es una decisión con su propio peso y su propia firma —
 * no una prop que alguien agrega de paso.
 *
 * **Tampoco lleva `cohorte` ni `clipUri`**: no se pidieron. Una pieza que
 * nace con las props de otra «por si acaso» es la que después nadie puede
 * cambiar.
 *
 * ── EL ORDEN DEL PIE, Y POR QUÉ «CÓMO AYUDAR» VA ÚLTIMO ──────────────────
 * A la vitrina de un refugio se entra a ver sus animales. «Cómo ayudar»
 * todavía **no existe** —dice «pronto» detrás de su «i» y no navega (N7)— así
 * que va al final y discreto, igual que «Reportar» en `FichaAdoptable`: *lo
 * que no está disponible no compite con lo que sí.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El perfil público del refugio, alcanzable desde la ficha del adoptable
 * («quién la publica»). **Entregada y no montada.**
 */
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { BotonExplicar, type ConExplicacion } from './BotonExplicar'
import { FichaPrestador } from './FichaPrestador'
import { Texto } from './Texto'

export type VitrinaRefugioProps = {
  /** El nombre del refugio. */
  nombre?: string | null
  /** Logo YA RESUELTO. Sin él, la escalera de portada cae al monograma. */
  logoUrl?: string | null
  /** Portadas YA RESUELTAS, en el orden en que se muestran. La primera manda. */
  portadas?: string[]
  /** Su historia, en voz humana. */
  historia?: string | null
  /** Ciudad. **Es todo lo que la vidriera anónima puede decir del lugar.** */
  ciudad?: string | null
  /**
   * La lista de lo que hace, YA en voz de la casa («Rescate», «Adopción»,
   * «Esterilización»). **No son sus animales**: un adoptable se presenta con
   * `TarjetaAdoptable` y va en `pie` — dos formas de mostrar un animal es
   * exactamente la segunda familia de piezas que esto viene a no crear.
   */
  lista?: string[]
  /**
   * «Cómo ayudar» — visible, con la «i» que dice «pronto». **No navega**
   * (N7): un botón que promete una pantalla que no existe es peor que uno
   * que dice que todavía no está.
   */
  comoAyudar?: ConExplicacion
  /** Lo que va al pie: sus adoptables como `TarjetaAdoptable`. */
  pie?: ReactNode
  /** Lo que flota sobre la portada (la flecha de volver es del consumidor). */
  sobrePortada?: ReactNode
  aSangre?: boolean
}

export function VitrinaRefugio({
  nombre,
  logoUrl,
  portadas,
  historia,
  ciudad,
  lista,
  comoAyudar,
  pie,
  sobrePortada,
  aSangre,
}: VitrinaRefugioProps) {
  return (
    <FichaPrestador
      nombre={nombre}
      logoUrl={logoUrl}
      portadas={portadas}
      historia={historia}
      ciudad={ciudad}
      servicios={lista}
      sobrePortada={sobrePortada}
      aSangre={aSangre}
      pie={
        pie === undefined && comoAyudar === undefined ? undefined : (
          <>
            {pie}
            {comoAyudar === undefined ? null : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing[2],
                  marginTop: spacing[4],
                }}
              >
                <View style={{ flex: 1 }}>
                  <Texto variante="cuerpo">{comoAyudar.texto}</Texto>
                </View>
                <BotonExplicar {...comoAyudar} />
              </View>
            )}
          </>
        )
      }
    />
  )
}
