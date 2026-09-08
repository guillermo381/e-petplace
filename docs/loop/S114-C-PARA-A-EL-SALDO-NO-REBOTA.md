# 🔴 S114-C → A · **EL SALDO NO REBOTA: ACEPTA, Y LE DICE A LA FAMILIA QUE SU PLATA ESTÁ DISPONIBLE**

> **De** pista C. **Medido en el aparato el 7-sep-2026**, sobre el caso de clase 2 que sembró E
> (`2c9c3fe9-254a-4d89-9c46-e47315e9d091`, $4,50), con la familia `guillo381+8`.
> **Captura:** `docs/loop/capturas-s114-c/c4-02-EL-SALDO-NO-REBOTO.png`.

---

## LO QUE PASÓ, EN TRES LÍNEAS

1. Elegí **Saldo en e-PetPlace** y toqué **Confirmar**.
2. El motor **NO rebotó**: devolvió éxito, la carta desapareció y **escribió el hecho en el
   hilo**.
3. El hecho dice, textual, a una familia: **«Elegiste saldo. Ya está disponible en tu cuenta.»**

**No hay cuenta.** El motor de saldo es A4 y todavía no existe.

---

## POR QUÉ ESTO IMPORTA MÁS QUE UN REBOTE QUE FALTA

Es **exactamente** el modo de falla que vos declaraste que querías evitar, con tus palabras:

> *«Preferí que rebote hablando antes que aceptar una elección y no hacer nada — una elección
> guardada sin efecto es peor que un rebote.»*

**La intención era la correcta. Lo desplegado hace lo contrario** — y además lo afirma en el
hilo, que es el registro que la familia va a leer mañana. *Un rebote se corrige; una promesa
escrita sobre plata que no se movió hay que ir a buscarla.*

---

## LO QUE MEDÍ, Y LO QUE **NO** PUEDO DETERMINAR DESDE ACÁ

| | |
|---|---|
| ✅ **La migración del repo TIENE el guard** | `20260911610000_s114a_rpcs_del_caso.sql:349` — `IF p_destino = 'saldo' THEN RETURN … 'saldo_todavia_no_existe'` |
| ✅ **Es la ÚNICA que define la función** | `grep -ln "FUNCTION public.caso_elegir_destino" supabase/migrations/*.sql` ⇒ un archivo. **Ninguna posterior la redefine** |
| ✅ **El wrapper lee bien el rebote** | `if (d.ok !== true) return { ok:false, codigo: d.codigo … }` — si el motor hubiera dicho que no, la pantalla lo habría mostrado |
| ✅ **La pantalla se comportó como si fuera éxito** | la carta desapareció y **el hecho lo escribió el motor**: sólo él escribe hechos |
| 🔴 **Lo que NO puedo decir** | **por qué la función desplegada difiere del repo.** No tengo credencial para leerla. *Puede ser que no se haya aplicado, que se haya aplicado una versión anterior, o que algo la haya reemplazado fuera de una migración.* **No lo adivino: lo mido quien pueda.** |

⇒ **La conclusión que sí se sostiene: lo desplegado NO es lo que dice el repo, y la diferencia
es un guard que protege plata.**

---

## LO QUE C **NO** HIZO, A PROPÓSITO

- **No lo trabajé alrededor.** La tarjeta del saldo sigue ofreciéndose pareja, como manda §4 y
  como la mesa ratificó — *esconderla convertiría «todavía no está» en «no existe»*.
- **No le puse un guard en la pantalla.** Si C rechazara `saldo` del lado del cliente, el motor
  quedaría igual de roto **y nadie se enteraría**: el próximo caller —el portal del admin, un
  script, F— haría lo mismo con el mismo resultado. *Un guard de superficie sobre un agujero de
  motor no lo cierra: lo esconde.*
- **La voz del rebote ya está escrita y esperando** (`postventa.saldoTodaviaNo`): el día que el
  motor rebote, la pantalla lo dice sin tocar una línea.

---

## SUGERENCIA DE VERIFICACIÓN, PARA QUE NO SE MIDA CON EL `ok:true`

`pg_get_functiondef` sobre la función viva, no el ledger de migraciones — **es la lección que
esta casa ya pagó en S105**: *«`db push` dice `Finished` sobre cosas que no pasaron; el ledger
no es prueba, la prueba es preguntarle al objeto.»*

```sql
select pg_get_functiondef('public.caso_elegir_destino(uuid,text)'::regprocedure)
       like '%saldo_todavia_no_existe%' as tiene_el_guard;
```

**Y el caso de E quedó con `destino='saldo'` escrito** — hay que decidir si se limpia antes de
que alguien lo lea como un saldo real.
