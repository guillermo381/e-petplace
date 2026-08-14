# S97-A · HANDOFF DE CIERRE (13/14-ago-2026)

**Para la próxima instancia de A: esto se lee ANTES que cualquier backlog.**
Todo lo de abajo está en origin hasta `139ba95e`. Árbol limpio al cierre.

---

## 1 · LO QUE QUEDÓ VIVO Y FUNCIONANDO (verificado, no declarado)

### D-786 — CERRADA COMO INCIDENTE
El teléfono del founder corre la cabeza; cadena verde de punta a punta con
literal en la ficha. **Causa puntual SIN identificar a propósito** (prohibida
la causa probable). El toque del founder llegó y está registrado. D-785
subió a 🔴 y hereda el valor (falla en silencio Y funciona en silencio se
ven igual — el brazo ① es lo único que separa esto de repetirse).

### El catálogo maestro — CARGADO Y VIVO
- **527/527 variantes · 470 productos**, por puerta única
  (`proponer_producto_canonico` + `declarar_composicion_estado` +
  `adjuntar_fotos_producto`), cero INSERT directo.
- Familias: alimento 225 · antiparasitario 103 · suplemento 68 ·
  **dieta_prescripcion 47 (familia propia, firma founder)** · higiene 8 ·
  heno 7 · acondicionador_agua 8 · sustrato 4 · accesorio 0 (activa, sin
  productos — el archivo no traía).
- Composición: 202 `declarada_sin_verificar` · 267 `ausente` · 1 `no_aplica`
  · **0 `verificada`** — firma de mesa: *el estado que calla SE GANA contra
  el envase, no se hereda*.
- `vendible` en `true` en todo — firma: *puerta comercial, no cómputo*.
- Fichas por familia: 229 nutricional · 143 dosificación · 9 accesorio.
- **Verificado vivo por camino de app** (autenticado; `anon` no tiene grant
  en `productos` — correcto, la despensa vive tras login): 150-520 ms por
  consulta, nada se arrastra.
- Fuente: `~/Downloads/Catalogos/catalogo_INTERNO_epetplace_ENRIQUECIDO.xlsx`
  (headers fila 4). Extractor y lotes en el scratchpad de la sesión
  (efímero); el método queda en
  `2026-08-13-s97a-carga-catalogo-maestro.md`.

### Los OTA del día (canal preview, runtime 1.0.5, todos guard §3bis VERDE)
| id (pie) | ancla | qué lleva |
|---|---|---|
| `019ffdb9` | `deea7906` ⚠️ asterisco (WIP de B en packages/ui al bundlear, typecheck verde con él — declarado) | configuración §8.6bis + maestro |
| `019ffdc8` | `0aa0c2bf` limpia | Insignia onPress (B) + interim muerto (C) |
| **`019ffddc`** | `27d626d7` limpia | **D-791 superficie: lo registrado se REABRE; la línea del compromiso en vivo — ES EL DEL GATE** |

### La siembra de cuentas (matriz completa en `2026-08-13-s97a-matriz-cuentas-prueba.md`)
4 negocios activos (duenovet · duenoser · duenodes · duenotodo) + personas +
`vet4` con chips — clave unificada en keychain `epetplace-siembra-s97`
(cuenta `siembra`; JAMÁS al repo). Renombres: vendedorpuro · nuevotest2 ·
demovet (login verificado). **El ancla del repartidor VERIFICADA por camino
de app**: sesión de `+desrepartidor` ve 1 envío `en_reparto` (`64f2818a`).
Agenda de HOY sembrada en Clinica S97 (3 citas, 3 estados, cobro presencial
$5 — plata del día para titular/vetadmin).

### D-791 — las dos mitades de motor de A, HECHAS
- `actualizar_repartidor` corrige `documento` (colisión rebota
  `documento_en_uso`; cinturón residuo 0; migración `20260813230000`).
- `definir_regla_envio_vendedor` **ya corregía por re-invocación** (medido);
  nace el lector `obtenerReglaEnvioActiva` para el prefill de C.
- Lo que queda de D-791 es de C (pantalla) + **el gate del founder sobre la
  primera ejercitación real de la línea del compromiso** (nota de mesa en la
  ficha).

