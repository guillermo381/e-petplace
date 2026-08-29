# S107-C · ACTA DE TRASPASO — las superficies de guardería

> **Para quien retome la pista C sin saber nada de esta sesión.** Se lee ANTES de tocar nada.
> **Regla que gobierna todo lo de abajo:** los números y estados de acá **eran ciertos el 29-ago-2026**. **Todo dato vivo se re-lee del objeto al usarlo** (L-166), y **el próximo `D-NNN` libre se verifica por grep contra `DEUDAS_CANONICAS.md`, jamás desde este documento.**

---

## ⓪ QUÉ ES ESTA PISTA, EN UNA LÍNEA

**C construye las SUPERFICIES de las dos apps.** En S107 el oficio nuevo es **guardería**: el prestador la configura y ve su día; la familia la descubre, reserva y paga.
**No son míos:** `packages/ui` (B) · `packages/api`, `supabase/`, `docs/contratos/` y `DEUDAS_CANONICAS.md` (A).

---

## ① ESTADO EXACTO

| | |
|---|---|
| worktree · rama | `../e-petplace-s107-c` · `pista/s107-c` |
| último commit | **`1117f126`** |
| árbol | limpio |
| **en `main`** | **todo lo funcional** — A mergeó cada tanda |
| **NO en `main`** | sólo los commits de documentación posteriores al último merge de A (este acta incluido) |
| gates al cerrar | typechecks **prestador y cliente limpios** · `verify:diseno` **VERDE, 60 reglas** |

---

## ② LO CONSTRUIDO — CLIENTE

**La arquitectura, que es lo que más importa entender:** en esta casa **cada oficio vive en DOS sitios** — `/hogar/<oficio>` es **el LOG** (el historial de la familia) y `/explorar/<oficio>/` es **el FLUJO** (elegir y pagar). *El defecto raíz de esta sesión fue haber construido el flujo en el lugar del log; se corrigió mudándolo.*

| pantalla | estado |
|---|---|
| **`/hogar/guarderia.tsx`** — el LOG | 🟠 **MITAD INERTE**: monta `FiltroMascotas` y el CTA al pie, **pero la lista no se puede llenar** (no existe el lector). Su vacío **dice la verdad**: *«todavía no podemos mostrarte tus estadías»*, **no** *«no tienes estadías»* |
| **`/explorar/guarderia/index.tsx`** — el CUÁNDO | ✅ `CabezalOficio` · `FiltroMascotas` · `SelectorDia` · lista de lugares · `DiaSinHorarios` |
| **`/explorar/guarderia/[prestadorId].tsx`** — el lugar | ✅ franjas · calendario de cupo · semáforo sanitario · reservar |
| **`/explorar/guarderia/checkout.tsx`** | ✅ monta `CheckoutReserva`, **la misma pieza que paseo y grooming** |

**✅ La cara de la mascota LLEGA — verificado, no supuesto:** `obtenerMascotasDeFamilia` selecciona `especie, foto_url`, y las dos pantallas la resuelven con `caraDeMascotaPorRuta`. **No quedó pendiente.**

**Otros dos cambios del cliente:** ☠️ **el chevron de las baldosas de Explorar, retirado** (quedaba a distinta altura en cada una según cuántas líneas ocupara el label) — **la etiqueta accesible se quedó, y es lo único que dice a dónde entra**; y **guion blando (U+00AD)** en `Esté­tica y baño` · `Adiestra­miento` · `Vete­ri­na­ria`.

---

## ③ LO CONSTRUIDO — PRESTADOR

| pantalla | estado |
|---|---|
| **`/guarderia/index.tsx`** — la portada | ✅ resumen primero (visibilidad, precio, jornada, cupo, ventanas) y **recién debajo editar**, con `useFocusEffect` |
| **`/guarderia/taller.tsx`** — la config | ✅ **completa** — ver abajo |
| **`/guarderia/dia.tsx`** — su día | ✅ lista de estadías con cara, estado, sala y **la dirección de recogida** (misma pieza que el paseo). 🔴 **No marca nada**: los wrappers de acción no existen y llegan con el acta |

**La config, en su orden firmado:** ① **especies** (perro/gato, `SelectorOpcion` del patrón de grooming) → ② **capacidad** por día → ③ acordeón **«Horarios»** *(cerrado)* → ④ acordeón **«Tus precios»** *(abierto)*: diario · tres paquetes (5·10·15) · mensual, **cada uno con su toggle y su precio adentro** → ⑤ **«Así lo ve el dueño»**, con **las mismas piezas que ve la familia**.

**El modal de guardar, con su regla:** sin ningún precio → **pregunta** (dos botones) y guarda sin publicar; con precio pero sin el diario → **informa** (un botón) nombrando con qué se publica. *Se pregunta cuando hay alternativa; se informa cuando no la hay.*

---

## ④ LOS HUECOS VIVOS

