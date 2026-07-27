# S79-B · TANDA 3 — LA CAPTURA DE LA SEDE Y LA SALA DE ESPERA

**Fecha:** 27-jul-2026 · **Sesión:** B · **Territorio:** `apps/prestador`.
Curas del gate (B1) + la sede (B2) + la sala de espera (B3) + el runbook del
gate en dispositivo (B4). M1 antes de composición; typecheck VERDE al cierre.

## 1. B1 — LAS TRES CORRECCIONES DEL GATE (aplicadas)

1. **El radio arranca SIN declarar (firma founder).** El M1 de T2 llevaba 15
   preseleccionado — el DEFAULT que la letra mató en el DDL, resucitado en
   pantalla. Corregido en el doc de T2 (§6) y construido así: sin radio →
   `TarjetaEstado` en CONTORNO con la voz *"Sin un radio declarado, las
   familias no saben si les llegas. Buscan por cercanía."* y el 15 como
   sugerencia EN SU ETIQUETA (`"15 km · sugerido"`), nada preseleccionado;
   solo el toque explícito escribe (y el sufijo "sugerido" muere al declarar).
   Con radio → APOYADA: *"Las familias hasta {{km}} km te encuentran."*
2. **La voz del interruptor de la vitrina:** `equipo.vitrinaToggle` pasó de
   *"Mostrar a tu equipo al reservar"* (se leía configuración interna) a
   **"Dejar que las familias elijan con quién"** (es/en, al lote S79).
3. **La nota "bloqueado por el brief" MURIÓ** del M1 del perfil (doc T2):
   la pregunta está resuelta — default vivo era 5, cayó DEFAULT y COALESCE,
   NULL = "no declaró".

## 2. B2 — LA SEDE (construida sobre el contrato VIVO)

**`components/seccion-sede.tsx`** — compartida (perfil + sala de espera),
espejo del patrón A4 del cliente (`direccion-hogar-form`, copiar-al-vecino):
predicciones inline con debounce 350ms, elegir cierra la sesión con Details,
`sin_configuracion` degrada en silencio a captura manual. **Las dos leyes,
respetadas y DICHAS:**
- `resolverLugar` es la única fuente de lat/lon — jamás coordenadas inventadas.
- **La coordenada muere con el texto:** editar a mano mata el lugar, y la
  ayuda del campo lo dice — *"Ubicada en el mapa."* SOLO cuando es verdad;
  editada a mano: *"Escrita a mano — sin punto en el mapa."*

**En el perfil:** la sede read-only MURIÓ (*"se cambia con el equipo de
e-PetPlace"* dejó de ser verdad — keys `sedeLabel`/`sedeAyuda`/`sinCargar`
muertas, Ley 37) y entró la sección "Dónde atiendes" (glifo `ubicacion`
existente) DESPUÉS del Guardar del perfil: sus escrituras son propias (la
dirección con su botón; el radio por toque) y el Guardar de arriba no las
arrastra.

**LA HISTORIA DEL TRIPWIRE (registro de método):** esta pieza nació ANTES de
T4.1 con lectura defensiva y un TRIPWIRE de compilación (`lib/sede.ts`: si
`radio_cobertura_km` entraba al input del wrapper, el typecheck ROMPÍA — el
contrato no podía aterrizar en silencio con la pantalla diciendo "guardado"
sin persistir). **El tripwire DISPARÓ EN LA MISMA TANDA** (A aterrizó
`6f864e6` mientras B construía): murió con su trabajo hecho y `guardarSede`
quedó passthrough tipado. Cero ventana en la que la pantalla mintiera.

## 3. B3 — LA SALA DE ESPERA (`/sala-espera`)

**La condición de alcance, cumplida:** es el perfil de la sede EN OTRO MARCO —
la misma `SeccionSede`, distinto encabezado. Cero composición institucional.
- **El marco:** la voz del landing REUSADA tal cual (`bienvenida.titular` /
  `bienvenida.subtitulo`, aprobadas) + una línea propia:
  *"Tu espacio está en revisión. Mientras tanto, puedes dejar todo listo de
  tu parte."*
- **QUÉ FALTA DE TU PARTE** (checks patrón D-521 — señal positiva verificada,
  un fallo jamás fabrica estado): dirección y radio (su camino ES la sección
  de abajo y la fila lo dice) · cuenta comercial → `/cuenta-comercial` ·
  título profesional (solo `tipo='clinica_veterinaria'`) →
  `/veterinaria/verificacion`.
- **QUÉ PASA DESPUÉS:** *"Hay una revisión humana del otro lado… Cuando esté
  lista, te avisamos. No prometemos un plazo que no controlamos."*
- Cerrar sesión al pie (sin él, el pendiente queda preso de la pantalla).

**LA REGLA DURA (guard raíz):** `estado === 'pendiente'` se intercepta ANTES
que todo — ni portal ni carta (la bienvenida §2.3 espera al primer ingreso
REAL: `primer_ingreso_en` marca la fase 4, no la 1). Forense `[sesion]`:
`"estado 'pendiente' → /sala-espera"`.
**Declarado a la mesa:** el guard gatea el literal `'pendiente'` (la letra);
la fila viva `en_revision` (Carlos, S75) NO cae en la sala — si la mesa
quiere que caiga, es una palabra en el guard, decisión de letra, no de B.
**Declarado:** `/sala-espera` no re-gatea por estado adentro (el guard
gobierna; un activo que navegue directo ve una pantalla inofensiva).

