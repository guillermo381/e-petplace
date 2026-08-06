# LÁMINA — LA CAMPANA

> **FIRMADA POR EL FOUNDER · 5 de agosto de 2026.**
> Depositada VERBATIM de la mesa por la pista A. **No se edita al transcribir.**

---

1. Un ícono de campana EN TRAZO en el encabezado del HOY (las dos
   apps), con una HUELLA RELLENA en la esquina cuando hay avisos
   sin leer — jamás un número (el número invita a vaciarlo: la
   mecánica que MODELO_LOYALTY §3 prohíbe). Coherente con la ley
   del único relleno (objeto en trazo + una huella rellena) y con
   la huella como marcador de la casa. Tamaño mínimo legible
   VERIFICADO EN DISPOSITIVO; color de acento, jamás rojo de
   alarma — un aviso no es un error.
2. Al tocarla: lista de avisos, más nuevo arriba, cada uno con su
   voz humana (la misma del correo — plantillas como dato), su
   momento relativo, y de qué mascota o negocio habla. No leídos
   distinguidos sin gritar.
3. Al tocar un aviso: lleva AL LUGAR DEL HECHO (la cita, el
   expediente, el plan) y lo marca leído. Un aviso sin destino no
   se pinta como si lo tuviera.
4. Vacío honesto: «No tenés avisos» — sin ilustración triste ni
   celebración. Y EL MEMORIAL CALLA ACÁ TAMBIÉN: lo que el motor
   descartó no aparece nunca.

NO hace: marcar todo leído de un saque · mostrar descartados ·
repetir lo resuelto.

---

## Reparto (nota de la pista A — no es parte de la lámina firmada)

| pieza | de quién |
|---|---|
| **el LECTOR** (intenciones `in_app` de la persona, con leído/no leído y destino) | **A** |
| la pieza de UI (campana + huella) | **B** releva |
| la pantalla | **C** (prestador) · **D** (cliente) |

**Punto 4, y es del motor, no de la pantalla:** *lo que el motor descartó no
aparece nunca.* El gate memorial vive en `registrar_intencion_notificacion`
desde el Lote 1 — la campana no vuelve a decidirlo, **lo hereda**. Que la
pantalla no tenga que acordarse es exactamente el punto.

---

## ⚖️ ENMIENDA FIRMADA (founder, 6-ago-2026) — **LA CAMPANA ES EL REGISTRO, NO EL CANAL**

El punto 2 decía *«los avisos entregados por canal in_app»*. **Se enmienda: la
campana muestra TODO lo ENTREGADO a esa persona, por el canal que sea.**

> ### **EL CANAL ES CÓMO LE LLEGÓ; LA CAMPANA ES DÓNDE QUEDA.**

**Las tres razones firmadas:**

1. **Quien recibe un correo y abre la app busca ahí lo que le avisaron.** Si no
   está, **la campana miente por omisión**.
2. **Medido al firmar:** 13 entregadas · 12 visibles · **1 invisible, y la
   brecha crecía con cada correo**. *Un aviso que salía por mail desaparecía
   del historial del producto.*
3. **El modelo llama a `in_app` «el piso que nunca se pierde»** — y *un piso que
   solo guarda lo que nadie más entregó no es piso: es descarte.*

### Y lo que la enmienda cambia de significado, no solo de filtro

> **«NO LEÍDO» PASA A SIGNIFICAR «NO LO VISTE EN LA APP».**
> Es lo único que la app puede saber: **no sabe si abriste el correo.**
> *Nadie debe leerlo como «no lo recibiste» — y la voz de la pantalla no puede
> sugerirlo.*

---

## ⚖️ LA LEY DE SECUENCIA — firmada por el founder (S88), y va ANTES de construir

**Medido:** `cat_notificacion_canales.transporte_vivo` está en **`false` para
`in_app`**. Y la enmienda §7 (S88) dice que el canal elegido es *el primero
habilitado **con transporte vivo***.

> ### **LA CAMPANA *ES* EL TRANSPORTE DE `in_app`.**
> ### **⇒ EL FLIP DE `transporte_vivo` A `true` ES EL ÚLTIMO ACTO — cuando la pantalla exista y el founder la gatee. JAMÁS ANTES.**

**Qué pasa si se invierte el orden**, dicho para que nadie lo intente por
prolijidad: el motor empezaría a **elegir `in_app`** para las personas cuya
preferencia lo pone primero, y **entregaría a un buzón que nadie puede abrir**.
No fallaría, no rebotaría, no dejaría rastro rojo: los avisos **saldrían de
`retenida` y se marcarían resueltos** contra una pantalla inexistente.

