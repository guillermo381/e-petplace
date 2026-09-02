# S112-B → A · `verify:razon-muda` MIDE UNA PROPIEDAD QUE ACABA DE VOLVERSE FALSA

**No lo toqué. Es tu gate, su baseline lo firmó el founder, y bajarlo o
re-apuntarlo sin mesa sería exactamente el error que S111 se negó a cometer.**
Va la medición para que decidas.

## Qué cambió

Commit `55f51ad6`: **`Boton` DIBUJA la razón** (D-999). La cura separó dos
hechos que estaban pegados en una sola condición:

- `hayRazon` → hay algo que **decir** ⇒ se dibuja la línea.
- `conRazon` → además hay a dónde **llevar** ⇒ el toque va a `onRazon`.

⇒ **`onRazon` dejó de gobernar el texto.** Su trabajo siempre fue el toque.

## Por qué eso rompe la premisa del gate

Su cabecera dice, literal: *«Sin `onRazon`, `Boton` calcula `conRazon = false` y
el botón queda apagado **y sin hint de a11y**»*. **Eso ya no es cierto.** Los
seis archivos que hoy cuenta como mudos **dibujan su razón desde este commit**,
sin tocarles una línea:

```
verify:razon-muda · 6 archivo(s) · baseline 6 (solo-baja) · VERDE
   · apps/cliente/src/app/(tabs)/explorar/guarderia/[prestadorId].tsx
   · apps/cliente/src/app/(tabs)/explorar/paseo/checkout-paquete.tsx
   · apps/cliente/src/app/(tabs)/hogar/guarderia.tsx
   · apps/cliente/src/app/guarderia/[estadiaId].tsx
   · apps/cliente/src/app/guarderia/documentos.tsx
   · apps/prestador/src/app/guarderia/taller.tsx
```

**Su verde de hoy es correcto por casualidad: el número no subió.** Lo que
cambió no es el número — es qué significa.

## 🔴 Y lo que lo vuelve urgente: el trinquete ahora castiga lo correcto

El founder le pidió a C **pasar razones reales**. Cada razón nueva sin
`onRazon` —que desde hoy es la forma CORRECTA— **sube el número y el gate
corta**. *Un trinquete que impide exactamente el trabajo que la sesión vino a
hacer deja de proteger y empieza a estorbar.*

**Medido, y acota el daño:** **NO está cableado al pre-commit** (`.githooks/pre-commit`
corre `verify:diseno`, `verify:jornada-completa` y `verify:sin-byte-nul`; cero
ocurrencias de `razon-muda`). ⇒ no frena commits; **sale en el cierre**, que es
donde alguien lo va a leer como «C rompió algo».

## Las tres salidas, con mi voto

1. **Jubilarlo con lápida** (precedente `verify-edge-simbolos`): su propiedad
   dejó de indicar un defecto. **Es mi voto.** *Un gate cuya premisa es falsa no
   se arregla bajándole el número.*
2. **Re-apuntarlo** a la clase que hoy sí es defecto: **los 84 frenos que no
   pasan razón siquiera**. La propia ficha de `D-999` los dejó fuera a propósito
   —*«cuáles necesitan explicarse es decisión de producto, no de gate»*, y un
   baseline de 90 no lo baja nadie—. **No es gratis y no lo decido yo.**
3. **Dejarlo como está** — y entonces hay que escribirle encima que su verde ya
   no dice lo que su cabecera dice, y avisarle a C antes de su cierre.

**Cualquiera de las tres exige tocar su cabecera**, que hoy afirma algo falso
sobre la pieza. Eso sí es urgente: es el texto que va a leer la próxima sesión.

**Lo que NO hay que hacer, y lo dejo escrito porque es el camino fácil:**
bajarlo pasando `onRazon` vacíos. Daría verde **sin que el founder viera una
palabra más** — la peor clase de cura, la que apaga el instrumento sin tocar el
defecto. Es la razón por la que S111 no curó las seis.
