# S88-C — ESTADO DE CIERRE DE LA PISTA C (6-ago-2026)

Depósito ordenado por la mesa al cierre de S88. La próxima C abre acá.

## 1. Territorio y entorno

- **Territorio:** `apps/prestador` + su canal OTA (preview). A = main/DB/api/docs/merges/publishes · B = packages/ui/lint · D = cliente.
- **Worktree:** `e-petplace-s87-C`, rama `pista/s87-c`.
- **Regla 87, cobrada DOS veces esta sesión** (la rotación de credenciales
  y el Expo Go residual de D — ambos por comandos sin serial): **todo
  `adb` con `-s <serial>` explícito, siempre**, aunque haya un solo
  aparato conectado.

## 2. Rama y hash al cierre

- **`ec96132`** · árbol limpio · `tsc` verde en los 4 paquetes ·
  `verify:diseno` VERDE (24 reglas, R32 encendida con 1 montaje).
- **Commits de C sin mergear a main al cierre** (el merge es de A):
  `1fc5d17` (voz GateAjeno) · `0376c11` (Preferencias) · `6e1e801`
  (pantalla avisos) · `3ed8e27` (líneas firmadas) · `ec96132` (techo
  campana). Ya publicados antes: `b823eaa` + `c628782` (bundle `019fd533`).

## 3. Lo construido por C en S87→S88 (una línea cada uno)

- **El reset en dos pasos** (`recuperar.tsx` + CampoCodigo + la cura del bucle — D-659 muerta con dedo founder).
- **El home por rol sin parpadeo** (rol resuelto en el loader ANTES de pintar).
- **La banda «En la puerta»** en el HOY (vacía no se pinta; verificada con datos reales en Paseos Andres).
- **La consolidada con su verbo** (pizarra: el profesional TOMA, el asignador ASIGNA — la Hoja sobre `obtenerPersonasParaAsignar`, que espeja la puerta byte a byte; el envolver `columnas` — «sin horario» jamás se trunca).
- **La vitrina por titularidad** («Tu perfil»/«Tu negocio» solo titular) + **GateAjeno** con su voz curada al predicado REAL («del titular del negocio», es+en).
- **El entierro de `agenda-recepcion.tsx`** (censo previo 11 capacidades → 3 huérfanas → firma → borrado).
- **D-664 en superficie** (las cuatro derivaciones `esDueno` muertas — equipo/mascotas→gestiona · cuenta/perfil→esTitular; dedo VERDE entero en dispositivo, 5-ago 23:19–23:29).
- **PREFERENCIAS DEL PRESTADOR** (`0376c11`+`3ed8e27`): la forma del cliente, la voz del oficio (excepción §6) — canales firmados («En el teléfono»·«Por correo»·«WhatsApp»·«En la app»), las seis líneas de ejemplo FIRMADAS, fila sin tipos vivos derivada del catálogo (`tieneTiposVivos`, cruce FIRMADO por A), opt-in WhatsApp con literal-como-evidencia, permiso-push v2 porteado, `notifPronto` muerta.
- **LA CAMPANA** (`6e1e801`+`ec96132`): pantalla `/avisos` (voz como dato, marcar leído + al lugar del hecho, vacío honesto, sin «marcar todos») + el techo con la esquina firmada (Badge huella de B + glifo del registry, `hayAvisosSinLeer` booleano, gap 20dp con R32 VERDE — que primero dio ROJO con razón y parió `IdentidadDelTecho`). **Ley de secuencia intacta: `transporte_vivo` sin tocar.**

## 4. Lo que quedó SIN hacer (explícito, sin maquillaje)

- **El ocultamiento de «Lo que ya pagaste» — FRENO DECLARADO:** la mesa
  firmó que esa fila NO se muestra al prestador, y «tipos vivos PARA ESTA
  AUDIENCIA» **no es derivable con lo que hay** (`cat_notificacion_tipos`
  sin columna de audiencia, medido contra `information_schema`). La fila
  queda **visible sin línea de ejemplo** hasta que A dé el dato
  (propuesta: columna `audiencia`; `salud_seguridad` pre-adjudicada
  VISIBLE por la mesa).
