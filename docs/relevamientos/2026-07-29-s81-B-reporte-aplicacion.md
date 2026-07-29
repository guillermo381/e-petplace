# S81-B · REPORTE DE LA APLICACIÓN MASIVA — packages/ui, el multiplicador

**Sesión B · 29-jul-2026.** Compañero del censo (`2026-07-29-s81-B-censo-componentes.md`,
commit `f721431`). Commits de aplicación: `788451a` SelectorOpcion ·
`f1c60e1` Tarjeta · `e317f7c` SelectorEspecie · `36d383f` CantoMarca ·
`74a5f1c` verify:diseno con auto-prueba · `2a29b43` micro-curas.

## 1. El burn-down MECÁNICO, con línea base (universo C3 = 102 pantallas)

**Línea base (antes de S81-B): 0 de 102** — no existía lint (D-481) ni ley
aplicada a nivel componente; ninguna pantalla tenía capa mecánica
verificable.

**Hoy: 78 de 102 (76%) con ≥1 capa mecánica cumplida y VIGILADA:**

| Componente aplicado | Pantallas cubiertas | Reparto |
|---|---|---|
| Tarjeta (A6+§7, default `reposo`) | **69** | 27 cli + 42 pre |
| SelectorOpcion (7bis, `naturaleza`) | **27** | 11 + 16 |
| SelectorEspecie (7bis directo) | **4** | 2 + 2 |
| **UNIÓN** | **78 de 102** | |

## 2. LAS 24 SIN CAPA — qué componente las cubriría (el próximo objetivo)

Las 24 son un CLUSTER, no ruido: **las puertas de entrada** — bienvenidas,
login/registro ×2 apps, onboarding (foto/cierre), invitación,
solicitar-acceso, autorización, perfiles de cuenta, y las 3 de
negocio/estadísticas + 2 gallerys (herramienta). Su consumo medido:

- **Boton: 17 de 24 · Encabezado: 15 de 24 · EstadoVacio: 11 de 24** — pero
  los tres están LIMPIOS contra las leyes firmadas: aplicarles ley no
  existe todavía.
- **Campo: 6 de 24** — el ÚNICO de la cola ⚖️ presente ahí. Si el founder
  arbitra A6 sobre Campo (¿el borde del input es affordance o caja?), +6
  pantallas ganan capa. **Es el único movimiento disponible HOY.**
- **El multiplicador REAL de las 24 es §5 LA ENTRADA (45/300, firmada, CERO
  portador en ui):** las 24 son exactamente las pantallas donde una
  primitiva de entrada valdría más — si la entrada firmada gana un portador
  (prop en Encabezado/HeroMarca o primitiva propia), **~15-17 de las 24
  ganan capa de un commit**. Ése es el próximo objetivo que propongo:
  **el portador de §5** — decisión de mesa (el censo lo dejó declarado
  como hueco de sistema), construcción mía al firmarse.

## 3. CantoMarca — nació (`36d383f`)

Cinco sitios firmados en §9.1 = encargo. Anatomía EXACTA del Svg local de C
(3px · rampa turquesa→magenta §8.4 · radius.full · stretch) + memorial
degradado que el local no tenía (Ley 8: sin gradiente, barra serena). Cero
props: el ancho y la rampa son LEY. El Svg de C migra al tocarse (D-318, lo
ejecuta C); los otros 4 sitios lo consumen al construirse. Gate founder:
con su primer consumidor migrado (la galería entra ahí).

## 4. verify:diseno — L-192 MECANIZADA (`74a5f1c`)

Toda regla con modo de fallo corre contra su fixture de violación EN CADA
invocación y tiene que salir roja; si no puede, el lint entero se declara
DECORATIVO y falla solo. R3 es informativa DECLARADA (fuera de la prueba,
con su porqué). **Y la primera corrida real pagó doble:**

1. El ratchet R2 mordió de verdad… un hex EN PROSA (comentario de C,
   `bienvenida-dia1:110`) — **L-170 mecanizada al toque**: el censo despoja
   comentarios antes de contar.
2. La historia del número del baseline, completa: `grep -c` dijo 7
   (contaba líneas), el lint crudo dijo 8 (contaba prosa), sin prosa son
   **4** — *el contador lo mide la herramienta que lo exige* (L-141), y
   quedó sellado en 4, solo-baja.

Reglas vivas: R1 (7bis dura + censo de adopción) · R2 (Ley 1 ratchet 4) ·
R3 (Tarjeta, informativa) · R4 (Ley 20 sombras artesanales, DURA en 0 —
apps y ui nacieron limpios, medido).

## 5. Pendientes con dueño

- **Founder:** el resultado visual del flip de Tarjeta en dispositivo (el
  mayor cambio visual de la sesión — 128 superficies) · el tinte de
  existencia (reserva + especies) · el arbitraje de la cola ⚖️ (Campo es
  el que mueve pantallas) · el portador de §5 (§2 arriba).
- **C:** migrar su Svg local a `CantoMarca` al tocar `bienvenida-dia1`.
- **Mesa:** decidir el portador de §5 entrada; el re-gate del tipo VET si
  pasa a relleno (columnas-contorno recién firmada).
- **B (yo):** los 4 sitios restantes del canto al construirse · el lint se
  ensancha con cada ley nueva aplicada.
