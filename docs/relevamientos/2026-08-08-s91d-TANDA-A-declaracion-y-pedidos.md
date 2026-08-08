# S91-D · LA 2ª PASADA DEL GATE — LO HECHO, LO MEDIDO Y LO QUE PIDO

> Rama `pista/s91-d`. Todo lo de acá está commiteado y pusheado; nada se
> declara «casi». Lo que no está, está con su falta exacta y su dueño.

---

## ① LO HECHO Y VERIFICADO

### A1 · el verde del chip elegido — **CERRADO** (venía de `b2f67175`)

La mesa corrigió mi lectura: el verde vivía en el selector de **ESPECIE**,
no en el de raza. Mi captura `G4-pata.png` mostraba raza en magenta, y por
eso no lo reproducía.

La causa estaba en la misma línea que yo había curado **a medias**: apagué
el relleno del tile en REPOSO cuando hay cara, y dejé el del SELECCIONADO,
que seguía resolviendo `capaBg.identidad` (verdeVital) con borde
`capa.identidad`. Venía de la espec de S45 —*la elección escala por el borde
de capa*—, que tenía sentido cuando la ficha era un catálogo sin contenido.

Hoy era **la única superficie de la app donde elegir algo no se veía
magenta**, y el founder lo leyó como bug dos veces seguidas. Ahora resuelve
`capaBg.comunidad` + `accent.control`, que es exactamente lo que usa
`SelectorOpcion` con `acento="control"`: los dos selectores del alta se
marcan igual, que era el pedido original. Memorial degrada solo.

### A2 · `ChipEntidad` consumido — **HECHO**, con su límite declarado

La grilla la arma esta casa y el chip lo pone `packages/ui`: es la letra de
B al extraer la pieza (*sube el chip, no el contenedor*). `FiltroMascotas`
es una hilera horizontal y esto es una grilla de dos columnas; subir la
hilera me habría obligado a envolverla o clonarla.

**El ancho lo pone el contenedor, y ésa era la mitad que me tocaba de
D-691:** `flexBasis` de media columna es lo que le da a `numberOfLines={2}`
una segunda línea que llenar. Sin columna, el chip se estira al largo de su
texto y la segunda línea no existe nunca — «Guacamayo Azul y Amarillo» (25
caracteres) seguiría ilegible aunque la pieza permita envolver.

`sujeto="cosa"` (firma de mesa): una raza no es una mascota. Sin cara del
catálogo, el fallback es su INICIAL — una huella sobre «Mestizo» diría que
ese chip ES un animal, y es una categoría.

> ⚠️ **LO QUE LA CAPTURA NO PRUEBA, y se dice:** mis capturas muestran los
> dos chips de primera clase con la anatomía correcta (inicial, pata magenta
> sobre el elegido, hundido, label en acento) — **pero NO los 44 chips de
> raza con sus caras, ni el envolver a dos líneas.** Medido: `cat_razas`
> tiene `grant_anon=0` y `grant_auth=1`, así que **el catálogo es
> solo-autenticado y mi arnés web no tiene sesión**. Con lista vacía casi
> reporto «el filtro de tres letras devuelve cero» como defecto de producto:
> era mi arnés. **El caso real de D-691 se juzga en el dispositivo del
> founder, con sesión.**

### A3 · el paso de la foto — **HECHO**

Los dos caminos terminaban distinto. El de la foto ya ordenaba *contenido →
preview → acciones*; el de galería tenía «Elegir foto» en el **medio**, el
preview colgando debajo y la salida al final.

Y el preview vivía **dentro del contenedor centrado**: su encabezado («Así
lo vas a ver») y su hilera están compuestos a la izquierda, así que el
`alignItems: 'center'` de afuera los descolocaba. Salió del centrado y
respira a lo ancho, igual que en el otro camino — *el acabado no se copió:
se compartió la disposición.*

Las dos acciones cierran juntas y las dos son `bloque`: la salida gana la
anatomía de secundario que la lámina le pide y queda última, que es lo que
la vuelve inconfundible como salida.

Captura: `scripts/capturas/s91d-A3-foto-camino-galeria.png`.

### A4 · la flecha del CTA de cierre — **HECHA, y trae un hallazgo**

