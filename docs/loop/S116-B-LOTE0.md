# S116-B · LOTE 0 — regla×pieza · glifos 72↔52 · las 115 locales · memorial · fuentes

> **Rama `pista/s116-b` · SHA de partida `ca564994ee55c1f33d00dd015ee21a4286c96dd3` (`ca564994`) = `main` = `origin/main`, sin mover desde ayer.**
> Medido el **13-sep-2026**. El parte de ayer (`docs/loop/S116-B-RELEVAMIENTO.md` @ `1a1a7fa6`) **no se tocó**: es la medición del 12-sep. Este documento la usa de base y **corrige un número suyo** (§⓪).
> **`pista/s116-b` está en origin** — verificado por SHA, no por código de salida: `git ls-remote origin pista/s116-b` = `1a1a7fa6…` = `git rev-parse HEAD`, y el archivo tiene 835 líneas en `origin/pista/s116-b`. **E puede leerlo.**

---

## ⓪ CÓMO SE EVITÓ CONTAR COMENTARIOS COMO CÓDIGO, Y QUÉ SE CAYÓ IGUAL

Ayer dos censos leyeron comentarios como código. Hoy, **cada censo declara su método de exclusión** y ninguno usa el mismo:

| censo | cómo excluye comentarios | qué NO cubre ese método |
|---|---|---|
| glifos del union (§②) | `re.sub(r'/\*[\s\S]*?\*/')` + `re.sub(r'^\s*//.*$', flags=M)` sobre el bloque del `type` | nada relevante: el bloque no tiene strings con `//` |
| lecturas de memorial (§④) | **máscara línea a línea con estado**: recorre el archivo llevando un flag `dentro` de bloque `/* … */`, marca también las que empiezan con `*` o `//` | strings de JSX que *citan* un slot (los cazó y los separé a mano) |
| triage de locales (§③) | quita bloques y líneas de comentario antes de buscar imports y exports | — |
| regla×pieza (§①) | **no aplica**: no lee texto, ejecuta las reglas | — |

**Y aun así, tres cosas se cayeron y están declaradas donde pasaron:**
1. **El detector de guards de memorial usó una ventana de 4 líneas** y marcó 3 lecturas como «sin guard». **Las tres eran falsos positivos**: los guards estaban a 5, 8 y 33 líneas de distancia. Las leí a mano y las corregí (§④).
2. **El primer medidor de regla×pieza usaba corpus vacío como base**, y las reglas con guard de fuente devuelven `corpus incompleto` con ese corpus ⇒ base envenenada. Se rehizo con **ablación sobre el corpus completo** (§①).
3. **Mi parser del argumento de cada regla cortaba en el primer `)`** y clasificaba mal las llamadas anidadas. Se rehizo balanceando paréntesis.

### Corrección al parte de ayer

Ayer publiqué **«23 reglas atadas al VALOR»**. Son **23 filas de tabla pero 25 reglas**: la última fila combina `R47 · R48 · R62`. **La lista completa, y es la que uso hoy con ★:**
`R12 · R14 · R15 · R16 · R17 · R20 · R25 · R27 · R30 · R32 · R33 · R36 · R37 · R38 · R39 · R43 · R47 · R48 · R51 · R56 · R58 · R62 · R65 · R70 · R72`
*No edito el parte de ayer: la corrección vive acá, que es donde alguien la va a leer al usar el número.*

---

## ① REGLA × PIEZA

### Cómo se midió — ablación, no lectura del enunciado

El encargo pide **match real, no lo que la regla dice que mide**. Las 81 reglas de `verify:diseno` son funciones que reciben su corpus, así que se puede preguntarles directamente:

> `base = R(corpus completo)` · `prueba = R(corpus completo SIN la pieza P)`. **Si el resultado cambia, R mide P.**

**El instrumento:** copia **byte-idéntica** de `scripts/verify-diseno.mjs` (verificado con `diff` sobre las 9.197 líneas) más una línea de `export` al final, para poder importar `REGLAS` y los corpus. **Se borró al terminar** — no queda en el repo. No se transpiló ni se reescribió nada del gate: se importó y se ejecutó tal cual.

**Controles.**
- **Positivo:** `R30` (el glifo no se re-dibuja) devuelve exactamente `components/Icono.tsx`, que es la fuente del registry. `R25` (la pata no se reinventa) devuelve `brand/MarcaEleccion.tsx`. Las dos son lo que su nombre promete.
- **Negativo:** agregué una pieza inerte (`export const Z = 1`) al corpus de cada regla. **5 de 32 reaccionan** — `R59 · R88 · R89 · R90` (y `R11`, que ni siquiera recibe archivos). Esas **cuentan archivos en su denominador**, así que «medir» para ellas significa «sumar al alcance», no «vigilar». Van marcadas aparte en la tabla y **no cuentan como vigilancia** en la matriz inversa.

**Lo que el método no puede hacer, declarado:** 10 reglas no reciben corpus de archivos (`R12` recibe pares de contraste, `R15` tokens, `R16`/`R17`/`R27`/`R43`/`R44` listas de fuentes propias, `R80` migraciones…). Para ésas la respuesta es **NULL**: no se puede medir con ablación de piezas. Y 7 reglas llaman a disco dentro de su propio argumento (`leer(...)`, `archivosCodigo(...)`); su corpus reconstruido es un **subconjunto** del real y lo digo en la fila.

### Reparto

| | reglas |
|---|--:|
| **MEDIDO** (corpus con piezas de `ui`, ablación posible) | **32** |
| su corpus **no incluye** `packages/ui` (sólo `apps/`) | **39** |
| **no reciben corpus de archivos** → NULL | **10** |
| total | **81** |

🔴 **39 de 81 reglas no miran `packages/ui` en absoluto.** Miden `apps/cliente/src` y `apps/prestador/src`. *Tocar una pieza del design system no las puede encender* — lo que sí las enciende es cómo la usan las pantallas.

### Tabla: qué toca cada regla

