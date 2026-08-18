# ACTA DE APERTURA — S100b · LA VUELTA DE LA FORMA

> **Estatuto: abierta por mesa el 17-ago-2026, tras el gate del founder sobre la OTA de S100
> (bundle 9baed84a · main 7bb4c6b7).** S100 NO está cerrada: S100b es su segunda vuelta.
> **El registro completo del gate vive en `docs/loop/S100-GATE-FOUNDER.md` (16 hallazgos, G-01…G-16).**

## §1 · POR QUÉ HAY UNA SEGUNDA VUELTA

El gate no pasó. **No por lo que falta —eso estaba medido y declarado— sino por cómo se ve lo que hay.**
Trece de los dieciséis hallazgos son de forma pura.

**La causa es de método y la mesa la asume:** S100 midió todo y miró poco. Las cuatro pistas verificaron
por instrumento con disciplina ejemplar, y **ninguna vio una pantalla**. El toque 2 de la Dirección de
Diseño —el ojo sobre la pantalla real en dispositivo, firmado en `DIRECCION_DISENO_S99` §1— **nunca
ocurrió en toda la sesión**, porque ninguna pista tenía aparato. Por eso trece hallazgos de forma
llegaron hasta el founder en vez de morir en B.

**LA CURA ESTRUCTURAL DE S100b: B TIENE APARATO.** El celular del founder queda conectado por USB. B
abre la APK instalada y **navega como usuaria real** — no compila: usa. Y navega **Laika en el mismo
teléfono** para contrastar contra la referencia viva, no contra una captura.

## §2 · LA LEY DE LA VUELTA — el hallazgo que ordena todo lo demás

Cuatro hallazgos del gate (G-05 imágenes · G-06 precio · G-07 el + · G-09 donar) **no son cuatro ítems:
son uno.** En los cuatro, **EL CONTROL O EL CONTENEDOR PESA MÁS QUE EL PRODUCTO** — el marco sobre la
foto, el precio sobre el nombre, el + sobre la cosa que se compra, el anuncio sobre la opción.

Lo que el founder llamó *«no se ve delicado, no se ve fino»* tiene causa medible:
**LA JERARQUÍA ESTÁ INVERTIDA A FAVOR DE LO QUE LA APP HACE Y EN CONTRA DE LO QUE LA FAMILIA MIRA.**

> **Si S100b toma esos cuatro como ajustes sueltos, arregla cuatro síntomas. Como uno, arregla la causa.**

**La vara operativa, y es de B:** en cualquier pantalla de la familia, lo primero que el ojo encuentra
debe ser **la mercadería** — la foto y el nombre. El precio segundo. El control (el +, el chip, el botón)
tercero, y presente sin pesar. *Un control que se ve antes que el producto está mal dimensionado, aunque
funcione.*

## §3 · LAS TRES LEYES DE S100 QUE RIGEN LA VUELTA

- **Correr el instrumento contra el objeto, jamás releer el código con más cuidado.** Las tres veces que
  la medición corrigió a quien la hizo, ninguna se veía leyendo mejor (C, S100).
- **Lo que las delata es un número que no coincide con otro** — líneas base, anclas, auto-pruebas. Un
  ratchet sin línea base no tiene con qué contradecirse (B, S100).
- **Ninguna vista alcanza sola.** El caso lo tiene quien consume; el agujero que la forma abre lo ve
  quien construye la pieza. Se pide **con el caso**, jamás con la firma imaginada.

**Y la que S100b agrega:** *un instrumento verde sobre una pantalla fea es un instrumento midiendo otra
cosa.* Ningún `verify` de esta casa mide jerarquía visual. Por eso B mira.

## §4 · EL REPARTO

| Pista | Territorio | Hallazgos |
|---|---|---|
| **B** | Dirección de Diseño **con aparato**. Piezas de `packages/ui`. Mira ANTES (receta) y DESPUÉS (rojo) de las tres. | La ley §2 en las piezas · G-05 · G-06 · G-07 · G-09 |
| **C** | Vitrina y ficha de producto | G-04 · G-02 · G-01 |
| **A** | Carrito, «¿para quién es?», checkout, resumen | G-03 · G-08 · G-10 · G-11 · G-12 · G-13 |
| **D** | Barra de tabs, Despensa de arriba, pedidos | G-14 · G-15 |

## §5 · LO QUE NO SE TOCA EN S100b

Los pagos (S101), `H-007`, `D-738`, y las deudas con dueño registradas en S100. **La sesión es de forma
y solo de forma**, con la excepción de los tres defectos de funcionamiento del gate (G-01, G-02, G-03),
que son rojo y entran.

**Y lo que S100 construyó bien no se reabre:** la compra y su desglose, el trigger de atribución, la
escalera de cuatro nodos, las dos temperaturas de alergia, la búsqueda curada, `envio_eventos` jubilada,
las 43 reglas. Se les cambia la forma, jamás el fondo.

## §6 · LA LECTURA MÍNIMA DE ARRANQUE

`CLAUDE.md` · este acta · **`docs/loop/S100-GATE-FOUNDER.md`** (los dieciséis, con sus dos lecturas de
mesa) · las cuatro bitácoras `docs/loop/S100-{A,B,C,D}.md` · `DIRECCION_ARTE` §12–§13 ·
`DIRECCION_DISENO_S99` (N11–N20 + N11′) · **`docs/diseno/referencias/`** · `MODELO_DESPENSA` ·
`LETRA_RECORRIDO_DESPENSA_S96` **(§6.2 DEROGADA — ver G-16; el motor de fecha programada vive, la puerta
murió)**.

## §7 · EL PROTOCOLO, IGUAL QUE S100

Territorios exclusivos · worktrees propios · commit por pathspec · bitácora `docs/loop/S100b-X.md` por
lote · push a `origin/pista-x` (rutina, sin permiso) · hallazgo ajeno = `H-nnn` con dueño, **jamás se
cura del otro lado** · merge temprano de `packages/*` a main autorizado como procedimiento (acotado,
declarado con SHA, avisado a las cuatro, Metro `--clear` después) · **publicar y migrar frenan y piden
firma** · los cinco frenos de siempre y nada más: dato vivo · plata real · publicar · contradecir letra
firmada · lo sin reversa.

**El gestor del repo es `pnpm`** — se lee del lockfile, no se asume. Territorio ajeno se mide contra
`origin/main` **entero**.
