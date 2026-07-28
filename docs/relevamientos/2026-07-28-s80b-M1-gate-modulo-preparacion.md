# S80-B3 · M1 — EL GATE DEL MÓDULO "PREPARA TU ESPACIO" (D-521, el disparo de campo)

> Boceto antes de composición. Territorio apps/prestador. La medición
> PRIMERO (addendum del founder: reproducir, no suponer) — reproducida
> contra DB viva con los JWT reales de vet2 (titular) y vet3 (empleado).

## 1. LO MEDIDO (todo con literal, nada supuesto)

**Los Shyris (`5e53c898`, estado `activo`): 1 oferta activa · 5 franjas
activas.** El negocio ESTÁ configurado.

**El empleado del founder (`guillo381+vet3`, fila `55996928`) tiene
1 CHIP (`paseo`)** — NO es composición-recepción (recepción ⟺ CERO
chips). La detección S78 del HOY hizo LO CORRECTO al no mandarlo a
`AgendaRecepcion`: cayó a jornada normal. La etiqueta "entró como
recepcion" del relato no es la verdad de composición — la trampa del
mandato cortó en las dos direcciones.

**Por qué vio "Prepara tu espacio" con el negocio YA configurado —
reproducido bajo su JWT:**
```
titular_visible = 0   ← empleados_self le esconde la fila rol='dueño'
ofertas_visibles = 1  ← las tablas crudas SÍ se leen
franjas_visibles = 5
```
La cadena: `obtenerFranjasHorario(prestadorId)` sin `empleadoId` →
`resolverPersonaDeFranja` → `obtenerTitularId` → fila del dueño
INVISIBLE para un empleado → `falla('error_desconocido')` →
`horariosOk = null` → la regla de existencia
`!(serviciosOk && horariosOk === true)` da true → **el módulo se monta
sobre un dato que la RLS recortó, con cara de "falta configurar"**
(clase L-166/L-139). El módulo NO consume `esGestor` — no existe rol en
su condición de existencia (`index.tsx:657-665`).

**El (a)/(b)/(c) del addendum: es (b), con literal.** El tap navega
(`router.navigate('/(tabs)/negocio')` — la Screen está declarada aunque
la tab no se dibuje) y `negocio.tsx:262` dibuja **`GateRoto`**: el hook
`useGateGestor` (S79-B) obtiene `rol=false` y contrasta con
`obtenerTitularId` → null → declara 'roto'. La voz que el founder leyó:
*"No pudimos confirmar tu lugar en el negocio / Los datos del negocio se
contradicen… prueba de nuevo."* **Es un FALSO ROTO:** los datos no se
contradicen — `titular=null` para TODO empleado porque `empleados_self`
esconde las filas ajenas; el caso que la coherencia S79-B no contempló.
El "Reintentar" no cura jamás. No es (c): nunca llega a un guardar.

**M3 (paso 11 del runbook S79), contestada como TITULAR (JWT vet2):**
```
titular_id_visible = fed2cfb5…  · franjas_del_titular = 5 · ofertas_activas = 1
```
⇒ `serviciosOk=true && horariosOk=true` ⇒ `preparacion = null` ⇒ **el
bloque entero (FirmaPrestador + PreparaEspacio) NO se monta: desaparece
ENTERO** (`index.tsx:917`). Los Shyris ya está configurada: si el
founder abre el HOY como vet2, no lo ve. Lo que vio como vet3 era el
falso dato, NO evidencia sobre el paso 11. El gate en dispositivo del
paso 11 sigue siendo del founder (regla 77) — esta medición le dice que
la condición y los datos están del lado correcto.

**M2 — censo de OFERENTES de rutas de negocio fuera de la tab (grep
app/ + components/, excluido app/negocio/):** los ÚNICOS son las 4
filas de `prepara-espacio.tsx` (3 × `/(tabs)/negocio` + 1 ×
`/negocio/equipo`). Cero banners, cero CTAs de vacío, cero avisos.
Gateado el módulo, ningún oferente queda para no-gestores. Lo que la
jornada normal ofrece a un empleado y ES legal se queda: sus citas,
"Por coordinar" (opera), el mostrador (ventanilla por MEMBRESÍA — ley
madre S76).

## 2. LA CURA (dos piezas, acotadas al radio del runbook)

