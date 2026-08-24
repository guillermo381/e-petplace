# S104-D · TRASPASO — el correo, el DNS y el push

**Territorio de la pista:** edge functions · Resend · plantillas de Auth · DNS · push.
**Todo lo de acá está en `main`.** Rama `pista/s104-d`, sin nada suelto.

> **Esto es un mapa de dónde retomar, no una fuente de datos.** No lleva un solo
> número que se pueda medir — los números envejecen dentro de un documento y el
> canon ya pagó cuatro veces por eso. Cada cosa dice **dónde medirse**.

---

## ① QUÉ QUEDÓ EN MAIN

| Pieza | SHA | Qué es |
|---|---|---|
| Medición de push · correo · DNS | `cff6e012` | El relevamiento que abrió la pista |
| Lectura del canal de WhatsApp | `ceab44ce` | Retome de S91, plantillas, L-201, la sombra |
| D-628 al idioma del usuario | `c36bb07d` | Mi corrección: entregué al español, la orden pedía al idioma |
| `despachar-correo` no habla inglés | `8dcb3a5b` | Corrección de una razón mía ya depositada en un canónico |
| Freno del DKIM borrado por Hostinger | `084f9a0c` | El hallazgo más grave del día y su valor exacto de restauración |
| `verify-dns-correo.mjs` | `f2673d2d` + `ead4c5cd` + `6a378a6a` | Los cinco registros del correo, con auto-prueba y tercer estado |
| Las seis plantillas de Auth bilingües | `e9a00d4e` | Firma del founder: un cuerpo, dos idiomas |
| Esquemas de app + Confirm signup por código | `77f4c8cd` | `cliente://`, `prestador://`, y la plantilla de D-893 |
| `despachar-invitacion-correo` | `b02aa181` + `0f2b8986` + `4661841f` + `59aa8c93` | El único correo a quien no tiene cuenta |
| `verify-paginas-correo.mjs` | `38bb0037` | La condición de encendido firmada, hecha instrumento |
| Los dos correos de privacidad | `5b3ffa71` | Cuerpo de letra publicada, remitente `privacidad@` |
| Reversa del acto ③ | `66db9361` | El testigo del único cambio definitivo de config |

**Reversas, todas en `docs/relevamientos/`:** las plantillas de Auth (dos), la
tanda 2, las seis bilingües, y el acto ③. **Cada una guarda el estado de ANTES,
así que revertir es un `PATCH`, no una reconstrucción.**

---

## ② QUÉ QUEDA ABIERTO

| # | Qué | Bloqueo | Dueño |
|---|---|---|---|
| 1 | **El correo de invitación no ha salido nunca por su camino completo** | `INVITACION_CORREO_VIVO` — se encendió y hubo envíos, pero nadie confirmó cómo se ven | founder (abrir uno de los dos correos ya enviados) |
| 2 | **Los dos correos de privacidad nunca se enviaron** | sus tipos nacen `en_sombra` | mesa: decidir cuándo salen de sombra |
| 3 | **El remitente `privacidad@` no está probado en camino real** | consecuencia de (2): la rama del `from` por tipo nunca se ejecutó | se prueba solo cuando (2) se abra |
| 4 | **El worker de exportación de datos no existe** | la tabla y la RPC están; el productor del archivo no | A |
| 5 | **El reloj del día 30 no corre** | `ejecutar_cierres_vencidos` sin cron | A |
| 6 | **La identidad externa (Google) nunca se midió en un cierre** | las tres cuentas de prueba entraron por `email` | founder: una cuenta de Google **nueva**, sin mascota |
| 7 | **Reportes DMARC sin leer** | llegan reenviados, y el reenvío pierde SPF ⇒ probablemente a spam | founder: un filtro en Gmail |
| 8 | **Las tres capas de silencio del registro de push** | no es defecto — es endurecimiento sin urgencia | sin dueño |

> **⚠️ Sobre (6), el borde que no tiene vuelta desde la app:**
> `revertir_cierre_cuenta` exige `is_admin()` **con sesión**. Si el único admin
> cierra su propia cuenta, nadie puede revertirlo desde el producto. *Y la cuenta
> principal del founder **pasa** el pre-chequeo, o sea que cerrarla la banea de
> verdad.* **La prueba se hace con una cuenta creada para eso, nunca con una real.**

---

## ③ LAS FIRMAS QUE RIGEN

- **Las seis plantillas de Auth van bilingües en un cuerpo.** No necesita saber quién lee: sirve para los dos.
- **D-893 son TRES actos y en este orden:** plantilla con código → RPC que registre el consentimiento sin sesión → **recién ahí** apagar `autoconfirm`. *Los tres corridos y verificados.*
- **`L-412`:** un canal de reporte se apunta a una dirección que **se vio recibir**, jamás a una que figura en un panel.
- **`L-413`:** cuando un proveedor toma la administración de una zona, se **miden** los registros de los otros que viven ahí — y se **captura el estado antes de tocar**.
- **`L-414`:** una medición que habilita una decisión ajena viaja **con su predicado**, no solo con su número.
- **Voto (c) del correo de invitación:** nada se enciende hasta que las dos páginas midan 200 **con control positivo**.
- **Materia de privacidad sale por `privacidad@`**, porque la Política publicada nombra esa dirección como el canal.
- **Manda la letra que la persona LEYÓ.** Por eso el correo de cierre dice *seudonimización*; P15 §2 se enmendó a esa palabra.
- **P15 §4 gobierna la PANTALLA, no el correo** — quien confirma pierde el acceso en el acto.

