# S107-C · ACTA DE TRASPASO — las superficies de guardería

> **Para quien retome la pista C sin saber nada.** Se lee ANTES de tocar nada.
> **Regla que gobierna todo:** los estados de acá **eran ciertos el 29-ago-2026**. **Todo dato
> vivo se re-lee del objeto al usarlo**, y el próximo `D-NNN` libre se verifica **por grep**,
> jamás desde este documento.

---

## ⓪ LO PRIMERO, PORQUE ES LO QUE MÁS DUELE

> ### 🔴 **EL FOUNDER NO PUEDE COMPRAR NI RESERVAR TODAVÍA, Y LA CAUSA NO ES DE PANTALLA.**
> **`guarderia_documentos` = 0.** La casa **nunca cargó los seis textos legales**, así que
> `_guarderia_puede_reservar` devuelve `documentos_no_disponibles` **para toda familia**.
>
> **Es la regla de perímetro del founder funcionando** — *«sin documento cargado la reserva no se
> abre»*. **No se cura con código: se cura cargando los textos.** *(Dueño: A / mesa.)*

🔴 **Y con una asimetría grave, medida:** `comprar_paquete_guarderia` **NO pasa por ese gate** ⇒
se le puede cobrar un paquete a alguien que no aceptó nada, y frenarlo después.
⇒ `S107-C-PEDIDO-A-A-GATE-DEL-PAQUETE.md`.

---

## ① ESTADO

| | |
|---|---|
| worktree · rama | `../e-petplace-s107-c` · `pista/s107-c` |
| árbol | limpio · todo pusheado |
| **fuera de main** | **3 commits** — correlos con `bash scripts/s107/estado-de-mis-curas.sh` |
| gates | typecheck cliente y prestador limpios · `verify:diseno` **VERDE, 61 reglas** |
| compuerta | **`MODALIDADES_ABIERTAS = ['dia','paquete']`** — mensual **cerrada**, sin wrapper de contratación. **NO se abre sin aviso literal de A** |

---

## ② EL FLUJO DEL CLIENTE, COMO QUEDÓ

```
/hogar/guarderia            LOG: chips de mascota · pestañas · lista · saldo de paquete · CTA
  └→ /explorar/guarderia    ETAPA 1: modalidad → día → tamaño (con su precio) → «Ver quién puede»
      └→ …/disponibles      ETAPA 2: la vitrina (PreviewPrestador + cupo + las dos ventanas)
          └→ …/[prestadorId]  EL LUGAR: franjas · calendario · semáforo · MapaZona · PAGAR
              └→ …/checkout   CheckoutReserva, la pieza compartida
/guarderia/[estadiaId]      EL DURANTE: estado · mapa del tramo · media · acta
/guarderia/documentos       LA ACEPTACIÓN
```

🔴 **EL TAP DE LA VITRINA VA A `…/[prestadorId]`, NO AL PERFIL GENÉRICO** (prop `onAbrir` de
`PreviewPrestador`). *El perfil monta barra de los cuatro oficios y **ninguna de guardería**.*
**Esta línea se perdió UNA VEZ en un merge y cortó el pago cinco tandas** — el typecheck no lo
ve, porque **una prop opcional que nadie pasa no rompe nada.** **Si el pago vuelve a cortarse,
mirá esto primero.**

---

## ③ MI COLA — tres cosas, todas mías

1. 🔴 **El ancho del botón de antirrábica** — el founder lo ve «muy ancho». Sin empezar.
2. 🔴 **El selector de días del prestador** — **desbloqueado**: `reemplazarFranjasGuarderia` hace
   el reemplazo atómico con `dias_semana`. *Sin él, cualquier selector fabrica franjas huérfanas
   — por eso estuvo cerrado.*
3. 🔴 **Mi pantalla de documentos → `AceptacionDeDocumentos`** — *la hice a mano sin saber que la
   pieza existía*; la usan el registro del prestador y la invitación.

## ④ ESPERANDO A A

- 🟡 **La mensualidad** — hay motor en migraciones, **no hay wrapper de contratación**.
- 🔴 **El gate del paquete** (⓪) · 🔴 **los seis textos legales** (⓪).
- 🟢 **`p_tamano` en el resumen** — **no bloquea**: el precio por chip lo resuelvo con
  `obtenerPaquetesGuarderia`, que cuesta **una llamada por lugar**. Cuando llegue, colapsa a una.