### 2a. El gate de AUSENCIA sobre el MÓDULO (index.tsx)

El módulo es del GESTOR (PORTAL §2.4: las tareas para que el portal
reciba clientes). Composición por lo que el rol PUEDE (LETRA_RECEPCION
§3/§9), con la trampa respetada: **jamás se lee la fila `recepcion`;
la verdad es `empleado_tiene_rol(['dueño','administrador'])` — el
helper único §14.4, DEFINER, inmune a la invisibilidad RLS.**

Mecánica en `cargar()` (costo declarado, familia D-555/D-497):
- `esTitular` ya está computado (miFila === titularFila, y el titular
  SÍ lee su propia fila dueño) → **el titular no paga ningún viaje
  nuevo**.
- No-titular → +1 RPC `empleadoTieneRol` (cubre al administrador del
  futuro sin tocarse — el mismo switch armado del guard).
- `esGestor === false` o lectura caída → `preparacion = null`: el
  módulo NO se computa (se ahorran los viajes de franjas y equipo) ni
  se monta. Ante la duda el módulo-ayuda no aparece (Ley 23; la
  escritura la sigue protegiendo el server). El fallo de lectura NO
  fabrica un falso "falta configurar" — muere la clase entera.
- Con el gate, el falso-dato de `horariosOk` para empleados se vuelve
  INALCANZABLE por esta superficie (solo el gestor computa, y el
  titular resuelve franjas bien).

**Lo que ve el no-gestor en su lugar:** lo que la letra S76 ya le da —
recepción-composición (0 chips) sigue yendo a `AgendaRecepcion` (rama
ANTERIOR, intacta); el empleado con chips ve SU jornada. El bloque del
titular simplemente no existe para ellos; nada nuevo se inventa.

### 2b. El FALSO ROTO de `gate-gestor.ts` (la superficie exacta que el founder leyó)

'roto' hoy = `rol=false && titular=null`. Medido: eso es VERDAD PARA
TODO EMPLEADO (la RLS esconde al titular), no solo para datos rotos.
La coherencia gana el dato que la RLS SÍ garantiza — **mi propia
fila**: antes de declarar 'roto', `obtenerMiEmpleadoId(prestadorId)`:
- fila propia ACTIVA presente → soy empleado sin rol de gestión → la
  denegación ES coherente → **'denegado'** (Redirect, ausencia — Ley
  23). El GateRoto con "reintentá" que no cura jamás, muere para este
  caso.
- fila propia null (dato roto real o lectura caída) → 'roto' se
  conserva TAL CUAL — la protección S79 del titular expulsado queda
  intacta (un negocio sin fila dueño sigue diciendo, jamás denegando).

## 3. Protocolo (§1c / gate de craft)

1. **TESIS del HOY (intacta):** la jornada de quien trabaja. La cura no
   agrega superficie: QUITA una que no era de este rol.
2. **FIRMA:** no cambia — no hay pantalla nueva.
3. **CHANEL:** para el no-gestor se quita el bloque entero
   (FirmaPrestador + PreparaEspacio) — era del titular preparando SU
   espacio.
4. **TESTS §15:** el gate por AUSENCIA (la celda no se dibuja — patrón
   tab NEGOCIO S75-B); cero voz nueva → cero string nuevo → nada que
   gatear de lote; error jamás disfrazado (2b convierte un falso-roto
   en denegación coherente y conserva el roto real).
5. **Estados:** gestor+sin-configurar → módulo (igual que hoy) ·
   gestor+configurado → nada (igual que hoy, medido M3) · no-gestor →
   nada · lectura de rol caída → nada (declarado arriba).

## 4. Qué NO hace (declarado)

- No toca la detección recepción (S78) ni `AgendaRecepcion`.
- No toca el guard de tabs (la mitad que RIGE, dato de campo).
- No toca packages/api ni DB (la RLS de `empleados_self` queda como
  está — es correcta; el bug era leer su recorte como dato).
- No cura los lectores `*Propias`/serviciosOk para un futuro
  ADMINISTRADOR no-titular (hoy ese rol no existe con motor — D-513
  v2); queda declarado: cuando exista, `serviciosOk` leído por _own
  le mentirá igual que a vet3 — la nota va en el código.
- El arco de las 26 pantallas (D-512/v2) no se abre.
