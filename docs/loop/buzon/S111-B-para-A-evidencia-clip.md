# S111-B → A · `EvidenciaClip`: el clip del durante, con la guía que no se esconde

**Rama:** `pista/s111-b` · **HEAD:** `4aeab1a85251e00bd812335ba92a6f5f5acd5911`
**ALCANCE (L-463):** `packages/ui/src/components/EvidenciaClip.tsx` (nuevo) ·
`packages/ui/src/index.ts` · `packages/ui/src/gallery/TokenGallery.tsx` · este
buzón. **Cero DDL · cero `apps/` · cero cola nueva · cero dependencia nueva.**

## LA LEY QUE CARGA

**La guía de encuadre NO desaparece al empezar a grabar.**
`CRITERIO_LEGAL_GUARDERIA` §5 es **ley de captura**, no ayuda contextual. La
convención del video limpia la interfaz al apretar REC; **acá eso sería el
error**, porque el segundo en que la guía importa es el segundo en que se está
encuadrando. Un encuadre mal tomado no se corrige después.

Cero texto legal adentro: las reglas entran como `{ clave, voz }` — la clave es
el código de `encuadre.ts`, **la voz la pone el diccionario y la lee el founder
en su lote** (§0 del plan prohíbe redactar legales en las pistas, placeholder
incluido).

## TRES DECISIONES MEDIDAS, NO ELEGIDAS

① **No monta la cámara.** Medido: `packages/ui` no tiene `expo-camera` ni en
deps ni en peers, ninguna pieza lo importa, y **`apps/cliente` TAMPOCO lo
tiene** ⇒ un import duro **rompería el bundle del cliente**, y por nativo **ni
se arreglaría por OTA**. `vista` es slot.

② **`techoSeg` sin default.** El número vive en la cola (`CLIP_TECHO_S`) y su
módulo dice *«acá vive el número para que no haya dos fuentes»*. Un default acá
sería la segunda, y el día que la cola baje el techo **la pantalla dejaría
grabar de más y el servidor rebotaría el clip ya grabado**.

③ **Cero cola nueva.** El multi-destino **ya existía**: `ItemMedia.mascotaIds:
string[]`, con su firma ① del founder. La pieza junta y entrega **un array**.

## CUATRO ROJOS, TODOS DISCRIMINANTES

`grabando` sin `inicioTs` · `reglas: []` (**grabar sin guía no compila**) ·
`techoSeg` ausente · `onPublicar([])`. **Lo legal compila.**
Y el typecheck se probó con **CONTROL POSITIVO** —error inyectado— porque *un
verde de un archivo que no se compila es un verde falso*.

**Gates:** typecheck 0 · `verify:contrast` **391/0** · `verify:diseno` **VERDE 62**.

## ⚠️ LO QUE MEDÍ DE MI CONSUMIDOR, Y ES LO QUE HAY QUE SABER

**a) La pieza NO tiene consumidor todavía, y no es olvido.** El único que usa
`useCapturaMedia` hoy es `hoja-acta-guarderia.tsx`; **`dia.tsx` no captura clips
en ninguna forma**. El hook, la cola y `ContadorClip` existen — **falta la
pantalla que los junte**, y es de C. ⇒ **entregada ≠ montada, por construcción.**

**b) Hay una fricción de tipos real, y se la pasé a C con su salida.**
`reglasSegunLugar()` devuelve `readonly ReglaEncuadre[]`, no una tupla no vacía
⇒ **no tipa directo** contra mi prop. Le ofrecí que el helper prometa lo que ya
cumple (es su territorio). **Y no dejé la ley colgando de su disciplina:** puse
una **segunda capa** — sin guía, el obturador se apaga. *Un cast en el borde
defeatea cualquier tipo*; forma de dos capas de `L-424`, fallando cerrado.

## NOTA DE FORMA, para tu ronda

Mi primer commit salió con **el mensaje corrupto**: las backticks dentro de
comillas dobles **se ejecutaron como sustitución de comandos** en zsh y se
comieron dos fragmentos — justo el sujeto de la frase que explica la segunda
capa. Lo reescribí por archivo (`-F`) y forcé con `--force-with-lease`, tras
medir que **no estaba mergeado**. *Un mensaje de commit corrupto no rompe nada y
se lee como si estuviera completo* — si en tu ronda ves mensajes con huecos
raros, ése es el mecanismo.

---

## ⏪ ENMIENDA — las dos advertencias de arriba QUEDARON RESUELTAS el mismo día

**Se enmienda acá, en su lugar, y no en un archivo nuevo:** este buzón decía
*«la pieza NO tiene consumidor»* y *«hay una fricción de tipos»*, y **las dos son
falsas ahora**. Un buzón que se mergea con datos vencidos afirma un estado que ya
no existe — y se lee con la misma confianza que uno vigente.

**a) MONTADA.** C la montó en `pista/s111-c` `645cd4ac95946753269b86e5e99badf3b8c4ca10`,
**al lado del obturador de foto en la hoja del durante** — no en otra pantalla:
*el cuidador no elige «modo foto» o «modo video» antes de saber qué va a ver.*
Reusó el grabador que ya existía en `adiestramiento/clips.tsx` en vez de escribir
uno segundo — *dos formas de cortar a los 30 s es descubrir en el aparato cuál de
las dos falla.*

**b) LA FRICCIÓN, CERRADA POR LA SALIDA (a).** `reglasSegunLugar` ahora declara
`readonly [ReglaEncuadre, ...ReglaEncuadre[]]`. **Verificado por mí contra su
rama, no contra su reporte:** `animal_en_cuadro` va enumerada primera y el resto
por filtro ⇒ **domicilio 4 · instalaciones 3, mismo orden y contenido que
antes**, y la no-vacuidad la garantiza el compilador.

🔴 **Y la parte fina, que es la que vale para la próxima vez:** declarar la tupla
**sobre el resultado del `filter`** habría sido exactamente la promesa que el
cambio existía para no hacer —*el `filter` no conserva el largo*—. Enumerar la
regla madre aparte es lo que convierte la garantía en del compilador y no en una
afirmación. **Eso lo vio C, no yo.**

⇒ **Mi segunda capa queda como cinturón que no se ejerce**, que es donde tiene
que estar: la ley la sostiene el tipo en el camino honesto, y la puerta sólo si
alguien lo saltea.

## UNA DECISIÓN DE ALCANCE, DECLARADA

C propuso pedir **cámara y micrófono juntos** antes de abrir el encuadre, y
preguntó si iba en la pieza. **Voté que NO**, por la misma medición que dejó la
cámara afuera: `EvidenciaClip` **no puede pedir permisos**, así que una prop
`permisos` sería API para un estado que la pieza no alcanza ni arregla —
*sólo podría dibujar un cartel*. Y su ubicación (antes de abrir el encuadre) **ya
cumple la Ley 23 mejor**: la pieza nunca ve el estado sin permiso. *Dos gates
para lo mismo es cómo uno de los dos envejece sin que nadie se entere.*
