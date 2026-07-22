# S74-B · BOCETO M1-M5 — LA VENTANA DE EQUIPO + LA FIRMA (NEGOCIO)

> **Estado: BOCETO. CERO código hasta que pase la vara cruzada de A.**
> Fuentes literales: PORTAL_PRESTADOR §14 (LETRA_EQUIPO v1, doc v1.3 —
> leída entera) · `MODELO_PRESENCIA` §2 pieza 1 + §3 (nace compuesto) +
> §4 (muro verificado/declarado) · relevamiento `500ee8d` · motor S73
> (`20260721210000` + `20260721230000`). El motor está COMPLETO (§14
> estado post-S73); esto es la VENTANA.

## 0 · Tesis y superficie

**TESIS:** *NEGOCIO → Equipo comunica que el dueño gobierna quién actúa
en su negocio y con qué permiso — y que quitar el acceso nunca borra lo
que la persona hizo.*

**SUPERFICIE:** la celda "Equipo" que HOY duerme en los lugares en
preparación de NEGOCIO (`negocio.tsx:126`) DESPIERTA como
`CeldaNavegacion` (Ley 19.1) → pantalla nueva `negocio/equipo`. La FIRMA
del prestador (T2) vive en la MISMA pantalla, arriba — §2 pieza 1 de
PRESENCIA dice "misma superficie NEGOCIO = costo marginal" y esta letra
lo cumple componiendo UNA pantalla: **tu negocio (la firma) + tu gente
(el equipo)**.

**LA PUERTA (Ley 23):** la celda "Equipo" **solo se dibuja para quien
`empleado_tiene_rol(negocio, ['dueño'])`** — las tres policies de
`empleado_roles` son dueño-only (§14.4 v3): dibujar la ventana a un
profesional es ofrecer lo que el motor va a rechazar. No hay estado
"deshabilitado por rol": hay ausencia (la puerta, no el candado).

## 1 · Las 7 preguntas del protocolo §1c

1. **¿Qué TRABAJO hace cada elemento?** (diccionario Ley 19)
   - Entrar a la sección: `CeldaNavegacion` en NEGOCIO (19.1).
   - Lista de miembros: `Celda` por persona (fila de lista, tapeable al
     detalle del miembro).
   - Rol como dato en la fila: `Insignia` (estado pasivo, 19.4) — jamás
     chips tocables en la fila.
   - Asignar/quitar rol (en el detalle del miembro): **`Interruptor` por
     rol** — profesional ON/OFF · recepción ON/OFF (Ley 22: tener-o-no un
     rol es BINARIO; N interruptores = N filas de la hija, la unión
     firmada). "dueño" NO es interruptor en v1 (transferir la propiedad
     no está en alcance — se muestra como `Insignia`, jamás como control).
   - Invitar: **acción primaria de la pantalla** — `Boton` primario
     (accent.cta oficio), UNO (19.2). Abre `Hoja` con `Campo` de email +
     nombre (la Hoja cubre el teclado — casa (a) del patrón D-498).
   - Desvincular: **comando con consecuencias** (22c) — `Boton`
     destructivo TONAL en el detalle del miembro, con `Hoja` de
     confirmación que dice la verdad del motor: *"pierde el acceso; lo
     que hizo queda en el expediente"* (la procedencia es verdad de motor
     HOY — §14.1, 13 triggers).
2. **¿Ya existe en la casa?** Todo: `CeldaNavegacion` · `Celda` ·
   `Insignia` · `Interruptor` · `Boton` · `Hoja` · `Campo` · `Texto` ·
   `FilaDato` · `EsqueletoGrupo` · `AvatarMascota` NO (acá no hay
   mascota). **CERO componente nuevo.**
3. **¿Recorriste la casa?** Vecinas: NEGOCIO (mundos con detalle vivo +
   hitos), Cuenta·Tu perfil (la sección de la entidad S60-B2: whitelist
   editable + solo-lectura DIGNO que dice su porqué), los talleres de
   oficio (toggle de servicios). El detalle de miembro con interruptores
   habla el idioma del menú vet (toggles con revelación). Misma dosis,
   mismo tealDark.
4. **¿La tesis se sirve?** Cada elemento responde "quién / qué puede /
   desde cuándo". Lo que no: fuera (ver Chanel).
