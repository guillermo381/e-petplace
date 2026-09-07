# A → D · el contexto trae los papeles, y el prompt todavía no los escribe

**Medido, no supuesto**, contra la edge desplegada (`c2b79504`, la punta) y la
RPC en producción:

| | |
|---|---|
| `obtener_contexto_coach` devuelve `papeles` | **sí**, desde `00fe0e64` |
| el prompt de `sistemaDe()` los escribe | **no** — 15 campos y `papeles` no está |
| el tipo `Contexto` los lista | **no** |

Y así se ve en la respuesta real, preguntando por un examen que **sí está en la
bóveda de Thor**:

> «No tengo acceso a resultados detallados de hemograma… **no figura ese examen
> entre los datos disponibles aquí**.»

🔴 Es **motor sin puerta en la frontera entre pistas**: el dato viaja y la edge
lo ignora, porque `sistemaDe()` escribe campos elegidos a mano —que es lo
correcto, no un defecto— y nadie agregó éste.

## Lo que hay en el contexto, listo para cablear

```json
"papeles": [{
  "titulo": "Hemograma completo", "clase": "laboratorio",
  "fecha": "2024-11-20", "origen": "Clinica San Rafael",
  "valores": [
    {"analito":"Hematocrito","valor":"41","unidad":"%",
     "referencia":"37 - 55","literal":"HCT 41 % (37-55)"},
    {"analito":"Ehrlichia canis","valor":"Negativo","unidad":null,
     "referencia":null,"literal":"Ehrlichia canis: NEGATIVO"}
  ]}]
```

**Sólo los confirmados.** Un papel `por_confirmar` es lo que el extractor
propuso y nadie miró: citarlo sería darle voz de dato a una lectura de OCR sin
revisar.

## 🔴 Por qué no lo cablé yo

Una línea de `dato(...)` alcanzaba. **No la escribí a propósito**: *cómo se le
presenta un examen de laboratorio al modelo es exactamente lo que tu muro
vigila*, y es la pieza más delicada del sistema. Un encabezado mal elegido
—«Resultados», «Análisis»— puede empujar a interpretar justo donde la ley dice
que no.

Dos cosas que sí puedo decirte, medidas:

- **el contexto NO trae ningún juicio** — verificado buscando «alto», «bajo»,
  «normal», «elevado», «anormal» en todo el bloque: **cero**. Interpretar es
  del veterinario; citar es de Nexo.
- **`literal` viaja con cada valor**, no sólo el número parseado. Si el parseo
  salió mal, el modelo tiene delante lo que el papel *dice*.

Lo que el muro tiene que seguir impidiendo después de cablearlo: que Nexo diga
si un valor está bien o mal. Citar «Hematocrito 41 %, referencia 37-55, del 20
de noviembre» **es** lo que tiene que poder hacer.

---

## ⚖️ FIRMA DEL FOUNDER (7-sep) — nada nativo se instala; se ANOTA

**La build se corta después del rediseño (dos sesiones más) y es UNA SOLA, con
el NFC adentro.** Hasta ese día: **todo sale por OTA** y **ninguna rama `*-nfc`
se mergea**.

🔴 **Si necesitás una capacidad nativa, agregá tu fila a la lista viva de
`docs/loop/S113-NFC-BUILD.md` y seguí sin ella** — con el camino degradado que
corresponda, y **diciéndolo en pantalla** si la familia lo va a notar.

*Instalarlo «para probar» es el modo de falla que esta regla evita: `pnpm`
resuelve el peer, funciona en dev, ninguna app lo declara, y el gate queda
partido en dos mitades que por separado dan verde. El fallo aparece en el
teléfono de una familia, no acá.*

La fila lleva cinco columnas: **capacidad · paquete o permiso · quién la pidió ·
qué se rompe si ese día falta**. La última no es burocracia: el día de la build
alguien va a tener que decidir en minutos qué se prueba primero, y sin esa
columna se prueba lo que se recuerda.

**`ota:deps` sigue siendo el discriminador de cada candidato** — su verde es lo
único que dice que el OTA que estás por publicar puede aplicarse sobre el
binario que la gente ya tiene.
