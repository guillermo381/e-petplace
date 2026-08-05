# LÁMINA — PREFERENCIAS DE NOTIFICACIONES

> **✅ FIRMADA POR EL FOUNDER — 5 de agosto de 2026.**
> Superficie de `MODELO_NOTIFICACIONES` **§6** (el consentimiento) sobre el
> contrato curado en S87 (Lote 1, pieza ③).
> **La ley de la casa exige lámina en `docs/laminas/` ANTES de la pantalla** —
> por eso se deposita ahora, con el motor listo y la superficie sin construir.
> Se construye en el **Lote 4**.

---

## 0. Qué resuelve, y contra qué se construye

La pantalla dice, en voz humana, **qué avisos existen y por dónde llegan**.
El motor ya sabe la verdad: `cat_notificacion_categorias` (7 filas) ×
`cat_notificacion_canales` (4). **La pantalla no inventa vocabulario: lo lee.**

> ### La ley que gobierna toda esta lámina, firmada por el founder (S87):
> ## **«Elige por dónde le llegan, no si le llegan.»**

Y su mitad mecánica, que ya vive en el motor: un trigger rebota
`categoria_no_apagable` si alguien intenta apagar el **piso** (`in_app`) de una
categoría no apagable. **La superficie no dibuja ese toggle — pero el motor no
depende de que la superficie se porte bien.** *Una autorización que decide el
cliente es decorativa* (la lección de D-654).

---

## 1. Las SIETE filas, en voz humana

| fila (lo que se lee) | categoría | nace |
|---|---|---|
| **Tus citas y servicios** | `operacion` | **activa** |
| **Cuidado y salud** | `salud_seguridad` | **SIEMPRE LLEGA** |
| **La seguridad de tu cuenta** | `seguridad_cuenta` | **SIEMPRE LLEGA** |
| **Lo que ya pagaste** | `saldo_pagado` | **SIEMPRE LLEGA** |
| **Mensajes y respuestas** | `relacional` | **activa** |
| **Resúmenes** | `resumen` | opt-in (apagada) |
| **Novedades y ofertas** | `comercial` | **opt-in (apagada)** — letra firmada |

**El orden es el del catálogo (`orden`), no el de esta tabla al azar:** lo que
no se puede apagar va arriba, porque es lo que la persona menos elige y más
necesita entender.

---

## 2. LAS DOS ANATOMÍAS — y la diferencia es la ley, no el estilo

### (a) Fila APAGABLE — `operacion` · `relacional` · `resumen` · `comercial`

```
┌──────────────────────────────────────────────┐
│  Tus citas y servicios          [ interruptor ]│
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐│
│  │ En la  │ │  Push  │ │ Correo │ │ WhatsApp ││   ← chips de canal
│  │  app   │ │        │ │        │ │          ││
│  └────────┘ └────────┘ └────────┘ └──────────┘│
└──────────────────────────────────────────────┘
```

Interruptor de **existencia** + chips de **canal**. Apagar el interruptor apaga
la fila entera.

### (b) Fila NO APAGABLE — `salud_seguridad` · `seguridad_cuenta` · `saldo_pagado`

```
┌──────────────────────────────────────────────┐
│  Cuidado y salud                              │   ← SIN interruptor
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐│
│  │ En la  │ │  Push  │ │ Correo │ │ WhatsApp ││
│  │  app ✓ │ │        │ │        │ │          ││   ← «En la app» es el PISO
│  └────────┘ └────────┘ └────────┘ └──────────┘│
│  Estos avisos siempre llegan. Elegís por       │   ← LA VOZ DEL PORQUÉ
│  dónde, no si te llegan.                       │
└──────────────────────────────────────────────┘
```

**No hay interruptor de existencia. Hay chips y hay una voz que dice por qué.**
Ley 23: *la puerta no ofrece lo que va a rechazar* — un toggle que el motor va
a rebotar no se dibuja.

