# S97-D — HANDOFF DE CIERRE (14 Ago 2026)

**Pista D · rama `pista/s97-d` · territorio `apps/prestador` (el HOY + equipo/roles).**
Worktree `e-petplace-s97-d`, `node_modules` PROPIO. Todo en origin, árbol limpio.
Cierra por regla de supervivencia, no por trabajo pendiente sin declarar.

---

## 1 · LO CONSTRUIDO, CERRADO Y VERDE

| bloque | estado |
|---|---|
| **El HOY como UNA línea cronológica** (citas · llegadas · despachos por hora) | ✅ |
| **El cuarto bloque: toggle Administrador** en la Hoja del miembro | ✅ |
| **La regla condicional de recepción** (§2.3, vía `puedeOfrecerRolRecepcion`) | ✅ |
| **La fila en DOS PISOS** (firma founder, 5ª vuelta) | ✅ **gate verde** |

**El gate final, medido sobre las dos filas del discriminador:**
```
09:00  «Consulta General»  → ancho 189 · desborda false · colisión NINGUNA
11:30  «Vacunación»        → ancho 189 · desborda false · colisión NINGUNA
```

---

## 2 · LA HERENCIA — EL GUARD Y EL GUION

### `scripts/verify-colision-fila.mjs` — **GATE, ya no wip**
Rojo **y** verde producidos **con el mismo código** (el rojo, reproducido volviendo
la composición vieja por `stash`). Mide **dos preguntas en dos ejes**:

1. **desborde** — ¿el texto se sale de SU caja?
2. **colisión** — ¿su caja CHOCA con la del vecino?

> **Existe porque produce lo que cinco gates no vieron.** La fila salió con el
> glifo encima del subtítulo y el chip 66px adentro del texto, con `tsc`,
> `verify:diseno` y WCAG en verde, y **dos lecturas equivocadas mías** desde la
> imagen. **Desborde y colisión dan píxeles idénticos y curas opuestas.**

**Sus límites, declarados:** no corre en pre-commit (necesita Metro + sesión) ·
mide RN-web, **no el dispositivo** (L-153) · no descubre superficies: mide el
ancla que se le señala.

```
node scripts/verify-colision-fila.mjs --email <cuenta> \
  --keychain epetplace-siembra-s97 --ancla "<texto de la fila>"
```

### `scripts/captura-s97d-lote.mjs` — el circuito
Una corrida: capturas de ancho completo · **recortes a 3×** de las dos filas ·
las Hojas del toggle en sus dos estados. **No mide** — el veredicto es del guard
(la sonda 1D que tenía adentro murió: con dos pisos daba un rojo FALSO).

---

## 3 · 🔴 EL HALLAZGO SIN CURAR — «PREPARÁ TU ESPACIO»

**Medido contra Clínica S97 (`duenovet`), no leído:**

| paso | dato | en pantalla |
|---|---|---|
| Tus servicios | 2 activos | ● hecho |
| Tus precios | 2 con precio | ● hecho |
| Tu equipo | 4 miembros | ● hecho |
| **Tus horarios** | **0 franjas** | **sin punto — pendiente** |
| — | **3 citas HOY** | — |

**El bloque de onboarding se le muestra ENTERO a un negocio que ya está
atendiendo hoy**, y su único hueco real es uno de los cuatro pasos.

**La pregunta para la mesa, que NO resuelvo porque es de producto:** ¿el bloque
debe seguir presidiendo con 3 de 4 hechos y citas vivas, o debe colapsar a lo
que falta? *No lo curé: cambiar cuándo aparece el onboarding es decisión de
producto, y el bloque tiene su regla de existencia escrita desde S79-B.*

*(Nota honesta: esto NO lo reporté antes. Apareció en mis capturas y lo verifiqué
contra la base recién al cerrar.)*

---

## 4 · LO QUE QUEDA VIVO, CON DUEÑO

1. **La fila de despacho NO TIENE POBLACIÓN.** Las tres cuentas con pedidos
   vivos tienen `es_prestador = 0` — son vendedores puros, y **el puro no pasa
   por el tab HOY**. La fila es correcta por letra (§3) y hoy **nadie puede
   verla**. *Puerta sin población, no motor sin puerta.* **A estaba sembrando
   el caso** (`scripts/s97/siembra-pedido-duenotodo.sql`): cuando exista un
   prestador con pedidos vivos, **una captura más cierra mi mitad** — el
   circuito ya es un comando.
2. **El aviso §6 sigue siendo PLACEHOLDER** (`equipo.adminAvisoPENDIENTE`). Su
   literal está firmado en `LETRA_ROLES_EQUIPO_S74` §6 y no viajó. **Al
   reemplazarlo, renombrar la key a `adminAviso`** — el nombre grita a propósito.
3. **El truncado de la escala en OTRAS superficies**: la cura de `Celda` y los
   dos pisos arreglan el HOY. **Nadie midió las demás filas densas** con la
   escala nueva (14/16/20). El guard sirve para eso tal cual.

---

## 5 · LO QUE ME COBRÓ, PARA QUE NO SE REPITA

- **Un cero de la tabla equivocada convence igual que el verdadero.** Consulté
  `profiles.nombre`; la pantalla dibuja otra fuente. El guion reportó «0 filas»,
  que se lee como «no hay miembros».
- **El OK de un comando no dice si tu acción hizo algo.** Mi `pnpm install`
  imprimió éxito y le rompió una corrida de gates a B.
- **Más resolución no convierte un píxel en un hecho.** Subí de miniatura a 3× y
  **aun así leí mal dos veces**. Lo resolvió preguntarle al DOM.
- **Y el DOM manda solo si le preguntás lo correcto:** mi propia sonda daba
  verde midiendo desborde cuando el defecto era colisión.
- **Un guard con falsos positivos se aprende a ignorar** — la única forma de
  fallar peor que no existir. El mío los tuvo (medía un eje; reportaba wrappers
  de RN-web) y se curaron antes de entregarlo.

---

## 6 · OPERATIVO
- **Rama `pista/s97-d`**, todo pusheado y verificado por contenido.
- **typecheck** `apps/prestador` **0** · **`verify:diseno` VERDE 31 reglas**.
- **`node_modules` PROPIO** — el symlink al primario murió (cortado sin seguirlo
  al destino, con el primario verificado intacto en el mismo acto). **Caso de
  D-769 depositado**, con su corolario: *el puerto también se comparte* (C en
  :8081, esta pista en :8082).
- **Cero migraciones, cero SQL de escritura.** Solo lectura para medir.
