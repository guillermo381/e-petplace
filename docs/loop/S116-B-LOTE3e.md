# S116-B · LOTE 3e — la marca preside o no está

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81) · `verify:contrast` 479/0 · `verify:catalogo-v5` VERDE · `verify:techos-locales` VERDE · `tsc` 0 en las cuatro.

**Firma del founder:** *«la marca aparece donde PRESIDE y en ningún lado donde compita con un texto o un ícono»*. Los tres **pierden la marca, no la achican**.

---

## ① EL TECHO DEL HOGAR — `hogar/index.tsx:654`

📷 `lote3e-hogar-sin-marca.png`

La marca se fue. **El techo ya dice quién sos** con el saludo y la fila de mascotas, y la fila derecha volvió a ser **campana y carrito**, los dos solos.

> *Una marca que hay que achicar para que entre no está presidiendo: está pidiendo permiso.*

⚠️ **Y con ella se fue el `flex: 1` que la envolvía**, que es la parte que no se ve: existía **para empujar los discos contra el isotipo**. Sin marca, `justifyContent: 'flex-end'` hace ese trabajo — *un espaciador que empuja contra algo que ya no está es aire que nadie puede explicar* (Ley 37).

**Medido antes de sacarla (lote 3d):** ocupaba **104 dp — el 29 % del ancho del teléfono**.

---

## ② EL CARNÉ DE VACUNAS — `hogar/vacunas/[mascotaId].tsx:298`

📷 `lote3e-vacunas-sin-marca.png`

**«Las vacunas de Zeus» queda solo.** La cabecera ya identifica la casa; el isotipo al lado del título competía con él.

⚠️ **Y se va con una rama que ya no tenía pregunta:** el montaje era `esMemorial ? 'blanco' : 'gradiente'`. *Esa rama existía para elegir cómo se veía la marca en memorial — sin marca, la pregunta desaparece en vez de quedar sin contestar.*

---

## ③ EL CABEZAL DEL OFICIO — `components/reserva-piezas.tsx:172`

📷 `lote3e-cabezal-oficio-solo-glifo.png` — la fila de arriba: **flecha · glifo del oficio · «Agenda Paseos»**.

🔴 **La cura fue SACAR, no agregar: el glifo ya estaba puesto.** Acá vivían los dos —`<Icono nombre={oficio} registro="capa" />` adelante y el isotipo teñido a 20 px detrás—, con el comentario que lo decía: *«el glifo del oficio ADELANTE; el isotipo TEÑIDO detrás de él»*.

> **El isotipo era un adorno detrás de la pieza que de verdad informaba.**

**En el color de siempre:** `registro="capa"` tiñe el glifo con el color de su capa, que es el que la fila usa desde que existe — **no se tocó**.

---

## ④ LO QUE QUEDA, y lo que NO nació

**`IsotipoV5` se queda en DOS lugares, y los dos presiden:**
- `app/index.tsx:168` — la lámina de arranque (`protagonista`)
- `app/invitacion.tsx:128` — centrado y solo. **Medido: 105 × 67 dp.** *Se ve bien porque no compite con nada.*

☠️ **NO nació ningún calibre chico de `IsotipoV5`**, por firma. *Y conviene que quede escrito por qué no hizo falta: el problema nunca fue que la marca fuera grande — era que estaba en tres lugares donde no presidía.* **Achicarla habría dejado los tres casos en pie, más chicos.**

⚠️ **Si algún día hace falta un calibre chico, es dirección de arte y se decide entonces** — con el mismo criterio que el gate de 21 px fijó para los glifos: *cuánto puede achicarse un dibujo antes de dejar de leerse no se deduce, se mira.*

**Censo final: `grep "<Isotipo " apps/cliente/src` → 0.** El dibujo viejo no está en ninguna superficie del cliente.