`Boton` **ya dibujaba la flecha**, pero condicionada a
`variante === 'acento'`. Y el criterio de la casa es **E14, firmado**:
*información DESPLIEGA · acción LLEVA*. La flecha estaba atada a una
VARIANTE cuando E14 la ata a lo que la acción **hace**.

Consecuencia: un **primario que navega no tenía cómo decirlo**, y la única
salida era que la pantalla dibujara el path a mano — justo lo que
`chevron.ts` prohíbe en su propia cabecera (*la pieza lo porta; la pantalla
usa la pieza, jamás el path suelto*).

Cura: `Boton` gana `chevron?: boolean`. **El default no se mueve** —sin
declarar sigue siendo `acento` y solo `acento`—, así que ningún consumidor
vivo cambia de dibujo. Es el mismo criterio con el que `ChipEntidad` dejó
`compacto` de default: abrir para el uso nuevo, jamás una regresión en los
viejos. Consumidor: el CTA «Completá su perfil», que lleva al perfil de la
mascota recién creada.

> **Cruce declarado a B** (`packages/ui/src/components/Boton.tsx`): aditivo,
> con su porqué en el JSDoc. Si B prefiere otra forma, se revierte en una
> línea.

### A5 🔴 · la Hoja de raza trabada — **HECHA**

Faltaban las dos piezas que el paso 2 del alta sí monta, y `altura="completa"`
las volvía obligatorias: fija el alto en 0.9 de la ventana, así que 44 chips
desbordan un contenedor que no scrollea, con el campo de tipeo tapado.

* `HojaScroll` y no `ScrollView`, porque estamos **dentro de una Hoja**: es
  la pieza que bloquea el pan del swipe-to-close mientras el toque nace en
  la lista (L-132 — en web el `ScrollView` plano no delata el problema; en
  Android el arrastre cierra la Hoja).
* `EvitaTeclado`, porque el campo vive arriba de la lista.
* **El botón queda AFUERA del scroll a propósito:** adentro obligaría a
  recorrer las 44 razas para volver a encontrarlo después de elegir.

### El 🔴 del acuario · **mi condición provisoria RETIRADA**

A cerró el hueco en la puerta (`20260808070000`). Medido antes de retirar:
**`obj_acuario=0` y `obj_gato=0`** — el cierre de A es más ancho que mi
pedido, porque cubre también el caso general que mi parche dejaba abierto
(un gato sin programa veía los mismos 23 objetivos de adiestramiento canino).

**Un filtro que sobrevive a la puerta que lo hizo innecesario es una segunda
frontera esperando divergir** (Ley 37): el día que la mesa firme objetivos
para otro sujeto, la condición local los seguiría escondiendo y las dos
capas seguirían compilando.

### Verificación de la tanda

* `verify-alta-mascota-web-s91.mjs` — **27/27 VERDE**.
* typecheck `packages/ui` · `apps/cliente` — **VERDE**.
* `verify:diseno` — **VERDE, 25 reglas**.
* Capturas nuevas en `scripts/capturas/s91d-A*.png`, con el script que las
  produce (`scripts/capturar-tanda-a-s91.mjs`) commiteado: navega **por URL
  con params y no tapeando**, porque la etiqueta del CTA cambia por especie
  y un capturador que tapea se cae cuando la voz se afina.
* **Cero conteos hardcodeados** en mis verificadores (verificado por grep).
  El assert del vocabulario es por **conjuntos distintos** (pez ≠ perro), que
  es lo que sobrevive a que el catálogo crezca. Los renames
  `ladridos_excesivos`→`hizo_mas_ruido` y `hizo_adentro`→`hizo_fuera_de_lugar`
  **no me rompen nada**: grep en cero, ninguno estaba escrito de mi lado.

---

## ② LO QUE NO ESTÁ, CON SU DUEÑO

### 🔵 PEDIDO A **A** — A6: la cara de galería no llega a la tile del Hogar

**Medido:** `obtenerMascotasDeFamilia` (`packages/api/src/wrappers/onboarding.ts:284`)
selecciona `id, nombre, especie, foto_url, paseo_social_ok, talla, pelaje,
estado_vida, sujeto, tipo_agua` — **`raza` no está**, ni en el `select` ni en
`MascotaResumen`.

