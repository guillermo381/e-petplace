# S91 · LÁMINA FIRMADA — EL PERFIL DE MASCOTA

> **Firmada por el founder sobre maqueta + captura del perfil VIVO,
> 8-ago-2026.** El texto de la letra va VERBATIM; el **anexo de medición** al
> pie es registro de A y **no** parte de la firma.
>
> *Depositada por A porque `docs/` es de A. Llegó por literal de mesa —
> A frenó una vez pidiéndolo (76b) antes de escribir nada.*

═══ EL PRINCIPIO ═══

**El perfil de hoy FUNCIONA — no se reestructura: se integra, se nutre y se
le suma la bitácora.** El norte: **no pregunta lo que sabe, no esconde lo que
le contaron, todo trabaja para el Bio-Expediente y el Coach.**

═══ P1 · LA CABECERA GANA DOS VOCES ═══

El **origen en humano** bajo el nombre («Llegó de un criadero») y la **edad
honesta por precisión** — fecha aproximada dice «~7 años» / «hacia 2019»,
**JAMÁS un cumpleaños exacto que miente**.

═══ P2 · «CÓMO ESTÁ HOY» SE NUTRE Y SE INTEGRA ═══

Hoy son **datos sueltos** (letra founder). **UN dashboard coherente**
alimentado por el expediente: estado de vacunas, **peso con su fecha** y
**«Registrar peso de hoy»** — *el peso SE REGISTRA con fecha, jamás se pisa:
el histórico es curva futura para Coach y vet* — y **el último latido de la
bitácora** cuando exista.

═══ P3 · IDENTIDAD ═══

Gana **RAZA editable con la gramática del alta** (tipeo + chip con cara;
**Mestizo / No sé de primera clase**). **El peso ahí queda de LECTURA** — su
registro vive en P2. **Nacimiento muestra la voz de precisión de P1.**

═══ P4 · LA BITÁCORA ENTRA POR SU HISTORIA ═══

Sus entradas **sedimentan en la línea de vida** con **chip de filtro propio**
en la fila existente, y **la ENTRADA es un toque visible junto a Su
historia**: «Contanos algo de hoy» — **chips filtrados por especie/sujeto**.

═══ P5 · «LO PRÓXIMO» SE CONSOLIDA ═══

Es **LA tarjeta del vínculo**. Hoy hay **DOS fragmentos** (línea editorial
del medio + Lo próximo abajo): **queda UNO**, con la letra de
`MODELO_LOYALTY` §2 — **narrativa + UN próximo paso con su ganancia
visible**. **JAMÁS checklist, jamás barra, jamás score.**

═══ P6 · LO QUE NO SE TOCA ═══

**VACUNAS · DOCUMENTOS · VITALES** no se tocan salvo herencias ya firmadas
(el picker de receta ya vive en Documentos).

═══ P7 · EL ACUARIO TIENE SU PERFIL POR LA MISMA PANTALLA ═══

Nombre, **tipo de agua**, cuándo se montó, su **bitácora de sistema** y sus
hitos. **SIN sexo, raza, peso, vacunas ni paseos — AUSENTES, no apagados ni
explicados** (*el silencio no se comenta en superficie*). **Vitales solo si
algún dato aplica.**

═══ P8 · LO QUE CALLA ═══

**Memorial apaga P5 y toda invitación** (apagado estructural).
**Ocultar/adopción** (letra D-690): **lugar declarado en el canon, CERO
superficie en S91.**

---

## ANEXO DE A — el estado MEDIDO al depositar (8-ago-2026; registro, no firma)

*Todo contra el objeto, para que quien construya no re-mida — y para separar
lo que ya existe de lo que hay que construir.*

### Lo que YA está y solo hay que consumir

