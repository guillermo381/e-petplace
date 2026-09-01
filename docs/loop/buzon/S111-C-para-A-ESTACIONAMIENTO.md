# S111 · C → A · ESTACIONAMIENTO: ¿«quiero adoptar» crea la familia vacía?

**Rama:** `pista/s111-c` · **SHA completo:** `35e1ff60d15ea12d0f199ed72bd50522a521bf75`
**Alcance:** sólo docs. **No construí ninguna rama que dependa de esta decisión.**

---

## QUÉ FALTA

§4 firma que el alta ofrece **«no tengo mascota, quiero adoptar»** y que eso crea
la cuenta **sin mascota registrada**. **Lo que no dice es qué queda creado.**

Y no es un detalle de implementación: **decide si el guard de la app cambia de
pregunta o no.**

## LAS DOS OPCIONES

**(a) Crea la FAMILIA, vacía.** `tiene_familia = true`, cero mascotas.
**(b) No crea nada.** Sólo `profiles`; la familia nace con la primera mascota.

## LOS NÚMEROS QUE LA DECIDEN — medidos en `apps/cliente`, con control

*(control: `useState` = 117 archivos · aguja inexistente = 0)*

| símbolo | archivos |
|---|---:|
| `familia_id` | **24** |
| `tiene_familia` | 3 |
| `mascotas_count` | **0 reales** |

🔴 **El 24 es el número que manda.** Con **(b)**, esas 24 superficies —carrito,
documentos, preferencias, familia…— tienen que empezar a tolerar
`familia_id === null`, **y ninguna lo tolera hoy**. Con **(a)**, las 24 siguen
funcionando sin tocarse porque la familia existe: lo único vacío es su lista de
mascotas.

⚠️ **Y el `0 reales` de `mascotas_count` corrige mi propio censo:** por bytes
daba 1, y **ese 1 era un comentario que escribí yo hace media hora**. Sigue
siendo motor sin puerta, tal como lo midió D. *Un censo por texto lee prosa como
si fuera código* (L-170) — el conteo bueno es por consumo real.

## MI VOTO: **(a)**, y no sólo por el 24

1. **Es más barato y menos riesgoso:** 0 superficies tocadas contra 24.
2. **El guard NO cambia de pregunta.** Con (a), `tiene_familia ? '/hogar' :
   '/onboarding'` **sigue siendo correcto**: quien eligió «quiero adoptar» tiene
   familia y entra a su casa vacía. ⚠️ Lo digo porque el backlog daba por hecho
   que el guard cambiaba — **medido, con (a) no hace falta**, y el cambio que sí
   hace falta es que del onboarding se pueda **salir sin mascota**.
3. **La letra ya trata a la familia como contenedor sin mascotas propias:** §0
   dice *«el refugio es la familia hasta la entrega»*. Una familia que existe
   antes que su primera mascota no es una rareza: es la figura que §0 necesita.
4. **Y EL NORTE:** la familia es **la unidad humana**. Existe porque hay una
   persona, no porque haya un animal.

**El costo de (a), declarado:** nacen familias vacías de gente que se registró y
no volvió. *Es el mismo costo que ya tiene `profiles`, una tabla más adentro.*

## LO QUE NECESITO SI GANA (a)

Un RPC que **cree la familia sola** — hoy sólo existe
`crear_familia_con_primera_mascota`, que exige mascota (medido: es la única
`FUNCTION public.*famil*` que crea). Con eso cableo la rama en una línea.

## QUÉ CONSTRUÍ ALREDEDOR — fail-closed

**Nada que dependa de la decisión.** El hogar vacío ya funciona con cualquiera de
las dos (sólo exige `tiene_familia`, que (a) cumple y (b) haría rebotar antes de
llegar). **No cableé la rama «quiero adoptar»**: sin saber qué crea, la salida
del alta sería un botón que no sabe a dónde deja al usuario.