**Por qué me bloquea:** la cara se resuelve con `caraDeMascota({ especie,
razaSlug })`, y **el slug NO se deriva del texto tipeado** — a veces
acertaría y traería la cara de OTRA raza, que es peor que no traer ninguna.
Sin `raza` en el lector, el Hogar solo puede caer al genérico de especie, y
entonces la misma mascota se ve Labrador en su perfil y perro-cualquiera en
el Hogar. **Media cura acá es una inconsistencia nueva, no un avance.**

**El pedido, autocontenido:** agregar `raza` al `select` y a
`MascotaResumen` (`raza: string | null`). Es aditivo, sin migración, sin
cambio de RLS. Con eso el Hogar resuelve la misma cara que el perfil, por
la misma frontera única.

### 🟣 PEDIDO A **B** — A7: la sección Documentos no tiene glifo

**Medido antes de proponer nada:** el registry no tiene un glifo para *la
familia de papeles* que no esté ya tomado por sus propias filas —
`documento` lo usan `historia_clinica` y `ficha_identidad`, y `carnet` lo usa
`carnet_vacunas` (`apps/cliente/src/lib/papeles.ts:45-81`). Ponerlo en el
encabezado daría **tres instancias del mismo glifo en una sección abierta**,
que es la clase de D-546.

**No lo invento, y ésa es la decisión:** un glifo nuevo es territorio de B
con el proceso de `DIRECCION_ARTE` §6b (hoja de contacto, 2-3 variantes,
montaje a 21px, **gate POR ÍCONO del founder**). Queda a la mesa si vale ese
tren o si el encabezado se queda sin glifo — que hoy es legal: `icono` es
opcional desde la franja de «Ponte al día».

### 🟠 HALLAZGO PARA **C** — el genérico de perro trae un damero horneado

`perro/generico.webp` (bucket de galería, 10 858 B) **tiene el damero de
transparencia del editor cocido en la imagen**. No es un artefacto de
render: en la misma pantalla, con `razaSlug=labrador-retriever` la cara sale
limpia, y sin raza sale con cuadros grises.

**Por qué importa más de lo que parece:** ése es exactamente el camino de
quien elige «Mestizo» o «No sé» y no sube foto — el caso más común del alta,
no un borde. Evidencia: `scripts/capturas/s91d-A2-chipentidad-razas.png`.

**Hallazgo, no veredicto** (§5): no sé si el resto de los 111 objetos
comparte el defecto ni toco la galería, que es de C.

---

## ③ LO QUE QUEDA ABIERTO DE LA 2ª PASADA

| # | estado | dueño |
|---|---|---|
| A1 · el verde del chip | ✅ hecho | D |
| A2 · `ChipEntidad` | ✅ hecho · el caso D-691 se juzga en dispositivo | D |
| A3 · el remate del paso foto | ✅ hecho | D |
| A4 · la flecha del CTA | ✅ hecho (cruce declarado a B) | D |
| A5 🔴 · la Hoja trabada | ✅ hecho | D |
| 🔴 acuario · condición retirada | ✅ hecho | D |
| **A6 · la cara al Hogar** | ❌ **bloqueado: falta `raza` en el lector** | **A** |
| **A7 · el glifo de Documentos** | ❌ **bloqueado: no hay glifo libre** | **B** |
| A8 · «Al día» + los pendientes | 🟡 medido y FIRMADO, sin construir | D |

**A8, firmado por la mesa en sus dos mitades, con lo medido:** el pastillo
del perfil sale de `calcularVozHogar` (estado de CUIDADO) y el badge del
encabezado del Hogar cuenta `filasReco` (acciones PENDIENTES: `sol-`, `pre-`,
`coord-`). **Son dos verdades distintas y ninguna miente** — «al día» de
cuidado y «tenés 1 cosa por hacer» conviven sin contradicción. Falta
nombrarlo («Cuidado al día») y mostrar el propio conteo del perfil al lado.
⚠️ Al construirlo: `pendientesDe` ya vive en `hogar/index.tsx:1030` —
**conviene subirlo a una lib compartida antes de que el perfil lo
re-implemente**, o las dos pantallas van a contar distinto tarde o temprano.

---

## ④ LA REGLA QUE SIGUE RIGIENDO

**El publish sale UNA vez, completo.** No se pide veda por partes. Con A6 y
A7 bloqueados en otras pistas, la tanda de D está entera salvo esos dos —
y los dos son de sus dueños, no míos.
