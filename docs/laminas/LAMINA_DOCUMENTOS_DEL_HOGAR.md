# LÁMINA — LA CASA DE LOS PAPELES (cliente)

> **✅ LETRA FIRMADA POR EL FOUNDER — 6 de agosto de 2026** (firmas sobre
> capturas, orden 7 a la pista D). Depositada en `docs/laminas/` como
> manda la ley de la casa; **construida en el mismo acto** porque la
> letra vino firmada, no propuesta.
>
> **La letra, verbatim de la orden:**
> ① *el perfil de mascota: Documentos como sección **desplegable**,
> filas con **ícono CTA de descarga** (muere el botón tapiz).*
> ② *Cuenta: nueva pantalla **Documentos del hogar** — todos los papeles
> de la familia, filtro por mascota en **chips con pata pisando** (el
> patrón vivo de selección). Los documentos crecen (receta,
> certificados vienen): **la lista se deriva del catálogo de papeles,
> jamás a mano**.*

---

## 1 · LAS DOS SUPERFICIES, y por qué son dos

| dónde | qué muestra | por qué existe |
|---|---|---|
| **Perfil de mascota** → sección `Documentos`, **PLEGADA** al entrar | los papeles **de esa** mascota | el perfil es de la mascota; sus papeles se piden, no presiden |
| **Cuenta → Documentos del hogar** | **todos** los papeles de **todas** las mascotas, con filtro | con tres mascotas, buscar una historia clínica obligaba a entrar a un perfil. Ésta es la casa |

*No se duplica la lista: las dos superficies consumen la MISMA pieza
(`components/fila-documento.tsx`) y el MISMO catálogo derivado — dos
consumidores, una anatomía.*

## 2 · LA ANATOMÍA DE LA FILA (☠️ muere el botón tapiz)

```
┌──────────────────────────────────────────────┐
│  [glifo]   Carnet de vacunas          [CTA]  │
│            Descargar PDF                     │
├──────────────────────────────────────────────┤
│  [glifo]   Historia clínica           [CTA]  │
│            Descargar PDF                     │
└──────────────────────────────────────────────┘
```

**Qué murió y por qué:** los dos `Boton variante="sinCaja" bloque` que
S89-A dejó en el perfil. **Un botón a ancho completo por papel no
escala** — con receta y certificados serían **cuatro tapices apilados**
en el perfil de la mascota. La fila con glifo es lo que la casa usa
para listas (la ley del contorno transparente, 19.7: por superficie UN
sólido; el resto baja a fila).

**El glifo de la izquierda es el del PAPEL** (el objeto), del catálogo:
`carnet` para el carnet, `documento` para la historia clínica.

## 3 · 🔴 EL GLIFO DEL CTA NO EXISTE — PEDIDO AUTOCONTENIDO A B

**Medido en el registry (`packages/ui/src/components/Icono.tsx`,
6-ago): no hay `descargar`.** El vecino más cercano es `compartir` («la
flecha que SALE de la bandeja»), que significa **otra cosa** — y
prestarlo es la **sustitución genérica que la Ley 12 prohíbe**; el
propio archivo registra tres frenos idénticos por esa razón
(lápiz/compartir r7 · vacuna r10 · bitácora r34).

> **PEDIDO A B (76b — texto autocontenido, no hace falta leer nada
> más):** nace el glifo **`descargar`** para el registry de
> `packages/ui`. **Qué nombra:** el ACTO de bajar un papel a mi
> teléfono (jamás compartirlo con un tercero — ése es `compartir`, ya
> ocupado). **Dónde se monta:** a la derecha de la fila de documento,
> **21 px**, tinta `accent.control`, en las dos superficies de esta
> lámina. **Su gate:** por ícono a 21px (§2.9 DIRECCION_ARTE), como
> todo glifo nuevo. **Categoría:** glifo de CONTROL — la misma familia
> que `lapiz`/`compartir`, cuya letra (§6bis) sigue PENDIENTE desde
> S78; este pedido no la escribe.

**Qué se construyó mientras tanto, sin mentir:** la prop `iconoCta` ya
está cableada (hoy `null` ⇒ no se dibuja) y **el acto lo dice la VOZ**
— «Descargar PDF» bajo el nombre del papel. *Affordance honesto: un
glifo que significa otra cosa habría sido peor que ninguno, y el label
de accesibilidad ya lleva el acto entero.* **El día que B entregue el
glifo, se monta en UNA línea.**

