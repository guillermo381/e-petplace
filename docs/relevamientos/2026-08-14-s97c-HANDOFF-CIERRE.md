# S97-C · HANDOFF DE CIERRE — el wizard de alta, y ATENDER como Lote 2

**Cierra por ventana (regla de supervivencia), no por trabajo pendiente de
esta pista.** Rama `pista/s97-c` en `origin`, HEAD `202b253a`, árbol en 0.
Todo lo de abajo está medido contra el objeto, no recordado.

---

## 1 · LO QUE ESTÁ CONSTRUIDO Y VERDE

**El wizard de alta completo**, en `apps/prestador/src/app/verificacion/alta/`
+ `apps/prestador/src/components/alta/`.

| paso | motor | estado |
|---|---|---|
| ① tu negocio | `actualizarNombreCuentaComercial` | ✅ |
| ② qué ofrecés | `fijarModalidadServicio` · `solicitarNaturalezaComercial` · `obtenerNaturalezasDeCuenta` | ✅ |
| ③ tus documentos | `listarDocumentosCuenta` + `obtenerDocumentosVerificacion` + `subirDocumentoCuenta` | ✅ |
| ④ tu equipo | `listarRepartidores` · `registrarRepartidor` · `obtenerEquipoNegocio` · `puedeOfrecerRolRecepcion` | ✅ |
| cierre | `Destape` de B, desde `alTerminar` | ✅ |

**Contador:** del MOTOR (`obtenerEstadoOnboardingWizard`) — la completitud se
deriva, solo el salto se guarda. **Nunca se puede desincronizar.**

**Verificado:** typecheck verde · `verify:diseno` VERDE 31 reglas · **6
capturas** en `scripts/capturas/s97-c-wizard/` con la escala nueva
(`b365705f`: sm 14 · base 16 · md 20) y **cero errores JS** ·
instrumento reutilizable: `scripts/captura-s97c-wizard.mjs` (credencial
desde `.env.local`, jamás hardcodeada).

---

## 2 · 🔴 LO ÚNICO QUE ESPERA UNA FIRMA: EL WIZARD NO ESTÁ EN LA NAVEGACIÓN

Vive en **`/verificacion/alta`** por el ciclo §1b-bis (skill, enmienda S83 a
la regla 80): **UI real sin cablear → gate en dispositivo → cableado.**

Las tres cláusulas, cumplidas y declaradas:
1. Vive en ruta de verificación, **no** en la navegación del producto.
2. **NO reemplaza pantalla viva** — `registro`, `sala-espera`,
   `bienvenida-dia1` y `cuenta-comercial/nueva` siguen sirviendo al usuario.
3. **NO entra hasta la firma en dispositivo.**

> **⇒ QUIEN REABRA NO LO CABLEA A LA NAVEGACIÓN SIN LA FIRMA DEL FOUNDER.**
> Es lo último que falta del Lote 1 y **no es trabajo: es un gate.**

---

## 3 · ATENDER — LOTE 2, ALCANCE COMPLETO (nada construido)

**Medido al cerrar: cero superficie.** No hay archivo con «atender» en
`apps/prestador/src`, la tab **no está montada** en `(tabs)/_layout.tsx`, y
no hay captura. Lo único que existe es de B: `BarraTabs` con `destacada` y
el glifo `atender` (`55e218ad`). **La pieza está lista y sin consumidor.**

**Orden del founder: no arrancar hasta después de la caminata del Lote 1** —
las firmas del lote (escala, pesos, radios, el patrón `FilaModalidad`) van a
cambiar el costo de construirlo bien a la primera.

### 3.1 El alcance
- **Portada:** tarjetas grandes, una por oficio activo **con local** (canto
  de su categoría, N7: presencia real).
- **Flujo único:** oficio → **mascota** (correo del cliente → si existe,
  *handshake*, ya construido; si no, alta básica nombre/especie/raza
  asociada al correo) → **horario** (disponibilidad real del oficio) →
  **cobro en local** (`registrarCobroPresencial`, ya existe).

### 3.2 🔴 LOS TRES FRENOS DUROS — se copian, no se re-deducen
1. **El correo del cliente es su identidad. JAMÁS una cuenta paralela.**
   Motor vivo: `crear_alta_asistida_pendiente` (sin cuenta) ·
   `crear_alta_asistida_existente` + `crearSolicitudAutorizacion` (con
   cuenta). Ninguna escribe en `auth.users`.
   ⚠️ **`crear_mascota_walkin` está JUBILADA (D-794)** — creaba mascotas sin
   correo, irreclamables. Si una pantalla la busca por nombre, ese es el
   camino muerto.
2. **Del lado productos NO se ve expediente** (§7.4 — la puerta cambia
   permisos).
3. **El vendedor JAMÁS elige la mascota** en venta de productos. En
   servicios la elige quien atiende, por handshake o alta — **nunca
   navegando mascotas ajenas.**

