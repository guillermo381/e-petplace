# A → C · CONTRATO · `registrarBitacoraGuarderia` (los chips de ③)

> **Ya está en `main`.** Es lo que te frenaba ③.

## No hay vocabulario nuevo, y el lector tampoco es nuevo

El vocabulario es **`cat_conductas_bitacora`** — la bitácora UNIVERSAL de S91.
**25 conductas activas, 15 aplicables a perro**, y son exactamente *«cómo se
portó hoy»*: `lloro_al_quedarse_solo` · `no_quiso_comer` · `destrozo_objetos` ·
`vomito` · `hizo_fuera_de_lugar` · `se_escondio` · `miedo_ruidos` …

**Los chips los pinta un lector que YA EXISTE:**

```ts
obtenerVocabularioBitacora({ especie, sujeto })
```

⚠️ **Y acá está la trampa, por eso va primero:** ese lector devuelve
**conductas Y OBJETIVOS**. Los objetivos son del currículum de adiestramiento y
**mi escritor los RECHAZA** (`chip_invalido`). **Quedate sólo con
`tipo === 'conducta'`.** *Si pintás todo, el cuidador toca un objetivo y le
suena un rebote que no entiende.*

## El escritor

```ts
registrarBitacoraGuarderia({
  estadiaId: string;
  conductas?: string[];   // códigos de cat_conductas_bitacora, SIN objetivos
  texto?: string;
}): Promise<ResultadoWrapper<ResultadoBitacoraGuarderia, CodigoErrorGuarderiaDurante>>

interface ResultadoBitacoraGuarderia {
  bitacoraId: string; eventoId: string; estadiaId: string;
  yaExistia: boolean;      // ya había bitácora de esta estadía
  chipsRecibidos: number;
  chipsNuevos: number;     // cuántos entraron DE VERDAD
}
```

## Las cuatro cosas que cambian cómo lo montás

**① IDEMPOTENTE POR (estadía, conducta).** Una estadía **es** un día, así que
eso equivale a *(estadía, conducta, día)*. Hay **una sola fila de bitácora por
estadía** y la clave del puente de chips vuelve el duplicado **inexpresable**.
⇒ **el segundo toque devuelve `chipsNuevos: 0`, jamás un error.** Podés mandar
el set completo cada vez sin miedo — *no necesitás llevar la cuenta de qué ya
mandaste*.

**② `yaExistia` + `chipsNuevos` te dejan decir la verdad.** Con `yaExistia:
true` y `chipsNuevos: 0`, la pantalla puede decir *«ya estaba»* en vez de fingir
que escribió. *Un «guardado» sobre algo que no cambió enseña a desconfiar del
guardado.*

**③ El texto se AGREGA, no se pisa.** Dos observaciones del día son dos.

**④ Guard de estado terminal.** Sobre `cancelada`, `no_recogida` y `entregada`
rebota `estadia_terminal` con el estado adentro.
🔴 **Y te aviso el borde que declaré:** `entregada` es discutible —el animal SÍ
estuvo, y las manos del cuidador quedan libres justo después de entregar—. Lo
construí como se pidió y lo dejé nombrado; **si el founder abre la ventana, es
sacar un valor de una lista** y tu pantalla no cambia. Mientras tanto: **la
sección de chips no debería estar tocable en una estadía entregada** — mejor eso
que un rebote.

## Los rebotes, ya con voz

`estadia_terminal` · `bitacora_vacia` · `chip_invalido` ·
`chip_no_aplica_a_la_mascota` · `no_gestionas_este_prestador`

## Lo probado, sobre el caso real

**10 brazos, 5 rojos primero, `ROLLBACK`, residuo 0.** El rojo que más vale:
`vomito` (aplica a perro, no a ave) **rebotó sobre Pepe**, que es un ave —
*el filtro por especie no es una nota, funciona*.

— A
