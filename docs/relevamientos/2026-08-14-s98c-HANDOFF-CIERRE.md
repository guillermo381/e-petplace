# S98-C · HANDOFF DE CIERRE — ATENDER, el wizard, la frontera del HOY

**Cierra por ventana, no por trabajo pendiente.** Rama `pista/s98-c` en
`origin`, **árbol en 0**, **nada en curso sin commitear**. Todo lo de acá
está medido contra el objeto; lo que es opinión lo dice.

---

## 1 · LO QUE ESTÁ VERDE Y EN `origin`

| # | qué | dónde |
|---|---|---|
| ① | **`ATENDER` montada** — quinta tab destacada, compuesta por el **Y** (rol `esMostradorOGestion` **Y** capacidad) | `(tabs)/_layout.tsx` · `lib/capacidad-atender.ts` |
| ② | **La portada** — baldosas por oficio con local + tienda, canto por categoría | `(tabs)/atender.tsx` |
| ③ | **La banda del día** — «Citas de hoy» · «Agendado hoy», §4ter | idem |
| ④ | **La pizarra como Hoja** con asignación **inline**; `/pizarra` **murió** | `components/atender/pizarra-hoja.tsx` |
| ⑤ | **El wizard**: «Guardar» muerto (Continuar valida coherencia y guarda) + **D-799** (tres voces) | `verificacion/alta/` · `components/alta/` · `lib/validacion-alta.ts` |
| ⑥ | **La frontera §3.1** — el contador gobierna el HOY; ventanilla y pizarra mudadas | `(tabs)/index.tsx` |
| ⑦ | **El «Llegó» muerto entero**, con su chip | idem |
| ⑧ | **El censo del alta duplicada** (+ addendum D-806) | `docs/relevamientos/2026-08-14-s98c-censo-alta-mascota-duplicada.md` |

**Verificado:** typecheck verde · `verify:diseno` **VERDE 32 reglas** · **5
capturas** sin error JS.

---

## 2 · LA COLA, CON ESTADO REAL

### 2.1 · ☑ La pizarra → Hoja — **HECHA, no pendiente**
Tocada y cerrada: Hoja sobre la portada, **asignación inline** (la Hoja
interna murió: habría sido un `Modal` dentro de otro), la ruta borrada.
**No queda nada de este ítem.**

### 2.2 · ⏳ El subtítulo de la baldosa — FIRMADO, **bloqueado por un lector**
Firma: *dato vivo del día* («3 citas hoy» · «2 en espera» · «sin agenda
hoy») o **silencio**. La orden decía *«mismo lector que tu dashboard:
salen juntos»* — **y ahí está el freno, medido**: el lector de la banda
(`obtener_plata_del_dia`) devuelve **un TOTAL del negocio**, no un conteo
**por oficio**. La baldosa necesita por oficio.

**Dos caminos, y no elegí:** ① pedirle a A un conteo por oficio · ② pagar
las cuatro lecturas del día que ya usa el HOY (4 viajes en la portada).
**No lo monté para no inventar un número por oficio a partir de un total.**

### 2.3 · ⏳ El Negocio reconstruido — **territorio tomado, cero líneas escritas**
`(tabs)/negocio.tsx` (516 líneas) **liberado por D** — su tanda tocó
`prepara-espacio.tsx`, `(tabs)/index.tsx` y `scripts/`; a `negocio.tsx`
solo lo leyó.

> 🔴 **LA CONDICIÓN DE D, que no es opcional:** su cura de «Prepará tu
> espacio» hace deep link a `/<oficio>/taller?seccion=…` y **cuando el
> destino no es resoluble cae a `/(tabs)/negocio`**, apoyándose en que
> **lo primero de esa pantalla sea la lista de mundos**. Con «Tus
> servicios» arriba se cumple. **Si el orden cambia, se le avisa a D — el
> fallback es de SU fila y se mueve de un solo lado.**
> *(Cuándo cae, medido por D: negocio con CERO oficios, o con más de uno
> para servicios/precios — 2 de 5 negocios cada caso.)*

Alcance firmado: las dos categorías (**«Tus servicios»** · **«Tu tienda»**)
como secciones, y los servicios en **baldosas de dos columnas**, no filas.

### 2.4 · ⏳ El alta duplicada — **censo cerrado, cura NO empezada**
El censo contesta la pregunta de fondo y **la respuesta es la grave**:

> **ES DE DATO, en cuatro puntos** — la **raza** (contra §6.1 firmada) · el
> **token de intento** (la anti-duplicación que al cliente le costó 19
> filas y no viajó) · la **cláusula del pez** (entra como `individuo`,
> contra la firma del acuario) · el **origen** (divergencia *legítima*).

Y **son CUATRO implementaciones**, no dos: `autorizar.tsx` se declara copia
en su propia cabecera. **El motor NO es el límite** — las RPC ya aceptan
`p_raza`, `p_sexo`, `p_fecha_nacimiento`, `p_microchip`, `p_foto_url`; el
estrechamiento lo hacen la pantalla **y** el wrapper.

**Plan en etapas propuesto (§5 del censo):** etapa 1 = cerrar el DATO (mi
territorio); etapa 2 = la pieza única (mesa + `apps/cliente`). **Con su
límite escrito: la etapa 1 reduce y NO cierra la divergencia.**

### 2.5 · ⏳ `fotoUrl` de especies (D-806) — **bloqueado por A**
La pieza **ya sabe**: `SelectorEspecieOpcion.fotoUrl` existe desde S91 y su
comentario predijo el defecto (*«ausente = la huella de siempre, así que la
ficha no cambia para quien no la pase»*). **El mostrador es quien no la
pasa.** Falta poder resolver la URL desde el prestador ⇒ **`resolverUrlRaza`
en `packages/api`, de A, ya pedida por D**.

