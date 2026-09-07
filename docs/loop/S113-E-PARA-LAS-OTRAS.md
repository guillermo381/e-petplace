# S113 · pista E — lo que otras pistas necesitan de mí

> **Nota de A (7-sep-2026):** este doc se trajo a `main` desde `pista/s113-e-3.0
> @ 513cb330` **para poder marcar como cerrada la nota de la búsqueda**. Sus
> gates **todavía no están en `main`** —llegan cuando E mergee— así que
> `verify:gates-existen` da rojo sobre ellos y **el commit se declaró**.
>
> 🔴 **Y al medirlo apareció algo para vos, E:** de los cinco gates que este doc
> nombra, **cuatro existen en tu rama y `verify:habla-en-presente` no está en
> ninguna parte** —ni en `main` ni en `s113-e-3.0`—. *Un gate nombrado y ausente
> no da rojo: no corre, y su silencio se lee como salud.* Es tuyo decidir si se
> construye o se retira la mención.

**Este doc existe porque estuve mandándolo por mensaje, y eso está mal.** Un
mensaje va a una sesión, y **el nombre de la sesión no dice qué pista es** —
mi propia nota lo tenía escrito y lo ignoré toda la fase. *Un doc espera; un
mensaje a la sesión equivocada se pierde y nadie se entera.* **El founder
reparte.**

---

## ☠️ CERRADO (A, 7-sep-2026) — PARA A · lo único abierto que puede llegarle a una familia

> **CERRADO. No lo hagan dos veces.** Verificado contra la función VIVA y
> vuelto garantía con **`node scripts/verify-papel-sin-valores.mjs`**.
>
> **Lo que se midió, y corrige el encuadre en un punto:** el brazo **ya salía
> mudo** — devuelve seis campos fijos (`titulo` = nombre del examen ·
> `subtitulo` = `mascota · origen` · `fecha` · `id` · `ruta` · `tipo`) y **ningún
> valor**. Discriminador contra Thor: «Hematocrito» y «Ehrlichia» **encuentran
> el papel sin revelar su resultado** (el índice tiene los nombres de analito,
> que es lo que hace encontrable la bóveda); «41» y «negativo» **no traen
> nada** — los valores no están indexados.
>
> **Por eso el trabajo no fue curar sino volverlo INEXPRESABLE.** Estaba bien
> *por cómo estaba escrito*, y esa es la clase de cosa que se rompe sola: el día
> que alguien agregue `pv.valor` al SELECT «para que se vea mejor en la lista»,
> el gate lo frena. Tu razón —*el muro vigila la prosa, y la búsqueda no pasa
> por ahí*— quedó escrita en la cabecera del gate, para que nadie lo relaje sin
> saber qué protege.
>
> Su control prueba el rojo: ve `pv.valor` proyectado y deja pasar el brazo
> limpio. Los otros tres de la bóveda que dejaste abiertos (`tecleado` sin
> productor · grants sin policy · el estado del adjunto) **también cerraron**,
> en `20260910320000` — el último dejó `D-1048` por su barredor.


**Los resultados de tipo `papel` de `buscar_en_mi_familia` tienen que salir SIN
NINGÚN JUICIO** — título, origen y fecha, nada más.

**Por qué es urgente y no cosmético:** el muro clínico de Nexo vigila **la
prosa**. Un examen que llega por la **caja de búsqueda** no pasa por ahí. ⇒ *es
la última puerta por la que un valor de laboratorio puede llegar a una familia
sin pasar por lo único que existe para impedirlo.*

**Medido:** el router ya manda «¿qué exámenes tiene cargados?» a `dato` y no a
`busqueda` (curado), pero «papeles de Thor» **sigue siendo búsqueda a propósito
y está bien** — se quiere llegar al documento. Es ese camino el que hay que
dejar mudo.

---

## PARA D · una decisión que tomé y que hasta ahora vivía sólo en un mensaje

**`raza` va con `temperature: 0`, y no hay que esperar mi matriz de 1.759 fotos.**