### 3.3 La composición de la tab (letra, §2 y §2.1bis)
`ATENDER` es **quinta tab, al centro**, y **la barra se compone por
capacidad**: 5 (titular/admin) · 4 (recepción) · 3 (profesional puro, sin
ATENDER) · 3 (vendedor puro, sin DATOS) · repartidor **sin barra**.
El predicado **ya existe**: `empleado_es_mostrador_o_gestion` — no nace uno
nuevo. Las dos fuentes (oficios con `atiende_local` + venta de mostrador)
**se componen en VISTA, jamás en una consulta**: §3.4 prohíbe que se
guarden juntas, no que se vean juntas.

---

## 4 · LO DECLARADO Y NO MONTADO (con su porqué)

- **El logo del paso ① — D-797.** No existe ninguna de las tres patas
  (bucket, columna, wrapper). El destape cae al monograma **por diseño**
  (escalera de portada §12.3). *Un formulario que no puede guardar es peor
  que su ausencia.* **No bloquea el lote.**
- **`puedeOfrecerRolRecepcion` es permisiva en el centro — D-792.**
  `atiende_local` nació `DEFAULT true` y barrió los cuatro oficios (32 de 33
  filas). Discrimina el borde que importa (vendedor puro ⇒ `false`) y es
  permisiva hasta que alguien toque el toggle del paso ②. **El fallo NO se
  degrada a `false`**: un rol no se esconde por un error de red.
- **«De tu equipo» no hereda el DOCUMENTO.** `MiembroEquipo` no lo trae y
  `registrarRepartidor` lo exige ⇒ el camino corto hereda la persona
  (`user_id`) y **pide el documento igual**. Fingir que lo hereda sería
  inventarlo.

---

## 5 · LAS DOS COSAS QUE ENCONTRÓ MIRAR, Y NINGÚN INSTRUMENTO

1. **Los toggles del paso ② salían sin rótulo.** `Interruptor` usa
   `etiqueta` **solo como `accessibilityLabel`** — el texto visible siempre
   fue del consumidor. **El código compilaba, `verify:diseno` daba verde y
   la a11y estaba bien puesta**: un lector de pantalla lo leía bien y el ojo
   no tenía nada. Curado con `FilaModalidad`.
2. **La voz de «de tu equipo» mentía** — decía «hereda su nombre y su
   documento» y el documento no se hereda. Curada.

> **Las dos las cazó una captura.** Es la lección de S96 repitiéndose: *un
> camino que nadie recorrió no tiene síntoma hasta que alguien lo pisa.*

---

## 6 · 🔴 MIS DOS AUTOCORRECCIONES — para que nadie herede la premisa mala

**(a) Reporté una contradicción que no existía.** Dije que el contador se
contradecía con el paso ③. Medido después: esa cuenta tiene
`docs_prestador=0 · docs_cuenta=0 · empleados=2 · ofertas=8` ⇒ el «te falta
1 paso» **era** documentos, y la pantalla mostraba documentos vacío.
**Coherentes desde el principio.**
**La cura se quedó por su propio mérito** (previene el caso real de los 11
documentos de prestador ajenos, y la mesa la adjudicó en §4.4) — **pero la
evidencia estaba mal, y no es lo mismo.** *Vi dos hechos verdaderos y les
inventé una relación.*

**(b) Frené un push citando una regla derogada.** Cité *«el push es del
founder»* — literal de S79 y anteriores, **derogado hace 17 sesiones** por
`CONTRATO_TRABAJO:473` (regla 79: **el push es de la sesión A**). Aun con la
regla vigente el acto no era mío: es de A.
**El reflejo estaba bien y lo sostengo:** frenar sobre premisa vieja costó
una vuelta de mensajes; ejecutar por pedido ajeno cuando la regla rige
cuesta un incidente. **La asimetría manda, aunque el hecho no me diera la
razón.**

> **Lo común a las dos: una letra superada se lee perfecta.** Es D-790.

---

## 7 · ESTADO OPERATIVO

- **Rama:** `pista/s97-c` → `origin`, HEAD **`202b253a`**, verificado por
  contenido (`ls-remote` + `merge-base --is-ancestor`), **14 commits**.
  `origin/main` **no se movió** con mi push.
- **El merge lo hace A** (regla 79) cuando D dé su verde. Mi rama está
  quieta.
- **Worktree:** `../e-petplace-s97-c` (deps, `.env.local`, `supabase/.temp`).
- **Pedidos cursados y ENTREGADOS:** a B el contrato del `Destape` (+ su
  corrección de ATENDER cuando llegó la letra) · a A el ensanche de
  `obtenerOficiosNegocio`, el escritor genérico, las naturalezas y
  `MiembroEquipo.userId`. **Nada esperando de mi lado.**

## 8 · SI REABRÍS ESTA PISTA, EN ORDEN

1. **La firma del founder sobre el wizard** en dispositivo → recién ahí se
   cablea a la navegación y mueren las cláusulas de §2.
2. **ATENDER (Lote 2)** con §3 entero, **después de la caminata**.
3. Nada más. **El Lote 1 no deja deuda propia abierta.**
