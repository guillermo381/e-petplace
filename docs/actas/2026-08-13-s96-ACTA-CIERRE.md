# ACTA DE CIERRE — S96-EJECUCIÓN (12–13 Ago 2026)

> **LA DESPENSA ENTERA, DE LETRA A PANTALLA — Y EL GATE QUE SE PAGÓ TRES
> VECES.** Cuatro pistas (A: DB + `packages/api` + docs + conducción · B:
> `packages/ui` + marca · C: panel del vendedor + repartidor · D: recorrido
> del cliente). **S96 CIERRA CODE-COMPLETE, NO GATEADA** — la caminata del
> founder quedó bloqueada por el hallazgo del §0, que es lo primero que se
> toca al reabrir. Escribe pista A por orden del founder (13-ago); las
> decisiones llevan su literal.

---

## §0 · 🔴 EL HALLAZGO ABIERTO QUE BLOQUEA EL GATE — Y LA CORRECCIÓN DE UN DIAGNÓSTICO FALSO

**El teléfono del founder no puede consultar el servidor de updates**, y el
cierre queda con esto ABIERTO a propósito (ficha **D-786**, lo primero de la
reapertura). Lo medido, cada cosa del objeto:

- **El lado servidor está VERDE en las cinco preguntas:** binario `bcf6d7f2`
  → Channel `preview` · el canal apunta al branch cuya cabeza es `967ad1ea` ·
  runtime 1.0.5 = 1.0.5 exacto · `updates.url` horneada en el commit del
  build (`f3029182`) · política default ON_LOAD · update Active, sin
  rollback.
- **El binario NO es estructuralmente incapaz:** el pie dice `update
  019ff8b6` = group `d8e0a653` (20:22 hora local) — un OTA real bajado por el
  mecanismo normal.
- **Y sin embargo:** el botón de buscar actualizaciones responde que **no
  puede consultar**, tras cuatro reinicios limpios.

**La corrección, por orden del founder:** el veredicto previo de esta pista
—*«timing, dos reinicios y listo»*— **fue FALSO**. El dato del botón lo
falsea: no es coincidencia de horarios, es que el teléfono no alcanza el
servidor. **No se diagnostica acá** (la orden: escribir lo medido, no
adivinar). Y **D-785 se queda corta y su ficha ya lo dice**: si el mecanismo
de consulta puede fallar en silencio y solo se entera quien aprieta un botón
escondido, el problema es más profundo que el indicador.

Consecuencia operativa: los dos últimos OTA del cierre (`3debd5c4` el GPS ·
`967ad1ea` el camino §0bis) están publicados con ancla limpia **y el founder
no puede recibirlos** — por eso esta acta declara code-complete y no gateada.

---

## §1 · POR PISTA — qué se construyó, qué se midió y contra qué, qué queda

### Pista A (DB + packages/api + docs + conducción)

**Construido:** **13 migraciones M11→M23** (`20260812220000` →
`20260813030000`), las trece con reversa escrita ANTES, cinturón con camino
real y residuo 0 — la composición con sus CUATRO estados
(`verificada · declarada_sin_verificar · ausente · no_aplica`, CHECK +
trigger de caducidad + puerta `declarar_composicion_estado`) · la composición
contra la ficha del PAÍS (`composicion_mercado`) · el vocabulario de
alérgenos (**23 entradas medidas letra=base** + `cat_alergeno_relaciones`
`es_un`/`puede_ser` + expansión `expandir_alergenos_a_vigilar` con voz) · el
entendimiento de alergia append-only POR ESTRUCTURA (M13/M18 — el juez 45
cazó el default privilege heredado) · la oferta expone su vendedor (M12) ·
la expiración de cabeceras sin pago (M19, cron horario, vía máquina) · **la
separación del catálogo canónico (M21)** — `proponer_producto_canonico` solo
e-PetPlace, `proponer_sku_vendedor` angostada a MAPEO, stock por ledger
(☠️ D-780 nació y murió el mismo día) · **el brazo del empleado (M22)** —
cura del hallazgo ① del gate, muerto desde S91 · **el track del reparto
(M23)** — ventana estricta `hacia_destino`, forma `{lat,lng,t}` del paseo.
**294 migraciones local = remoto.** Wrappers: catálogo (exclusión por
conjunto EXPANDIDO, fail-closed), `misCuentasComerciales`, el brazo (2)
muerto con lápida, `registrarTrackEnvio`, códigos tipados. El cargador con
composición/mercado/sinónimos. **Tres seeds del gate por las puertas
reales** (legado · accesos · cuenta PURA con la arena estrenando
`no_aplica`). El instrumento `repro-gate-blanco.mjs` — el que dio verde a
las tres curas del gate.

