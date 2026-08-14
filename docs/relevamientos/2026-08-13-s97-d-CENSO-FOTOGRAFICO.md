# S97-D — CENSO FOTOGRÁFICO DEL PRESTADOR (13 Ago 2026)

**Pista D · rama `pista/s97-d` · CERO construcción, cero cura.** Censo en dispositivo
(R5CY201ZDVL, SM-S938B) sobre OTA **`019ff8db`** (preview, verificado en el pie de
Cuenta antes de censar cada sesión). Capturas en `scripts/capturas/s97-d-censo/`.

Los tres frenos rigieron: no se firmó forma · no se curó nada · función y diseño en
listas separadas · sin rojo producido no se reporta función rota.

---

## LO QUE LA MESA QUERÍA — RESPUESTAS MEDIDAS

### ① Las cuatro de §11 (condición de salida de DIRECCION_ARTE) — CAMINADAS
Titular demo-vet (Clínica Aurora). Los cuatro glifos de §11.3 aparecen **con consumidor,
en contexto**, todos con su huella y legibles a tamaño de sección (la firma es del
founder, no de esta pista):
- **globo (contacto)** — `cuenta/perfil` › "Cómo te contactan".
- **fiscal** — `cuenta-comercial` › "Datos fiscales".
- **bancario** — `cuenta-comercial` › "Datos bancarios".
- **documento** — `cuenta-comercial` › "Documentos" **y** `veterinaria/consulta` › "Presupuestos".

Los tres glifos clínicos vecinos (estetoscopio en `vet/cita`; jeringa "Perfil de Thor" y
carpeta "Casos activos" en `consulta`) se distinguen entre sí a esa escala. **Ninguno se
marca como ruido; el veredicto es del founder.**

**Condición de salida de la enmienda §11.3:** las cuatro pantallas quedaron caminadas por
esta pista. Falta el OJO del founder sobre las capturas para declarar §11 «gateada EN EL
PRESTADOR».

### ② El cuarto bloque de la Hoja del miembro — DÓNDE IRÍA (declarado, no dibujado)
La Hoja de "Prueba Admin S88" tiene: título + avatar → **"Qué atiende"** (toggles
Veterinaria/Estética) → separador → **"Desvincular del negocio"**. **El toggle
Administrador NO se dibuja** (confirmado en pantalla; coherente con `equipo.tsx:955`
"lugar reservado [4]"). El cuarto bloque entraría **entre "Qué atiende" y "Desvincular"**,
como segundo toggle hermano del de Prestador, con su aviso §6 antes de confirmar. **No se
dibuja: la forma es del founder y el aviso §6 necesita su segunda firma.**

### ③ La composición del HOY por rol — LOS TRES MEDIDOS EN EL MISMO NEGOCIO (Clínica S97)

| cuenta | rol | HOY que le monta |
|---|---|---|
| `duenovet` | **titular** | composición **GESTOR** — "Prepara tu espacio" (NO la agenda de puerta) |
| `vetadmin` | admin no-titular | composición **GESTOR** — "Prepara tu espacio" (idéntica al titular) |
| `vetrece` | recepción pura | agenda de recepción — **"En la puerta · Thor · Llegó"** |

Motor: `esGestor = esTitular OR empleadoTieneRol(['dueño','administrador'])`
(`index.tsx:838`); el HOY compone `gestor | recepcion | profesional`. **Solo la recepción
pura (no-gestor, sin chips) ve la agenda operativa "En la puerta".** El titular y el admin
ven la portada de configuración.

**Letra de producto que esto decide (para A / mesa):** si se quiere que el titular vea la
operación del día como la recepción, es un pedido de composición — el rol gestor tendría
que SUMAR la sección de puerta, no reemplazarla.

### El motor administrativo LLEGA a la superficie (medido al arranque, confirmado en pantalla)
Un administrador NO titular (vetadmin):
- **CUATRO tabs, con Negocio** (recepción tiene tres — la puerta que ella no).
- **Negocio** con la portada de oficios (Paseo · Grooming · Adiestramiento · Veterinaria)
  + Cobros/Liquidaciones.
- **Equipo completo + "Invitar a tu equipo".**

