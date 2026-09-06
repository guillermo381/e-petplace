# S113 · noche — lo que espera al founder

Una entrada por decisión. Cada una: **qué**, **por qué**, **opciones** y **el voto de la
pista**. Nadie se frenó por ninguna de éstas.

> Cada pista escribe bajo su propio encabezado. Si dos escriben a la vez, el merge es
> aditivo: no se toca la sección de otro.

---

## Pista E

### E-1 · 🔴 La lista de campos del pasaporte no está firmada, y el gate está en rojo por eso

**Qué.** `leer_pasaporte` devuelve **11 campos a alguien sin sesión**: `alergias, chip,
contacto, edad, especie, foto_path, medicacion, nombre, perdida, raza, sexo`.
`verify:pasaporte-campos` compara eso contra una lista firmada — **que no existe** — y sale
**ROJO**. Es correcto que salga rojo.

**Por qué no la firmé yo.** Seedear la lista con lo que hoy devuelve la pone en verde **por
construcción** y sería yo firmando por el founder. *En una página sin sesión, un campo no es
una mejora: es una decisión de privacidad que alguien tomó.*

**Mi lectura de los 11, para que la firma sea de una sentada:**

| campo | para qué sirve en la calle | mi voto |
|---|---|---|
| `nombre`, `especie`, `raza`, `sexo`, `edad` | reconocer al animal y hablarle | **entra** |
| `foto_path` | la única forma de estar seguro de que es él | **entra** (ver E-2) |
| `perdida` | es el motivo de la página | **entra** |
| `contacto` | sin esto no se lo devuelven a nadie | **entra**, ya con su toggle |
| `alergias`, `medicacion` | si va a un vet o si alguien le da de comer, esto puede salvarlo | **entra**, con su toggle |
| `chip` | ⚠️ **el único que no ayuda a devolverlo**: es un identificador único y permanente, y con él un tercero puede reclamar propiedad ante un registro. Quien lo escanea es un vet, y el vet lee el chip **del animal**, no de la web. | **mi voto: SALE** — o queda **apagado por defecto**, al revés de hoy |

**Opciones.** (a) firmar los 11 tal cual · (b) firmar 10 y sacar `chip` · (c) firmar 11 pero
con `mostrar_chip` naciendo en `false`. **Voto: (c)** — no pierde la función para quien la
quiera, y cambia el default hacia el lado que no se puede deshacer.

---

### E-2 · 🔴 La foto del pasaporte pesa 19× la página y rompe el techo de 60 kB

**Qué.** Medido sobre la página viva: HTML **3.215 B** (impecable, cero JS) + foto **62.582 B**
⇒ **64,3 kB**. A 400 kbps la foto sola son **~1,25 s** de transferencia ⇒ **el criterio de
< 1,5 s en 3G no se cumple con la foto, y sí se cumple sin ella.**

**Por qué importa más que un número.** Esta página la abre alguien **en la calle, con una mano
ocupada, con el teléfono que tenga**. Es el único lugar del producto donde la red mala es el
caso normal y no el borde.

**Opciones.** (a) redimensionar al subir, con la receta que la casa ya tiene (D-734) — no
arregla las fotos ya subidas · (b) que la edge pida a Storage una versión chica al firmar la
URL · (c) dejarlo. **Voto: (b) primero** — cura las que ya existen y es del lado que ya toca la
foto; (a) después, para no pagarlo cada vez. **La foto NO se quita:** es cómo se reconoce al
animal.

---

### E-3 · 🟡 El default de la página pública es MOSTRAR, y hoy nadie puede llegar ahí

**Qué.** `leer_pasaporte` decide con `coalesce(v_c.mostrar_chip, true)` — **tres veces**.
Medido: `emitir_pasaporte` **crea** la fila de config, así que hoy **no hay pasaporte sin
config** y el camino no es alcanzable.

**Por qué se anota igual.** *La seguridad la sostiene hoy el PRODUCTOR y no el LECTOR.* El día
que una fila de config se borre —a mano, o por un `ON DELETE` que alguien agregue— el microchip
y la salud del animal salen a la calle **sin que nadie haya decidido nada, y sin error**.

**Y hay un contraejemplo dentro de la misma función:** `contacto` **no** comparte el defecto,
porque su dato vive en la misma fila que su toggle ⇒ sin config no hay teléfono que mostrar.
**Fail-closed por construcción.** Es la forma que las otras dos deberían copiar.

**Opciones.** (a) invertir los tres `coalesce` a `false` · (b) FK con `ON DELETE RESTRICT` de
`pasaporte` a `pasaporte_config`, que vuelve el estado **inexpresable** · (c) dejarlo con esta
nota. **Voto: (b)** — la casa ya prefiere volver inexpresable antes que vigilar (L-439).

---

### E-4 · 🟢 Para D, no para el founder: cachear conviene desde el SEGUNDO turno de narrativa

Aritmética sobre precios verificados y tokens medidos, con contexto de 1.290 tokens:
**un solo turno con caché cuesta 25 % MÁS** ($0,003225 contra $0,00258); **dos turnos cuestan
32,5 % menos** ($0,003483 contra $0,00516). **El punto de equilibrio son exactamente 2** — y una
conversación de un solo turno de narrativa es el caso común, no el raro. *Encender el caché
siempre es una optimización que en el caso más frecuente cobra de más.*

---

### E-5 · ⚪ Lo que no pude medir por falta de aparato

**3G real** (lo estimé del tamaño y el RTT, y lo digo) y **los tres aparatos** de E5 del
sublote 1.3. No simulo dos teléfonos y los llamo tres aparatos. Cuando haya aparato, la
medición está escrita y toma minutos.
