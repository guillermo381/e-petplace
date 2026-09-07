# Capturas S113-B · 2.2.3 «Las acciones son una lista»

Receta: Metro en **el puerto propio de B (8092)**, emulador `5554` (el `5556` es
`s113_A`, intacto). Modo por el control de la pantalla. Sonda retirada, `apps/`
en cero, `router.d.ts` regenerado.

> ⚠️ **El `Bundled` de esta corrida dijo `130ms · 1 module`** —sospechosamente
> barato para un worktree nuevo—. *Un `Bundled` prueba que MI Metro compiló, no
> que el aparato muestre lo mío.* El discriminador fue **algo mío en pantalla**:
> el volcado trae `Pasaporte y QR`, `Documentos` y `Cuéntanos`, que no existían
> antes de este lote.

## Lo que prueban

**🟢 Las cuatro acciones nuevas**: Citas · Pasaporte y QR · Documentos ·
Cuéntanos. **Nexo ya no está** — y con él se fue el único miembro que se
dibujaba distinto.

**🟢 «Pasaporte y QR» envuelve en dos líneas y no se corta.** *Una etiqueta
cortada obliga a tocar para saber qué era.*

**🟢 La apagada dice su razón al tocarla** — medido, no supuesto: tras el toque
el volcado trae `razón dicha: Todavía no activaste su placa`. Y se dibuja
**atenuada, no ausente**: *un botón que desaparece deja a la persona sin saber
que existía.*

**🟢 TRES también es legal** (segunda fila). No es una concesión: es el caso que
la pieza ya producía cuando memorial escondía a Nexo.

**🔴 En memorial se dibujan las CUATRO**, y eso es la pregunta abierta hecha
visible: la excepción de memorial era **sobre el Coach**, no sobre la posición,
y murió con él. *¿«Cuéntanos» corresponde en un duelo?* Es del founder; la pieza
hoy dibuja lo que le den.

## 🔴 Para C, antes de montar: el glifo del pasaporte NO EXISTE

Medido en el registry: **no hay `pasaporte` ni `qr`**. En las capturas usé
`carnet` como marcador, y **se ve mal a propósito de mostrarlo**: leído en la
fuente, `carnet` es **un lápiz escribiendo** (`Icono.tsx:746`) — sirve para
*«completar el carnet»* y al lado de «Pasaporte y QR» lee **editar**.

Parientes vivos: `carnet` · `documento` · `documentos` · `datos` · `compartir`.
*Un glifo nuevo no se improvisa: pasa por su hoja de contacto y su gate por
ícono* (`DIRECCION_ARTE` §6b).

## El índice

| archivo | qué prueba |
|---|---|
| `01-acciones-claro` | cuatro y tres, la apagada con su razón dicha |
| `02-acciones-oscuro` | lo mismo en oscuro |
| `03-acciones-memorial` | las cuatro se dibujan: la pregunta abierta |