---

## 3. Las tres voces del porqué — FIRMADAS (es + en)

| categoría | es | en |
|---|---|---|
| `salud_seguridad` | «Estos avisos siempre llegan. Elegís por dónde, no si te llegan.» | "These always reach you. You choose how, not whether." |
| `seguridad_cuenta` | «Los avisos de tu cuenta siempre llegan. Elegís por dónde.» | "Account alerts always reach you. You choose how." |
| `saldo_pagado` | «Si algo que ya pagaste está por vencer, te avisamos siempre.» | "If something you already paid for is about to expire, we always tell you." |

**Candidatas al censo de voz (L-156). Las keys nacen con la pantalla, no acá.**

---

## 4. El momento del opt-in de WhatsApp — y por qué es un momento y no un toggle

**El primer toque al chip de WhatsApp NO enciende el canal: abre el
consentimiento.** Y **el texto exacto que se le mostró SE GUARDA como
evidencia** — requisito de Meta, no gusto nuestro (§6).

> **El motor ya lo exige:** encender un canal con `exige_evidencia = true` sin
> `evidencia` **rebota `opt_in_sin_evidencia`**. La pantalla no puede saltearlo
> ni por error.

**Borrador del texto, a la firma:**

- **es** — «Quiero recibir avisos de e-PetPlace por WhatsApp en este número. Puedo desactivarlo cuando quiera desde Preferencias.»
- **en** — "I want to receive e-PetPlace updates on WhatsApp at this number. I can turn this off anytime in Preferences."

*Se guarda ese literal, la fecha y el método. Si el texto cambia, cambia la
evidencia futura — la vieja se conserva como fue mostrada.*

---

## 5. El permiso del SO negado — null honesto, jamás toggle muerto

Si la persona **negó el permiso de notificaciones del sistema**, los chips de
**Push** lo dicen con voz honesta y **no fingen estar encendidos**.

> **§7 lo pide explícito:** *si el usuario negó el permiso del SO, el motor
> tiene que saberlo y no contarlo como entregado (null honesto, L-139).*
> Un chip de Push que se ve activo sobre un permiso negado es la superficie
> mintiendo sobre algo que puede medir.

---

## 6. Reglas de construcción (para el Lote 4)

- **`SelectorOpcion` con `disposicion='grilla'`** para los chips de canal:
  **envuelve, no trunca.** Cuatro canales no entran en una tira en un teléfono
  angosto, y truncar «WhatsApp» es exactamente el defecto de D-576.
- **El escalado de fuente del sistema NO se apaga.** Accesibilidad.
- **Los bordes +6/+5px se verifican en pantalla real en el gate** (L-143: las
  leyes se firman sobre píxeles, no sobre prosa).
- La pantalla **lee** las 7 filas y los 4 canales **del catálogo**. Hardcodear
  la lista la desincroniza del motor el día que nazca una categoría.

---

## 7. Lo que MUERE con esta pantalla

> **La promesa «Cuando las notificaciones lleguen al teléfono…»** —hoy viva en
> `cuenta/preferencias` del cliente y en `miCuenta` del prestador— **muere en el
> lote que encienda el primer canal.** *Una superficie que promete un futuro deja
> de ser honesta el día que ese futuro llega y ella sigue diciendo lo mismo.*

---

## 8. Estado del motor debajo (medido al firmar esta lámina)

| | |
|---|---|
| categorías | **7** |
| canales | **4** (`in_app` piso · `push` · `email` · `whatsapp` con evidencia) |
| el default lo dice | **la categoría**, no una constante |
| `comercial` nace | **apagada**, en todos los canales |
| WhatsApp nace | **apagado**, en toda categoría |
| el apagado de existencia de una no-apagable | **rebota en el motor** |

**La pantalla no tiene que defender ninguna de estas reglas: ya están abajo.**
Su trabajo es *decirlas bien*.