### El alta del vendedor puro — COMPLETABLE (migración `20260814000000`)
`cuenta_comercial_documentos` (colgada de la CUENTA, firma de mesa) + bucket
privado `cuenta-documentos` llaveado por operador + `revisar_documento_cuenta`
(admin) + `actualizar_nombre_cuenta_comercial` (owner; tercero rebota).
Wrappers: `listarDocumentosCuenta` · `registrarDocumentoCuenta` ·
`actualizarNombreCuentaComercial`. **El perfil público del puro NO nace: v1
no lo exige (§2.1) — declarado.**

---

## 2 · LA COLA DE A, EN ORDEN (mesa post-gate)

1. **A-3** — el radio de cobertura EN LA CUENTA COMERCIAL (hoy
   `radio_cobertura_km` vive solo en `prestadores`; el slider de C es
   drop-in: `apps/prestador/src/lib/escala-radio.ts` ya existe, 5–50 de a 5,
   default 15).
2. **A-1** — activación de familias por vendedor, **con el guard
   activar-NO-publica EN EL MOTOR** (activar filtra lo que el vendedor ve;
   la curaduría sigue por SKU — §8.6bis).
3. **A-2 · A-5** — el resto del esquema de configuración (colgado de la
   cuenta comercial; el literal de los pedidos de C vive en sus commits
   `965c975d` y `3ce67439`).
4. **A-8** — envíos vivos POR repartidor (sin él, apagar un repartidor no
   puede decir qué queda comprometido — la ley del cambio muda en ese
   camino).

## 3 · FRENOS Y PENDIENTES QUE NO SON DE A (que nadie los herede en silencio)

- **El gate del founder sobre `019ffddc`** (la línea del compromiso en vivo)
  — y las cuatro pantallas de §11 de DIRECCION_ARTE (condición de salida en
  su historial).
- **vet1/vet2/vet3 intactos** — la terna se cerró sin ninguna; el borde de
  dos negocios es **D-787** (letra antes que datos).
- **El vocabulario de alérgenos corto contra el catálogo real** (gluten 119
  · trigo 118 · maiz 110 · huevo 46 · lacteos 23 · cereales 19 · mani 4 ·
  frutos secos 4) — ampliar es decisión clínica de mesa (INSERT +
  RELACIONES), no de cargador. Sin riesgo mientras tanto: nada `verificada`.
- **D-788** (el DESPUÉS del vendedor: cuándo cobra — sin letra) · **D-789**
  (rename SliderPrecio en ventana coordinada) · **D-790** (cómo se detecta
  una letra superada — pregunta abierta) · **D-767** (falta el COMMENT de
  `imagenes`, forma medida `["url",…]` — viaja en la próxima migración).
- **La cláusula T&C del catálogo maestro** depositada en
  `docs/legales/TERMINOS_VENDEDOR_CLAUSULAS.md` — la integra la sesión de
  LEGALES (D-405), visible al firmar.
- **Los 30 fuera de las tres familias comerciales** entraron al maestro con
  sus familias propias (higiene/heno/acondicionador_agua/sustrato activas
  para el maestro); su línea comercial la gobierna `vendible` + el cuarto ①.

## 4 · REGLAS NUEVAS DEL MÉTODO (depositadas hoy — leerlas antes de operar)

- **§6bis** — el teléfono es ENTREGA (ventana, no paso; keyguard no la
  cierra; al devolver se declara la sesión).
- **§6ter** — ninguna pista cambia la clave de una cuenta que no creó.
- **§6quater** — ninguna orden de construcción cita letra fuera de origin.
- Territorio B = «el lint y los jueces» (criterio, no lista).

## 5 · OPERATIVO

- **3 migraciones nuevas** (`20260813200000` vendible+familias ·
  `20260813210000` tronco/fichas/ingerible/demanda · `20260813230000`
  repartidor-documento · `20260814000000` alta-puro = 4), todas con reversa
  ANTES en `scripts/s97/`, cinturones con discriminador, 76(g) declarada,
  L-140 en toda puerta nueva. `gen:types` en sync, typechecks verdes.
- **Trampa del runner de `db push` medida:** dentro de un DO, `RESET ROLE`
  no vuelve al dueño — usar `SET LOCAL ROLE postgres` explícito.
- **Trampa del CLI `db query` medida:** un archivo = UNA transacción — un
  SELECT roto al final REVIERTE el DO exitoso de arriba (se pagó una vez con
  la siembra de agenda).
- `eas-cli` SIEMPRE desde `apps/<app>/` — el stub `app.json` de raíz
  apareció una vez más y se borró.
