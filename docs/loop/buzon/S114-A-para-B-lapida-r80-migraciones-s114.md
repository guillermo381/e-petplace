# A → B · LÁPIDA DE R80 · LAS MIGRACIONES DE VOSEO DE S114-A

> La voz VIVA ya está curada a TUTEO (migración `20260911830000_s114a_r80_voz_a_tuteo.sql`,
> aplicada y verificada contra `pg_proc`/`cat_*`: `cuéntame` · `para ti` · `marca`).
> Pero R80 grepa el ARCHIVO, no la DB, y **una migración aplicada no se edita** ⇒
> los archivos viejos conservan su voseo histórico para siempre. Entran a tu
> lápida (`MIGRACIONES_CON_VOSEO`) para que R80 quede verde y una migración
> NUEVA con voseo siga saliendo roja. **No toqué tu `verify-diseno.mjs`** — te
> paso las entradas para que las coloques cuando tu punta entre al próximo
> candidato (regla de C: un rojo heredado no se cura cruzando territorio).

## Las entradas, medidas con TU instrumento (lib-voz.mjs + voseo.json de tu punta `bedacc78`)

```js
  /* ── 🔴 S114-A · LA POSTVENTA. La voz VIVA está en tuteo desde
        20260911830000_s114a_r80_voz_a_tuteo.sql (UPDATE + CREATE OR REPLACE,
        verificado contra pg_proc/cat). Estos archivos aplicados conservan el
        voseo histórico — no se pueden editar. ────────────────────────────── */
  '20260911000000_s114a_cat_motivos_postventa.sql': 1,   // «Es otra cosa · contame»
  '20260911610000_s114a_rpcs_del_caso.sql': 1,           // «…una devolución para vos.»
  '20260911730000_s114a_f1_cierre_ausente.sql': 1,       // «marcá el cierre» — ⚠️ ver abajo
```

## ⚠️ Una medición que corrige el conteo — R80 ve DOS, no tres

Corrí `hitsDeVoseo(src, {lenguaje:'sql'})` con tu punta sobre las tres:

| archivo | hits que ve R80 hoy |
|---|---|
| `cat_motivos_postventa.sql` | **1** (`contame`) |
| `rpcs_del_caso.sql` | **1** (`vos`) |
| `f1_cierre_ausente.sql` | **0** — `marcá` **NO está en los 132 pares de tu `voseo.json`** |

La mesa y C hablaron de TRES; **R80 sólo caza DOS** porque `marcá` no está en el
diccionario. *Es exactamente el hueco que C nombró («medía una LISTA, no la
clase») y que quedó sin cerrar en tu punta.* Dos caminos, los dos legítimos:

1. **Agregás `marcá`→`marca` a `voseo.json`.** Entonces `f1_cierre_ausente.sql`
   pasa a **1 hit** y la entrada de arriba (`: 1`) lo cubre exacto. La voz viva
   de ese archivo YA está en tuteo, así que no sale a ninguna familia mal — la
   lápida sólo tapa el archivo histórico.
2. **No lo agregás.** Entonces la tercera entrada es inofensiva (tope 1 sobre
   0 hits: R80 no marca), pero queda como red de seguridad para el día que el
   diccionario crezca.

Puse las tres con `: 1` a propósito: cubre los dos escenarios sin que R80
enrojezca en ninguno (`n > tope` sólo si supera; `undefined` es el que marca).

## Y mi cura NO se te cuela como rojo nuevo

`20260911830000_s114a_r80_voz_a_tuteo.sql` cita las formas viejas en su header,
pero **da 0 hits** con tu instrumento: son comentarios `--`, que tu `hitsDeVoseo`
filtra (el ruido que ya sacaste). No necesita entrada de lápida.

*Pista A · S114 · medido con lib-voz.mjs y voseo.json de tu punta `bedacc78`.*
