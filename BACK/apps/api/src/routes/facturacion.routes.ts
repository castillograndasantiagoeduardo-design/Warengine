import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import {
    buscarClientesController,
    registrarClienteController,
} from '../controllers/facturacion/cliente.controller.ts';

// imports (añadir)
import {
    abrirTurnoCajaController,
    obtenerTurnoActualController,
} from '../controllers/facturacion/turno-caja.controller.ts';

// constante (junto a PERMISO_CONSULTAR)
const PERMISO_FACTURAR = 'facturacion:facturar';

// Códigos tal como están en la tabla `permisos` (seed).
const PERMISO_CONSULTAR = 'facturacion:consultar';
const PERMISO_CLIENTES = 'facturacion:gestionar-clientes';

export function createFacturacionRoutes(container: AppContainer): Hono {
    const api = new Hono();

    // Directorio de clientes (RF-FMC-D1..D4)
    api.get('/clientes', authMiddleware(container, PERMISO_CONSULTAR), buscarClientesController(container));
    // Registro de cliente nuevo (RF-FMC-B4, B5, B7, D10)
    api.post('/clientes', authMiddleware(container, PERMISO_CLIENTES), registrarClienteController(container));
    api.post('/turnos', authMiddleware(container, PERMISO_FACTURAR), abrirTurnoCajaController(container));
    api.get('/turnos/actual', authMiddleware(container, PERMISO_FACTURAR), obtenerTurnoActualController(container));

    return api;
}