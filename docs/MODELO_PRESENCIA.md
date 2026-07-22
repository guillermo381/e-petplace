# MODELO_PRESENCIA — La firma, la presencia y el espejo del prestador

> **Versión: v0 SEMILLA — S73 (21 Jul 2026). SIN FECHA DE CONSTRUCCIÓN;
> disparos declarados en §9.** Dictado del founder en mesa S73, pensado y
> mejorado por la mesa. **Contrastes obligatorios:** MODELO_PRODUCTO
> (éticos §8), MODELO_FINANCIERO (se lee ANTES de que exista cualquier
> precio de este doc — regla de la casa), PORTAL_PRESTADOR §"presencia
> visible" (la letra ya firmada que este doc completa), MODELO_VETERINARIA
> §14.2 (el ciclo de validación de credenciales — la maquinaria YA VIVA de
> la que el sello es la cara), MODELO_LOYALTY §7 (el patrón de límites en
> piedra, heredado acá).
> **Qué es:** el primer arco del producto que no repara nada — construye
> ventaja. La tesis del founder, textual: *"quiero que sientan que es
> suyo"*.

---

## 1. La tesis (founder, S73)

En un marketplace, el lado difícil de conseguir es el prestador — y el
lado fácil de perder, también. Si la app se siente como la herramienta de
otro, la usan a desgano y se van con el primero que ofrezca algo. Si se
siente como SU vidriera — su nombre, su historia, su sello — es un activo
que no abandonan. Y hacia el pet parent: la presencia del prestador es
CONFIANZA ("¿le confío a Thor?"), no afinidad. La diferencia con Fluvi,
donde nació la intuición: allá el prestador ES el producto (elegís a la
persona); acá es quien cuida a tu mascota — la presencia se construye con
credenciales, oficio y años más que con carisma. Mismo mecanismo, otro
contenido.

