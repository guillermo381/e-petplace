# Capturas S113-B · 2.1 «el Contanos» · emulador Pixel_10_Pro_XL

Receta de A: `Bundled` fechado **después** de arrancar el Metro usado
(`ARRANQUE5 18:30:30` → `Android Bundled 11767ms (2970 modules)` 18:30:58),
`adb -s emulator-5554`, deep link con el **`&` escapado**, y captura + volcado
tomados juntos borrando el `u.xml` anterior. Sonda **retirada** y verificada
con `git status`: `apps/` intacto.

## Lo que prueban

**🟢 Los cuatro rojos del encargo.** El modal abre igual desde la pastilla y
desde el botón —**es la misma Hoja**, no dos— · la caja libre va **arriba** de
las cuatro entradas · **ninguna voz truncada**, ni con «Constantino» en el
botón · y la ficha cerrada es una **pregunta con su chevron**.

**🟢 Las cuatro entradas quedan parejas**, sin huella: `montaje="control"`, la
cura que salió del emulador en el lote anterior y que viajó a la pieza nueva.

**🟢 En memorial no se dibuja nada** — ni Hoja, ni botón, ni pastilla.

**🟢 Y la pastilla desaparece con cero pendientes** (`04/05`): su firma es su
desaparición, no un «0 por resolver» que ocupa lugar para decir que no hay
nada que hacer.

## 🔴 Lo que el aparato hizo declarar

**Con la ficha cerrada, el slot `cierre` NO se dibuja.** Es correcto como
anatomía —el pie pertenece al contenido— pero tiene una consecuencia de
producto: *si el «Contanos» viviera sólo ahí, la pieza más invitante del
perfil quedaría detrás de un toque.* Por eso el perfil monta además su propio
acceso, y **sin ficha publicada monta el botón solo**. Queda escrito en el
contrato de la prop, que hasta hoy no lo decía.

## ⚠️ Dos capturas sin su control, y cómo se verificó igual

`01/02/03` no muestran la línea `modo=` porque **la Hoja la tapa**: el volcado
de `uiautomator` lista lo visible, y el control quedó detrás del modal. *No es
que el tema no llegara* — se verificó por el mismo camino que la despedida:
el fondo de la Hoja en `02` es el de oscuro, no papel. **Se declara en vez de
dar por bueno un archivo cuyo nombre nadie pudo confirmar.**

## El índice

| archivo | qué prueba |
|---|---|
| `01/02-contanos` | la Hoja: título, caja libre arriba, cuatro entradas parejas |
| `03-propuesta` | la propuesta de Nexo **reemplazando** a la caja, con sus dos salidas |
| `04/05-accesos` | pastilla + botón, un nombre largo sin cortar, y la pastilla en cero **ausente** |
| `06/07-raza` | la ficha cerrada como **pregunta** con la primitiva de chevron |
| `08-contanos-memorial` | **no se dibuja nada** |