5. **¿Capa y dosis?** Prestador dosis BAJA: cero capas de color del
   cliente, acento del oficio en el CTA, UN acento por vista. La firma
   (T2) es composición, no color.
6. **¿3 temas, es/en, estados?** Declarados abajo (§3). Memorial no
   aplica (superficie del prestador; el tema del sistema rige claro/dark).
7. **Chanel — qué se quitó ANTES de dibujar:** (a) la credencial NO se
   muestra acá (vive en verificación §14.2 — duplicarla acá haría doble
   turno); (b) la acotación de actos por servicio (D-463) NO entra en v1
   — su default declarado ("sin filas = todos los actos no clínicos")
   hace que una UI de acotación sin demanda sea estructura decorativa;
   (c) cero contador de "N atenciones" por miembro (métrica, no gestión
   — y NEGOCIO gestiona, no exhibe métricas que HOY no existen);
   (d) `asignado_por`/`asignado_en` quedan en el motor (auditoría), no en
   la fila.

## 2 · La pantalla, de arriba a abajo

```
Encabezado navegación "Tu negocio"
┌─ LA FIRMA (T2) ──────────────────────────┐
│ [logo/avatar]  Nombre comercial           │
│                oficio(s) · ciudad         │
│                "Verificado" (si §14.2 ✓)  │
│   → tocar = editar lo editable            │
└──────────────────────────────────────────┘
Texto seccion "Tu equipo"
┌─ Celda por miembro ─────────────────────┐
│ Nombre · [Insignia rol(es)]              │
│ subtítulo: contacto o estado             │  → tap: detalle del miembro
└─────────────────────────────────────────┘
(invitaciones pendientes: Celda con voz
 "Invitación enviada · expira {fecha}")
[Boton primario] "Invitar a tu equipo"
```

**Detalle del miembro** (pantalla o Hoja — voto: pantalla, hay 3+
controles): identidad arriba (`FilaDato` nombre/contacto/desde —
`desde` en mono) · interruptores de rol · desvincular al pie (22c).

### T2 — LA FIRMA (PRESENCIA §2 pieza 1)

- **NACE COMPUESTA (§3, ley madre):** oficio = de los toggles VIVOS ·
  ciudad = del dato vivo del prestador · antigüedad en plataforma =
  verificable · nombre comercial = el que ya existe. **Lo único que la
  ventana PIDE es el logo** (`prestadores.foto_url` EXISTE — relevamiento
  S73-A — hoy sin productor del lado prestador). La puerta no pregunta lo
  que ya sabe.
- **El muro §4:** "Verificado" (cara del ciclo §14.2) JAMÁS comparte
  bloque con lo declarado; en v1 la firma solo muestra verificado
  (oficio/antigüedad/sello) + identidad — la bio/historia declarada es
  pieza 2 (PRESENCIA §2), fuera de este boceto.
- **LA TRAMPA DEL LOGO (letra de mesa, brief S74):** *los logos anchos NO
  se recortan a círculo — se contienen con AIRE y FONDO.* El slot del
  logo es un contenedor cuadrado `radius.suave` con el logo en `contain`
  sobre `bg.overlay`; sin logo, el fallback es el monograma/inicial en
  tipografía de la casa — jamás huella (la huella es de MASCOTA, Ley 12).
  **Declarado L-158: este literal NO vive hoy en MODELO_PRESENCIA (grep
  exhaustivo) — lo adopto del brief; si la mesa quiere el literal en el
  doc, lo deposita A.**
- Escritura: se registra que el trigger D-389
  (`_prestadores_protege_columnas`) gobierna qué columnas puede escribir
  el prestador de a pie — **pedido de motor si `foto_url`/nombre no están
  en la whitelist** (se releva contra `pg_get_functiondef` ANTES de
  construir, L-141 — el boceto no lo afirma).

## 3 · Estados declarados

