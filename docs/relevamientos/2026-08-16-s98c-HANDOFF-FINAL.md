# S98-C · HANDOFF FINAL — la cola quedó VACÍA

**Cierra por trabajo terminado, no por ventana.** Rama `pista/s98-c`, árbol en
0. Todo lo de acá está medido contra el objeto; lo que es opinión lo dice.

> No repite los dos handoffs previos (`…s98c-HANDOFF-CIERRE.md` y
> `…-CIERRE-2.md`). Aquéllos cubren `ATENDER`, el wizard, la frontera §3.1 y
> el destape. Acá va lo posterior y **lo que queda vivo**.

---

## 1 · LO QUE CERRÓ (y por qué la cola está vacía)

Los dos bloques que el handoff anterior dejó **bloqueados** se destrabaron y
se cerraron enteros.

| # | qué | verificación |
|---|---|---|
| ① | **El formulario del corte, completo** — nombre con placeholder nativo · hora con **ⓘ que abre modal** · franja desde/hasta en UNA fila · **chips de días + toggle de festivos** | `verify-s98c-corte-dias` (2 brazos) · `verify-s98c-corte-estado` (2 brazos) |
| ② | **El alta de repartidor, completa** — identidad, tipo de documento, las dos fotos, WhatsApp, vehículos hasta dos | `verify-s98c-repartidor-completo` (el guard) · **camino feliz con foto real caminado por A en el aparato** |
| ③ | 🔴 **El teléfono crudo contra el CHECK** — defecto vivo, con su **segunda puerta** | `verify-s98c-telefono-repartidor` (par discriminador) |
| ④ | 🔴 **La carrera del refresco tras un alta** | `verify-s98c-refresco-alta` (**3 vueltas**) · verde en aparato por A |
| ⑤ | **El censo del digesto**, completo | solo lectura · `2026-08-14-s98c-censo-digesto.md` |
| ⑥ | Contratos a **A** (corte + repartidor) y a **B** (glifo ⓘ) — **los tres entregados y cumplidos** | ver §4 |

**Verde al cierre:** typecheck · `verify:diseno` **VERDE 33 reglas** · árbol 0.

---

## 2 · LO VIVO — Y ES POCO, PERO ES EXACTO

### 2.1 ⏳ Dos candidatas de lección esperando FIRMA
En `docs/relevamientos/2026-07-26-s77-CANDIDATAS-DE-LECCION.md`, hoy **23**:

- **#22 — contra un defecto INTERMITENTE, una corrida verde es una moneda al
  aire con forma de test.** Con su gemela de método: *antes de atribuir un
  defecto al código que uno acaba de escribir, probar el hermano que uno no
  tocó.*
- **#23 — la coordenada de un tocable se recalcula DESPUÉS de cerrar el
  teclado** (hallazgo de A en el aparato). Su hermana: ESC descarta el modal
  entero, no solo el teclado.

**⚠️ NINGUNA RIGE.** Una candidata es un texto que espera firma, no una regla.

### 2.2 🔴 El último commit NO está en `main` todavía
`d23f10f9` (las dos candidatas) está en `origin/pista/s98-c` y **A no lo
mergeó**. Los demás sí — verificado con `merge-base --is-ancestor`, uno por
uno, no por el mensaje del commit.

⇒ **Quien cierre: `git merge` de `pista/s98-c` y listo.** Es documentación
pura; no toca código ni esquema.

### 2.3 Hueco declarado que NO es mío y sobrevive
`packages/api` **no tiene capa de idioma (D-539)**: los mensajes de
`MENSAJES_DESPENSA` —incluidos los nueve códigos nuevos del repartidor— salen
**en español también en inglés**. No es de este arco; se declara para que
nadie lo lea como omisión de la pantalla.

---

## 3 · EL FIXTURE DEMO, VERIFICADO CONTRA LA BASE (no contra un mensaje)

En la cuenta **`duenotodo`** (`guillo381+duenotodo@gmail.com`):

| qué | estado medido |
|---|---|
| **Marco** — repartidor | `documento 1712345678` · `tipo_documento CEDULA` · `whatsapp +593988777333` · **con foto** (220 KB reales en `cuenta-documentos`, verificados por A en `storage.objects` aparte) |
| **«Moto (demo S98)» · 20/día** — recurso | vivo. Residuo declarado por A: el nombre lo corrigió por SQL porque el teclado le metió el «20» adentro del campo |

**Es el ÚNICO repartidor del ecosistema con el alta completa.** Los otros tres
(`Repartidor de Pruebas`, `…duenotodo S97`, `…Puro de Pruebas`) son previos a
S98: sin tipo, sin WhatsApp y **sin foto** — y **eso es correcto**, el guard
solo rige en `registrar_repartidor`; obligar en `actualizar` los volvería
incorregibles (decisión de A, medida sobre 4 filas vivas).

### 🔴 Y UN RESIDUO QUE ERA MÍO — lo encontré escribiendo este handoff
Al verificar el fixture aparecieron **`S98C SONDA` · `S98C SONDA2` · `S98C T`**:
tres recursos de mis sondas de diagnóstico de la carrera. **Esos scripts
creaban y no borraban.** Ya limpiados, **residuo 0 verificado**.