**Medido y contra qué:** juez con **48 invariantes: 47 verdes / 1 rojo
HEREDADO** (inv.10 / D-760 — no se ablandó; el inv.20 se enmendó CON LETRA
citada, exención del panel, jamás para que pase) · cada cura del gate
re-medida por el MISMO instrumento que produjo el rojo · el cinturón de M23
cazó a su propio test sobre-prometiendo («la invertida rebota» es imposible
por rango en Quito — se corrigió el instrumento, no el motor).

**Pendiente y por qué:** D-786 (§0 — no se diagnostica sin medir) · el
cierre canónico se transpone CON esta acta · la migración de llaves es
precondición del próximo build (D-784, no de hoy).

### Pista B (packages/ui + marca — declarado por su pista; su acta manda en el detalle)

`AvisoAlergia` ensanchada a los CUATRO estados con veda coordinada (su
CLAUDE.md corrigió el «TRES» el mismo día, con marca ⏪) · la tanda de marca
sobre la build 1.0.5 (el splash del prestador — D-781 con su candidata «el
nombre del token no es el token») · contador re-medido L-141: **63
componentes**, R17 del propio lint, WCAG 178/0.

### Pista C (el panel del vendedor + el repartidor)

**El panel entero:** la escalera de CUATRO escalones (preparado · empacado
con lote · despachado con factura REGISTRADA · entregado con foto + código)
· la pantalla del repartidor con TRES acciones y su regla de lectura (su
envío y nada más) · la venta de mostrador con código de reclamo. **Las tres
curas del gate, cada una verde por el instrumento:** el puro entra por la
raíz (`b79bc291`) · el muro de titularidad habla y convive con la tarjeta
propia (`d48313ab`) · el camino §0bis en el HOY del no-gestor (`45b5f0cd`,
con la secuencia de mesa: declaró forma y choque ANTES de construir). **El
GPS cableado (`8558e34a`)** con los tres hallazgos de la herencia: el `t`
ISO-vs-epoch (curado en la costura), **el destino persistido para el restore
headless** (sin él, el buffer del envío se reinyectaba contra la puerta del
paseo para siempre), y el re-export faltante (agregado y DECLARADO, firmado
por A). **Y el freno del selector** — Ley 23 con caso medido, ratificado por
el founder (D-783).

### Pista D (el recorrido del cliente — declarado por su pista)

El recorrido de compra entero: el tab de la despensa, el checkout con
destino POR ÍTEM (mascota/donación), **el reclamo del código de mostrador —
lo ÚNICO del cierre verificado en dispositivo por el founder: funcionó, con
evento al expediente** — la recurrencia con aviso previo, las direcciones
con Places y pin obligatorio movible, los cinco avisos. Su pedido de voz de
alérgenos a A se ejecutó el mismo día (M-expansión con voz).

---

## §2 · LAS DECISIONES DE LA MESA, con su literal

1. **El corte función/diseño:** *esta tanda cierra FUNCIÓN; el diseño va a
   sesión propia.* Lo visual se ARCHIVA con literal, no se rutea.
2. **Karina EN PAUSA** — su lectura a ciegas no se repite; sus dos pedidos
   (P-20260813-a07009 / -ad2aef) quedan intactos esperándola.
3. **El selector FRENADO (D-783):** *«nace cuando exista la primera cuenta
   vendedora medible más allá de la propia — lector DEFINER + elegirCuenta +
   la Hoja, en tanda A+C»*. Y la nota de método firmada: *frenar con
   medición no deja hueco: deja de construir a ciegas.*
4. **Las llaves (D-784):** NO se rota hoy (la legacy comparte JWT secret con
   la anon horneada en los DOS APK); migración a llave publicable en el
   PRÓXIMO TREN DE BUILD como precondición dura. **Con la condición que se
   revierte sola, en la ficha:** *si ese transcript sale de la máquina por
   cualquier vía, el reset se hace en el acto aunque rompa lo que rompa.*