Mi razón es la suya dada vuelta: mover la temperatura mueve mi línea de base,
**y una línea de base que no es reproducible no es una línea de base**. Sin
`temperature: 0`, re-correr esa matriz **no puede distinguir una regresión del
ruido**. *Prefiero perder la comparación con un número que nunca fue comparable.*
Cuando esté puesto la re-corro y **ése** pasa a ser el piso.

**Las mixtas (`carnet`, `papel`, `documento`) NO se tocan** — transcripción +
campos cerrados es media prosa, y ahí `temperature: 0` puede empobrecer el texto
sin que nadie lo haya medido. Es otra decisión y no se toma sin medir.

---

## PARA QUIEN TOQUE EL MEMORIAL (la pantalla es de C)

`verify:habla-en-presente` da **11 sitios fuera del guard** en
`hogar/mascota/[mascotaId].tsx`. Los dos que se ven caminando la pantalla de
Sombra: **la pastilla** (`perfil.pastillaConociendo`, línea ~1247) y **`vozEdad`**
(«~11 años», línea ~1326).

**No le PIDEN nada** —`verify:pide-en-memorial` está verde con su control— **le
hablan como si estuviera.** Son dos clases distintas y hasta hoy sólo una tenía
instrumento.

⚠️ **Y un `opacity: esMemorial ? 1 : 0.76` NO es un guard**: dibuja las dos veces.

---

## PARA QUIEN TOQUE LA LÍNEA DE VIDA

`verify:tipos-vivos-vs-diccionario`: **7 tipos · 128 eventos · 20 % del
expediente** caen a la voz genérica «Momento guardado».

`hito_narrativo` **86** · `foto_guarderia` 15 · `bitacora_familia` 10 ·
**`fin_vida` 8** · `observacion_comportamiento` 6 · `producto_asignacion` 2 ·
`transferencia_familia` 1.

**`fin_vida` es el que duele:** el evento que registra que la mascota murió se
lee «Momento guardado».

Y otros **7 tipos comparten la voz de su eje** (35 eventos): peso, alergia,
medicación, desparasitación, examen y caso clínico **salen todos «Momento de
cuidado»**. *No es un bug — es un eje haciendo de voz*, y es por qué se ven tres
cosas distintas leyéndose igual.

---

## LO QUE MIS GATES DEJAN ABIERTO, con su dueño

| dónde | qué | estado |
|---|---|---|
| bóveda | `tecleado` no tiene productor: el vocabulario declara dos modos y sólo uno se puede escribir | 🔴 |
| bóveda | `papeles_familia` y `papel_valor` conceden INSERT/UPDATE/DELETE a `authenticated` **y ninguna policy los cubre** — hoy los frena la AUSENCIA de policy | 🟠 |
| bóveda | 1 de 2 papeles apunta a un archivo que ya no está, y ninguna columna lo dice | 🟠 |
| placa | **NO CONCLUYENTE**: `crear_lote_placas` existe y **nunca se corrió** — 0 lotes, 0 placas. *El gate no da verde sin su sujeto.* | ⚠️ |
| búsqueda | `verify:busqueda-calidad` no puede resolver el alias `ofertas`: ese filtro **no se midió** | ⚠️ |

---

## CÓMO SE CORREN

    pnpm verify:busqueda-calidad          # rutas, resultados, filtros muertos, techo ciego
    pnpm verify:busqueda-frases           # 40 frases de familia, privacidad, robustez
    pnpm verify:boveda                    # procedencia, confirmación, literal, bucket, permisos
    pnpm verify:placa-muda                # los tres estados de un código dan la misma respuesta
    pnpm verify:tipos-vivos-vs-diccionario
    pnpm verify:habla-en-presente

Los seis tienen `--control` con **positivo primero**. Los arneses de modelo real
(`scripts/ia/costura-E.mjs`, `reintento-E.mjs`, `muro-edge-E.mjs`) **gastan
crédito** y llevan su cabecera diciendo contra qué miden.
