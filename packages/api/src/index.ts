// @epetplace/api — puerta única a Supabase: tipos generados + wrappers tipados.
// Regla: ningún app hace supabase.from()/rpc() directo — siempre a través de wrappers de este paquete.

export type { Database, Json } from './database.types';
export { initApi, getClient, type EpetplaceClient } from './client';
export type { ResultadoWrapper } from './resultado';
export { agregarNotaAtencion, type InputAgregarNota, type CodigoErrorAtencion } from './wrappers/atencion';
