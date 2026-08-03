# S84 · CENSO DE ENMIENDAS DE LEY 

> # ✅ S84 **FIRMADA** — el gate cerró al **100%** (founder, 3-ago-2026)
>
> **La pasada que S84 dejó pendiente SE HIZO.** Los nueve OTAs tuvieron su ojo.
>
> **Todo firmado, con UNA excepción — y va nombrada arriba de todo, porque una
> firma "al 100%" con un rebote adentro es exactamente el dato que después nadie
> vuelve a verificar:**
>
> · 🔴 **`Boton` acento — REBOTADO.** Cura ordenada a B: **la flecha en el
>   label**. **El re-gate viaja con el próximo publish.** Hasta entonces el
>   acento está *publicado y rebotado* — que no es lo mismo que *pendiente de
>   mirar*, y confundirlos lo archivaría como visto.
>
> **Firmados en esta pasada:** los **tres glifos a 21px** (*"no les vi ningún
> problema"*, mirados entre sí — B retira `documentoSello` citando esta firma) ·
> **`superficie="muro"`** · **Datos comerciales**, el aviso de revisión y
> **Cuenta reordenada** · **la cura de Places** · **la pantalla de documentos**
> del eje ①.
>
> ---
>
> ### ⚠️ LO QUE LA FIRMA DEL GATE **NO** ALCANZA — y se lee aparte
>
> **El gate mira PANTALLAS.** La recuperación por código **no se cae por diseño
> de pantalla: se cae por el correo.** El founder lo probó en campo y **el mail
> no trae código — trae un LINK que redirige al portal de prestadores ANTIGUO**,
> con remitente genérico de Supabase.
>
> *Un gate visual verde sobre un camino que no llega es la peor combinación
> posible: se archiva como resuelto.* **Ficha D-628**; la cura es de **S86**
> (plantilla con token + redirect + SMTP propio). **Hoy no se cura nada.**


> **Para qué existe:** que nadie construya contra letra que ya no rige.
> Molde: el censo de S83.
>
> **Cada entrada trae: origen · fecha · QUÉ MURIÓ con ella · estatuto.**
> **FIRMADA = rige. CANDIDATA = NO rige** (regla 80).
>
> **⚠️ BORRADOR:** falta el último lote de C. Lo que falte se suma.

---

# PARTE I — LAS FIRMADAS (RIGEN)

## 1 · ☠️ LA REGLA 28 SE DEROGA — el teléfono se guarda E.164 ENTERO
**Origen:** firma founder + arquitecto, 2-ago-2026 · **Vive en:**
`CONTRATO_TRABAJO` regla 28 (**v1.25**) · los CHECK de `prestadores` ·
`perfil.tsx`

**Texto anterior, conservado:** *"Persistencia E.164 sin '+' para teléfonos."*
**Ahora:** **E.164 entero, con su `+`.** El país viaja **dentro** del número.

**QUÉ MURIÓ:** los dos guards `prestadores_*_sin_plus` y el
`.replace(/^\+/, '')` de la pantalla. **Los tres cuerpos se movieron juntos** —
que era la condición de D-613.

> **Y SE DEROGA POR INCOMPLETA, NO POR EQUIVOCADA.** *"E.164 sin `+`"* funciona
> **si el país vive en otro lado**, y en `profiles` esa mitad existe
> (`telefono_codigo_pais`); **en `prestadores` nunca se construyó.** *Derogar
> culpando al criterio anterior enseñaría lo contrario de lo que pasó.*

**VALIDADA EN DISPOSITIVO** (firma founder sobre `d139b9c0`): un número
colombiano se guardó con su `+` y persistió.

## 2 · P21, AFILADA: proponer NO es deducir
**Origen:** firma founder, 2-ago · **Vive en:** `perfil.tsx` (`partirE164`)

> *P21 prohíbe **DERIVAR** el país del `country_code`; **no prohíbe OFRECERLE al
> dueño lo que su propio número ya dice**. Proponer no es deducir — la
> confirmación sigue siendo del dueño.*

**QUÉ MURIÓ:** la lectura absoluta de P21 que dejaba a la salida (a)
mordiéndose la cola — *el dueño no podía confirmar desde una pantalla que no lo
dejaba guardar*.

**Verificable en el resultado, no de palabra:** las siete filas tienen
`country_code='EC'` y **Satori quedó en `+57`**. Si se hubiera derivado del
perfil, habría quedado en `+593`.

## 3 · LA COORDENADA EXACTA NO VIAJA AL TELÉFONO
**Origen:** firma founder, 2-ago · **Vive en:** `v_prestadores_publicos`

La ficha muestra **la ZONA** — círculo de ~500 m con el centro **desplazado y
estable por `id`**. **La dirección exacta se entrega después del pago, por otro
camino** (que **no existe todavía**, y mientras no exista **nadie del lado
cliente la tiene** — el estado correcto, no un hueco).

**QUÉ MURIÓ:** `lat`/`lon` en la vista pública.

> **La regla que la gobierna, y es la que hay que citar al construir: si el
> aparato recibe la coordenada exacta y encima se pinta un círculo, la privacidad
> es DECORATIVA.** Todo lo que llega al cliente se puede leer. **Por eso la zona
> sale ya aproximada de la base** — es una migración, no una pantalla.
>
> **Y el desplazamiento es ESTABLE por diseño:** si variara, dos lecturas
> promediadas convergen al punto real. *Un ofuscado que varía no ofusca:
> promedia.*

## 4 · EL ESCRIBA — sus muros y su forma
**Origen:** firma founder S84 (A8 · A14) · **Vive en:**
`supabase/functions/escribir-presencia` · `MODELO_PRESENCIA` §5/§9

**① LOS MUROS VAN EN EL PROMPT DEL SISTEMA**, separados del material del
prestador. *Una regla que viaja junto al contenido es una regla que el contenido
puede discutir.*

**② LA COBERTURA NO SE MENCIONA** — radio y km no entran **aunque vengan en los
hechos**; es parámetro de operación, no razón para elegir. Única excepción: que
el prestador la nombre él mismo.

**③ UNA FRASE, NO UN PÁRRAFO** — 160 chars y **una oración**, en el prompt **y en
el validador de salida**. *Un largo que solo vive en el prompt es una sugerencia.*

**④ §9 ENMENDADA CON FECHA — el escriba se adelanta.** El disparo original tenía
**dependencia circular**: el arco esperaba a los primeros prestadores reales, pero
**sin descripción no hay vitrina, sin vitrina no hay pitch, y el pitch es lo que
los trae**.

**QUÉ MURIÓ:** el *"máximo 3 oraciones"* del bloque de voz; y el disparo de §9
para §5 (**no** para ②③, que siguen esperando).

## 5 · LA PORTADA ES EL ORDEN MÍNIMO
**Origen:** adjudicación de mesa, S84 · **Vive en:** `prestador_fotos`

**No existe `es_portada`.** El `UNIQUE (prestador_id, orden)` hace que
«dos portadas» sea **inexpresable** — probado: la segunda con `orden=0` rebota.

**QUÉ MURIÓ:** el flag separado del orden, que permitía dos estados imposibles
(«dos portadas» y «la portada no es la primera»).

## 6 · LO NUEVO VIAJA DIRECTO A SU LUGAR · ☠️ LA LÁMINA MUERE ENTERA
**Origen:** firma founder, 2-ago y S84 · **Vive en:** `CONTRATO_TRABAJO` regla 80

*Detalle y evidencia: §1 del acta del método.* **QUÉ MURIÓ:** la cláusula 1 en su
forma absoluta, y **la lámina como instrumento — también para variantes de
token**, que era lo último que le quedaba tras S83.

---

# PARTE II — LAS CANDIDATAS **SIN FIRMA** (NO RIGEN)

**#18** el exit tras el pipe · **#19** el árbol viejo · **#20** la cadena que
declara nuestro estado · **#21** el mensaje del guard.
*Su desarrollo y su eje común están en §3 del acta del método.*

**Y las de proceso, también sin firma:** **D-626** (las condiciones de muerte que
piden que alguien mida) · la consecuencia de los frenos (*todo freno declara
contra qué midió*).

---

## APÉNDICE · LO QUE **NO** ES ENMIENDA

- **El predicado de los verificados** (`estado='aprobado' AND revisado_por IS NOT
  NULL`) es **criterio nuevo**, no enmienda: antes no existía nadie que
  etiquetara.
- **El reparto de Seguridad** (cambiar + código ahora, enlace a S85) es
  **adjudicación de alcance**, no letra.
- **D-628** (el correo en inglés) es **estado declarado**, no regla.
