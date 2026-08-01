# S83-C — DEPÓSITO ANTES DE COMPACTAR (1-ago-2026)

**Qué es esto:** lo que un C-nuevo NO puede reconstruir leyendo el repo.
Todo lo que sí está en el código (qué hace cada pantalla, qué componentes
existen, qué se commiteó) queda AFUERA a propósito. Acá vive el
diagnóstico, el porqué de las estrategias, y las mediciones que costaron
tiempo.

Rama `s83-c`, sincronizada a `main` = `52b2a11`.
Último OTA publicado: group `f0815c7a-1e8e-483e-be58-4577f1141611` ·
ancla `52b2a113ec3c87dc56588470340ab8e0340f80ba` · runtime 1.0.3 ·
android `019fbbfa-978a-735f-…` / ios `019fbbfa-978a-7051-…` ·
**ancla limpia, sin asterisco, veda cerrada.**

---

## 1. LOS SEIS DEFECTOS DEL PERFIL (S83-C32) — diagnóstico con líneas

El founder gateó el Perfil ya cableado y encontró seis. La mesa declaró
su propio error: *"la mesa mandó a cablear sin ordenar el craft"*.
**Estado: MEDIDOS, NINGUNO CURADO.** El orden dice lote completo, un solo
OTA al final.

### ① La bandera no alinea — y la cura anterior es la que está mal

**Medido:** `SelectorPais` **SÍ está montado** en `cuenta/perfil.tsx`
líneas **348 y 367**. La hipótesis de la mesa (que el cableado lo hubiera
reemplazado por otra cosa) es **FALSA**. El componente que corre ES el
que construí.

**Entonces el defecto es de la cura, no de su ausencia** — y ahí está mi
error: la declaré curada **por construcción, no por pantalla**. Es L-153
aplicada a mí mismo (la vara no la declara quien construye).

**Por qué falló la estrategia vieja:** peleé contra las MÉTRICAS de
texto — `lineHeight` compartido + `includeFontPadding:false` +
`textAlignVertical:'center'` + `minWidth:44`. Dos razones medidas por las
que eso no puede ganar:
- `textAlignVertical` en Android **solo actúa con alto acotado**; sin
  altura fija el flag es decorativo.
- La **fuente de emoji** que resuelve el regional-indicator **puede
  ignorar el `lineHeight` pedido** — no es nuestra tipografía, no
  respeta nuestras métricas.

**Estrategia nueva (no implementada): CAJA FIJA, no métricas.** La
bandera va dentro de una caja de alto y ancho FIJOS, centrada por el
CONTENEDOR (flex), no por el line-box del texto. *Un glifo que no
controlo no se alinea por métrica; se alinea por caja.*

### ② Los 23 países — el dato que cambia la implementación

Medido contra `cat_paises`: **23 filas, 9 con `formato_telefono`
declarado, 14 SIN**.

Los nueve, literales:
```
EC +593  ^\+593\d{8,9}$      AR +54  ^\+54\d{10,11}$     CL +56  ^\+56\d{9}$
CO +57   ^\+57\d{7,10}$      MX +52  ^\+52\d{10}$        PE +51  ^\+51\d{7,9}$
CA +1    ^\+1\d{10}$         ES +34  ^\+34\d{9}$         US +1   ^\+1\d{10}$
```

**Colombia SÍ tiene el suyo** — el caso propio del founder (prestador
ecuatoriano con línea colombiana) queda validado de verdad, no
exento.

Consecuencias de diseño, firmadas por la orden:
- **EC es el DEFAULT, no el único.** Verbatim: *"lo normal es Ecuador,
  pero puede haber casos como yo"*.
- El `activo` del array local **deja de gatear la selección** (hoy marca
  22 en `false`): pasa a ser solo el default.
- Los **14 sin formato NO validan**, y la pantalla lo dice honesto.
  Verbatim: *"el que no lo tenga declarado, no valida (no inventes uno)"*.

### ③ El logo — **mío, con línea: `cuenta/perfil.tsx:309`**

```jsx
onEditarLogo={() => undefined}
```

