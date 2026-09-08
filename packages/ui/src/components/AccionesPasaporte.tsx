/**
 * ACCIONES DEL PASAPORTE — lo que se puede hacer con él (S113-B · 1.3 · B2).
 *
 * ── 🔴 «GRABAR TAG NFC» NO SE DIBUJA SI LA CAPACIDAD NO EXISTE ─────────
 * No apagado: **ausente**. *Un botón apagado sin razón a la vista es el
 * defecto, y acá la razón —«tu teléfono no tiene NFC»— no le sirve a nadie:
 * no es algo que la persona pueda resolver.* Ofrecerlo y negarlo es peor que
 * no ofrecerlo. La capacidad la mide la pantalla y llega como `puedeNfc`.
 *
 * ── ☠️ LÁPIDA · EL TOGGLE DE «SE PERDIÓ» SALIÓ DE ACÁ (S114-B) ─────────
 *
 * **Firma del founder:** *la puerta de `perdida` vive en el PERFIL, y no queda
 * ninguna en Pasaporte.* **Marcar que tu perro se perdió no es una perilla de
 * configuración** — y esta pantalla es configuración: qué se muestra, cómo se
 * comparte, cómo se revoca.
 *
 * *Había DOS puertas al mismo hecho y estaba declarado.* Se retira la de acá,
 * **no la del perfil**: el acto pertenece al lugar donde uno habla de su
 * animal, no al lugar donde ajusta qué campos ve un extraño.
 *
 * 🔴 **La retiró B y no C, y el porqué es del contrato:** las cuatro props del
 * toggle eran **obligatorias**, así que desde el consumidor no se podía dejar
 * de montarlo. *Una pieza que exige lo que hay que quitar no se puede corregir
 * desde afuera* — igual que `TarjetaPasaporte.enMemoria` esta misma sesión,
 * con el signo dado vuelta.
 *
 * ⚠️ **LO QUE SÍ SIGUE SIENDO SUYO Y NO SE TOCA:** en Pasaporte queda **la
 * visibilidad del contacto** —qué ve quien escanea— y el pasaporte **en modo
 * «se perdió»**, que es una LECTURA del estado, no su interruptor.
 *
 * **Lo que murió con él** (Ley 37, en el mismo acto): las cuatro props
 * `perdida` · `vozPerdida` · `vozConfirmarPerdida` · `onCambiarPerdida`, el
 * `useState` del segundo toque, y el `Boton` destructivo.
 *
 * 🔴 **Y la razón de los dos toques NO se pierde, porque sigue rigiendo donde
 * el acto vive:** *marcar a una mascota como perdida publica su cara y su
 * teléfono en una página abierta; el segundo toque es el único momento en que
 * alguien puede darse cuenta de que tocó por error, y nombra a la mascota — es
 * lo que hace parar. Desmarcarla NO confirma: volver a privado no expone nada,
 * y pedir permiso para dejar de exponer es cobrarle a la persona por
 * corregir.* **Quien construya la puerta del perfil hereda estas dos reglas.**
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { spacing } from '../tokens/spacing'

export interface AccionesPasaporteProps {
  vozCompartir: string
  onCompartir: () => void
  vozDescargarQr: string
  onDescargarQr: () => void
  /** 🔴 **La capacidad la mide la pantalla.** Sin ella el botón NO EXISTE —
   *  ver la cabecera. */
  puedeNfc?: boolean
  vozGrabarNfc?: string
  onGrabarNfc?: () => void
}

export function AccionesPasaporte({
  vozCompartir,
  onCompartir,
  vozDescargarQr,
  onDescargarQr,
  puedeNfc = false,
  vozGrabarNfc,
  onGrabarNfc,
}: AccionesPasaporteProps) {
  return (
    <View style={{ gap: spacing[3] }}>
      <Boton etiqueta={vozCompartir} onPress={onCompartir} />
      <Boton etiqueta={vozDescargarQr} variante="secundario" onPress={onDescargarQr} />

      {/* 🔴 Ausente, no apagado: ver la cabecera. */}
      {puedeNfc && vozGrabarNfc !== undefined && onGrabarNfc !== undefined ? (
        <Boton etiqueta={vozGrabarNfc} variante="secundario" onPress={onGrabarNfc} />
      ) : null}

    </View>
  )
}
