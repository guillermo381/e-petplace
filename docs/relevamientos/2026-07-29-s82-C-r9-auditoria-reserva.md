# S82-C r9 — AUDITORÍA del flujo de reserva (bloque permanente, antes de tocar)

## 1 · Qué preside hoy en `/explorar/paseo` (el CUÁNDO)

**Nada preside.** Cinco bloques del mismo peso, apilados, con la misma
anatomía (`SelectorOpcion`) y el mismo rótulo: mascota · duración · día ·
hora · plan/paquete. El único con jerarquía real es el CTA fijo del pie.
Es el hallazgo más común de este producto, confirmado acá: *todo pesa
igual*.

## 2 · Auditoría contra las fuentes (la fuente gana a la directiva, §2.6)

| Fuente | Veredicto |
|---|---|
| `DIRECCION_ARTE` §9bis (A6 SIN CAJA) | los selectores de día/hora son TONALES con borde 1.5 — el borde es de `SelectorOpcion` (componente FIRMADO de ui): no es mío, se declara |
| `MODELO_PASEO` §6ter (cero finales mudos) | ✅ ya cumple: el día sin inicios ofrece el día siguiente |
| Escalera del precio (S61-A13, FIRMADA) | ⚠️ **choca con la lámina** — ver defecto 6 |
| La lámina (contexto 3) | CRITERIO, no evidencia (§10) |
| Ley 3 + S52/Ley 18 | cero uppercase (ya me costó una cura hoy) |

## 3 · Defectos, numerados

### (a) Los que la orden ya pidió corregir
1. **"El gate quedó en B" es FALSO** — el techo del oficio nunca se
   firmó. Van LAS DOS opciones tras switch de debug.
2. **El riel NO reemplaza a D3** — D3 es una RUEDA firmada (escalas
   1.16/0.94/0.84/0.78 · opacidades 1/.62/.34/.18 · 520 ms
   cubic-bezier(.32,.72,0,1) · ítem 66 · paso 76 · el elegido SIEMPRE
   centrado). Las dos tras el mismo switch; una muere post-gate.
3. **Los 17 hexes de v7 NO se portan** (mismo paro que r7).
4. **Cero `text-transform:uppercase`** (S52/Ley 18).

### (b) Los que encontré yo

5. 🔴 **EL DATO DE DÍAS CERRADOS NO EXISTE — y la lámina lo pinta.**
   La lámina dibuja `.rit.cerr` (día cerrado: opacidad .42, no
   responde) y su `SINDIA` es un array hardcodeado. **Nuestro motor NO
   tiene ese dato:** `obtenerIniciosPaseo(fecha, duracion)` responde
   por UN día; saber qué días del riel están cerrados costaría 10-14
   llamadas (exactamente lo que D-497 vino a matar).
   **DECISIÓN: no se inventa.** Todos los días nacen tocables y el
   NULO HONESTO sostiene el caso — que es justamente la tercera ley de
   la lámina, y acá pasa de adorno a estructura portante.
   **PEDIDO A A, secuenciado (jamás en paralelo):** un lector
   `obtener_dias_con_disponibilidad(desde, hasta, duracion)` →
   `string[]` de fechas con al menos un inicio. Con eso, el riel y la
   rueda encienden sus días cerrados sin tocar la composición.

6. ⚠️ **El pie flotante de la lámina MIENTE con nuestro contrato.**
   La lámina muestra un total exacto (`$45 · lun 07 · 09:00`) ANTES de
   elegir prestador. Nuestro precio en ese punto es `desde` cuando
   varía entre paseadores (`bloqueElegido.varia`) — y la ESCALERA DEL
   PRECIO (S61-A13, FIRMADA) dice: *agregado que varía dice "desde"; el
   exacto se dice en el QUIÉN, antes de pagar*.
   **DECISIÓN: gana la escalera firmada.** El pie dice "desde" cuando
   varía. No se porta el total exacto.

7. ~~**La duración debería RELLENARSE** y pide prop nueva en
   `SelectorOpcion` (packages/ui, territorio de B).~~
   **CORREGIDO EN r11 — el defecto era MÍO, no del componente:** la
   duración YA se rellena y lo hace POR LEY, no por excepción. La
   pantalla pasa `naturaleza="existe"`, que es la **ley 19.8** (SE
   RELLENA LO QUE EXISTE) y **L-b** la acota a fila corta. No hacía
   falta nada de B. Medido con literal en r11 (`grep naturaleza=` sobre
   la pantalla). Queda como registro de que una declaración de hueco
   también se verifica contra la fuente.

8. **Plan y Paquete interrumpen el flujo**: dos `CeldaNavegacion` a
   otras pantallas, metidas entre la hora y el CTA. La lámina resuelve
   el caso con un INTERRUPTOR ("Repetir") al final, no con navegación.
   **NO LO TOCO:** su ubicación es letra firmada (P14 · §6bis.2bis —
   comprar ≠ reservar) y cambiarla es decisión de producto, no de
   composición. **Va al gate.**

## 4 · Qué cambio y qué dejo

**Cambio:** 1, 2, 3, 4 (lo pedido) + 5 y 6 con sus decisiones declaradas
arriba.
**Dejo:** 7 (territorio de B, declarado) · 8 (letra firmada, va al gate)
· el borde de `SelectorOpcion` (componente firmado).

**Alcance de la tanda:** se construye sobre `/explorar/paseo` (la
pantalla MADRE del flujo). Las otras tres (grooming · veterinaria ·
adiestramiento) heredan DESPUÉS del gate — regla 80: el lazo corto, un
gate antes de propagar a cuatro pantallas.