## 4. B4 — EL RUNBOOK DEL GATE EN DISPOSITIVO (una sola pasada, cuenta virgen)

> Precondición: APK 1.0.3 + OTA de S79 publicado contra runtime 1.0.3 (regla
> en piedra del cierre S78 — NADIE publica contra 1.0.2 para esa APK).
> El gate EMPIEZA confirmando el marcador EN PANTALLA: tab Cuenta → pie
> (`update XXXXXXXX · preview`) contra el group publicado (L-160/L-138).
> Exige: cuenta VIRGEN de la cohorte (titular, estado activo, cero config)
> — y si A tiene una cuenta 'pendiente' de prueba, el paso 7.

1. **LA CARTA (§2.3):** login con la cuenta virgen → aterriza en la carta
   sola (sin tocar nada). Verificar: saludo por nombre · "uno de los 15" ·
   la firma · la línea del Día 90 · UNA sola acción. Tocar "Entrar a mi
   espacio" → no vuelve a aparecer (cerrar y reabrir la app lo prueba).
2. **EL MODO PREPARACIÓN:** el HOY SIN "Hoy no tienes citas": la FIRMA
   (logo/monograma + nombre + oficio·ciudad + pill "Prestador fundador")
   presidiendo + "Prepara tu espacio" (4 tareas con su porqué, sin checks)
   + el texto aspiracional al pie.
3. **LA CAPTURA DE LA SEDE:** Cuenta → Tu perfil → "Dónde atiendes".
   Tipear una dirección real → predicciones → elegir una → el campo se
   completa con su ciudad y dice "Ubicada en el mapa." → Guardar dirección.
4. **LA COORDENADA MUERE CON EL TEXTO:** editar UNA letra de la dirección →
   la ayuda cambia a "Escrita a mano — sin punto en el mapa."
5. **EL RADIO SIN DECLARAR:** verificar el CONTORNO con su voz y "15 km ·
   sugerido" SIN nada elegido → tocar 15 → la tarjeta pasa a APOYADA con
   "Las familias hasta 15 km te encuentran."
6. **EL CIERRE DEL CÍRCULO:** activar un servicio + horarios en el taller →
   volver a HOY → el check de la tarea aparece; con servicios+horarios el
   módulo entero DESAPARECE y vuelve "Hoy no tienes citas" (recién ahora la
   promesa es alcanzable).
7. **LA SALA DE ESPERA** (si hay cuenta 'pendiente'): login → aterriza en la
   sala, sin acceso al portal; los caminos de cuenta comercial y título
   navegan; cerrar sesión funciona.
8. **GATE POR ÍCONO del micrófono (§6bis, pendiente desde S78):** la lámina
   `docs/relevamientos/2026-07-27-s79b-mic-montaje.svg` (21px/44px · claro y
   oscuro · reposo y escuchando, junto a 5 del registry). Veredicto explícito.
9. **EL LOTE DE STRINGS S79** (leer y aprobar, L-142) — con las correcciones
   B1 adentro: `dia1.*` (la carta; **`firmaNombre` YA FIRMADO por literal del
   founder: "Guillermo Suárez / founder, e-PetPlace"**) · `preparaEspacio.*` ·
   `agenda.aspiracional` (N=15) ·
   `sede.*` · `salaEspera.*` · `despierta.*` + `negocio.despierta*` ·
   `miCuenta.oficioAdiestramiento/oficioVeterinaria` (y la muerte de
   `oficioAmbos`) · **`equipo.vitrinaToggle` corregida**: "Dejar que las
   familias elijan con quién".

## 4bis. FALLA REAL ATRAPADA POR M3 (y curada en la fuente)

La primera corrida de la captura T3 falló y el diagnóstico encontró un BUG de
la carta (T2): el CTA "Entrar a mi espacio" tocado ANTES de que las lecturas
de la carta terminaran dejaba `userId` en null → la marca de vista NO se
escribía → el guard rebotaba al usuario DE VUELTA a la carta. **Un loop para
el dedo rápido** — la clase de desvío que ningún typecheck ve (la razón de ser
de M3). Cura: `entrar()` resuelve la sesión por sí mismo si la carta aún no
cargó — la marca no depende del estado de la pantalla. Verificado en la
segunda corrida (el flujo carta → HOY pasó).

## 5. M3 — capturas de esta tanda (web 420×900, `scripts/captura-s79b-t3.mjs`)

- `s79b-t3-perfil-sede.png` — "Dónde atiendes" en el perfil con predicciones
  REALES de Places (contrato vivo; no se eligió ninguna para no escribir
  sobre la fila del demo).
- `s79b-t3-sala-espera.png` — la sala por URL directa (el demo es 'activo':
  el estado 'pendiente' real no existe en el árbol de B — verificarlo es del
  gate en dispositivo, paso 7).
**Límite declarado:** el estado CONTORNO/APOYADA del radio del demo refleja
su fila real; el contorno virgen se verifica en el paso 5 del runbook.

## 6. Deudas candidatas nuevas (las deposita A, 76(a))
- La sala de espera con `en_revision` fuera del gate (decisión de letra, §3).
- `sector` entró al contrato T4.1 y la superficie B no lo captura todavía
  (la sede v1 guarda direccion+ciudad+lat/lon; sector espera su fila).
