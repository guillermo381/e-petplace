# S113 · FASE 3 — «Encontrar, traer, llevar» · CIERRE

> **Cerrada por firma del founder, 7-sep-2026.** No se abre fase 4.
> Publicado: **cliente `d668fae0` · prestador `c81479b3` · ancla `f4fbe740` ·
> `dirty: None` · runtime 1.0.7.**
> `main @ 75412d58` · 4 typechecks en 0 · gates en 0 salvo el rojo declarado.

---

## LO QUE SE CONSTRUYÓ

### ① La búsqueda dejó de buscar por nombre

`buscar_en_mi_familia` recorre **siete brazos** —mascotas, citas, papeles,
productos, pedidos, recuerdos, eventos del expediente— con FTS en español,
cuatro índices GIN y un techo que **prioriza antes de cortar**.

**Tres cosas que aprendió a hacer, cada una con su rojo de origen:**

- **encuentra un examen por su analito**: quien busca «hematocrito» quiere el
  estudio donde aparece, no un papel que se llame así. *Sin los analitos, la
  bóveda sería un cajón: se puede guardar y no se puede encontrar.*
- **«proplan» encuentra «Pro Plan»**: un pase que compara sin espacios, guiones
  ni acentos. ⚠️ **Sólo con consulta de UNA palabra, y el caso inverso queda
  declarado como no cubierto** — «prop lan» sin separadores **es** `proplan` y no
  hay forma de aceptar uno y rechazar el otro. *La tensión está escrita en la
  primera línea del cuerpo de la función, no sólo en un parte.*
- **indexa por tipo, con la clave que cada uno usa**, medido contra
  `cat_tipos_evento`: antes leía tres claves genéricas y veía **8 de 520**.

🔴 **Y lo que NO hace, por diseño:** un resultado de tipo `papel` sale **mudo** —
título, origen, fecha, y ningún valor. Es la última puerta por la que un examen
podría llegar a una familia **sin pasar por el muro clínico**, porque el muro
vigila la prosa de Nexo y la búsqueda no pasa por ahí. Lo vuelve garantía
`verify:papel-sin-valores`, que mide la **función viva** y trae su control.

### ② La bóveda de papeles

`papeles_familia` + `papel_valor` + bucket propio, **en DOS ACTOS**:
`registrar_papel_extraido` y `confirmar_papel`. **El evento del expediente nace
sólo en el segundo.** *Un guard se puede saltear con otra llamada; una pieza que
no existe en el primer acto, no.*

Cerró sus tres huecos el último día (`20260910320000`): `tecleado` fuera del
CHECK (0 productores medidos), los grants de escritura revocados (había grants
y **sólo policy de SELECT**), y `archivo_estado` para poder decir si el **blob**
existe — `archivo_path` es `NOT NULL`, así que la fila siempre tuvo *path*.

### ③ El pasaporte y la placa

**Once campos firmados** —foto, nombre, especie, raza, sexo, edad, microchip,
contacto, alergias, medicación vigente, estado de perdida— con su lista negativa
(nunca apellido, dirección, otras mascotas, prestadores ni historia clínica) y
tres apagables por la familia. **Un campo nuevo pide firma nueva**, y lo vigila
`verify:pasaporte-campos` contra la línea base fechada.

La placa: `estado_de_placa` con sus tres respuestas —`libre`, `activada`,
`no_existe` **sólo con sesión**—, QR generado en el servidor (**cero peso en el
bundle**), y el portal admin para crear lotes con su CSV para la imprenta.

### ④ El arco clínico de Nexo

Nexo **cita los papeles de la bóveda con su fecha y su referencia, y no los
interpreta**. Verificado con discriminador contra Thor:

| | pregunta | respuesta |
|---|---|---|
| ① | *¿cuál fue el hematocrito y de qué fecha?* | «hemograma del **20/11/2024**, Clínica San Rafael, **41 % (ref. 37-55)**» — cita el anterior en 44 % **sin decir qué significa**: deriva al vet |
| ② | *¿cuánto dio la fosfatasa alcalina?* | **no la inventa**: dice que no la encuentra y enumera lo que sí tiene |

⚠️ **Y cómo se supo que hacía falta, que importa más que el resultado:** la
costura tuvo **dos piezas y sólo una puesta** durante horas. La RPC devolvía
`papeles` y **la edge los tiraba al piso** — su prompt se armaba con 15 campos
elegidos a mano. *Desplegar cuatro veces no lo curó: faltaba una línea del otro
lado.* Hasta entonces, la medición de la costura **medía un vacío**.

---

## LO QUE QUEDA ABIERTO, con dueño

