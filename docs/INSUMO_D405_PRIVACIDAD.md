# INSUMO_D405_PRIVACIDAD.md — e-PetPlace

> **Nace:** 21-ago-2026, mesa 103 · **Destino:** D-405 (la sesión de LEGALES:
> T&C completos · política de privacidad · aviso de IA · P20 custodia).
> **Qué es:** el contraste entre lo que una política de privacidad LOPDP-conforme
> debe prometer y lo que el censo CT de S102 (Pista B, 21-ago) midió que el
> sistema hoy hace. **Qué no es:** una política. Este documento no promete nada
> a nadie y no se publica — es la tarea pre-legal para que, cuando D-405 redacte
> con abogado, el sistema pueda honrar cada promesa.
>
> **Referencia de mercado consultada:** política de privacidad de un competidor
> directo en Quito (mayo 2025), aportada por el founder. **De ella no se copia
> una línea** — su valor es confirmar el esqueleto que la LOPDP exige, y ese
> esqueleto es ley, no propiedad de nadie. Estar publicada no acredita
> cumplimiento: es referencia, jamás plantilla.
>
> **Regla de precedencia:** si este insumo contradice al repo, a POLITICAS o a
> los relevamientos de S102, gana la fuente.

---

## §1 · EL ESQUELETO QUE LA LOPDP EXIGE (lo que nuestra política tendrá que contener)

1. **Responsable del tratamiento** — dato ya existente: SATORI INOV LATAM
   S.A.S., RUC 1793240435001, Quito (constituida 14-ago-2026).
2. **Canales para ejercer derechos del titular** — información · acceso ·
   rectificación · eliminación · oposición · portabilidad · suspensión ·
   no ser objeto de decisiones automatizadas.
3. **Categorías de datos tratados** — del dueño, de la mascota, de pagos, de
   uso, del prestador/vendedor, técnicos.
4. **Finalidades y bases legales** por tratamiento.
5. **Transferencias** — a prestadores/vendedores para el servicio, a
   proveedores (pagos, hosting, correo, analítica), a autoridad competente.
6. **Conservación** — plazos y criterios.
7. **Modificaciones** — cómo se notifican.

## §2 · LAS BRECHAS MEDIDAS (promesa exigible → lo que el censo dice hoy)

| # | La política tendrá que poder decir | Estado medido (censo CT, S102) | Dueño de la cura |
|---|---|---|---|
| 1 | «Puede solicitar la eliminación de sus datos» | **P15 es CANDIDATA sin firma**; la UI muestra «Eliminar cuenta» y no ejecuta. La regla 7.8 (la plata no se borra: se anonimiza la referencia personal) es compatible con la excepción legal por obligación — pero debe DECLARARSE en la política, no descubrirse | P15 (firma founder) + espec |
| 2 | «Conservamos sus datos solo el tiempo necesario» | **Cero purga en todo el sistema** (14 crons, ninguno purga). Datos de pago (holder_name · email · bin · últimos4 · vencimiento) sin plazo alguno | Letra v3.0 §retención + plazos CON abogado (D-405) — cero plazos inventados |
| 3 | «Puede solicitar copia/portabilidad de sus datos» | Exportación propuesta dentro de P15, no construida | P15 / D-405 |
| 4 | «No es objeto de decisiones automatizadas sin su conocimiento» | La plataforma usa IA (lectura de carnets, coach, etc.). El **aviso de IA ya es alcance declarado de D-405** | D-405 |
| 5 | «Sus datos se comparten con el procesador de pagos» | El censo CT ya mapea qué viaja a Nuvei (holder_name, email, tarjeta tokenizada — el PAN jamás nos toca, verificado). La decisión founder 21-ago (migración a Stripe a ~1000 usuarios) implica que la lista de encargados será VIVA — la política debe nombrar el mecanismo de actualización | D-405, con el mapa del censo CT como anexo |
| 6 | «Medidas técnicas y organizativas adecuadas» | Dos contradicciones medidas, **con cura ya preparada sin aplicar** (Pista B): `v_ranking_usuarios` expuesta a anónimos (57/165 nombres son correos sin dominio) · RLS de `pagos_intentos` atrás del ensanche | Pista B — firma de aplicación pendiente |
| 7 | «El comprobante de pago se envía al titular del pago» | Medido: el de cita va al user de la MASCOTA, no a quien pagó. Dictamen de mesa ya emitido (LETRA_SALDO §2): va a quien pagó; cura en cola de B | Pista B |
| 8 | «Datos de menores» | P5 rige (eventos aportados por menores no acumulan); la política lo declara | D-405 transpone |
| 9 | Canal de contacto de privacidad | No existe buzón dedicado. Barato sobre la infra viva de Resend (patrón hola@) — el nombre y su existencia son decisión de D-405 | D-405 |

## §3 · LO QUE ESTE INSUMO NO HACE

No redacta política ni T&C · no fija plazos de retención (abogado + firma) ·
no promete nada a usuarios · no se publica · no convierte la referencia de
mercado en plantilla. Las curas técnicas (§2 filas 6-7) corren por su carril
en S102 con sus firmas — no esperan a D-405.

---

*Depositado por orden de mesa para que D-405 arranque con el sistema ya
medido: una política se redacta una vez; un sistema que no puede cumplirla
se audita para siempre.*
