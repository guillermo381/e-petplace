# S86-A · FIXTURE de `scripts/verify-ota.mjs` — el rojo producido ANTES (L-199)

> **Ancla:** `18cc659` · corrido 2026-08-04 -05 desde `pista/s86-a`.
> **L-191 declarada:** los exit codes de abajo se leyeron **del comando**,
> no de un pipe. *La primera corrida de este mismo fixture leyó `$?`
> después de un `| tail` y devolvió `EXIT=0` sobre una salida que decía
> «EN ROJO» — el guard estaba bien y la medición mentía.* Queda escrito
> porque es exactamente la lección que la casa ya tenía y volví a pisar.

---

## ② ROJO PRODUCIDO — runtime que ningún binario tiene

```
$ node scripts/verify-ota.mjs --app prestador --runtime 9.9.9 \
      --update 019fcda7-30a5-7ceb-857f-193354b576ec
✗ verify-ota EN ROJO (2) — NO SE DISTRIBUYE:
   · el servidor NO sirve NINGÚN update para runtime 9.9.9 (HTTP 204).
     Un aparato con ese runtime se queda con su bundle embebido.
   · NINGÚN BINARIO TIENE EL RUNTIME 9.9.9 en el canal preview.
     Builds finished vivas: 1.0.0, 1.0.1, 1.0.2, 1.0.3
     Es un OTA perfecto que no le llega a nadie.
EXIT = 1
```

**Es el caso de la letra, reproducido:** *un OTA contra un runtime que
ningún aparato tiene no puede salir en silencio.*

## ① ROJO PRODUCIDO — el canal sirve otra cosa

```
$ node scripts/verify-ota.mjs --app prestador \
      --update 00000000-0000-0000-0000-000000000000 --sin-builds
✗ verify-ota EN ROJO (1) — NO SE DISTRIBUYE:
   · EL CANAL SIRVE OTRA COSA.
     publicado : 00000000-0000-0000-0000-000000000000
     se sirve  : 019fcda7-30a5-7ceb-857f-193354b576ec
     El aparato va a recibir el segundo, no el tuyo.
EXIT = 1
```

**No solo dice que difiere: dice QUÉ va a recibir el aparato.** Un guard
que solo dijera «no coincide» dejaría el trabajo de diagnóstico afuera —
y ese trabajo es el que costó la mañana del 4-ago.

## ✓ EL CASO REAL — verde, con su aviso

```
$ node scripts/verify-ota.mjs --app prestador \
      --update 019fcda7-30a5-7ceb-857f-193354b576ec
✓ ① el servidor sirve 019fcda7-… — es el publicado
✓ ② existe build finished para 1.0.3 (c2483ed7, 2026-08-04)
⚠️  ③ RUNTIMES HUÉRFANOS (3) — esto AVISA, no frena:
     · runtime 1.0.0 · hoy se le sirve: (nada — bundle embebido)
     · runtime 1.0.1 · hoy se le sirve: 019f678a-…
     · runtime 1.0.2 · hoy se le sirve: 019fa1a1-…
     Callarlo es lo que hizo creíble el diagnóstico equivocado del 4-ago.
✓ verify-ota VERDE — el aparato que exista va a recibir este update.
EXIT = 0
```

---

## Lo que el aviso ③ destapó, y no estaba buscado

**Hay CUATRO runtimes con binario instalable en el canal `preview` del
prestador** — `1.0.0`, `1.0.1`, `1.0.2`, `1.0.3` — y cada uno recibe
algo distinto:

| runtime | qué se le sirve hoy |
|---|---|
| 1.0.0 | **nada** — se queda con su bundle embebido |
| 1.0.1 | `019f678a-…` |
| **1.0.2** | **`019fa1a1-…` — el update de S78, 26-jul** |
| 1.0.3 | `019fcda7-…` (el de hoy) |

> **Ese `1.0.2` es la razón por la que la hipótesis equivocada del 4-ago
> sonaba tan bien.** «Si su APK fuera 1.0.2 no le llegaría» era cierto
> **y comprobable**, y nadie tenía a mano que además le llegaría algo
> **de hace nueve días**. El aviso pone ese dato en pantalla en cada
> publish, que es donde sirve.

*Depositado por A, S86.*
