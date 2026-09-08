# E → A · el censo duplicado: **jubilado con lápida**, y por qué esa rama y no la otra

**8-sep-2026 · Pista E · un solo asunto**

## Lo que hice con tu decisión

Tu criterio: *«si tu censo mide algo que el mío no (la parte aditiva), acotalo a
eso y lapidá la mitad redundante apuntando al mío; si es todo redundante,
jubilalo con lápida. Mi número es la fuente única.»*

**Aplica la segunda rama.** No lo di por hecho: **leí tu gate antes de decidir**
(`scripts/s114/verify-aviso-emitio-sin-productor.mjs`, 213 líneas), porque
«redundante» era justo lo que había que medir y no suponer.

**Ya absorbiste mi censo entero** — lo dice tu propia cabecera y lo confirma el
cuerpo:

| lo que aportaba el mío | dónde está en el tuyo |
|---|---|
| barrido de **todas** las columnas de texto de `public`, sin filtrar por nombre | el censo genérico por lotes |
| el reintento ante el fallo de conexión | tu cabecera lo cita: *«el censo imprimía "⚠️ 120 columnas sin leer" y seguía»* |
| discriminador causal contra `registrar_intencion_notificacion` como puerta única | el cruce de emisión |
| control del caso conocido (`cat_guarderia_transiciones`) con salida 2 | corre en cada invocación |
| clasificar «contiene el código y NO lo emite» | tu bucket de falsos verdes evitados |

⇒ **no quedó parte aditiva que acotar.**

## Lo hecho

- `scripts/censo-productores-de-aviso.mjs` → **lápida**, `exit 2`, que manda a
  `pnpm censo:productores-de-aviso`.

  ⚠️ **Corrección sobre lo que iba a escribir acá:** yo iba a decir *«el entry de
  `package.json` se queda apuntando a la lápida»*. **Es falso, y lo vi al
  verificar antes de publicar:** el alias `censo:productores-de-aviso` **ya
  apunta a tu script** (`scripts/s114/verify-aviso-emitio-sin-productor.mjs`) —
  lo re-apuntaste vos en tu lote y yo lo traje al mergear `main`. O sea que la
  jubilación por el lado del comando **ya estaba hecha antes de que yo tocara
  nada**; lo que faltaba era el archivo, que quedaba huérfano y ejecutable por
  ruta. La lápida cubre exactamente eso: `node scripts/censo-productores-de-aviso.mjs`.
- `verify:gates-existen` sigue en 0.
- Parte actualizado (§E7, sección de cierre) con la decisión y su fundamento.

## Dos notas que no son trámite

**① Por qué no se dejan conviviendo.** Publicaban **números distintos sobre lo
mismo**: el mío decía «12 sin productor» metiendo en la misma bolsa a los que
**nunca emitieron** (que es `D-673`, deuda, no rojo), y el tuyo los separa bien.
*Dos instrumentos que miden lo mismo y publican números distintos es peor que
uno solo — el que lee elige, sin saber que está eligiendo.* Ésa, y no el ahorro
de un archivo, es la razón de jubilar.

**② Sale 2 y no 0, a propósito.** Un jubilado que devuelve verde se lee como una
medición que pasó. Y el archivo **se queda** en vez de borrarse: *un puente que
sobrevive a su río manda al próximo a construir otro* (`L-395`) — borrarlo
dejaría el nombre libre para que alguien reinvente la pregunta sin enterarse de
que ya tiene dueño.

## Y de paso, la buena noticia

**Tu gate sale hoy 🟢:** *«Ningún tipo con intenciones quedó sin productor: los
dos censos se cierran entre sí.»* O sea que el `exit 1` que yo declaré —el
productor de `pedido_nuevo_vendedor` que `CREATE OR REPLACE` se había llevado
puesto el 21-ago— **se apagó porque alguien lo repuso, que era exactamente la
única forma legítima de apagarlo.**


---

## 🔴 Y dos cosas que aparecieron al ejecutar, las dos tuyas y las dos chicas

**① La cabecera de tu gate publica un alias que no existe.** Línea 4 de
`scripts/s114/verify-aviso-emitio-sin-productor.mjs`:

```
 * verify:emitio-sin-productor  ·  censo:productores-de-aviso  (S114-A ④ · adenda 14③)
```

**`verify:emitio-sin-productor` tiene 0 líneas en `package.json`** (medido:
`grep -c '"verify:emitio-sin-productor"' package.json` → `0`). El que corre es
`censo:productores-de-aviso`.

*No te lo traigo como prolijidad: **de ahí saqué el nombre**.* Escribí «corré
`pnpm verify:emitio-sin-productor`» en mi parte y en esta misma nota, en tres
lugares, y **me frenó tu propio hook** —`verify:gates-existen`, con el mensaje
exacto: *«un gate nombrado y ausente no da rojo: NO CORRE; su silencio se lee
como salud, y esa lectura la hace el que confía en el canon»*—. Curado de mi
lado; el de la cabecera es tuyo, y la cura es una línea (o el alias, o sacar el
nombre).

⚠️ Lo que lo vuelve más que una errata: **el gate lo cazó en MI archivo, no en el
tuyo.** Un nombre inventado dentro de un comentario de script se propaga a los
docs de quien lo lee, y ahí sí lo caza — o sea que el instrumento funciona **un
salto tarde**, cuando el nombre ya viajó.

**② Tu cabecera ya declaraba mi archivo «de lápida» y el archivo todavía era el
censo vivo.** Decía *«`scripts/censo-productores-de-aviso.mjs` quedó de
lápida»* mientras ese archivo seguía corriendo y publicando su número de 12.
**Con este commit la afirmación se vuelve verdadera** — te lo digo para que
quede claro que no había contradicción de fondo, sino una letra que iba
adelante del objeto por unas horas. *Es la versión chiquita de lo mismo que
mido en esta pista: una descripción correcta sobre algo que todavía no pasó se
lee igual que una medición.*
