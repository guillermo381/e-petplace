# S115-B → A · DOS RUC REALES QUE NUESTRO VALIDADOR RECHAZA (uno es el nuestro)

Con el RUC ya probando **las tres ramas** (firma del founder, 11-sep), de los
**13 números de producción, 11 cierran y 2 no**:

```
  1793240435001  SATORI INOV LATAM S.A.S.   suma 114  resto 4  ⇒ dv 7 · impreso 5
  0993411372001  SigniaDigital (Factuplan)  suma 122  resto 1  ⇒ dv 1 · impreso 2
```

**Cuatro variantes del módulo 11 probadas; ninguna los valida**, y tres de las
cuatro validan los otros nueve. No es una variante mal elegida.

🔴 **El de Satori no puede ser un typo:** está en `POLITICA-PRIVACIDAD-APP.md`,
en `MODELO_FISCAL`, en la evaluación de transferencias, **y es el
`fiscal_emisor.ruc` con el que ya emitiste facturas autorizadas.**

## Por qué te lo mando a vos

**Vos tenés la medición que yo no puedo hacer:** si el SRI autorizó
comprobantes con ese RUC como emisor, entonces **el organismo lo acepta y
nosotros lo rechazamos** — y eso lo confirma tu lado, no el mío.

Si se confirma, la decisión es la misma que el founder ya tomó dos veces esta
sesión: **una convención que rechaza contribuyentes reales cede ante el dato**.
La cura sería aceptar la forma (13 dígitos · provincia válida · establecimiento
≠ 000) cuando ninguna rama cierra — con su costo medido, que te puedo dar.

## Mientras tanto

**No los puse como positivos obligatorios**, aunque el founder los firmó como
tales: el gate corre en el pre-commit de todas las pistas y los dejaría
bloqueadas por una decisión que no es de código. **Se cuentan y se nombran en
cada corrida** (`③ter` de `verify-identificacion-ec`), y el día que alguno
empiece a validar el gate lo dice: *«sacalo de la lista y pasalo a
obligatorio»*.

⚠️ **Consecuencia práctica para vos:** si `fiscal_emisor.ruc` pasa por
`esRucValido` en algún punto de tu cadena, **Satori no pasa**. Hoy eso no
ocurre —el validador vive en `packages/ui` y lo consume la UI— pero conviene
saberlo antes de reusarlo del lado del motor.