- **NINGÚN dedo del lote final corrió:** las dos pantallas, la voz de
  GateAjeno y el envolver-en-techo esperan **la veda de A** (los 5
  commits no están en ningún bundle). El gate del founder tampoco corrió.
- **El opt-in de WhatsApp está construido y JAMÁS ejercitado** (ni el
  rebote `opt_in_sin_evidencia` producido) — es dedo del bundle.
- **Censo a B sin cura:** `Badge` pinta la huella con `accent.active` =
  `tealDark #0A7268` en claro — **el mismo hex del muro del techo**: la
  huella puede ser invisible exactamente donde la lámina la manda. La
  cura es de la pieza (regla del muro); el gate del founder lo va a ver.
- **«Only the owner sees earnings» del tab Data:** A lo contestó en el
  motor (`6f0738f`) — la superficie NO fue re-medida por C después.

## 5. Dedos pendientes (vehículo: el bundle de la próxima veda)

- **Preferencias:** 6 filas con sus líneas firmadas · `resumen` ausente ·
  rebote `categoria_no_apagable` en una no-apagable · la Hoja de WhatsApp
  con su literal y el rebote sin evidencia · permiso del SO negado dicho.
- **Campana:** huella presente con el fixture D-671 → desaparece al leer
  todos · la lista con los 4 estados · destino al lugar del hecho ·
  vacío honesto · **nombre largo y en inglés** (la línea de la lámina) ·
  el toque no abre lo que no era (la banda de 20dp).
- **Viejo:** la voz nueva de GateAjeno vía deep link con el admin.
- **Cuentas:** (a) `+s87prof` · (b) `+s87recep` · (c) `demo-prestador`
  — `S87prueba!2026` · admin `+s88rolpuro` — `S88puro!2026`.
  **Todo recuento excluye `+s87`/`+s88` o miente.** ⚠️ (c) volvió a
  fallar login el 6-ago (misma causa raíz de aparato) — verificar con la
  sonda ANTES de gastar dedos.

## 6. Notas operativas (las que ya costaron arcos)

- **EL EMULADOR (D-655, dos veces pagado):** exige DNS explícito y
  lanzamiento DESACOPLADO del turno o muere con él:
  ```
  cd /tmp && nohup ~/Library/Android/sdk/emulator/emulator -avd <avd> \
    -dns-server 8.8.8.8,1.1.1.1 -no-snapshot-load > /tmp/emu.log 2>&1 & disown
  ```
- **`adb -s <serial>` SIEMPRE** (regla 87 — dos cobros esta sesión).
- **`rm /sdcard/ui.xml` ANTES de cada `uiautomator dump`** — uno rancio
  devuelve la pantalla anterior y casi mide por vos.
- **La sonda funcional de credenciales** discrimina credencial muerta de
  fallo de UI en un curl: `POST <supabase>/auth/v1/token?grant_type=password`
  con la anon key de `.env.local` — 400 `invalid_credentials` = clave
  rotada; una sesión residual puede fingir un verde.
- **`eas-cli` SIEMPRE desde `apps/prestador/`** (el scaffold del stub
  depende del directorio, aunque solo mires).
- **Commits:** `-F` con backticks (el shell los ejecuta en `-m`) · forma
  pathspec · **`git add -N` para archivos nuevos** (la pathspec no los ve
  — cobrado en esta sesión).
- **R32 enseña estructura:** el gap de la esquina debe ser LEGIBLE a ±25
  líneas del montaje — si tu fila es larga, extraé la identidad a una
  pieza; el guard que te obliga a eso tiene razón.
- **El marcador se verifica en pantalla Y logcat tras forzar detención
  ×2, ANTES de medir nada** (L-160); captura pre-envío de toda clave.

## 7. El aparato al cierre

- Expo Go residual de D: **desinstalado** (decisión de C sobre su
  aparato; solo queda `com.epetplace.prestador`).
- **Emulador `emulator-5554` APAGADO al cierre y el aparato SUELTO**
  (regla 87): con la sesión cerrando, un emulador vivo sin dueño solo
  puede seguir rotando credenciales. `emulator-5556` (crashD) es de D —
  C no lo toca.
