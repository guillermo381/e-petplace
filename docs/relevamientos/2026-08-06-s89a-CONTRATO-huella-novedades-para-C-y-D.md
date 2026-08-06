# S89-A · CONTRATO PARA C Y D — LA HUELLA MIDE LO NUEVO (letra founder, 6-ago-2026) · **v2: LA VISITA ES POR USUARIO Y APP** (orden 6, mesa)

**LA LETRA:** la campana registra la última visita; la huella del techo deja
de preguntar «¿hay algo sin leer?» y pregunta **«¿hay algo POSTERIOR a tu
última visita?»**. Entrar a `/avisos` deposita la visita. **El estado leído
por aviso NO cambia** — `marcarAvisoLeido` y su ley («no existe marcar
todos») quedan intactos.

**v2 (orden 6):** **la visita lleva el eje `app`** — visitar la campana del
CLIENTE no apaga la huella del PRESTADOR: cada casa tiene su propia última
visita. El par del eje lo probó: visita cliente → cliente `false` / prestador
`true`. *(El v1 de este mismo doc era solo-por-usuario; las firmas de abajo
son las vigentes — migración `20260806240000`, las 0-arg murieron con DROP
explícito, cero sobrecargas zombis.)*

## El contrato (vivo en `@epetplace/api`, typecheck verde)

```ts
type AppCampana = 'cliente' | 'prestador';
```

| pieza | firma | cuándo se llama |
|---|---|---|
| `hayNovedades(app)` | `(app: AppCampana) → ResultadoWrapper<boolean, CodigoCampana>` | donde hoy se llama `hayAvisosSinLeer` (el punto del techo) — **cada app pasa SU nombre** |
| `registrarVisitaCampana(app)` | `(app: AppCampana) → ResultadoWrapper<null, CodigoCampana>` | **al ENTRAR a `/avisos`** (mount de la pantalla), con el nombre de la casa; disparar y seguir (el fallo no bloquea la lista) |
| `hayAvisosSinLeer()` | `@deprecated` | NO usar en código nuevo — vive solo porque los bundles publicados la llaman |

**La semántica que la superficie hereda gratis:** la huella se apaga al
VISITAR, no al leer — una persona que entró, miró la lista y no tocó nada,
tiene la huella apagada (eso es la letra, no un bug). Leer un aviso puntual
no toca la huella. Un aviso nuevo después de la visita la enciende de nuevo.

## Lo verificado (par de 6 brazos, camino real, in-txn ROLLBACK)

sin visita → true · visita → false · aviso posterior (timbre + despacho
reales) → true · **leído ≠ visto: marcar leído y la huella SIGUE encendida
(el discriminador de la letra)** · re-visita → false · anon rebota 42501.
*(Nota L-122a del par: el orden temporal se simuló con ±ms declarados — now()
es constante en la txn; en producción cada acto es su propia transacción.)*

## El asiento (motor — por si alguien lo audita)

`notificacion_campana_visita` (user_id PK → auth.users, `visitada_en`) —
ilegible por PostgREST (REVOKE total, cero policies): las DOS RPCs DEFINER
son la única puerta. `hay_novedades()` espeja el predicado de visibilidad de
la campana (`despacho='para_transporte'`, sin filtro de canal) — lo que no se
ve no es novedad. Migración `20260806220000` · reversa depositada.

## El entierro pendiente (a mesa, no ahora)

`hay_avisos_sin_leer` (RPC) queda DEPRECADA VIVA: los bundles del canal
preview publicados hoy la llaman (D-662 — matarla acoplaría migración y
publish). Muere cuando ningún bundle servido la consulte — **la premisa P5
del censo es el instrumento que lo va a decir.**
