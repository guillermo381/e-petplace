# S106-B · LOS DOS HALLAZGOS DEL GATE — medidos, con dueño

> **B → mesa · 26-ago-2026.** Texto autocontenido (76b).
> *Girar cámara y el audio son el mismo problema visto dos veces: el transporte
> anda y falta lo que hace usable una consulta **con un animal en brazos**.*

---

# ① GIRAR CÁMARA NO SE DIBUJA — la hipótesis de la voz queda DESCARTADA

## Lo medido

| qué | resultado |
|---|---|
| ¿la pantalla del cliente monta mi pieza? | ✅ `videollamada/[citaId].tsx:338` monta `SuperficieLlamada` |
| ¿C pasa `onGirarCamara`? | ✅ cliente **y** prestador (`:300`) |
| ¿la voz resuelve en el diccionario del CLIENTE? | ✅ **`veterinaria.vcVozGirar: 'Girar cámara'`** (`es.ts:992`) y `'Flip camera'` (`en.ts:797`) |
| ¿mi condición es correcta? | ✅ `{onGirarCamara != null && …}` con la prop pasada |

🔴 **La hipótesis de A —que la voz no resolviera— está DESCARTADA con literal:
la clave existe en el diccionario del cliente.** *Y aunque no existiera, una
etiqueta vacía va a `accessibilityLabel`: no impide renderizar nada.*

## Lo que hice de mi lado

**`onGirarCamara` y `vozControles.girarCamara` pasan a OBLIGATORIAS.** Nacieron
opcionales por si alguna pantalla no lo tenía; **medido, las dos lo pasan**, así
que la opcionalidad no le servía a nadie y **dejaba viva una rama que hay que
descartar a mano cada vez que el botón no aparece**.

> *Una prop opcional que todos pasan no es flexibilidad: es un sospechoso
> permanente.*

**Los tres typechecks verdes SIN tocar las apps** — que es la prueba de que
ambos consumidores ya la pasaban.

## 🔴 LA HIPÓTESIS QUE QUEDA EN PIE, con su discriminador exacto para A

**El bundle podría traer una versión de `SuperficieLlamada` ANTERIOR a que yo
agregara el botón.** Encaja con todo lo medido: C pasaría la prop, mi pieza
vieja la ignoraría, **y los cuatro símbolos que A buscó estarían presentes
igual** — `Girar`, `vcVozGirar`, `onGirarCamara` y `girarCamara` **existen todos
en el código de C**, así que encontrarlos no prueba que MI rama viajó.

### El discriminador: buscar algo que SOLO exista en mi versión

**El path SVG del glifo**, que no está en ningún otro lado del repo:

```
M8.5 13.2a3.6 3.6 0 0 1 6.2-2.2
```

- **Si NO está en el bundle** ⇒ el bundle tiene `packages/ui` viejo. *El botón
  nunca se dibujó porque el código que lo dibuja no viajó.*
- **Si SÍ está** ⇒ el defecto es de render y lo sigo yo con esa medición nueva.

*Es la diferencia entre «los símbolos están» y «el código que dibuja está»: los
símbolos de C viajan aunque mi pieza no.*

---

# ② EL AUDIO SALE POR EL AURICULAR — **NO ES MÍO, y con literal**

## Lo medido

```
grep -rn "AudioSession|configureAudio|AndroidAudioTypePresets|startAudioSession|speaker"
        apps/ packages/  →  CERO RESULTADOS
```

**Nadie configura la sesión de audio en todo el árbol.** LiveKit corre con su
default.

## Por qué el default rutea al auricular — leído del SDK, no supuesto

`@livekit/react-native` · `AudioSession.d.ts`:

> *«**forceHandleAudioRouting** — … en `inCommunication` o `inCall` **el ruteo
> de audio está APAGADO**. Si se pone en true, intentará rutear igual.
> **Defaults to false.**»*

**Una videollamada usa el modo `communication`** ⇒ **el ruteo queda apagado y
decide el sistema, que en Android elige el auricular.** La lista de preferencia
por defecto ya pone `speaker` antes que `earpiece` — **pero no se aplica**,
porque el ruteo está apagado. *Por eso no alcanza con reordenar la lista: la
llave es `forceHandleAudioRouting`.*

## De quién es: **de C**

`packages/ui` **no importa LiveKit por decisión de arquitectura** —ratificada
por la mesa— así que la sesión de audio se configura **donde se monta
`LiveKitRoom`**, en las dos pantallas.

## La receta, para que nadie la busque

```ts
import { AudioSession, AndroidAudioTypePresets } from '@livekit/react-native'

// Al MONTAR la pantalla de consulta, antes de conectar:
await AudioSession.configureAudio({
  android: {
    preferredOutputList: ['bluetooth', 'headset', 'speaker'],
    audioTypeOptions: {
      ...AndroidAudioTypePresets.communication,
      forceHandleAudioRouting: true,   // ← LA LLAVE
    },
  },
  ios: { defaultOutput: 'speaker' },
})
await AudioSession.startAudioSession()
// y `stopAudioSession()` al DESMONTAR
```

⚠️ **`earpiece` se saca de la lista a propósito**, no por olvido: es el
comportamiento que se vino a corregir. Bluetooth y auriculares **sí** siguen
ganando — *si alguien se puso auriculares, quiere auriculares.*

## 🔴 Por qué esto no es cosmético

**El acto central del servicio es mostrarle el animal al veterinario.** Las dos
cámaras arrancan frontales por firma del founder, así que la consulta empieza
con dos personas mirándose: **para mostrar al animal hacen falta girar cámara y
las dos manos.** Con el teléfono en la oreja **no hay dos manos**.

> *Sin altavoz y sin girar cámara, la teleconsulta funciona técnicamente y no
> sirve para lo que existe.*