**Porté la composición y no porté el flujo.** El pipeline está ENTERO y
sin tocar: `apps/prestador/src/lib/subir-logo.ts` (dos pasos — subida al
bucket `avatars` + `actualizarPerfilPrestador({foto_url})`), y la
pantalla vieja tenía su Hoja con cámara/galería. Al cablear traje los
cuatro wrappers de datos y **dejé el del logo con un handler vacío que
compila, renderiza y no hace nada** — la clase exacta de defecto que
ningún typecheck ve.

### ④ Email y sitio web — **cero validación**, texto libre los dos

Pedido: email con validación real; sitio web con **normalización**
(`https://` si falta) además de validación de forma.

### ⑤ "Nombre y acceso" pide teléfono — **confirmado, y el error es doble**

`cuenta/identidad.tsx`: estado línea **69**, lectura **85**, escritura
**98**, Campo **154-157**.

Lo puse ahí **y además** escribí en el detalle de su celda *"Tu nombre,
tu teléfono y tu correo"*, contradiciendo el texto de la propia sección
de contacto del Perfil, que dice *"tu teléfono personal vive en Cuenta"*.
**Las dos frases no pueden ser ciertas a la vez.** Sale el campo Y se
corrige el detalle de la celda.

Letra del founder: *"ahí va nombre + correo de inicio de sesión. El
teléfono es del negocio y vive en contacto."*

### ⑥ "Todo aparece al tiempo" — el código está BIEN, y por eso queda abierto

Medido en `cuenta/perfil.tsx`:
- `primeraIncompleta` definida en **129** (regla: `descripcion` vacía →
  `'portada'`; `tel` o `wa` vacíos → `'contacto'`; si ninguna, `null`).
- **SE APLICA**: `setAbierta(primeraIncompleta(desc, tel, wa))` línea
  **183**, dentro del `useFocusEffect` (160-190).
- **Estado ÚNICO** `abierta` (156) consumido por las tres secciones
  (318, 336, 420) ⇒ **estructuralmente NO pueden abrirse todas.**

Quedan dos lecturas y **no se puede decidir leyendo**:
- **(a)** se abrió una que el founder no esperaba — con su negocio,
  `descripcion` vacía hace que abra **"Tu portada"**, no "Cómo te
  contactan". *Pregunta abierta al founder: ¿la que se abrió fue "Tu
  portada"?*
- **(b)** el `useFocusEffect` **reaplica la apertura en CADA foco**: al
  volver del selector de dirección o de país, la sección abierta a mano
  se cierra y vuelve la calculada. **Este sí es defecto seguro** — el
  cálculo debe correr UNA vez, no por foco. *(Ojo con el comentario de
  las líneas 153-155: dice "se computa UNA VEZ, cuando llegan los datos"
  — es verdad respecto de cada tecla, pero NO respecto de cada foco. El
  comentario describe una garantía que el `useFocusEffect` no da.)*

**Curar (b) igual; (a) espera la línea del founder.**

---

## 2. INVENTARIO — lo que MÁS entró en el cableado y el founder no vio

El founder dijo *"no sé qué más hay en este cambio"*. Esto es lo que
entró además de reemplazar datos falsos por reales:

1. **"Dónde atendés" dejó de ser texto falso** y hoy es la sección real
   con Places y radio (`SeccionSede`) — **con escrituras propias que NO
   cuelgan del Guardar de arriba**. Es **el gate (b) que queda ABIERTO**:
   una pantalla con dos maneras de guardar.
2. **Nació `Cuenta → Nombre y acceso`** como pantalla aparte
   (`cuenta/identidad.tsx`), y **la pantalla vieja murió** junto con su
   celda "Perfil v2 (en revisión)" y su ruta de verificación.
3. **Los tres estados honestos**: esqueleto al cargar y el fallo que dice
   que es fallo con reintentar. Antes no existían — la pantalla nacía con
   datos falsos, así que no tenía estados.