5. **El GPS del repartidor DE VUELTA A v1** (☠️ D-770 muere de verdad):
   elevación antes de construir, cero build (el plugin ya estaba horneado),
   herencia entera del paseo. El mapa de la familia sigue en v2 POR LETRA.
6. **§0bis — la lámina de la barra ENMENDADA POR INCOMPLETA:** *«la entrada
   a la propia venta de productos NO pasa por el tab de gestión»* — con sus
   tres límites (no abre Negocio al no-gestor · no muestra gestión ajena ·
   no toca el muro). Su tesis original sigue en pie.
7. **El catálogo canónico SEPARADO de la oferta (M21):** *el catálogo es de
   e-PetPlace; del vendedor se prende disponibilidad; sumar un vendedor es
   MAPEO, no autoría.*
8. **Los TRES estados de composición y después el CUARTO** (`no_aplica` — a
   una arena no se le piden ingredientes); solo `verificada` y `no_aplica`
   callan, y `verificada` exige la ficha del PAÍS (global jamás la
   sostiene — caso Royal Canin Hepatic).
9. **El vocabulario de alérgenos: de 11 a 23 CON RELACIONES como dato**
   (la orden nombraba 22; el depósito midió 23 contra la base y letra=base):
   `ave_no_especificada puede_ser` pollo/pavo/pato · bisonte/búfalo `es_un`
   res · jabalí `es_un` cerdo · moluscos_crustaceos UNA entrada · **pollo,
   pavo y pato JAMÁS se agrupan** (dieta de eliminación) · la advertencia
   imprecisa SE DICE con tono que no baja.
10. **La alergia ADVIERTE, no esconde** — exclusión dura en la
    recomendación, advertencia dura en la búsqueda, entendimiento
    registrado append-only.
