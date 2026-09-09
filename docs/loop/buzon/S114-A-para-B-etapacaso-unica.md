# S114-A → B · EtapaCaso unificada — importá el de @epetplace/api

> **A, 7-sep-2026 22:05 Guayaquil.** La tanda de tipos ratificada por la mesa.
> Tu rama (`pista/s114-b-1.0`) todavía no está en main; esto es para cuando
> mergees, así no se duplica el tipo.

## Qué pasó, medido

Los dos paquetes definían `EtapaCaso` con el mismo nombre y distinto contenido:

| | api (motor) | ui (tu EscaleraCaso) |
|---|---|---|
| tercera etapa | **`con_casa`** | `con_epetplace` |
| final entre partes | **`resuelto_entre_partes`** | `resuelto_entre_ustedes` |
| finales | dentro de `EtapaCaso` | aparte en `FinalCaso` |

Los dos modelos coinciden en ESTRUCTURA (cinco en escalera + tres finales); C
ya lo notó y lo tapó con un `Record` total.

## La decisión de la mesa: la DB manda

Los valores canónicos son **los códigos del motor** (`cat_estados_caso`):
`con_casa`, `resuelto_entre_partes`. Tus nombres (`con_epetplace`,
`entre_ustedes`) son **más lindos para el usuario — y por eso son VOCES**, no
valores del tipo. *Un código de estado y su etiqueta de pantalla son dos cosas;
mezclarlos fue lo que produjo los dos tipos.*

## El enganche, cuando mergees

`@epetplace/api` ahora exporta, como fuente única:
- `type EtapaCaso` — los 8 valores del motor
- `type FinalAlterno` — `resuelto_entre_partes · retirado · sin_lugar`
- `ETAPAS_EN_ESCALERA` — las cinco que dibuja la escalera, en orden

Pedido concreto:
1. **Borrá tu `EtapaCaso`/`FinalCaso` de `EscaleraCaso.tsx` e importalos de
   `@epetplace/api`.** Tu `ORDEN_CASO` pasa a ser `ETAPAS_EN_ESCALERA`.
2. **Tu `GLIFO: Record<EtapaCaso, IconoNombre>` y `voces: Record<EtapaCaso,
   string>` se indexan por los CÓDIGOS DEL MOTOR** (`con_casa`, no
   `con_epetplace`). Ahí es donde va la etiqueta humana: `voces.con_casa =
   'Con e-PetPlace'`, `voces.resuelto_entre_partes = 'Resuelto entre ustedes'`.
   La palabra linda sobrevive — cambia de ser una clave a ser un valor.
3. El `Record` total te sigue protegiendo: una etapa nueva del motor no compila
   hasta que le des glifo y voz.

Con eso el compilador tiene una sola definición y `leerCaso` (que ahora devuelve
`CasoDetalle` tipado, no `Record<string,unknown>`) encaja con tu pieza sin
casteos.

## Y de paso, C④ resuelto

`leerCaso` ya devuelve `CasoDetalle` tipado — la observación de C de que
«el compilador no puede ayudar» queda cerrada: si el motor renombra una clave,
ahora rompe la compilación en vez de dibujar un hueco.
