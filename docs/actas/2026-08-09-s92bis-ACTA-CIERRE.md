# ACTA DE CIERRE · S92-BIS (9 Ago 2026) — EL PERÍMETRO

> Continuación del loop de S92 (S93 está tomada por la landing). **Pista A sola.
> Cero features.** Lo que S92 no miró: Storage, llaves, superficies publicadas y
> la puerta de entrada.

---

## ① EL SALDO

**Cinco curas aplicadas y verificadas por camino real · cinco deudas nuevas ·
dos rescates que nadie fue a buscar · un P0 del founder curado.**

| bloque | resultado |
|---|---|
| **B0** regresión de S92 | **27/27** + **19/19** flujos + contraste de sondas |
| **B1** Storage | `avatars` y adopción curados · **13/13** · 127 huérfanos censados |
| **B2** llaves | **ninguna `service_role` en el repo** · 4 falsos positivos · 1 real (mío) |
| **B3** superficies | 2 despachadores curados **9/9** · 4 facturables curadas **8/8** |
| **B4** auth | 3 rojos medidos, perillas servidas al founder |

---

## ② LOS TRES AGUJEROS QUE ESTABAN ABIERTOS

**`avatars` era un vertedero de una sola dirección.** Cualquiera con una cuenta
podía **subir archivos a la carpeta de otro, sin límite de tamaño ni de tipo**,
servidos desde el dominio de la casa — **y no podía borrarlos ni él**, porque el
bucket no tenía policy de DELETE. Las policies de `adopcion-fotos` **se llamaban
«Admin» y solo miraban el bucket**. *El defecto estaba escrito en un comentario
del código desde hacía sesiones: se venía esquivando en vez de curando.*

**Dos despachadores contestaban a internet.** `despachar-push` y
`despachar-whatsapp` devolvían **200 sin ninguna credencial**. Y **ninguna
configuración de Supabase los habría protegido**: con `verify_jwt: true` entraría
cualquiera con la anon key, que es pública y viaja en el bundle.

**Cinco functions facturables entraban con la clave del bundle.** `verify_jwt`
valida que el JWT sea **válido**, y la anon key **es** un JWT válido. *No es fuga
de datos: es fuga de plata.*

**Y la puerta de entrada acepta `password`.** Mínimo de 6 caracteres, las cuatro
claves obvias probadas aceptadas, y **12 intentos fallidos seguidos sin un solo
429**. Contra una cuenta cuyo correo se conozca, se prueba la lista entera sin
que nada frene. *No hace falta ninguna vulnerabilidad: alcanza con la puerta como
está.*

---

## ③ LO QUE ESTABA BIEN — y conviene no re-auditar

- **Ninguna `service_role` en el árbol versionado.** Buscada **por FORMA**
  (decodificando el claim `role`), no por nombre: una llave renombrada aparecía
  igual. Los tres JWT del repo son `anon`, pública por diseño.
- **Los cinco buckets privados** —incluidos los 91 documentos de identidad—
  rebotaron las cinco pruebas. La cura de S47 sigue rigiendo.
- **Los cinco papeles clínicos** tienen `verify_jwt: false` **pero su propio
  guard**: `token_invalido`. El acceso por token en la URL funciona.
- **El schema `cron` no está expuesto**: 404 a anónimo y a autenticado, cero
  grants. *Una policy `{public}` sin grant no alcanza nada* — por eso el rojo
  aparente de los comandos con credenciales **no era rojo**.

---

## ④ EL P0 DEL FOUNDER — «el paseo es para perros», con dos perros vivos

**No era regresión de S92**, y se midió de cuatro formas: el guard del motor
devolvía `true`, **cero grants perdidos** contra el snapshot que S92 tomó al
abrir, el catálogo respondía `["perro"]`, y ninguna de las cuatro hipótesis de la
mesa se confirmó.

**La causa:** `ofrecibles()` devuelve `[]` en **tres** situaciones —cargando,
error, y de verdad no hay— y la pantalla decidía con `length === 0`.

**Lo que lo vuelve lección: la advertencia ya estaba escrita** en el header de la
lib que ese mismo archivo importa. Cuatro pantallas la cumplían y una no, y nada
lo detectó. ⇒ **L-218 + R34** en `verify:diseno`, el instrumento que la vigila.

**Y el paseo era el único que podía romperse:** es el único oficio donde la
mascota se elige en el **último paso**; los otros tres la reciben ya elegida.

---

## ⑤ LOS DOS RESCATES

