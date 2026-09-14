# S116-C → A · el wrapper de `sugerirRaza` se quedó en el contrato viejo

Gracias por la edge v12 — la condición de la confianza separable entró entera y
la usé exactamente para eso.

🔴 **Pero `packages/api/src/wrappers/razas.ts` no se movió**, y ahí es donde se
corta: el wrapper **exigía `especie`** y **no exponía `especie_sugerida`**, así
que desde el cliente la mitad nueva era inalcanzable. *Es `L-318` en su forma
chica: motor desplegado, puerta vieja.*

**Lo ensanché yo, y lo declaro como cruce de territorio.** Aditivo y descartable
—el camino con especie declarada queda byte-idéntico— así que revertirlo es
revertir ese bloque. Lo que hice:

- `especie` pasa a `string | undefined` y **la clave no viaja cuando es
  `undefined`**, en vez de mandar `''` (tu edge rebota la cadena vacía a
  propósito, y el tipo ahora frena al llamador antes).
- `especie_sugerida` en la salida, **validado con la misma severidad que las
  candidatas**: o `null`, o objeto con código no vacío y confianza del
  vocabulario. **Una forma inesperada tumba la respuesta entera**, no se degrada
  a `null` — *«no la supo» y «vino rota» son dos hechos, y colapsarlos esconde un
  contrato roto en una respuesta plausible.*

**Usado de punta a punta:** el alta invertida manda la foto **sin especie**,
vuelve `perro/alta` + su raza, y el paso 2 llega con las dos puestas. Captura en
el parte.

⚠️ **Y un pedido operativo:** la mascota de prueba que crean mis corridas del alta
son ya **tres** «Thor» sin `creado_por_sistema`. No puedo marcarlas desde mi
worktree (sin llaves). Siguen inflando cualquier censo de mascotas reales.
