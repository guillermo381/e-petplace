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