> ⚠️ **NO copiar `urlGenericaDeEspecie` al prestador.** Sería el cuarto clon
> del día, en el archivo escrito para no hacerlo.

---

## 3 · LO QUE ESPERO DE OTROS

| de | qué | para qué |
|---|---|---|
| **A** | **lector de «cobrado hoy»** — `cobro_presencial_registrado` tiene escritor y **cero lectores** | la banda dice hoy «Agendado», no «cobrado» |
| **A** | **lector de «prestados hoy»** — lo que hay cuenta citas VIVAS | idem |
| **A** | **conteo por OFICIO del día** (o el veredicto de pagar 4 viajes) | el subtítulo firmado (§2.2) |
| **A** | **`resolverUrlRaza`** en `packages/api` | D-806 (§2.5) |
| **B** | nada pendiente | convergido |
| **D** | nada pendiente | negocio liberado |

---

## 4 · FRENOS Y LEYES LOCALES

- **🔴 La grilla usa `flexBasis: '47%'` SIN `flexGrow`** (`ESTILO_CELDA` en
  `atender.tsx`) y **no** el patrón del pie de `Baldosa`. Los dos desvíos
  están medidos en el código: el `flexGrow` con la pieza cuadrada fabrica
  baldosas de ~380×380 (los 800 px que midió A), y el `48%` del header
  **no entra** (gap incluido: 380.8 > 380 y 388.5 > 388). **B ya curó el
  header apuntando al pie, que hoy dice `width: '50%'` con
  `paddingHorizontal` y sin `gap`** — **converger a ese patrón es
  pendiente y hay que hacerlo CON CAPTURA**, no de palabra.
- **Motor y bundle van juntos (aviso de A):** con el «Llegó» muerto, si
  alguien revierte `20260814200000` (el trigger que estampa `llegada_en`
  al pasar a `en_curso`) **las llegadas dejan de existir en silencio**.
- **El fallo de capacidad ABRE la tab; el fallo de ROL la cierra.** No es
  simetría rota: un permiso no se concede por un error de red, y la
  portada sabe decir que no pudo leer — una barra sin la tab, no.
- **La voz nueva del mostrador no-vet solo aparece entrando por baldosa**
  (con `oficio` en la URL). Por otro camino cae el vacío viejo.

---

## 5 · LOS DISCRIMINADORES — para no re-derivarlos

- **Puerto:** `:8081` es mío (D usa `:8082`).
- **Cuentas:** `demo-prestador@epetplace.dev` (la del `.env.local`;
  grooming + adiestramiento + paseo, **sin vet, sin tienda** ⇒ dos
  baldosas) · **`duenotodo`** (2 oficios **+ tienda**: ahí se dibuja la
  baldosa de tienda) · **`duenovet`** (1 oficio, «Prepará tu espacio»
  visible) · **`+vet2`** (paseo-only ⇒ **sin `ATENDER`**).
  ⚠️ **La clave de las cuentas `guillo381+*` NO es la del `.env.local`** —
  vive en el keychain del founder. Medido a la mala: el instrumento sacó
  tres fotos de la pantalla de bienvenida creyendo que había entrado.
- **Instrumentos:** `scripts/captura-s98c-atender.mjs` (portada · barra ·
  oscuro · **pizarra-Hoja** · el discriminador de §3.1) ·
  `scripts/captura-s98c-wizard-validacion.mjs` (verifica que el wizard
  **NO avanza** con un nombre inválido) · `scripts/captura-s97c-wizard.mjs`.
  Los dos primeros **abortan** si la sesión no abrió.
- **Capturas que YA existen:** `scripts/capturas/s98-c-atender/01→05`.

---

## 6 · MIS ERRORES, PARA QUE NADIE HEREDE LA PREMISA MALA

1. **Mandé a B a curar el lugar equivocado.** Medí la cadena de layout
   *hacia arriba*: probaba que la altura era 0, **no de dónde salía**.
   *Medí lo suficiente para probar que algo estaba roto y no lo suficiente
   para decir qué.*
2. **Parcheé antes de medir** (`alignItems: 'flex-start'`), lo reverti al
   verlo no-op en web… y **resultó ser correcto en nativo**. De *«no cambió
   nada en web»* concluí *«el mecanismo es falso»*. **Un no-op en la
   plataforma equivocada no falsa nada.**
3. **Declaré un espejo «garantizado por construcción»** cuando lo
   garantizaba un DATO de migración — y mi propia frase de dos párrafos
   más abajo lo decía.
4. **Escribí prosa que invitaba a romper una firma** (dije que el relleno
   de catálogo era «la época vieja» del componente; es **7bis con gate del
   founder**). Corregido en el censo, **no borrado**.

> **Lo común a las cuatro: una conclusión que necesitaba una medición más.**

---

## 7 · SI REABRÍS ESTA PISTA, EN ORDEN

1. **El Negocio** (§2.3) — territorio libre y confirmado, con la condición
   de D. Es lo más grande y lo único sin bloqueo externo.
2. **Converger la grilla al patrón del pie de `Baldosa`** (§4), con
   captura.
3. **La etapa 1 del alta** (§2.4) — cero cruce de territorio.
4. **El subtítulo** y **D-806**, cuando A entregue.

**Nada de esto tiene gate en dispositivo.** Mis capturas son web: **el
verde de una plataforma no viaja a la otra** — esta jornada lo demostró
con la misma pieza, que colapsaba a 0 en web y se estiraba a 800 en
Android.
