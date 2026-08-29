# S107-C → A · TRES COSAS DEL LECTOR, leídas desde el consumidor

> ## ☠️ CUMPLIDO — las tres: `precio: number | null` en el retorno · `especies` en el lector · `bloquea` dentro de la evaluación, leído también por `reservar_dia_guarderia` (verificado contra el objeto, 29-ago-2026)
> **Este pedido YA LLEGÓ y su texto queda como registro, no como pendiente.**
> *Un pedido cumplido que sigue diciendo «esto no existe» manda a alguien a construir lo que ya está* — y esa es exactamente la verdad vencida que esta sesión cobró dos veces (`D-948`).


> **Qué es:** lo que C encontró consumiendo `guarderia-oferta` y `guarderia-reserva` después de `precio_opcional`.
> **La primera es un DEFECTO con daño concreto**, no una mejora. Las otras dos son forma de contrato.
> **Ninguna se cableó**: el gate configurable **todavía no existe** y la orden fue no cablearlo antes.

---

## 🔴 ① EL LECTOR RECHAZA LO QUE EL ESCRITOR YA ACEPTA — y el prestador queda con el taller roto

`definirOfertaGuarderia` ahora acepta **`precioDia?: number | null`** — *«ya no es obligatorio»*, dice su propio JSDoc. Medido en la base: **`prestador_servicios.precio` es `is_nullable = YES`.**

**Pero `obtenerOfertaGuarderiaPropia` no acompañó:**

```ts
if (typeof data.precio !== 'number' || typeof data.duracion_minutos !== 'number') {
  return fallaCodigo('datos_inconsistentes');
}
```

> ### Una oferta guardada **sin** precio del día **no se puede volver a leer**. El prestador guarda bien, y **la próxima vez que abra su taller la pantalla está rota** — con un código que dice «la respuesta del servidor no tiene la forma esperada», que es cierto y no le sirve de nada.

**Lo que se pide:** `precio: number | null` en el tipo de retorno, y el guard sólo sobre `duracion_minutos`.

⚠️ **Por qué todavía no explotó, y por qué eso NO es un atenuante:** la pantalla de C **sólo llama a la oferta si hay precio del día** —una decisión conservadora que tomé cuando `precioDia` era obligatorio— así que hoy nunca escribe `null`. **El defecto está tapado por accidente, no por diseño**, y se destapa solo el día que C encienda la ruta nueva. *Un defecto que espera a que alguien haga lo correcto es peor que uno que falla ya.*

---

## ⚠️ ② EL LECTOR NO DEVUELVE `especies`, Y EL ESCRITOR LAS PIDE

`definirOfertaGuarderia` ganó **`especies?: string[]`**. `obtenerOfertaGuarderiaPropia` **no las devuelve**.

**Consecuencia exacta si C montara el selector hoy:** cargaría su default (perro+gato), **un prestador que guardó «solo perros» vería las dos marcadas**, y al guardar **sobrescribiría su propia elección**. *Sin error, sin log — su decisión desaparece porque la pantalla no pudo saber que existía.*

**Lo que se pide:** `especies: string[]` en el retorno. **Con eso C monta el selector en la misma tanda** (es la sección «Especies que recibes» que la firma pide arriba de todo y que hoy no existe por esto).

---

## ③ EL GATE CONFIGURABLE — la forma que lo hace consumible sin duplicar lógica

La firma dice: **el bloqueo es configurable y nace apagado**; la pantalla **refleja** el estado del servidor y **no lo decide**; y **es la misma pantalla en los dos modos**.

**Para que eso sea posible, el «si bloquea» tiene que viajar CON la evaluación**, no en otra llamada:

```ts
export interface RequisitosGuarderia {
  alDia: boolean;
  faltantes: RequisitoFaltante[];
  /** 🔴 Si hoy el faltante FRENA la reserva. Nace `false`. */
  bloquea: boolean;
}
```

**Por qué junto y no aparte:** con dos llamadas hay un instante en que la pantalla sabe qué falta **y no sabe si frena**, y ahí tiene que elegir —y elegir es decidir, que es justo lo que no debe hacer—. *Un dato de política que llega separado del dato que gobierna se desincroniza el día que una de las dos lecturas falle.*

**Lo que C hace cuando llegue — para que se vea el tamaño:** el botón pasa a `deshabilitado={… || (requisitos.bloquea && !requisitos.alDia)}` y el pie cambia de string. **Dos líneas. Cero ramas nuevas, cero pantalla duplicada.**

**Y la voz, que es lo que la firma cuida:** con el bloqueo apagado, el faltante **se dice sin frenar y sin drama** — *le falta algo y lo puede resolver, no está haciendo nada malo*. El camino a cargarlo sigue a un toque en los dos modos, porque **`SemaforoSanitario` no compila un faltante sin camino**.

⚠️ **Un borde que conviene decidir en el motor y no en la pantalla:** con el bloqueo **apagado**, ¿`reservar_dia_guarderia` acepta igual? **Si el RPC siguiera rebotando `requisitos_sanitarios`, la pantalla dejaría tocar «reservar» y el servidor lo negaría** — *el peor de los dos mundos: una puerta que se abre para chocar contra otra.* **Los dos tienen que leer la misma perilla.**
