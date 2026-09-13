import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Texto } from '@epetplace/ui'

import { escucharConteos, leerConteos } from '@/lib/medicion/montajes'

/**
 * EL CONTEO DE MONTAJES EN PANTALLA — S116-C lote 3.
 *
 * Sólo se monta bajo `__DEV__` (su consumidor lo decide, ver el pie de Cuenta).
 * **No lleva voz del riel a propósito:** es un instrumento, y la Ley 3 habla de
 * la voz del PRODUCTO. *Traducir un diagnóstico sería fingir que alguien que no
 * lo entiende igual tiene que leerlo.*
 *
 * ⚠️ **Monta `Texto variante="dato"`, como el sello de arriba** — no escribe
 * estilo propio. El único `View` es el apilado, que no es dibujo.
 */
export function ConteoDeMontajes() {
  const [, redibujar] = useState(0)

  /* Se suscribe en vez de sondear: el contador avisa cuando cambia. Un
     `setInterval` habría redibujado la pantalla para nada la mayor parte del
     tiempo — y esta pantalla es justamente donde se va a mirar la memoria. */
  useEffect(() => escucharConteos(() => redibujar((n) => n + 1)), [])

  const filas = leerConteos()
  if (filas.length === 0) return null

  return (
    <View>
      {filas.map(({ tab, conteo, toques }) => (
        <Texto key={tab} variante="dato">
          {`${tab} · v${conteo.vivas} · pico ${conteo.pico} · ↑${conteo.montajes} ↓${conteo.desmontajes} · T${toques}`}
        </Texto>
      ))}
    </View>
  )
}