| | qué | dueño | estado |
|---|---|---|---|
| 🔴 | **`crear_lote_placas` nunca corrió** (0 lotes, 0 placas) | founder | **ROJO DECLARADO** por firma: espera proveedor. `D-1049`. **No se fuerza ni se corre con `service_role`** — esa credencial saltea el gate de admin, que es la única parte sin estrenar, y daría el mismo verde sin probar nada |
| 🟡 | **el barredor que verifica el archivo de un papel** | A | `D-1048`. La columna existe; Postgres no puede preguntarle a Storage |
| 🟡 | **el contador de la skill dice 81, son 171** | B | las dos filas del canon ya declaran el comando; falta la skill y `packages/ui/CLAUDE.md` |
| 🟢 | **el pulido** — tres de C, cuatro del Hogar de B, la voz de eventos, las fechas de la búsqueda | C · B | el candidato se arma cuando cierren |
| ⏸ | **el NFC de iPhone** | Apple | **fuera de alcance**: el founder espera el DUNS. Android se corta igual |

---

## LAS LEYES NUEVAS DE LA SESIÓN

Todas nacieron de un caso medido, no de una idea:

1. **«Sin dato → sin gráfico» tiene TRES estados, y el del medio es el que
   miente.** Sin dato · **un punto** · serie. *Un sparkline de un solo punto se
   lee «estable», y eso es una afirmación que un dato solo no sostiene.* El caso
   vacío se nota; el de un punto no. La tendencia de menos de dos puntos es
   `null`, jamás `'igual'` — *«no se sabe» y «no cambió» son cosas distintas*.

2. **`\b` no delimita palabras en español.** Una vocal acentuada no es carácter
   de palabra, así que `\bdejá\b` **nunca cierra**. El cinturón de voz alcanzaba
   **83 de 132 formas** —todo el imperativo voseante pasaba entero— **y su log
   decía «corregido»**. Cura: `(?<![\p{L}\p{N}])` … `(?![\p{L}\p{N}])` con flag `u`.

3. **Una corrida no es una medición.** Lo que tiene varianza se reporta como
   tendencia entre N vueltas, nunca como conteo: *«17 de 20 con voseo» de una
   sola pasada no es un número, es una señal*, y publicarlo como conteo lo vuelve
   una vara con la que alguien va a medir un progreso que no ocurrió.

4. **Un parte de entrega nombra la PUNTA de la rama, jamás un SHA intermedio.**
   *Un intermedio es un estado que existió unos minutos y que nadie volvió a
   mirar.* Un parte nombró uno y desplegarlo habría puesto en producción dos
   preguntas comunes devolviendo «probá de nuevo». Y su mitad gemela: **todo
   instrumento que juzgue una salida usa el MISMO parser que el sistema real** —
   uno más permisivo no protege, esconde.

5. **Un contador publicado se MIDE, no se escribe.** Tercer cobro de la clase:
   migraciones cayó cuatro veces (9 → 77 → 138 → 186), fichas seis, y ahora
   piezas (53 publicadas, **171** reales) y wrappers (**26 publicados con 122
   archivos**, unas 67 sesiones). *La nota «RE-MEDIDO S85» no salvó al número: lo
   hizo más creíble.* La cura nunca fue corregirlo otra vez: fue sacarlo.

6. **Una RPC no está entregada hasta que su wrapper está exportado.** *Entregada
   ≠ montada* — se cobró tres veces en la sesión, y el costo lo paga la pista que
   la necesita, escribiendo en territorio ajeno o llamando a `rpc()` directo.

---

## LO QUE ESTA PISTA REGISTRA SOBRE SÍ MISMA

- **Adiviné nombres de tablas y columnas más de una vez** —`placas` cuando era
  `pasaporte_placa`, `p_consulta` cuando era `p_q`— y cada vez **el rojo era del
  instrumento**, que se lee igual que un rojo del mundo. Tres ceros seguidos en
  una búsqueda eran el parámetro, no la búsqueda.
- **Un censo mío midió contra un quinto de su corpus** y devolvió «45 tipos sin
  voz»: un número creíble y falso. *Mandárselo a C la habría puesto a curar lo
  que no existe.* No se reportó.
- **Publiqué un OTA con un push rechazado**, o sea con un ancla que no estaba en
  origin. Se reconcilió y se republicó. *El publish no falla porque el push haya
  fallado: son dos actos y sólo uno avisa.*
- **El cinturón me atrapó a mí**: eran **dos** CHECKs de `modo_captura` y el que
  admitía `tecleado` lo había nombrado Postgres al crear la tabla. Dropear «el
  mío» dejaba el de la casa vivo **y la migración habría pasado en verde**. Lo
  cazó preguntar si *algún* constraint menciona `tecleado`, en vez de si existe
  un nombre.
- **Un gate que escribí se cazó a sí mismo**: la fila curada **cita** el número
  viejo y el patrón no distinguía cita de publicación.

*Ninguna de las cinco la encontró revisar código: las encontró correr los
instrumentos contra un objeto real.*
