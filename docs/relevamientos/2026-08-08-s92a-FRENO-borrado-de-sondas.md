# S92-A · FRENO DECLARADO — EL BORRADO DE LAS 64 SONDAS NO ES DE UNA LÍNEA

> **Orden del founder al abrir S92, verbatim:** *«Las 64 cuentas `s91d-*`: SE
> BORRAN en S92, con conteo antes/después y verificación de que ningún dato real
> fue tocado.»*
>
> **Se intentó. NO se ejecutó, y este archivo dice exactamente por qué** — con lo
> medido, no con una impresión. **Nada se borró ni se modificó:** los dos
> intentos corrieron dentro de transacciones que abortaron solas.

---

## ① LO QUE SÍ QUEDÓ VERIFICADO (y no hay que volver a medir)

| medición | resultado |
|---|---|
| cuentas que matchean `s91d-%@epetplace.dev` | **64 exactas** — coincide con el acta de S91 |
| total de `auth.users` | **214** ⇒ quedarían 150 |
| cuentas parecidas que el patrón **NO** atrapa | 1 (`s92a-ajeno@epetplace.dev`, el fixture de esta sesión) — **el patrón no barre de más** |
| **miembros NO-sonda dentro de familias de sonda** | **0** ⇒ **borrar no arrastra a ninguna persona real** |
| qué cuelga | 64 familias · 64 `familia_miembro` · 64 `profiles` · **48 mascotas** · 0 prestadores · 0 cuentas comerciales · 0 citas · 0 push tokens |

**El censo está completo y limpio. El problema no es saber qué borrar: es que el
modelo no deja desconectarlo.**

---

## ② POR QUÉ ABORTÓ — DOS VECES, Y LAS DOS POR LA MISMA RAZÓN DE FONDO

**Intento 1 — `DELETE FROM auth.users` directo:**

```
ERROR: 23514 new row for relation "familia"
       violates check constraint "chk_familia_creador_xor"
```

La FK es `ON DELETE SET NULL`: al borrar la cuenta, `familia.created_by_user_id`
pasa a NULL, y el CHECK exige
`(created_by_user_id NOT NULL AND created_by_sistema NULL) OR (created_by_user_id NULL AND created_by_sistema NOT NULL)`.
Una familia sin creador **es un estado que la casa declara imposible**.

**Intento 2 — reetiquetar la familia primero** (`created_by_sistema = 'limpieza_s92_sondas'`,
la vía que el propio XOR contempla y que ya tiene precedente vivo,
`backfill_s17_fase_c`) **y después borrar:**

```
ERROR: 23514 new row for relation "eventos_mascota"
       violates check constraint "chk_eventos_origen"
```

Mismo patrón un piso más abajo: **`eventos_mascota` también tiene un XOR de
procedencia**, y el SET NULL de la FK lo rompe igual.

> ### La raíz, y es una virtud del modelo, no un defecto
> Esta casa guarda **de quién viene cada dato** con CHECKs de procedencia XOR.
> Eso hace que **una cuenta con historia no se pueda desconectar en silencio**:
> o se reetiqueta su procedencia tabla por tabla, o se borra el árbol.
> *El borrado no está bloqueado por un descuido: está bloqueado a propósito.*

---

## ③ EL TAMAÑO REAL DE LA ALTERNATIVA, MEDIDO

Borrar el árbol de datos exige vaciar antes lo que cuelga de una mascota:

- **80 FKs apuntan a `mascotas`**
- de ellas **40 BLOQUEAN el borrado** (33 `RESTRICT` + 7 `NO ACTION`):
  `evento_atencion` · `evento_historia_clinica_registrada` · los 8
  `evento_grooming_*` · los 3 `evento_adiestramiento_*` · los 3
  `evento_caso_clinico_*` · `eventos_mascota` y sus 3 hermanas de oficio ·
  `certificado_salud` · `estadias` · `programas_contratados` ·
  `suscripciones_servicio` · `evento_cita_servicio` · `evento_examen_diagnostico`
  · `evento_medicacion_prescrita` · `evento_desparasitacion_aplicada` · …
- y **48 FKs apuntan a `auth.users`**, con 7 en `RESTRICT`.

**La premisa del brief de S92 —*«es de una línea con el censo ya escrito; lo que
falta es la palabra»*— resultó FALSA, y ése es el hallazgo.** El censo estaba
escrito; la línea no existe.

---

## ④ LAS DOS VÍAS, PARA QUE LA DECISIÓN SÍ SEA DE UNA LÍNEA

**(a) BORRAR SOLO LAS CUENTAS, conservando los datos huérfanos.**
Se reetiqueta la procedencia (`created_by_sistema = 'limpieza_s92_sondas'`) en
`familia`, `eventos_mascota` y **las demás tablas que el mismo error vaya
nombrando** —hay que ir descubriéndolas de a una, porque el CHECK solo grita
cuando le llega el turno—. Resultado: 64 cuentas menos; 64 familias y 48
mascotas quedan **sin dueño, etiquetadas y rastreables**.
*Costo:* iterativo. *Riesgo:* bajo, todo reversible salvo el borrado de auth.
*Lo que deja:* datos de prueba en la base, marcados.

**(b) BORRAR EL ÁRBOL ENTERO (cuentas + familias + mascotas + su historia).**
Vaciar en orden las 40 tablas bloqueantes, después mascotas, familias y cuentas.
*Costo:* alto. *Riesgo:* **irreversible**, y toca 40+ tablas para limpiar datos
de sonda. *Lo que deja:* la base limpia de verdad.

> **Voto de la pista, con su porqué:** **(a)**. Lo que molesta de las sondas son
> las CUENTAS —64 usuarios falsos en el padrón de `auth`, que es lo que el
> founder nombró—, no 48 filas de mascota inertes. Y (b) es un borrado
> irreversible sobre 40 tablas que **nadie pidió**: la orden dice «las cuentas».
> *Entre dos curas, la que no destruye lo que no se nombró.*

---

## ⑤ POR QUÉ ESTO NO SE EJECUTÓ SOLO

Es **freno 3 del arranque** en su forma más literal (*«implica BORRAR DATOS»*),
con un agravante que lo separa de todo lo demás que se hizo hoy: **cerrar de más
se revierte; borrar no.** Toda la sesión cerró puertas con su reversa escrita al
lado. Acá no hay reversa posible.

**Y hay un detalle que vale para el que ejecute:** las 64 sondas incluyen una
`s91d-groom-*` creada el **8-ago 20:10 local**, o sea **durante S91** — el acta
de esa sesión daba las `s91d-groom-*` por limpiadas. No cambia nada del plan;
cambia el número que uno espera encontrar si vuelve a contar.

**Estado: PENDIENTE, con las dos vías servidas y el censo hecho.**
**Dueño: founder (elige vía) → A (ejecuta).**
