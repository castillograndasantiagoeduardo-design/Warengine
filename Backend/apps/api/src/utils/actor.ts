import { Context } from 'hono';
import { ActorAuditoria } from '@warengine/core';
import { obtenerIdentidad } from './identidad.ts';
import { obtenerIp } from './ip.ts';

/** Quién ejecuta la operación y desde qué IP, para el log de auditoría y visibilidad. */
export function obtenerActor(c: Context): ActorAuditoria {
  const identidad = obtenerIdentidad(c);
  return {
    usuarioId: identidad.usuarioId,
    ip: obtenerIp(c),
    permisos: identidad.permisos,
  };
}