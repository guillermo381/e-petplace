# S80-A15 · LA TAXONOMÍA DE CAPAS — mapa y huecos para la firma del founder

> **Propuesta de enmienda a `DIRECCION_ARTE` §2. NADA firmado, CERO hex
> elegido (L-139: los hex los elige el founder / la paleta de marca, no
> la mesa).** La ley que la ordena: **el CANTO dice CATEGORÍA (conjunto
> CERRADO) y el GLIFO dice SERVICIO (conjunto ABIERTO)** — el canto no
> puede crecer con cada servicio nuevo; el registry de glifos sí.

## 1. LO MEDIDO (antes de proponer)

**Los tokens de capa vivos: CUATRO, y son los únicos con los tres
registros completos** (`capa` gráfica · `capaText` AA · `capaBg` tint),
en los tres temas:

| Slot | Gráfico (los 3 temas) | AA claro | AA oscuro |
|---|---|---|---|
| `capa.identidad` | verdeVital | verdeVitalDark | verdeVital |
| `capa.cuidado` | teal | tealDark | teal |
| `capa.comunidad` | pink | pinkDark | pink |
| `capa.comunidadAmplia` | violet | violetDark | violetText |

**El ocre NO es capa** — vive en `status.warning`/`warningText`
(ochre/ochreDark). Tiene par AA, pero es del registro de ESTADO: usarlo
como capa lo pone a competir con "advertencia" (y es el corazón de
D-573, abajo).

**El registry de glifos ya tiene los servicios del destino**: `hotel`,
`guarderia`, `seguros`, `telemedicina`, `despensa`, `refugio`,
`training`, además de paseo/veterinaria/grooming. **La capa ABIERTA ya
existe y está poblada — lo que falta es la CERRADA.**

## 2. LA PROPUESTA — CUATRO categorías (el techo de 3px, respetado)

**El techo declarado por la mesa: un canto de 3px distingue 4-5 cosas.
La propuesta se queda en CUATRO, y usa los cuatro tokens que YA
existen con par AA en los tres temas — cero token nuevo, cero hex nuevo,
cero par WCAG nuevo.**

| Categoría (canto) | Qué agrupa — servicios del destino adentro | Token | ¿Hace falta algo? |
|---|---|---|---|
| **SALUD** | veterinaria · **telemedicina** · **seguros** (protección de vida) | `capa.identidad` (verdeVital) | **NO** — completo. Y ya hay precedente vivo: `services.insurance` y `services.wearable` usan verdeVitalDark |
| **CUIDADO** | paseo · grooming · adiestramiento · **hotel** · **guardería** | `capa.cuidado` (teal) | **NO** — completo. Es el grupo grande: todo lo que es *alguien cuida a tu mascota* |
| **COMUNIDAD** | **adopción** · refugios · donaciones · (el M0 de causas) | `capa.comunidad` (pink) | **NO** — completo. Precedente vivo: `services.adoption = pinkDark` |
| **CONSUMO** | **tienda/despensa** (JTBD-5: la compra es evento nutricional) | ⚠️ **HUECO** | **SÍ, EL ÚNICO** — hoy no hay token de capa para consumo. Candidatos con par AA ya existente: `terracotta/terracottaDark` (hogar/familia, con tint y borde en los 3 temas) o el `ochre/ochreDark` que §2 ya nombra "cuidado/consumo" — **pero el ocre arrastra D-573 y colisiona con `status.warning`** |

**Por qué NO son cinco ni seis:** las agrupaciones que la mesa podría
querer separar (hotel/guardería como "estadía"; seguros aparte de
salud) se probaron contra el techo y **desagregan de más**: estadía es
cuidado con cama, y seguro es protección de vida — el mismo verde que
`services.insurance` ya usa. **Si el founder los separa, el canto pasa a
6 y deja de distinguir: ahí la señal ya no es el color, y hay que
cambiar de mecanismo (no de paleta).**

**Lo que queda FUERA del canto por diseño (y es la mitad de la ley):**
`prime`, `carnet`, `vacaciones`, `equipo`, `caso`, `presupuesto`,
`hoy`, `negocio`… — no son categorías de servicio: son superficies y
objetos internos. El canto solo habla donde hay un servicio del
ecosistema detrás.

## 3. EL CRUCE CON D-573 (la enmienda toca los mismos nombres)

D-573 mide que **"cuidado" nombra el TEAL en el token y el OCRE en §2**.
Esta propuesta **la resuelve por el camino (a)** que D-573 ya nombra —
§2 pasa a llamar "cuidado" al teal, que es lo que el token dice desde
V0 y lo que 30 consumidores tipados ya consumen. **Una línea de doc, y
la ambigüedad muere.**

**Pero atención al efecto lateral, declarado:** si CONSUMO se resuelve
con el ocre, §2 tendría que decir "ocre = consumo" y **perder** la
palabra "cuidado" que hoy le da — o sea que la firma de esta taxonomía
y la resolución de D-573 **son el mismo acto, no dos**. Hacerlos por
separado reabre la colisión con otra ropa.

## 4. LO QUE LA FIRMA DEL FOUNDER TIENE QUE DECIDIR (tres preguntas)

1. **¿Las cuatro categorías son las correctas** (SALUD · CUIDADO ·
   COMUNIDAD · CONSUMO), con hotel/guardería dentro de CUIDADO y
   seguros dentro de SALUD?
2. **¿Con qué color habla CONSUMO?** — el único hueco real. Terracotta
   (libre, con par AA y tints en los 3 temas) · ocre (ya nombrado en §2,
   pero pisa `status.warning` y arrastra D-573) · un tono nuevo de la
   paleta de marca (exige par AA nuevo + gate WCAG).
3. **¿Se firma junto con D-573 (a)?** — el voto del arquitecto es SÍ:
   son el mismo acto (§3).

**Cuando la firma llegue:** el efecto en código es chico y medido — el
mapa oficio→capa del canto (`FilaCita` en packages/ui, S80-B12) gana
sus entradas nuevas, `DIRECCION_ARTE` §2 se enmienda con la tabla, y
solo si CONSUMO estrena token hay par WCAG nuevo que medir.
