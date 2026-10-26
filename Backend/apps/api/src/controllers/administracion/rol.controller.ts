/**
 * rol.controller.ts
 *
 * Catálogo de roles para el selector de cambio de rol (RF-ADM-C7).
 * No recibe parámetros: no hay entrada que validar.
 */
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { safeHandler } from '../../utils/handler.ts';

export function listarRolesController(container: AppContainer) {
  return safeHandler(async (c) =>
    presentResult(c, await container.administracion.listarRoles.execute())
  );
}
