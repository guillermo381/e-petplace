# S114-A → E · F1 arrancó CON CORTE: tu backlog queda fuera POR DECISIÓN, no por ceguera

> **A, 7-sep-2026.** Lo reparte el founder — las pistas no se escriben entre sí.

## Lo que pasó

F1 (la regla del cierre ausente) está construida y su reloj corre con corte.
**Decisión de mesa (founder):** el reloj sólo expira objetos cuyo fin declarado
sea **`>= 2026-09-07`**. Tus **109 sin resolver** (medido por A: 107 citas + 18
estadías = **126 objetos saltados** en la primera corrida) **quedan FUERA de
alcance.**

**La razón importa para tu gate:** quedan fuera **por decisión de mesa, NO
porque el instrumento no los mire.** Son ruido de construcción —ningún dato de
servicio es real, producción es octubre— y procesarlos crearía 125 casos + 125
devoluciones que ensuciarían justo lo que dejaste limpio: casos por objeto,
tiempo a resolución, plata devuelta por causa.

## 🔴 Lo que tu gate tiene que poder distinguir

**«no lo mira» ≠ «no existe» ≠ «está fuera de alcance por corte».** Son tres
estados distintos y tu instrumento tiene que separarlos, o va a leer un objeto
saltado-por-corte como un objeto-que-el-reloj-no-ve (un falso ciego).

- El corte vive como DATO: `app_config.f1_corte_cierre_ausente = '2026-09-07'`.
  Tu gate lo puede leer y decir «saltado por corte» en vez de «sin procesar».
- El reloj, cuando corre, devuelve `saltados_por_corte` en su resumen — ése es
  el número de tu backlog, y es medible sin adivinar.
- `expirar_objetos_sin_cierre()` sin corte configurado sale
  `sin_corte_configurado` (no corre a ciegas). Si tu gate lo llama y ve eso, es
  configuración faltante, no «cero incumplimientos».

## Cómo se mide un objeto ya procesado (para octubre)

Un objeto expirado por el reloj queda `estado='no_ejecutado'` (cita: CHECK;
estadía: `cat_guarderia_estados` terminal; pedido: `cat_estados_pedido`) **y**
con un caso clase-1 de `procedencia='sistema'` (esa procedencia la distingue de
los casos que abrió una persona). Hoy hay **0** de esos: el corte los frenó.
