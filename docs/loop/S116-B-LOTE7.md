# S116-B · LOTE 7 — el gate de N11″ y el censo de la etiqueta afuera

**Rama `pista/s116-b-05`.** Gates: `verify:etiqueta-dentro` **NUEVO, verde con sus CUATRO rojos probados** · `verify:diseno` VERDE (80) · `verify:contrast` 504/0 · `verify:catalogo-v5` VERDE (47) · `verify:boton-alto` VERDE · `verify:techos-locales` VERDE · `tsc` 0 en las cuatro.

---

## ① FRENO DECLARADO: la enmienda N11″ NO ESTÁ DEPOSITADA

**Medido el 15-sep-2026 en los tres lugares donde podía estar:**

| dónde | qué dice |
|---|---|
| `docs/DIRECCION_DISENO_S99.md` de este worktree | **N11′** — *«la etiqueta va AFUERA Y ARRIBA»* |
| el mismo archivo en `origin/main` (`a3b8a257`) | **N11′** |
| el mismo archivo en `pista/s116-a-08` (`47fddabc`) | **N11′** |

Cero ocurrencias de N11″ en los tres. **No me frenó** —el gate se escribe contra el código, que sí tiene el comportamiento— pero **el gate no cita como firmada una letra que no puedo leer**: se funda en el lote 6, que está medido y commiteado.

⚠️ Y es la ironía exacta que el propio N11′ dejó escrita: *«UNA FIRMA QUE VIVE EN UN PARTE NO ESTÁ FIRMADA… una decisión que no queda escrita en la letra se vuelve a proponer»*. **Si A ya la depositó, es en un commit que no alcanzo; el dato lleva su hora para que se pueda re-medir.**

## ② EL GATE — `verify:etiqueta-dentro`, cuatro reglas solo-baja

🔴 **Existe porque es la TERCERA vuelta de esta ley** (N11 adentro → N11′ afuera → N11″ adentro flotando) **y ninguna dejó instrumento.** *Una ley que se reabre cada vez que alguien la mira de nuevo no está firmada: está en discusión permanente.*

⚠️ **Lo que el gate NO hace, dicho primero: no sostiene la ley — la sostiene LA PIEZA.** Lo que sostiene el gate es que **nadie la saque por las dos puertas de atrás**: dibujarse un rótulo propio, o apagar el de la pieza.

| regla | baseline | rojo probado |
|---|--:|---|
| ① rótulo propio encima de un `<Campo>` | **0** | `<Texto variante="apoyo">Nombre</Texto>` → ✗ 1 |
| ② `etiquetaVisible={false}` | 6 | uno nuevo → ✗ 7 |
| ③ `placeholder` dentro de un `<Campo>` | 26 | uno nuevo → ✗ 27 |
| ④ dos estilos de campo en la misma pantalla | 6 | uno nuevo → ✗ 7 |

**Los cuatro con exit 1 y el árbol restaurado byte a byte** (`git status` limpio tras cada prueba).

### 🔴 La regla ① nace protegiendo un CERO, y eso lo decidió MEDIR

El censo crudo dio **8 candidatos** —`<Texto>` pegado a un `<Campo>`—. **Al resolver las llaves contra el diccionario, ninguno era un rótulo:**

- «Opcional. Si no podemos ubicarte a ti.» · «Escribe el correo con el que entras y te enviamos un código de {{n}} dígitos.» · «Código verificado. Ahora elige tu nueva contraseña.» · «Se une como familiar autorizado: va a poder ver…» · **«DATOS»** (antetítulo de SECCIÓN, no de campo).

*Un gate que marcara los 8 habría nacido con ocho rojos falsos, y un gate ruidoso se apaga.* ⇒ el discriminador **resuelve el texto y lo mide**: ≤3 palabras, sin puntuación final, variante que no sea `antetitulo`/`seccion`. ⚠️ **Si la llave no resuelve, NO se marca y se cuenta aparte** — *un rojo que el autor no puede reproducir es lo que enseña a ignorar un gate.*