## ⑤ DECISIÓN DE MESA ABIERTA

**`protocolo_no_retiro` está entre los seis documentos** que la pantalla lista. **No lo trato
distinto ni lo escondo:** *un caso especial sería la pantalla de mora que el perímetro prohíbe;
sacarlo sería pedir que acepten algo que no mostramos.*

---

## ⑥ LAS FIRMAS QUE RIGEN

| firma | al construir |
|---|---|
| **Tuteo** (`R66`) | trinquete solo-baja. **Los dictados de mesa vienen en voseo y se convierten** |
| **La víspera** | **HOY jamás se reserva** — el motor rebota `fecha_no_ofertable` |
| **La modalidad arranca en «día»** | *no es default oscuro: es el camino que la familia iba a tomar igual*. Nada más viene elegido |
| **El orden: fecha → tamaño** | los precios por tamaño salen de los lugares que abren ESE día |
| **Sin chips de mascota en el flujo** | viaja por parámetro; el guard sobrevive para el deep-link |
| **El mensaje de causa va ENCIMA del botón** | `PieReserva` es fijo y debajo no hay dónde vivir |
| **El botón de conformar el acta** | nace **con** el lector del contenido, no antes |
| **Comprar paquete = comprar + agendar el primer día** | **sin toggle**: *uno que no se puede apagar es una casilla decorativa* |
| **Con saldo, el lugar lo determina el bono** | va directo al día de ESA guardería |
| **Toda cura viaja con su estado real** | «en mi rama, esperando merge» — nunca «curado» a secas |

---

## ⑦ LOS INSTRUMENTOS — se corren, no se re-inventan

| script | para qué |
|---|---|
| `estado-de-mis-curas.sh` | **antes de reportar nada**: en qué estado está lo que vas a llamar «curado» |
| `sonda-camino-del-dedo.mjs` | 🔴 **el camino completo de la familia**. *El único que caza un tap roto* |
| `sonda-precio-por-tamano.mjs` | que cada chip muestre SU precio, **contra el render** |
| `sonda-caminos-tristes.mjs` | los rebotes del motor, sin escribir |
| `corrida-*-subtx.sql` | lo que exige escribir, **entre `BEGIN` y `ROLLBACK` con residuo medido** |
| `sonda-tocar.mjs` | `tocar()` no deja tocar sin verificar · `porClave()` nombra la clave, no la copia |
| `levantar-cliente-web.sh` | levanta la web con la API viva. **Lleva el aviso de la `service_role`** |

---

## ⑧ LAS CINCO CLASES QUE DEJA ESTA PISTA — todas producen salida creíble y ninguna deja síntoma

1. **La incoherencia entre dos estados que sólo coinciden en pantalla.** *Cada mitad correcta;
   ninguna línea está mal.*
2. **El instrumento que no distingue «no pasó nada» de «no hice nada».** → `tocar()`.
3. **El dato que fue cierto y dejó de serlo.** *Cobrada dos veces, las dos sobre trabajo ajeno.*
4. **Nombrar de memoria** — campos, tablas, roles, copys. *Seis veces en un día.* → `porClave()`.
5. 🔴 **Medir bien la pantalla equivocada.** *Tres sondas midieron pantallas que el dedo nunca
   alcanzaba: «¿esta pantalla anda?» no es «¿se puede comprar?».*

> **Y el patrón que las une: cuando algo salió mal por lo que uno recordó o dejó de recordar, la
> cura no es recordarlo mejor — es que deje de depender de recordarlo.** *Cinco de las curas de
> esta pista son mecanismos, no notas.*

---

## ⑨ EL PRÓXIMO PASO EJECUTABLE

**Correr `bash scripts/s107/estado-de-mis-curas.sh`** y, si hay commits fuera, decirlo al
reportar. Después, en orden: **el ancho del botón** (chico y visible) → **la pieza de
documentos** → **el selector de días**.

⚠️ **Y antes de decir que algo del pago funciona: `node scripts/s107/sonda-camino-del-dedo.mjs`
con Metro arriba.** *Es el único instrumento que recorre el tap, y es el que encontró lo que
cinco tandas de medición no vieron.*
