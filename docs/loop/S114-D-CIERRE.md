# S114-D — CIERRE · LA PUERTA DE IA DE POSTVENTA

> Rama `pista/s114-d-1.0` · punta **`17071857`** · **verificada ancestro de
> `main` `814a06c1`** (`git merge-base --is-ancestor` verde). El detalle largo
> vive en `docs/loop/S114-D.md`, que entró en el mismo merge; esto es el asiento.
>
> **La ley que gobierna la pista, verbatim de §11:** *«El disparo nunca es del
> modelo: una regla determinística decide que algo exista; el modelo redacta.
> Ninguna salida de IA escribe estado, monto ni transición.»*

---

## 🔴 DOS CORRECCIONES AL ACTA, Y SE DICEN PRIMERO PORQUE VAN AL CANON

El acta (`S114-CIERRE.md`) se escribió, con todas las letras, *«con lo que A
veía desde su asiento»*. Desde ahí no se vio D, y quedaron dos cosas que
conviene arreglar antes de que se transpongan:

1. **La línea de pistas dice «D (`packages/mensajeria`)».** Ése fue el
   territorio de D en **S112**. En S114 D fue **la puerta de IA de postventa**:
   `supabase/functions/postventa-{intake,hoja}` + `_shared/postventa/` + sus
   gates. **Cero `packages/mensajeria`.**
2. **El pedido de cierre me atribuye «las migraciones de avisos/purga que le
   pasaste a A».** **No escribí ninguna migración en S114** — medido y dicho ya
   dos veces en el buzón:
   ```bash
   git diff --name-only e516a089..17071857 | grep -c '^supabase/migrations/'   # → 0
   ```
   *Quien haya hecho esas migraciones merece que se le acrediten.*

⚠️ Y el acta **no menciona la puerta de IA en ninguna parte** (`grep -i
postventa` la encuentra en el motor, las etapas y las superficies; el intake y
la Hoja no están). **Este asiento es esa parte.** *No edité el acta de A: es
suya, y corregir el archivo de otro sin avisar es cómo se generan las dos
verdades que esta sesión pasó tres cartas desenredando.*

**Sobre la causa, sin dramatizarla:** A lo diagnosticó solo —ruteó por nombre de
sesión, y el nombre no dice la pista—. **Esta casa ya lo había pagado**
(`e-petplace-d5` era B). El buzón por letra sí es inequívoco.

---

## LO QUE ENTRÓ A `main`

| pieza | qué es |
|---|---|
| `_shared/postventa/contrato.ts` | La puerta determinística: `validarIntake` · `validarHoja`. |
| `postventa-intake` | Propone motivo + resumen de una línea + evidencia que falta. **No escribe nada.** |
| `postventa-hoja` | Resume el hilo y propone **UNA** resolución con su porqué. **No aplica nada.** |
| `_shared/postventa/plantillas.ts` | El trámite **FIJO** (sin puerta a la IA) y el borrador (donde el modelo sí escribe). |
| `verify:postventa-contrato` | 26 ataques rechazados por nombre · 9 controles positivos. |
| `verify:postventa-plantillas` | 5 controles. |
| `verify:postventa-nexo` | 6 controles: estructural + el muro ejercido con `deno` aislado. |
| `medir:nexo-caso` · `ejercer-postventa-E` · `hoja-propone-E` | Las mediciones con modelo real. |

**Desplegadas:** `postventa-intake` **v3** · `postventa-hoja` (ACTIVE), las dos
con la ley puesta en la puerta y no en el prompt.

**La decisión de fondo: lista blanca, no lista negra.** Se declara lo que el
modelo puede mandar y todo lo demás cae solo. *Una lista de prohibidos mide la
imaginación de quien la escribió* — `monto_devuelto`, `nuevo_estado` y
`resolucion` habrían pasado enteros mientras el gate informaba que no había
campos de plata. Y **la clase, la urgencia, el `pide_foto` y la voz se COPIAN de
la fila** del catálogo: §4 en código.

---

## LO MEDIDO POR CAMINO REAL (no de la forma: del uso)

**Intake · 6 relatos × 5 corridas, texto y dictado, sobre los tres objetos:**
motivo del catálogo resuelto **5/5 en los seis** · clase+urgente de la fila 5/5
· `pide_foto` de la fila 5/5 · catálogo entero en `opciones` 5/5.
*El dictado no fue prosa con otra etiqueta: muletillas, sin puntuación, la idea a
mitad de camino.*

**El modo de falla es el declarado:** texto que no dice nada → `propuesta: null`
**+ las 10 opciones**. **Ningún camino devuelve «probá de nuevo» con las manos
vacías**; el error queda para lo que ni siquiera puede ofrecer la lista.

**Hoja · camino principal, contra el caso ABIERTO de E (`de6015a1`,
`con_prestador`, 4 turnos con las tres voces):** 5/5 marcadas `es_propuesta` ·
**0/5 con campo de estado, monto o transición** · 0/5 sin `porque` · 0 voseo.
Y lo que el conteo no dice: **propone un ACTO 5/5**, anclada en el hilo 2,2 de 4
sobre datos que sólo existen ahí. *Ninguna flota.*

