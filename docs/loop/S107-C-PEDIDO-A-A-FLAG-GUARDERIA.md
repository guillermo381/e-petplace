# S107-C → A · PEDIDO AUTOCONTENIDO — el flag propio de guardería en `country_config`

> ## ☠️ CUMPLIDO — `paisConfig` lee `guarderia`, la clave existe en `country_config` para EC y CO, y la ficha se enciende sola con el flag (verificado contra el objeto, 29-ago-2026)
> **Este pedido YA LLEGÓ y su texto queda como registro, no como pendiente.**
> *Un pedido cumplido que sigue diciendo «esto no existe» manda a alguien a construir lo que ya está* — y esa es exactamente la verdad vencida que esta sesión cobró dos veces (`D-948`).


> **Molde S91:** la mitad de C está construida e **INERTE** (`GUARDERIA_ABIERTA` en `apps/cliente/src/app/(tabs)/explorar/index.tsx`). Falta la mitad de A: `packages/api` y la base.
> **Prioridad:** después de `guarderia-oferta`. **Las dos son la misma llave** y ninguna sirve sola — ver §4.

---

## ① EL DEFECTO QUE ESTO CIERRA — medido, y es latente, no teórico

Hasta hoy `explorar` decidía así:

```js
if (!servicios.hotel) proximamente.push({ hotel }, { guarderia });
```

> ### 🔴 Guardería colgaba del flag de **hotel**. El día que hotel abriera, guardería **no pasaba a activa: DESAPARECÍA de la pantalla** — no tiene ficha propia — y nadie se habría enterado hasta ir a buscarla.

**Y además contradice una firma:** `LETRA_GUARDERIA` §5 separa los dos servicios con todas las letras — *«la noche NO es guardería: es hotel, y es otro servicio con su propia letra»*. **Compartir bandera es unir en el código lo que la letra separó.**

**C ya desacopló su lado** (guardería tiene su propia condición y sigue en «próximamente», que hoy es cierto). **Lo que falta es que la condición pueda ser verdadera alguna vez.**

---

## ② EL CAMBIO EXACTO

**En la base** — `country_config` gana una bandera de servicio más, con el molde de las que ya están (`walking`, `grooming`, `veterinary`, `training`, `hotel`, `insurance`, `telemedicine`, `prime`):

- **clave:** `guarderia`
- **default: `false`**, también para EC. 🔴 **No se enciende en la misma migración**: encenderla sin oferta abre una puerta a una lista vacía (§4).

**En `packages/api/src/wrappers/paisConfig.ts`** — dos líneas, calcadas de sus hermanas:

```ts
// en el tipo, junto a `hotel: boolean;`
guarderia: boolean;

// en el armado, junto a `hotel: leerBandera(o, 'hotel'),`
guarderia: leerBandera(o, 'guarderia'),
```

**Eso es todo.** No hay RPC nueva ni lector nuevo: `obtenerConfigPais` ya trae el objeto entero.

---

## ③ QUÉ HACE C CUANDO LLEGUE

`GUARDERIA_ABIERTA` (constante inerte, hoy `false`) pasa a `servicios.guarderia`, **y con eso la ficha activa se enciende**. Es **una línea**, y la constante muere en el mismo acto (Ley 37).

---

## ④ 🔴 LA ADVERTENCIA QUE IMPORTA MÁS QUE EL PEDIDO

**El flag es LA MITAD de la llave. La otra es `guarderia-oferta`.**

- **Con flag y sin oferta:** la ficha se enciende y lleva a **una lista vacía** — no hay `prestador_servicios` de guardería que listar. *Una puerta que abre a un cuarto sin nada adentro es peor que la puerta cerrada.*
- **Con oferta y sin flag:** hay guarderías reservables **y ninguna familia puede llegar a ellas**.

⇒ **Se encienden juntas, y `guarderia-oferta` va primero** (es la que además destraba el precio en la config del prestador, y con ella se cierra el recorrido del prestador entero). **Este pedido queda listo para el día que la oferta exista.**

---

## ⑤ LO QUE NO SE PIDE, PARA QUE NO SE HAGA DE PASO

- ⛔ **No reusar el flag de `hotel`** — es el defecto que este pedido cierra.
- ⛔ **No encender `guarderia` en EC** en la misma migración que la crea. El encendido es un acto propio, con la oferta viva.
- ⛔ **Ninguna letra ni texto legal** — §0 del plan.