4. **El resumen de cada sección cerrada** ("Sin descripción" · "Solo
   WhatsApp" · "Quito · 5 km") se calcula del dato real y **se recalcula
   al tipear**, igual que la línea de vacío del espejo.
5. **Los textos siguen FUERA del riel i18n** — declarado en el commit:
   era correcto como herramienta de verificación; ahora que es
   producción, su copy debe pasar por el lote de strings con gate es/en.

---

## 3. EL CICLO DE CAMPO (C29/C30 ③) — arquetipo MEDIDO, construcción NO empezada

**La familia es 3×3, no 12.** Tres momentos (Antes · Durante · Después) ×
tres oficios (paseo · grooming · adiestramiento). **Veterinaria queda
AFUERA**: su ciclo no es el mismo — tiene consulta, mostrador y
presupuesto, con pantallas propias que no comparten anatomía con los
otros tres.

**Los tres Durante llevan 3 Tarjetas** cada uno — es el punto de
coincidencia estructural que hace de la familia una familia y no tres
pantallas parecidas.

**La pantalla de firma es el Durante de PASEO**, y es la más cara del
lote medido: **691 líneas · 11 botones · GPS vivo · track**. Es también
la única del producto que se REPITE (SOFTLAUNCH §1: donde vive la
mayoría). Cualquier plan que la trate como "una más de las nueve" está
mal presupuestado.

## 4. LAS PORTADAS (C30 ④) — son ×3, NO ×4

Medido antes de comprometer trabajo:
- **paseo y grooming son GEMELAS EXACTAS** (2/4/4/2 elementos).
- **adiestramiento** es la misma anatomía **un elemento más liviana**.
- **veterinaria es OTRA PANTALLA**: 6 `Tarjeta` + 5 `Texto`, sin
  parentesco con las tres anteriores.

⇒ El arquetipo de portada cubre **tres**, y veterinaria se trata aparte o
no se trata. Presupuestar ×4 sería inventar una familia que la fuente no
tiene.

---

## 5. LO QUE LA MESA DEBE (declarado, no reclamado)

- **El gate (b) del Perfil: ABIERTO** — dos caminos de guardado en una
  pantalla (el Guardar de arriba y las escrituras propias de
  `SeccionSede`). Nadie decidió si se unifican o si se declara que son
  dos actos distintos.
- **La deuda de i18n del Perfil** — el copy nuevo entra al lote de
  strings con gate es/en del founder. Hoy son literales.
- **R18 del lint solo vigila la entrada de galería del CLIENTE** — la
  entrada nueva del prestador (S83-C14/C15) **queda sin guard**. Si su
  retiro pre-soft-launch depende del lint, hoy no depende de nada.
- **El JSDoc de `marcaDeAgua`** (packages/ui) tiene prosa vieja —
  territorio B, declarado y no tocado.

---

## 6. NOTAS OPERATIVAS QUE YA COBRARON (no repetirlas)

- **`${PIPESTATUS[0]}` vuelve vacío en zsh.** El exit del publish se lee
  con `$?` del comando **directo** — sin pipe. (Orden explícita del
  founder tras el incidente de C5.)
- **`git fetch` ANTES de verificar el ancla.** Un ref viejo produjo mi
  freno y el de A. `git rev-parse HEAD` contra un remoto no fetcheado no
  prueba nada.
- **Paso ⓪ de la veda (regla 82, enmienda S83):** quien publica PIDE la
  congelación NOMBRANDO a quiénes espera, y **no bundlea hasta recibir la
  confirmación de CADA UNA, AL MOMENTO**. Una confirmación de hace tres
  turnos no es una confirmación.
- **Si el árbol sale sucio, el asterisco SE DECLARA** (pasó en C17: el
  `porcelain` estaba en 0 en el paso ① y el árbol se ensució durante el
  bundling con dos `docs/*.md` de A). Taparlo sería peor que el defecto.
- **Trampas del worktree fresco** (medidas en C3): `expo-env.d.ts` es
  generado/gitignored ⇒ **rojo falso** del `pnpm typecheck` la primera
  vez · `expo lint` **se auto-configura y MUTA `package.json` +
  `pnpm-lock.yaml`** (revertir y re-`pnpm install`) · `supabase/.temp/`
  gitignored ⇒ `db query --linked` falla hasta relinkear.

---

*Depositado por C al cierre de la ventana de contexto de S83. Nada de lo
de acá está firmado: son mediciones y diagnósticos. Lo que rige sigue
siendo el canon y las órdenes de la mesa.*
