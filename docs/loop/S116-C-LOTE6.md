# S116-C · LOTE 6 — el parte

**Rama** `pista/s116-c-05` · **SHA** `6b37effb` (pusheado)
**Commits:** `286848e5` (adenda galería) · `8006086f` (③ y ④) · `462cfca2` (⑤) ·
`aabafff9` (⑦ motor) · `6b37effb` (⑦ el E2E y el primer paso)

---

## ① 🔴 Los botones de 01 — NO SE REPRODUCE, y no curo lo que no vi

Medido antes de tocar nada, y nada se tocó:

- los handlers **están cableados** — `onPress={() => router.push('/beneficios')}`
  y `onPress={() => router.push('/login')}`
- **no hay capa encima**: cero `position:'absolute'`, cero `pointerEvents`, cero
  `HuellaDeLlegada`, cero `llegando` en `bienvenida.tsx`
- el árbol de `uiautomator` de 01 muestra **exactamente dos nodos clickables** y
  nada arriba: `Crear cuenta [63,1954][1017,2106]` · `Ya tengo cuenta [63,2138][1017,2274]`
- **los dos navegan**, incluso tocándolos DURANTE la animación de entrada
- cero advertencias de router en el log de Metro

Y volvió a caminar hoy, sin buscarlo: en este lote entré a 03 por «Ya tengo
cuenta» **cuatro veces** (cada vez que la sesión se cayó), y las cuatro abrió.

**Falta el discriminador y es del founder:** ¿falla en la primera apertura, o
después de que Android mata el proceso? Con eso vuelvo.

## ② La barra «perdida» — MEDIDA, sin curar (firma de la mesa)

**El activo y la ruta YA son el mismo dato.** `(tabs)/_layout.tsx:355` pasa
`activo={state.routes[state.index].name}`, `items` son las mismas cinco llaves
en el mismo orden, y `BarraTabs` resuelve el disco **por nombre**. Censado el
grupo `(tabs)`: hay **exactamente cinco rutas y las cinco están declaradas** ⇒
no existe una ruta que caiga fuera de `items`.

En el emulador: arranque frío con sesión → se ve Hogar y el disco está en Hogar
(`lote6-tabs-arranque-frio.png` no se guardó: la evidencia es el volcado, con
`sel=true` sobre Hogar y el disco pintado bajo Hogar en la captura). Navegando a
Despensa → `sel=true` sobre Despensa. **No diverge.**

🔴 **LO QUE SÍ DEJO NOMBRADO, porque es un guard que no puede fallar:**

```
packages/ui/src/components/BarraTabs.tsx:668
const indiceActivo = Math.max(0, items.findIndex((i) => i.key === activo))
```

**`Math.max(0, -1)` convierte «no encontré el activo» en «el activo es el
primero».** Hoy no puede dispararse —las cinco llaves coinciden— pero **su modo
de falla es exactamente el que el founder describe**: el disco en una tab que no
es la que se ve, sin error, sin log y sin nada que lo delate. *Un guard que
contesta cuando no sabe no protege: inventa.* Es de B; queda escrito acá para
que, si el founder vuelve a verlo, el primer lugar a mirar tenga dirección.

**Pendiente del founder:** la captura y el dato de si fue primera apertura o
reinicio del proceso.

## ③ La cola de la Despensa — CURADA Y USADA

La causa no era un número corto: **era la reserva de una pieza que ya no se
monta.** Reservaba `spacing[8]` 32 + `COLA_PRESENCIA_COACH` 84 = **116 dp**
contra `AIRE_RAIZ` **168** + el inset. Y `PresenciaCoach` **no se monta en
ninguna pantalla del cliente** (censado): el orbe se fue en mi lote 3 y su aire
se quedó. Ahora usa la misma cuenta que Hogar y Cuenta.

✅ **Vara 11:** se usó la última fila — «Agregar» del último producto, stepper en
1, canasta en 1.

⚠️ **Honestidad de la medición:** en este emulador la última fila **no llegaba a
quedar tapada** ni antes ni después. Lo medido es la aritmética y la constante
muerta, no el corte reproducido. Si el founder lo ve cortado en su aparato, el
sospechoso que queda es el inset: la reserva vieja **no sumaba `insets.bottom`**,
por una concesión de B anterior a esta barra.

## ④ El isotipo viejo — CENSADO, bloqueado en B

**No lo monta la Despensa: lo monta `Encabezado`** (`:306`, `<Isotipo size={32}>`,
con default `'gradiente'`) ⇒ sale en **cuatro de las cinco tabs**. Censo completo
y pedido con sus dos formas en
`docs/loop/buzon/S116-C-para-B-el-isotipo-viejo-vive-en-Encabezado.md`.

## ⑤ «Factura a: … ›» — HECHA Y USADA

`FilaLista` no existe en `packages/ui`; el catálogo v5 nombra la pieza de ese rol:
`CeldaNavegacion`. La etiqueta va en `titulo` y la identidad en `detalle` **porque
`titulo` corta AL FINAL y lo que se cortaría es el RUC.** Muere
`facturacionCheckout.cambiar` (cero consumidores). Se tocó **el nombre, no el
chevrón**, y abrió.

## ⑥ Esperando el SHA de B

02 con cuatro `FilaBeneficio` en cuatro tarjetas · confirmación → `Confirmacion` ·
espera → `EsperaLarga`. **Precisión recibida y anotada:** la línea de progreso que
muere es la de mi pantalla de espera del pago (la barra con degradado bajo
«Estamos confirmando tu pago») — B censó que no existe ninguna pieza de progreso
en `packages/ui`, así que es mía y muere cuando adopte `EsperaLarga`.