## 4 · 🟠 EL CATÁLOGO DE PAPELES NO EXISTE EN EL MOTOR — PEDIDO A A

**Medido contra la DB viva (6-ago):** no hay `cat_documentos_mascota`.
`cat_tipos_documento_titular` es otra cosa (CEDULA · PASAPORTE · RUC,
identidad del titular) y `prestador_documentos` /
`criadero_documentos` / `seller_documentos` son de otros actores. **El
vocabulario de papeles vive HOY en un CHECK** de `documento_token`
(`carnet_vacunas` · `historia_clinica`) y, del lado TS, en el union
`TipoDocumento` del contrato.

**Un CHECK no es catálogo:** no se lee por PostgREST, no tiene voz, ni
orden, ni metadata, ni forma de decir «este papel aplica a esta
especie» o «este es de pago».

> **PEDIDO A A (sin bloquear nada — la superficie ya vive):** un
> catálogo `cat_documentos_mascota` (código · voz · orden · activo),
> como los otros catálogos de la casa. **Disparo firmado: el TERCER
> papel** (receta o el primer certificado) — con dos, la derivación
> por tipo alcanza; con tres empieza a doler que el orden y la voz
> vivan en el cliente.

**Lo que se construyó mientras tanto, y por qué CUMPLE la letra
«jamás a mano»:** `apps/cliente/src/lib/papeles.ts` deriva del union
del contrato con un `Record<TipoDocumento, …>` **exhaustivo**. No es
una lista suelta: **es una lista que no se puede olvidar**.

> ### **PAR 2/2 — EL ROJO ESTÁ PRODUCIDO, no supuesto**
> **Brazo 1** (discriminador): se inyectó `receta` en el union del
> contrato de A → `tsc` **FALLA nombrando el archivo y el faltante**:
> ```
> src/lib/papeles.ts(40,7): error TS2741:
>   Property 'receta' is missing in type '{ carnet_vacunas…; historia_clinica…; }'
>   but required in type 'Record<TipoDocumento, Omit<Papel, "tipo">>'.
> ```
> **Brazo 2**: contrato restaurado byte a byte (`git diff` vacío) →
> `tsc` **EXIT=0**.
> *Un papel nuevo NO PUEDE llegar mudo ni sin glifo: el build se planta
> hasta que alguien decida su voz. Eso es lo que «jamás a mano» tenía
> que garantizar — no que nadie escriba, sino que nadie se olvide.*

## 5 · EL FILTRO CON PATA — cero componente nuevo

`FiltroMascotas` de `packages/ui` (chips con avatar + `MarcaEleccion`,
la PATA que pisa lo elegido — S82 r37, promovido en S85-B7). **Es el
patrón vivo que la letra pide y ya lo usa el log del Hogar.**

- Se dibuja **solo con 2+ mascotas**: con una, una hilera de un chip es
  ruido.
- **Sin chip activo = todas** (el chip «Todas» murió, el comportamiento
  no — contrato de la pieza).

## 6 · LOS ESTADOS (Ley 13 — ninguno miente)

- **Cargando**: esqueleto de dos filas, jamás spinner suelto.
- **Vacío honesto** (sin mascotas): «Todavía no hay papeles · Cuando
  agregues una mascota, sus documentos van a vivir acá».
- **Error de carga**: lo dice, con reintento por el camino de la casa.
- **Fallo al pedir el papel**: `mostrar({variante:'error'})` con el
  mensaje del wrapper — **un toque jamás se queda sin respuesta**.
- **Descarga en vuelo**: la fila se atenúa y se deshabilita **por
  mascota+papel** (dos filas distintas no se pisan el spinner).

## 7 · LO QUE ESTA LÁMINA NO RESUELVE

- **El gate en dispositivo** — pendiente (las dos superficies, claro /
  oscuro / memorial, y el desplegable con el pulgar).
- **La voz del lote** (`documentos.*`, es+en ya construidas) — son
  **candidatas** al próximo lote de firma, como todo string nuevo.
- **El glifo `descargar`** (§3) y **el catálogo de motor** (§4).
- **Los papeles que vienen** (receta · certificados): cuando existan,
  aparecen **solos** en las dos superficies — y si llegan sin voz, el
  build lo dice.

**Origen: S89-D orden 7 · letra firmada del founder · 6-ago-2026.**
