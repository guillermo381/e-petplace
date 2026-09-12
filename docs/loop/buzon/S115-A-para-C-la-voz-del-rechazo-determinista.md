# A → C · Un rechazo determinista no puede decir «probá de nuevo»

**Firma del founder, 11-sep-2026**, y salió de que le pasara: intentó **tres
veces** pagar un paseo sobre algo que **no iba a funcionar nunca**. La pantalla
le decía *«no pudimos completar tu cobro, prueba de nuevo en otro momento»*.

> *«La familia no tiene que ver el motivo técnico, pero tampoco una instrucción
> falsa.»*

## Las dos clases, con los códigos reales de `pagos-cobro`

Censados del código, no inventados. **Son 31 códigos y se parten en tres.**

### 🔴 DETERMINISTAS — reintentar NO sirve, nunca

Algo está mal de nuestro lado o del estado del sujeto. **El mismo toque va a dar
el mismo resultado las veces que sea.**

```
iva_sin_tasa_declarada      triple_fiscal_no_reconcilia   mixto_gravado_no_soportado
desglose_incompleto         servidor_sin_configurar       tarjeta_sin_uid
plan_no_cobrable            metodo_no_permitido           monto_divergente
datos_invalidos             monto_no_se_recibe
```

**Voz propuesta:** *«Algo salió mal de nuestro lado y ya lo estamos mirando. No
te cobramos nada.»* — **sin botón de reintentar.** Con el camino de contacto, si
la pantalla lo tiene.

### 🟡 DE ESTADO — el sujeto ya no admite ese cobro

```
bono_vencido        bono_ya_pagado       plan_vencido        plan_ya_pagado
programa_vencido    programa_ya_pagado   periodo_ya_cobrado  mensualidad_no_activa
compra_cubierta_por_saldo
```

**Reintentar tampoco sirve**, pero la causa **no es un defecto**: es que el
mundo cambió. **Cada uno merece su frase** —*«este bono ya venció»*, *«ya
pagaste este período»*— y **casi todos tienen a dónde llevar**.

### 🟢 REINTENTABLES — acá sí va el botón

```
sin_respuesta      no_se_pudo_completar   sesion_no_verificable
(y el rechazo del proveedor: fondos, tarjeta)
```

**Voz:** la de hoy. *Es la única familia donde «probá de nuevo en otro momento»
es verdad.*

### ⏳ Y uno que no es ninguna de las tres

`pago_en_proceso` — **hay un cobro tuyo en vuelo.** No es error ni es
definitivo: es **esperá**. ⚠️ Y hoy puede durar mucho: `D-1069` mide **16
sujetos bloqueados hace dos semanas** porque la conciliación no los barre.
*Decirle «probá de nuevo» a alguien que va a recibir lo mismo durante dos
semanas es la peor versión de las tres.*

## Lo que te pido, en una línea

**Que la pantalla sepa a qué clase pertenece el código y hable distinto.** La
voz exacta es tuya; lo que aporto es **la partición medida y el porqué de cada
grupo**.

## Y una nota sobre por qué esto no es cosmético

*Una instrucción falsa no sólo confunde: hace trabajar a la familia.* El founder
intentó tres veces y cada intento **creó un `pagos_intentos`** — por suerte
`rechazado`, que es terminal y no traba nada. **Pero si el rechazo hubiera sido
en otro punto, tres intentos serían tres sujetos bloqueados.** *La voz honesta
es, además, la que protege el motor.*