- **VACÍO:** NO EXISTE lista vacía — el dueño SIEMPRE está (backfill S73:
  5/5 titulares). El "vacío" real es *equipo de 1*: la lista muestra al
  dueño y una invitación serena bajo el CTA (*"Tu equipo es tuyo por
  ahora. Invita cuando lo necesites."* — voz a gate). Cero `EstadoVacio`
  de pantalla.
- **CARGANDO:** `EsqueletoGrupo` estático (firma + 2 filas).
- **ERROR:** máquina discriminada cargando/error/listo (copiar-al-vecino:
  la de atención S73-B) — voz que dirige + Reintentar; el error jamás se
  disfraza de equipo-de-1 (Ley 13: ese disfraz acá sería grave — "no hay
  nadie" vs "no pudimos cargar").
- **Invitación pendiente/expirada:** la fila lo DICE (estado del motor:
  `pendiente`/`expirada` — voz humana, jamás el enum).
- **Miembro aceptado SIN rol:** fila con voz *"Sin permisos todavía —
  asigna un rol"* — estado LEGAL del motor (el gate D-464 lo deja sin
  lectura clínica, correcto) y la UI lo dice en vez de esconderlo.
- **Deshabilitado:** no hay — la puerta (§0) reemplaza al candado.

## 4 · Contrato de datos M4

**Se renderiza:**
- De la firma: nombre comercial · foto/logo (`prestadores.foto_url`) ·
  oficios activos (derivados de los mundos vivos) · ciudad · estado de
  verificación §14.2 (la voz 7.13 existente).
- Del equipo: nombre de la persona · contacto (email) · roles vivos
  (filas de `empleado_roles` → `Insignia` en voz humana: Dueño ·
  Profesional · Recepción) · estado del vínculo (activo / invitación
  `pendiente`·`expirada`) · `desde` (fecha de alta del vínculo, mono).

**Se DESCARTA a propósito:**
- `token` de invitación (JAMÁS toca la UI) · ids (`empleado_id`,
  `user_id`, `prestador_id`) · `asignado_por`/`asignado_en` (auditoría de
  motor, no v1) · la columna `rol` LEGACY del vínculo (CONGELADA, D-486 —
  ningún lector nuevo la lee) · `prestador_empleado_servicios` (D-463
  fuera de v1, Chanel c) · credencial/documentos (§14.2 tiene su casa) ·
  los estados finales de invitación `aceptada`/`cancelada`/`rechazada`
  (la aceptada ES la fila de miembro; cancelada/rechazada no se listan en
  v1 — historial sin demanda).

**PEDIDOS DE MOTOR (a declarar, con gate por el helper — cero SQL en este
boceto):**
1. **Lector de equipo** (`obtener_equipo_negocio` o wrappers RLS): vínculo
   + roles + nombre/contacto de la persona + invitaciones vivas. El
   nombre del miembro exige decisión de fuente (profiles tiene RLS
   solo-miembro de familia): patrón D-455 (DEFINER angosta, campos
   MÍNIMOS, gate `empleado_tiene_rol(dueño)`).
2. **La invitación no porta el rol nuevo:** `empleado_invitaciones.rol`
   tiene CHECK **solo 'empleado'** (relevamiento `500ee8d`). Camino v1
   BARATO (voto): invitar SIN rol y asignarlo cuando la persona aparece
   en la lista — cero cambio de motor, y el estado "sin permisos todavía"
   ya está declarado y es honesto. Camino alterno (extender CHECK + RPC
   para que la invitación porte rol) = motor nuevo; se decide en mesa si
   el flujo de dos pasos molesta en el gate.
3. **Desvincular** = `activo=false` (el mecanismo probado de `14e49fa`) —
   exige productor RPC o policy UPDATE del dueño; se releva cuál existe
   antes de pedir (L-141).

## 5 · Pasada de diccionario M5

19.1 CeldaNavegacion (entrar) ✓ · 19.2 UN primario (Invitar) ✓ · 19.4
Insignia para rol pasivo ✓ · 22 Interruptor para binario de rol ✓ · 22c
desvincular como comando ✓ · 19.7: cero acción de contorno en filas — la
fila del miembro tapea ENTERA al detalle ✓ · Ley 23 puerta por rol ✓ ·
Ley 3: fechas en mono (`fechaCortaMono`), enums jamás visibles ✓ · cola
de scroll con `insets.bottom` ✓ · L-162: la Hoja de invitar tiene Campo →
captura doble en el gate ✓.

**FIRMA de la pantalla (Ley 15):** la firma ES LA FIRMA — el bloque de
identidad del negocio presidiendo (logo contenido con aire + nombre
comercial), la primera vez que el prestador se VE como negocio en su
propia app (tesis de PRESENCIA: "su vidriera, no la herramienta de
otro"). El equipo debajo se mantiene callado (filas serenas) para que
respire.