*Es la familia de la salida creíble con resultado falso — y peor que las otras,
porque el dato perdido es un aviso que alguien esperaba.*

**El orden en piedra:**

```
① el LECTOR                          (A — se puede construir ya: nadie lo llama todavía)
② la PIEZA de UI y la PANTALLA       (B releva · C/D construyen)
③ el GATE del founder en dispositivo
④ recién ahí:  UPDATE cat_notificacion_canales SET transporte_vivo = true
                WHERE codigo = 'in_app';     ← UNA fila, UN acto, al final
```

**Y el corolario que la hace verificable:** mientras ④ no ocurra, `in_app` sigue
siendo **el piso que nunca se pierde** (CARA 3 del par de la enmienda §7) — las
intenciones quedan registradas y visibles para el lector, sin que el motor las
dé por entregadas por un canal que no existe. **El lector puede construirse y
probarse HOY sin encender nada.**

*Es la misma forma que el gate de la vitrina (S78): el artefacto que falta está
NOMBRADO, y el día que exista, la puerta se abre sola.*

### ✅ EJECUTADA (6-ago-2026) — y un hallazgo que evita leer el flip como fallido

Los cuatro pasos se cumplieron al pie, y el ④ se aplicó tras el gate VERDE del
founder. **Pero el par del después no cerró como se esperaba, y el literal
explica por qué:**

```sql
WHERE ch.codigo = ANY(v_canales) AND ch.es_piso = false AND ch.transporte_vivo
```

> **`in_app` está EXCLUIDO de la selección por ser el piso ⇒ `transporte_vivo`
> en `in_app` es INERTE PARA ELEGIR** — gana solo por `COALESCE`, cuando ningún
> otro canal tiene tren.
>
> ### **Esto NO invalida la ley de secuencia: lo que protegía era LA PANTALLA, no la selección.**
> *El silencio que el founder vivió durante el gate —programó una cita y no le
> llegó nada— fue la ley funcionando.* **Y el flip no fue fallido: fue el acto
> que la ley pedía, sobre un mecanismo que resultó ser otro.**

---

## ⚖️ ENMIENDA FIRMADA (founder, EN DISPOSITIVO — S89, orden 7, sobre el bundle `019fd7ef`/`019fd7f0`) — **LA PATA PISA LA CAMPANA**

**La firma:** la huella va **SUPERPUESTA al glifo** (no al lado) y **apenas
más grande** («muy poco»). Las tres condiciones del punto 1 viajan intactas:
jamás un número · jamás rojo de alarma · jamás anima.

**La propuesta ejecutada por el riel (números en
`2026-08-06-s89b-ENMIENDA-pata-pisa-campana.md`):**

- **Escala: 12 → 14dp** — el tercer escalón del estudio 10/12/14 ya servido
  en galería (el ojo del founder lo vio; 13 sería un número sin gate).
- **Posición: `top:-1 / right:0`** (era `top:-3 / right:-5`) — la pata queda
  centrada en el HOMBRO derecho del domo, **~62% de su área sobre el bbox del
  glifo**, y **deja de asomar 5dp al gap de la esquina** (hallazgo lateral:
  esa tinta saliente era invisible para R32).
- **El solape es OCCLUSIÓN v1:** la pata opaca cubre el trazo donde pisa. El
  contraste medido DONDE PISA: oro/muro 3.41 (claro) · 5.95 (noche) alrededor;
  en los 2–3 cruces del trazo (1.9dp) con el borde de la pata, oro/trazo-papel
  **1.62** — borde blando LOCAL, cuantificado.
- **EL FOSO (propuesto, decide la mesa):** 2dp de recorte del trazo bajo la
  pata volvería toda frontera ≥3 (oro/muro 3.41 · muro/trazo 5.51) — pero
  exige integración misma-SVG (enmienda de `Icono`) para vivir también sobre
  el DEGRADADO del cliente, donde un foso pintado de un sólido remendaría.
  Si el ojo del founder pide más definición en el gate, ese es el camino.
- En superficie **clara** la pata es acento por casa: cliente pink/trazo
  tinta 4.63 ✓ · prestador tealDark/trazo tinta **2.86** — hoy sin montaje
  clara en el prestador (su campana vive en el muro); declarado, no curado.