★ = de las 25 atadas al VALOR (§⓪).
| regla | qué mide | ★ | piezas de `ui` que toca | tipo de toque |
|---|---|:-:|--:|---|
| **R1** | 7bis/SelectorOpcion |  | 0 | su corpus no incluye `packages/ui` |
| **R2** | Ley 1 hex crudos, apps |  | 0 | su corpus no incluye `packages/ui` |
| **R3** | A6+§7/Tarjeta: contrato + censo |  | 0 | su corpus no incluye `packages/ui` |
| **R4** | Ley 20 sombras artesanales, apps+ui |  | 0 | corpus incluye `ui`, hoy no toca ninguna |
| **R5** | Ley 21/Boton: el CTA no se re-resuelve |  | 0 | su corpus no incluye `packages/ui` |
| **R6** | D-498/EvitaTeclado: teclado crudo |  | 0 | su corpus no incluye `packages/ui` |
| **R7** | §5/Entrada: FadeIn artesanal |  | 0 | su corpus no incluye `packages/ui` |
| **R8** | Ley 13/EstadoVacio: el vacío no se anima |  | 0 | su corpus no incluye `packages/ui` |
| **R9** | Ley 17.5/EstadoVacio — informativa |  | 0 | su corpus no incluye `packages/ui` |
| **R10** | override-s82c atado a su casa |  | 0 | su corpus no incluye `packages/ui` |
| **R11** | LOYALTY §3: la voz del momento sin score |  | 0 | su corpus no incluye `packages/ui` |
| **R12** | contraste dos temas: texto 4.5 · canto 3.0 | ★ | — | no recibe corpus de archivos |
| **R13** | A6: control contorneado, cliente |  | 0 | su corpus no incluye `packages/ui` |
| **R14** | el solape no tapa el saludo | ★ | 0 | su corpus no incluye `packages/ui` |
| **R15** | A5 §9bis.3: la familia de #0F5E56 fuera del tema cliente | ★ | — | no recibe corpus de archivos |
| **R16** | papel tapiz: el prestador no recibe tinte | ★ | — | no recibe corpus de archivos |
| **R17** | la galería no envejece | ★ | — | no recibe corpus de archivos |
| **R20** | la familia alerta no se rellena | ★ | 0 | corpus incluye `ui`, hoy no toca ninguna |
| **R24** | el pie de reserva no se copia |  | 0 | su corpus no incluye `packages/ui` |
| **R25** | la pata no se reinventa | ★ | 1 | vigilancia específica |
| **R27** | el pink no enfoca en el prestador | ★ | — | no recibe corpus de archivos |
| **R29** | sinPie no viaja solo |  | 0 | su corpus no incluye `packages/ui` |
| **R30** | el glifo no se re-dibuja: apps contra el registry | ★ | 1 | vigilancia específica |
| **R32** | la esquina compartida: los 20dp de la lámina | ★ | 0 | su corpus no incluye `packages/ui` |
| **R33** | la superficie de la huella se declara | ★ | 0 | su corpus no incluye `packages/ui` |
| **R34** | una lista de tres estados no se decide por el largo |  | 0 | su corpus no incluye `packages/ui` |
| **R35** | Ley 1: el color aplicado sale del tema — ui+galería+apps |  | 0 | corpus incluye `ui`, hoy no toca ninguna |
| **R36** | N2 el ritmo: el espaciado sale del token | ★ | 0 | su corpus no incluye `packages/ui` |
| **R37** | N4 el radio único: una sola escala | ★ | 0 | su corpus no incluye `packages/ui` |
| **R38** | N3 la muerte del separador: 3 por pantalla | ★ | 0 | su corpus no incluye `packages/ui` |
| **R39** | N1 la escala: 3 tamaños a mano por pantalla | ★ | 0 | su corpus no incluye `packages/ui` |
| **R40** | el placeholder sin firma no se embarca en silencio |  | — | no recibe corpus de archivos |
| **R41** | lo que se mueve de verdad mira useReducedMotion |  | 19 | denominador de subconjunto |
| **R42** | la puerta de la foto no se re-dibuja |  | 3 | vigilancia específica |
| **R43** | N11: el contorno del campo tiene piso | ★ | — | no recibe corpus de archivos |
| **R44** | N12.4: el error dice QUE esta mal |  | — | no recibe corpus de archivos |
| **R45** | D-828: el lector de rango no se consume en silencio |  | 0 | su corpus no incluye `packages/ui` |
| **R46** | el selector de indicativo no se va con el campo que muere |  | 0 | su corpus no incluye `packages/ui` |
| **R47** | la variante jubilada no crece: Boton compacto | ★ | 35 | denominador de subconjunto |
| **R48** | el alias renombrado no crece: Boton sinCaja -> apoyada | ★ | 35 | denominador de subconjunto |
| **R49** | N11-prima: el placeholder no repite la etiqueta |  | 0 | su corpus no incluye `packages/ui` |
| **R50** | elegir uno de varios sin decir cual |  | 0 | su corpus no incluye `packages/ui` |
| **R51** | un token legado no entra a una pieza nueva | ★ | 2 | vigilancia específica |
| **R52** | G-16: «Programar otra fecha» no vuelve |  | 0 | su corpus no incluye `packages/ui` |
| **R53** | un pie fijo reserva su propio lugar |  | 0 | su corpus no incluye `packages/ui` |
| **R54** | el pie no se envuelve en un View que capture |  | 0 | su corpus no incluye `packages/ui` |
| **R55** | el tope lo paga Encabezado, y nadie mas |  | 0 | su corpus no incluye `packages/ui` |
| **R56** | el oro no es tinta en el cliente | ★ | 0 | su corpus no incluye `packages/ui` |
| **R57** | la seccion de pago es UNA, medida |  | 0 | su corpus no incluye `packages/ui` |
| **R58** | Texto no gana un color de acento: N23 | ★ | 1 | vigilancia específica |
| **R59** | un comentario JSX sin llaves es texto: D-882 |  | 193 | **denominador total** (cuenta todo su corpus) |
| **R60** | Boton no ocupa el alignSelf del padre |  | 1 | vigilancia específica |
| **R62** | la prop jubilada no se sigue montando | ★ | 2 | vigilancia específica |
| **R63** | una superficie no promete una ruta que nadie sirve |  | 0 | su corpus no incluye `packages/ui` |
| **R64** | una pantalla de cierre no promete un efecto que nadie ejecuta |  | 1 | vigilancia específica |
| **R65** | el area de reserva de una marca ajena sigue entrando | ★ | 0 | su corpus no incluye `packages/ui` |
| **R66** | la voz no vuelve al voseo |  | 0 | corpus incluye `ui`, hoy no toca ninguna |
| **R67** | el aviso de teleconsulta no se acorta |  | 0 | su corpus no incluye `packages/ui` |
| **R68** | nada del componente dentro de un worklet de gesto |  | 7 | vigilancia específica |
| **R69** | nada absoluto despues de SuperficieLlamada |  | 0 | su corpus no incluye `packages/ui` |
| **R70** | un path svg no va en posicion de texto | ★ | 0 | su corpus no incluye `packages/ui` |
| **R71** | un wrapper sin exportar es un motor sin puerta |  | — | no recibe corpus de archivos |
| **R72** | ninguna etapa del caso se pierde del orden | ★ | 1 | vigilancia específica |
| **R73** | las dos tarjetas del dinero son parejas |  | 1 | vigilancia específica |
| **R74** | la cabecera del caso no dice el monto |  | 1 | vigilancia específica |
| **R75** | «otro» no es un motivo, y la lista no scrollea |  | 1 | vigilancia específica |
| **R76** | el plazo no es una alarma ni un contador |  | 1 | vigilancia específica |
| **R77** | lo que enumera una unión a mano se declara |  | 50 | denominador de subconjunto |
| **R78** | el tema memorial no puede ser la única señal |  | 14 | denominador de subconjunto |
| **R79** | un código del motor no se renderiza sin su riel |  | 0 | su corpus no incluye `packages/ui` |
| **R80** | la voz que nace en el motor |  | — | no recibe corpus de archivos |
| **R81** | la hoja no queda a medias ni la empuja el teclado |  | 1 | vigilancia específica |
| **R82** | dos manejadores de teclado no viven juntos |  | 2 | vigilancia específica |
| **R83** | el dato del otro asiento no se dibuja |  | 0 | su corpus no incluye `packages/ui` |
| **R84** | ninguna tarifa vive adentro de una pieza |  | 5 | vigilancia específica |
| **R85** | la voz fiscal pasa por el riel, en los dos idiomas |  | 5 | vigilancia específica |
| **R86** | el error del SRI no llega a la familia |  | 1 | vigilancia específica |
| **R87** | el formato de la plata es uno solo |  | 0 | su corpus no incluye `packages/ui` |
| **R88** | la plata no se parsea a mano |  | 226 | **denominador total** (cuenta todo su corpus) |
| **R89** | un monto formateado no viaja a un payload |  | 226 | **denominador total** (cuenta todo su corpus) |
| **R90** | el correo se valida en un solo lugar |  | 226 | **denominador total** (cuenta todo su corpus) |
**226 piezas** aparecen en el corpus de al menos una regla. De ésas, **28 tienen vigilancia específica** (una regla que las mira por algo propio); el resto sólo suma al denominador de alguna.