Doble uso inmediato: **pitch de captación** ("te doy tu presencia, tu
marca, tus clientes te conocen" > "te doy una agenda") en un mercado donde
aún no hay prestadores reclutados.

## 2. Las tres piezas (no son una)

1. **LA FIRMA** — su identidad en SU app: nombre comercial, logo/avatar,
   oficio, ciudad. La letra ya existe (PORTAL_PRESTADOR: "no es navbar con
   avatar de 30 píxeles — es presencia visible"); falta construirla.
   **Viaja con S74** (la ventana de equipo vive en la misma superficie
   NEGOCIO): costo marginal.
2. **LA PRESENCIA** — lo que el pet parent ve al elegir y, en el futuro
   próximo, ANTES de elegir: el botón "conocelo" hacia una pantalla chica
   donde el prestador cuenta quién es. Con las reglas de §4-§6.
3. **EL ESPEJO** — "cómo me ven los clientes" en NEGOCIO. **Jamás un
   tablero de calificaciones** (máquina de ansiedad: entran a mirarse en
   vez de a trabajar). Es una VISTA PREVIA: "así te ve un pet parent ahora
   mismo" — y su efecto secundario es la motivación honesta de completar
   el perfil.

## 3. La ley madre del perfil: NACE COMPUESTO, JAMÁS VACÍO

Corolario directo de la Ley 23 del founder (*la puerta no pregunta lo que
ya sabe*): un formulario en blanco le pide al veterinario lo que el
sistema YA TIENE. El perfil v1 **se compone** de lo vivo — credencial
validada (§14.2), oficios activos, ciudad, antigüedad (fecha declarada de
fundación + fecha verificable en plataforma, separadas), servicios — y el
prestador lo MEJORA, nunca lo empieza. Un perfil vacío es peor que ningún
perfil: tarjetas en blanco gritan "a este no le importa" y matan la
función y al prestador de paso.

## 4. EL MURO VERIFICADO/DECLARADO (en piedra, no configurable)

Lo VERIFICADO (credencial §14.2, antigüedad en plataforma, sello) y lo
DECLARADO (bio, especialidades autoafirmadas, historia) **jamás comparten
bloque visual**. Texto libre junto a un registro Senescyt validado hace
que lo no verificado PAREZCA verificado — y ahí la plataforma avala lo que
no revisó. Cada dato porta su procedencia de nacimiento (el mismo
principio del Bio-Expediente, aplicado al prestador).

## 5. La IA facilitadora (Anthropic API) — el ESCRIBA, jamás la fuente

Patrón de infraestructura: edge function, como sedimentar_nota_clinica.

- **Entrada:** los hechos compuestos (§3, con su etiqueta
  verificado/declarado) + 2-3 respuestas humanas del prestador ("¿por qué
  hacés esto?", "¿qué querés que sepan de tu lugar?").
- **Salida:** borrador corto en la voz del producto (tuteo neutro),
  **es+en de nacimiento** (DEFINICION_SOFTLAUNCH: bilingüe) — para el
  prestador de Quito, el inglés que solo no escribiría.
- **Muros duros:** jamás inventa datos · jamás superlativa sin fuente ("el
  mejor de Quito" no existe) · jamás estira una credencial (registro
  veterinario ≠ "especialista en cirugía") · lo verificado se CITA, no se
  parafrasea.
- **Autoría:** el prestador edita y APRUEBA — la IA es el escriba, el
  autor es él. Nada se publica solo. Regeneraciones con tope (costo).

## 6. El sello y las certificaciones — el modelo

- **"Verificado"** = la cara visible del ciclo §14.2 que YA CORRE
  (identidad + credencial revisadas por admin). El arco construye la CARA;
  el back office existe.
- **"Certificado"** = capa futura propia (estándares e-PetPlace por
  oficio; sinergia natural con la infraestructura Satori de formación —
  doc propio si nace, patrón LOYALTY §11).
- Vocabulario preciso y NO intercambiable: verificado ≠ certificado ≠
  destacado. Cada palabra un significado, en las dos lenguas.

## 7. Monetización — el riel ético ANTES del primer precio

1. **Se cobra el PROCESO de verificación, jamás el RESULTADO.** Pagar no
   garantiza el sello; fallar la revisión no reembolsa la confianza. El
   día que el sello se pueda comprar, no vale nada — y el negocio de
   venderlo muere con él.
2. **Criterios del sello PÚBLICOS** (qué se revisa, qué otorga, qué lo
   revoca).
3. **El sello jamás toca urgencia ni recomendación clínica** (herencia
   P11/LOYALTY §7.6): en urgencia manda cercanía y disponibilidad — la
   presencia pesa en lo ELECTIVO y casi desaparece en urgencia.
4. **Si lo verificado pesa en ranking u orden, SE DECLARA.** Cero
   pay-to-win oculto.
5. **PRESTADORES FUNDADORES: gratis — y es estrategia, no descuento.** Un
   sello que nadie reconoce no se puede vender; la fase gratuita puebla el
   mercado de significado. Recién cuando el pet parent lo busca con los
   ojos, tiene precio. El corte de "fundador" lo firma el founder cuando
   abra el arco (candidato: todo negocio activo antes del lanzamiento
   público).
6. Todo precio entra a MODELO_FINANCIERO con fecha, como línea del modelo
   — jamás número suelto de UI.

## 8. Lo que este arco JAMÁS hace

Scores visibles del espejo · rankings entre prestadores expuestos al
propio prestador · badges coleccionables · urgencia distorsionada por
presencia · texto de IA publicado sin firma humana · perfil obligatorio
para operar (la presencia es palanca, no peaje).

## 9. Disparos (sin fecha, por diseño)

- **La FIRMA (①): viaja con S74** — misma superficie NEGOCIO que la
  ventana de equipo. No espera a nada.
- **El arco completo (②③): dispara con los primeros prestadores REALES
  onboardeados** — porque hoy se diseñaría la voz del prestador sin haber
  conocido a ninguno, y el v1 compuesto es honesto justamente porque no la
  adivina. Los primeros reales enseñan qué agregar.
- **La monetización: dispara cuando el sello haya ganado significado**
  (§7.5) — jamás antes.
- Letra fina de cada pieza: ciclo M1-M5 completo, vara cruzada, gate
  founder — como toda superficie de esta casa.

## Historial

- **v0 (S73, 21 Jul 2026):** semilla. Dictado founder (las tres piezas, la
  IA facilitadora, el sello, las dos fuentes de monetización, fundadores
  gratis) + mejoras de mesa (perfil compuesto por Ley 23, muro
  verificado/declarado, riel ético de monetización, la fase gratuita como
  fábrica de significado, disparos sin fecha).