**NEXO dentro de un caso · 120 llamadas, 5 corridas, una sola variable:**
derivación **12/12 en las dos celdas, rango 12–12**. **La regla no se ablanda
dentro de un caso.** Y está medido que hoy un caso **no puede** llegar a NEXO por
el contexto — es una propiedad de la forma de la edge, con gate para que siga
siéndolo.

---

## LO QUE LOS CONTROLES NEGATIVOS ENCONTRARON — EN MIS PROPIOS INSTRUMENTOS

Ninguno de estos lo encontró leer código: los encontró **romper el guard a
propósito y ver si daba rojo**.

- **La rotura «la clase sale del modelo» daba VERDE.** Medido: era
  **inalcanzable** (la lista negra la corta antes). *Mi caso no medía lo que su
  nombre decía.* Con `clase` fuera de la lista negra, la propuesta **siguió
  saliendo con la clase de la fila**: son dos capas de verdad, y ahora está
  medido cuál sostiene qué.
- **`\b` no delimita palabras en español:** `/^Escribí\b/` no cerraba nunca y dio
  cuatro rojos falsos.
- **Un detector de «frase dictada» por comillas** emparejaba el texto *entre* dos
  ejemplos de voz.
- **El gate del destinatario era permisivo:** la línea vieja pasaba porque
  termina en *«nunca voseo»* — una negación **de otra cosa**, y posterior.
  *Un rojo por la razón equivocada está tan roto como un verde por la razón
  equivocada.*
- **El arnés colgaba:** importar `coach` arranca su `Deno.serve` y el proceso
  nunca terminaba — 20 min con 0,57 s de CPU y salida en cero bytes.
- **El denominador encogía en silencio:** 72 de 96 llamadas perdidas con los dos
  `catch` mudos, y el reporte decía «3.0 de 12» cuando habían contestado dos.

---

## EL DEFECTO QUE SÓLO SE VIO EJERCIENDO — y no era sólo mío

`no_ejecutado` existe para `cita` **y** para `estadia`, y estadía hereda de
cita ⇒ `v_motivos_resueltos` lo devolvía **dos veces, con dos voces**. Contra la
edge desplegada, **3/3 y consistente**: sobre una guardería la propuesta salía
con `objeto: 'cita'` y la voz «No vino / no me atendieron», con el motivo
duplicado en la lista.

*Clase «coinciden por casualidad»:* nació el día que se agregó ese motivo, sin
que nada fallara. **A tomó el pedido y aplicó el `DISTINCT ON`** — verificado
contra la vista viva: 0 duplicados, estadía 13 → 12, `procedencia='propio'`.
Mi desduplicado del lado consumidor **quedó en no-op, como estaba declarado**, y
su propia línea de log dice si sigue haciendo falta.

---

## LAS DOS LECCIONES AL CANON

- **`L-507`** — En un prompt, **un EJEMPLO pesa más que una DECLARACIÓN**, y el
  peor viene copiado de un contexto donde era correcto. *Copiar un ejemplo sin
  copiar su destinatario.* Hermana del muro de NEXO, con el giro de que la que
  invitaba no era otra regla: era un ejemplo, que ni se lee como instrucción.
- **`L-508`** — Si la línea base del defecto es **más chica que el ruido**, el
  gate va en la **ENTRADA**. Medido: 1 en 15 (~7 %) ⇒ un `0/20` después es
  indistinguible del `0/10` de antes. *Decir «0/10 después» como evidencia sería
  vender falta de poder como resultado.* Su corolario: ese `0/N` sí sirve como
  **control de no-regresión** — confundir control con prueba es lo que prohíbe.

**Y el freno que evitó una colisión cuádruple:** `proximo:ficha` dio «libre
L-498» midiendo **mi árbol**; entre las seis ramas estaba tomado **hasta L-506**.
No es un defecto del script —lee el árbol donde corre— pero **con pistas en
paralelo garantiza colisión y entrega el número con autoridad de instrumento
oficial**. Clase de `D-998`. Reportado a A; su script, no lo toqué.

---

## LO ABIERTO, CON DUEÑO

- **A** — 🔴 `proximo:ficha` no ve las ramas hermanas (arriba). El comando que lo
  cubre mientras tanto está en ⑤quater de `S114-D.md`.
- **Mesa** — el prompt de la Hoja quedó con el destinatario firmado (le habla a
  la casa). **Si algún día se quiere que el borrador ya venga hablándole a la
  familia, es una línea** — pero entonces hay que mover el gate, no sólo el
  texto.
- **Nada bloqueante mío.** Las dos edges están desplegadas y sus tres gates en
  verde contra `main`.

## LO QUE ESTAS PIEZAS **NO** HACEN — dicho para que no se infiera

- **No escriben.** El caso lo crea la RPC de A tras la confirmación humana;
  `confirmado_por` **no existe en el tipo de salida del intake**, y esa ausencia
  es la ley, no un olvido.
- **No miden si una propuesta es BUENA.** Eso es criterio de la casa, y la mesa
  fue explícita en que no se construya un detector de calidad. Lo que se mide es
  si está **anclada** en el caso o si flotaría en cualquiera.
- **El muro clínico no puede separar** «alto en general» de «el suyo está alto»
  — lo declara el propio muro, y este cierre no lo contradice.