11. **Taste of the Wild (el #5, Bisonte y Venado) FUERA del lanzamiento**
    salvo confirmación del vendedor — el motivo cambió entre las dos firmas
    del mismo día: de «falta la foto» a **«NO HAY CAMINO DE VERIFICACIÓN»**
    (el importador que la marca publica no lo trae a Ecuador). El founder lo
    pregunta en la reunión; su lugar lo toma un producto que el vendedor
    confirme.

---

## §3 · LA LECCIÓN DE MÉTODO DE LA JORNADA, con nombre

> **Los tres hallazgos del gate los encontró CAMINAR, no medir.** El brazo
> del empleado muerto desde S91 · el vendedor puro sin camino · el
> empleado-vendedor con puerta y sin camino. **Ninguno lo vio un typecheck,
> un lint ni un juez.** Los tres son la misma clase: *un camino que nadie
> recorrió, sin síntoma hasta que alguien real lo pisa.*

**Y su hermana, que apareció CUATRO veces el mismo día — cosas que
informaban sin informar:** la pantalla en blanco (el fallo sin cara) · el
título que mentía la causa («sin sesión» sobre un 42501) · **el apuntador
que no se puede cotejar** (UUIDv7 comparte prefijo por diseño: `019ff8b6` vs
`019ff8db` difieren en dos caracteres del final — cuatro reinicios con el
número correcto en pantalla sin poder saberlo) · **y el push de esta pista
que dijo «OK» sin haber llegado a main** (un merge no-op en el worktree
equivocado; lo cazó verificar contra el objeto, no el mensaje de éxito).

**Registrado además:** la **triple coincidencia sin coordinación** — A, B y
D llegaron a la misma conclusión leyendo la misma letra, cada una por su
lado (la letra firmada como fuente única funciona: tres lectores
independientes convergen) · y **los ciclos pedido→ejecución cerrados EN EL
DÍA** (la expiración de cabeceras que pidió C · la voz de la expansión de
alérgenos que pidió D — las dos entraron al motor la misma jornada, por la
puerta del pedido autocontenido).

**ADDENDUM DE LA REAPERTURA (13-ago, orden de mesa) — el huérfano que no
existía:** dos pistas midieron el MISMO árbol sucio en momentos distintos y
las dos concluyeron «no es mío». Las dos tenían razón sobre lo suyo: el
`juez-s96.mjs` modificado era el trabajo vivo de B sobre D-760 (hoy
commiteado en `49adb65a`) y el `DEUDAS_CANONICAS.md` sucio que B declaró
ajeno era la nota de D-781 de A sin commitear. **Un árbol compartido fabrica
huérfanos que no existen** — una orden llegó a nacer para «archivar y
restaurar» un archivo que tenía dueño, y ejecutarla habría revertido una
cura. **El único instrumento que lo desarma es la declaración en la puerta,
que B hizo.** (Cruce con D-769: la evidencia de esa ficha sigue creciendo.)

**REGISTRO DE MÉTODO DE LA REAPERTURA (13-ago, orden de mesa):** B entregó
su censo con **dos defectos propios declarados**, el primero de ellos un
**subconteo silencioso que daba totales plausibles y falsos** (17/15/11/11
contra 22/18/13/15 reales), **cazado por cotejo con método independiente
antes de reportar**. Un instrumento que subcuenta en silencio es de la misma
familia que las cuatro «cosas que informaban sin informar» de S96 — **y la
única defensa medida que tenemos contra ella es el cotejo por segundo
método, no la revisión del propio código.**

**SEGUNDO ADDENDUM DE LA REAPERTURA (13-ago, corrección de la mesa a su
propia premisa):** una orden de mesa citó **D-513** («su motor no existe»)
como razón vigente de que el toggle Administrador no se ofrece en la
pantalla de equipo. **Esa razón CADUCÓ el 5-ago-2026 con D-660** — el
propio código lo declara (`equipo.tsx:1024-1029`): la razón vigente es de
LETRA (S74: solo el TITULAR nombra administradores, con el aviso de §6) más
una lámina que no existe. **Y el corolario, que es lo que vale registrar:
hay motor administrativo CONSTRUIDO y no hay puerta para nombrarlo. Un motor
sin puerta es tan mudo como una puerta sin motor — y no lo reporta ningún
instrumento, porque nada está roto.** (Los flags de administrador de la
siembra de prueba se ponen directo en base a propósito: sirven para medir en
la caminata qué puede hacer un administrador que un miembro común no pueda.)

---

## §4 · EL ESTADO REAL, SIN MAQUILLAR — qué está verificado y qué NO

**Verificado por instrumento (casi todo):** el juez 47/48 · las tres curas
del gate por el repro web con la cuenta real · los cinturones de las 13
migraciones con camino real y discriminador · los typechecks y
verify:diseno en cada merge · las anclas de OTA leídas del objeto con
`update:view`, todas `dirty=None`.

**Verificado EN DISPOSITIVO por el founder (dos cosas, solo dos):**
- **El reclamo del código de mostrador** — funcionó, con evento al
  expediente.
- **Una navegada rápida del frente cliente.**

**NO VERIFICADO EN DISPOSITIVO (la lista completa, sin achicar):**
- la escalera completa del panel del vendedor (preparado → entregado)
- el GPS del reparto en la calle
- el camino §0bis del no-gestor
- el vendedor puro
- las dos advertencias de alergia con el ojo
- el pin movible de direcciones
- el barrido de la puerta

**⇒ S96 CIERRA CODE-COMPLETE, NO GATEADA.** Y la causa de que la lista NO
verificada sea tan larga tiene nombre: §0 — los OTA del cierre no llegan al
teléfono.

---

## §5 · LO QUE QUEDA VIVO, POR DUEÑO

**Del founder:** la caminata del gate (bloqueada por D-786) · las dos listas
de la caminata (función acá, visual al archivo) · Karina · la pasarela
(D-764, que además bloquea la recurrencia D-778) · los seis del lanzamiento
(el reemplazo del #5 con el vendedor) · el vendedor confirmado (D-766, ahora
con DOS cuentas de prueba que borrar) · D-751 (la respuesta escrita de
VTEX).

**De Cowork:** la recategorización del catálogo sobre el vocabulario firmado
(las migraciones que la bloqueaban ya están aplicadas).

**De las pistas, al reabrir:** **D-786 PRIMERO** (el teléfono que no puede
consultar — bloquea todo lo demás) · la sesión de diseño (todo lo archivado
con literal) · la migración a llaves publicables como precondición del
próximo build (D-784) · D-760 (el rojo heredado del juez) · D-776 (el primer
barrido real de fotos de entrega) · D-782 (el splash del cliente).

---

## §6 · EL BARRIDO DE VERIFICACIÓN DOCUMENTAL (orden §6 del cierre) — la lista COMPLETA, verdes incluidos

Recorridos abriendo cada uno, no de memoria. **Tres desalineaciones, las
tres CURADAS EN LA MISMA PASADA:**

| Documento | Veredicto |
|---|---|
| `MODELO_DESPENSA` v2.3 | ✅ al día — cuarto estado (4 menciones) · vocabulario 23 con relaciones · `composicion_mercado` §6 · TOW #5 con su salida marcada EN §4.3 y el motivo enmendado en el lugar · GPS v1 (§8 y la fila de D-770) · los seis por SKU |
| `LAMINA_BARRA_DE_TRES` | ✅ al día — §0bis con la letra verbatim + advertencia en la puerta |
| `LETRA_PANEL_VENDEDOR_S96` | ✅ al día — la enmienda del GPS marcada en sus CUATRO lugares (§0.6/§5/§8/§12) y el Historial registra la enmienda (el «GPS va a v2» de la línea 391 es historial de la v1.0, seguido de la entrada 🔴 ENMENDADA) |
| `LETRA_RECORRIDO_DESPENSA_S96` | ✅ al día — cero contradicciones con firmas posteriores (grep de estados/tab/TOW en cero) |
| `DEUDAS_CANONICAS` | ✅ D-770 muerta de verdad · D-780 muerta el mismo día · D-783/784/785 con su letra · D-782 · D-785 con el addendum «se queda corta» · D-786 depositada · todas las de hoy con ficha — **⚠️ D-766 estaba CORTA: nació la segunda cuenta de pruebas (Tienda Pura) y la ficha nombraba una → CURADA con addendum (el día del borrado son DOS cuentas)** |
| `docs/contratos/s96-contrato-motor.md` | **⚠️ se cortaba en M21 → CURADO**: addendum §7 con M22 (brazo del empleado), M23 (track con ventana estricta y su honestidad de alcance) y la siembra pura |
| Acta de enmiendas S95 (línea D-755) | **⚠️ heredaba «dos botones» sin puntero → CURADA** con nota posterior marcada y fechada (el acta no se reescribe; la nota dice QUÉ la enmendó y dónde vive la letra vigente) |
| Acta de CIERRE S95 | ✅ limpia — no contiene la frase (verificado por grep, «dos botones» y «preparado, despachado» en cero) |
| `packages/ui/CLAUDE.md` | ✅ al día — contador 63 re-medido L-141, y la entrada «TRES estados» lleva su marca ⏪ de corrección del mismo día |
| `packages/api` | ✅ sin CLAUDE.md propio — nada que desalinear |
| `apps/{prestador,cliente}/CLAUDE.md` | ✅ punteros finos a AGENTS.md, sin contadores que decaigan |
| «dos botones» en documentos VIGENTES | ✅ cero sin marca: `MODELO_DESPENSA` tachado ×2 · ficha D-755 enmendada · el único resto era el acta de enmiendas (curada arriba) |

**Nota de conteo declarada, no escondida:** la orden del cierre dice
«vocabulario de 11 a 22»; la letra Y la base dicen **23** (medidas una
contra otra en esta pasada: letra=base). La diferencia es del arbitraje del
depósito (moluscos_crustaceos como UNA entrada y los desdobles de relación);
si el founder quiere 22, es una decisión nueva — hoy no hay desalineación
entre letra y objeto.

---

## Operativo

**13 migraciones** (M11→M23) · **294 local = remoto** · juez 47/48 (rojo
heredado D-760) · **build 1.0.5 prestador `bcf6d7f2`** (ancla `f3029182`) ·
**OTAs prestador runtime 1.0.5**: `c9e76f27` → `f9fbfaa8` → `77a90820` →
`d8e0a653` → `3debd5c4` → **`967ad1ea` (cabeza del branch, ancla `78b07d82`,
dirty=None)** · cliente runtime 1.0.3: `22db17f7` → `3743c536` · **el
dispositivo del founder quedó en `d8e0a653`** (§0). Fichas D-780 → D-786.
`MODELO_DESPENSA` v2.3 · lámina §0bis · contrato de motor §7 · las tres
curas del barrido. Todo en origin con verificación por contenido.

— pista A, 13-ago-2026, por orden de cierre del founder.
