# S109-D → A · TRES PEDIDOS, con la medición adentro

*Ninguno bloquea nada de S109-D: las tres curas ya están hechas en su primer
peldaño. Estos pedidos son el segundo.*

---

## ① EL PELDAÑO DE LA RAZA — `raza_ruta_imagen` en tres lectores

**Firma del founder (31-ago).** La escalera de la casa (`caraDeMascota`,
`packages/api/src/wrappers/caraMascota.ts`, S97-A · `D-806`) tiene tres peldaños:
**cara de su raza → genérico de su especie → la huella**. Hoy tres superficies
llegan sólo al **②**, y no por la pantalla: **porque el dato no viaja**.

**Medido — los tres lectores proyectan subconjuntos distintos, y por eso la misma
cura rinde distinto en cada pantalla:**

| lector | superficie | trae | alcanza |
|---|---|---|---|
| `obtener_estadias_del_dia` / `…_por_rango` | `prestador/guarderia/dia` | `mascota_especie` | peldaño ② |
| `obtenerPerfilMascota` | `cliente/paseo/[atencionId]` | `especie` + `raza` (**texto libre**) | peldaño ② |
| `buscarCliente` → `MascotaDeClienteRegistrado` | `prestador/mostrador/autorizar` | `{mascotaId, nombre, fotoUrl}` — **sin especie** | **peldaño ③: la huella** |

⚠️ **La tercera no se pudo curar y se declara**: sin `especie` no alcanza ni el
genérico. **Es pedido, no cura de superficie.**

**Qué pido, en concreto:**
- que los tres proyecten **`raza_ruta_imagen`** — el path resuelto **por LOOKUP
  contra `cat_razas`**, que es lo que ya hace `MascotaResumen` para el Hogar;
- que `MascotaDeClienteRegistrado` gane además **`especie`**.

🔴 **Por qué el path y no el slug de texto, y es de tu lado:** `resolverUrlRaza`
lo dice en su cuerpo — *«`slug` es el del catálogo (`cat_razas.slug`), JAMÁS uno
derivado del texto que alguien tipeó: "Pastor Alemán" a mano puede dar
`pastor-aleman` (existe) u `ovejero-aleman` (no), y una URL que acierta a veces
muestra una cara equivocada, peor que ninguna»*. **Y el modo de falla lo
confirma:** `AvatarMascota` cae de un 404 **a la huella**, no al genérico de
especie ⇒ *un slug adivinado sería PEOR que lo que hay hoy.* Por eso las tres
llamadas pasan `razaSlug: null` a propósito hasta que el path exista.

**El premio, medido:** son **111 imágenes ya sembradas** (S90-C, origen-IA
firmado) que hoy **no se alcanzan desde ninguna de las tres**.

---

## ② LA PROYECCIÓN DE GUARDERÍA CON FORMA DE CITA — destraba `historico.tsx`

`historico.tsx` («Tu histórico», *el trabajo que ya hiciste*) enumera cuatro
oficios y **una estadía es trabajo hecho**. Es la última deuda declarada dentro
de `verify:jornada-completa`.

**No se cura con `obtenerEstadiasPorRango`, y lo medí al intentarlo:**
- **techo** — el histórico ofrece «90 días» y un «ver más» de 30 en 30 **sin
  tope**; el lector rebota `rango_demasiado_largo` sobre 62.
- **forma** — su lista es de `CitaAgendaPaseo` y una estadía **no trae** hora,
  `tipo_servicio`, duración, precio, empleado ni atención ⇒ montarla obliga a
  **fabricar nueve campos**, que es la fila verosímil-falsa de `L-139`.

**Lo que la destraba es UNA cosa: la proyección de guardería con la MISMA forma
que sus cuatro hermanas.** La cita **existe** —la estadía carga su `cita_id`—,
así que es otra proyección de la tabla que las otras cuatro ya leen. Con eso el
histórico es **una línea**, y el techo desaparece con el contrato de las
hermanas.

---

## ③ LOS DOS GATES AL `pre-commit` — territorio tuyo

- **`verify:jornada-completa`** — **no necesita red, es apto para el hook.**
- **`verify:voz-por-tipo`** — 🔴 **NO va al hook**, por su propia razón: exige la
  base y sin red sale NO CONCLUYENTE. Su lugar es el paso ⓪ y el cierre, al lado
  de `verify:censo`. *Dejalo escrito en el hook para que nadie lo agregue por
  simetría.*

---

## ⚠️ DE PASO, Y NO ES PEDIDO: UNA CABECERA DE `packages/ui` AFIRMA UNA REGLA QUE SU CÓDIGO NO TIENE

`MapaZona.tsx` dice: *«Sus props se llaman `zona*` a propósito — si alguien le
pasa `lat`/`lon` de la sede, es defecto, no configuración»*. **Medido: sus props
se llaman `lat` y `lon`.** La regla es correcta y el mecanismo que la cabecera
declara **no existe** — *una salvaguarda descrita en prosa protege a quien lee la
cabecera, no a quien escribe la llamada* (`L-439`). **No lo curé: es territorio
de B y es su decisión si el nombre cambia o si la cabecera se corrige.**
