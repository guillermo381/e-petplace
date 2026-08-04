# S85 · ACTA DEL MÉTODO

> **Molde: el acta de S84.** Esto **NO es la lista de lo construido** — es lo que
> produjo el resultado y lo que costó, destilado para que S86 no lo re-descubra.
>
> **Estado:** el OTA final (`2169f9b8`, ancla `1ef53eb`) está publicado y **espera
> el gate del founder**. *Lo de acá es método, no firma.*

---

## 1 · EL BURN-DOWN — D-630 PAGADA, y el número con su letra chica

**`scripts/burn-down.mjs` existe.** *Su condición de muerte era verificable de dos
greps, y se cumplió: el primer commit de A en S85 fue el script.*

```
COMPOSICIÓN 10/57 (18%)   ·   MECÁNICA 7/57 con deuda   ·   DERIVA +0/-1
```

**Contra la línea base S83-A15 (7/54 = 13%): +3 pantallas, +5 puntos.**

### ⚠️ Y EL NÚMERO SUBESTIMA LO QUE PASÓ — hay que decirlo con el número, no después

**La lista BASE mide piezas de S82/S83** —`Entrada`, `TarjetaEstado`, `FilaCita`,
`SelectorSegmentado`, `PieReserva`, `MarcaEleccion`, `CantoMarca`— **y S85
construyó con piezas que esa lista no nombra**: `TresNumeros`, `SelectorDia`,
`FichaPrestador`, `superficie="muro"`, `Boton variante="acento"`.

**Cinco pantallas aparecen en la EXTENSIÓN y ninguna suma al 18%.**

> **No se cura moviendo piezas de EXTENSIÓN a BASE.** *Eso rompería la
> comparabilidad, que es lo único que hace útil a una serie.* **Re-basar es
> decisión de la mesa**, y cuando la tome, la línea base **se re-declara con su
> fecha** — no se corrige hacia atrás.

**El eje MECÁNICO no se movió (7 de 57)** y es honesto: *S85 construyó, no barrió.*
Las cinco `Campo sin EvitaTeclado` y las dos de alias deprecado **siguen igual**.

### El hallazgo que le dio forma al instrumento

**Los barridos mecánicos de S81/S82 se implementaron como CAMBIOS DE DEFAULT en
`packages/ui`** (`Tarjeta.elevacion`, `Campo.sinCaja`). **Una pantalla los adopta
sin tocar una línea** ⇒ *"cuántas lo tienen"* daría **58/58** sin que nadie haya
hecho nada. **Por eso el eje mecánico cuenta DEUDA y no adopción.**

---

## 2 · LAS SEIS LEYES NUEVAS, y su eje común

| | qué dice |
|---|---|
| **L-194** | un número de plataforma copiado en un wrapper **es letra muerta que REBOTA BIEN** |
| **L-195** | verificar que una columna **existe** no es verificar que esté **poblada** |
| **L-196** | un módulo *"preparado-apagado"* que nunca pasó por un compilador **no está preparado: está escrito** |
| **L-197** | un fallo degrada a **AUSENCIA**, nunca a un **VALOR** que el consumidor use como cierto |
| **L-198** | un texto que explica un porqué **vence con el porqué** *(+ la frontera de B y el corolario de C)* |
| **L-199** | **el rojo se produce ANTES** o la cura queda sin evidencia para siempre |

> ### EL EJE COMÚN: **NINGUNA DE LAS SEIS ROMPE NADA.**
> *Un número viejo que rebota bien. Una columna vacía que el typecheck acepta.
> Un módulo que compila el día que nadie lo compila. Un catch que devuelve un
> valor legal. Un comentario vigente que describe algo inexistente. Una cura sin
> su antes.*
> **Los seis PRODUCEN SALIDAS CREÍBLES** — es la misma familia que S84 nombró con
> sus candidatas #15-#21, **y esta sesión la pagó seis veces más.**

---

## 3 · LO QUE MÁS COSTÓ: **cuatro defectos distintos en el MISMO eje**

**El síntoma del founder fue uno —*"el slot desaparece al reservar"*— y detrás
había CUATRO cosas distintas, ninguna la que el síntoma sugería:**

