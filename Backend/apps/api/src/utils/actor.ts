import { Context } from 'hono';
import { ActorAuditoria } from '@warengine/core';
import { obtenerIdentidad } from './identidad.ts';
import { obtenerIp } from './ip.ts';

/** Quién ejecuta la operación y desde qué IP, para el log de auditoría. */
export function obtenerActor(c: Context): ActorAuditoria {
  return { usuarioId: obtenerIdentidad(c).usuarioId, ip: obtenerIp(c) };
}