> *Lo dejo escrito y no lo borro del handoff porque es exactamente L-234 —una
> sonda que deja residuo contamina la medición ajena— y lo cometí **el mismo
> día en que deposité una candidata sobre disciplina de medición**. Mis
> instrumentos versionados sí limpian y lo verifican; los de usar y tirar no,
> y esos son justo los que nadie revisa.*

---

## 4 · LO QUE PEDÍ A OTROS — LOS TRES ENTREGADOS

| a | qué | estado |
|---|---|---|
| **A** | la puerta del corte (RPC + wrapper + lector), con `NULL = no lo toques` | ✅ `20260815110000` — adoptó la semántica literal |
| **A** | el motor del repartidor (columnas + `repartidor_vehiculos` + puertas) | ✅ `20260816100000` / `110000` — tomó mi voto: tabla nueva, `recursos_reparto` intocada |
| **A** | los códigos tipados que faltaban | ✅ y **eran NUEVE, no los tres que mi camino feliz pisó** |
| **B** | promover el glifo ⓘ al registry | ✅ `info`, **sin huella** — y confirmó que mi duda era una colisión geométrica, no estética |

**Nada mío queda esperando a nadie.**

---

## 5 · PUNTEROS OPERATIVOS

- **Puertos:** `:8081` mío · `:8082` de D.
- **Credenciales:** la clave de las 13 cuentas sale del keychain
  (`security find-generic-password -a siembra -s epetplace-siembra-s97 -w`).
  ⚠️ **`vendedorpuro` NO entra con ella**; para ese caso sirve `duenodes`.
  La cuenta de todo lo de esta ventana es **`duenotodo`** (dual, tienda activa).
- **Instrumentos nuevos, todos con cleanup y residuo verificado:**
  `verify-s98c-corte-dias` · `verify-s98c-corte-estado` ·
  `verify-s98c-telefono-repartidor` · `verify-s98c-repartidor-completo` ·
  `verify-s98c-refresco-alta` · `captura-s98c-corte` ·
  `captura-s98c-repartidor-telefono` · `captura-s98c-pasoequipo`
  (este último **declara adentro que NO probó lo que fue a probar**).
- **Capturas:** `scripts/capturas/s98-c-corte/` (00 → 10).
- **Para un E2E en DISPOSITIVO** (dato de A, y ahorra una sesión): la
  coordenada del tocable se recalcula **después** de cerrar el teclado, y el
  que cierra el teclado es **Done** — `keyevent 111` (ESC) descarta el modal.

---

## 6 · MIS ERRORES DE ESTA VENTANA

1. **Cinco veces adiviné la forma de una superficie en vez de medirla**: el
   nombre accesible de un chip (`«L, opción 1 de 7»`, no `«L»`) · `estado` por
   `tipo` en `ResultadoCaptura` · `compacto` como prop cuando es VARIANTE · dos
   etiquetas de campo. **Las cinco las cazó el typecheck o un instrumento;
   ninguna llegó a `main`** — pero cada una costó una corrida.
2. **El rojo más caro fue de mi TEST, no del motor**: declaré `CEDULA` con un
   documento inventado, y declarar el tipo **activa la validación de la
   máscara**. Perseguí un fantasma en mi código. *El rebote igual pagó:
   destapó que la pantalla no tenía voz.*
3. **Escribí una cura y la borré**: el mapa de voces contra códigos que **no
   estaban en la unión** — jamás habría disparado. *Dejarlo era peor que no
   tenerlo: se lee como resuelto.*
4. **Conté 6 tablas y eran 9 columnas**: medí por el TEXTO de la definición del
   constraint; un CHECK sobre `whatsapp` no dice «telefono» en ninguna parte.
5. **Dejé residuo de sonda** (§3), el mismo día que deposité una candidata
   sobre disciplina de medición.

> **Lo común a los cinco: medí la ETIQUETA en vez de la COSA, o di por
> terminado lo que no había verificado.** Los cinco los atrapó un instrumento
> o el objeto — ninguno el razonamiento.

---

## 7 · SI ALGUIEN REABRE ESTA PISTA

**No hay cola.** Lo que sigue son arcos ajenos con dueño:
- **D-820** y con él el puntero fiscal del vendedor puro (sigue sin tocar, por
  orden).
- **El digesto** por mundo — censo cerrado, y va **después de D-820**: *la
  ventana de pedidos del dual ES la del vendedor puro, construida una vez.*
- **El endpoint de visión** del documento: cuando exista, llena `tipo_documento`
  y `documento` desde `documento_foto_path`. **La digitación NO es andamio: es
  el camino que queda vivo**, y la regla del carnet rige igual (L-139 — campo
  no legible = `null` honesto, jamás inventado).

**⚠️ Y lo de siempre, que no cambia:** todas mis capturas son **web**. Lo único
gateado en dispositivo de este arco lo caminó **A** (el alta con foto real y el
refresco), y está dicho cuál es cuál.