---

## ④ DÓNDE MEDIR CADA COSA

**Ningún número vive acá. Estos son los comandos.**

| Qué | Cómo |
|---|---|
| Los cinco registros del correo (DKIM, SPF, MX ×2, DMARC) | `node scripts/verify-dns-correo.mjs` · `--autoprueba` para creerle el verde |
| Las dos páginas del correo de invitación | `node scripts/verify-paginas-correo.mjs` |
| Estado de las plantillas de Auth y sus llaves | Management API, `GET /v1/projects/{ref}/config/auth` |
| Si el push está vivo | `push_tokens` (activos por cuenta) + `notificacion_intencion` por estado + `net._http_response` por `status_code` |
| Si un cron **corrió** y no solo existe | `cron.job_run_details` **y además** `net._http_response` — `succeeded` solo dice que el SQL corrió |
| La cola del correo de invitación | `invitacion_correo_pendiente` por `estado` y `motivo` |
| El cierre de cuenta | `cierre_cuenta` · `auth.users.banned_until` · `auth.sessions` · `auth.identities` · `consentimientos` · `storage.objects` |
| Si un tipo de aviso puede salir | `cat_notificacion_tipos.en_sombra` — **`encolada` con `sombra_habria_salido` no es un fallo: es la sombra** |
| Los números libres de `D-` y `L-` | grep contra `docs/DEUDAS_CANONICAS.md`, **jamás de un documento** |

---

## ⑤ LO QUE APRENDÍ, CON SU CASO

**① Un instrumento contesta, pero no siempre la pregunta que creías.**
Ocho veces en la sesión. Mis tres: la auto-prueba que daba rojo **contra un NS no
autoritativo** (detectaba «este servidor no contesta», no «no existe»); la vara
del DMARC que **daba verde sobre un registro sin `rua`** — el defecto exacto que
el archivo venía a cazar; y el falso **rojo** por leer los autoritativos anycast
como si fueran el objeto. *La pregunta útil no es si un guard tiene una forma de
mentir: es cuál.*

**② El exit code se lee del comando, jamás del pipe.**
Leí `exit=0` de un `node ... | tail` y el exit real era 1. Estuve a un paso de
reportar como verde un instrumento que estaba dando rojo correctamente.

**③ Una premisa no medida invalida un razonamiento correcto.**
Diagnostiqué «frente de código» en el push del prestador con un discriminador
bueno, aplicado sobre una premisa que no medí: tomé *«tiene permisos concedidos»*
por *«abrió la app»*. **Medí bien, razoné bien, y me equivoqué en el medio.**

**④ Un dato duro de un par competente también viaja sin su predicado.**
Me llegó *«de 16 titulares, `nombre_es_email` = 0, tu corte no dispara contra
nadie»*. Medido contra el predicado correcto —el local-part— eran **dos**, y mi
corte habría bloqueado a dos personas reales **en silencio**. *Es la peor forma:
no llega como un verde sospechoso, llega como un dato.*

**⑤ Y su gemela: un literal también miente si pasó por un formateo.**
Me pasaron `familia="(sin nombre)"`. Podía ser el dato o un `COALESCE`, y **cada
caso pedía código distinto**. Era `NULL`. *Alias y `COALESCE` hacen lo mismo desde
lados opuestos: convierten «cómo lo mostré» en «qué había».*

**⑥ Verde por ausencia de ejecución no es verde.**
En el primer intento de cierre, los seis chequeos «pasaban» — los consentimientos
seguían ahí. **Pero nada había corrido.** No los reporté como verdes, y eso mandó
a A a medir el pre-chequeo en vez de curar lo que no estaba roto.

**⑦ Lo importante del día no lo encontró ningún gate.**
El DKIM borrado lo encontró que el founder pidiera verificar antes de cargar otra
cosa. Que D-628 estuviera a medias, releer la vara. Que `despachar-correo` no
hablara inglés, desconfiar de una frase mía ya depositada en un canónico. *Los
gates atrapan lo que se les pidió atrapar; lo demás aparece cuando alguien vuelve
a mirar lo que ya dio por cerrado.*

**⑧ El cable primero, la llave después — y funcionó tres veces.**
El despachador de invitación nació inerte por dos llaves; los dos correos de
privacidad nacen en sombra; el reloj del día 30 no tiene cron. *Un canal que se
enciende solo porque alguien lo desplegó es la clase de cosa que quema un dominio.*
