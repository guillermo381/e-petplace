# F → A · **el motor de postventa no deja entrar a la casa** — lo medido, para que no lo re-midas

> ## 🔴 Si vas a copiar UNA frase de acá, que sea ésta
>
> **La casa tiene exactamente DOS transiciones y las dos SALEN de `con_casa`. No existe
> ninguna que la deje ENTRAR, y la escalada por vencimiento está declarada en el catálogo
> sin nadie que la dispare.**
>
> *Se verifica con las dos consultas del final (~3 s, sólo lectura).*

**8-sep-2026 · S114-F.** El founder no encontró dónde entra la casa cuando la familia y el
prestador no se ponen de acuerdo. **Medí antes de construir y frené: la pantalla habría
rebotado.** El motor es tuyo — esto es el piso medido.

---

## ① La bandeja del admin YA está bien — no hace falta tocarla

`obtenerBandejaCasos()` **no filtra por etapa**: trae lo que la RLS deje y ordena por
urgencia (`con_casa` → vencidos → abiertos → cerrados), con `plazoVencido` calculado por
fila. **Los `con_prestador` se ven.** *Lo que falta no es mirar: es poder hacer algo.*

---

## 🔴 ② La casa no puede TOMAR un caso — y no falta el botón, falta el permiso

```sql
-- caso_pedir_casa, cuerpo real
IF    v_c.familia_user_id = v_yo         THEN v_actor := 'familia';
ELSIF es_mi_prestador(v_c.prestador_id)  THEN v_actor := 'prestador';
ELSE  RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo');   -- ← un admin cae acá
```

Y el catálogo lo confirma — **`cat_transiciones_caso`, 17 filas, las de la casa son dos:**

```
con_casa      → resuelto     casa       ✅
con_casa      → sin_lugar    casa       ✅
con_prestador → con_casa     familia · prestador · sistema     🔴 'casa' NO ESTÁ
```

⇒ **Un botón «Tomar el caso» rebotaría con `transicion_inexistente`.**

⚠️ **Y hay un borde que conviene curar en el mismo acto:** `caso_resolver` **sí acepta al
admin** (`IF is_admin() THEN v_actor := 'casa'`) **y no exige etapa**. Así que sobre un
caso `con_prestador` calcula la plata entera —`_caso_tiene_devengo`, el camino del
reembolso— y **recién falla en `_caso_mover`**, con un código que no dice *«primero
tomalo»*. *Hace todo el trabajo y después no puede guardar.*

---

## 🔴 ③ El vencimiento no entra solo: motor sin puerta, en su forma exacta

```
cat_transiciones_caso   con_prestador → con_casa · actor 'sistema' · activo   ✅ declarada
crones cuyo COMANDO menciona caso/postventa/plazo                    0
triggers sobre casos                    2, los dos de `caso_clinico` (updated_at)
```

**La transición existe y nadie la ejecuta** — `L-318`.

*Nota de instrumento: el censo por NOMBRE de cron da dos falsos positivos
(`vencer-programas-adiestramiento`, `vencer-links-mensuales`) que no son de casos. **Hay
que censar por COMANDO**, y por comando son cero.*

---

## Cuándo se hace visible: mañana

```
82ff1424  con_prestador  duracion   vence 2026-09-09 15:27
83e5c976  con_prestador  calidad    vence 2026-09-09 20:10
```

**Hoy hay CERO vencidos sin escalar**, así que el hueco todavía no produjo daño. *Mañana
esos dos vencen y quedan en `con_prestador` para siempre* — **visibles en la bandeja,
marcados como vencidos, y sin que nadie pueda hacer nada con ellos.**

---

## El orden, y no es negociable

**Primero motor, después pantalla.** Al revés, el botón existe y rebota.

1. La transición `con_prestador → con_casa` para actor **`casa`**.
2. La puerta para que la casa entre — **firma del founder: son DOS PUERTAS**, «me llamaron»
   y «entré yo» se registran distinto. *(Hoy `caso_pedir_casa` escribe el mensaje
   «e-PetPlace tomó el caso» sin distinguir quién la llamó.)*
3. El **productor del vencimiento**: un cron que mueva los `con_prestador` con plazo
   vencido con el actor `sistema` **que ya está declarado**.
4. **Recién ahí**, el botón en la Hoja del caso — eso es mío y es media hora.

---

## Las dos consultas, para re-medir cuando quieras

```sql
-- ¿puede la casa entrar?
select desde, hasta, actor, activo from cat_transiciones_caso
where hasta = 'con_casa' order by actor;

-- ¿alguien dispara el vencimiento?
select jobname, command from cron.job
where command ilike '%caso%' or command ilike '%postventa%' or command ilike '%plazo%';
```

⚠️ **En `cat_transiciones_caso` las columnas son `desde`/`hasta`, NO `origen`/`destino`.**
*Con los nombres equivocados la consulta falla con un 400 que, leído rápido, se parece a
«cero transiciones».* Me pasó.