## ⑦ El alta invertida — HECHA Y CAMINADA

`PASOS = ['foto','datos','carnet','cierre']`. La sugerencia de raza **resucita**:
su lápida decía que el orden viejo le había quitado el insumo, y con la foto
primero vuelve a tenerlo. Pre-selecciona **sólo con confianza `alta`**, no pisa lo
que la persona eligió, y **se dice** («La reconocimos en la foto. Confírmala o
cámbiala»).

**La especie NO se sugiere, medido en la fuente:** `sugerir-raza` la exige,
filtra con ella y se la declara al modelo ⇒ sabe decir «eso no es un perro», no
sabe decir qué es. Pedido en
`docs/loop/buzon/S116-C-para-A-la-especie-tambien-desde-la-foto.md`.

**El defecto que sólo apareció caminando:** el primer paso estaba tecleado en dos
puertas, así que el alta seguía abriendo en «datos» con la barra en 2 de 3.
Ningún typecheck podía verlo. Nace `PRIMER_PASO`.

**El discriminador que salió solo:** la foto se llama `labrador-retriever.webp` y
el animal es un golden; el motor contestó **golden retriever** ⇒ *miró la foto,
no el nombre del archivo.*

⚠️ **No es una foto de Thor**, y se dice: la suya en la base no carga y desde este
worktree no hay llaves para bajarla. La vara 11 queda cumplida sobre el FLUJO y
**abierta sobre la foto del founder**.

---

## La vara, respondida

| # | | evidencia |
|---|---|---|
| 1 | sí | todo lo visible sale de `packages/ui` — `CeldaNavegacion`, `Boton`, `Texto`, `SelectorDeRaza`. Cero dibujo local. |
| 2 | sí | navegación declarada en el router; `PRIMER_PASO` deriva de `PASOS` en vez de teclearse. |
| 3 | sí | `CATALOGO_PIEZAS_V5.md` leído antes de componer — de ahí salió que `FilaLista` es `CeldaNavegacion`. |
| 4 | sí | voces nuevas en es y en, en su namespace (`alta.razaSugeridaPorFoto`, `cuenta.galeriaPiezas`). |
| 5 | sí | lo que murió tiene lápida: `facturacionCheckout.cambiar`, el `Boton compacto`, la lápida de la galería enmendada, la de la sugerencia convertida en su resurrección. |
| 6 | sí | cero números crudos nuevos: `AIRE_RAIZ`, `spacing[*]`, tokens. |
| 7 | sí | los fallos hablan salvo uno, y su mudez está declarada con su razón (la sugerencia de raza). |
| 8 | sí | typecheck del cliente en 0 en cada tanda. |
| 9 | sí | lo que no es mío se pide, no se toca: dos fichas de buzón (B, A/D). |
| 10 | sí | capturas de cada cambio, antes y después donde el cambio es visible. |
| 11 | **sí, con un límite** | se USÓ: la última fila de la Despensa, la fila «Factura a», la galería, y el alta entera de punta a punta. **El límite: la foto del alta no es de Thor.** |

## Lo que estaba en mi cola — las tres, curadas (firma de la mesa)

1. ☠️ **El monograma «T» del paso de la foto.** Con la foto primero no hay nombre
   y el monograma era la inicial de la palabra «tu». Ahora: `especie` **se pasa**
   —sin ella el peldaño de `Personaje` de `AvatarMascota` no podía dispararse
   aunque la especie se supiera— y sin nada que mostrar, **la nariz**
   (`Personaje especie="otro"`, la del catálogo). *No se tocó la doctrina de
   `AvatarMascota`: ahí el monograma es legítimo porque hay nombre; acá no lo
   hay.*
2. ☠️ **El toast `Cannot update a component (ConteoDeMontajes)`.** El shell
   llamaba a `registrarProfundidad` dentro del render del `tabBar` y el módulo
   avisaba **sincrónicamente**. Curado en el módulo y no en el llamador: *un
   contrato que sólo es seguro si el llamador se acuerda de algo no es seguro, es
   una convención.* `queueMicrotask` + coalescido.
3. ☠️ **Del editor de facturación se vuelve.** Y la vuelta **restaura**, no sólo
   colapsa: la sección avisa al padre en cada tecla, así que colapsar a secas
   dejaría la línea compacta mostrando el perfil viejo con el checkout ya en el
   nuevo. Voz: «Dejar los datos guardados» — el resultado, no el gesto.

🔴 **Y una cura que me costó una corrida:** la sugerencia de raza era muda
**también en el log**. En una de tres corridas no pre-seleccionó y no pude
distinguir «falló» de «no disparó». Ahora habla bajo `__DEV__` con su razón
exacta. *La mudez declarada es de la superficie; un instrumento que calla para
quien lo depura no es discreto, es ciego.*

⚠️ **La medición honesta de la sugerencia: 2 de 3 corridas pre-seleccionaron.**
Es un modelo ⇒ **es una tendencia, no una garantía**, y la casa ya lo tiene
escrito. El diseño lo aguanta: sin sugerencia queda el selector con
autocompletado, que siempre fue el camino principal.

## Lo que sigue abierto

1. **Pedido a A:** marcar `creado_por_sistema` en las mascotas «Thor» que
   crearon las corridas del alta (son **dos**), o inflan todo censo de mascotas
   reales.
2. **La hoja de atajos de B** — se monta cuando llegue su SHA; ahí decido qué
   atajos van por pantalla.
3. **El SHA de B para el ⑥** (02 con cuatro `FilaBeneficio`, `Confirmacion`,
   `EsperaLarga`).
4. **La barra «perdida»** — espera la captura y el dato del founder.
