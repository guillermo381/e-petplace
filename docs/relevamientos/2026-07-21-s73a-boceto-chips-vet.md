# S73-A · M1 — BOCETO: la composición del QUÉ vet (hallazgo 2 del founder)

> **Estado: BOCETO — espera gate founder sobre las capturas.** Origen: el
> founder tras la cura del ítem 12: *"se ven los cinco pero de tamaños
> distintos, unos debajo de otros, se ve feo"* — la grilla resolvió la
> VISIBILIDAD y falló la COMPOSICIÓN. Captura:
> `scripts/capturas/s73-a-boceto-chips-vet-variantes.png` (3 variantes ×
> claro/oscuro, con las 5 voces REALES — incluida la más larga,
> "Consulta especializada", que es el fallback D-472).

## Las tres variantes (riesgo declarado por variante, §6b.3)

**A · Grilla actual (intrínseca)** — la referencia. Chips de ancho según
su texto, envueltos. **Riesgo: es la que el gate ya rechazó** — anchos
desiguales producen un contorno dentado; con 5 ítems quedan filas de 2+2+1
de tamaños dispares.

**B · DOS COLUMNAS uniformes** (48% cada chip, la 5ª cierra a lo ancho;
`minHeight 44`, texto centrado). Compacta (3 filas), pareja, barrido
vertical claro. **Riesgos:** (1) si mañana una etiqueta necesita 2 líneas,
las alturas vuelven a desigualarse salvo que el minHeight las contenga —
"Consulta especializada" HOY entra en una línea a 48% de 388px, medido en
la captura; (2) la 5ª a lo ancho puede leerse como jerarquía ("la
importante") sin serlo; (3) lectura en zigzag (izq-der-izq) para comparar
opciones.

**C · LISTA de filas** (una por tipo, ancho completo, texto a la
izquierda). Máxima legibilidad, cero desigualdad posible, escala a
cualquier largo de etiqueta. **Riesgos:** (1) ~5×52px = empuja día/hora
~150px más abajo (el fold del CUÁNDO); (2) una pila de filas full-width
puede leerse como lista de NAVEGACIÓN — mitigado porque no lleva chevron
(19.7: sin chevron = ejecuta) y la selección tonal la distingue; (3) es
una `disposicion` NUEVA de `SelectorOpcion` (enmienda a packages/ui, Ley
11 — B también la necesitaría si el prestador la quiere).

## Voto del boceto (una sola propuesta es una corazonada — van dos)

**B primero, C si el founder prioriza legibilidad sobre fold.** B es la
menor distancia desde lo vivo (misma grilla, ancho fijado) y no empuja el
fold; C es la más robusta a futuro (etiquetas largas del catálogo libre).
Ambas exigen enmienda de `SelectorOpcion` (B: `disposicion="grilla"` gana
ancho uniforme opcional · C: `disposicion="lista"` nueva) — cero
componente nuevo, enmienda de prop en packages/ui (territorio A).

## Vara (§6b.4)

Se juzga en vecindad con las etiquetas reales más largas, claro y oscuro
— la captura las monta así. La decisión es del founder sobre los píxeles.
