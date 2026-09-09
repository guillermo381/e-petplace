# S114-A · CENSO · definición VIVA vs definición del REPO (postventa + saldo)

> **A, 7-sep-2026 ~22:15 Guayaquil. Medición, disparada por el parte de C
> `S114-C-PARA-A-EL-SALDO-NO-REBOTA.md`.**

## ① La función que C marcó: viva == repo, sin divergencia

`caso_elegir_destino` viva (`pg_get_functiondef`) es **byte-equivalente** a la
migración `20260911670000` (A4), tras normalizar casts y espacios. Tiene el
chequeo del resultado de `acreditar_saldo_hogar`. **No hay una versión aplicada
a mano ni un misterio.**

## ② Por qué C vio lo que vio — y NO es viva≠repo

**Es `L-515` (repo desactualizado entre pistas), medido:**

- C midió contra `main + pista/s114-a @ 69065369` — **ANTES de que yo aplicara
  A4 (`670000`, `680000`…)**. En ese punto el repo de C tenía la migración
  `610000` (A3), cuyo guard **rebota** con `saldo_todavia_no_existe`.
- C razonó desde **una premisa vencida** —«el motor de saldo es A4 y todavía no
  existe»— y **sin credencial para leer la DB** (lo dice en su parte).
- La conclusión «no acredita, no hay cuenta» era **falsa**: A4 ya estaba
  aplicada, y el caso de C **acreditó de verdad**.

**Medido HOY sobre el caso exacto de C** (`2c9c3fe9`, familia `ce057f90`):

| | |
|---|---|
| saldo de la familia | **$4,50** |
| movimientos del caso | **1 · monto 4,50** |
| hilo | «Recibimos tu caso» → «Se resolvió: hay una devolución» → «Elegiste saldo. Ya está disponible» |

La pantalla que C vio (**«Ya está disponible»**) era **correcta**: el saldo
estaba disponible. Lo que C no pudo ver es que la fila existía.

## ③ EL CENSO COMPLETO — viva vs repo, 32 funciones

`scripts/s114/censo-viva-vs-repo.sql` + comparación por firma semántica de cada
función de caso/saldo/devengo/motivo contra la última migración que la define.

**RESUMEN · 32 funciones · IGUAL 32 · DIFIERE 0 · SIN_REPO 0.**

🔴 **Control positivo (el cero vale porque el instrumento SÍ detecta):**
- `caso_resolver.viva` vs `leer_caso.repo` (funciones distintas) → **DIFIERE** ✅
- `acreditar` con un `RETURN` extra en el repo → **DIFIERE** ✅
- una función contra su propio repo → **IGUAL** ✅ (no da falso rojo)

⚠️ **Límite honesto del censo:** compara por FIRMA ESTRUCTURAL (secuencia de
`return`/`raise`/`perform`/`if`/llamadas). Una divergencia **sólo-de-valor**
—mismo esqueleto, un literal o un monto cambiado— **no la vería.** Para la
función que C marcó lo cerré con una comparación completa normalizada (byte-
equivalente); para las otras 31, el censo garantiza igualdad estructural, no de
cada literal. **El gate de ⑤ debe ser más fuerte** (diff sobre copia aislada).

## ④ La contradicción entre adendas, y cómo se resuelve

**La adenda 13 me pidió A4 (enchufar el saldo: acreditar de verdad). Esta adenda
④ pide que el saldo REBOTE.** Son incompatibles, y la resolución es la más nueva
y firmada:

> **El saldo NO debe rebotar. `LETRA_POSTVENTA` §7 dice que el saldo e-PetPlace
> nace en V1, y la adenda 13 pidió construirlo. Hacerlo rebotar sería DESHACER
> A4.** C pidió el rebote porque creía que A4 no existía; existe.

Verificado por el camino real con el asiento de casa
(`verify-arco-caso-completo.mjs`, 7/7): familia abre → casa resuelve → familia
elige saldo → **se acredita**. No rebota, y es lo correcto.

*Se declara la contradicción en vez de resolverla en silencio: dos instrucciones
que se contradicen son peores que una equivocada.*

## No hay migración

Nada está roto. El saldo funciona, ninguna función diverge del repo. Este es un
reporte de medición.
