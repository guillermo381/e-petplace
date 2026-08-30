# S107-C · ACTA DE TRASPASO — las superficies de guardería

> **Para quien retome la pista C sin saber nada.** Se lee ANTES de tocar nada.
> **Regla que gobierna todo:** los estados de acá **eran ciertos el 29-ago-2026**. **Todo dato
> vivo se re-lee del objeto al usarlo**, y el próximo `D-NNN` libre se verifica **por grep**,
> jamás desde este documento.

---

## ⓪ LO PRIMERO — Y NO ES UN DEFECTO

> ### **`documentos_no_disponibles` ES EL ESTADO NORMAL DEL FRENTE.**
> `guarderia_documentos` = 0 filas, así que las tres puertas rebotan.
> **No falta motor ni pantalla: falta el TEXTO**, y es legal — *lo redacta la
> mesa, ninguna pista, ni como placeholder.* Ficha **`D-977`**.
>
> ⇒ **Hasta que los seis textos existan, nadie puede reservar, y eso es el
> perímetro funcionando.** *No lo reportes como bug.*

✅ **Y las dos puertas que faltaban ya están cerradas** (A, migración
`20260831020000`): `comprar_paquete_guarderia` y `contratar_mensualidad_guarderia`
**pasan por el gate**. Antes cobraban y frenaban a la familia en la reserva,
*con la plata ya tomada*. Contrato: `docs/contratos/s107-contrato-compuerta-en-la-compra.md`.

⚠️ **Consecuencia que la pantalla ya muestra, declarada por A:** con el gate
sanitario duro, una familia **puede comprar un paquete y ese día no poder
usarlo** por el carnet — lo sanitario se evalúa donde el sujeto existe (la
puerta del DÍA), porque el paquete es del hogar y nace sin mascota. *No es un
defecto de la compra: es el semáforo diciendo la verdad antes.*

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

## ③ MI COLA — VACÍA

Los tres ítems cerraron el 29-ago, en este orden:

| | qué era | cómo cerró |
|---|---|---|
| ✅ **el ancho del semáforo** | «muy ancho, la caja mal dimensionada» | **medido**: ~92 px contra los ~60 de la fila canónica (`parte/[eventoId]`). La causa era mía —el relleno de la `Tarjeta`— y la casa ya tenía el criterio escrito. **Queda un `paddingHorizontal` DECLARADO COMO ANDAMIO**, con su retiro escrito ⇒ `PEDIDO-A-B-GEOMETRIA-DEL-SEMAFORO` |
| ✅ **la pantalla de documentos** | migrarla a `AceptacionDeDocumentos` | resultó **más grande que un cambio de pieza**: no había acto de aceptación — mandaba las seis hiciera lo que hiciera la familia. Hoy seis casillas, el enlace abre sin marcar, el botón exige las seis y sólo viaja lo marcado |
| ✅ **el selector de días** | estaba cerrado por motor | abierto con `reemplazarFranjasGuarderia`, **probado en subtransacción con residuo 0** (`corrida-reemplazo-dias-subtx.sql`) |

🔴 **Lo que el selector de días destapó, y es lo que hay que saber:** los días
viven en **dos lugares** —`espacios.dias_operacion` (lo que le pinta
`no_opera` a la familia) y `franjas.dias_semana`— y **el taller no escribía
ninguno**. *El prestador no podía elegir sus días por ninguna vía.* Hoy un
selector escribe los tres lugares. ⚠️ **Se LEE de las franjas porque no hay
lector de espacios: con dos salas eso no alcanza.**

## ④ ESPERANDO A A

- 🟡 **La mensualidad** — hay motor en migraciones, **no hay wrapper de contratación**.
- 🟡 **El lector de espacios** — hoy los días de operación se **escriben y no se
  leen**; el selector se apoya en las franjas como espejo. Con dos salas hace
  falta el lector de verdad.
- ✅ ~~El gate del paquete~~ — **cerrado por A** (`20260831020000`).
- ⚪ **Los seis textos legales** — de la mesa, no de A. Ver ⓪.
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
| 🔴 **Toda sonda entra por donde entra el dedo** | *medir una pantalla por su ruta directa contesta «¿esta pantalla anda?», no «¿se puede comprar?»*. **Firma del founder sobre un error mío**: tres sondas midieron bien pantallas que el dedo nunca alcanzaba |
| **La clave se elige por su claim, no por su posición** | `claveAnon()`. Un script que agarra «la primera» anda hasta que el orden cambia, y ese día **anda mejor**: corre como `service_role` y todo gate pasa |

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

**La cola de C está vacía.** Antes de tomar nada nuevo:

1. `bash scripts/s107/estado-de-mis-curas.sh` — y si hay commits fuera de main,
   decirlo al reportar. **Nunca «curado» a secas.**
2. Si el trabajo toca pago o reserva:
   `node scripts/s107/sonda-camino-del-dedo.mjs` con Metro arriba. *Es el único
   instrumento que recorre el tap*, y es el que encontró lo que cinco tandas de
   medición no vieron.

**Lo que espera fuera de C:** los seis textos legales (mesa) · la geometría de
`SemaforoSanitario` (B) · el wrapper de mensualidad y el lector de espacios (A).
