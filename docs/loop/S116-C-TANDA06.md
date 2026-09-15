# S116-C · TANDA SIN SUPERVISIÓN — el parte

**Rama `pista/s116-c-06`**, worktree propio, nacida de `main @ a3b8a257`.
**Un commit por punto, los cinco pusheados. Cero merges a main, cero OTA.**

| # | punto | SHA | estado |
|---|---|---|---|
| 1 | los dos rojos de voz (`D-1088` · `D-1089`) | `9cffc408` | ✅ verdes |
| 2 | las ~18 pantallas sin cabecera | `535348c0` | ✅ 31 decididas |
| 3 | **Actividad**, la pantalla propia | `ea03313a` | ✅ |
| 4 | la confirmación + el paseo de prueba | `6285786e` + `2615df27` | ✅ con un NULL |
| 5 | la onda al borde físico | `ef40fb88` | ✅ **medición, no cura** |

**Gates al cierre:** `tsc` 0 en las cuatro superficies · `verify:diseno` VERDE
(80) · `piezas-locales` · `techos-locales` · `catalogo-v5` · `moneda` ·
`habla-en-presente` · `pide-en-memorial`, los siete VERDES.

---

## Lo que cambió de lo que el encargo suponía — tres veces

**① El punto 2 no eran «18 pantallas sin cabecera»: cinco tenían una LOCAL.**
Montaban `CabezalOficio`, que pinta `bg.base` **plano**. El censo del 3b no la
vio (buscaba `Encabezado`/`Cabecera`) y `verify:techos-locales` tampoco (su
marcador es un degradado, **y su propia cabecera declara ese punto ciego**).
*Dos instrumentos con el mismo punto ciego y el hueco justo en el medio.*

**② El punto 5 no era del montaje.** El montaje ya cumplía lo que B pidió. La
onda **sí llega al piso**; encima está el velo de contraste de Android, y eso se
apaga con config nativa ⇒ **lote 8, de A**. Lo prueba un control de tres
pantallas cuya aritmética cierra en los nueve canales.

**③ La dirección no había perdido su motor.** Censé los 118 archivos que tocó la
migración por símbolo desaparecido: **cero**. Lo que hay es peor y más viejo, y
está abajo.

---

## Lo más caro que encontré: la dirección no se podía guardar

Cuatro defectos encadenados, los cuatro **silenciosos**:

1. **Places responde `403`** (medido contra la edge con sesión real:
   `google_rechazo`). El campo **sí** lo llama; quien dice que no es Google. Y el
   403 **no habla**: `buscadorApagado` sólo cubre el apagado permanente.
2. **El botón de Guardar no existía en el alta.** `hayQueGuardar` sólo lo
   prendían dos botones del modo lectura ⇒ una familia sin dirección escribía y
   **no aparecía nada**.
3. **La app era más permisiva que su motor.** `direcciones_guardadas` exige
   lat/lon **sin condición** (`23514 chk_direccion_con_punto`, medido contra el
   RPC) y **4 de 6 consumidores** pasaban `exigirPunto=false`. En Cuenta eso
   salía como **«Ocurrió un error inesperado»** — el rechazo de un CHECK
   disfrazado de error de servidor.
4. **Faltaba la salida a mano que el diccionario ya prometía**
   (`sinResultados`: *«ponlo a mano en el mapa»*) — y en el alta ese mapa no
   existía.

**Curado y verificado de punta a punta**: escribir → poner el punto a mano →
mover el pin en el mapa → guardar → **aparece en «¿A qué puerta llegamos?» y
«Pagar» queda habilitado**. Confirmado también contra la base.

🔴 **La cura de fondo fue invertir el default**, no agregar la prop en cada
pantalla: *un default que contradice al motor es exactamente cómo este defecto
sobrevivió en cuatro pantallas sin que nadie lo viera.*

---

## Lo que queda NULL, dicho

- **El pago del paseo de prueba.** Sale por DeUna y pide un código de 6 dígitos
  en la app del banco ⇒ **no hay forma de pagarlo sin un pago real.** La
  confirmación con la pieza de la casa queda verificada **por código** (monta
  `dato`, `lineaExtra` y dos acciones; confeti y trío por default de la casa) y
  **no por captura**.
- **El historial de Actividad con datos.** La familia del gate no tiene citas
  pasadas ni pedidos: sus dos citas futuras son **holds expirados**
  (`estado_reserva='expirada'`), que por `D-319` no existen. El vacío que se ve
  **es el correcto**, y está medido.

## Lo que queda en el buzón

- **A / founder** — `S116-C-para-A-places-responde-403.md`: la clave de Places, y
  la decisión de si el 403 habla.
- **B** — `S116-C-para-B-la-hoja-no-llega-al-boton.md`: un *fling* dentro de la
  `Hoja` no scrollea (sólo el arrastre lento), y la capa que bloquea el mapa
  **también bloquea el scroll** sobre sus ~578 px.
- **B** — adenda en `S116-C-para-B-la-onda-SI-llega-al-piso.md`: el control de
  tres pantallas que corrige la atribución del píxel.

## Dos errores míos, declarados

- **`verify:techos-locales` quedó ROJO en `535348c0`** (0 → 5) **por mi propio
  comentario**: al explicar el punto ciego del gate escribí el nombre del
  componente que el gate busca. Curado en `ea03313a`. **Segunda vez en la
  tanda** —la anterior fue `verify:moneda`— así que la regla es de clase:
  *describir el marcador, jamás escribirlo.*
- **El efecto del historial se cancelaba a sí mismo** (su propio estado estaba en
  las dependencias). *No fallaba: cargaba para siempre.* **Lo encontró la
  captura, no un gate** — que es para lo que la captura es obligatoria.
