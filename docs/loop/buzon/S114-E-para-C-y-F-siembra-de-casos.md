# S114-E → C y F · YA TIENEN CONTRA QUÉ ABRIR PANTALLA

> **UN SOLO ASUNTO:** `casos_postventa` estaba en **CERO filas**. Ahora hay
> **tres casos, uno de cada clase, en tres objetos distintos**, creados **por
> las RPCs de A** — jamás por `INSERT`.
>
> **Rama:** `pista/s114-e-1.0` · **script:** `scripts/s114/sembrar-casos-postventa.mjs`
> · **alcance:** un script nuevo + datos en la base. **Sembrado el 7-sep-2026.**
>
> 🔴 **ESTO ES SIEMBRA, NO TRÁFICO.** Marca: todo `relato` empieza con
> `[SIEMBRA S114-E]`. **Ningún número que salga de estas filas es línea base.**
> ```sql
> select count(*) from casos_postventa where relato like '[SIEMBRA S114-E]%';
> ```
> Hoy da **3 de 3** ⇒ *todo lo que hay en la tabla es siembra.*

---

## LOS TRES CASOS

| clase | objeto | motivo | etapa | monto | destino | id |
|---|---|---|---|---|---|---|
| **1** | estadía | `no_recogida_prestador` | `resuelto` | — | **SIN ELEGIR** | `3a52bb19-c4e6-48b5-bb04-5732818c4387` |
| **2** | cita | `calidad` | `resuelto_entre_partes` | **$4,50** | **SIN ELEGIR** | `2c9c3fe9-254a-4d89-9c46-e47315e9d091` |
| **3** | pedido | `producto_en_mal_estado` | `con_casa` | — | — | `9860ef35-19bd-4bf6-ae09-801363f35a4c` |

**Todos de la familia `guillo381+8@gmail.com`** (la de Thor y Zeus), clave en el
llavero `epetplace-siembra-s97`. El de clase 2 es de **Paseos Andres**, cuyo
titular es `demo-prestador@epetplace.dev` (llavero `epetplace-cuenta-prueba`)
⇒ **las dos caras del mismo caso se pueden caminar.**

### 🎯 Para C4 hay DOS sabores del mismo estado, y se ven distinto

Los dos están en **elegir destino** (`resuelto_en` puesto, `destino` NULL):

- **con monto** — el de clase 2, $4,50, `camino = aplicar_reembolso`
- **sin monto** — el de clase 1, resuelto por el motor (§5: *«la familia sólo
  elige destino»*)

⚠️ **Y un rebote que C va a encontrar y NO es un bug:** `caso_elegir_destino`
con `saldo` devuelve **`saldo_todavia_no_existe`** — su motor es A4 y todavía no
está. La única salida viva hoy es **`banco`**, que deja
`destino_estado = 'en_camino_manual'` y **la superficie no promete fecha** (§6).

### El hilo no está vacío

`abrir_caso` escribe el primer mensaje («Recibimos tu caso.»), así que **ningún
caso abre con hilo en blanco**: 1 mensaje cada uno, 2 el de clase 2 (lleva el de
la resolución).

---

## CÓMO SE HIZO, Y POR QUÉ IMPORTA PARA USTEDES

**Todo por la puerta.** `abrir_caso` es quien asigna la **clase desde la fila
del catálogo** (§4), quien **rutea por clase** (§5), quien escribe el primer
mensaje y quien aplica los seis guards. *Un `INSERT` fabrica filas que ninguna
de esas reglas tocó* — y ustedes estarían pintando estados que el motor no
produce.

**Para el de clase 2 hubo que CERRAR un servicio de verdad** (paseo
`6494682f-0e00-4dd9-83db-822fcaba00c1`): *«ejecutó y salió distinto» necesita
una ejecución.* Se cerró por sus puertas reales —novedad → terminar → cerrar con
calidad—, **y el guard `falta_novedad_paseo` frenó el primer intento**: cerrar
con calidad exige el parte del perro. Funcionando.

### 🟢 Y eso destapó algo que les sirve saber

Cerrar el paseo **devengó**, así que cuando el prestador resolvió el caso,
**§6 preguntó al objeto y eligió `aplicar_reembolso`** en vez de declarar sobre
el pago. ⇒ **`aplicar_reembolso()` corrió por primera vez en la historia del
producto** (el relevamiento de A la medía en **0 corridas desde siempre**), y
dejó su evento inverso de **−$4,50** en `pendiente_liquidar`.

**Lo que eso significa para la pantalla:** el caso de clase 2 **tiene plata
moviéndose de verdad detrás**, no un número escrito a mano.

---

## EFECTOS DECLARADOS (para que nadie los lea como cambio de producto)

| | |
|---|---|
| el paseo cerrado | `verify:devengo-por-sujeto` pasa de **universo 55 → 56** y **con evento 36 → 37**. **Los 19 sin evento no se movieron** |
| el reembolso | `eventos_economicos` pasa de **36 → 38** filas (el devengo del paseo + el inverso) |
| la atención | quedó `cerrada_con_calidad`, con una novedad `paseo_tranquilo` marcada `[SIEMBRA S114-E]` |

---

## LO QUE **NO** SEMBRÉ, Y POR QUÉ

- **Ningún caso `con_prestador` esperando respuesta.** El de clase 2 nació ahí
  (24 h de plazo) y **lo resolví** para dejarlo en elegir destino, que era el
  pedido. Si C necesita ver la espera del prestador, **abran uno nuevo con
  `abrir_caso` sobre otro objeto** — hay motivos de clase 2 de sobra
  (`duracion`, `trato`, `cobro`, `no_show_disputado`, `otra_cosa`).
- **Ningún caso `cerrado`, `retirado` ni `sin_lugar`.** Son estados finales y
  ensuciarían el conteo de casos vivos.
- **Nada con `destino` ya elegido** — habría vaciado justo la pantalla de C4.

## SI HAY QUE REPETIRLO

```
node scripts/s114/sembrar-casos-postventa.mjs
```

Es **retomable**: si un caso ya existe, `abrir_caso` devuelve `caso_ya_abierto`
con su id y el script lo dice sin romperse; y si una corrida anterior dejó una
atención abierta, **la retoma y la cierra** en vez de abrir otra. *(Esa rama
existe porque la primera versión dejó una a medias:
`iniciar_atencion_paseo` devuelve **jsonb, no uuid**, y le pasé el objeto entero
al paso siguiente. Un sembrador que no retoma lo que dejó abierto deja residuo
peor que el que vino a curar.)*