1. **`cupo_techo` en 4** — límite de plataforma, no bug *(firma: sube a 10)*
2. **`max_citas_por_slot = 1`** en la mitad de las franjas — dato del prestador
3. **CUATRO `> 4` hardcodeados** en la puerta única — **rebotaban bien** (L-194)
4. **el embed sin FK + el `return 1`** — devolvía techo 1 **siempre** (L-197)

> **Y ninguno era visible desde el anterior.** *Curar (1) no destrababa nada
> mientras (3) rebotara; y (3) no se veía mientras (4) devolviera 1 igual.*
> **Cuatro capas de "funciona mal" apiladas sobre un solo síntoma.**

### El gemelo: **D-595 y el cupo se tapaban mutuamente**

**El bug de capacidad hacía IMPOSIBLE reservar dos paseos a la vez** ⇒ sin dos
paseos simultáneos, **el bug del GPS no podía manifestarse**. Y al revés: quien
curara el GPS primero **no habría podido probarlo**.

> **Cada uno era la razón por la que el otro no se veía.** **Se curaron los dos, y
> ninguno se podía cerrar sin el otro.** *De ahí sale la pregunta que S86 debería
> hacerse ante toda condición de muerte que lleva sesiones sin cumplirse: no
> "¿quién la paga?" sino **"¿se puede cumplir?"**.*

---

## 4 · LOS FRENOS — y esta vez el conteo es propio

**A frenó ONCE veces, y NINGUNA fue falsa.** Los que cambiaron una decisión:

| # | el freno | qué cambió |
|---|---|---|
| 1 | el backfill de teléfonos: `telefono_codigo_pais` **NULL en las nueve** | *"usá la columna"* → **preguntar al founder** |
| 2 | endurecer el guard E.164 **rompe `apps/cliente`** | ejecución **diferida** (D-635) |
| 3 | **no existe "la franja de paseo"** — 56/56 universales | la migración **no se escribió** |
| 4 | la FK `prestador_servicios→tipos_servicio` **habría rebotado** (3 huérfanas `'otro'`) | **descartada por dos razones** |
| 5 | el gate en el wrapper **sería decorativo** — `precio` legible por RLS | **RPC DEFINER** en su lugar |
| 6 | **§2.4bis vs S72-P1a**: letra contra letra | **firma del founder**, no adjudicación de mesa |
| 7 | *"cuarta tab"* **no existe en `docs/`** | se enmendó **el nombre**, no el conteo |
| 8 | el lector de handshakes **YA EXISTE** con consumidor | **no se construyó nada** |

> **⚠️ Y CUATRO DE LOS ONCE FRENARON UNA ORDEN DE LA MESA QUE AFIRMABA UN HUECO
> INEXISTENTE.** *Eso no es un reproche: es el dato que justifica que el freno
> sea obligatorio en las dos direcciones.*

---

## 5 · LA MESA MIDIÓ VIEJO **CINCO VECES** — y de ahí sale la regla firmada

**#22, firmada el mismo día que se depositó:** *toda orden que nace de una
medición declara su ancla; la pista re-mide antes de ejecutar.*

**Los cinco:** *"cerralo AHORA"* sobre un retiro ya commiteado · *"commiteá tus 5
sueltos"* ya commiteados · *"`tsc` en rojo"* que estaba verde · *"la cohorte sigue
sin estrechar"* que ya estaba · *"demo-prestador no estaba en tu tabla"* cuando
era el mismo prestador.

**Y su variante peor, que afiló la regla:** la mesa **reenvió una medición ajena**
(el rojo de B) **sin su ancla**. *Una medición ajena reenviada llega con la
autoridad de dos y el respaldo de ninguno.*

> **⇒ la regla ganó su segunda mitad: quien reenvía reenvía SU ANCLA Y SU HORA, o
> la re-mide y la firma como propia.**

---

## 6 · EL PASO ⓪ — **cuatro vedas, y las cuatro se re-pidieron**

**Ningún OTA salió con ancla sucia.** Las razones de cada re-pedido:

1. `Boton.tsx` de B sin commitear → **freno de A**
2. `TokenGallery.tsx` **+90/−73 tres minutos después de confirmar** → freno de A
3. **un commit de A posterior a las dos confirmaciones** → **A se venció sola**
4. el corolario de C, depositado **antes** de fijar el ancla → *la regla, cumplida*

