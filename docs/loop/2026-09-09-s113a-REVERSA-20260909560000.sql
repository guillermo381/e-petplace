-- REVERSA de 20260909560000_s113a_qr_en_papeles.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- QUÉ DESHACE: la columna `pasaporte_config.qr_en_papeles`.
--
-- QUÉ **NO** DESHACE, y hay que saberlo antes de correrla:
--   · Los PDF ya emitidos con el QR impreso. Un papel emitido no se revierte:
--     está impreso o descargado en algún lado. Revertir la columna hace que
--     los papeles NUEVOS salgan sin QR — jamás borra los viejos.
--   · La decisión de cada familia que APAGÓ el QR. Al soltar la columna se
--     pierde el `false` que alguien eligió a propósito, y si la columna vuelve
--     a nacer con `default true`, **el QR se le reenciende sin que lo pida**.
--     *Un default no es un dato: es lo que pasa cuando nadie decidió — y acá
--     ya habrán decidido.* Si hay filas en `false`, se listan antes de soltar.
--
-- ANTES DE CORRER, la lista de quienes lo apagaron:
--   select mascota_id from public.pasaporte_config where qr_en_papeles = false;

alter table public.pasaporte_config drop column if exists qr_en_papeles;