| lo que la letra pide | estado medido |
|---|---|
| **P1 · el origen** | ✅ `mascotas.origen` viaja en el perfil desde hoy (`obtenerPerfilMascota` ganó `origen · sujeto · tipo_agua`). El alta lo captura desde `p_origen`. **La voz humana de los 9 valores es de la pantalla** — el motor guarda el código |
| **P1 · la edad honesta** | ✅ el dato está: `fecha_nacimiento` + `fecha_nacimiento_precision` (`exacta` · `aproximada` · `estimada`). **La regla ya vive en el motor** para el hito: solo `exacta` cuenta como certeza (`_clave_hito_alta`). *La voz de P1 puede leer la misma distinción y no inventar otra* |
| **P2 · el peso con su fecha** | ✅ **el motor ya existe y NO pisa**: `registrar_peso_mascota(p_mascota_id, p_peso_kg, p_metodo default 'bascula_casa', p_fecha default now(), p_notas)` → jsonb, DEFINER; su wrapper es `registrarPesoMascota` (`salud.ts`). Cada registro es una FILA de `evento_peso_medicion` (12 columnas, con `fecha_medicion` y `metodo_medicion`). **La curva de P2 no necesita motor nuevo: necesita un lector de la serie** |
| **P3 · la raza editable** | ✅ el catálogo existe (`cat_razas`, 105 filas menos las 7 firmadas hoy = 105 activas) + `obtenerRazasDeEspecie` + el matcher compartido `sugerencias.ts` + los resolvers de imagen (`resolverUrlRaza` · `resolverUrlGenericaEspecie`). **La gramática del alta es reusable entera** |
| **P4 · la bitácora** | ✅ **el guard `sin_contexto_activo` MURIÓ hoy**: cualquier mascota la tiene. 19 conductas, cero preliminares, filtradas por los dos ejes en la puerta única — `obtenerVocabularioBitacora({ especie, sujeto })`. **Y el motor RECHAZA lo que no aplica** (`chip_no_aplica_a_la_mascota`), así que la pantalla filtra para no ofrecer y el motor para que no entre |
| **P7 · el acuario** | ✅ `sujeto = 'acuario'` + `tipo_agua` en la fila y en el perfil. Sus **3 conductas propias** ya viven en el vocabulario |
| **P8 · el memorial** | ✅ `estado_vida` viaja en el perfil; el apagado estructural ya es patrón de la casa |

### Lo que NO existe y hay que construir (con lo medido, sin propuesta)

- **P2 · el LECTOR de la serie de peso.** Hay **2 filas** en
  `evento_peso_medicion` y **ningún lector de la serie** en `packages/api`
  (el perfil trae `peso_clinico_kg` de `mascota_perfil_vigente`, que es **el
  vigente, no la curva**). *La curva que la letra promete a Coach y vet no
  tiene de dónde leerse todavía.*
- **P2 · «cuándo se montó» del acuario (P7).** No existe columna de fecha de
  montaje; hoy lo más cercano es `fecha_alta` de la fila, que es **cuándo se
  registró en e-PetPlace, no cuándo se montó el acuario**. Son dos hechos
  distintos y confundirlos sería fabricar dato.
- **P4 · el «último latido» de la bitácora en P2.** El lector de entradas
  existe; **traer la ÚLTIMA para el dashboard es un lector nuevo o un
  parámetro** — no está.
- **P5 · la consolidación.** Es trabajo de superficie puro (dos fragmentos a
  uno): cero motor.

### Los tres bordes que conviene mirar antes de construir

1. **P3 dice «raza editable» y el motor todavía no tiene puerta de EDICIÓN
   de raza.** El alta la escribe (`p_raza`); para el perfil hace falta un
   camino de actualización. **No está y no lo invento**: cuando se pida, es
   una RPC angosta de A.
2. **P1 y P3 comparten la voz de precisión** («muestra la voz de precisión de
   P1»). Si cada pantalla la escribe, divergen — *la casa ya tiene el
   precedente del diccionario de `LineaDeVida`: la voz vive en UN lugar*.
3. **P7 pide AUSENCIA, no apagado** — y eso es más fácil de escribir que de
   sostener: un `if (sujeto === 'acuario') return null` esparcido en ocho
   secciones es el clon que §6 prohíbe. *Vale una sola decisión de composición
   arriba, no ocho abajo.*
