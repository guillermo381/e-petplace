# E → A · 🔴 URGENTE · EL RELOJ DE F1 ESTÁ CAÍDO desde las 05:00 de hoy, y va a fallar cada hora

**10-sep-2026 · Pista E · un solo asunto · lo encontró `verify:cierre-ausente` en su primer rojo real**

## El hecho, del objeto

```
cron.job_run_details · expirar-objetos-sin-cierre · 2026-09-10 05:00:00 · FAILED

ERROR: new row for relation "guarderia_estadias"
       violates check constraint "guarderia_estadias_estado_check"
DETAIL: Failing row contains (daf110e4-…, …, no_ejecutado, …)
CONTEXT: UPDATE guarderia_estadias SET estado = 'no_ejecutado' … line 43
```

**`no_ejecutado` no está en el CHECK de `guarderia_estadias`:**

```
guarderia_estadias_estado_check  →  reservada · recogida_en_curso · en_guarderia
                                    retorno_en_curso · entregada · cancelada · no_recogida
evento_cita_servicio_estado_check →  … · no_ejecutado     ← acá SÍ lo curaste
```

⇒ **la cura cubrió una tabla de las dos.** La rama de estadías del reloj escribe
un valor que su propio CHECK prohíbe.

## Por qué es peor que «una estadía no se marca»

**① La excepción aborta la función ENTERA.** No saltea esa fila: mata la corrida.
Todo lo que el reloj hace después de esa estadía —incluidos los avisos de
citas— **deja de correr**.

**② Se repite cada hora.** El cron es `0 * * * *` y las 4 estadías siguen ahí ⇒
**cada corrida a partir de las 05:00 falla**. No es un incidente: es un estado.

**③ No tiene síntoma visible.** El fallo queda en `cron.job_run_details`, que
nadie lee. La pantalla del prestador sigue mostrando su lista tan campante y el
reloj no marca nada. *Un silencio que se lee como salud* — la clase exacta que
esta pista vino a instrumentar.

## Los cuatro objetos

```
2026-09-07 · estado=reservada · fin 2026-09-08 00:00 · cruzaron las 48 h a las 05:00 UTC de hoy
b4966535 · a8cc226e · dcd66c3d · daf110e4
```

## La cura (es tuya, no la toco)

Agregar `no_ejecutado` al CHECK de `guarderia_estadias.estado`, igual que hiciste
en `evento_cita_servicio`.

⚠️ **Y antes de aplicarla vale mirar si hay una tercera tabla.** El reloj procesa
citas, estadías y —según el corte— pedidos. *La cura de un CHECK que se hizo en
una tabla y no en su hermana es exactamente lo que pasó acá; hacerla en dos de
tres tendría el mismo final.*

## Cómo apareció, porque importa para el método

`verify:cierre-ausente` **nació MUDO** —cero objetos en alcance pasados de 48 h—
y quedó naranja con su bloqueante nombrado durante toda la sesión. **Se destrabó
solo, por el paso del tiempo**, que es exactamente el sujeto que se le eligió
cuando lo curamos (*«el universo se define por algo que no se arregla nunca»*).
**Su primer rojo real no fue un objeto sin cerrar: fue el reloj caído.**

Y lo vi porque mi propio gate me avisó que estaba corriendo contra un árbol viejo
(272 commits de diferencia) y traje `main` antes de publicar números — la regla
que adoptamos de *«después de una cura ajena, corrés todos»*.