> **El (3) es el que produjo las dos mitades de §3.4:** *la prueba no es "¿mi
> escritura fue inocua?" sino **"¿eximirla ahorra algo?"*** — y su segunda mitad,
> **"avisá que vas a escribir"**.

### ✅ Y la cura estructural quedó FIRMADA: **regla 85, worktree por pista**

*Las tres veces que el árbol se movió entre la declaración y el bundle son la
misma causa: tres pistas en UN árbol y UN índice.* **La tercera fue A** — que
tenía la disciplina escrita y la había exigido a las otras dos ese día.

> **Una regla que su propio autor incumple con el instrumento en la mano no falla
> por falta de rigor: falla porque el entorno la hace fácil de romper.**

*Y `index.lock` mordió **tres veces** (D-586).*

---

## 7 · LO QUE NO SE HIZO, sin maquillaje

- **El gate del founder sobre `2169f9b8` NO corrió.** *Todo lo de S85 está
  **publicado, no firmado** (regla 84, el cuarto eslabón).*
- **D-617 sigue con su mitad ②** — la build 1.0.3 existe y **el founder no
  confirmó su `updateId` desde el pie de Cuenta**.
- **El eje MECÁNICO no se movió.** Las 5 `Campo sin EvitaTeclado` siguen.
- **A3.5bis-b (la puerta del permiso) es LETRA SIN MOTOR** — precondición de
  encendido: el canal es `MODELO_NOTIFICACIONES`, que no existe.
- **`caso_clinico_id` no llega a `eventos_mascota`** ⇒ *"por caso"* **no es
  expresable todavía**. Construcción S86.
- **`apps/cliente` no se buildeó ni se corrió** contra el `packages/api` de S85
  (D-641).

---

---

## 8 · EL HALLAZGO DE C: **la superficie que no se puede gatear**

**Registrado por orden de la mesa. Es un hallazgo, no una ley.**

> **La superficie más difícil de mirar era la que llevaba la promesa que más
> caducaba.**

**El caso:** el *"uno de los **15** prestadores"* de la carta del Día 1 **vivió
desde S79 sin gatearse una sola vez** — y la razón no es que nadie se acordara:
**la carta se muestra UNA VEZ POR CUENTA, en el primer ingreso.** Su alcance es
**de un solo uso POR DISEÑO** (`registrar_primer_ingreso`, la ceremonia §2.3).

⇒ **Nadie podía gatearla.** *Todos los titulares vivos ya la consumieron; para
volver a verla hay que borrar el hecho de haberla visto.*

### Lo que esto obliga a cambiar de criterio

**«Esperemos al gate» es una respuesta válida SOLO donde el gate puede ocurrir.**
*Acá, esperar el gate habría dejado el 15 vivo indefinidamente* — **no por
desidia, sino por construcción.**

> **Y la frase que lo cierra, de C: *lo que la vuelve especial es lo que la
> vuelve irrepetible*.** **La ceremonia del primer ingreso vale porque pasa una
> vez** — *y esa misma propiedad la saca del alcance de toda verificación
> ordinaria.* **No es un defecto del diseño de la ceremonia: es su costo, y hasta
> hoy no estaba declarado.**

**Es la familia de S85 en su forma más incómoda** (L-194 → L-199): *no rompe
nada, renderiza perfecto, y le miente a una persona real* — **con el agravante de
que la única persona a la que le miente es la que jamás va a volver a verla para
avisar.**

### Consecuencia práctica, ya pedida por C

**Poner `primer_ingreso_en` en NULL en una cuenta de prueba de titular** — *una
línea, reversible, **sin tocar la cuenta del founder***— para que la carta sea
mirable alguna vez. **Va después del OTA, no antes.**

> **Criterio derivable, sin firmar:** *toda superficie de un solo uso necesita un
> camino declarado para volver a verla, o nace fuera del alcance de todo gate.*
> **Hermana de L-161** (*toda superficie de GATE se verifica ALCANZABLE antes de
> publicarse*) — **con la vuelta de tuerca de que acá lo inalcanzable no es el
> instrumento sino la pantalla misma.**

---

*Depositada por A, S85. Nada de acá está firmado: son mediciones, frenos y
argumentos. Lo que rige sigue siendo el canon.*