#### Las piezas con vigilancia específica

| pieza | reglas específicas | denominador de subconjunto |
|---|---|---|
| `components/TarjetaFactura.tsx` | **R84 R85 R86** | R47★ R48★ R77 |
| `components/ModalDosAlturas.tsx` | **R68 R81 R82** | R41 R77 |
| `components/Hoja.tsx` | **R51★ R68** | R41 R77 |
| `components/CampoClaveAcceso.tsx` | **R84 R85** | — |
| `components/CampoIdentificacion.tsx` | **R84 R85** | — |
| `components/DesgloseCompra.tsx` | **R84 R85** | — |
| `components/SelectorFacturacion.tsx` | **R84 R85** | — |
| `components/VisorFoto.tsx` | **R51★ R68** | — |
| `components/EvidenciaFoto.tsx` | **R42** | R47★ R48★ R77 |
| `components/HojaCaptura.tsx` | **R42** | R47★ R48★ |
| `components/SelectorAvatar.tsx` | **R42** | R47★ R48★ |
| `components/TileVideoPropio.tsx` | **R68** | R41 R77 |
| `components/AvatarMascota.tsx` | **R62★** | R77 |
| `components/Boton.tsx` | **R60** | R77 |
| `components/EscaleraCaso.tsx` | **R72★** | R77 |
| `components/FilaCita.tsx` | **R62★** | R77 |
| `components/Icono.tsx` | **R30★** | R77 |
| `components/SelectorDia.tsx` | **R68** | R41 |
| `components/Texto.tsx` | **R58★** | R77 |
| `brand/MarcaEleccion.tsx` | **R25★** | — |
| `components/BannerPlazo.tsx` | **R76** | — |
| `components/CabeceraCaso.tsx` | **R74** | — |
| `components/ConsecuenciasDelCierre.tsx` | **R64** | — |
| `components/FiltroPills.tsx` | **R68** | — |
| `components/SelectorMotivo.tsx` | **R75** | — |
| `components/SliderPrecio.tsx` | **R68** | — |
| `components/SuperficieChat.tsx` | **R82** | — |
| `components/TarjetaDestinoPlata.tsx` | **R73** | — |

#### Las que sólo entran por denominador

- **R47 · R48★** (las piezas que montan `Boton`): **31**
- **R41** (las que mueven y deben mirar `useReducedMotion`): **15**
- **R78★** (las que leen el tema memorial): **14**
- **R77** (las que enumeran una unión a mano): **39**
- **sólo denominador total** (R59/R88/R89/R90, que cuentan todo): **117**

### Lo que la matriz dice del rediseño

- 🔴 **De todas las reglas que miran COLOR, una sola vigila una pieza concreta: `R58★` → `components/Texto.tsx`** (que `Texto` no gane un color de acento, N23). Las demás no llegan a las piezas por caminos distintos, y conviene separarlos porque no son lo mismo: `R12` (contraste) y `R15` (`#0F5E56`) **se alimentan del volcador de tokens**, no de archivos; `R16` (tapices), `R27` (el pink) y `R43` (bordes de campo) reciben **listas de fuentes propias**; `R56` (el oro) tiene corpus `apps/` solamente; y `R4`, `R20` y `R35` **sí incluyen `ui` en su corpus y hoy no tocan ninguna pieza** —están en 0, que es su verde—.
  ⇒ *Cambiar la paleta no se rastrea recorriendo componentes: se rastrea por el tema y por el volcador.* **Y su corolario incómodo: la matriz regla×pieza, que es lo que este bloque produce, es poco útil justo para el eje que un rediseño mueve primero.*- **La pieza más vigilada es `TarjetaFactura`** (5 reglas: `R47★ R48★ R84 R85 R86`) — las tres fiscales de S115 más las dos del `Boton`.
- **`Icono.tsx` lo vigila una sola regla** (`R30★`, 99 paths). Es el archivo de 2.454 líneas del que cuelga todo el set de glifos.

---

## ② GLIFOS 72 ↔ 52

### Cómo se leyó cada glifo

**Por el dibujante, no por el nombre.** Para cada uno abrí su entrada en el registry y miré qué `<Path>` / `<Circle>` dibuja, más el comentario de su declaración en el union (limpio de comentarios para el conteo, leído entero para la clasificación). *Es lo que hizo falta: hay al menos un caso donde el nombre y el dibujo dicen cosas distintas.*

### Los 52 que pide el mock

`✅` existe con ese nombre · `↔` existe con otro nombre · `❌` no existe · `⚙` de control

