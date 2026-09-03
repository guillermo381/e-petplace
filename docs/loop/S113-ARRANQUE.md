# S113 · ARRANQUE — el brief semilla

> Corto a propósito. Detalle completo en `S112-CIERRE.md` y
> `S112-HOJA-DE-DECISION.md` — se leen antes de construir.

---

## PUBLICADO, y dónde

Siete OTAs de S112, runtime **1.0.7**, canal **preview**. El último ancla
`e29238a9`. **Nada tocó producción — la veda sigue entera.** El founder
recorrió y aprobó **el lote 5** en aparato (3-sep); los lotes 3 y 4 **no se
verificaron en un teléfono**.

## CONSTRUIDO Y NO PUBLICADO

- **La burbuja del refugio en el prestador** (mensajes + solicitudes),
  mergeada en `main`, cero aparato. **Primer objetivo de S113.**
- `D-485` (motor) está publicado en el lote 7; el hook curado también.

## OBJETIVOS CANDIDATOS, sin orden fijado

1. **Publicar y gatear la burbuja de pendientes** (las dos apps, las dos
   clases del refugio).
2. **Pet Parent v1.0** — redactar y depositar el T&C, montar el motor de
   aceptación (patrón ya probado, reusar tal cual).
3. **Padrinazgo y donación** — bloqueados en el 5 %/IVA, esperando al
   contador.
4. **El protocolo del animal no retirado** — esperando al abogado (memo 10
   §3).
5. **La primera pasada de producción** — cuando el founder autorice, sobre
   lo que ya recorrió.

## LAS TRES COSAS QUE ESTA SESIÓN NO DEBE DAR POR HECHAS

1. **Nada de los lotes 3, 4 y 5 está verificado en aparato salvo lo que el
   founder recorrió explícitamente el 3-sep** (el hilo de adopción abre en
   las dos apps). Todo lo demás — la vitrina, los filtros, el clip, la
   bitácora, el quinto oficio — se leyó del objeto, jamás de una pantalla.
2. **El reloj de 5 días nunca emitió su primera notificación real**, y no
   puede: las solicitudes vivas hoy nacieron antes de que el mecanismo
   existiera. No es un defecto — es un no-evento que se prueba esperando.
3. **El binario instalado es 1.0.7, y dos cosas esperan build nativa**:
   `expo-clipboard` en el prestador (declarado, sin hornear — el botón
   "Copiar" de la pantalla forense no funciona hasta la próxima APK) y
   ninguna otra dependencia nueva pendiente. `useAnimatedKeyboard` fue
   **retirado**, no agregado — no genera deuda de build.

## DATOS OPERATIVOS QUE CUESTA VOLVER A MEDIR

- **Clínica Aurora (demo-vet)** = `guillo381+demovet@gmail.com` · prestador
  `de680000-0000-4000-8000-0000000000e5`.
- **Refugio de prueba** = `guillo381+refugio@gmail.com`, clave propia del
  founder.
- **La clave compartida** (`guillo381+N@gmail.com`) sale del keychain al
  momento: `security find-generic-password -a siembra -s
  epetplace-siembra-s97 -w`.
- **`hoy_local()` usa `America/Guayaquil` fijo** — pedir el día equivocado
  devuelve filas, no error. Ver `D-1007`.
- **`core.hooksPath` es una ruta absoluta al árbol principal** (`L-490`) —
  el hook que corre para CUALQUIER worktree es el del árbol que conduce
  `main`, no el de la rama de quien commitea.
- **652 migraciones, local = remoto.**