1. 🔴 **El lector de estadías del lado de la FAMILIA — bloquea el log.** `obtenerEstadiasDelDia` **no sirve**: es del prestador, por día, y **filtra los holds a propósito**; la familia necesita ver su reserva **sin pagar**, que es la que tiene que ir a pagar. **Contrato exacto:** `docs/loop/S107-C-PEDIDO-A-A-LOG-FAMILIA.md`.
2. 🟠 **`D-967`, mitad cliente.** `apps/cliente/src/lib/mapa-nativo.ts:106` sigue con **`= true` literal** y la sonda **no está portada** (`apps/cliente/modules/` no existe). 🔴 **NO se porta y se consume en el mismo acto:** en un binario sin el módulo la sonda daría `null` ⇒ fail-closed ⇒ **el mapa del cliente se apagaría hoy, donde funciona**. **Forma:** portar inerte, y flipear **cuando exista un binario de cliente que lo lleve**.
3. 🟠 **La baldosa a mano del Explorar del cliente.** No monta `Baldosa`: la dibuja a mano, así que las curas de la pieza no la alcanzan. **Decidí aplicar el guion blando y NO montar la pieza**, porque su anatomía ya divergió por firma (perdió descripción y chevron) y montarla reabriría dos decisiones recién tomadas. ⚠️ **La mesa la llamó `D-973`, pero medido: esa ficha NO existe en `DEUDAS_CANONICAS.md`** — quien la deposite **verifica el número libre por grep**.
4. 🔴 **El acta (⑤)** y **la aceptación de documentos** — sin superficie todavía; sus wrappers no existen (`obtenerDocumentosGuarderia`, `aceptarDocumentosGuarderia`, `evaluarDocumentosGuarderia`). **Dos huecos del contrato pedidos a A** en `S107-C-PEDIDO-A-A-DOCUMENTOS.md`.

---

## ⑤ LAS FIRMAS QUE RIGEN ESTE TERRITORIO

| firma | qué significa al construir |
|---|---|
| **Tuteo** (`R66`) | la voz de producto **jamás vosea**. Es un trinquete **solo-baja**: si tus strings lo suben, el gate se pone rojo |
| **La víspera** | 🔴 **HOY jamás se reserva** — el primer día elegible es el siguiente en que el lugar opera |
| **Las voces del calendario** | **seis estados con voz propia**: `pasado` · `mismo_dia` · `no_opera` · `sin_lugar` · `elegible` · sin fila. **«No abre» NO es «se llenó»**, y el server los separa porque desde la pantalla ambos llegan como `disponible = 0` |
| **El semáforo REFLEJA, no decide** | `bloquea` viaja **dentro** de la evaluación y lo lee también `reservar_dia_guarderia`. **La pantalla nunca abre una puerta para chocar contra otra** |
| **Sin chips de mascota en el flujo** | la mascota **viaja por parámetro** desde el log; el flujo no la vuelve a preguntar |
| **Guardería sedimenta CADA estadía** | como sus hermanas. 🔴 **El evento es de A** — nace en el servidor **al entregar**, no en ninguna pantalla mía |

---

## ⑥ TRES COSAS QUE SÓLO SE ENTIENDEN CON EL CONTEXTO, Y POR ESO VAN ESCRITAS

**① Por qué el flujo de guardería NO se parte en `index` + `disponibles` como sus hermanas.** Porque **acá el día ES lo que filtra a los lugares**: partirlo inventaría un paso donde la familia elige el día, toca «siguiente» y ve **la misma lista que ya podía ver**. Sus hermanas lo parten porque ahí el QUIÉN depende de **una hora que todavía no está elegida**. **Adoptado por firma, no es pereza.**

**② Por qué los labels llevan un guion invisible.** RN **no hifena español** y la pieza **no sabe silabificar** — dónde parte una palabra es propiedad del idioma. Medido: `Adiestramiento` son 14 caracteres de **una sola palabra** y **ningún tamaño de la escala** la hace entrar en los ~74 pt de una baldosa a tres columnas. ⚠️ **El guion es invisible en el editor: quien edite esas cadenas lo borra sin que nada avise.**

**③ Por qué desconfiar del aparato antes que del repo.** Dos veces en esta sesión el founder vio algo que el código no decía, y **las dos veces el repo estaba bien y el bundle era viejo**. **El discriminador es el commit, no la discusión.** Y la lección propia (**`L-432`**): comparar tu rama contra `main` responde *qué cambiaste vos*, **no qué puede recibir el teléfono** — para eso la pregunta es si **existe binario para el runtime que `app.json` declara**.

---

## ⑦ EL PRÓXIMO PASO EJECUTABLE

**Si A publicó el lector de estadías de familia:** en `apps/cliente/src/app/(tabs)/hogar/guarderia.tsx`, reemplazar el `EstadoVacio` de «listaPendiente» por **`FiltroPills`** (próximos / historial) + filas **`FilaCita`**. **El esqueleto, los chips y el CTA ya están montados** — falta sólo con qué llenar la lista.

**Si no:** el acta (⑤) es lo siguiente en la cola, y su contrato ya está publicado.