| # | mock | estado | glifo del registry | qué dibuja hoy |
|---|---|:-:|---|---|
| 1 | Volver | ↔ | `Chevron` **(fuera del registry)** | tabla `CHEVRON` con 4 direcciones, en `components/chevron.tsx` — es geometría compartida, no una entrada de `Icono` |
| 2 | Avanzar | ↔ | `Chevron` (íd.) | íd. |
| 3 | Flecha | ↔ | `Chevron` (íd.) | íd. |
| 4 | Buscar | ↔ | `lupa` | círculo + mango diagonal |
| 5 | Hogar | ✅ | `hogar` | la casa, con la huella adentro |
| 6 | Explorar | ✅ | `explorar` | — |
| 7 | Despensa | ✅ | `despensa` | la sección |
| 8 | Pedidos | ↔ | `pedido` (singular) | la tab de pedidos, declarada distinta de `despensa` y `carrito` |
| 9 | Cuenta | ✅ | `cuenta` | persona (círculo + hombros) + huella |
| 10 | Asistente | ↔ ⚙ | `ia` | tres `CHISPA`. ☠️ se llamaba `coach` y se renombró (S84-B11) |
| 11 | Notificación | ↔ | `campana` | campana + badajo. Su huella vive **en el Badge**, no adentro |
| 12 | Agregar | ❌ | — | no existe. Única mención: *«el menos en 1 vuelve a "Agregar"»*, sobre el stepper |
| 13 | Quitar | ↔ | `papelera` | 🔴 **su dibujo es un TACHO** (tapa, cuerpo, dos estrías); su USO declarado es *«el `−` del stepper con cantidad 1»*. Uso y dibujo no coinciden |
| 14 | Confirmar | ↔ | `checkEnCirculo` · `nodoEntregado` | dos: check dentro de un círculo · check suelto grueso |
| 15 | Favorito | ❌ | — | 🔴 la estrella existe y **está ocupada por `personalidad`**, con la colisión declarada por escrito: *«una estrella es la metáfora universal de "favorito" y de "calificación". Acá NO es ninguna de las dos … el día que exista un favorito, esto se revisa antes que aquello»* |
| 16 | Calificación | ❌ | — | íd. — y ☠️ `training` **mató una estrella anterior** por violar el set |
| 17 | Veterinaria | ✅ | `veterinaria` | — |
| 18 | Urgencias | ❌ | — | **cero menciones** en todo `Icono.tsx` |
| 19 | Vacuna | ✅ | `vacuna` | jeringa (cuerpo, émbolo, aguja) |
| 20 | Medicamento | ↔ | **`receta`** | 🔴 **el dibujo es una CÁPSULA partida en diagonal** — el ícono universal de medicamento. Se llama `receta` |
| 21 | Laboratorio | ❌ | — | cero menciones |
| 22 | Receta | ⚠ | `receta` | el nombre existe; **su dibujo dice medicamento** (ver #20). *Nombre y dibujo apuntan a dos ítems distintos del mock* |
| 23 | Verificado | ↔ | `certificaciones` · `checkEnCirculo` | papel con esquina doblada + huella grande · check en círculo |
| 24 | Telemedicina | ✅ | `telemedicina` | — |
| 25 | Peso | ✅ ⚙ | `peso` | control (vive en los dedos del Coach) |
| 26 | Mascota | ↔ | **`Huella`** (primitiva de `brand/`) | no es una entrada del registry: es la primitiva que todos los demás montan adentro |
| 27 | Alimento | ❌ | — | cero menciones. `despensa` es la sección, no el alimento |
| 28 | Estética | ↔ | `grooming` | — |
| 29 | Alergia | ❌ | — | cero menciones (existe la pieza `AvisoAlergia`, sin glifo propio) |
| 30 | Microchip | ❌ | — | cero menciones |
| 31 | Documento | ✅ | `documento` | tarjeta horizontal con retrato circular + dos líneas = **una cédula**. Conviven `documentos` (dónde viven los papeles), `papel` (hoja vertical) y `fiscal` (factura con borde dentado) |
| 32 | Nota | ↔ | `bitacora` · `pluma` | libreta con lomo + huella · pluma sobre una línea |
| 33 | Agenda | ↔ | `hoy` | 🔴 **es un calendario** (marco + anillas + travesaño) con la huella adentro. Conviven `semana` y `mes`, que se separan **contando barras** |
| 34 | Hora | ❌ | — | no existe, **y está evitado a propósito**: `wearables` declara *«la silueta se parece a un reloj, y un reloj puede leerse como "hora". Lo desambigua la huella adentro»* |
| 35 | Ubicación | ✅ | `ubicacion` | pin |
| 36 | Carrito | ✅ | `carrito` | canasta + dos ruedas (*«el rasgo que ninguna bolsa puede tener»*) |
| 37 | Eliminar | ↔ | `papelera` | el tacho (ver #13) |
| 38 | Medio de pago | ↔ | `pagos` · `bancario` | billete + huella · frontón de banco con columnas + huella |
| 39 | Descargar | ✅ | `descargar` | — |
| 40 | Enviar | ✅ | `enviar` | — |
| 41 | Chat | ↔ | `burbujas` · `contacto` | dos burbujas encaradas · **una** burbuja + huella |
| 42 | Correo | ✅ | `correo` | sobre con solapa en V + huella. `sobre` es **el mismo dibujo sin huella** |
| 43 | Contraseña | ↔ | `candado` | ⚠ existe el dibujo, pero **su significado declarado es otro**: *«esta conversación quedó en lectura»* (postventa). No lleva ojo de cerradura a propósito |
| 44 | Perfil | ↔ | `cuenta` | el mismo de #9 |
| 45 | Micrófono | ❌ | — | cero menciones |
| 46 | Cámara | ↔ ⚙ | `foto` | cuerpo de cámara + lente. Es control |
| 47 | Colgar | ❌ | — | cero menciones en el registry (existe el **color** `sobreVideo.colgar` = `#C1121F`) |
| 48 | Galería | ❌ | — | cero menciones |
| 49 | Voltear | ❌ | — | cero menciones |
| 50 | Ayuda | ✅ | `ayuda` | salvavidas (círculo + 4 rayos) + huella. Declarado **distinto de `info`** |
| 51 | Salir | ❌ | — | cero menciones |
| 52 | Más | ❌ | — | no existe. `info` es el ⓘ y es de control |

**Cuenta:** **14 existen con su nombre** · **17 existen con otro nombre** (3 de ellos vía `Chevron`, que no es del registry) · **17 no existen** · **4 son de control** (`ia`, `peso`, `foto`, y el ⓘ `info` que el mock no pide).

🔴 **Los tres casos que no son «falta un dibujo» sino «el dibujo dice otra cosa»:** `receta` es una cápsula (#20/#22) · `papelera` es un tacho usado como `−` (#13) · `candado` es «conversación cerrada» y el mock lo quiere para contraseña (#43).
🔴 **Y el que ya tiene su choque escrito:** la estrella de `personalidad` contra Favorito y Calificación (#15/#16). *Su propia entrada dice qué hacer el día que aparezca — y ese día es hoy.*

### Los 72 del registry contra la lista del mock

**Cómo se midió el consumo, con sus dos números:** patrón **estricto** `nombre="X"` → **30 glifos**; patrón **amplio** (cualquier `'X'` en un `.ts`/`.tsx`, sin comentarios, fuera de `Icono.tsx` y la galería) → **69 glifos**. *El estricto sub-cuenta porque casi todo se monta desde un mapa (`nombre={mapa[k]}`); el amplio sobre-cuenta porque `'vacuna'` también es un tipo de evento.* **El número duro es la intersección de lo que ninguno encuentra.**

🔴 **Sólo TRES no aparecen con ningún patrón: `correo` · `descargar` · `primeCorona`.**
- **`correo`** — su entrada lo declara: *«CERO consumidores hoy, a propósito: está en reserva, no en uso»*. Perdió su gate como candidato B de «Documentos» y el founder lo pasó a reserva.
- **`primeCorona`** — es el candidato B de `prime`; su entrada dice *«el founder elige a 21px; el perdedor muere»*. **El gate no corrió.**
- **`descargar`** — sin declaración de reserva que yo haya encontrado. **Es el único de los tres sin explicación escrita.**

**Los 20 del registry que NO están en la lista del mock** (medido cruzando las dos listas), con quién los usa:

| glifo | lo usa hoy |
|---|---|
| `paseo` · `training` · `hotel` · `guarderia` · `seguros` | los oficios — barras de navegación y fichas de servicio |
| `refugio` | adopción, las dos apps |
| `atender` | la tab central del prestador (`(tabs)/_layout.tsx`) |
| `hoy` · `negocio` · `datos` | la barra del prestador |
| `carnet` · `familia` · `preferencias` | el stack de Cuenta del cliente |
| `caso` · `presupuesto` | postventa y veterinaria |
| `nodoConfirmado` · `nodoPreparando` · `nodoEnCamino` · `nodoEntregado` | la escalera de seguimiento (`ventana-pedidos`, `EscaleraIconos`) |
| `sobre` · `burbujas` · `checkEnCirculo` · `pluma` · `enviar` | la escalera de adopción (`EscaleraSolicitud`, `EscaleraCaso`) |
| `vacaciones` · `equipo` · `certificaciones` · `wearables` | negocio del prestador |
| `filtro` · `lapiz` · `compartir` · `copiar` · `ojo` · `ojoTachado` | controles (`Campo`, filtros, papeles) |
| `antiparasitario` · `bitacora` · `personalidad` | expediente y `HojaContanos` |
| `documentos` · `papel` · `pasaporte` · `fiscal` · `bancario` | papeles, pasaporte e identificación |
| `prime` · `info` · `contacto` · `semana` · `mes` | varios |

⚠️ **`prime` y `primeCorona` siguen siendo DOS candidatos del mismo concepto esperando un gate por ícono que nunca corrió** — igual que `certificaciones`/`wearables`, cuyos perdedores (`certificacionesSello`, `wearablesActividad`) **sí murieron en su gate**.

---

## ③ TRIAGE DE LAS 115 LOCALES

### 🔴 Cómo se clasificó — y qué NO se hizo

**No leí ninguna entera. Lo digo porque cambia cuánto vale la clasificación.** Los criterios son tres, todos mecánicos:
1. **NOMBRE** — normalizado (`minúsculas`, sin `-_.`) contra los nombres de archivo de `packages/ui/src/{components,brand}`, y los símbolos que exporta contra los que exporta el barrel de `ui`.
2. **IMPORTS** — cuántos símbolos de `@epetplace/ui` importa (regex multilínea `[^{}]*`, comentarios excluidos) y si toca `react-native` crudo o el tema.
3. **TAMAÑO** — líneas, y cuántos archivos la importan dentro de su app.

⇒ **la clasificación de abajo es una HIPÓTESIS ordenada por evidencia mecánica, no un veredicto.** Un archivo de 90 líneas con 1 consumidor puede ser una pieza genérica mal ubicada, y no hay forma de saberlo sin abrirlo.

**El tamaño:** min 8 · mediana **155** · media 219 · max **1.566** (`prestador/seccion-horarios.tsx`). Reparto: ≤60 → 11 · 61-150 → 45 · 151-300 → 32 · >300 → **27**.
**Los consumidores:** 0 → 2 · 1 → **55** · 2 → 22 · 3 → 9 · 4 → 7 · 5+ → 20. **La mitad tiene un solo consumidor.**

### Cajón A — las que comparten nombre entre las dos apps (7). Las tres copias byte a byte primero.

| pieza | estado | consumidores | importa de `ui` |
|---|---|---|--:|
| **`flecha-volver.tsx`** | 🔴 **COPIA BYTE A BYTE** | 3 + 3 | 2 / 2 |
| **`gate-biometrico.tsx`** | 🔴 **COPIA BYTE A BYTE** | 2 + 2 | 3 / 3 |
| **`videollamada-piezas.tsx`** | 🔴 **COPIA BYTE A BYTE** | 3 + 3 | **0 / 0** — no toca `ui`, monta `react-native` crudo. Exporta `Camara`, `PreviewPropio`, `VideoRemoto` |
| `pantalla-caida.tsx` | divergen 228 / 235 l | 6 + 6 | 7 / 7 |
| `invitacion-avisos.tsx` | divergen 233 / 253 l | 4 + 4 | 4 / 4 |
| `seccion-direccion.tsx` | divergen 201 / 120 l | 4 + 4 | 6 / 7 |
| `entrada-videollamada.tsx` | divergen 83 / 122 l | 2 + 2 | 3 / 3 |

**Las cuatro que divergen tienen el MISMO número de consumidores de cada lado** (6+6, 4+4, 4+4, 2+2). *Eso dice que cumplen el mismo rol en las dos apps y divergieron en la implementación, no en el propósito* — pero **verificarlo pide leerlas y no las leí.**

### Cajón B — duplica una pieza de `packages/ui`: **CERO reales**

El censo por nombre marcó 2 y **las dos son falsos positivos, verificados abriéndolas** (8 y 32 líneas, triviales):

| pieza | qué es de verdad |
|---|---|
| `prestador/evita-teclado.tsx` (8 l, 12 consumidores) | **re-export declarado**: *«EvitaTeclado SUBIÓ a packages/ui (D-498: la casa tiene UNA). Este archivo queda como FRONTERA de compatibilidad»* |
| `cliente/filtro-pills.tsx` (32 l, 13 consumidores) | **re-export declarado**: *«PROMOVIDO A packages/ui EN S85-B7 — este archivo es un RE-EXPORT … el día que alguien las toque por otra razón, migran el import y este archivo muere»* |

**Cero símbolos exportados por una pieza local colisionan con el barrel de `ui`.** ⇒ **ninguna local re-implementa una pieza de la casa bajo otro nombre que yo haya podido detectar mecánicamente.** *Lo que este método no ve es una re-implementación con nombre distinto y API distinta — que es la forma más común y la que pide leer.*

### Cajón C — candidatas a pieza de la casa por USO (21 con ≥4 consumidores y sin gemela)

Las que más peso tienen, con su tamaño:

| pieza | cons. | líneas | importa de `ui` |
|---|--:|--:|--:|
| `prestador/gate-ajeno.tsx` | 9 | 57 | 4 |
| `prestador/gate-roto.tsx` | 8 | 42 | 4 |
| `cliente/reserva-piezas.tsx` | 8 | 439 | 14 |
| **`cliente/aviso-no-cargo.tsx`** | 7 | 98 | 3 |
| `cliente/direccion-hogar-form.tsx` | 6 | 685 | 7 |
| `cliente/espera-deuna.tsx` | 6 | 480 | 6 |
| `cliente/seccion-facturacion.tsx` | 6 | 635 | 11 |
| `cliente/seccion-medio-de-pago.tsx` | 6 | 534 | 8 |
| `prestador/perfil-piezas.tsx` | 6 | 648 | 15 |
| `prestador/techo-oficio.tsx` | 6 | 522 | 14 |
| `cliente/canto-curva.tsx` | 5 | 45 | 2 |
| `cliente/checkout-reserva.tsx` | 5 | 572 | 15 |
| `prestador/seccion-horarios.tsx` | 5 | **1.566** | 15 |

**Las tres chicas y muy usadas —`gate-ajeno` (57 l, 9), `gate-roto` (42 l, 8), `canto-curva` (45 l, 5)— son las que más se parecen a una pieza de la casa por forma**: poco código, muchos consumidores, pocas dependencias. *Los dos `gate-*` viven sólo en el prestador y el cliente tiene su propio `pantalla-caida`, que es el cajón A.*

### Cajón D — local a propósito

**55 tienen un solo consumidor** y **27 pasan las 300 líneas**: composiciones de una pantalla concreta (`PasoEquipo`, `PasoOfreces`, `hoja-media-guarderia`, `pizarra-hoja`). *La razón mecánica que las deja acá es el par «1 consumidor + mucho código»: una pieza de la casa se justifica por reuso, y un archivo grande con un consumidor es una pantalla partida en dos, no una pieza.*

🔴 **Y una muerta: `prestador/pizarra-hoja.tsx` — 470 líneas, importa 16 símbolos de `ui`, CERO consumidores.** (La otra de cero es `prestador/animated-icon.web.tsx`, 10 líneas — la variante web de un par que sí se usa.)

### Las 5 que no importan nada de `packages/ui`

`cliente/AltaMascota.tsx` (103 l, 4 cons.) · `cliente/videollamada-piezas.tsx` y `prestador/videollamada-piezas.tsx` (238 l, 3 cons., **react-native crudo**) · `prestador/dona-mix.tsx` (91 l, 1 cons.) · `prestador/animated-icon.web.tsx` (10 l, 0 cons.).
**Las dos de videollamada son la copia byte a byte del cajón A** — y son las únicas piezas del producto que dibujan sin pasar por el design system.

---

## ④ LAS LECTURAS DE MEMORIAL

### Primero: ayer dije 21, hoy son 28. Son dos cosas distintas.

Ayer conté **archivos** que leen un slot ausente (21, contando `apps/` y `ui`). Hoy conté **ocurrencias de `theme.X`**: **28 lecturas reales en 17 archivos**, 26 en producto y 2 en la galería. *El número de ayer no estaba mal: contestaba otra pregunta.*

Y el censo crudo daba **36**: la diferencia son 8 **strings de JSX que citan un slot en una etiqueta** (`<PanelTema etiqueta="…tint capaBg…">`) más la declaración del tipo `SlotDeTema` en `themes/index.ts`. **Mi máscara de comentarios no los filtra porque no son comentarios** — los separé exigiendo el prefijo `theme.`.

### El resultado: memorial está defendido en las 28

**28 lecturas reales de `theme.X` en 17 archivos** (26 en producto · 2 en la galería).

| archivo:línea | slot | ¿hay guard de ese slot en el archivo? | ¿memorial la alcanza? |
|---|---|:-:|---|
| `ui/components/Badge.tsx:102` | `accent.active` | sí | NO — cae al fallback declarado |
| `ui/components/BarraTabs.tsx:559` | `accent.active` | sí | NO — cae al fallback declarado |
| `ui/components/Boton.tsx:806` | `accent.active` | sí | NO — cae al fallback declarado |
| `ui/components/CalendarioCupo.tsx:272` | `capaBg.comunidad` | sí | NO — cae al fallback declarado |
| `ui/components/FichaDeOferta.tsx:278` | `capaBg.cuidado` | sí | NO — cae al fallback declarado |
| `ui/components/FichaMascotaHogar.tsx:102` | `capaText.cuidado` | sí | NO — cae al fallback declarado |
| `ui/components/FichaMascotaHogar.tsx:153` | `capaBg.cuidado` | sí | NO — cae al fallback declarado |
| `ui/components/FichaMascotaHogar.tsx:154` | `capaText.cuidado` | sí | NO — cae al fallback declarado |
| `ui/components/FichaVacuna.tsx:126` | `capaText.cuidado` | sí | NO — cae al fallback declarado |
| `ui/components/Icono.tsx:2223` | `capaText.cuidado` | sí | NO — cae al fallback declarado |
| `ui/components/Icono.tsx:2224` | `capaText.identidad` | sí | NO — cae al fallback declarado |
| `ui/components/Icono.tsx:2225` | `capaText.comunidad` | sí | NO — cae al fallback declarado |
| `ui/components/Icono.tsx:2226` | `capaText.comunidadAmplia` | sí | NO — cae al fallback declarado |
| `ui/components/Icono.tsx:2229` | `capaText.cuidado` | sí | NO — cae al fallback declarado |
| `ui/components/Icono.tsx:2230` | `capaText.identidad` | sí | NO — cae al fallback declarado |
| `ui/components/Icono.tsx:2232` | `capaText.comunidad` | sí | NO — cae al fallback declarado |
| `ui/components/Insignia.tsx:394` | `capaBg.comunidad` | sí | NO — cae al fallback declarado |
| `ui/components/SelectorEspecie.tsx:150` | `capaBg.identidad` | sí | NO — cae al fallback declarado |
| `ui/components/SelectorFacturacion.tsx:106` | `accent.controlBg` | sí | NO — cae al fallback declarado |
| `ui/components/SelectorOpcion.tsx:221` | `capaText.identidad` | sí | NO — cae al fallback declarado |
| `ui/components/SelectorOpcion.tsx:251` | `capaBg.comunidad` | sí | NO — cae al fallback declarado |
| `ui/components/SelectorOpcion.tsx:254` | `capaBg.identidad` | sí | NO — cae al fallback declarado |
| `ui/components/SelectorRoster.tsx:262` | `capaBg.comunidad` | sí | NO — cae al fallback declarado |
| `ui/components/SelectorVentana.tsx:219` | `capaBg.comunidad` | sí | NO — cae al fallback declarado |
| `ui/components/SliderPrecio.tsx:116` | `capaText.cuidado` | sí | NO — cae al fallback declarado |
| `ui/components/caja-de-campo.ts:161` | `accent.active` | sí | NO — cae al fallback declarado |

**En la galería (2), que no es producto:** `TokenGallery.tsx:2721` · `TokenGallery.tsx:3466`

**Por qué importa que estén todas guardadas:** en memorial `theme.capaBg` es `undefined`, así que `theme.capaBg.identidad` **no da un color raro: da un `TypeError` y la pantalla se cae**. No es una cuestión estética.

### 🔴 Mi detector marcó 3 sin guard y las 3 eran falsos positivos

Usé una ventana de 4 líneas hacia arriba. Los guards estaban más lejos:

| lectura | dónde estaba el guard | distancia |
|---|---|--:|
| `SelectorEspecie.tsx:150` (`capaBg.identidad`) | `const rellenoCatalogo = !seleccionada && 'capaBg' in theme && …` (línea 96) | **54 líneas** |
| `SelectorOpcion.tsx:221` (`capaText.identidad`) | `'capaText' in theme ?` — la cabecera del mismo ternario (línea 216) | 5 líneas |
| `SelectorOpcion.tsx:254` (`capaBg.identidad`) | `const tinteAcento = !('capaBg' in theme) ? fondoReposo :` (línea 246) | 8 líneas |

**Las leí a mano, que era lo que el encargo pedía.** Y `SelectorEspecie` trae la evidencia más fuerte de que el patrón funciona, escrita por quien lo pagó: *«`tsc` lo rebotó porque memorial no tiene `capaBg`. El compilador señaló el único tema que podía alcanzar esa rama y de paso mostró que la rama no debía existir»*. **El tipo de `Theme` es una unión de los tres temas, así que el compilador exige el guard.**

### Qué se ve hoy en memorial — y qué es NULL

| slot | fallback declarado | qué se ve |
|---|---|---|
| `accent.active` | `theme.accent.primary` | el acento primario de memorial en vez del activo |
| `accent.controlBg` | `theme.bg.overlay` | superficie de overlay en vez del tinte del control |
| `capaBg.*` | `theme.bg.overlay` · `fondoReposo` | sin tinte de capa — **Ley 8: memorial no tinta** |
| `capaText.*` | `theme.text.primary` · `text.secondary` · `theme.capa.*` | texto neutro en vez del color de capa |

⚠️ **Que el fallback exista no dice que se vea bien: dice que no rompe.** Si en memorial la señal de «elegido» queda sólo en el borde, y si eso alcanza para distinguirlo, **es NULL: no lo puedo saber sin un aparato.** Las piezas lo declaran como intencional (*«memorial degrada solo, como siempre: sin `capaBg` no hay tinte y la señal vuelve al borde sereno»*), pero **eso es la intención escrita, no una observación.**

### El diff exacto de los tres temas

**Comando:** parseo de claves `grupo.slot` de los tres archivos, comentarios excluidos.

| tema | slots |
|---|--:|
| `light` | **86** |
| `dark` | **86** |
| `memorial` | **74** |
| unión | **86** |
| en los tres | **74** |

**A `light` no le falta ninguno. A `dark` tampoco. A `memorial` le faltan 12, y son exactamente estos:**

| slot ausente en memorial | en light | en dark |
|---|:-:|:-:|
| `accent.active` | ✓ | ✓ |
| `accent.controlBg` | ✓ | ✓ |
| `accent.controlLleno` | ✓ | ✓ |
| `accent.sobreControlLleno` | ✓ | ✓ |
| `capaBg.identidad` · `capaBg.cuidado` · `capaBg.comunidad` · `capaBg.comunidadAmplia` | ✓ | ✓ |
| `capaText.identidad` · `capaText.cuidado` · `capaText.comunidad` · `capaText.comunidadAmplia` | ✓ | ✓ |

⇒ **`light` y `dark` tienen la MISMA forma; `memorial` es un subconjunto exacto de 74 de 86.** No hay ningún slot que memorial tenga y los otros no. Los 12 que faltan son **dos grupos enteros** (`capaBg`, `capaText`) más **4 de `accent`**, y los 4 de `accent` son los que resuelven por casa en `lightOficio`/`darkOficio`.
⚠️ **`accent.controlLleno` y `accent.sobreControlLleno` no los lee NADIE hoy** (medido: 0 archivos) — faltan en memorial y no le hacen falta a nadie.

---

## ⑤ FUENTES

### Cómo se cargan hoy

| qué | dónde | cómo |
|---|---|---|
| el mapa | `packages/ui/src/fonts.ts` (50 líneas) | `export const epetplaceFonts = { … }` con **6 entradas** |
| la carga | `apps/cliente/src/app/_layout.tsx:78` · `apps/prestador/src/app/_layout.tsx:108` | `const [fontsLoaded] = useFonts(epetplaceFonts)` — **runtime, `expo-font` `~57.0.0`** |
| los archivos | `node_modules/@expo-google-fonts/{dm-sans,jetbrains-mono}/<peso>/*.ttf` | **import POR PESO**, no desde la raíz de la familia |

**Los 6 pesos:** `DMSans_300Light` · `DMSans_400Regular` · `DMSans_500Medium` · `DMSans_700Bold` · `JetBrainsMono_400Regular` · `JetBrainsMono_500Medium`.

🔴 **No hay plugin `expo-font` en ninguna app.** Los plugins declarados son `expo-router`, `expo-notifications`, `expo-splash-screen`, `expo-image-picker`, `@livekit/react-native-expo-plugin` (las dos) más `expo-speech-recognition`, `expo-location`, `expo-camera`, `expo-video` (prestador). **Ninguna fuente se embebe por config nativa: todas entran por `useFonts` en runtime.** Esa es la razón mecánica de lo que sigue.
`assetBundlePatterns` **no está declarado** en ninguna de las dos. `runtimeVersion` es `{policy: 'appVersion'}` y `version` es **1.0.7** en ambas.

### La medición: ¿OTA o build?

**No lo deduje del mecanismo: lo medí con tres `expo export` sobre `main` @ `ca564994`** (corridos en el árbol principal, que está en el MISMO SHA y tiene `node_modules`; mi worktree no lo tiene — declarado).

```bash
cd apps/cliente && npx expo export --platform android --output-dir <dir>
# y después: contar los assets con ext=ttf en metadata.json,
# que es EXACTAMENTE lo que el manifest de un update declara para descargar
```

| corrida | qué había | `.ttf` en el manifest | assets totales |
|---|---|--:|--:|
| ① base | el árbol tal cual | **7** | 36 |
| ② | `PruebaS116B.ttf` en `assets/fonts/` **Y** un `require` en `useFonts` | **8** | 37 |
| ③ | el mismo `.ttf` en `assets/fonts/`, **sin** `require` | **7** | 36 |

**Control de que el export se rehízo de verdad:** el hash del bundle cambió entre ① y ② (`entry-81ccc7b3….hbc` → `entry-e5877230….hbc`). *Sin ese control, dos números iguales podrían ser un export cacheado.*

⇒ **Respuesta medida, y son dos:**
- **Una fuente nueva CARGADA por `useFonts` llega por OTA.** Entró al manifest del update (7 → 8) sin tocar nada nativo. No pide build.
- **Un `.ttf` puesto en `assets/` que nadie requiere desde JS NO llega a ninguna parte** (③ vuelve a 7). Metro sólo empaqueta lo alcanzable desde el grafo, y `assetBundlePatterns` no está declarado. *El archivo suelto es invisible: no viaja por OTA y tampoco se hornea.*

**El árbol principal quedó limpio en `ca564994`**: revertí el `_layout` con `git checkout --` y borré el `.ttf` y su carpeta. Verificado: `git status --porcelain` = 0.

⚠️ **Lo que esta medición NO dice:** que la fuente se **vea** en un aparato tras el OTA. Prueba que el archivo viaja en el manifest; que `useFonts` la resuelva y el texto la use es otra cosa y **no la medí** — no hay aparato en esta sesión. Tampoco cubre iOS: exporté `--platform android`.

---

## ⑥ LO QUE NO ALCANCÉ A MIRAR

**Nada corrió en aparato ni emulador. Cero capturas.** Ninguna afirmación de este parte dice cómo se **ve** algo.

1. **Las 10 reglas que no reciben corpus de archivos son NULL para la matriz** (`R11 R12 R15 R16 R17 R27 R43 R44 R50 R80` y las que llaman a disco en su argumento). No sé qué piezas tocan; el método de ablación no las alcanza. **Y son justo las que miran color** — o sea que la parte de la matriz que más importaría para un cambio de paleta es la que no pude medir así.
2. **Las 7 reglas con corpus reconstruido PARCIAL** (`R66 R68 R77 R78 R81 R82` y `R45/R50`): llaman a `leer(...)` dentro de su propio argumento, así que mi corpus es un subconjunto y **sus piezas pueden ser más de las que reporto**.
3. **No verifiqué qué pasa si una regla se enciende de verdad.** Medí que su resultado *cambia*; no produje un rojo por pieza. *Un cambio en el contador no prueba que la regla marcaría esa pieza como violación.*
4. **Las 115 locales: no leí ninguna entera** (declarado en §③). Los cuatro archivos que divergen entre apps con el mismo nombre quedan **sin diagnóstico**: no sé si la divergencia es de propósito o deriva. `pizarra-hoja.tsx` (470 l, 0 consumidores) tampoco la abrí.
5. **El cajón C es una hipótesis por uso.** No leí `gate-ajeno`, `gate-roto` ni `canto-curva`, que son mis tres candidatas más fuertes.
6. **Los glifos: no rastericé ninguno.** Todo el §② sale de leer paths SVG. **Ningún gate por ícono a 21 px corrió** — y el propio registry declara **al menos 12 pendientes** (`candado`, `filtro`, `descargar`, `copiar`, `vacuna`, `bitacora`, `documentos`, `pasaporte`, `papel`, `lupa`, `fiscal`, `bancario`, más `prime`/`primeCorona` sin resolver).
7. **El conteo amplio de consumo de glifos sobre-cuenta** (`'vacuna'` también es un tipo de evento). El estricto sub-cuenta. **Sólo el cero de los tres —`correo`, `descargar`, `primeCorona`— es duro**; los otros 69 tienen un rango, no un número.
8. **No sé por qué `descargar` no tiene consumidores.** `correo` y `primeCorona` traen su razón escrita; `descargar` no, y no la busqué fuera de `Icono.tsx`.
9. **Memorial: qué se VE es NULL.** Sé que las 28 lecturas caen a un fallback declarado y que ninguna rompe. **No sé si la degradación se lee bien** — eso pide aparato.
10. **No medí cuántas piezas romperían si memorial ganara los 12 slots**, ni el contraste de esos 12 en el tema memorial (`verify:contrast` mide los tres temas hoy, con memorial tal como está).
11. **Fuentes: sólo Android, sólo el cliente.** No exporté iOS ni el prestador, y no probé que la fuente se **renderice** tras el OTA.
12. **No corrí `verify:diseno` completo hoy** — usé la salida del 12-sep para las descripciones de las reglas. El SHA no se movió, pero **no re-verifiqué que siga verde**.
13. **No toqué `packages/cuadro-video` ni `packages/mensajeria`**, igual que ayer.
14. **No crucé el mock de 52 con la letra de `DIRECCION_ARTE`** — no sé si alguno de los 17 que faltan ya tiene una decisión escrita en la letra que no vive en `Icono.tsx`.

---

## ⑦ LOS COMANDOS

Todos sobre `pista/s116-b` @ `ca564994`, el **13-sep-2026**.

```bash
# push verificado por SHA (L-239), no por código de salida
git push -u origin pista/s116-b
git ls-remote origin pista/s116-b | cut -f1        # == git rev-parse HEAD

# ① regla × pieza — ablación sobre el corpus completo
cp scripts/verify-diseno.mjs scripts/_s116b-medicion.mjs
diff <(head -9197 scripts/_s116b-medicion.mjs) scripts/verify-diseno.mjs   # vacío = copia idéntica
echo "export { REGLAS, apps, ui, galeria, dics, appsCodigo, uiCodigo, FIXTURES, INFORMATIVAS };" >> scripts/_s116b-medicion.mjs
node /tmp/rp2.mjs control     # positivo: R30→Icono.tsx · negativo: 5 reaccionan a lo inerte
node /tmp/rp2.mjs resumen
rm scripts/_s116b-medicion.mjs                      # BORRADO: no queda en el repo

# ② glifos — union limpio de comentarios + registry por entrada
#    (dos patrones de consumo: nombre="X" estricto · 'X' amplio)

# ③ locales
find apps/{cliente,prestador}/src/components -name '*.tsx' | wc -l    # 115
shasum -a 256 apps/{cliente,prestador}/src/components/<gemelas>

# ④ memorial — máscara de comentarios con estado + prefijo theme.
#    diff de slots de los tres temas

# ⑤ fuentes — TRES exports, en el árbol principal (mismo SHA, con node_modules)
cd apps/cliente
npx expo export --platform android --output-dir <dir>
python3 -c "import json;m=json.load(open('<dir>/metadata.json'));print(sum(1 for x in m['fileMetadata']['android']['assets'] if x['ext']=='ttf'))"
# 7 · 8 (con require) · 7 (sin require) — y el hash del bundle cambió entre corridas
git status --porcelain    # 0 al terminar: el principal quedó limpio
```

**Los medidores de este parte viven en el scratchpad de la sesión, no en el repo** — igual que ayer. Ninguno está cableado como gate: si alguno de estos números va a volver a mirarse, hay que cablearlo (`D-1015`).
