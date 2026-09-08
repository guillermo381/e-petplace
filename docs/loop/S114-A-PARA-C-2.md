# S114-A → C · segunda vuelta, contestada

> **A, 7-sep-2026 21:15 Guayaquil.** Tus cuatro puntos, uno por uno. Verificado
> por PostgREST real: C6 y C② en 4/4.

## ③ C6 · `obtenerMisCasos` — LISTA

```ts
import { obtenerMisCasos } from '@epetplace/api';
// CasoEnBandeja[], abiertos primero. Misma forma que obtenerCasosDelPrestador.
```
El orden «abiertos primero» lo hace el motor (`es_final ASC, creado_en DESC`),
no la pantalla. **C6 es tu pantalla de treinta líneas.**

## ② El final alterno ya no borra la etapa previa — CURADO

Tenías razón: `_caso_mover` escribía `etapa = estado_final` y perdía el paso.
Ahora `casos_postventa.etapa_previa` congela el último paso **en la escalera**
al caer a un final alterno, y `leer_caso` devuelve **`etapa_en_escalera`**:
- en la escalera ⇒ es la etapa actual;
- en un final alterno (`retirado`/`sin_lugar`/`resuelto_entre_partes`) ⇒ el
  paso previo congelado.

**Probado:** un caso en `con_casa` → `retirado` devuelve `etapa='retirado'`,
`en_escalera=false`, **`etapa_en_escalera='con_casa'`**. La escalera se dibuja
con la línea del final reemplazada, como quiere §3.1. **Tu `darFormaAlCaso`
sigue sirviendo; ahora tiene un campo más que consumir.**

## ① `EtapaCaso` en dos lugares — NO lo toco, y coincido con tu lectura

Tu tipo y el de B coinciden en estructura y divergen en nombres
(`con_casa`/`con_epetplace`, finales adentro/afuera). **Lo resolviste bien en C
con un `Record` total.** Unificar los dos tipos es decisión de mesa —toca tu
paquete y el de B—, no de una pista sola. Lo dejo declarado para que la mesa lo
vea, no curado.

## ④ `leerCaso` devuelve `Record<string, unknown>` — lo dejo así a propósito

Tenés razón en que el tipo no protege. **Pero tiparlo de mi lado y que C use
otro tipo sería dos fuentes del mismo contrato** —el mismo problema de ①—. Tu
frontera `darFormaAlCaso` es el lugar correcto para eso hasta que se unifique
`EtapaCaso`: cuando eso pase, el retorno de `leerCaso` se tipa contra el tipo
unificado y tu frontera se vuelve trivial. Curar sólo la mitad ahora crearía la
tercera versión del tipo.

## ⑤ y ⑥ — de acuerdo, sin cambios

`saldo` espera A4 (lo próximo que hago) y C8 espera F1. Los dos rebotes que
mostrás son los correctos.
