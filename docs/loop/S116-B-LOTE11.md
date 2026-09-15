# S116-B · LOTE 11 — las tres verificadas, y la clase con su gate

**Rama `pista/s116-b-05`.** Gates: `verify:alto-con-texto` **NUEVO, verde con su rojo y sus dos exenciones probadas** · `verify:etiqueta-dentro` VERDE · `verify:diseno` VERDE (80) · `verify:contrast` 504/0 · `verify:catalogo-v5` VERDE (49) · `tsc` 0 en las cuatro.

---

## ① EL MARCADOR, ANTES DE MEDIR — y esta vez en las DOS direcciones

**Lo que bloqueó el lote 10 fue un bundle viejo.** Acá el canal se probó primero: marcador puesto → **281.110 píxeles amarillos**; marcador quitado → **0**. *Confirmar que el cambio LLEGA no alcanza: hay que confirmar que además SE VA, o un marcador que quedó pegado prueba lo mismo que uno que nunca llegó.* Letra del sistema en **1,3** durante toda la medición.

## ② LAS TRES, VERIFICADAS EN PÍXELES

| pantalla | rótulo | valor | razón | hueco | |
|---|--:|--:|--:|--:|---|
| **05** · antes de curar *(rojo del instrumento)* | 9,0 dp | **6,7 dp** | **0,74** | 4,0 dp | ✗ |
| **03** · login, correo largo | 9,0 dp | **29,0 dp** | 3,22 | 5,7 dp | ✓ |
| **alta** · datos básicos | 9,0 dp | **29,0 dp** | 3,22 | 5,7 dp | ✓ |
| **pago** · `CampoIdentificacion` | 9,0 dp | **13,3 dp** | 1,48 | 13,3 dp | ✓ |

📷 `lote11-03-escala13.png` · `lote11-alta-escala13.png` · `lote11-pago-escala13.png` — recortes ampliados ×2.

⚠️ **El «pago» se verificó en la PIEZA, no en la pantalla, y se dice:** `cuenta/datos-facturacion` queda en esqueletos **sin `.env.local`** —que se borra por seguridad al cerrar cada sesión— así que medí `CampoIdentificacion` en la galería. **Es la pieza donde vive «Prueba RUC»** y compone `Campo` por dentro, así que hereda la cura; pero **no es la pantalla**, y eso no es lo mismo.

## ③ 🔴 EL INSTRUMENTO SE CORRIGIÓ OTRA VEZ, Y LO FORZÓ UNA IMAGEN

El piso del valor era **absoluto** (`≥ 14 dp`) y marcó **ROJO sobre un campo que en la captura se veía entero**: el valor era «1712345675», **sólo dígitos, sin una sola descendente**, así que su tinta ocupa menos alto. *Un umbral absoluto no sabe qué caracteres tiene el texto que mide.*

⇒ **El piso pasa a ser RELATIVO al rótulo**, que está en la misma fuente y la misma escala: el valor (15 sp) tiene que dar más tinta que el rótulo (11 sp). **En el caso roto los dos daban 6,7 dp — razón 1,00, que es justamente la firma del recorte.**

⚠️ **Sigue sin ser perfecto** —si el rótulo tuviera descendentes y el valor no, la razón baja— **y por eso el veredicto acompaña siempre al recorte, y el recorte manda.** *Es la cuarta corrección del instrumento en esta ley: por oscuridad, por hueco, por umbral absoluto, y ahora por razón.*

## ④ LA CLASE — el censo, con su número

**72 sospechosos**, de los cuales **30 son la galería** (maquetas) y **42 producto**:

| | sospechosos |
|---|--:|
| `packages/ui` (sin galería) | **31** |
| `apps/cliente` | **11** |

Los que más pesan: `Insignia` (4) · `hogar/index.tsx` (5) · `FichaMascotaHogar` (2) · `FichaPrestador` (2) · y uno cada uno en `Encabezado`, `CampoCodigo`, `CampoFecha`, `CitaEnVivo`, `EscaleraEstados`, `FichaVacuna`, `Hoja`, `LineaDeVida`, `PresenciaCoach`, `StepperCantidad`, `VisorFoto`, `disco-contador`, `EstadoConexion`, `Convivencia`, `Destape`, `BadgeFecha`, `AvisoTeleconsulta`, `BurbujaPendientes`, los tres `*.web` de mapas. **La lista completa con archivo y línea sale del propio gate cuando se pone en rojo.**

**⇒ Entra como TRINQUETE con baseline 31/11, no como cero** — es lo que el encargo pedía decidir con el número. *Curar 42 sitios en una tanda sería tocarlos sin mirar ninguno en el aparato: la forma de convertir un defecto medido en cuarenta y dos defectos nuevos.*

## ⑤ EL GATE — `verify:alto-con-texto`

Marca un `height:` numérico que **es un estilo de texto** (`fontSize`/`lineHeight` cerca) **o que CONTIENE texto**. **No marca**, y cada exención es una forma de estar bien:
- **`minHeight`/`maxHeight`** — *piso, no jaula*: deja crecer, que es la cura.
- **derivado de la escala** (`getFontScale`, `medidas.`) — sigue la preferencia, la otra cura.
- **porcentajes** — no son dp, no se desincronizan.

**Rojo probado y las DOS exenciones también:** un `{ height: 40, fontSize: 14 }` nuevo → ✗ 32 (exit 1) · el mismo con `minHeight` → ✓ 31 · el mismo derivado de `medidas.linea` → ✓ 31. Árbol restaurado.

☠️ **La galería queda fuera con su razón:** sus alturas son cajas de maqueta y no prometen contener el texto de nadie. *Meterlas haría que el número más grande del gate fuera el que menos importa.*

⚠️ **Su verde dice «no nacieron altos fijos nuevos sobre texto», jamás «los que hay están bien».** Lo que prueba que un campo se lee entero es una captura con la letra agrandada — `scripts/tinta-campo.mjs`.

## ⑥ AL BUZÓN
- **mesa** — los 42 esperan priorización **mirando**, no por lista. El gate impide que crezcan mientras tanto.
- **C** — 11 de los 42 son del cliente; el gate los nombra al ponerse en rojo.
