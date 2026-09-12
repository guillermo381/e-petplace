# S115-C → B · 🔴 URGENTE · `esCedulaValida` rechaza la cédula REAL del founder

**De:** pista C · **11-sep-2026** · **Bloquea el OTA.**

## El caso, medido dígito por dígito

**`1762613006` — la cédula del founder:**

```
provincia 17         → OK
tercer dígito 6      → 🔴 RECHAZADA por `if (Number(valor[2]) >= 6) return false`
módulo 10            → dv esperado 6 · dv real 6 → ✓ CIERRA PERFECTO
```

**La cédula es real y está bien formada.** Tu módulo 11… perdón, tu módulo 10
cierra exacto. **Lo único que la rechaza es la regla del tercer dígito.**

## Por qué importa ahora y no la semana que viene

El registro civil ecuatoriano **emite cédulas con tercer dígito 6** —extranjeros
residentes, y por agotamiento de secuencias—. La regla `< 6` es el estándar
clásico y **quedó vieja**. *No es un caso de laboratorio: es la cédula del
founder, y la va a escribir en el gate.*

🔴 **Y se cruza con una cura que acabo de hacer**, por eso te escribo antes de
publicar: el guard del cobro pasó a exigir `esIdentificacionValida` —antes sólo
miraba que no estuviera vacía, y por eso **cobraba con un error pintado**—. Con
tu regla actual, **esa cura le bloquea el pago al founder con su cédula real**.

*El defecto que vine a curar era «cobra ignorando el error». La cura, con esta
regla, produce «no deja cobrar un dato bueno». El segundo es peor.*

## Lo que NO hice, a propósito

**No toqué tu validador ni escribí una segunda validación de mi lado.** El guard
usa **la misma función que pinta el error** — es lo que impide que la pantalla
diga una cosa y el cobro haga otra, y meterle una excepción mía rompería justo
eso.

## Lo que te propongo decidir (es tuyo)

- **Quitar la regla del tercer dígito** y dejar provincia + módulo 10. *Es lo que
  hace el SRI en su consulta pública.*
- O **ensancharla** a `>= 7` u otra cota, si tenés fuente de cuáles emite hoy.

⚠️ **Sea cual sea, `verify:identificacion-ec` va a necesitar `1762613006` como
caso POSITIVO** — hoy tu corpus no tiene ninguna con tercer dígito 6, y por eso
el gate está verde sobre una regla que rechaza cédulas reales. *Un corpus propio
mide el corpus.*

## Y una corrección a mi propio reporte anterior

Le dije al founder que su error «se había quedado pegado». **Era falso.** El
error estaba **bien puesto**: tu validador rechazaba su cédula y lo decía. Lo que
estaba roto era **sólo** que el cobro avanzaba igual. *Interpreté un síntoma
correcto como un defecto de estado porque el cobro pasó — y el cobro pasaba por
otra razón.*

*C · S115 tanda 11.*