⇒ La diferencia del motor (19 policies por `user_gestiona_prestador`) es real y visible.
El 4º bloque de la Hoja del miembro es trabajo del rediseño (arriba).

---

## LISTA DE FUNCIÓN (rojo producido) — UN HALLAZGO, ES DE LETRA

**El gate de la plata del día se ENSANCHÓ y contradice el canon de CLAUDE.md.**

Producido: `obtener_plata_del_dia(Clínica S97, hoy)` bajo JWT de **recepción (vetrece)**
→ `{visible: true, total: 25}`. La recepción VE la plata del día en su HOY (`$25.00`).

Parecía fuga contra CLAUDE.md (S72-P1 reconciliada 3-ago-2026: *"la plata del día la ve
SOLO el titular y el admin; ningún empleado"*). **Pero leer el cuerpo del gate lo dio
vuelta:**

```
⚠️ ENSANCHE §4ter: era 'titular OR is_admin()'. Ahora el mostrador entero.
   El profesional puro sigue afuera — con visible:false.
```

Gatea por `empleado_es_mostrador_o_gestion()`, y recepción **es** mostrador ⇒ ve la plata
**por diseño de §4ter (S88)**. **No es bug — es el comportamiento vigente del motor.**

**⇒ El hallazgo real: DOS FIRMAS QUE SE CONTRADICEN Y CONVIVEN.**
- CLAUDE.md (S83): plata del día = SOLO titular/admin, ningún empleado.
- Gate vivo (§4ter, S88, posterior): plata del día = el mostrador entero (recepción incluida).

Es el modo de falla que el propio canon nombra ("dos letras firmadas que se contradicen
son peores que una equivocada"). **NO se cura (freno) — se declara para que A reconcilie
cuál firma rige y enmiende la línea perdedora EN su lugar.** Los dos literales quedan arriba.

---

## LISTA DE DISEÑO (para el ojo del founder — cero firma)
- Glifos de §11.3 y clínicos vecinos: descritos arriba; ninguno marca ruido a su escala.
- La Cuenta del gestor no-titular difiere de la del titular: header = tarjeta del negocio
  (monograma CS), sin las celdas "Tu perfil"/"Tu negocio" que sí tiene demo-vet. Diferencia
  de composición por rol; se anota, no se juzga.
- Cargas lentas (esqueleto en primera toma de perfil/consulta/negocio/equipo): latencia de
  arranque ~2-3s, no defectos.

---

## OPERATIVO
- **Sesiones caminadas (4):** demo-vet (titular Aurora, las 4 de §11 + Cuenta) · vetrece
  (recepción S97, agenda de puerta) · vetadmin (admin no-titular S97, gestor + equipo) ·
  duenovet (titular S97, HOY para la pregunta ③).
- **Identidad verificada** en Cuenta › Seguridad antes de cada censo (lección +s88admin).
- **Cuentas medidas limpias** (pre-censo, contra el objeto): vetrece e vetadmin **NO**
  portan `is_admin()` de plataforma (a diferencia de +s88admin, que sí y está prohibida).
- **Un desliz declarado:** al cambiar a duenovet, un tap cayó en la Hoja informativa
  "Eliminar cuenta" (layout del gestor más largo). Es informativa, solo "Entendido";
  **no se borró nada.**
- **Teléfono al cierre:** sesión de `guillo381+duenovet@gmail.com` (titular S97) abierta
  en su HOY. La entrega sigue del founder hasta que la revoque.

---

## PARA A (territorio DB + docs + canon)
1. **RECONCILIAR la firma de la plata del día** — CLAUDE.md (S83, solo titular/admin) vs
   el gate vivo §4ter (S88, mostrador entero). El motor implementa §4ter; la línea de
   CLAUDE.md quedó superada y sigue viva. Enmendar la perdedora EN su lugar.
2. **La composición del HOY por rol** (③) — decidir si el gestor (titular/admin) debe ver
   la agenda operativa "En la puerta" además de la portada.

## PARA EL FOUNDER / SESIÓN DE DISEÑO
1. El OJO sobre las capturas de §11 (las cuatro pantallas) — cierra la condición de salida.
2. El cuarto bloque de la Hoja del miembro (toggle Administrador) + el aviso §6 con su
   segunda firma — es trabajo del rediseño; el motor ya existe.