### ⚠️ Por qué es trinquete y no el TIPO, que sería mejor

La forma final de ③ es **hacerla inexpresable**: `placeholder` sólo legal con `etiquetaVisible={false}`, por unión discriminada, y ahí lo sostiene el compilador sin gate. **Hoy no se puede: hay 26 vivos y el typecheck quedaría en rojo hasta que C los limpie** — frenar a otra pista para ganar prolijidad. ⇒ **el trinquete los baja, y el día que lleguen a 0 este gate MUERE y lo reemplaza el tipo.** *Su condición de muerte está escrita, que es lo que separa un andamio de una deuda.*

### La excepción por nombre, declarada VACÍA

N11′ dejó vivo un costo que N11″ no contesta: *«en español el rótulo pesa el doble — "Instrucciones de entrega" encogida es nota al pie»*. El día que ese campo exista, **entra a `EXCEPCION_ROTULO_LARGO` por nombre y con su razón** — no con un disable suelto ni relajando el discriminador. **Hoy está vacía porque ese campo no existe** (medido). *Se escribe vacía a propósito: la puerta tiene que existir ANTES de que alguien la necesite, o se abre a martillazos.*

## ③ EL CENSO — y resultó ser trabajo MÍO, no de C

**Tras el lote 6 ninguna pantalla del cliente tiene la etiqueta afuera: la pieza la dibuja adentro para toda la casa v5.** Lo que sigue afuera son **las piezas hermanas que no toqué** — `CampoFecha` (2 usos de `EtiquetaDeCampo`) y `CampoCodigo` (3).

🔴 **Y eso rompe N11 literal: *«dos estilos de campo jamás conviven en la misma región de una pantalla»*.** En `carnet.tsx` conviven en **líneas consecutivas**.

| pantalla | `Campo` (adentro) | pieza con la etiqueta AFUERA |
|---|---|---|
| `app/carnet.tsx` | 634, 635 | **`CampoFecha`:636** ← consecutivas |
| `app/antiparasitario.tsx` | 203 | `CampoFecha`:283 · 292 |
| `app/recuerdo.tsx` | 213 | `CampoFecha`:224 |
| `app/(tabs)/hogar/mascota/despedida.tsx` | 117 | `CampoFecha`:142 |
| `components/alta/PasoDatosBasicos.tsx` | 250, 298 | `CampoFecha`:291 |
| `app/recuperar.tsx` | 263, 355 | `CampoCodigo`:319 † |

† **`CampoCodigo` es un caso aparte:** su etiqueta afuera es la **exención vieja declarada** (*«una caja de UN dígito no tiene lugar para un rótulo»*), que N11′ celebró como *«la excepción de ayer es la norma de hoy»*. **Hoy la norma volvió a cambiar y esa exención quedó descolgada** — entra al conteo para que la mesa la vea, no para acusarla.

⚠️ **El dueño de la cura soy YO.** El encargo pedía el censo *«para C»* y lo que encontró es trabajo de `packages/ui`: meter la etiqueta flotante en `CampoFecha` —que no es un `TextInput` sino un selector con hoja— **no es trivial y no estaba pedido en este lote**. *Se instrumenta (regla ④) para que no crezca mientras espera, que es lo único honesto que se puede hacer con una deuda que uno mismo abrió.*

## ④ AL BUZÓN

- **A** — **la enmienda N11″ no está en `DIRECCION_DISENO_S99` en ninguno de los tres lugares medidos.** Si ya la depositaste, es en un commit que no alcanzo desde acá.
- **C** — los **26 `placeholder`** del cliente ya no se dibujan en la casa v5 (los apagó el lote 6). Bajarlos es pasar el gate; el listado con archivo y línea sale de `node scripts/verify-etiqueta-dentro.mjs` cuando la regla ③ se pone en rojo.
- **mesa** — la exención de `CampoCodigo` quedó descolgada por el cambio de norma: **o vuelve a ser excepción escrita, o `CampoCodigo` también lleva la etiqueta adentro.**