**Siete archivos que nunca llegaron al canon.** La cura de una línea que S92
propuso (`git branch -a --no-merged main`) devolvió **seis actas de cierre de
pista** y un instrumento. *No era un caso aislado: la última acción de una pista
es escribir su cierre, y por eso es justo la que se queda afuera.* **D-707 sube
de gravedad.**

**Un token de sesión que yo mismo había commiteado** (D-712). De cuenta fixture y
ya vencido — pero eso es suerte, no diseño. **R6 estaba escrita desde el arranque
y no lo evitó**, porque una regla que depende de acordarse no protege un
`JSON.stringify`. Hoy el saneador redacta cualquier JWT antes de escribir.

---

## ⑥ LOS ERRORES DE ESTA PISTA

1. **Seis nombres adivinados en vez de medidos** (`p_tipo`, `familia_miembros`,
   `titular_user_id`, `eventos`, `prestador_fotos.storage_path`, tres columnas de
   los seis flujos). **Tres parecían «rompí el camino legítimo».**
2. **Un verde flojo**: el brazo sano de Storage dio 400 y parecía cura rota — era
   `415 invalid_mime_type`, o sea **el filtro nuevo funcionando**. Para probar
   una policy hay que pasar antes el filtro de tipo.
3. **El censo de la clase devolvió CERO** en sus tres ejes, incluido un patrón
   que existe en 80 archivos. *Un censo que devuelve cero se lee igual que «no
   hay nada que arreglar».*
4. **R34 se equivocó dos veces antes de servir**: numeró sobre el texto sin
   comentarios (mandó a mirar seis líneas que no eran) y marcó `length === 1`,
   que es sano. *Un lint que manda al lugar equivocado enseña a ignorarlo.*
5. **Mi censo de `.env` fue parcial** (lista de raíces a mano, ocho worktrees
   afuera) y casi concluye «no se explica» sobre una búsqueda incompleta.

---

## ⑦ LA CONTRADICCIÓN DEL `.env`, cerrada — y su dato

El founder veía la línea vacía; yo medía 32 caracteres. **Mismo archivo byte a
byte** (md5 `9db678109c30…`): su editor enmascara el valor, y **el comentario
vencido de S44 —«# ↓ completala vos», que quedó de cuando la variable nació
vacía— le confirmó la lectura errada.**

*Un comentario vencido al lado de un dato vivo hizo que el founder concluyera que
una credencial no existía, y costó varias vueltas.* Pariente de **L-210**, del
otro lado: ahí el guard confundía el epitafio con la ley; acá el comentario
negaba un valor que sí estaba.

**La diferencia de un carácter, medida y cerrada:** 25 (nombre) + 1 (`=`) + 32
(valor) = **58** en las dos mediciones. La resta de 57 salía de no contar el `=`.
El valor está limpio: sin espacios, comillas ni CRLF.

---

## ⑧ OPERATIVO

- **1 migración** (`20260809030000`) con reversa escrita antes y 76(g) declarada.
- **6 edge functions desplegadas** con `--use-api` (sin Docker).
- **11 fixtures `seg2-*` limpiados dentro de la sesión**: 161 → 150, residuo 0,
  con el mismo protocolo de guards que S92 usó con las 64 sondas.
- **`verify:diseno` VERDE con 26 reglas** (R34 nueva) · typecheck del cliente
  verde.
- **Deudas D-709 → D-718** · **lección L-218** · **D-713 y D-714 nacen y mueren
  el mismo día**.

---

## ⑨ LO QUE **NO** ESTÁ FIRME (regla 77) — PARCIAL declarado

- **El OTA no se publicó.** Medido: el canal sirve el ancla `c4c92933` de S91,
  **anterior a la cura del paseo** ⇒ **nada de lo que toca pantalla llegó al
  aparato**. El OTA es del founder.
- **Ningún gate en dispositivo corrió.** La lista con checkboxes está en
  `docs/relevamientos/2026-08-09-seg2-GATES-EN-DISPOSITIVO.md`. **El más
  importante: que una notificación real siga llegando** (una cura tocó ese
  camino).
- **`chat-ayuda` quedó sin curar** — la quinta facturable, sin fuente en el repo
  (D-717).
- **D-715** (el muro §8.3 al `system`) **no se tocó por decisión del founder**:
  exige re-gate de calidad de dictado.
- **El brief de S93 no se escribió, por orden del founder: ya existe.**
- **Efecto declarado:** el retome de WhatsApp del canon ahora necesita el header
  `x-despacho-secret`; **el curl viejo rebota 401**.
