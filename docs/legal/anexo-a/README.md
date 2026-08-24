# Anexo A — la evidencia que hay que conservar tres años

> **Qué es esto.** La `EVALUACION-TRANSFERENCIAS-INTERNACIONALES.md` §11 enumera
> **ocho piezas de evidencia** que el Art. 4 obliga a conservar por tres años
> desde la última transferencia. Esta carpeta las junta.
>
> **Quién escribió esto.** El equipo técnico, **no el abogado**. La evaluación es
> suya y no se toca; este índice es el mapa de dónde está cada pieza y **cuáles
> todavía no existen**. Lo que dice «medido» se consultó contra el sistema real.

---

## Estado de las ocho piezas

| # | evidencia que §11 exige | estado |
|---|---|---|
| 1 | **Copia íntegra del DPA** con constancia de la fecha de aceptación | ✅ **acá** — ver abajo |
| 2 | Captura fechada de la **lista de subencargados** del proveedor | ❌ **no existe** — acto del founder |
| 3 | **Requerimiento formal al proveedor** (M-6) y su respuesta, o constancia de la ausencia | ❌ **no existe** — acto del founder o del abogado |
| 4 | Constancia de la **verificación del alcance de IA contra el código**, con fecha y responsable | ✅ **ya producida** — ver abajo |
| 5 | Registros de las **revisiones mensuales de subencargados** (M-4) | ❌ **no empezaron** — M-4 no tiene responsable asignado |
| 6 | **Textos publicados** de la Política y del Aviso, con versión y fecha | 🟡 **redactados, sin publicar** |
| 7 | **Registro de consentimientos** de las funcionalidades de IA y del dictado por voz | 🔴 **medido: CERO — y el motivo importa** |
| 8 | **Esta evaluación, firmada y fechada** | 🟡 **depositada sin firmar** (cuatro huecos) |

---

## 1 · El DPA

**`Anthropic-Data-Processing-Addendum.docx`**, en esta carpeta.

| | |
|---|---|
| **Vigencia del instrumento** | *Effective February 24, 2025* — **leído del propio archivo** |
| **Fecha de aceptación por el responsable** | **27 de abril de 2026** (dato del founder) |
| **Corroboración independiente** | la credencial de acceso al servicio se cargó en la plataforma el **27-abr-2026, 22:11 UTC** ⇒ consistente con que la relación se constituyó ese día |

**Por qué la corroboración vale y qué no prueba:** prueba **la fecha**, no el
contenido — que ese día se estableció el acceso, no qué versión del instrumento
se aceptó. *Esa parte la cierra el propio archivo, que declara su vigencia.* Las
dos juntas cierran el punto; ninguna sola alcanzaba.

**Cruce que conviene registrar:** la evaluación §3 dice haber evaluado el DPA
*«vigente desde el 24 de febrero de 2025»* y **el archivo depositado dice
exactamente eso**. ⇒ **la evaluación y la evidencia hablan del mismo documento**,
verificado y no supuesto.

---

## 4 · La verificación del alcance de IA contra el código

**Ya está producida, y en dos piezas que se complementan:**

- **`../CENSO-2-PRIVACIDAD-DE-LA-APP.md`** — el inventario de qué se envía al
  proveedor, medido contra el código, con su fecha.
- **El commit `3896f60c`** — *«corrijo MI PROPIO censo: dos tratamientos de IA
  que no ocurren»*. **Es la pieza que más vale como evidencia**, porque
  documenta que la verificación **encontró y corrigió un error**: se había
  atribuido al proveedor el tratamiento del documento de identidad y un
  asistente de ayuda, y **la medición mostró que ninguno de los dos ocurre**.

*Una verificación que solo confirma lo que se esperaba no demuestra que se hizo;
una que corrige algo, sí.* De ahí sale el «dato expresamente excluido» de la
evaluación §3 — el documento de identidad no se transfiere.

**Responsable de la verificación:** equipo técnico · **fecha:** 24-ago-2026.

---

## 7 · 🔴 El registro de consentimientos está en CERO, y no es por falta de uso

**Medido contra la tabla `consentimientos`, hoy:**

| tipo registrado | filas |
|---|---|
| `registro` | 60 |
| `terminos_parent` | 2 |
| `privacidad` | 2 |
| **cualquier cosa que mencione IA, voz o dictado** | **0** |

**El problema no es que nadie haya usado el dictado todavía: es que el sistema
no lo pide.** El acto está previsto en el código (`ActoConsentible` contempla
`dictado_voz`) y **ningún flujo lo escribe**.

⚠️ **Por qué esto no es un pendiente cualquiera:** dos textos ya redactados se
apoyan en ese consentimiento como **base de legitimación**, no como cortesía.

- La **evaluación**, Parte II §9, funda la Transferencia B —el audio que sale al
  fabricante del sistema operativo— en el consentimiento del profesional.
- La **Política §17.B.5** dice, en presente y ante el titular, que el dictado
  *«requiere el consentimiento previo, específico e informado del profesional,
  que se le solicita la primera vez que utiliza la función»*.

⇒ **Publicar esos textos antes de que el sistema recabe ese consentimiento
convierte una promesa al titular en una afirmación falsa**, y deja la
Transferencia B sin la base que la propia evaluación le asigna. *No es un hueco
del expediente: es un hueco del motor que el expediente hace visible.*

**Ficha:** entra a los frenos de producto de **D-897**. **Bloquea la publicación
de la Política y del Aviso**, junto con lo demás ya listado.

---

## Lo que falta y de quién es

| pieza | dueño | acto concreto |
|---|---|---|
| **2** lista de subencargados | founder | capturar la lista publicada por el proveedor, con fecha |
| **3** requerimiento M-6 | founder / abogado | enviarlo y archivar la respuesta — **o la constancia de que no hubo** |
| **5** revisiones M-4 | founder | asignar el nombre; sin responsable la medida no existe |
| **6** textos publicados | S104-C | publicar con versión y fecha; **conservar cada versión anterior** |
| **7** consentimientos de IA y voz | producto | **construir el acto**; hoy no se recaba |
| **8** firma de la evaluación | founder | cuatro huecos: fecha, próxima revisión, elaborado por, y los nombres de M-4 y M-11 |

**Nota sobre la #6, que sale de la lectura firmada del founder:** el aviso de IA
**no es una página** — vive dentro de la Política (§14, §15, §16.1 y §17). ⇒ el
control de versiones que su Anexo B pide **recae sobre la Política**, y el
versionado de Privacidad **es también el del aviso de IA**. Una sola cadena de
versiones cubre las dos exigencias.
